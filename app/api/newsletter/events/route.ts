import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { verifySvixSignature } from '@/lib/resend/webhook-signature'
import { parseResendEvent } from '@/lib/newsletter/engagement-events'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Resend webhook for engagement (2026-10-16): email.delivered, email.opened
 * and email.clicked for every message the account sends. Its own webhook and
 * signing secret (NEWSLETTER_RESEND_WEBHOOK_SECRET). An event for an outreach
 * message (outreach_v2_messages.resend_id) is kept in outreach_v2_events, as
 * the bounce webhook keeps bounces; any other is the daily email's and is kept
 * in newsletter_events with its edition, for the human click count
 * (lib/newsletter/engagement-events.ts). Nothing here is acted on: it is
 * counted later, by the daily job and the Monday scorecard.
 */
export async function POST(req: Request) {
  const secret = process.env.NEWSLETTER_RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'NEWSLETTER_RESEND_WEBHOOK_SECRET not configured' }, { status: 500 })

  const rawBody = await req.text()
  const verified = verifySvixSignature(rawBody, req.headers, secret)
  if (!verified.ok) return NextResponse.json({ error: `Invalid signature: ${verified.reason}` }, { status: 401 })

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const event = parseResendEvent(payload)
  if (!event) return NextResponse.json({ ok: true, ignored: (payload as { type?: string })?.type ?? 'unknown' })

  const db = getSupabaseAdmin()
  const data = (payload as { data?: unknown }).data ?? null
  try {
    // Outreach mail first: one row per message and type (the first open, the first click).
    const { data: outreach, error: oErr } = await db.from('outreach_v2_messages').select('id, email').eq('resend_id', event.emailId).limit(1)
    if (oErr) throw new Error(oErr.message)
    if (outreach?.length) {
      const msg = outreach[0] as { id: string; email: string }
      const { error } = await db
        .from('outreach_v2_events')
        .upsert({ resend_email_id: event.emailId, type: `email.${event.type}`, message_id: msg.id, email: msg.email, payload: data }, { onConflict: 'resend_email_id,type', ignoreDuplicates: true })
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, outreach: msg.id, type: event.type })
    }

    // The daily email: every event, with the edition it belongs to when the recipient is known.
    let editionId: string | null = null
    if (event.email) {
      const { data: editions } = await db
        .from('newsletter_editions')
        .select('id')
        .contains('resend_email_ids', { [event.email]: event.emailId })
        .gte('sent_at', new Date(Date.now() - 40 * 86_400_000).toISOString())
        .limit(1)
      editionId = (editions?.[0] as { id: string } | undefined)?.id ?? null
    }
    const { data: stored, error } = await db
      .from('newsletter_events')
      .upsert(
        { resend_email_id: event.emailId, type: event.type, email: event.email, edition_id: editionId, occurred_at: event.occurredAt, link: event.link, user_agent: event.userAgent, payload: data },
        { onConflict: 'resend_email_id,type,occurred_at', ignoreDuplicates: true },
      )
      .select('id')
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, stored: (stored ?? []).length > 0, edition: editionId, type: event.type })
  } catch (err) {
    // Non-2xx makes Resend retry, which is what we want on a database blip.
    return NextResponse.json({ error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}
