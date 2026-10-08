/**
 * The database side of the on-the-site text pass (enrich-stories.ts) and of the
 * summary job's "has this thin story changed?" question (story-summary-job.ts).
 * No new columns: `enriched_at` and `enrichment_error` are the enrichment job's
 * own, and `summary_long_at` (stamped when a story is marked thin) is from
 * 20261008_story_summaries.sql.
 *
 * Every query is on the primary key or the partial index of tried rows, in
 * chunks, never a scan of news_items. Mind the 8 s statement limit and the
 * small instance (CLAUDE.md, "Speed, caching and the database").
 */
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

/** Ids per `in (...)` query: 36-character uuids keep the request line short. */
const CHUNK = 100
/** Days of rows whose thin stamps the job reads; the same as loadMarks. */
const STAMP_DAYS = 10

/** What the job needs to know about a row to say whether a thin story has changed. */
export interface RowTextState {
  createdAt: string | null
  enrichedAt: string | null
  /** A page's text is stored for this row (`full_text` is not null). */
  hasText: boolean
}

/** A row the text pass may fetch. */
export interface FetchRow extends RowTextState {
  id: string
  sourceUrl: string
  description: string | null
  enrichmentError: string | null
}

const chunks = <T>(xs: T[], n = CHUNK): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

/** Which of these rows hold stored text. Selects ids only: the text itself stays in the database. */
async function idsWithText(db: DbClient, ids: string[]): Promise<Set<string>> {
  const have = new Set<string>()
  for (const part of chunks(ids)) {
    const { data, error } = await db.from('news_items').select('id').in('id', part).not('full_text', 'is', null)
    if (error) throw new Error(`stored-text query failed: ${error.message}`)
    for (const r of data ?? []) have.add(r.id as string)
  }
  return have
}

/** created_at, enriched_at and whether text is stored, for the summary job's thin stories. */
export async function loadRowTextState(db: DbClient, ids: string[]): Promise<Map<string, RowTextState>> {
  const state = new Map<string, RowTextState>()
  if (ids.length === 0) return state
  const withText = await idsWithText(db, ids)
  for (const part of chunks(ids)) {
    const { data, error } = await db.from('news_items').select('id, created_at, enriched_at').in('id', part)
    if (error) throw new Error(`row state query failed: ${error.message}`)
    for (const r of data ?? []) {
      state.set(r.id as string, {
        createdAt: (r.created_at as string | null) ?? null,
        enrichedAt: (r.enriched_at as string | null) ?? null,
        hasText: withText.has(r.id as string),
      })
    }
  }
  return state
}

/** The rows of the given stories that arrived since `sinceIso`, with what the text pass needs to choose among them. */
export async function loadFetchRows(db: DbClient, ids: string[], sinceIso: string): Promise<FetchRow[]> {
  const rows: FetchRow[] = []
  if (ids.length === 0) return rows
  const withText = await idsWithText(db, ids)
  for (const part of chunks(ids)) {
    const { data, error } = await db
      .from('news_items')
      .select('id, source_url, description, created_at, enriched_at, enrichment_error')
      .in('id', part)
      .gte('created_at', sinceIso)
    if (error) throw new Error(`fetch rows query failed: ${error.message}`)
    for (const r of data ?? []) {
      rows.push({
        id: r.id as string,
        sourceUrl: r.source_url as string,
        description: (r.description as string | null) ?? null,
        createdAt: (r.created_at as string | null) ?? null,
        enrichedAt: (r.enriched_at as string | null) ?? null,
        enrichmentError: (r.enrichment_error as string | null) ?? null,
        hasText: withText.has(r.id as string),
      })
    }
  }
  return rows
}

/** When each thin-marked row was marked (null for marks made before the stamp existed). */
export async function loadThinStamps(db: DbClient, nowMs: number = Date.now()): Promise<Map<string, string | null>> {
  const since = new Date(nowMs - STAMP_DAYS * 86_400_000).toISOString().slice(0, 10)
  const stamps = new Map<string, string | null>()
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await db
      .from('news_items')
      .select('id, summary_long_at')
      .eq('summary_long_status', 'thin')
      .gte('published_date', since)
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(`thin stamps query failed: ${error.message}`)
    for (const r of data ?? []) stamps.set(r.id as string, (r.summary_long_at as string | null) ?? null)
    if (!data || data.length < 1000) break
  }
  return stamps
}
