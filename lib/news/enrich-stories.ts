/**
 * The second text pass: fetch the publisher's page for the stories on the site
 * now, so the long summary (story-summary.ts) has something to write from.
 *
 * Why a second pass. enrich-articles.ts only looks at rows still `pending`. It
 * ran every second hour at :15 while classification runs every hour at :30, so
 * a row ingested in an odd hour was classified before the enricher ever saw it
 * (measured 2026-10-08: 237 of 238 even-hour rows tried, 1 of 152 odd-hour).
 * This pass looks at rows that are already complete, and only those that belong
 * to a story on the site that is still thin or not yet tried.
 *
 * Same conduct as the first pass, because it is the same fetcher
 * (`fetchArticleBody`): paywalled hosts are never requested, robots.txt is
 * honoured, the User-Agent names the crawler, a page is read to a size cap
 * inside a timeout, and a redirect may not leave the publisher's domain. On top:
 * a hard cap on fetches per run, a smaller one per host, and a row that fails is
 * marked (`enriched_at` + `enrichment_error`, columns the first pass already
 * uses) so it is not asked for again at once. The text is for our own
 * summarising and is never shown.
 *
 * No I/O of its own. The route hands it `TextPassDeps`; a test hands it fakes.
 */
import type { Story } from './stories'
import { hostOf, isPaywalledHost, isUnextractableHost, THIN_TEXT_THRESHOLD, type BodyResult } from './enrich-articles'
import type { FetchRow } from './story-text-store'
import type { SummaryStatus } from './story-summary-store'

/** The most pages one run asks for, whatever else is waiting. */
export const MAX_FETCHES_PER_RUN = 40
/** The most pages one run asks of one host. */
export const MAX_FETCHES_PER_HOST = 3
/** Rows fetched for one story: a second outlet's words help, a fifth add little. */
export const MAX_ROWS_PER_STORY = 2
/** Rows and stories newer than this many hours are candidates (the summary job's window). */
export const WINDOW_HOURS = 48
/** A row whose page failed to load is asked for once more, after this many hours. */
export const RETRY_FAILED_AFTER_HOURS = 3
/** Wall-clock budget, ms. The route's maxDuration is 300 s and the summary job follows ten minutes later. */
export const RUN_BUDGET_MS = 180_000
const CONCURRENCY = 4

/** Recorded when a failed fetch has been tried a second time; nothing selects a row carrying it. */
export const FETCH_FAILED = 'fetch failed'
export const FETCH_FAILED_AGAIN = 'fetch failed again'

type Candidate = Pick<Story, 'id' | 'memberIds' | 'firstSeen' | 'coverage' | 'roundup'>

/**
 * Stories worth fetching for: on the site in the last 48 hours, not a roundup,
 * and either never tried by the summary job or marked thin. Written and
 * given-up stories do not need text. Newer day first, then more outlets.
 */
export function selectTargets<T extends Candidate>(
  stories: T[],
  marks: Map<string, SummaryStatus>,
  nowMs: number,
  windowHours = WINDOW_HOURS,
): T[] {
  const since = nowMs - windowHours * 3_600_000
  const state = (s: T) => {
    const seen = new Set(s.memberIds.map((id) => marks.get(id)).filter(Boolean))
    if (seen.has('written') || seen.has('failed') || seen.has('retry')) return 'done'
    return seen.has('thin') ? 'thin' : 'untried'
  }
  return stories
    .filter((s) => !s.roundup && new Date(s.firstSeen).getTime() >= since && state(s) !== 'done')
    .sort((a, b) =>
      b.firstSeen.slice(0, 10).localeCompare(a.firstSeen.slice(0, 10)) ||
      b.coverage.length - a.coverage.length ||
      b.firstSeen.localeCompare(a.firstSeen) ||
      a.id.localeCompare(b.id))
}

/** A row the pass may fetch, and why not otherwise. `null` means it may. */
export function rowBlocker(row: FetchRow, nowMs: number, windowHours = WINDOW_HOURS): string | null {
  if (row.hasText) return 'has text'
  if (!row.createdAt || new Date(row.createdAt).getTime() < nowMs - windowHours * 3_600_000) return 'too old'
  const host = hostOf(row.sourceUrl)
  if (!host) return 'not a web address'
  if (host === 'news.google.com') return 'google news redirect'
  if (isPaywalledHost(host)) return 'paywalled'
  if (isUnextractableHost(host)) return 'yields no text'
  // The feed already carried a body; the first pass applies the same test.
  if ((row.description ?? '').length >= THIN_TEXT_THRESHOLD) return 'feed text is long enough'
  if (row.enrichedAt === null) return null
  // Tried before. A page that would not load gets one more try, later; every
  // other outcome (a wall, a short page, robots, a second failure) stands.
  if (row.enrichmentError === FETCH_FAILED && new Date(row.enrichedAt).getTime() <= nowMs - RETRY_FAILED_AFTER_HOURS * 3_600_000) return null
  return 'already tried'
}

export interface PlannedFetch {
  rowId: string
  storyId: string
  url: string
  host: string
  /** A second try of a page that failed to load. */
  retry: boolean
}

export interface PlanOptions {
  maxFetches?: number
  maxPerHost?: number
  maxPerStory?: number
  windowHours?: number
}

