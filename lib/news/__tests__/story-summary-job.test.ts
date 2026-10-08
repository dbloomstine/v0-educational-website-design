import { describe, it, expect } from 'vitest'
import {
  capFor, MAX_EXAMINED_PER_RUN, MAX_STORIES_PER_RUN, runStorySummaries, selectStories, storyMark, storySummariesEnabled,
  thinStoryChanged, type JobDeps, type StoryEvidence,
} from '../story-summary-job'
import type { RowTextState } from '../story-text-store'
import { StorySummaryApiError, type SourceRow, type WriteOutcome } from '../story-summary'
import type { SummaryStatus } from '../story-summary-store'

const NOW = new Date('2026-10-08T14:00:00Z').getTime()
const NOW_ISO = new Date(NOW).toISOString()
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString()

let n = 0
function story(o: Partial<{ id: string; members: string[]; firstSeen: string; outlets: number; roundup: boolean }> = {}) {
  const id = o.id ?? `s${++n}`
  return {
    id,
    memberIds: o.members ?? [id],
    firstSeen: o.firstSeen ?? hoursAgo(3),
    coverage: Array.from({ length: Math.max(0, (o.outlets ?? 1) - 1) }, (_, i) => ({ source: `Outlet ${i}`, url: `https://example.com/${id}/${i}`, headline: 'h' })),
    roundup: o.roundup ?? false,
  }
}
const marks = (entries: [string, SummaryStatus][]) => new Map(entries)
const ids = (xs: { id: string }[]) => xs.map((x) => x.id)

describe('the kill switch and the cap', () => {
  it('runs unless STORY_SUMMARIES_ENABLED says false', () => {
    expect(storySummariesEnabled({})).toBe(true)
    expect(storySummariesEnabled({ STORY_SUMMARIES_ENABLED: 'true' })).toBe(true)
    expect(storySummariesEnabled({ STORY_SUMMARIES_ENABLED: 'false' })).toBe(false)
    expect(storySummariesEnabled({ STORY_SUMMARIES_ENABLED: ' FALSE ' })).toBe(false)
  })
  it('?limit= can lower the cap and never raise it', () => {
    expect(MAX_STORIES_PER_RUN).toBe(20)
    expect(capFor(null)).toBe(20)
    expect(capFor('5')).toBe(5)
    expect(capFor('0')).toBe(0)
    expect(capFor('500')).toBe(20)
    expect(capFor('abc')).toBe(20)
    expect(capFor('-3')).toBe(0)
  })
})

describe('selectStories', () => {
  it('takes stories first seen in the last 48 hours, not older', () => {
    const fresh = story({ firstSeen: hoursAgo(47) })
    const stale = story({ firstSeen: hoursAgo(49) })
    expect(ids(selectStories([stale, fresh], marks([]), NOW))).toEqual([fresh.id])
  })
  it('leaves roundups alone', () => {
    const wire = story({ roundup: true })
    expect(selectStories([wire], marks([]), NOW)).toEqual([])
  })
  it('skips a story with a written, thin or given-up row anywhere in it', () => {
    const a = story({ members: ['a1', 'a2'] })
    const b = story({ members: ['b1', 'b2'] })
    const c = story({ members: ['c1'] })
    const d = story({ members: ['d1'] })
    const picked = selectStories([a, b, c, d], marks([['a2', 'written'], ['b1', 'thin'], ['c1', 'failed']]), NOW)
    expect(ids(picked)).toEqual([d.id])
  })
  it('puts a story awaiting its one retry after every story not yet tried', () => {
    const retry = story({ outlets: 9, firstSeen: hoursAgo(1) })
    const fresh = story({ outlets: 1, firstSeen: hoursAgo(20) })
    const picked = selectStories([retry, fresh], marks([[retry.id, 'retry']]), NOW)
    expect(ids(picked)).toEqual([fresh.id, retry.id])
  })
  it('orders by the newer day, then the more outlets, then the newer story', () => {
    const todayBig = story({ firstSeen: '2026-10-08T05:00:00Z', outlets: 12 })
    const todayNew = story({ firstSeen: '2026-10-08T12:00:00Z', outlets: 2 })
    const todayOld = story({ firstSeen: '2026-10-08T01:00:00Z', outlets: 2 })
    const yesterdayHuge = story({ firstSeen: '2026-10-07T20:00:00Z', outlets: 30 })
    const picked = selectStories([yesterdayHuge, todayOld, todayNew, todayBig], marks([]), NOW)
    expect(ids(picked)).toEqual([todayBig.id, todayNew.id, todayOld.id, yesterdayHuge.id])
  })
  it('storyMark gives written priority over thin, thin over failed, failed over retry', () => {
    const s = story({ members: ['x', 'y', 'z'] })
    expect(storyMark(s, marks([['x', 'retry'], ['y', 'failed']]))).toBe('failed')
    expect(storyMark(s, marks([['x', 'retry'], ['y', 'written']]))).toBe('written')
    expect(storyMark(s, marks([]))).toBeNull()
  })
})

