import { describe, it, expect, vi } from 'vitest'

// Fixed data, a month old: nothing here changed "now".
const story = (id: string, firm: string, firstSeen: string, extra: Record<string, unknown> = {}) => ({
  id, memberIds: [id], headline: `${firm} closes fund`, firmName: firm, firms: [firm], kind: 'fundraising', assetClasses: ['PE'],
  coverage: [{ source: 'PE Hub', url: 'https://example.com', headline: 'x' }], roundup: false, firstSeen, publishedDate: firstSeen.slice(0, 10),
  source: 'WSJ', url: 'https://example.com/a', summary: 's', sizeUsdM: 1000, closeType: 'final_close', leadEligible: true, entities: [firm], weight: 1,
  ...extra,
})
const STORIES = [story('s2', 'Ares Management', '2026-09-02T09:00:00Z'), story('s1', 'KKR', '2026-08-20T09:00:00Z')]

vi.mock('@/lib/news/front-page', () => ({
  loadStories: async () => STORIES,
  loadArchive: async () => [...STORIES, story('s3', 'Ares Management', '2026-08-25T09:00:00Z'), story('s4', 'KKR', '2026-08-01T09:00:00Z')],
}))
vi.mock('@/lib/news/league-data', () => ({
  loadLeague: async () => [{ firmSlug: 'oaktree', firm: 'Oaktree', date: '2026-07-14' }, { firmSlug: 'ares', firm: 'Ares Management', date: '2026-06-01' }],
}))
vi.mock('@/lib/events/api', () => ({
  queryAllEventSlugs: async () => [{ slug: 'ilpa-summit-2026', startDate: '2026-11-03', changedAt: '2026-09-10T15:00:00Z' }],
}))

// The archive's reads are stubbed; its own functions (the cap, the months) are the real ones.
let WRITTEN_ROWS: { id: string; published_date: string; summary_long_at: string | null }[] = []
vi.mock('@/lib/news/archive', async () => {
  const actual = await vi.importActual<typeof import('@/lib/news/archive')>('@/lib/news/archive')
  const db = {
    from: () => {
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'gte', 'order', 'limit']) chain[m] = () => chain
      chain.then = (resolve: (r: unknown) => void) => resolve({ data: WRITTEN_ROWS, error: null })
      return chain
    },
  }
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadSitemapStories: () => actual.fetchSitemapStories(db as any),
    loadArchiveSpan: async () => (WRITTEN_ROWS.length ? { first: '2026-10', last: '2026-11', newestDay: '2026-11-03' } : null),
  }
})

import sitemap from '../../../app/sitemap'
import { SITEMAP_STORY_CAP } from '../archive'

describe('the sitemap', () => {
  it('dates a page by when its content changed, never by when the sitemap was built', async () => {
    // Every URL used to say "modified now", every ten minutes, and crawlers
    // re-fetched 1,300 pages on the strength of it.
    const built = Date.now()
    const entries = await sitemap()
    const byUrl = new Map(entries.map((e) => [e.url.replace('https://fundopshq.com', '') || '/', e]))
    const iso = (path: string) => (byUrl.get(path)?.lastModified as Date | undefined)?.toISOString()

    // A firm: its newest story or close, whichever is later.
    expect(iso('/firm/ares')).toBe('2026-09-02T12:00:00.000Z')
    expect(iso('/firm/kkr')).toBe('2026-08-20T12:00:00.000Z')
    expect(iso('/firm/oaktree')).toBe('2026-07-14T12:00:00.000Z')
    // An event: its row's last edit. A story: when it was first reported.
    expect(iso('/events/ilpa-summit-2026')).toBe('2026-09-10T15:00:00.000Z')
    expect(iso('/story/s2')).toBe('2026-09-02T09:00:00.000Z')
    // The front page and a section: their newest story.
    expect(iso('/')).toBe('2026-09-02T09:00:00.000Z')
    expect(iso('/news/private-equity')).toBe('2026-09-02T09:00:00.000Z')
    // Pages that do not change carry no date.
    for (const path of ['/about', '/terms', '/privacy', '/sponsor', '/events/submit']) expect(byUrl.get(path)?.lastModified, path).toBeUndefined()
    // And nothing at all is stamped with the present.
    for (const e of entries) {
      if (e.lastModified) expect(built - new Date(e.lastModified).getTime(), e.url).toBeGreaterThan(86_400_000)
    }
  })

  describe('the archive', () => {
    const written = (id: string, date: string, at: string | null) => ({ id, published_date: date, summary_long_at: at })

    it('lists the archive pages and every story with a fuller summary, dated by when the summary was written', async () => {
      WRITTEN_ROWS = [
        written('w-new', '2026-11-03', '2026-11-03T15:45:00Z'),
        written('w-nodate', '2026-10-20', null),
        written('s2', '2026-09-02', '2026-09-03T09:00:00Z'), // already on the page as an in-window story with coverage
      ]
      const entries = await sitemap()
      const byUrl = new Map(entries.map((e) => [e.url.replace('https://fundopshq.com', '') || '/', e]))
      const iso = (path: string) => (byUrl.get(path)?.lastModified as Date | undefined)?.toISOString()

      expect(iso('/story/w-new')).toBe('2026-11-03T15:45:00.000Z')
      expect(iso('/story/w-nodate')).toBe('2026-10-20T12:00:00.000Z') // the day it was published
      // A story that is already listed is listed once, as it was.
      expect(entries.filter((e) => e.url.endsWith('/story/s2'))).toHaveLength(1)
      expect(iso('/story/s2')).toBe('2026-09-02T09:00:00.000Z')

      expect(iso('/archive')).toBe('2026-11-03T12:00:00.000Z')
      // Months, newest first in the span; each dated by its newest story, none by a guess.
      expect(iso('/archive/2026-11')).toBe('2026-11-03T12:00:00.000Z')
      expect(iso('/archive/2026-10')).toBe('2026-10-20T12:00:00.000Z')
      expect(byUrl.has('/archive/2026-09')).toBe(false)
    })

    it('stops at the cap', async () => {
      WRITTEN_ROWS = Array.from({ length: SITEMAP_STORY_CAP + 250 }, (_, i) => written(`w-${i}`, '2026-10-02', '2026-10-02T10:00:00Z'))
      const entries = await sitemap()
      expect(entries.filter((e) => /\/story\/w-/.test(e.url))).toHaveLength(SITEMAP_STORY_CAP)
    })

    it('has no archive, and is otherwise the same, when nothing is written yet', async () => {
      WRITTEN_ROWS = []
      const entries = await sitemap()
      expect(entries.some((e) => e.url.includes('/archive'))).toBe(false)
      expect(entries.some((e) => e.url.endsWith('/story/s2'))).toBe(true)
    })
  })
})
