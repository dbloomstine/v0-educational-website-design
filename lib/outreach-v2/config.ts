/**
 * Outreach v2 (2026-10-14): FundOpsHQ's own email outreach, sent through
 * Resend from Danny's fundopshq.com address. Two programs:
 *
 *  - sponsor_pitch: a hand-picked list of fund-tech companies, each pitched
 *    once with a link to a mock-up of their ad, and followed up once after
 *    five business days unless they replied or opted out.
 *  - news_note: up to ten a day, a short "you were in FundOps Daily today"
 *    note to the marketing / IR / communications contact at a US firm named
 *    in that morning's edition.
 *
 * Everything Danny chose by clicking on 2026-10-14 is in this file: the From
 * address and signature, where replies go, the postal address, the caps.
 *
 * Not to be confused with the Gmail-based pipeline in lib/outreach (dormant
 * since 2026-09-06 behind OUTREACH_ENABLED=false). This one has its own
 * switch, OUTREACH_V2_MODE, its own tables (outreach_v2_*) and its own crons.
 *
 * Browser-safe: no server imports.
 */

export const SENDER_NAME = 'Danny Bloomstine'
export const SENDER_EMAIL = 'danny@fundopshq.com'
export const FROM = `${SENDER_NAME} <${SENDER_EMAIL}>`
export const SIGNATURE = ['Danny Bloomstine', 'Founder, FundOpsHQ']

/**
 * Replies land on a subdomain that Resend receives for (MX added 2026-10-14);
 * the apex keeps its ImprovMX MX untouched. /api/outreach/webhook stores each
 * reply and forwards a copy to Danny's Gmail.
 */
export const REPLY_DOMAIN = 'reply.fundopshq.com'
export const REPLY_TO = `${SENDER_NAME} <danny@${REPLY_DOMAIN}>`
/** The List-Unsubscribe mailto target. Mail to it suppresses the sender. */
export const UNSUBSCRIBE_MAILBOX = `unsubscribe@${REPLY_DOMAIN}`
export const FORWARD_TO = 'dbloomstine@gmail.com'
export const ALERT_TO = 'dbloomstine@gmail.com'

export const POSTAL_ADDRESS = 'FundOpsHQ, 76 Ensign Dr, Mystic, CT 06355'
export const SITE = 'https://fundopshq.com'

/** All sends across both programs, per New York day. */
export const DAILY_SEND_CAP = 30
/** News notes created per day (each costs about one Apollo credit). */
export const NEWS_NOTES_PER_DAY = 10
/** Apollo credits the news-note program may spend per New York day. Hard. */
export const APOLLO_CREDITS_PER_DAY = 10
/** Nobody is emailed twice by either program inside this window (a follow-up in the same thread excepted). */
export const RECONTACT_DAYS = 90
/** A firm gets at most one news note in this window, whoever it went to. */
export const FIRM_NEWS_NOTE_DAYS = 30
/** A sponsor pitch is followed up once, this many business days after it went. */
export const FOLLOWUP_BUSINESS_DAYS = 5

export type Program = 'sponsor_pitch' | 'news_note'
export type Mode = 'off' | 'preview' | 'live'

/**
 * OUTREACH_V2_MODE: `off` (the default, and anything unrecognised) does
 * nothing; `preview` builds and stores every email without sending; `live`
 * sends. A spam complaint sets the database halt flag, which forces `off`
 * whatever the environment says (see effectiveMode in store.ts).
 */
export function envMode(value: string | undefined = process.env.OUTREACH_V2_MODE): Mode {
  const v = (value ?? '').trim().toLowerCase()
  return v === 'preview' || v === 'live' ? v : 'off'
}

/**
 * The news notes have a switch of their own on top of OUTREACH_V2_MODE
 * (2026-10-14: the sponsor batch went live the same day, and the first news
 * notes are read by hand before any is sent). OUTREACH_V2_NEWS_MODE can only
 * lower the shared mode, never raise it: unset, the news notes stay in
 * `preview` at most.
 */
export function newsMode(shared: Mode, value: string | undefined = process.env.OUTREACH_V2_NEWS_MODE): Mode {
  const rank: Record<Mode, number> = { off: 0, preview: 1, live: 2 }
  const own = (value ?? '').trim().toLowerCase()
  const cap: Mode = own === 'live' ? 'live' : own === 'off' ? 'off' : 'preview'
  return rank[cap] < rank[shared] ? cap : shared
}

export function isOutreachReplyAddress(address: string | null | undefined): boolean {
  const a = bareAddress(address)
  return a.endsWith(`@${REPLY_DOMAIN}`)
}

/** "Jane Doe <Jane@X.com>" → "jane@x.com". */
export function bareAddress(address: string | null | undefined): string {
  const s = (address ?? '').trim()
  const m = s.match(/<([^>]+)>/)
  return (m ? m[1] : s).trim().toLowerCase()
}

/** The New York calendar day of an instant, as YYYY-MM-DD. */
export function nyDay(at: Date = new Date()): string {
  return at.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

/** The UTC instant at which New York day `day` begins. */
export function nyDayStart(day: string): Date {
  // Noon UTC is always inside the New York day; step back to its midnight.
  const noon = new Date(`${day}T12:00:00Z`)
  const hourNY = Number(noon.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }))
  return new Date(noon.getTime() - hourNY * 3_600_000)
}

/** Weekday (Mon–Fri) count rule: the day `n` business days after `day`. */
export function addBusinessDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  let left = n
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) left--
  }
  return d.toISOString().slice(0, 10)
}

/** True once `today` (New York) has reached `n` business days after the day a message went. */
export function followupDue(sentAt: Date, today: string, n: number = FOLLOWUP_BUSINESS_DAYS): boolean {
  return today >= addBusinessDays(nyDay(sentAt), n)
}
