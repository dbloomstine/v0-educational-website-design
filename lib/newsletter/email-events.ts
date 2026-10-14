/**
 * Which of the week's events the daily email shows (2026-10-12).
 *
 * The board lists everything it verifies, and the email used to list the whole
 * week of it: 47 to 69 events an edition in the second week of October. Danny:
 * "the events list is too long… for a daily email… maybe we just do like a
 * few… I'd rather keep it clean." So each day shows its two best and says how
 * many more it has, with the full calendar one click away. The board itself is
 * unchanged.
 *
 * "Best" is what the board already knows: a featured event first, then the ones
 * aimed at fund operations (`opsRelevance` high, then medium), then the larger
 * ones (`expectedAttendance`), then an open event over an invitation-only one.
 * Within a tie the list's own order (the board sorts by date) stands.
 *
 * An event its organizer sent in through /events/submit is always shown on its
 * day (2026-10-13, Danny: "if someone submits one proactively it should
 * automatically get shown when it's in the window that we show them"). It
 * comes first, and the day's best others fill what is left of the two; a day
 * with three submitted events shows all three.
 */
import type { IndustryEvent } from '@/lib/events/types'

/** How many events a day shows in the email. */
export const EVENTS_PER_DAY = 2

const RELEVANCE: Record<string, number> = { high: 0, medium: 1, low: 2 }

export function eventRank(e: IndustryEvent): number {
  const relevance = RELEVANCE[e.opsRelevance] ?? 2
  const size = Math.min(e.expectedAttendance ?? 0, 5000) / 5000
  return (e.isSubmitted ? -20 : 0) + (e.isFeatured ? 0 : 10) + relevance * 3 + (e.costType === 'invite_only' ? 1 : 0) - size
}

export interface EmailDay {
  /** The day's heading, as the caller formats it. */
  heading: string
  /** The events shown, best first. */
  shown: IndustryEvent[]
  /** How many of the day's events are not shown. */
  more: number
}

/**
 * The list grouped by day (it arrives date-sorted), each day cut to its best `perDay`
 * events. A day with nothing to cut is as it was.
 */
export function pickEventsForEmail(events: IndustryEvent[], headingOf: (e: IndustryEvent) => string, perDay = EVENTS_PER_DAY): EmailDay[] {
  const days: { heading: string; all: IndustryEvent[] }[] = []
  for (const event of events) {
    const heading = headingOf(event)
    const last = days[days.length - 1]
    if (last && last.heading === heading) last.all.push(event)
    else days.push({ heading, all: [event] })
  }
  return days.map(({ heading, all }) => {
    // A stable sort: ties keep the board's order.
    const ranked = all.map((e, i) => ({ e, i, r: eventRank(e) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.e)
    // Every submitted event, then the best of the rest up to the day's two.
    const keep = Math.max(perDay, ranked.filter((e) => e.isSubmitted).length)
    return { heading, shown: ranked.slice(0, keep), more: Math.max(0, all.length - keep) }
  })
}
