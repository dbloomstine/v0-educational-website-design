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

import sitemap from '../../../app/sitemap'

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
})
