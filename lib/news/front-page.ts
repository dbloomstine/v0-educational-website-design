/**
 * Fetch + cache layer for the story-based pages (home, section pages, story
 * pages). One query feeds all of them: the result is cached for ten minutes
 * and shared, so fifteen section pages regenerating do not mean fifteen
 * trips to the database.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { buildOnce } from '@/lib/cache/build-once'
import { ALL_NEWSLETTER_TYPES } from '@/lib/newsletter/query-articles'
import { buildStories, type Story } from './stories'
import { STORY_COLUMNS } from './story-columns'
import { loadOlderStory, type OlderContext } from './older-story'

/** Days of stories the site keeps "on the page". The archive lives at /news. */
export const STORY_WINDOW_DAYS = 10

const COLUMNS = STORY_COLUMNS

/** The Latest page reaches further back than the fronts do. */
export const ARCHIVE_WINDOW_DAYS = 30

async function fetchStories(windowDays: number = STORY_WINDOW_DAYS): Promise<Story[]> {
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = []
  for (let from = 0; from < 12000; from += 1000) {
    const { data, error } = await getSupabaseAdmin()
      .from('news_items')
      .select(COLUMNS)
      .eq('classification_status', 'complete')
      .eq('is_duplicate', false)
      .gte('published_date', since)
      .or('is_high_signal.eq.true,relevance_score.gte.0.3')
      .in('article_type', ALL_NEWSLETTER_TYPES)
      .order('published_date', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(`front page query failed: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return buildStories(rows)
}

// Bump the version whenever the Story shape changes, or what a field holds:
// a deploy must never read stories cached by the previous build's code. The
// same version names the copy in `site_cache`, for the same reason.
// (v6 / v3, 2026-10-05: a roundup carries no size, fund or stage, and more
// rows are known to be roundups. v7 / v4, the same day: a summary is shown
// without the classifier's remarks.)
//
// buildOnce: when the cached entry goes stale, every request that notices
// would rebuild it. Only one may (lib/cache/build-once.ts).
const STORIES_KEY = 'front-page-stories-v7'
const ARCHIVE_KEY = 'archive-stories-v4'

const getStories = unstable_cache(() => buildOnce(STORIES_KEY, () => fetchStories(STORY_WINDOW_DAYS)), [STORIES_KEY], {
  revalidate: 600,
  tags: ['stories'],
})

/** Thirty days of stories for the Latest page: the same stories, a longer window. */
const getArchive = unstable_cache(() => buildOnce(ARCHIVE_KEY, () => fetchStories(ARCHIVE_WINDOW_DAYS)), [ARCHIVE_KEY], {
  revalidate: 900,
  tags: ['stories'],
})

/** What this server last got, so a failure has something to fall back on. */
let lastStories: Story[] | null = null
let lastArchive: Story[] | null = null

/**
 * The ten days of stories every page is built from.
 *
 * Throws when they cannot be had at all. That is deliberate. These pages are
 * cached, and a page that renders EMPTY when the database fails is a page
 * that is cached empty — ten minutes for the front page, an hour at the edge.
 * A page that throws is not cached: the last good copy keeps being served.
 * (Until 2026-10-02 this returned [] on failure, under a name ending "Safe".)
 */
export async function loadStories(): Promise<Story[]> {
  try {
    lastStories = await getStories()
    return lastStories
  } catch (err) {
    if (!lastStories) throw err
    console.error('[front-page] story fetch failed, serving the last copy:', err)
    return lastStories
  }
}

/** Thirty days of stories. Falls back to the ten-day window before giving up. */
export async function loadArchive(): Promise<Story[]> {
  try {
    lastArchive = await getArchive()
    return lastArchive
  } catch (err) {
    console.error('[front-page] archive fetch failed:', err)
    return lastArchive ?? loadStories()
  }
}

/**
 * Search goes to the database, not the cached window, so a reader looking for
 * a fund that closed in the spring finds it. Matching rows are clustered the
 * same way the fronts are, so a result is a story, not a pile of reports.
 */
export async function searchStories(query: string): Promise<Story[]> {
  // Keep only what a name or a phrase is made of: PostgREST reads , ( ) . * as syntax.
  const q = query.replace(/[^\p{L}\p{N}\s&'$-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  if (q.length < 2) return []
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10)
  const like = `%${q.replace(/[%_]/g, ' ')}%`
  const { data, error } = await getSupabaseAdmin()
    .from('news_items')
    .select(COLUMNS)
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', since)
    .or('is_high_signal.eq.true,relevance_score.gte.0.3')
    .in('article_type', ALL_NEWSLETTER_TYPES)
    .or(`title.ilike."${like}",tldr.ilike."${like}"`)
    .order('published_date', { ascending: false })
    .limit(400)
  // A search that fails is an error, not "nothing found": the results page is
  // kept at the edge, and "no stories match" would be kept with it.
  if (error) throw new Error(`search failed: ${error.message}`)
  return buildStories(data ?? [])
}

/**
 * One story by any of its rows' ids. Stories still on the page come from the
 * shared cache. An older permalink is built from its own row and the same
 * firm's rows a few days either side (lib/news/older-story.ts), so a link
 * shared last month opens a whole story: its summary, its facts and every
 * outlet that reported it. `older` is set for those, and carries what the page
 * needs for its rails: stories of the same firm from about the same time.
 */
export async function getStory(id: string): Promise<{ story: Story; all: Story[]; older?: OlderContext } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const all = await loadStories()
  const hit = all.find((s) => s.id === id || s.memberIds?.includes(id))
  if (hit) return { story: hit, all }
  const older = await loadOlderStory(id.toLowerCase())
  return older ? { story: older.story, all, older: { siblings: older.siblings } } : null
}
