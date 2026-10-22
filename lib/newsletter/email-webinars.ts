/**
 * Which webinars the daily email lists under "This week's free webinars" (2026-10-22).
 *
 * Danny, clicked 2026-10-22: "Yes, a short block: 'This week's free webinars': 3-5 lines under the events
 * section, only ops-relevant ones with a verified date and time." So a webinar is listed only when all of
 * these hold:
 *
 * - it is a virtual event (the webinars lane: queryEventFeed({ format: 'virtual' }), which already leaves
 *   out IQ-EQ's competitor administrators, lib/events/webinars.ts);
 * - it starts within the edition's week (the edition day through seven days on, New York dates, as the
 *   week ahead), and has not already started when the email is built;
 * - it is aimed at fund operations (`opsRelevance` high or medium);
 * - it states a time we can read ("1pm ET"): no time, no line;
 * - it is free AND the cost was checked on the registration page (isVerifiedFree): the heading says free;
 * - the week ahead above does not already list it (an organizer's own submission shows there).
 *
 * At most five. When more qualify, the high-relevance ones win, then the soonest; the block itself reads
 * soonest first. Fewer than two and the block is left out: a heading over one line reads as a gap.
 */
import { eventTimeLabel, isVerifiedFree } from '@/lib/events/constants'
import type { IndustryEvent } from '@/lib/events/types'

/** The most webinars the block lists. */
export const WEBINARS_MAX = 5
/** Below this many, no block at all. */
export const WEBINARS_MIN = 2
/** The window, in days after the edition day (the week ahead's '1w'). */
export const WEBINAR_WINDOW_DAYS = 7

export interface EmailWebinar {
  event: IndustryEvent
  /** "Tue Oct 28" */
  day: string
  /** The compact time as the board shows it: "1pm ET", "11:30am–1pm ET". */
  time: string
}

const RELEVANCE: Record<string, number> = { high: 0, medium: 1 }

/** Minutes to add to a zone's clock to read it in Eastern time. North American zones only. */
const TO_EASTERN: Record<string, number> = {
  ET: 0, EST: 0, EDT: 0,
  CT: 60, CST: 60, CDT: 60,
  MT: 120, MST: 120, MDT: 120,
  PT: 180, PST: 180, PDT: 180,
}

/**
 * The start of a compact time label in Eastern minutes after midnight, or null when it cannot be read.
 * A label with no zone is read as Eastern (the board's own default for a webinar with no city);
 * a zone outside North America cannot be placed and gives null.
 */
export function startMinutesEastern(label: string): number | null {
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm)?(?:–(\d{1,2})(?::(\d{2}))?(am|pm))?/i.exec(label.trim())
  if (!m) return null
  const ap = (m[3] ?? m[6])?.toLowerCase()
  if (!ap) return null
  const hour = (Number(m[1]) % 12) + (ap === 'pm' ? 12 : 0)
  const minutes = hour * 60 + Number(m[2] ?? 0)
  const zone = /\b([A-Z]{2,4})$/.exec(label.trim())?.[1]
  if (!zone) return minutes
  const shift = TO_EASTERN[zone]
  return shift === undefined ? null : minutes + shift
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** "Tue Oct 28", from a YYYY-MM-DD date. */
export function webinarDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const weekday = dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  const month = dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  return `${weekday} ${month} ${d}`
}

/** The New York date and the minutes past midnight there, for an instant. */
export function newYorkNow(now: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

export interface PickWebinarOptions {
  /** The edition's date (YYYY-MM-DD, New York). */
  today: string
  /** When the email is built. A webinar on the edition day that has already started is left out. */
  now?: Date
  /** Ids the week ahead already lists. */
  exclude?: ReadonlySet<string>
}

/** The webinars for the block, soonest first; empty when fewer than WEBINARS_MIN qualify. */
export function pickWebinarsForEmail(events: IndustryEvent[], opts: PickWebinarOptions): EmailWebinar[] {
  const horizon = addDays(opts.today, WEBINAR_WINDOW_DAYS)
  const clock = opts.now ? newYorkNow(opts.now) : null
  const seen = new Set<string>()
  const qualifying: { w: EmailWebinar; start: number; relevance: number }[] = []

  for (const event of events) {
    if (seen.has(event.id) || opts.exclude?.has(event.id)) continue
    seen.add(event.id)
    if (event.eventFormat !== 'virtual') continue
    if (event.status && event.status !== 'published') continue
    if (event.startDate < opts.today || event.startDate > horizon) continue
    const relevance = RELEVANCE[event.opsRelevance]
    if (relevance === undefined) continue
    if (!isVerifiedFree(event)) continue
    const time = eventTimeLabel(event)
    if (!time) continue
    const start = startMinutesEastern(time)
    if (start === null) continue
    // Already under way, or over, on the morning the email goes out.
    if (clock && event.startDate === clock.date && start <= clock.minutes) continue
    qualifying.push({ w: { event, day: webinarDay(event.startDate), time }, start, relevance })
  }

  if (qualifying.length < WEBINARS_MIN) return []

  const soonest = (a: (typeof qualifying)[number], b: (typeof qualifying)[number]) =>
    a.w.event.startDate.localeCompare(b.w.event.startDate) || a.start - b.start || a.w.event.name.localeCompare(b.w.event.name)

  return [...qualifying]
    .sort((a, b) => a.relevance - b.relevance || soonest(a, b))
    .slice(0, WEBINARS_MAX)
    .sort(soonest)
    .map((q) => q.w)
}