// ─── A thin story is not thin for ever ──────────────────────────────────────

const state = (o: Partial<RowTextState> = {}): RowTextState => ({ createdAt: hoursAgo(20), enrichedAt: null, hasText: false, ...o })
const evidence = (thinAt: [string, string | null][], rows: [string, RowTextState][]): StoryEvidence => ({ thinAt: new Map(thinAt), rows: new Map(rows) })

describe('thin stories come back only when something has changed', () => {
  const MARKED = hoursAgo(5)

  it('stays out when nothing has happened since it was marked', () => {
    const s = story({ id: 't', members: ['t1', 't2'] })
    const ev = evidence([['t1', MARKED]], [['t1', state()], ['t2', state({ createdAt: hoursAgo(6), enrichedAt: hoursAgo(6), hasText: true })]])
    expect(thinStoryChanged(s, marks([['t1', 'thin']]), ev)).toBe(false)
    expect(ids(selectStories([s], marks([['t1', 'thin']]), NOW, 48, ev))).toEqual([])
  })
  it('comes back once a row has gained text since it was marked', () => {
    const s = story({ id: 't', members: ['t1', 't2'] })
    const ev = evidence([['t1', MARKED]], [['t1', state()], ['t2', state({ enrichedAt: hoursAgo(1), hasText: true })]])
    expect(ids(selectStories([s], marks([['t1', 'thin']]), NOW, 48, ev))).toEqual(['t'])
  })
  it('comes back when the story has gained an outlet since it was marked', () => {
    const s = story({ id: 't', members: ['t1', 't2'] })
    const ev = evidence([['t1', MARKED]], [['t1', state()], ['t2', state({ createdAt: hoursAgo(2) })]])
    expect(ids(selectStories([s], marks([['t1', 'thin']]), NOW, 48, ev))).toEqual(['t'])
  })
  it('is not brought back by a row that was marked as tried but yielded nothing', () => {
    const s = story({ id: 't', members: ['t1'] })
    const ev = evidence([['t1', MARKED]], [['t1', state({ enrichedAt: hoursAgo(1), hasText: false })]])
    expect(thinStoryChanged(s, marks([['t1', 'thin']]), ev)).toBe(false)
  })
  it('reads the newest thin mark when several rows carry one', () => {
    const s = story({ id: 't', members: ['t1', 't2'] })
    const ev = evidence([['t1', hoursAgo(30)], ['t2', hoursAgo(1)]], [['t1', state({ enrichedAt: hoursAgo(3), hasText: true })], ['t2', state()]])
    expect(thinStoryChanged(s, marks([['t1', 'thin'], ['t2', 'thin']]), ev)).toBe(false)
  })
  it('looks once more at a thin mark made before the time was kept, and the look stamps it', () => {
    const s = story({ id: 't', members: ['t1'] })
    const ev = evidence([['t1', null]], [['t1', state()]])
    expect(thinStoryChanged(s, marks([['t1', 'thin']]), ev)).toBe(true)
    const stamped = evidence([['t1', NOW_ISO]], [['t1', state()]])
    expect(thinStoryChanged(s, marks([['t1', 'thin']]), stamped)).toBe(false)
  })
  it('without evidence a thin story stays thin, as before', () => {
    const s = story({ id: 't' })
    expect(selectStories([s], marks([['t', 'thin']]), NOW)).toEqual([])
  })
  it('never brings back a written or given-up story, whatever has changed', () => {
    const w = story({ id: 'w' })
    const f = story({ id: 'f' })
    const ev = evidence([], [['w', state({ enrichedAt: hoursAgo(1), hasText: true })], ['f', state({ enrichedAt: hoursAgo(1), hasText: true })]])
    expect(selectStories([w, f], marks([['w', 'written'], ['f', 'failed']]), NOW, 48, ev)).toEqual([])
  })
  it('puts stories with stored text before those without, then the usual order, retries last', () => {
    const bare = story({ id: 'bare', firstSeen: hoursAgo(1), outlets: 9 })
    const texty = story({ id: 'texty', firstSeen: hoursAgo(30), outlets: 1 })
    const retry = story({ id: 'retry', firstSeen: hoursAgo(1) })
    const ev = evidence([], [['texty', state({ enrichedAt: hoursAgo(1), hasText: true })], ['retry', state({ hasText: true })]])
    expect(ids(selectStories([retry, bare, texty], marks([['retry', 'retry']]), NOW, 48, ev))).toEqual(['texty', 'bare', 'retry'])
  })
})

