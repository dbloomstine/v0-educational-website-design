import { describe, it, expect } from 'vitest'
import {
  FETCH_FAILED, FETCH_FAILED_AGAIN, MAX_FETCHES_PER_HOST, MAX_FETCHES_PER_RUN, planFetches, rowBlocker, runStoryTextPass, selectTargets,
  type TextPassDeps,
} from '../enrich-stories'
import type { BodyResult } from '../enrich-articles'
import type { FetchRow } from '../story-text-store'
import type { SummaryStatus } from '../story-summary-store'

const NOW = new Date('2026-10-08T14:00:00Z').getTime()
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
function row(id: string, o: Partial<FetchRow> = {}): FetchRow {
  return {
    id, sourceUrl: `https://news-${id}.example.com/a/${id}`, description: 'A short teaser.', createdAt: hoursAgo(3),
    enrichedAt: null, enrichmentError: null, hasText: false, ...o,
  }
}
const rowMap = (rows: FetchRow[]) => new Map(rows.map((r) => [r.id, r]))
const marks = (entries: [string, SummaryStatus][] = []) => new Map(entries)
const ids = (xs: { id: string }[]) => xs.map((x) => x.id)

describe('selectTargets', () => {
  it('takes untried and thin stories from the last 48 hours, not written, retried or given-up ones, roundups or older ones', () => {
    const untried = story({ id: 'untried' })
    const thin = story({ id: 'thin' })
    const written = story({ id: 'written' })
    const retry = story({ id: 'retry' })
    const failed = story({ id: 'failed' })
    const wire = story({ id: 'wire', roundup: true })
    const old = story({ id: 'old', firstSeen: hoursAgo(50) })
    const picked = selectTargets([untried, thin, written, retry, failed, wire, old], marks([['thin', 'thin'], ['written', 'written'], ['retry', 'retry'], ['failed', 'failed']]), NOW)
    expect(ids(picked).sort()).toEqual(['thin', 'untried'])
  })
  it('puts the newer day first, then the story with more outlets', () => {
    const todayBig = story({ firstSeen: '2026-10-08T05:00:00Z', outlets: 9 })
    const todayNew = story({ firstSeen: '2026-10-08T12:00:00Z', outlets: 2 })
    const yesterdayHuge = story({ firstSeen: '2026-10-07T20:00:00Z', outlets: 30 })
    expect(ids(selectTargets([yesterdayHuge, todayNew, todayBig], marks(), NOW))).toEqual([todayBig.id, todayNew.id, yesterdayHuge.id])
  })
})

describe('rowBlocker: which rows may be fetched', () => {
  it('lets an untried complete row of the last 48 hours through', () => {
    expect(rowBlocker(row('a'), NOW)).toBeNull()
  })
  it('never lets a paywalled host through, nor a subdomain of one, nor a Google News redirect', () => {
    expect(rowBlocker(row('a', { sourceUrl: 'https://www.pehub.com/deal/' }), NOW)).toBe('paywalled')
    expect(rowBlocker(row('a', { sourceUrl: 'https://news.pehub.com/deal/' }), NOW)).toBe('paywalled')
    expect(rowBlocker(row('a', { sourceUrl: 'https://www.altassets.net/x' }), NOW)).toBe('paywalled')
    expect(rowBlocker(row('a', { sourceUrl: 'https://news.google.com/rss/articles/CBMi' }), NOW)).toBe('google news redirect')
    expect(rowBlocker(row('a', { sourceUrl: 'mailto:x@y.com' }), NOW)).toBe('not a web address')
    expect(rowBlocker(row('a', { sourceUrl: 'https://www.jdsupra.com/legalnews/x' }), NOW)).toBe('yields no text')
  })
  it('leaves rows that already have text, a long enough feed body, or are older than 48 hours', () => {
    expect(rowBlocker(row('a', { hasText: true }), NOW)).toBe('has text')
    expect(rowBlocker(row('a', { description: 'x'.repeat(700) }), NOW)).toBe('feed text is long enough')
    expect(rowBlocker(row('a', { createdAt: hoursAgo(49) }), NOW)).toBe('too old')
  })
  it('does not ask again for a row already tried, whatever the outcome', () => {
    for (const err of ['extracted only 12 chars', 'paywall wall detected', 'disallowed by robots.txt', FETCH_FAILED_AGAIN, null]) {
      expect(rowBlocker(row('a', { enrichedAt: hoursAgo(10), enrichmentError: err }), NOW)).toBe('already tried')
    }
  })
  it('asks once more for a page that would not load, but not at once', () => {
    expect(rowBlocker(row('a', { enrichedAt: hoursAgo(1), enrichmentError: FETCH_FAILED }), NOW)).toBe('already tried')
    expect(rowBlocker(row('a', { enrichedAt: hoursAgo(4), enrichmentError: FETCH_FAILED }), NOW)).toBeNull()
  })
})

