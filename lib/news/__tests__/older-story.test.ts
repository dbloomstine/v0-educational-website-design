import { describe, it, expect, vi } from 'vitest'
import { fetchDayStories, fetchOlderStory, firmWindow, olderRails, shiftDay, DAY_ROW_LIMIT, OLDER_DAYS_EITHER_SIDE, OLDER_ROW_LIMIT } from '../older-story'
import { buildStories, type Story } from '../stories'
import { SECTION_BY_SLUG } from '../sections'

vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({}) }))

let seq = 0
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(o: Record<string, any>) {
  const { firm, fund, size, close, ...rest } = o
  return {
    id: uuid(),
    source_url: `https://example.com/${seq}`,
    source_name: 'PE Hub',
    published_date: '2026-09-10',
    created_at: '2026-09-10T14:00:00Z',
    fund_categories: ['PE'],
    is_high_signal: true,
    relevance_score: 0.8,
    tldr: `${firm ?? 'The firm'} announced the news described in the headline.`,
    article_type: rest.event_type,
    entities_raw: [firm].filter(Boolean).map((name: string) => ({ name, type: 'firm', role: null, confidence: 0.95 })),
    extracted_data: { firm_name: firm ?? null, fund_name: fund ?? null, fund_size_usd_millions: size ?? null, close_type: close ?? null },
    ...rest,
  }
}

/**
 * A stand-in for the query builder. Each `from()` starts a query that answers
 * with the next result in the queue; every call on it is kept, per query.
 */
function fakeDb(results: { data?: unknown; error?: { message: string } | null }[]) {
  const queries: [string, unknown[]][][] = []
  const db = {
    from: (table: string) => {
      const calls: [string, unknown[]][] = [['from', [table]]]
      queries.push(calls)
      const result = results[queries.length - 1] ?? { data: [] }
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'gte', 'lt', 'lte', 'or', 'in', 'not', 'order', 'limit', 'range']) {
        chain[m] = (...args: unknown[]) => { calls.push([m, args]); return chain }
      }
      const answer = { data: result.data ?? null, error: result.error ?? null }
      chain.maybeSingle = () => { calls.push(['maybeSingle', []]); return Promise.resolve({ data: Array.isArray(result.data) ? (result.data[0] ?? null) : (result.data ?? null), error: result.error ?? null }) }
      chain.then = (resolve: (r: unknown) => void) => resolve(answer)
      return chain
    },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: db as any, queries }
}
const called = (q: [string, unknown[]][], name: string) => q.filter(([m]) => m === name).map(([, a]) => a)

const OWN = row({ title: 'Ares Management closes $7bn credit fund', event_type: 'fund_close', firm: 'Ares Management', fund: 'Ares Credit Fund III', size: 7000, close: 'final_close', fund_categories: ['credit'], source_name: 'PE Hub' })
const OTHER_OUTLET = row({ title: 'Ares Management raises $7 billion for its third credit fund', event_type: 'fund_close', firm: 'Ares Management', fund: 'Ares Credit Fund III', size: 7000, close: 'final_close', fund_categories: ['credit'], source_name: 'Reuters', published_date: '2026-09-11', created_at: '2026-09-11T09:00:00Z' })
const OTHER_STORY = row({ title: 'Ares Management hires Dana Lee as head of investor relations', event_type: 'executive_hire', firm: 'Ares Management', fund_categories: ['credit'], published_date: '2026-09-13', created_at: '2026-09-13T09:00:00Z', tldr: 'Ares Management hired Dana Lee as head of investor relations.' })

