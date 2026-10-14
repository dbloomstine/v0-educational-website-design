/**
 * What happens when Resend tells us something about outreach v2 mail:
 *
 *  - email.received on reply.fundopshq.com: a reply. Stored (UNTRUSTED: kept
 *    and forwarded, never acted on as instructions), linked to the message it
 *    answers, the thread marked replied (no follow-up), and a copy forwarded
 *    to Danny's Gmail with the original sender and text. Mail to
 *    unsubscribe@ (the List-Unsubscribe mailto) or a reply that opens with
 *    "unsubscribe" / "stop" / "remove me" also suppresses the sender.
 *  - email.bounced for one of our messages: the address is suppressed.
 *  - email.complained for one of our messages: the address is suppressed, the
 *    whole program is halted (every send stops until a person clears the flag)
 *    and Danny is told by email.
 *
 * Written against a small set of ports (WebhookDeps) so the rules can be
 * tested without a database; app/api/outreach/webhook/route.ts supplies them.
 */
import { FORWARD_TO, ALERT_TO, UNSUBSCRIBE_MAILBOX, bareAddress, isOutreachReplyAddress } from './config'

export interface MsgRef {
  id: string
  parent_id: string | null
  email: string
  company: string
  program: string
  subject: string
}

export interface ReceivedEmail {
  text: string | null
  html: string | null
  headers: Record<string, unknown> | null
  messageId: string | null
  error: string | null
}

export interface WebhookPayload {
  type?: string
  created_at?: string
  data?: {
    email_id?: string
    created_at?: string
    from?: string
    to?: string[] | string
    received_for?: string[]
    subject?: string
    bounce?: { type?: string; subType?: string; message?: string }
    [k: string]: unknown
  }
}

export interface ReplyRow {
  resend_email_id: string
  message_id: string | null
  match_method: string | null
  from_address: string
  to_addresses: string[]
  subject: string | null
  body_text: string | null
  body_html: string | null
  headers: Record<string, unknown> | null
  rfc_message_id: string | null
  in_reply_to: string | null
  unsubscribe_intent: boolean
  received_at: string
  fetch_error: string | null
}

export interface WebhookDeps {
  fetchReceived(emailId: string): Promise<ReceivedEmail>
  findByMessageIds(ids: string[]): Promise<MsgRef | null>
  findLatestSentTo(email: string): Promise<MsgRef | null>
  findByResendId(resendId: string): Promise<MsgRef | null>
  /** False when this Resend email id was stored before (Resend retries). */
  storeReply(row: ReplyRow): Promise<{ inserted: boolean; id: string | null }>
  markReplied(msg: MsgRef, at: string): Promise<void>
  markForwarded(replyId: string, error: string | null): Promise<void>
  /** False when this event was recorded before. */
  recordEvent(row: { resend_email_id: string; type: string; message_id: string | null; email: string | null; payload: unknown }): Promise<boolean>
  markMessage(id: string, fields: Record<string, string>): Promise<void>
  suppress(email: string, reason: 'unsubscribed' | 'bounced' | 'complained' | 'asked_to_stop', messageId: string | null): Promise<void>
  halt(reason: string): Promise<void>
  sendToDanny(to: string, subject: string, text: string, replyTo?: string): Promise<void>
}

/** A header from Resend's `headers` object, whatever its case; arrays joined. */
export function headerValue(headers: Record<string, unknown> | null | undefined, name: string): string | null {
  if (!headers) return null
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
  if (!key) return null
  const v = headers[key]
  if (Array.isArray(v)) return v.map(String).join(' ')
  return v == null ? null : String(v)
}

/** Every <message-id> in an In-Reply-To or References header. */
export function messageIdsIn(value: string | null | undefined): string[] {
  return [...(value ?? '').matchAll(/<[^<>\s]+>/g)].map((m) => m[0])
}

