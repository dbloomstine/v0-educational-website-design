import type { Metadata } from 'next'
import type { Story } from './stories'

/**
 * Whether a story's page has anything a search engine should index.
 *
 * Every story has a page, and the site's headlines now open it. A page with a
 * fuller summary (`summary_long`) or with more than one outlet says something
 * the publisher's own page does not. A page with neither is a headline, one
 * line and a link: it is marked `noindex, follow`, so it stays out of the index
 * while the links on it are still followed.
 *
 * Decided at render, never stored: the page revalidates, and the day it gains a
 * fuller summary or a second outlet it is indexable again.
 * `coverage` never repeats the first outlet, so a story has coverage.length + 1.
 */
export function storyIsThin(story: Pick<Story, 'coverage'>, hasLongSummary: boolean): boolean {
  return !hasLongSummary && story.coverage.length === 0
}

/**
 * The `robots` metadata for a story page. `hasLongSummary` is null when the
 * lookup failed: then nothing is said (the page stays indexable), so a database
 * hiccup is never cached as a request to leave the page out of the index.
 */
export function storyRobots(story: Pick<Story, 'coverage'>, hasLongSummary: boolean | null): Metadata['robots'] {
  if (hasLongSummary === null) return undefined
  return storyIsThin(story, hasLongSummary) ? { index: false, follow: true } : undefined
}
