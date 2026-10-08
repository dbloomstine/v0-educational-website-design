/**
 * The hourly job that writes long summaries (story-summary.ts) for the
 * stories on the site: which stories, in what order, how many, and what to
 * remember about each.
 *
 * No I/O of its own. The route hands it `JobDeps` (the story cache, the
 * database, the model); a test hands it fakes.
 */
import type { Story } from './stories'
import { isThin, prepareRows, StorySummaryApiError, type PreparedRow, type SourceRow, type Usage, type WriteOutcome } from './story-summary'
import type { SummaryStatus } from './story-summary-store'

/** The most model calls one run makes, whatever the route is asked. */
export const MAX_STORIES_PER_RUN = 20
/** The most stories one run looks at (a thin one costs a read, not a call). */
export const MAX_EXAMINED_PER_RUN = 60
/** Stories first seen within this many hours are candidates. */
export const WINDOW_HOURS = 48
/**
 * Wall-clock budget, ms. The route's maxDuration is 300 s; twenty calls of
 * ~10 s fit, and a slow API ends the run early instead of being killed mid-call.
 */
export const RUN_BUDGET_MS = 240_000

/**
 * The kill switch. On since 2026-10-08 (Danny: "go for it and do it with Sonnet"), so a deploy needs
 * no setting to run it; STORY_SUMMARIES_ENABLED=false, and a redeploy, stops it before any read or call.
 */
export function storySummariesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return (env.STORY_SUMMARIES_ENABLED ?? '').trim().toLowerCase() !== 'false'
}

/** `?limit=` may lower the cap for a manual run; nothing raises it. */
export function capFor(requested: string | null | undefined): number {
  const n = Number(requested)
  if (!requested || !Number.isFinite(n)) return MAX_STORIES_PER_RUN
  return Math.max(0, Math.min(MAX_STORIES_PER_RUN, Math.floor(n)))
}

type Candidate = Pick<Story, 'id' | 'memberIds' | 'firstSeen' | 'coverage' | 'roundup'>

/** The strongest mark among a story's rows. A written row anywhere means the story has its summary. */
export function storyMark(story: Pick<Story, 'memberIds'>, marks: Map<string, SummaryStatus>): SummaryStatus | null {
  const order: SummaryStatus[] = ['written', 'thin', 'failed', 'retry']
  const found = new Set<SummaryStatus>()
  for (const id of story.memberIds) {
    const m = marks.get(id)
    if (m) found.add(m)
  }
  return order.find((m) => found.has(m)) ?? null
}

/**
 * The stories to write, in the order to write them.
 *
 * Candidates: first seen in the last 48 hours, not a roundup (one headline over
 * several items: a summary would mix them), and no row of the story written,
 * thin or given up. A story whose first answer failed a check comes back, after
 * every story not yet tried. Order: the newer day first, then the more outlets,
 * then the newer story.
 */
export function selectStories<T extends Candidate>(stories: T[], marks: Map<string, SummaryStatus>, nowMs: number, windowHours = WINDOW_HOURS): T[] {
  const since = nowMs - windowHours * 3_600_000
  const rank = (s: T) => (storyMark(s, marks) === 'retry' ? 1 : 0)
  return stories
    .filter((s) => !s.roundup && new Date(s.firstSeen).getTime() >= since && (storyMark(s, marks) === null || storyMark(s, marks) === 'retry'))
    .sort((a, b) =>
      rank(a) - rank(b) ||
      b.firstSeen.slice(0, 10).localeCompare(a.firstSeen.slice(0, 10)) ||
      b.coverage.length - a.coverage.length ||
      b.firstSeen.localeCompare(a.firstSeen) ||
      a.id.localeCompare(b.id))
}

export interface JobDeps {
  loadStories(): Promise<Candidate[]>
  loadMarks(): Promise<Map<string, SummaryStatus>>
  loadRows(ids: string[]): Promise<SourceRow[]>
  /** One call and the checks. May throw StorySummaryApiError. */
  write(rows: PreparedRow[]): Promise<WriteOutcome>
  saveWritten(id: string, summary: string, model: string): Promise<void>
  saveStatus(id: string, status: Exclude<SummaryStatus, 'written'>): Promise<void>
  now(): number
}

export interface RunOptions {
  /** The most model calls. Capped at MAX_STORIES_PER_RUN. */
  cap?: number
  examineCap?: number
  budgetMs?: number
}

export interface RunResult {
  candidates: number
  examined: number
  calls: number
  written: number
  thin: number
  /** Answers thrown away by a check this run; each is marked for one more try, or given up on. */
  rejected: number
  givenUp: number
  /** The API was down or refused us: the run stopped, and marked nothing for the story it was on. */
  aborted: boolean
  stoppedBy: 'queue_empty' | 'cap' | 'examined' | 'budget' | 'api_outage'
  errors: string[]
  tokens: Usage
}

const noUsage = (): Usage => ({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 })

export async function runStorySummaries(deps: JobDeps, opts: RunOptions = {}): Promise<RunResult> {
  const cap = Math.min(opts.cap ?? MAX_STORIES_PER_RUN, MAX_STORIES_PER_RUN)
  const examineCap = opts.examineCap ?? MAX_EXAMINED_PER_RUN
  const budgetMs = opts.budgetMs ?? RUN_BUDGET_MS
  const started = deps.now()

  const [stories, marks] = await Promise.all([deps.loadStories(), deps.loadMarks()])
  const queue = selectStories(stories, marks, deps.now())
  const result: RunResult = {
    candidates: queue.length, examined: 0, calls: 0, written: 0, thin: 0, rejected: 0, givenUp: 0,
    aborted: false, stoppedBy: 'queue_empty', errors: [], tokens: noUsage(),
  }

  for (const story of queue) {
    if (result.calls >= cap) { result.stoppedBy = 'cap'; break }
    if (result.examined >= examineCap) { result.stoppedBy = 'examined'; break }
    if (deps.now() - started > budgetMs) { result.stoppedBy = 'budget'; break }
    result.examined++

    try {
      const prepared = prepareRows(await deps.loadRows(story.memberIds))
      if (prepared.length === 0) { result.errors.push(`${story.id}: no rows found`); continue }

      if (isThin(prepared)) {
        await deps.saveStatus(story.id, 'thin')
        result.thin++
        continue
      }

      result.calls++
      const outcome = await deps.write(prepared)
      if (outcome.status === 'thin') { await deps.saveStatus(story.id, 'thin'); result.thin++; continue }
      for (const k of Object.keys(result.tokens) as (keyof Usage)[]) result.tokens[k] += outcome.usage[k]
      result.calls += (outcome.calls ?? 1) - 1 // a rewrite is a call too, and counts toward the cap

      if (outcome.status === 'written') {
        await deps.saveWritten(story.id, outcome.summary, outcome.model)
        result.written++
      } else {
        // Discarded, not stored. One more try later; after the second failure, left alone.
        const again = storyMark(story, marks) === 'retry'
        await deps.saveStatus(story.id, again ? 'failed' : 'retry')
        result.rejected++
        if (again) result.givenUp++
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors.push(`${story.id}: ${message}`)
      // The API being down says nothing about this story, and the next would fail too.
      if (err instanceof StorySummaryApiError && err.outage) {
        result.aborted = true
        result.stoppedBy = 'api_outage'
        break
      }
    }
  }
  return result
}