/** The reply, without the quoted email under it: what the person wrote. */
export function ownWords(text: string | null | undefined): string {
  const lines = (text ?? '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (const l of lines) {
    if (/^\s*>/.test(l)) break
    if (/^On .+wrote:\s*$/.test(l.trim())) break
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(l.trim())) break
    if (/^From:\s/.test(l.trim()) && out.length > 0) break
    out.push(l)
  }
  return out.join('\n').trim()
}

/** "Unsubscribe", "stop", "remove me": the person's own words open with a request to stop. */
export function asksToStop(text: string | null | undefined): boolean {
  const own = ownWords(text).slice(0, 200).toLowerCase()
  return /^\W*(?:please\s+)?(?:unsubscribe|stop|remove(?:\s+me)?|opt[\s-]?out|take me off|no more emails?)\b/.test(own)
}

/** HTML down to readable text, for a reply that came without a text part. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Which of our messages a reply answers: by its threading headers first, then by who sent it. */
export async function matchReply(
  deps: Pick<WebhookDeps, 'findByMessageIds' | 'findLatestSentTo'>,
  input: { inReplyTo: string | null; references: string | null; from: string },
): Promise<{ msg: MsgRef | null; method: string | null }> {
  const ids = [...messageIdsIn(input.inReplyTo), ...messageIdsIn(input.references)]
  if (ids.length) {
    const msg = await deps.findByMessageIds([...new Set(ids)])
    if (msg) return { msg, method: 'in_reply_to' }
  }
  const from = bareAddress(input.from)
  if (from) {
    const msg = await deps.findLatestSentTo(from)
    if (msg) return { msg, method: 'sender' }
  }
  return { msg: null, method: null }
}

const asList = (v: string[] | string | undefined) => (Array.isArray(v) ? v : v ? [v] : [])

export function forwardMessage(r: { from: string; to: string[]; subject: string | null; receivedAt: string; text: string; matched: MsgRef | null; stopped: boolean }): { subject: string; text: string } {
  const about = r.matched ? `${r.matched.company} (${r.matched.program === 'news_note' ? 'news note' : 'sponsor pitch'}, "${r.matched.subject}")` : 'no outreach message matched'
  const head = [
    `Reply received on the outreach address. Reply to this email to answer ${bareAddress(r.from)} from Gmail.`,
    `From: ${r.from}`,
    `To: ${r.to.join(', ')}`,
    `Date: ${r.receivedAt}`,
    `Subject: ${r.subject ?? '(none)'}`,
    `About: ${about}`,
    r.stopped ? 'They asked to stop: the address is now suppressed for all outreach.' : null,
    '',
    '-----',
    '',
  ].filter((l) => l !== null)
  const body = r.text.length > 20000 ? `${r.text.slice(0, 20000)}\n\n[cut at 20,000 characters; the whole message is in outreach_v2_replies]` : r.text
  return { subject: `Outreach reply from ${bareAddress(r.from)}: ${r.subject ?? '(no subject)'}`.slice(0, 200), text: `${head.join('\n')}${body || '(empty message)'}` }
}

export interface HandleResult {
  status: number
  body: Record<string, unknown>
}

export async function handleWebhook(payload: WebhookPayload, deps: WebhookDeps): Promise<HandleResult> {
  const data = payload.data ?? {}
  const emailId = data.email_id
  if (!emailId) return { status: 400, body: { error: 'Missing data.email_id' } }

  switch (payload.type) {
    case 'email.received':
      return handleReceived(emailId, data, deps)
    case 'email.bounced':
    case 'email.complained':
      return handleBounceOrComplaint(payload.type, emailId, data, deps)
    default:
      return { status: 200, body: { ok: true, ignored: payload.type ?? 'unknown' } }
  }
}