describe('runStorySummaries and thin stories', () => {
  it('re-reads a thin story that gained text and writes it, but not one that is unchanged, and not twice', async () => {
    const changed = story({ id: 'changed' })
    const same = story({ id: 'same' })
    const thinMarks: [string, SummaryStatus][] = [['changed', 'thin'], ['same', 'thin']]
    const ev = evidence([['changed', hoursAgo(5)], ['same', hoursAgo(5)]], [['changed', state({ enrichedAt: hoursAgo(1), hasText: true })], ['same', state()]])
    const first = deps([changed, same], { marks: thinMarks, loadEvidence: async () => ev })
    const r1 = await runStorySummaries(first.d)
    expect(r1).toMatchObject({ candidates: 1, examined: 1, calls: 1, written: 1 })
    expect(first.log.written.map(([id]) => id)).toEqual(['changed'])
  })
  it('a re-read that is still thin is marked thin again, which stamps it; the next hour does not re-read it', async () => {
    const s = story({ id: 's' })
    const ev = evidence([['s', hoursAgo(5)]], [['s', state({ createdAt: hoursAgo(1) })]])
    const first = deps([s], { marks: [['s', 'thin']], thin: ['s'], loadEvidence: async () => ev })
    const r1 = await runStorySummaries(first.d)
    expect(r1).toMatchObject({ examined: 1, thin: 1, calls: 0 })
    expect(first.log.status).toEqual([['s', 'thin']])
    // saveStatus stamped the row now; an hour later nothing is newer than the stamp.
    const next = deps([s], { marks: [['s', 'thin']], thin: ['s'], now: () => NOW + 3_600_000, loadEvidence: async () => evidence([['s', NOW_ISO]], [['s', state({ createdAt: hoursAgo(1) })]]) })
    const r2 = await runStorySummaries(next.d)
    expect(r2).toMatchObject({ candidates: 0, examined: 0 })
  })
  it('thin stories without a change cost no examination at all, however many there are', async () => {
    const stories = Array.from({ length: 80 }, (_, i) => story({ id: `t${i}` }))
    const thinMarks = stories.map((s): [string, SummaryStatus] => [s.id, 'thin'])
    const ev = evidence(stories.map((s): [string, string] => [s.id, hoursAgo(5)]), stories.map((s): [string, RowTextState] => [s.id, state()]))
    const { d, log } = deps(stories, { marks: thinMarks, thin: stories.map((s) => s.id), loadEvidence: async () => ev })
    expect(await runStorySummaries(d)).toMatchObject({ candidates: 0, examined: 0, calls: 0 })
    expect(log.status).toEqual([])
  })
  it('carries on, as before, when the evidence cannot be read', async () => {
    const fresh = story({ id: 'fresh' })
    const thin = story({ id: 'thin' })
    const { d, log } = deps([fresh, thin], { marks: [['thin', 'thin']], loadEvidence: async () => { throw new Error('timeout') } })
    const r = await runStorySummaries(d)
    expect(log.written.map(([id]) => id)).toEqual(['fresh'])
    expect(r.errors[0]).toContain('timeout')
  })
  it('keeps the cap of twenty model calls however many stories now have text', async () => {
    const stories = Array.from({ length: 30 }, (_, i) => story({ id: `x${i}` }))
    const ev = evidence([], stories.map((s): [string, RowTextState] => [s.id, state({ enrichedAt: hoursAgo(1), hasText: true })]))
    const { d, log } = deps(stories, { loadEvidence: async () => ev })
    await runStorySummaries(d)
    expect(log.asked).toHaveLength(20)
  })
})

