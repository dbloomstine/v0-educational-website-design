import { describe, expect, it, vi } from 'vitest'

// The set's real build reads thirty days of stories and the league; here it never answers, as on a cold, slow night.
vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
vi.mock('@/lib/cache/build-once', () => ({ buildOnce: () => new Promise(() => {}) }))
vi.mock('@/lib/news/front-page', () => ({ loadArchive: vi.fn() }))
vi.mock('@/lib/news/league-data', () => ({ loadLeague: vi.fn() }))

describe('peekFirmPages', () => {
  it('gives up after its time and lets the page render without the link', async () => {
    const { peekFirmPages } = await import('../firm-pages')
    const t0 = Date.now()
    expect(await peekFirmPages(60)).toBeNull()
    expect(Date.now() - t0).toBeLessThan(1000)
  })
})