async function handleReceived(emailId: string, data: NonNullable<WebhookPayload['data']>, deps: WebhookDeps): Promise<HandleResult> {
  const to = [...asList(data.to), ...(data.received_for ?? [])]
  // Resend sends every inbound message on the account to every listener; ours is the reply subdomain only.
  if (!to.some((a) => isOutreachReplyAddress(a))) return { status: 200, body: { ok: true, ignored: 'not for the reply domain' } }

  const from = data.from ?? ''
  const got = await deps.fetchReceived(emailId)
  const text = got.text ?? (got.html ? htmlToText(got.html) : '')
  const inReplyTo = headerValue(got.headers, 'in-reply-to')
  const references = headerValue(got.headers, 'references')
  const { msg, method } = await matchReply(deps, { inReplyTo, references, from })
  const toUnsubscribe = to.some((a) => bareAddress(a) === UNSUBSCRIBE_MAILBOX)
  const stop = toUnsubscribe || asksToStop(text)
  const receivedAt = data.created_at ?? new Date().toISOString()

  const stored = await deps.storeReply({
    resend_email_id: emailId,
    message_id: msg?.id ?? null,
    match_method: method,
    from_address: bareAddress(from),
    to_addresses: [...new Set(to.map(bareAddress))],
    subject: data.subject ?? null,
    body_text: got.text,
    body_html: got.html,
    headers: got.headers,
    rfc_message_id: got.messageId,
    in_reply_to: inReplyTo,
    unsubscribe_intent: stop,
    received_at: receivedAt,
    fetch_error: got.error,
  })
  if (!stored.inserted) return { status: 200, body: { ok: true, duplicate: emailId } }

  if (msg) await deps.markReplied(msg, receivedAt)
  const sender = bareAddress(from)
  if (stop && sender) await deps.suppress(sender, toUnsubscribe ? 'unsubscribed' : 'asked_to_stop', msg?.id ?? null)

  let forwardError: string | null = null
  try {
    const f = forwardMessage({ from, to, subject: data.subject ?? null, receivedAt, text, matched: msg, stopped: stop })
    await deps.sendToDanny(FORWARD_TO, f.subject, f.text, sender || undefined)
  } catch (err) {
    forwardError = err instanceof Error ? err.message : String(err)
  }
  if (stored.id) await deps.markForwarded(stored.id, forwardError)
  return { status: 200, body: { ok: true, stored: emailId, matched: msg?.id ?? null, method, stop, forwarded: !forwardError } }
}

async function handleBounceOrComplaint(type: 'email.bounced' | 'email.complained', emailId: string, data: NonNullable<WebhookPayload['data']>, deps: WebhookDeps): Promise<HandleResult> {
  const msg = await deps.findByResendId(emailId)
  // The newsletter's own bounces and complaints come here too; they are not ours to act on.
  if (!msg) return { status: 200, body: { ok: true, ignored: `${type} for a message that is not outreach` } }

  const fresh = await deps.recordEvent({ resend_email_id: emailId, type, message_id: msg.id, email: msg.email, payload: data })
  if (!fresh) return { status: 200, body: { ok: true, duplicate: `${type} ${emailId}` } }
  const at = data.created_at ?? new Date().toISOString()

  if (type === 'email.bounced') {
    await deps.markMessage(msg.id, { bounced_at: at })
    await deps.suppress(msg.email, 'bounced', msg.id)
    return { status: 200, body: { ok: true, bounced: msg.email } }
  }

  await deps.markMessage(msg.id, { complained_at: at })
  await deps.suppress(msg.email, 'complained', msg.id)
  const reason = `spam complaint from ${msg.email} (${msg.company}, ${msg.program}) at ${at}`
  await deps.halt(reason)
  try {
    await deps.sendToDanny(
      ALERT_TO,
      'Outreach stopped: a spam complaint',
      [
        `${msg.email} at ${msg.company} marked a FundOpsHQ ${msg.program === 'news_note' ? 'news note' : 'sponsor pitch'} as spam ("${msg.subject}").`,
        '',
        'All outreach sending has stopped automatically (outreach_v2_state.halted = true). The address is suppressed.',
        'Nothing else goes out until the flag is cleared by hand:',
        "  update outreach_v2_state set halted = false, halted_reason = null, updated_at = now() where id = 1;",
      ].join('\n'),
    )
  } catch {
    // The halt is what matters; the alert is best-effort.
  }
  return { status: 200, body: { ok: true, complained: msg.email, halted: true } }
}
