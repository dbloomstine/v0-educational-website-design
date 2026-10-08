import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ArchiveEntry, ArchivePage } from '../archive'

// The archive pages with the database stubbed: what they list, where they link,
// what they say to a search engine.
const entry = (i: number): ArchiveEntry => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, headline: `Headline ${i}`, date: '2026-10-09', firm: 'Conversant Capital', source: 'AltAssets',
  blurb: `The first sentence of story ${i}.`,
})
let month: ArchivePage = { entries: [entry(1), entry(2)], hasMore: false }
let span: { first: string; last: string; newestDay: string } | null = { first: '2026-10', last: '2026-10', newestDay: '2026-10-09' }
const loadMonth = vi.fn(async (m: string, p: number) => { void m; void p; return month })

vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
  permanentRedirect: (to: string) => { throw new Error(`REDIRECT ${to}`) },
}))
vi.mock('@/lib/news/archive', async () => {
  const actual = await vi.importActual<typeof import('@/lib/news/archive')>('@/lib/news/archive')
  return { ...actual, loadArchiveMonth: (m: string, p: number) => loadMonth(m, p), loadArchiveSpan: async () => span }
})
vi.mock('@/components/sponsor/SponsorSlot', () => ({ SponsorStrip: () => null, SponsorCard: () => null }))
vi.mock('@/components/site-header', () => ({ SiteHeader: () => null }))
vi.mock('@/components/site-footer', () => ({ SiteFooter: () => null }))
vi.mock('@/components/back-to-top', () => ({ BackToTop: () => null }))
vi.mock('@/components/home/Rail', () => ({ SubscribePanel: () => null }))

const params = (m: string, page?: string[]) => ({ params: Promise.resolve({ month: m, page }) })
const hrefs = () => screen.getAllByRole('link').map((a) => a.getAttribute('href'))

beforeEach(() => {
  month = { entries: [entry(1), entry(2)], hasMore: false }
  span = { first: '2026-10', last: '2026-10', newestDay: '2026-10-09' }
  loadMonth.mockClear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
})

describe('a month of the archive', () => {
  it('lists the stories newest first, each with its date, firm and first sentence, linking to its story page', async () => {
    const { default: Page } = await import('@/app/archive/[month]/[[...page]]/page')
    render(await Page(params('2026-10')))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('October 2026')
    expect(screen.getByText('The first sentence of story 1.')).toBeTruthy()
    expect(screen.getAllByText(/Conversant Capital/).length).toBe(2)
    expect(screen.getByRole('link', { name: 'Headline 1' }).getAttribute('href')).toBe(`/story/${entry(1).id}`)
    expect(document.querySelectorAll('time[datetime="2026-10-09"]').length).toBe(2)
    expect(loadMonth).toHaveBeenCalledWith('2026-10', 1)
  })

  it('pages through a long month by path, never by query string', async () => {
    month = { entries: [entry(1)], hasMore: true }
    const { default: Page } = await import('@/app/archive/[month]/[[...page]]/page')
    render(await Page(params('2026-10')))
    expect(hrefs()).toContain('/archive/2026-10/2')
    expect(hrefs().some((h) => h?.includes('?'))).toBe(false)
    expect(hrefs()).not.toContain('/archive/2026-10/0')
    expect(screen.queryByText('← Newer stories')).toBeNull()
  })

  it('links back from a later page, and on to the months either side that exist', async () => {
    const { default: Page } = await import('@/app/archive/[month]/[[...page]]/page')
    render(await Page(params('2026-11', ['3'])))
    expect(loadMonth).toHaveBeenCalledWith('2026-11', 3)
    expect(hrefs()).toContain('/archive/2026-11/2') // newer
    expect(hrefs()).toContain('/archive/2026-10') // the month before
    expect(hrefs()).not.toContain('/archive/2026-12') // not yet
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('page 3')
  })

  it('is a 404 with no query for a month outside the archive or a page that cannot exist', async () => {
    const { default: Page } = await import('@/app/archive/[month]/[[...page]]/page')
    await expect(Page(params('2026-09'))).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(Page(params('2027-01'))).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(Page(params('2026-10', ['2', '3']))).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(Page(params('2026-10', ['9999']))).rejects.toThrow('NEXT_NOT_FOUND')
    expect(loadMonth).not.toHaveBeenCalled()
    // /1 is the first page's address, redirected.
    await expect(Page(params('2026-10', ['1']))).rejects.toThrow('REDIRECT /archive/2026-10')
  })

  it('is a 404 past the end of a month, and says so to search engines when a first page is empty', async () => {
    const { default: Page, generateMetadata } = await import('@/app/archive/[month]/[[...page]]/page')
    month = { entries: [], hasMore: false }
    await expect(Page(params('2026-10', ['4']))).rejects.toThrow('NEXT_NOT_FOUND')
    const meta = await generateMetadata(params('2026-11'))
    expect(meta.robots).toEqual({ index: false, follow: true })
  })

  it('has a title, a description and a canonical address of its own on every page', async () => {
    const { generateMetadata } = await import('@/app/archive/[month]/[[...page]]/page')
    const first = await generateMetadata(params('2026-10'))
    expect(first.title).toBe('October 2026: fund closes, deals and moves')
    expect(String(first.description)).toContain('October 2026')
    expect(first.alternates?.canonical).toBe('https://fundopshq.com/archive/2026-10')
    expect(first.robots).toBeUndefined()
    const second = await generateMetadata(params('2026-10', ['2']))
    expect(second.title).toBe('October 2026: fund closes, deals and moves (page 2)')
    expect(second.alternates?.canonical).toBe('https://fundopshq.com/archive/2026-10/2')
  })
})

describe('the archive index', () => {
  it('lists the months from the newest, each linking to its first page', async () => {
    span = { first: '2026-10', last: '2026-11', newestDay: '2026-11-04' }
    const { default: Page } = await import('@/app/archive/page')
    render(await Page())
    const months = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/archive/')).map((a) => [a.textContent, a.getAttribute('href')])
    expect(months).toEqual([['November 2026', '/archive/2026-11'], ['October 2026', '/archive/2026-10']])
  })

  it('has its own title, description and canonical, and is not indexed while empty', async () => {
    const { generateMetadata } = await import('@/app/archive/page')
    const meta = await generateMetadata()
    expect(meta.title).toBe('Story archive')
    expect(meta.alternates?.canonical).toBe('https://fundopshq.com/archive')
    expect(meta.robots).toBeUndefined()
    span = null
    expect((await generateMetadata()).robots).toEqual({ index: false, follow: true })
  })
})
