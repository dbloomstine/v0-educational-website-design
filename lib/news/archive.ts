/**
 * The story archive: /archive and /archive/<yyyy-mm>.
 *
 * The site's fronts hold ten days. The stories that have a fuller summary
 * (summary_long_status = 'written', lib/news/story-summary.ts) are the pages
 * with something on them, so those are what the archive lists, month by month,
 * for readers and for crawlers to walk.
 *
 * Every query here is on the partial index of tried rows
 * (idx_news_items_story_summary_status: published_date, where the status is
 * not null — supabase/migrations/20261008_story_summaries.sql), has a LIMIT,
 * and is kept in the data cache. Nothing reads news_items. Mind the 8 s
 * statement limit and the small instance (CLAUDE.md, "Speed, caching and the
 * database").
 *
 * What the queries cost, since the index holds every tried row (written, thin,
 * retried and failed) and the status is checked in the table: a month page
 * reads one page of fifty-one rows plus the thin ones it passes; the sitemap
 * reads at most SITEMAP_STORY_CAP written rows. The archive's span is two
 * single-row probes at either end of the index.
 */
import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { buildOnce } from '@/lib/cache/build-once'
import { plainHeadline } from '@/lib/newsletter/query-articles'
import { summaryParagraphs } from './story-summary'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

/** The first month a summary was written (2026-10-08). No archive page exists before it, and none is queried. */
export const ARCHIVE_FIRST_MONTH = '2026-10'
/** Stories on a month page. */
export const ARCHIVE_PAGE_SIZE = 50
/** Deepest page a month will answer for; a page number beyond it is a 404 without a query. */
export const ARCHIVE_MAX_PAGE = 200
/** Stories the sitemap lists from the archive, newest first. */
export const SITEMAP_STORY_CAP = 3000

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ─── Months ─────────────────────────────────────────────────────────────────

export const monthOf = (nowMs: number = Date.now()): string => new Date(nowMs).toISOString().slice(0, 7)

/** "2026-10" → "October 2026". */
export function monthLabel(month: string): string {
  const m = MONTH_RE.exec(month)
  return m ? `${MONTH_NAMES[Number(m[2]) - 1]} ${m[1]}` : month
}

/** The month before or after (+1, -1 as `step`), as "yyyy-mm". */
export function shiftMonth(month: string, step: number): string {
  const m = MONTH_RE.exec(month)
  if (!m) return month
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1 + step, 1))
  return t.toISOString().slice(0, 7)
}

/** True for a month the archive has a page for: a real month, from the first one to the present. */
export function isArchiveMonth(month: string, nowMs: number = Date.now()): boolean {
  return MONTH_RE.test(month) && month >= ARCHIVE_FIRST_MONTH && month <= monthOf(nowMs)
}

/** Every month from `first` to `last`, newest first. */
export function monthsBetween(first: string, last: string): string[] {
  if (!MONTH_RE.test(first) || !MONTH_RE.test(last) || first > last) return []
  const out: string[] = []
  for (let m = last; m >= first && out.length < 600; m = shiftMonth(m, -1)) out.push(m)
  return out
}

/** The first day of the month and of the next, as dates for a range. */
export function monthBounds(month: string): { from: string; before: string } {
  return { from: `${month}-01`, before: `${shiftMonth(month, 1)}-01` }
}

// ─── What a row shows ───────────────────────────────────────────────────────

/** Abbreviations whose full stop does not end a sentence. */
const ABBREVIATION = /\b(?:Inc|Ltd|Corp|Co|Cos|L\.P|Mr|Mrs|Ms|Dr|Jr|Sr|St|No|Nos|vs|Mt|Ft|Gen|Sen|Rep|Gov|Pres|Prof|approx|est|etc|e\.g|i\.e|U\.S|U\.K|U\.A\.E|N\.A|S\.A|A\.G|S\.p\.A|Pty|Bros|Assn|Dept|Intl)\.$/