// ─── The run ────────────────────────────────────────────────────────────────

const RICH = 'Clayton Dubilier & Rice and McKesson signed a definitive agreement to take Option Care Health private for $32.05 per share in cash, an enterprise value of about $5.8 billion. The company will stay under its existing management team after the deal closes. Closing needs approval from stockholders and regulators and is expected in the first half of calendar 2027.'
const richRow = (id: string): SourceRow => ({ id, title: `Deal ${id}`, description: RICH, full_text: null, source_name: 'PE Hub', published_date: '2026-10-08' })
const thinRow = (id: string): SourceRow => ({ id, title: `Deal ${id}`, description: `Deal ${id} PE Hub`, full_text: null, source_name: 'PE Hub', published_date: '2026-10-08' })

const usage = { input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 1000 }
const written = (summary = 'A long summary.'): WriteOutcome => ({ status: 'written', summary, unsupported: [], usage, model: 'claude-sonnet-5-5' })
const rejected: WriteOutcome = { status: 'rejected', reason: 'failed names', summary: 'x', failures: [{ check: 'names', detail: 'd' }], usage, model: 'claude-sonnet-5-5' }

function deps(stories: ReturnType<typeof story>[], over: Partial<JobDeps> & { thin?: string[]; marks?: [string, SummaryStatus][] } = {}) {
  const log = { asked: [] as string[], written: [] as [string, string][], status: [] as [string, string][] }
  const thinIds = new Set(over.thin ?? [])
  const d: JobDeps = {
    loadStories: async () => stories,
    loadMarks: async () => marks(over.marks ?? []),
    loadRows: async (memberIds) => memberIds.map((id) => (thinIds.has(id) ? thinRow(id) : richRow(id))),
    write: async (rows) => { log.asked.push(rows[0].id); return written() },
    saveWritten: async (id, summary) => { log.written.push([id, summary]) },
    saveStatus: async (id, status) => { log.status.push([id, status]) },
    now: () => NOW,
    ...over,
  }
  return { d, log }
}

