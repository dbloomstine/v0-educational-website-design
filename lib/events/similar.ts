/**
 * Picking events to show beside an event (2026-10-22). Pure: the pages fetch
 * a few small, upcoming candidate lists (lib/events/api.ts) and these choose.
 */
import type { IndustryEvent } from './types'

type Ev = Pick<IndustryEvent, 'id' | 'name' | 'organizerName' | 'startDate' | 'city' | 'topics' | 'fundCategories' | 'eventKind'>

/** How many "Similar events" an event page shows. */
export const SIMILAR_MAX = 6

function sameCity(a: Ev, b: Ev): boolean {
  return !!a.city && !!b.city && a.city.trim().toLowerCase() === b.city.trim().toLowerCase()
}

function shared(a: string[], b: string[]): number {
  const set = new Set(a)
  return b.filter((x) => set.has(x)).length
}

/**
 * "Similar events": upcoming, never the event itself or another listing of it, best first: same city and
 * topic, then same city, then same topic, then the same asset class. Ties go to the sooner date.
 */
export function pickSimilarEvents<T extends Ev>(event: Ev, candidates: T[], todayIso: string, limit = SIMILAR_MAX): T[] {
  const seen = new Set<string>([event.id])
  const name = normName(event.name)
  const scored: { e: T; score: number }[] = []
  for (const c of candidates) {
    if (seen.has(c.id) || c.startDate < todayIso || normName(c.name) === name) continue
    seen.add(c.id)
    const city = sameCity(event, c) ? 3 : 0
    const topics = Math.min(shared(event.topics, c.topics), 2) * 1.5
    const assets = shared(event.fundCategories, c.fundCategories) > 0 ? 0.75 : 0
    const kind = event.eventKind === c.eventKind ? 0.25 : 0
    const score = city + topics + assets + kind
    if (score <= 0.25) continue
    scored.push({ e: c, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.e.startDate.localeCompare(b.e.startDate) || a.e.name.localeCompare(b.e.name))
    .slice(0, limit)
    .map((x) => x.e)
}

const NOISE = new Set(['annual', 'the', 'of', 'and', 'for', 'in', 'on', 'a', 'an', 'at', '&', 'conference', 'summit', 'forum', 'event'])

/** A name's words without the edition, the year and filler: "8th Annual LPGP Connect CFO/COO Forum Chicago 2026" → lpgp connect cfo coo chicago. */
export function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !NOISE.has(w) && !/^\d+(st|nd|rd|th)?$/.test(w) && !/^(19|20)\d{2}$/.test(w))
}

function normName(name: string): string {
  return nameWords(name).join(' ')
}

/** How alike two event names are, 0 to 1 (shared words over all words). */
export function nameSimilarity(a: string, b: string): number {
  const x = new Set(nameWords(a))
  const y = new Set(nameWords(b))
  if (x.size === 0 || y.size === 0) return 0
  let both = 0
  for (const w of x) if (y.has(w)) both++
  return both / (x.size + y.size - both)
}

/** At least this alike, a later event from the same organizer is called the next edition. */
export const NEXT_EDITION_SIMILARITY = 0.6

/**
 * For a past event: the organizer's next one. Same organizer, later than the event, upcoming; the most alike
 * by name (and in the same city) first, then the soonest. `edition` says whether it reads as the next edition
 * of this event or just the organizer's next event. Null when the organizer has nothing upcoming.
 */
export function pickNextEdition<T extends Ev>(event: Ev, candidates: T[], todayIso: string): { event: T; edition: boolean } | null {
  const org = event.organizerName.trim().toLowerCase()
  let best: { e: T; sim: number; score: number } | null = null
  for (const c of candidates) {
    if (c.id === event.id || c.organizerName.trim().toLowerCase() !== org) continue
    if (c.startDate <= event.startDate || c.startDate < todayIso) continue
    const sim = nameSimilarity(event.name, c.name)
    const score = sim + (sameCity(event, c) ? 0.25 : 0)
    if (!best || score > best.score || (score === best.score && c.startDate < best.e.startDate)) best = { e: c, sim, score }
  }
  return best ? { event: best.e, edition: best.sim >= NEXT_EDITION_SIMILARITY } : null
}