/**
 * The first sentence of a summary: up to the first full stop (or ! or ?) that is
 * followed by a space and a capital or a quotation mark, passing the stops in
 * "Inc.", "U.S.", "Mr." and "No." On a summary that never stops, or
 * stops late, the first 240 characters at a word.
 */
export function firstSentence(text: string | null | undefined): string {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!flat) return ''
  const stop = /[.!?]["')\]’”]*(?=\s+["‘“([]?[A-Z0-9$€£])/g
  for (let m = stop.exec(flat); m; m = stop.exec(flat)) {
    const end = m.index + m[0].length
    if (flat[m.index] === '.' && ABBREVIATION.test(flat.slice(0, m.index + 1))) continue
    return clip(flat.slice(0, end))
  }
  return clip(flat)
}

function clip(sentence: string, max = 240): string {
  if (sentence.length <= max) return sentence
  const cut = sentence.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40)).replace(/[\s,;:–—-]+$/, '')}…`
}

export interface ArchiveEntry {
  id: string
  headline: string
  /** "yyyy-mm-dd". */
  date: string
  firm: string | null
  source: string | null
  /** The first sentence of the fuller summary. */
  blurb: string
}

export interface ArchiveRow {
  id: string
  title: string | null
  tldr?: string | null
  source_name?: string | null
  published_date: string | null
  summary_long: string | null
  firm?: string | null
}

/** A row as the archive shows it; null when it has nothing to show. */
export function toEntry(row: ArchiveRow): ArchiveEntry | null {
  const blurb = firstSentence(summaryParagraphs(row.summary_long)[0])
  const date = String(row.published_date ?? '').slice(0, 10)
  const title = (row.title ?? '').trim()
  if (!blurb || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const firm = (row.firm ?? '').trim()
  return {
    id: row.id,
    headline: plainHeadline(title, row.tldr ?? null, row.source_name ?? null),
    date,
    firm: firm || null,
    source: row.source_name?.trim() || null,
    blurb,
  }
}

// ─── Queries ────────────────────────────────────────────────────────────────

export interface ArchivePage {
  entries: ArchiveEntry[]
  /** True when an older page follows. */
  hasMore: boolean
}

/**
 * One page of a month, newest first. Fetches one row more than the page holds
 * to know whether another follows (no count: a count reads the whole month).
 * `range` is LIMIT/OFFSET; a month is a few thousand rows at most, and a page
 * number is capped (ARCHIVE_MAX_PAGE).
 */
export async function fetchArchiveMonth(db: DbClient, month: string, page: number): Promise<ArchivePage> {
  const { from, before } = monthBounds(month)
  const offset = (page - 1) * ARCHIVE_PAGE_SIZE
  const { data, error } = await db
    .from('news_items')
    .select('id, title, tldr, source_name, published_date, summary_long, firm:extracted_data->>firm_name')
    .eq('summary_long_status', 'written')
    .gte('published_date', from)
    .lt('published_date', before)
    .order('published_date', { ascending: false })
    .order('id', { ascending: true })
    .range(offset, offset + ARCHIVE_PAGE_SIZE)
  // An error is an error, not an empty month: the page is kept, and so would the empty answer be.
  if (error) throw new Error(`archive month query failed: ${error.message}`)
  const rows = (data ?? []) as ArchiveRow[]
  const entries = rows.slice(0, ARCHIVE_PAGE_SIZE).map(toEntry).filter((e): e is ArchiveEntry => e !== null)
  return { entries, hasMore: rows.length > ARCHIVE_PAGE_SIZE }
}

export interface ArchiveSpan {
  /** "yyyy-mm" of the oldest and newest written story. */
  first: string
  last: string
  /** "yyyy-mm-dd" of the newest. */
  newestDay: string
}

/** The months the archive covers: the oldest and the newest written story, two single-row probes. Null when none is written. */
export async function fetchArchiveSpan(db: DbClient): Promise<ArchiveSpan | null> {
  const probe = (ascending: boolean) =>
    db
      .from('news_items')
      .select('published_date')
      .eq('summary_long_status', 'written')
      .gte('published_date', `${ARCHIVE_FIRST_MONTH}-01`)
      .order('published_date', { ascending })
      .limit(1)
  const [oldest, newest] = await Promise.all([probe(true), probe(false)])
  const error = oldest.error ?? newest.error
  if (error) throw new Error(`archive span query failed: ${error.message}`)
  const a = String(oldest.data?.[0]?.published_date ?? '').slice(0, 10)
  const b = String(newest.data?.[0]?.published_date ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return null
  return { first: a.slice(0, 7), last: b.slice(0, 7), newestDay: b }
}

export interface SitemapStory {
  id: string
  /** "yyyy-mm-dd". */
  date: string
  /** When the summary was written, if the row says. */
  at: string | null
}

/** The newest written stories for the sitemap: one query, `cap` rows, three small columns. */
export async function fetchSitemapStories(db: DbClient, cap: number = SITEMAP_STORY_CAP): Promise<SitemapStory[]> {
  const { data, error } = await db
    .from('news_items')
    .select('id, published_date, summary_long_at')
    .eq('summary_long_status', 'written')
    .gte('published_date', `${ARCHIVE_FIRST_MONTH}-01`)
    .order('published_date', { ascending: false })
    .order('id', { ascending: true })
    .limit(cap)
  if (error) throw new Error(`sitemap stories query failed: ${error.message}`)
  return ((data ?? []) as { id: string; published_date: string | null; summary_long_at: string | null }[])
    .map((r) => ({ id: r.id, date: String(r.published_date ?? '').slice(0, 10), at: r.summary_long_at ?? null }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date))
    .slice(0, cap)
}

// ─── What the site calls ────────────────────────────────────────────────────

const SITEMAP_KEY = 'sitemap-written-v1'

/** A month page's stories. Six hours in the data cache under a page that revalidates daily. */
export const loadArchiveMonth = unstable_cache(
  (month: string, page: number): Promise<ArchivePage> => fetchArchiveMonth(getSupabaseAdmin(), month, page),
  ['archive-month-v1'],
  { revalidate: 21_600, tags: ['archive'] },
)

/** The months the archive covers. */
export const loadArchiveSpan = unstable_cache(
  (): Promise<ArchiveSpan | null> => fetchArchiveSpan(getSupabaseAdmin()),
  ['archive-span-v1'],
  { revalidate: 21_600, tags: ['archive'] },
)

/**
 * The sitemap's written stories: an hour in the data cache, and behind the
 * turnstile (lib/cache/build-once.ts), so a crawler reading the sitemap as it
 * goes stale does not start several builds.
 */
export const loadSitemapStories = unstable_cache(
  (): Promise<SitemapStory[]> => buildOnce(SITEMAP_KEY, () => fetchSitemapStories(getSupabaseAdmin())),
  [SITEMAP_KEY],
  { revalidate: 3600, tags: ['archive'] },
)

// ─── Addresses ──────────────────────────────────────────────────────────────

export const archiveHref = (month: string, page = 1): string => (page > 1 ? `/archive/${month}/${page}` : `/archive/${month}`)

/**
 * What /archive/<month>/<page…> asks for. `page` is the optional catch-all's
 * segments: none for the first page, one number after that. Null is a 404 and
 * costs no query: a month outside the archive, a page past the deepest, anything
 * else in the path. "/…/1" is the first page's address with a redirect.
 */
export function parseArchivePath(
  month: string,
  segments: string[] | undefined,
  nowMs: number = Date.now(),
): { month: string; page: number } | { redirect: string } | null {
  if (!isArchiveMonth(month, nowMs)) return null
  if (!segments || segments.length === 0) return { month, page: 1 }
  if (segments.length > 1 || !/^[1-9]\d{0,2}$/.test(segments[0])) return null
  const page = Number(segments[0])
  if (page === 1) return { redirect: archiveHref(month) }
  return page > ARCHIVE_MAX_PAGE ? null : { month, page }
}