describe('an older story', () => {
  it('is built from its own row and the same firm’s rows a few days either side', async () => {
    const { db, queries } = fakeDb([{ data: [OWN] }, { data: [OWN, OTHER_OUTLET, OTHER_STORY] }])
    const found = await fetchOlderStory(db, OWN.id)
    expect(found).not.toBeNull()
    const { story, siblings } = found!
    // The other outlet is found and clustered into the story by the site's own test…
    expect(story.source).toBe('Reuters') // the better desk leads, as on the fronts
    expect(story.coverage.map((c) => c.source)).toEqual(['PE Hub'])
    expect(story.memberIds).toHaveLength(2)
    expect(story.memberIds).toContain(OTHER_OUTLET.id)
    // …and the same firm's different story is a sibling, not a member.
    expect(siblings.map((s) => s.headline)).toEqual(['Ares Management hires Dana Lee as head of investor relations'])
    expect(queries).toHaveLength(2)
  })

  it('asks the database two bounded questions: the row by key, then one firm in nine days with a limit', async () => {
    const { db, queries } = fakeDb([{ data: [OWN] }, { data: [OWN] }])
    await fetchOlderStory(db, OWN.id)
    const [byKey, near] = queries
    expect(called(byKey, 'eq')).toContainEqual(['id', OWN.id])
    expect(called(byKey, 'maybeSingle')).toHaveLength(1)

    // 2026-09-10 ± 4 days, the end exclusive.
    expect(called(near, 'gte')).toEqual([['published_date', '2026-09-06']])
    expect(called(near, 'lt')).toEqual([['published_date', '2026-09-15']])
    expect(OLDER_DAYS_EITHER_SIDE).toBe(4)
    expect(called(near, 'limit')).toEqual([[OLDER_ROW_LIMIT]])
    expect(OLDER_ROW_LIMIT).toBeLessThanOrEqual(100)
    // The fronts' own filters, so the same rows are stories (and the pool index applies).
    expect(called(near, 'eq')).toEqual([['classification_status', 'complete'], ['is_duplicate', false]])
    expect(called(near, 'in')[0][0]).toBe('article_type')
    // The firm, by its name column and the form firm pages use (the trigram index serves it).
    const firmFilter = called(near, 'or').map((a) => String(a[0])).find((f) => f.startsWith('extracted_data->>firm_name.imatch'))
    expect(firmFilter).toContain('ares')
    expect(called(near, 'order')[0]).toEqual(['published_date', { ascending: false }])
  })

  it('does not ask for neighbours when the row names no firm: it is the one row, as before', async () => {
    const lone = row({ title: 'SEC proposes widening retail access to private markets', event_type: 'regulatory_action', firm: null, fund_categories: ['service_provider'], tldr: 'SEC proposed rule amendments to widen retail access.' })
    const { db, queries } = fakeDb([{ data: [lone] }])
    const found = await fetchOlderStory(db, lone.id)
    expect(found?.story.memberIds).toEqual([lone.id])
    expect(found?.siblings).toEqual([])
    expect(queries).toHaveLength(1)
  })

  it('opens from any member’s id, and a neighbour query that missed the row itself still includes it', async () => {
    const { db } = fakeDb([{ data: [OTHER_OUTLET] }, { data: [OWN] }])
    const found = await fetchOlderStory(db, OTHER_OUTLET.id)
    expect(found?.story.memberIds).toEqual(expect.arrayContaining([OWN.id, OTHER_OUTLET.id]))
  })

  it('is nothing when there is no such row, and throws (to be retried, not cached) when a lookup fails', async () => {
    expect(await fetchOlderStory(fakeDb([{ data: null }]).db, OWN.id)).toBeNull()
    await expect(fetchOlderStory(fakeDb([{ error: { message: 'timeout' } }]).db, OWN.id)).rejects.toThrow('timeout')
    await expect(fetchOlderStory(fakeDb([{ data: [OWN] }, { error: { message: 'statement timeout' } }]).db, OWN.id)).rejects.toThrow('statement timeout')
  })

  it('reads no neighbours for a firm name that cannot be a lookup', () => {
    expect(firmWindow('', '2026-09-10')).toBeNull()
    expect(firmWindow('Ares Management', '')).toBeNull()
    expect(firmWindow(undefined, '2026-09-10')).toBeNull()
    expect(firmWindow('Ares Management', '2026-09-10')).toMatchObject({ from: '2026-09-06', before: '2026-09-15', key: 'ares' })
  })

  it('shifts days without the clock', () => {
    expect(shiftDay('2026-10-01', -4)).toBe('2026-09-27')
    expect(shiftDay('2026-12-30T10:00:00Z', 5)).toBe('2027-01-04')
    expect(shiftDay('soon', 1)).toBeNull()
  })
})