describe('planFetches', () => {
  it('fetches the first story in the order given first, and takes at most two rows of a story', () => {
    const a = story({ id: 'a', members: ['a1', 'a2', 'a3'] })
    const b = story({ id: 'b', members: ['b1'] })
    const plan = planFetches([a, b], rowMap([row('a1'), row('a2'), row('a3'), row('b1')]), NOW)
    expect(plan.map((p) => p.storyId)).toEqual(['a', 'a', 'b'])
    expect(plan.filter((p) => p.storyId === 'a')).toHaveLength(2)
  })
  it('prefers rows from different outlets within a story, newer first', () => {
    const a = story({ id: 'a', members: ['a1', 'a2', 'a3'] })
    const rows = rowMap([
      row('a1', { sourceUrl: 'https://one.example.com/1', createdAt: hoursAgo(1) }),
      row('a2', { sourceUrl: 'https://one.example.com/2', createdAt: hoursAgo(2) }),
      row('a3', { sourceUrl: 'https://two.example.org/3', createdAt: hoursAgo(5) }),
    ])
    expect(planFetches([a], rows, NOW).map((p) => p.rowId)).toEqual(['a1', 'a3'])
  })
  it('never plans a paywalled host, a Google News redirect, a tried row or a row that has text', () => {
    const s = story({ id: 's', members: ['p', 'g', 't', 'x', 'ok'] })
    const rows = rowMap([
      row('p', { sourceUrl: 'https://www.privateequityinternational.com/a' }),
      row('g', { sourceUrl: 'https://news.google.com/rss/articles/CBMi' }),
      row('t', { enrichedAt: hoursAgo(5), enrichmentError: 'extracted only 0 chars' }),
      row('x', { hasText: true }),
      row('ok', { sourceUrl: 'https://www.investmentweek.co.uk/a' }),
    ])
    expect(planFetches([s], rows, NOW).map((p) => p.rowId)).toEqual(['ok'])
  })
  it('asks one host for no more than three pages in a run', () => {
    const stories = Array.from({ length: 8 }, (_, i) => story({ id: `s${i}`, members: [`r${i}`] }))
    const rows = rowMap(stories.map((s, i) => row(`r${i}`, { sourceUrl: `https://www.investmentweek.co.uk/a${i}` })))
    const plan = planFetches(stories, rows, NOW)
    expect(MAX_FETCHES_PER_HOST).toBe(3)
    expect(plan).toHaveLength(3)
    expect(ids(plan.map((p) => ({ id: p.rowId })))).toEqual(['r0', 'r1', 'r2'])
  })
  it('skips a host that is full and goes on to the next story', () => {
    const stories = [0, 1, 2, 3, 4].map((i) => story({ id: `s${i}`, members: [`r${i}`], firstSeen: hoursAgo(1 + i / 10) }))
    const rows = rowMap([
      row('r0', { sourceUrl: 'https://a.example.com/0' }), row('r1', { sourceUrl: 'https://a.example.com/1' }),
      row('r2', { sourceUrl: 'https://a.example.com/2' }), row('r3', { sourceUrl: 'https://a.example.com/3' }),
      row('r4', { sourceUrl: 'https://b.example.org/4' }),
    ])
    expect(planFetches(stories, rows, NOW).map((p) => p.rowId)).toEqual(['r0', 'r1', 'r2', 'r4'])
  })
  it('plans no more than forty pages in a run, and a limit passed in can only lower that', () => {
    const stories = Array.from({ length: 80 }, (_, i) => story({ id: `s${i}`, members: [`r${i}`] }))
    const rows = rowMap(stories.map((s, i) => row(`r${i}`, { sourceUrl: `https://host${i}.example.com/a` })))
    expect(MAX_FETCHES_PER_RUN).toBe(40)
    expect(planFetches(stories, rows, NOW)).toHaveLength(40)
    expect(planFetches(stories, rows, NOW, { maxFetches: 5 })).toHaveLength(5)
    expect(planFetches(stories, rows, NOW, { maxFetches: 500 })).toHaveLength(40)
  })
  it('marks a second try of a failed page as a retry', () => {
    const s = story({ id: 's', members: ['r'] })
    const plan = planFetches([s], rowMap([row('r', { enrichedAt: hoursAgo(5), enrichmentError: FETCH_FAILED })]), NOW)
    expect(plan.map((p) => p.retry)).toEqual([true])
  })
})

// ─── The run ────────────────────────────────────────────────────────────────

const GOOD: BodyResult = { ok: true, text: 'Ardian closed its ninth secondaries fund at twenty billion dollars. '.repeat(10) }

function run(stories: ReturnType<typeof story>[], rows: FetchRow[], over: Partial<TextPassDeps> & { markList?: [string, SummaryStatus][] } = {}) {
  const log = { fetched: [] as string[], saved: [] as [string, string | null, string | null][] }
  const d: TextPassDeps = {
    loadStories: async () => stories,
    loadMarks: async () => marks(over.markList ?? []),
    loadRows: async (want) => rows.filter((r) => want.includes(r.id)),
    fetchBody: async (url) => { log.fetched.push(url); return GOOD },
    saveResult: async (id, text, error) => { log.saved.push([id, text, error]) },
    now: () => NOW,
    ...over,
  }
  return { d, log }
}

