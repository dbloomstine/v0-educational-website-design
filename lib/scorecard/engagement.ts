/**
 * The daily email's clicks, edition by edition (Danny, 2026-10-14: the Monday scorecard should show the email's
 * engagement for the week against the week before).
 *
 * WHY THE COUNTS ARE STORED, NOT LOOKED UP ON MONDAY. Two weeks of editions is about 2,200 emails. Asking Resend for
 * each one at two requests a second is some twenty minutes, far past what the Monday route can run; and Resend
 * keeps only about a month of mail, so the numbers would also vanish. Instead a small daily job
 * (app/api/pipeline/edition-engagement, 12:00 UTC) reads Resend's list for the editions sent one to three days
 * earlier and saves each one's counts in `newsletter_editions.engagement`. An edition is counted again each day
 * until it is three days old, then left alone: its count is final. The scorecard only reads the stored counts.
 *
 * WHAT A CLICK IS. Resend gives one `last_event` per email. "clicked" is a click. A reader who clicked and later
 * opened the same email again may show as an open, so the counts are a floor, never an estimate pushed up.
 *
 * Everything in this file is pure: the route fetches, this file counts.
 */

export const DAY_MS = 86_400_000
/** An edition is counted until it is this old; after that its stored count is final. */
export const FINAL_AFTER_MS = 72 * 3_600_000
/** A day for readers to get to it before the first count. */
export const FIRST_COUNT_AFTER_MS = 20 * 3_600_000
/** How far back the daily job looks (also what its first run fills in). Resend keeps about a month. */
export const LOOKBACK_MS = 15 * DAY_MS

/** What is stored in `newsletter_editions.engagement`. Every figure is a count of recipients (people), not of events. */
export interface EditionEngagement {
  /** Addresses the edition went to (keys of `resend_email_ids`). */
  recipients: number
  /** Of those, how many Resend gave an event for. The rest are unknown, never assumed. */
  measured: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  measured_at: string
  /** True once the count was taken three days or more after the send. */
  final: boolean
}

export interface EditionRow {
  id: string
  edition_date: string
  sent_at: string | null
  status: string
  resend_email_ids: Record<string, string> | null
  engagement: EditionEngagement | null
}

const DELIVERED = new Set(['delivered', 'opened', 'clicked'])
const OPENED = new Set(['opened', 'clicked'])

/** One edition's counts, from its address → Resend id map and the last event Resend gave each id. */
export function countEngagement(ids: Record<string, string> | null, events: Map<string, string>, sentAt: string, measuredAt: number): EditionEngagement {
  const out: EditionEngagement = { recipients: 0, measured: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, measured_at: new Date(measuredAt).toISOString(), final: measuredAt - Date.parse(sentAt) >= FINAL_AFTER_MS }
  for (const id of Object.values(ids ?? {})) {
    out.recipients++
    const e = events.get(id)
    if (!e) continue
    out.measured++
    if (DELIVERED.has(e)) out.delivered++
    if (OPENED.has(e)) out.opened++
    if (e === 'clicked') out.clicked++
    if (e === 'bounced') out.bounced++
    if (e === 'complained') out.complained++
  }
  return out
}

/** The editions the daily job should count now: sent, a day old, not older than the lookback, and not yet final. */
export function editionsToCount(editions: EditionRow[], now: number): EditionRow[] {
  return editions.filter((e) => {
    if (e.status !== 'sent' || !e.sent_at || !e.resend_email_ids || !Object.keys(e.resend_email_ids).length) return false
    const age = now - Date.parse(e.sent_at)
    return age >= FIRST_COUNT_AFTER_MS && age <= LOOKBACK_MS && !e.engagement?.final
  })
}

/* ───────── the scorecard's sums ───────── */

export interface EditionClicks { date: string; recipients: number; clicked: number; share: number; final: boolean }
export interface EmailWeek {
  /** Editions in the week that have a count, oldest first. */
  editions: EditionClicks[]
  /** Editions in the week with no count yet (dates). */
  unmeasured: string[]
  /** People who clicked, summed over the counted editions, and the share of their recipients. */
  clicked: number; recipients: number; share: number
  /** Clickers on an average counted edition. */
  perEdition: number
  before: { editions: number; clicked: number; recipients: number; share: number; perEdition: number }
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)

/**
 * The week `from`..`to` (edition dates, inclusive) against the seven days before it. The share is of recipients,
 * not of opens: a click per person who was sent the edition.
 */
export function emailWeek(editions: Pick<EditionRow, 'edition_date' | 'status' | 'engagement'>[], from: string, to: string): EmailWeek {
  const shift = (iso: string, days: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
  const sent = editions.filter((e) => e.status === 'sent')
  const inRange = (a: string, b: string) => sent.filter((e) => e.edition_date >= a && e.edition_date <= b).sort((x, y) => x.edition_date.localeCompare(y.edition_date))
  const sum = (rows: typeof sent) => {
    const counted = rows.filter((e) => e.engagement)
    const clicked = counted.reduce((n, e) => n + (e.engagement as EditionEngagement).clicked, 0)
    const recipients = counted.reduce((n, e) => n + (e.engagement as EditionEngagement).recipients, 0)
    return { editions: counted.length, clicked, recipients, share: pct(clicked, recipients), perEdition: counted.length ? Math.round(clicked / counted.length) : 0 }
  }
  const week = inRange(from, to)
  const now = sum(week)
  return {
    editions: week.filter((e) => e.engagement).map((e) => { const g = e.engagement as EditionEngagement; return { date: e.edition_date, recipients: g.recipients, clicked: g.clicked, share: pct(g.clicked, g.recipients), final: g.final } }),
    unmeasured: week.filter((e) => !e.engagement).map((e) => e.edition_date),
    clicked: now.clicked, recipients: now.recipients, share: now.share, perEdition: now.perEdition,
    before: sum(inRange(shift(from, -7), shift(to, -7))),
  }
}
