/**
 * The database side of the long story summaries (story-summary.ts says what
 * they are). Columns come from supabase/migrations/20261008_story_summaries.sql.
 *
 * Every query here is on the primary key, or on the partial index of tried
 * rows; none reads the table. Mind the 8 s statement limit and the small
 * instance (CLAUDE.md, "Speed, caching and the database").
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { pickLongSummary, type SourceRow } from './story-summary'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

/** Where a story stands; see the migration. Null: never tried. */
export type SummaryStatus = 'written' | 'thin' | 'retry' | 'failed'

/** Days of rows whose status the job reads. The same as the stories the site holds (STORY_WINDOW_DAYS in front-page.ts). */
const MARK_DAYS = 10

/** Every row of the last ten days that has been tried, with its status. */
export async function loadMarks(db: DbClient, nowMs: number = Date.now()): Promise<Map<string, SummaryStatus>> {
  const since = new Date(nowMs - MARK_DAYS * 86_400_000).toISOString().slice(0, 10)
  const marks = new Map<string, SummaryStatus>()
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await db
      .from('news_items')
      .select('id, summary_long_status')
      .not('summary_long_status', 'is', null)
      .gte('published_date', since)
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(`story summary marks query failed: ${error.message}`)
    for (const r of data ?? []) marks.set(r.id as string, r.summary_long_status as SummaryStatus)
    if (!data || data.length < 1000) break
  }
  return marks
}

/** The text we hold for a story's rows. */
export async function loadRows(db: DbClient, ids: string[]): Promise<SourceRow[]> {
  const { data, error } = await db
    .from('news_items')
    .select('id, title, description, full_text, source_name, published_date')
    .in('id', ids)
  if (error) throw new Error(`story rows query failed: ${error.message}`)
  return (data ?? []) as SourceRow[]
}

/** Store a summary on the story's best row. Never overwrites one that is already there. */
export async function saveWritten(db: DbClient, id: string, summary: string, model: string, nowMs: number = Date.now()): Promise<void> {
  const { error } = await db
    .from('news_items')
    .update({
      summary_long: summary,
      summary_long_model: model,
      summary_long_at: new Date(nowMs).toISOString(),
      summary_long_status: 'written',
    })
    .eq('id', id)
    .is('summary_long', null)
  if (error) throw new Error(`story summary write failed: ${error.message}`)
}

/**
 * Mark a story thin, for one more try, or given up. A thin mark also records
 * when (summary_long_at, which nothing reads on a row without a summary), so
 * the job can tell later whether the story has gained text or an outlet since.
 */
export async function saveStatus(db: DbClient, id: string, status: Exclude<SummaryStatus, 'written'>, nowMs: number = Date.now()): Promise<void> {
  const { error } = await db
    .from('news_items')
    .update(status === 'thin' ? { summary_long_status: status, summary_long_at: new Date(nowMs).toISOString() } : { summary_long_status: status })
    .eq('id', id)
    .is('summary_long', null)
  if (error) throw new Error(`story summary status write failed: ${error.message}`)
}

/**
 * The long summary for the story page: the best row's, else any member's.
 *
 * Returns null on any failure, and says so in the log. The page then shows the
 * short summary, which is how it looked before there was a long one, and is
 * also how it behaves if it is deployed ahead of the migration. (The loaders
 * that build the stories throw instead, because a page cached EMPTY is worse
 * than a page not built; a page cached with the short summary is not.)
 */
export async function readLongSummary(db: DbClient, story: { id: string; memberIds: string[] }): Promise<string | null> {
  try {
    const ids = story.memberIds?.length ? story.memberIds : [story.id]
    const { data, error } = await db
      .from('news_items')
      .select('id, summary_long, summary_long_at')
      .in('id', ids)
      .not('summary_long', 'is', null)
    if (error) throw new Error(error.message)
    return pickLongSummary(data ?? [], story.id)
  } catch (err) {
    console.error('[story-summary] could not read the long summary:', err)
    return null
  }
}
