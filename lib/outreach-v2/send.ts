/**
 * Sending and dispatching outreach v2 email through Resend. Server only.
 *
 * One email per dispatcher tick (the cron runs every five minutes in New York
 * business hours), so a batch goes out paced about five minutes apart and the
 * daily cap is checked before every send.
 */
import { FROM, REPLY_TO, SENDER_EMAIL, nyDay } from './config'
import { listUnsubscribeHeaders } from './compose'
import { remainingSendsToday, screenEmails, effectiveMode, type DbClient, type MessageRow } from './store'

export interface ResendPayload {
  from: string
  to: string[]
  reply_to: string
  subject: string
  text: string
  headers: Record<string, string>
  tags: { name: string; value: string }[]
}

/**
 * What goes to Resend for one message: plain text only (no tracking can be added to it), with the unsubscribe headers.
 * No Message-ID of our own: Resend's mail server replaces it (seen 2026-10-14). The real one is read back from Resend
 * after sending (backfillMessageIds) and is what a reply's In-Reply-To carries.
 */
export function buildPayload(row: Pick<MessageRow, 'id' | 'email' | 'subject' | 'body_text' | 'unsub_token' | 'program' | 'kind'>, parentMessageId?: string | null): ResendPayload {
  const headers: Record<string, string> = { ...listUnsubscribeHeaders(row.unsub_token) }
  if (parentMessageId) {
    headers['In-Reply-To'] = parentMessageId
    headers['References'] = parentMessageId
  }
  return {
    from: FROM,
    to: [row.email],
    reply_to: REPLY_TO,
    subject: row.subject,
    text: row.body_text,
    headers,
    tags: [
      { name: 'program', value: row.program },
      { name: 'kind', value: row.kind },
    ],
  }
}

export async function resendSend(payload: object, idempotencyKey: string, apiKey: string | undefined = process.env.RESEND_API_KEY): Promise<{ id: string }> {
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`)
  const id = (JSON.parse(body) as { id?: string }).id
  if (!id) throw new Error('Resend returned no id')
  return { id }
}

/**
 * The Message-ID each sent message really went out with (Resend reports it a moment after sending), stored so a
 * reply's In-Reply-To finds its message and a follow-up threads under its pitch.
 */
export async function backfillMessageIds(db: DbClient, limit = 5, apiKey: string | undefined = process.env.RESEND_API_KEY): Promise<number> {
  if (!apiKey) return 0
  const { data } = await db
    .from('outreach_v2_messages')
    .select('id, resend_id')
    .eq('status', 'sent')
    .is('message_id_header', null)
    .not('resend_id', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(limit)
  let n = 0
  for (const r of data ?? []) {
    try {
      const res = await fetch(`https://api.resend.com/emails/${encodeURIComponent(String(r.resend_id))}`, { headers: { Authorization: `Bearer ${apiKey}` } })
      if (!res.ok) continue
      const mid = ((await res.json()) as { message_id?: string | null }).message_id
      if (mid && /^<[^<>\s]+>$/.test(mid)) {
        await db.from('outreach_v2_messages').update({ message_id_header: mid }).eq('id', r.id)
        n++
      }
    } catch {
      // next tick
    }
  }
  return n
}

/** A plain note to Danny (alerts, forwarded replies). Never to anyone else. */
export async function sendToDanny(to: string, subject: string, text: string, replyTo?: string): Promise<string> {
  const { id } = await resendSend(
    { from: `FundOpsHQ outreach <${SENDER_EMAIL}>`, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) },
    `danny-${subject.slice(0, 60)}-${Date.now()}`.replace(/[^\w-]/g, '_'),
  )
  return id
}

/** Sending happens on weekdays, 9:00 to 17:59 New York time. */
export function inSendingHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', hour12: false }).formatToParts(now)
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? ''
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24
  return !['Sat', 'Sun'].includes(wd) && hour >= 9 && hour < 18
}

export interface DispatchResult {
  ok: boolean
  skipped?: string
  sent?: { id: string; email: string; program: string; resendId: string }
  passedOver?: { id: string; reason: string }[]
  error?: string
}

/**
 * Send the next queued message, if the mode, the hour and the daily cap all
 * allow it. Today's news notes go first (they are about today); then pitches
 * and follow-ups, oldest first. Every do-not-contact check runs again here,
 * at the moment of sending.
 */
export async function dispatchOne(db: DbClient, now: Date = new Date(), opts: { ignoreHours?: boolean } = {}): Promise<DispatchResult> {
  const { mode, halted } = await effectiveMode(db)
  if (mode !== 'live') return { ok: true, skipped: halted ? `halted: ${halted.halted_reason}` : `mode ${mode}` }
  await backfillMessageIds(db)
  if (!opts.ignoreHours && !inSendingHours(now)) return { ok: true, skipped: 'outside sending hours' }
  if ((await remainingSendsToday(db, now)) <= 0) return { ok: true, skipped: 'daily cap reached' }

  // A news note is about today's edition: one that did not go out today never goes.
  const todayBatch = `news-${nyDay(now)}`
  await db.from('outreach_v2_messages').update({ status: 'cancelled', skip_reason: 'stale news note' }).eq('program', 'news_note').eq('status', 'queued').neq('batch', todayBatch)

  const { data, error } = await db
    .from('outreach_v2_messages')
    .select('*')
    .eq('status', 'queued')
    .order('program', { ascending: true }) // 'news_note' sorts before 'sponsor_pitch': news notes first
    .order('queued_at', { ascending: true })
    .limit(10)
  if (error) return { ok: false, error: error.message }
  const queue = (data ?? []) as MessageRow[]
  if (!queue.length) return { ok: true, skipped: 'queue empty' }

  const passedOver: { id: string; reason: string }[] = []
  for (const row of queue) {
    // Claim it, so an overlapping tick cannot send it too.
    const { data: claimed } = await db.from('outreach_v2_messages').update({ status: 'sending' }).eq('id', row.id).eq('status', 'queued').select('id')
    if (!claimed?.length) continue

    let parentMessageId: string | null = null
    const root = row.parent_id ?? row.id
    if (row.parent_id) {
      const { data: parent } = await db.from('outreach_v2_messages').select('message_id_header, replied_at, unsubscribed_at, bounced_at, complained_at').eq('id', row.parent_id).maybeSingle()
      if (!parent || parent.replied_at || parent.unsubscribed_at || parent.bounced_at || parent.complained_at) {
        await db.from('outreach_v2_messages').update({ status: 'cancelled', skip_reason: 'thread closed' }).eq('id', row.id)
        passedOver.push({ id: row.id, reason: 'thread closed' })
        continue
      }
      parentMessageId = parent.message_id_header ?? null
    }

    const reasons = await screenEmails(db, [row.email], { program: row.program, threadRootId: root, now })
    const reason = reasons.get(row.email.toLowerCase())
    if (reason) {
      await db.from('outreach_v2_messages').update({ status: 'skipped', skip_reason: reason }).eq('id', row.id)
      passedOver.push({ id: row.id, reason })
      continue
    }

    const payload = buildPayload(row, parentMessageId)
    try {
      const { id: resendId } = await resendSend(payload, `outreach-v2-${row.id}`)
      await db
        .from('outreach_v2_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString(), resend_id: resendId, error: null })
        .eq('id', row.id)
      return { ok: true, sent: { id: row.id, email: row.email, program: row.program, resendId }, passedOver }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await db.from('outreach_v2_messages').update({ status: 'failed', error: message }).eq('id', row.id)
      return { ok: false, error: message, passedOver }
    }
  }
  return { ok: true, skipped: 'nothing sendable', passedOver }
}
