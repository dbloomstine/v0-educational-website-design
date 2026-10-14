import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { verifySvixSignature } from '@/lib/resend/webhook-signature'
import { handleWebhook, type MsgRef, type WebhookDeps, type WebhookPayload } from '@/lib/outreach-v2/inbound'
import { sendToDanny } from '@/lib/outreach-v2/send'
import { setHalt, suppress } from '@/lib/outreach-v2/store'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Resend webhook for outreach v2 (its own webhook and signing secret,
 * OUTREACH_RESEND_WEBHOOK_SECRET): replies to reply.fundopshq.com, and
 * bounces and complaints on our messages. The rules are in
 * lib/outreach-v2/inbound.ts. Everything in a reply is untrusted: stored and
 * forwarded, never followed.
 */

const REF_COLUMNS = 'id, parent_id, email, company, program, subject'

function deps(): WebhookDeps {
  const db = getSupabaseAdmin()
  const one = async (q: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<MsgRef | null> => {
    const { data, error } = await q
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as MsgRef[]
    return rows[0] ?? null
  }
  return {
    async fetchReceived(emailId) {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return { text: null, html: null, headers: null, messageId: null, error: 'RESEND_API_KEY not configured' }
      try {
        const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, { headers: { Authorization: `Bearer ${apiKey}` } })
        if (!res.ok) return { text: null, html: null, headers: null, messageId: null, error: `retrieve failed: HTTP ${res.status}` }
        const b = (await res.json()) as { text?: string | null; html?: string | null; headers?: Record<string, unknown> | null; message_id?: string | null }
        return { text: b.text ?? null, html: b.html ?? null, headers: b.headers ?? null, messageId: b.message_id ?? null, error: null }
      } catch (err) {
        return { text: null, html: null, headers: null, messageId: null, error: err instanceof Error ? err.message : 'retrieve threw' }
      }
    },
    findByMessageIds: (ids) => one(db.from('outreach_v2_messages').select(REF_COLUMNS).in('message_id_header', ids).limit(1)),
    findLatestSentTo: (email) => one(db.from('outreach_v2_messages').select(REF_COLUMNS).eq('email', email).eq('status', 'sent').order('sent_at', { ascending: false }).limit(1)),
    findByResendId: (resendId) => one(db.from('outreach_v2_messages').select(REF_COLUMNS).eq('resend_id', resendId).limit(1)),
    async storeReply(row) {
      const { data, error } = await db.from('outreach_v2_replies').upsert(row, { onConflict: 'resend_email_id', ignoreDuplicates: true }).select('id')
      if (error) throw new Error(error.message)
      return { inserted: (data ?? []).length > 0, id: (data ?? [])[0]?.id ?? null }
    },
    async markReplied(msg, at) {
      const root = msg.parent_id ?? msg.id
      await db.from('outreach_v2_messages').update({ replied_at: at }).in('id', [msg.id, root]).is('replied_at', null)
      // A reply closes the thread: a follow-up still waiting never goes.
      await db.from('outreach_v2_messages').update({ status: 'cancelled', skip_reason: 'replied' }).eq('parent_id', root).eq('status', 'queued')
    },
    async markForwarded(replyId, error) {
      await db.from('outreach_v2_replies').update(error ? { forward_error: error } : { forwarded_at: new Date().toISOString() }).eq('id', replyId)
    },
    async recordEvent(row) {
      const { data, error } = await db.from('outreach_v2_events').upsert(row, { onConflict: 'resend_email_id,type', ignoreDuplicates: true }).select('id')
      if (error) throw new Error(error.message)
      return (data ?? []).length > 0
    },
    async markMessage(id, fields) {
      const { error } = await db.from('outreach_v2_messages').update(fields).eq('id', id)
      if (error) throw new Error(error.message)
    },
    async suppress(email, reason, messageId) {
      await suppress(db, email, reason, messageId)
      if (reason === 'unsubscribed' || reason === 'asked_to_stop') {
        await db.from('outreach_v2_messages').update({ unsubscribed_at: new Date().toISOString() }).eq('email', email.toLowerCase()).eq('status', 'sent').is('unsubscribed_at', null)
      }
    },
    halt: (reason) => setHalt(db, reason),
    async sendToDanny(to, subject, text, replyTo) {
      await sendToDanny(to, subject, text, replyTo)
    },
  }
}

export async function POST(req: Request) {
  const secret = process.env.OUTREACH_RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'OUTREACH_RESEND_WEBHOOK_SECRET not configured' }, { status: 500 })

  const rawBody = await req.text()
  const verified = verifySvixSignature(rawBody, req.headers, secret)
  if (!verified.ok) return NextResponse.json({ error: `Invalid signature: ${verified.reason}` }, { status: 401 })

  let payload: WebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const result = await handleWebhook(payload, deps())
    return NextResponse.json(result.body, { status: result.status })
  } catch (err) {
    // Non-2xx makes Resend retry, which is what we want on a database blip.
    return NextResponse.json({ error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}