describe('the rails under an older story', () => {
  const stories = buildStories([OWN, OTHER_OUTLET, OTHER_STORY])
  const story = stories.find((s) => s.kind === 'fundraising') as Story
  const hire = stories.find((s) => s.kind === 'people') as Story

  const dayRows = [
    row({ title: 'Blue Owl closes $3bn credit fund', event_type: 'fund_close', firm: 'Blue Owl', size: 3000, close: 'final_close', fund_categories: ['credit'], published_date: '2026-09-10' }),
    row({ title: 'Kayne Anderson raises $1bn for direct lending', event_type: 'fund_close', firm: 'Kayne Anderson', size: 1000, close: 'final_close', fund_categories: ['credit'], published_date: '2026-09-10' }),
    row({ title: 'EQT closes $5bn infrastructure fund', event_type: 'fund_close', firm: 'EQT', size: 5000, close: 'final_close', fund_categories: ['infrastructure'], published_date: '2026-09-10' }),
  ]
  const day = buildStories(dayRows)
  const section = SECTION_BY_SLUG.get('private-credit')

  it('show the firm’s stories from around then and the section on the story’s day', () => {
    const { sameFirm, moreInSection } = olderRails(story, [hire], day, section)
    expect(sameFirm.map((s) => s.id)).toEqual([hire.id])
    expect(moreInSection.map((s) => s.headline).sort()).toEqual(['Blue Owl closes $3bn credit fund', 'Kayne Anderson raises $1bn for direct lending'])
  })

  it('never fill from anywhere else: with nothing related they are empty, and the page leaves them out', () => {
    expect(olderRails(story, [], [], section)).toEqual({ sameFirm: [], moreInSection: [] })
    // A section with no stories on the day is empty, not filled from another section.
    const infra = SECTION_BY_SLUG.get('hedge-funds')
    expect(olderRails(story, [], day, infra).moreInSection).toEqual([])
    // No section at all: no section rail.
    expect(olderRails(story, [], day, undefined).moreInSection).toEqual([])
  })

  it('leave the story itself and its own outlets out of them', () => {
    const rails = olderRails(story, [story, hire], [...day, story], section)
    expect(rails.sameFirm.map((s) => s.id)).not.toContain(story.id)
    expect(rails.moreInSection.map((s) => s.id)).not.toContain(story.id)
  })

  it('leave out a story of another firm that was passed as a sibling', () => {
    const other = day[0]
    expect(olderRails(story, [other], [], section).sameFirm).toEqual([])
  })
})

describe('a day’s stories', () => {
  it('are one query: that day, most relevant first, at most DAY_ROW_LIMIT rows', async () => {
    const { db, queries } = fakeDb([{ data: [OWN] }])
    const stories = await fetchDayStories(db, '2026-09-10')
    expect(stories).toHaveLength(1)
    expect(queries).toHaveLength(1)
    const [q] = queries
    expect(called(q, 'gte')).toEqual([['published_date', '2026-09-10']])
    expect(called(q, 'lt')).toEqual([['published_date', '2026-09-11']])
    expect(called(q, 'order')).toEqual([['published_date', { ascending: false }], ['relevance_score', { ascending: false }]])
    expect(called(q, 'limit')).toEqual([[DAY_ROW_LIMIT]])
    expect(called(q, 'eq')).toEqual([['classification_status', 'complete'], ['is_duplicate', false]])
  })

  it('are none for something that is not a day, and throw when the query fails', async () => {
    expect(await fetchDayStories(fakeDb([]).db, 'yesterday')).toEqual([])
    await expect(fetchDayStories(fakeDb([{ error: { message: 'boom' } }]).db, '2026-09-10')).rejects.toThrow('boom')
  })
})
