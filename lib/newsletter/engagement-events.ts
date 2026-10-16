/**
 * What Resend's webhook says each reader did with an edition, and the count a
 * link scanner cannot inflate (2026-10-16).
 *
 * The daily count in lib/scorecard/engagement.ts reads Resend's `last_event`
 * per email, and a corporate link scanner that follows every link in a
 * message counts there as a click: the clicks sat at 40 to 48 a day whatever
 * the edition. The webhook gives every event with its time, so a click can be
 * told from a scan: a person clicks more than a minute after the mail
 * arrives, and not in the same instant as the open the scanner also fires.
 *
 * Pure: the route (app/api/newsletter/events) stores, the daily job counts.
 */

export type EngagementType = 'delivered' | 'opened' | 'clicked'

export interface EngagementEvent {
  resend_email_id: string
  type: EngagementType
  /** ISO time the event happened (Resend's `created_at` for it). */
  occurred_at: string
  link?: string | null
}

/** A click sooner than this after delivery is a scanner, not a reader. */
export const HUMAN_CLICK_AFTER_MS = 60_000
/** A click within this of an open is the scanner's open-then-click, not a reader's. */
export const SCANNER_OPEN_CLICK_MS = 2_000

const TYPES: Record<string, EngagementType> = { 'email.delivered': 'delivered', 'email.opened': 'opened', 'email.clicked': 'clicked' }

export interface ParsedEvent {
  type: EngagementType
  emailId: string
  /** The recipient, lower-cased; null when the payload does not say. */
  email: string | null
  occurredAt: string
  link: string | null
  userAgent: string | null
}

/** The webhook payload as one event, or null when it is not one of the three we keep. */
export function parseResendEvent(payload: unknown): ParsedEvent | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as { type?: unknown; created_at?: unknown; data?: Record<string, unknown> }
  const type = typeof p.type === 'string' ? TYPES[p.type] : undefined
  const data = p.data ?? {}
  const emailId = typeof data.email_id === 'string' ? data.email_id : ''
  if (!type || !emailId) return null
  const to = Array.isArray(data.to) ? data.to[0] : data.to
  const click = (data.click ?? {}) as Record<string, unknown>
  const when = [click.timestamp, data.created_at, p.created_at].find((v) => typeof v === 'string' && !Number.isNaN(Date.parse(v))) as string | undefined
  return {
    type,
    emailId,
    email: typeof to === 'string' ? to.trim().toLowerCase() : null,
    occurredAt: new Date(when ?? Date.now()).toISOString(),
    link: typeof click.link === 'string' ? click.link.slice(0, 2000) : null,
    userAgent: typeof click.userAgent === 'string' ? click.userAgent.slice(0, 500) : null,
  }
}

export interface HumanCount {
  /** Recipients with any click event at all. */
  clickers: number
  /** Recipients with a click a person could have made. */
  human: number
  /** Recipients with any open event. */
  openers: number
  /** Click events in all. */
  clicks: number
}

/**
 * Per recipient (one Resend id each): a human clicker has a click more than
 * HUMAN_CLICK_AFTER_MS after the delivery event (or the send, when delivery
 * was not reported) that is not within SCANNER_OPEN_CLICK_MS of an open.
 */
export function countHumanClicks(events: EngagementEvent[], sentAt: string): HumanCount {
  const byId = new Map<string, { delivered: number | null; opens: number[]; clicks: number[] }>()
  for (const e of events) {
    const t = Date.parse(e.occurred_at)
    if (Number.isNaN(t)) continue
    let r = byId.get(e.resend_email_id)
    if (!r) byId.set(e.resend_email_id, (r = { delivered: null, opens: [], clicks: [] }))
    if (e.type === 'delivered') r.delivered = r.delivered == null ? t : Math.min(r.delivered, t)
    else if (e.type === 'opened') r.opens.push(t)
    else r.clicks.push(t)
  }
  const sent = Date.parse(sentAt)
  const out: HumanCount = { clickers: 0, human: 0, openers: 0, clicks: 0 }
  for (const r of byId.values()) {
    out.clicks += r.clicks.length
    if (r.opens.length) out.openers++
    if (!r.clicks.length) continue
    out.clickers++
    const arrived = r.delivered ?? (Number.isNaN(sent) ? null : sent)
    const human = r.clicks.some((c) => (arrived == null || c - arrived > HUMAN_CLICK_AFTER_MS) && !r.opens.some((o) => Math.abs(c - o) <= SCANNER_OPEN_CLICK_MS))
    if (human) out.human++
  }
  return out
}
