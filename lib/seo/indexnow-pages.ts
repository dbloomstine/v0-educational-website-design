import type { Story } from '@/lib/news/stories'
import { storyPath } from '@/lib/news/story-path'

/**
 * Which pages the jobs submit to IndexNow (lib/seo/indexnow.ts), chosen from
 * what they already hold: no query of their own (2026-10-22).
 */

const HOUR_MS = 3_600_000

/** At most this many story pages from one run. A normal hour is far below it. */
export const STORY_PING_CAP = 200

/**
 * Stories the site offers to search engines: the sitemap's rule (app/sitemap.ts),
 * more than one outlet and not a roundup. A single-outlet page is `noindex`
 * until it has a fuller summary (lib/news/story-index.ts); those are submitted
 * by the summary job when it writes one, not here.
 */
export function offeredToSearch(story: Pick<Story, 'roundup' | 'coverage'>): boolean {
  return !story.roundup && story.coverage.length > 0
}

/**
 * The previous clock hour, for the classification run (:30 every hour).
 *
 * The run reads the shared ten-minute story cache, which never yet holds the
 * rows it has just classified. It holds the previous run's: rows ingested at
 * the top of the previous hour, classified half an hour later. So each run
 * submits the stories that first reached us in the previous clock hour. The
 * hours tile, so a story is submitted once, without remembering anything
 * between runs. A story that gains its second outlet later is submitted when
 * the summary job writes it up, and the sitemap has it either way.
 */
export function previousHour(nowMs: number): { from: number; to: number } {
  const to = Math.floor(nowMs / HOUR_MS) * HOUR_MS
  return { from: to - HOUR_MS, to }
}

/** The pages of stories that first reached us in the previous clock hour and are offered to search. */
export function newStoryPaths(stories: Story[], nowMs: number, cap: number = STORY_PING_CAP): string[] {
  const { from, to } = previousHour(nowMs)
  const paths: string[] = []
  for (const s of stories) {
    if (paths.length >= cap) break
    const t = new Date(s.firstSeen).getTime()
    if (!(t >= from && t < to)) continue
    if (!offeredToSearch(s)) continue
    paths.push(storyPath(s))
  }
  return [...new Set(paths)]
}

/**
 * The pages whose content turns over every day. Submitted once a day, by the
 * classification run that falls in HUBS_HOUR_UTC: after the morning edition
 * (11:30 UTC), so the front page has the day's news on it.
 */
export const HUB_PATHS = ['/', '/news', '/league-tables', '/events', '/events/webinars'] as const
export const HUBS_HOUR_UTC = 12

export function hubsDue(nowMs: number): boolean {
  return new Date(nowMs).getUTCHours() === HUBS_HOUR_UTC
}