/**
 * The pages to ask for, in order: stories as `selectTargets` ordered them, at
 * most two rows each (different hosts first, newer first), no host more than
 * three times and no more than forty in all.
 */
export function planFetches(targets: Candidate[], rows: Map<string, FetchRow>, nowMs: number, opts: PlanOptions = {}): PlannedFetch[] {
  const maxFetches = Math.min(opts.maxFetches ?? MAX_FETCHES_PER_RUN, MAX_FETCHES_PER_RUN)
  const maxPerHost = Math.min(opts.maxPerHost ?? MAX_FETCHES_PER_HOST, MAX_FETCHES_PER_HOST)
  const maxPerStory = opts.maxPerStory ?? MAX_ROWS_PER_STORY
  const perHost = new Map<string, number>()
  const planned: PlannedFetch[] = []
  const taken = new Set<string>()

  for (const story of targets) {
    if (planned.length >= maxFetches) break
    const members = story.memberIds.map((id) => rows.get(id)).filter((r): r is FetchRow => !!r && !taken.has(r.id))
    const eligible = members
      .filter((r) => rowBlocker(r, nowMs, opts.windowHours) === null)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id))

    // Different hosts first: two pages from one outlet say the same thing.
    const ordered: FetchRow[] = []
    const seenHosts = new Set<string>()
    for (const r of eligible) { const h = hostOf(r.sourceUrl)!; if (!seenHosts.has(h)) { seenHosts.add(h); ordered.push(r) } }
    for (const r of eligible) if (!ordered.includes(r)) ordered.push(r)

    let forStory = 0
    for (const r of ordered) {
      if (forStory >= maxPerStory || planned.length >= maxFetches) break
      const host = hostOf(r.sourceUrl)!
      if ((perHost.get(host) ?? 0) >= maxPerHost) continue
      perHost.set(host, (perHost.get(host) ?? 0) + 1)
      taken.add(r.id)
      forStory++
      planned.push({ rowId: r.id, storyId: story.id, url: r.sourceUrl, host, retry: r.enrichedAt !== null })
    }
  }
  return planned
}

export interface TextPassDeps {
  loadStories(): Promise<Candidate[]>
  loadMarks(): Promise<Map<string, SummaryStatus>>
  /** The member rows of these stories that arrived since `sinceIso`. */
  loadRows(ids: string[], sinceIso: string): Promise<FetchRow[]>
  /** One page, under the fetcher's rules. Must not throw for a page that will not load. */
  fetchBody(url: string): Promise<BodyResult>
  /** Store the text (or null) and the reason, and stamp the row as tried. */
  saveResult(rowId: string, text: string | null, error: string | null): Promise<void>
  now(): number
}

export interface TextPassOptions extends PlanOptions {
  budgetMs?: number
}

export interface TextPassResult {
  stories: number
  planned: number
  fetched: number
  withText: number
  skipped: number
  failed: number
  perHost: Record<string, number>
  stoppedBy: 'queue_empty' | 'done' | 'budget'
  errors: string[]
}

export async function runStoryTextPass(deps: TextPassDeps, opts: TextPassOptions = {}): Promise<TextPassResult> {
  const started = deps.now()
  const budgetMs = opts.budgetMs ?? RUN_BUDGET_MS
  const [stories, marks] = await Promise.all([deps.loadStories(), deps.loadMarks()])
  const targets = selectTargets(stories, marks, started, opts.windowHours)
  const result: TextPassResult = {
    stories: targets.length, planned: 0, fetched: 0, withText: 0, skipped: 0, failed: 0,
    perHost: {}, stoppedBy: 'queue_empty', errors: [],
  }
  if (targets.length === 0) return result

  const sinceIso = new Date(started - (opts.windowHours ?? WINDOW_HOURS) * 3_600_000).toISOString()
  const rows = new Map((await deps.loadRows([...new Set(targets.flatMap((s) => s.memberIds))], sinceIso)).map((r) => [r.id, r]))
  const plan = planFetches(targets, rows, started, opts)
  result.planned = plan.length
  if (plan.length === 0) return result

  // A fixed pool over a shared cursor, as in the first pass; the fetcher itself
  // spaces requests to one host a second apart.
  let cursor = 0
  result.stoppedBy = 'done'
  const workers = Array.from({ length: Math.min(CONCURRENCY, plan.length) }, async () => {
    for (;;) {
      if (deps.now() - started > budgetMs) { result.stoppedBy = 'budget'; return }
      const item = plan[cursor++]
      if (!item) return
      try {
        const body = await deps.fetchBody(item.url)
        result.fetched++
        result.perHost[item.host] = (result.perHost[item.host] ?? 0) + 1
        if (body.ok) {
          await deps.saveResult(item.rowId, body.text, null)
          result.withText++
        } else {
          // A page that would not load, twice, is not asked for a third time.
          const reason = item.retry && body.reason === FETCH_FAILED ? FETCH_FAILED_AGAIN : body.reason
          await deps.saveResult(item.rowId, null, reason)
          if (body.outcome === 'failed') result.failed++
          else result.skipped++
        }
      } catch (err) {
        result.failed++
        if (result.errors.length < 10) result.errors.push(`${item.rowId}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  })
  await Promise.all(workers)
  return result
}