describe('runStorySummaries', () => {
  it('makes at most 20 model calls however many stories wait', async () => {
    const stories = Array.from({ length: 35 }, (_, i) => story({ firstSeen: hoursAgo(1 + i / 10) }))
    const { d, log } = deps(stories)
    const r = await runStorySummaries(d)
    expect(log.asked).toHaveLength(20)
    expect(r).toMatchObject({ candidates: 35, calls: 20, written: 20, stoppedBy: 'cap' })
    expect(log.written).toHaveLength(20)
  })
  it('a cap passed in can only lower it', async () => {
    const stories = Array.from({ length: 30 }, () => story())
    const lower = deps(stories)
    expect((await runStorySummaries(lower.d, { cap: 3 })).calls).toBe(3)
    const higher = deps(stories)
    expect((await runStorySummaries(higher.d, { cap: 500 })).calls).toBe(20)
  })
  it('writes in the order selectStories gives, and stores each on the story’s best row', async () => {
    const old = story({ id: 'old', members: ['old', 'old-2'], firstSeen: hoursAgo(30) })
    const today = story({ id: 'today', members: ['today', 'today-2'], firstSeen: hoursAgo(2) })
    const { d, log } = deps([old, today])
    await runStorySummaries(d)
    expect(log.written.map(([id]) => id)).toEqual(['today', 'old'])
  })
  it('marks a thin story thin without a model call, and thin stories do not use the cap', async () => {
    const stories = Array.from({ length: 12 }, (_, i) => story({ id: `t${i}`, firstSeen: hoursAgo(1 + i / 100) }))
    const thin = stories.slice(0, 8).map((s) => s.id)
    const { d, log } = deps(stories, { thin })
    const r = await runStorySummaries(d, { cap: 3 })
    expect(log.status.filter(([, s]) => s === 'thin')).toHaveLength(8)
    expect(log.asked).toHaveLength(3)
    expect(r).toMatchObject({ thin: 8, calls: 3, written: 3 })
  })
  it('looks at no more than 60 stories in a run', async () => {
    const stories = Array.from({ length: 100 }, () => story())
    const { d, log } = deps(stories, { thin: stories.map((s) => s.id) })
    const r = await runStorySummaries(d)
    expect(MAX_EXAMINED_PER_RUN).toBe(60)
    expect(r).toMatchObject({ examined: 60, thin: 60, calls: 0, stoppedBy: 'examined' })
    expect(log.asked).toHaveLength(0)
  })
  it('discards an answer that fails a check, stores nothing, and marks the story for one retry', async () => {
    const s = story()
    const { d, log } = deps([s], { write: async () => rejected })
    const r = await runStorySummaries(d)
    expect(log.written).toEqual([])
    expect(log.status).toEqual([[s.id, 'retry']])
    expect(r).toMatchObject({ rejected: 1, written: 0, givenUp: 0 })
  })
  it('gives up when the retry fails too', async () => {
    const s = story()
    const { d, log } = deps([s], { write: async () => rejected, marks: [[s.id, 'retry']] })
    const r = await runStorySummaries(d)
    expect(log.status).toEqual([[s.id, 'failed']])
    expect(r.givenUp).toBe(1)
  })
  it('a retry that passes is stored', async () => {
    const s = story()
    const { d, log } = deps([s], { marks: [[s.id, 'retry']] })
    await runStorySummaries(d)
    expect(log.written).toEqual([[s.id, 'A long summary.']])
    expect(log.status).toEqual([])
  })
  it('stops on an API outage and marks nothing for the story it was on', async () => {
    const stories = [story(), story(), story()]
    const { d, log } = deps(stories, { write: async () => { throw new StorySummaryApiError('Claude API 402', 402) } })
    const r = await runStorySummaries(d)
    expect(r).toMatchObject({ aborted: true, stoppedBy: 'api_outage', calls: 1 })
    expect(log.status).toEqual([])
    expect(r.errors[0]).toContain('402')
  })
  it('goes on after a bad request for one story', async () => {
    const stories = [story({ id: 'bad', firstSeen: hoursAgo(1) }), story({ id: 'good', firstSeen: hoursAgo(2) })]
    const { d, log } = deps(stories, { write: async (rows) => { if (rows[0].id === 'bad') throw new StorySummaryApiError('Claude API 400', 400); return written() } })
    const r = await runStorySummaries(d)
    expect(r.aborted).toBe(false)
    expect(log.written.map(([id]) => id)).toEqual(['good'])
    expect(log.status).toEqual([])
  })
  it('stops when the time budget is spent', async () => {
    let t = NOW
    const stories = Array.from({ length: 5 }, () => story())
    const { d } = deps(stories, { now: () => (t += 100_000), write: async () => written() })
    const r = await runStorySummaries(d, { budgetMs: 150_000 })
    expect(r.stoppedBy).toBe('budget')
    expect(r.calls).toBeLessThan(5)
  })
  it('adds up the tokens', async () => {
    const { d } = deps([story(), story()])
    const r = await runStorySummaries(d)
    expect(r.tokens).toEqual({ input_tokens: 200, output_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 2000 })
  })
  it('does nothing with nothing to do', async () => {
    const { d } = deps([])
    expect(await runStorySummaries(d)).toMatchObject({ candidates: 0, calls: 0, stoppedBy: 'queue_empty' })
  })
})
