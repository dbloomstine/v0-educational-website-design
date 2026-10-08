/**
 * The fuller summary of a story, with the time it was written.
 *
 * The same read as `readLongSummary` in story-summary-store.ts (one primary-key
 * lookup, the best row's text first, any member's otherwise, null and a log
 * line on any failure) that also says WHEN: the story page dates its JSON-LD
 * `dateModified` by it. Kept apart so the job's own files stay as they are.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { pickLongSummary } from './story-summary'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

export interface LongSummary {
  text: string
  /** When the job wrote it (summary_long_at); null if the row does not say. */
  at: string | null
}

/**
 * The fuller summary, if any row of the story has one. Failing to read it is
 * logged and reads as "none", so the page falls back to the short summary.
 * With `strict` the error is thrown instead, for a caller that must not mistake
 * "could not read" for "there is none" (the noindex decision).
 */
export async function readLongSummaryDetail(
  db: DbClient,
  story: { id: string; memberIds: string[] },
  opts: { strict?: boolean } = {},
): Promise<LongSummary | null> {
  try {
    const ids = story.memberIds?.length ? story.memberIds : [story.id]
    const { data, error } = await db
      .from('news_items')
      .select('id, summary_long, summary_long_at')
      .in('id', ids)
      .not('summary_long', 'is', null)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as { id: string; summary_long: string | null; summary_long_at: string | null }[]
    const text = pickLongSummary(rows, story.id)
    if (!text) return null
    return { text, at: rows.find((r) => r.summary_long === text)?.summary_long_at ?? null }
  } catch (err) {
    if (opts.strict) throw err
    console.error('[story-summary] could not read the long summary:', err)
    return null
  }
}
