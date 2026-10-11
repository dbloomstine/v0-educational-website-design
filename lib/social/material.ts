/**
 * What the reports say, for the social job's best stories.
 *
 * A post on a top story is swiped through four or five slides (Danny, 2026-10-10: "better and deeper…
 * with multiple photos and slides"), and the one-line summary and the 60-to-110-word fuller one do not
 * hold enough to fill them: the fuller summary leaves out, on purpose, the advisers, the backers and the
 * secondary detail that those slides are for. So the newest, best-covered stories go out with the text we
 * hold for each report (its feed description and any stored page text), cleaned and cut exactly as the
 * summary writer sees it (story-summary.ts `prepareRows`).
 *
 * It is other publishers' text and it is source material only: the social job writes its own words from
 * it and checks every figure and name against it. It leaves this route only under the job's secret.
 *
 * Pure: the route does the one read (rows by primary key).
 */
import type { Story } from '@/lib/news/stories'
import { prepareRows, type SourceRow } from '@/lib/news/story-summary'

/** Stories first seen within this many hours may carry their reports' text: the job posts nothing older on its own. */
export const MATERIAL_HOURS = 72
/** The most stories that carry it, and the most reports of one story. */
export const MATERIAL_STORIES = 40
export const MATERIAL_ROWS = 5
/** Characters of one report, and of one story's reports together. */
export const MATERIAL_ROW_CHARS = 2500
export const MATERIAL_STORY_CHARS = 7000

export interface Report {
  outlet: string
  headline: string
  text: string
}

type Candidate = Pick<Story, 'id' | 'memberIds' | 'firstSeen' | 'coverage' | 'roundup' | 'weight'>

/**
 * The stories whose reports are worth sending: recent, not a column of several items, and either
 * carried by two outlets or already given a fuller summary (which says the text behind it is real).
 * The best-covered first, then the weightier.
 */
export function materialStories<T extends Candidate>(stories: T[], hasLong: (s: T) => boolean, nowMs: number): T[] {
  const since = nowMs - MATERIAL_HOURS * 3_600_000
  const outlets = (s: T) => 1 + (s.coverage?.length ?? 0)
  return stories
    .filter((s) => !s.roundup && Date.parse(s.firstSeen) >= since && (outlets(s) >= 2 || hasLong(s)))
    .sort((a, b) => outlets(b) - outlets(a) || Number(hasLong(b)) - Number(hasLong(a)) || (b.weight ?? 0) - (a.weight ?? 0) || a.id.localeCompare(b.id))
    .slice(0, MATERIAL_STORIES)
}

/** The row ids to read for those stories. */
export const materialIds = (stories: Pick<Story, 'id' | 'memberIds'>[]): string[] => [...new Set(stories.flatMap((s) => (s.memberIds?.length ? s.memberIds : [s.id])))]

/**
 * One story's reports, the fullest first: at most five, each cut to its share, none that holds only its
 * headline. Null when no report says more than a headline.
 */
export function reportsOf(story: Pick<Story, 'id' | 'memberIds'>, rows: Map<string, SourceRow>): Report[] | null {
  const mine = (story.memberIds?.length ? story.memberIds : [story.id]).map((id) => rows.get(id)).filter((r): r is SourceRow => !!r)
  if (!mine.length) return null
  const out: Report[] = []
  let left = MATERIAL_STORY_CHARS
  for (const r of prepareRows(mine)) {
    if (out.length >= MATERIAL_ROWS || left < 200) break
    const text = [r.description, r.fullText].filter(Boolean).join('\n\n').slice(0, Math.min(MATERIAL_ROW_CHARS, left)).trim()
    if (!text) continue
    out.push({ outlet: r.outlet, headline: r.title, text })
    left -= text.length
  }
  return out.length ? out : null
}
