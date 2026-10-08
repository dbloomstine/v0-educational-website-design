import { describe, it, expect, vi } from 'vitest'
import {
  ARCHIVE_MAX_PAGE, ARCHIVE_PAGE_SIZE, SITEMAP_STORY_CAP, archiveHref, fetchArchiveMonth, fetchArchiveSpan, fetchSitemapStories,
  firstSentence, isArchiveMonth, monthBounds, monthLabel, monthsBetween, parseArchivePath, shiftMonth, toEntry,
} from '../archive'

vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({}) }))
vi.mock('@/lib/cache/build-once', () => ({ buildOnce: (_key: string, build: () => unknown) => build() }))

/** A stand-in for the query builder: each `from()` answers with the next result in the queue, and its calls are kept. */
function fakeDb(results: { data?: unknown; error?: { message: string } | null }[]) {
  const queries: [string, unknown[]][][] = []
  const db = {
    from: (table: string) => {
      const calls: [string, unknown[]][] = [['from', [table]]]
      queries.push(calls)
      const result = results[queries.length - 1] ?? { data: [] }
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'gte', 'lt', 'not', 'order', 'limit', 'range']) {
        chain[m] = (...args: unknown[]) => { calls.push([m, args]); return chain }
      }
      chain.then = (resolve: (r: unknown) => void) => resolve({ data: result.data ?? null, error: result.error ?? null })
      return chain
    },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: db as any, queries }
}
const called = (q: [string, unknown[]][], name: string) => q.filter(([m]) => m === name).map(([, a]) => a)

const LONG = 'Conversant Capital has closed its first real estate fund at $705 million, 40% above its target.\n\nLaw360 puts the close at $845 million.'
const dbRow = (i: number, extra: Record<string, unknown> = {}) => ({
  id: `id-${i}`, title: `Headline ${i}`, tldr: null, source_name: 'AltAssets', published_date: '2026-10-09', summary_long: LONG, firm: 'Conversant Capital', ...extra,
})

describe('archive months', () => {
  it('are named, shifted and listed newest first', () => {
    expect(monthLabel('2026-10')).toBe('October 2026')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(monthsBetween('2026-10', '2027-01')).toEqual(['2027-01', '2026-12', '2026-11', '2026-10'])
    expect(monthsBetween('2027-01', '2026-10')).toEqual([])
    expect(monthBounds('2026-12')).toEqual({ from: '2026-12-01', before: '2027-01-01' })
    expect(archiveHref('2026-10')).toBe('/archive/2026-10')
    expect(archiveHref('2026-10', 3)).toBe('/archive/2026-10/3')
  })

  it('exist from the first month to the present, and nowhere else', () => {
    const now = Date.parse('2026-11-15T12:00:00Z')
    expect(isArchiveMonth('2026-10', now)).toBe(true)
    expect(isArchiveMonth('2026-11', now)).toBe(true)
    expect(isArchiveMonth('2026-12', now)).toBe(false) // not yet
    expect(isArchiveMonth('2026-09', now)).toBe(false) // before any summary was written
    expect(isArchiveMonth('2026-13', now)).toBe(false)
    expect(isArchiveMonth('2026-1', now)).toBe(false)
    expect(isArchiveMonth("2026-10'; drop table", now)).toBe(false)
  })

  it('are read from a path without a query: a month, and a page number after the first', () => {
    const now = Date.parse('2026-11-15T12:00:00Z')
    expect(parseArchivePath('2026-10', undefined, now)).toEqual({ month: '2026-10', page: 1 })
    expect(parseArchivePath('2026-10', [], now)).toEqual({ month: '2026-10', page: 1 })
    expect(parseArchivePath('2026-10', ['2'], now)).toEqual({ month: '2026-10', page: 2 })
    expect(parseArchivePath('2026-10', ['1'], now)).toEqual({ redirect: '/archive/2026-10' })
    // Everything else is a 404 and costs no query.
    for (const bad of [['0'], ['02'], ['-1'], ['2', '3'], ['page'], [String(ARCHIVE_MAX_PAGE + 1)], ['1000']]) expect(parseArchivePath('2026-10', bad, now), bad.join('/')).toBeNull()
    expect(parseArchivePath('2026-10', [String(ARCHIVE_MAX_PAGE)], now)).toEqual({ month: '2026-10', page: ARCHIVE_MAX_PAGE })
    expect(parseArchivePath('2019-03', undefined, now)).toBeNull()
    expect(parseArchivePath('2027-01', undefined, now)).toBeNull()
  })
})

