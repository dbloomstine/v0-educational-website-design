/**
 * Events up front (2026-10-22): which events the front page's "Events this
 * week" strip names, and how /events splits its first screen into this week
 * and next. Pure; the pages hand in the board's upcoming events and today's
 * date in New York.
 */
import type { IndustryEvent } from './types'

type Ev = Pick<IndustryEvent, 'id' | 'startDate' | 'name' | 'isFeatured' | 'opsRelevance' | 'eventKind' | 'expectedAttendance' | 'isSubmitted'>

/** Today's date in New York, the newsroom's day ("2026-10-22"). */
export function newYorkToday(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** Monday-to-Sunday weeks: the Sunday that ends this week, and next week's Monday and Sunday. */
export function weekBounds(todayIso: string): { thisWeekEnd: string; nextWeekStart: string; nextWeekEnd: string } {
  const [y, m, d] = todayIso.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 Sunday
  const toSunday = (7 - dow) % 7
  const thisWeekEnd = addDays(todayIso, toSunday)
  return { thisWeekEnd, nextWeekStart: addDays(thisWeekEnd, 1), nextWeekEnd: addDays(thisWeekEnd, 7) }
}

/** The upcoming events that start this week (from today to Sunday) and next week (Monday to Sunday), in date order. */
export function splitWeeks<T extends Ev>(events: T[], todayIso: string): { thisWeek: T[]; nextWeek: T[] } {
  const { thisWeekEnd, nextWeekStart, nextWeekEnd } = weekBounds(todayIso)
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name))
  return {
    thisWeek: sorted.filter((e) => e.startDate >= todayIso && e.startDate <= thisWeekEnd),
    nextWeek: sorted.filter((e) => e.startDate >= nextWeekStart && e.startDate <= nextWeekEnd),
  }
}

const BIG_KINDS = new Set(['conference', 'summit', 'forum'])

/** How much an event stands out for this audience: featured, ops-relevant, a real conference, a big room. */
export function notability(e: Ev): number {
  return (
    (e.isFeatured ? 4 : 0) +
    (e.opsRelevance === 'high' ? 3 : e.opsRelevance === 'medium' ? 1 : 0) +
    (BIG_KINDS.has(e.eventKind) ? 1.5 : 0) +
    ((e.expectedAttendance ?? 0) >= 500 ? 1 : 0) +
    (e.isSubmitted ? 0.5 : 0)
  )
}

/** The front page's strip: the most notable few of the week ahead, at most two on one day, shown in date order. */
export function pickNotableEvents<T extends Ev>(events: T[], max = 5): T[] {
  const ranked = [...events].sort((a, b) => notability(b) - notability(a) || a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name))
  const perDay = new Map<string, number>()
  const picks: T[] = []
  for (const e of ranked) {
    if (picks.length >= max) break
    const n = perDay.get(e.startDate) ?? 0
    if (n >= 2) continue
    perDay.set(e.startDate, n + 1)
    picks.push(e)
  }
  return picks.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name))
}
