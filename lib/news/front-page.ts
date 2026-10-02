/**
 * Fetch + cache layer for the story-based pages (home, section pages, story
 * pages). One query feeds all of them: the result is cached for ten minutes
 * and shared, so fifteen section pages regenerating do not mean fifteen
 * trips to the database.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { ALL_NEWSLETTER_TYPES } from '@/lib/newsletter/query-articles'
import { buildStories, type Story } from './stories'

/** Days of stories the site keeps "on the page". The archive lives at /news. */
export const STORY_WINDOW_DAYS = 10

const COLUMNS = 'id, title, source_url, source_name, published_date, created_at, article_type, event_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data'

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

// Bump the version whenever the Story shape changes: a deploy must never
// read stories cached by the previous build's code.
export const getStories = unstable_cache(() => fetchStories(STORY_WINDOW_DAYS), ['front-page-stories-v4'], {
  revalidate: 600,
  tags: ['stories'],
})

/** Thirty days of stories for the Latest page: the same stories, a longer window. */
const getArchive = unstable_cache(() => fetchStories(ARCHIVE_WINDOW_DAYS), ['archive-stories-v1'], {
  revalidate: 900,
  tags: ['stories'],
})

export async function getArchiveStoriesSafe(): Promise<Story[]> {
  try {
    return await getArchive()
  } catch (err) {
    console.error('[front-page] archive fetch failed:', err)
    return getStoriesSafe()
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
  try {
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
    if (error) throw new Error(error.message)
    return buildStories(data ?? [])
  } catch (err) {
    console.error('[front-page] search failed:', err)
    return []
  }
}

/** Never throws: a database hiccup renders an empty page, not an error page. */
export async function getStoriesSafe(): Promise<Story[]> {
  try {
    return await getStories()
  } catch (err) {
    console.error('[front-page] story fetch failed:', err)
    return []
  }
}

/**
 * One story by any of its rows' ids. Stories still on the page come from the
 * shared cache; an older permalink falls back to that single row, so a link
 * shared last month still opens — with its summary and source, without the
 * other outlets.
 */
export async function getStory(id: string): Promise<{ story: Story; all: Story[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const all = await getStoriesSafe()
  const hit = all.find((s) => s.id === id || s.memberIds?.includes(id))
  if (hit) return { story: hit, all }
  try {
    const { data } = await getSupabaseAdmin()
      .from('news_items')
      .select(COLUMNS)
      .eq('id', id)
      .eq('classification_status', 'complete')
      .maybeSingle()
    if (!data) return null
    const [story] = buildStories([data])
    return story ? { story, all } : null
  } catch {
    return null
  }
}