describe('the first sentence of a summary', () => {
  it('stops at the first real full stop', () => {
    expect(firstSentence(LONG.split('\n\n')[0])).toBe('Conversant Capital has closed its first real estate fund at $705 million, 40% above its target.')
    expect(firstSentence('Apollo agreed to buy the firm for $1.2 billion. The deal is expected to close in 2027.')).toBe('Apollo agreed to buy the firm for $1.2 billion.')
    expect(firstSentence('Is it done? Yes. Next.')).toBe('Is it done?')
  })

  it('passes the stops in abbreviations and figures', () => {
    expect(firstSentence('Acme Capital Inc. Chairman Jo Park said the U.S. fund closed at $1.5 billion. It was oversubscribed.'))
      .toBe('Acme Capital Inc. Chairman Jo Park said the U.S. fund closed at $1.5 billion.')
    expect(firstSentence('The fund closed at $1.2 billion, up 3.5% on its target.')).toBe('The fund closed at $1.2 billion, up 3.5% on its target.')
  })

  it('takes a clause of 240 characters at a word when the first sentence runs on', () => {
    const long = `${'The firm said that the fund, which invests across the region, '.repeat(8)}closed.`
    const out = firstSentence(long)
    expect(out.length).toBeLessThanOrEqual(241)
    expect(out.endsWith('…')).toBe(true)
    expect(out.slice(0, -1).endsWith(' ')).toBe(false)
  })

  it('is empty for nothing', () => {
    expect(firstSentence(null)).toBe('')
    expect(firstSentence('  \n ')).toBe('')
  })
})

describe('an archive entry', () => {
  it('has the headline, date, firm and the first sentence of the fuller summary', () => {
    expect(toEntry(dbRow(1))).toEqual({
      id: 'id-1', headline: 'Headline 1', date: '2026-10-09', firm: 'Conversant Capital', source: 'AltAssets',
      blurb: 'Conversant Capital has closed its first real estate fund at $705 million, 40% above its target.',
    })
  })

  it('is left out when it has nothing to show', () => {
    expect(toEntry(dbRow(1, { summary_long: '  ' }))).toBeNull()
    expect(toEntry(dbRow(1, { title: '' }))).toBeNull()
    expect(toEntry(dbRow(1, { published_date: null }))).toBeNull()
    expect(toEntry(dbRow(1, { firm: ' ' }))?.firm).toBeNull()
  })
})