describe('runStoryTextPass', () => {
  it('stores the text of a fetched row and counts it', async () => {
    const s = story({ id: 's', members: ['r'] })
    const { d, log } = run([s], [row('r')])
    const r = await runStoryTextPass(d)
    expect(log.saved).toEqual([['r', GOOD.ok ? GOOD.text : '', null]])
    expect(r).toMatchObject({ stories: 1, planned: 1, fetched: 1, withText: 1, failed: 0, stoppedBy: 'done' })
  })
  it('never calls the fetcher for a paywalled host or a Google News redirect', async () => {
    const s = story({ id: 's', members: ['p', 'g', 'n'] })
    const rows = [
      row('p', { sourceUrl: 'https://www.pehub.com/a' }),
      row('g', { sourceUrl: 'https://news.google.com/rss/articles/CBMi' }),
      row('n', { sourceUrl: 'https://www.techcrunch.com/a' }),
    ]
    const { d, log } = run([s], rows)
    await runStoryTextPass(d)
    expect(log.fetched).toEqual(['https://www.techcrunch.com/a'])
  })
  it('makes no more than forty requests, and three to a host, whatever waits', async () => {
    const stories = Array.from({ length: 100 }, (_, i) => story({ id: `s${i}`, members: [`r${i}`] }))
    const rows = stories.map((s, i) => row(`r${i}`, { sourceUrl: `https://host${i % 20}.example.com/a${i}` }))
    const { d, log } = run(stories, rows)
    const r = await runStoryTextPass(d)
    expect(log.fetched).toHaveLength(40)
    expect(r.fetched).toBe(40)
    expect(Math.max(...Object.values(r.perHost))).toBeLessThanOrEqual(3)
  })
  it('marks a failed fetch with its reason, so it is not retried at once', async () => {
    const s = story({ id: 's', members: ['r'] })
    const stored = row('r')
    const { d, log } = run([s], [stored], { fetchBody: async () => ({ ok: false, outcome: 'failed', reason: FETCH_FAILED }) })
    const r = await runStoryTextPass(d)
    expect(log.saved).toEqual([['r', null, FETCH_FAILED]])
    expect(r).toMatchObject({ failed: 1, withText: 0 })
    // The row as the database now holds it is not selected an hour later.
    const after = { ...stored, enrichedAt: new Date(NOW).toISOString(), enrichmentError: FETCH_FAILED }
    expect(rowBlocker(after, NOW + 3_600_000)).toBe('already tried')
    const again = run([s], [after])
    expect((await runStoryTextPass({ ...again.d, now: () => NOW + 3_600_000 })).planned).toBe(0)
  })
  it('on a second failure writes "fetch failed again", which nothing selects', async () => {
    const s = story({ id: 's', members: ['r'] })
    const earlier = row('r', { enrichedAt: hoursAgo(5), enrichmentError: FETCH_FAILED })
    const { d, log } = run([s], [earlier], { fetchBody: async () => ({ ok: false, outcome: 'failed', reason: FETCH_FAILED }) })
    await runStoryTextPass(d)
    expect(log.saved).toEqual([['r', null, FETCH_FAILED_AGAIN]])
    expect(rowBlocker({ ...earlier, enrichmentError: FETCH_FAILED_AGAIN }, NOW + 86_400_000, 1000)).toBe('already tried')
  })
  it('records a page that was refused or too short as skipped and stores no text', async () => {
    const s = story({ id: 's', members: ['r'] })
    const { d, log } = run([s], [row('r')], { fetchBody: async () => ({ ok: false, outcome: 'skipped', reason: 'extracted only 20 chars' }) })
    const r = await runStoryTextPass(d)
    expect(log.saved).toEqual([['r', null, 'extracted only 20 chars']])
    expect(r).toMatchObject({ skipped: 1, failed: 0 })
  })
  it('stops when the time budget is spent', async () => {
    let t = NOW
    const stories = Array.from({ length: 10 }, (_, i) => story({ id: `s${i}`, members: [`r${i}`] }))
    const rows = stories.map((s, i) => row(`r${i}`, { sourceUrl: `https://host${i}.example.com/a` }))
    const { d } = run(stories, rows, { now: () => (t += 100_000) })
    const r = await runStoryTextPass(d, { budgetMs: 150_000 })
    expect(r.stoppedBy).toBe('budget')
    expect(r.fetched).toBeLessThan(10)
  })
  it('does nothing with no stories', async () => {
    const { d, log } = run([], [])
    expect(await runStoryTextPass(d)).toMatchObject({ stories: 0, planned: 0, stoppedBy: 'queue_empty' })
    expect(log.fetched).toEqual([])
  })
})