describe('a month of the archive', () => {
  it('is one indexed query: written rows in the month, newest first, one page and one more', async () => {
    const { db, queries } = fakeDb([{ data: Array.from({ length: ARCHIVE_PAGE_SIZE + 1 }, (_, i) => dbRow(i)) }])
    const page = await fetchArchiveMonth(db, '2026-10', 1)
    expect(queries).toHaveLength(1)
    const [q] = queries
    expect(called(q, 'eq')).toEqual([['summary_long_status', 'written']])
    expect(called(q, 'gte')).toEqual([['published_date', '2026-10-01']])
    expect(called(q, 'lt')).toEqual([['published_date', '2026-11-01']])
    expect(called(q, 'order')).toEqual([['published_date', { ascending: false }], ['id', { ascending: true }]])
    // LIMIT/OFFSET: fifty and one more, to know whether another page follows.
    expect(called(q, 'range')).toEqual([[0, ARCHIVE_PAGE_SIZE]])
    // The columns it shows, nothing wider (no full text, no extracted blob).
    expect(String(called(q, 'select')[0][0])).toBe('id, title, tldr, source_name, published_date, summary_long, firm:extracted_data->>firm_name')
    expect(page.entries).toHaveLength(ARCHIVE_PAGE_SIZE)
    expect(page.hasMore).toBe(true)
  })

  it('pages by offset, and knows the last page when it comes up short', async () => {
    const { db, queries } = fakeDb([{ data: [dbRow(1), dbRow(2)] }])
    const page = await fetchArchiveMonth(db, '2026-12', 3)
    expect(called(queries[0], 'range')).toEqual([[2 * ARCHIVE_PAGE_SIZE, 3 * ARCHIVE_PAGE_SIZE]])
    expect(called(queries[0], 'lt')).toEqual([['published_date', '2027-01-01']])
    expect(page.entries.map((e) => e.id)).toEqual(['id-1', 'id-2'])
    expect(page.hasMore).toBe(false)
  })

  it('is an empty month when it has no rows, and an error when the query fails', async () => {
    expect(await fetchArchiveMonth(fakeDb([{ data: [] }]).db, '2026-10', 1)).toEqual({ entries: [], hasMore: false })
    await expect(fetchArchiveMonth(fakeDb([{ error: { message: 'column news_items.summary_long_status does not exist' } }]).db, '2026-10', 1)).rejects.toThrow('does not exist')
  })
})

describe('the archive’s span', () => {
  it('is two one-row probes at either end of the index', async () => {
    const { db, queries } = fakeDb([{ data: [{ published_date: '2026-10-08' }] }, { data: [{ published_date: '2027-01-05' }] }])
    expect(await fetchArchiveSpan(db)).toEqual({ first: '2026-10', last: '2027-01', newestDay: '2027-01-05' })
    expect(queries).toHaveLength(2)
    expect(called(queries[0], 'order')).toEqual([['published_date', { ascending: true }]])
    expect(called(queries[1], 'order')).toEqual([['published_date', { ascending: false }]])
    for (const q of queries) {
      expect(called(q, 'limit')).toEqual([[1]])
      expect(called(q, 'eq')).toEqual([['summary_long_status', 'written']])
      expect(called(q, 'gte')).toEqual([['published_date', '2026-10-01']])
    }
  })

  it('is nothing before the first summary is written, and throws when a probe fails', async () => {
    expect(await fetchArchiveSpan(fakeDb([{ data: [] }, { data: [] }]).db)).toBeNull()
    await expect(fetchArchiveSpan(fakeDb([{ data: [] }, { error: { message: 'timeout' } }]).db)).rejects.toThrow('timeout')
  })
})

describe('the sitemap’s stories', () => {
  it('are one query for the newest written rows, capped, with three small columns', async () => {
    const { db, queries } = fakeDb([{ data: [{ id: 'a', published_date: '2026-10-09', summary_long_at: '2026-10-09T15:45:00Z' }, { id: 'b', published_date: '2026-10-08', summary_long_at: null }] }])
    const rows = await fetchSitemapStories(db)
    expect(rows).toEqual([{ id: 'a', date: '2026-10-09', at: '2026-10-09T15:45:00Z' }, { id: 'b', date: '2026-10-08', at: null }])
    const [q] = queries
    expect(queries).toHaveLength(1)
    expect(called(q, 'select')).toEqual([['id, published_date, summary_long_at']])
    expect(called(q, 'eq')).toEqual([['summary_long_status', 'written']])
    expect(called(q, 'order')[0]).toEqual(['published_date', { ascending: false }])
    expect(called(q, 'limit')).toEqual([[SITEMAP_STORY_CAP]])
  })

  it('stop at the cap even if the database were to return more', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, published_date: '2026-10-09', summary_long_at: null }))
    expect(await fetchSitemapStories(fakeDb([{ data: many }]).db, 5)).toHaveLength(5)
  })
})
