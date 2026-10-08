import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Story } from '../stories'

// An older story's page, with its neighbours stubbed: which stories it puts in
// its rails, and that none of them is today's.
const mk = (id: string, headline: string, over: Partial<Story> = {}): Story => ({
  id, memberIds: [id], headline, url: `https://example.com/${id}`, source: 'PE Hub', summary: `${headline}.`, coverage: [],
  kind: 'fundraising', assetClasses: ['credit'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 1000,
  firmName: 'Ares Management', fundName: null, personName: null, geography: [], entities: [], firms: ['Ares Management'],
  leadEligible: true, roundup: false, firstSeen: '2026-09-10T14:00:00Z', publishedDate: '2026-09-10', weight: 1, ...over,
})

const OLD = mk('00000000-0000-4000-8000-0000000000a1', 'Ares Management closes $7bn credit fund', {
  coverage: [{ source: 'Reuters', url: 'https://example.com/reuters', headline: 'Ares raises $7 billion' }],
})
const SIBLING = mk('00000000-0000-4000-8000-0000000000a2', 'Ares Management hires a head of investor relations', { kind: 'people', firstSeen: '2026-09-12T09:00:00Z' })
const SAME_DAY = mk('00000000-0000-4000-8000-0000000000a3', 'Blue Owl closes $3bn credit fund', { firmName: 'Blue Owl', firms: ['Blue Owl'] })
const TODAY_SAME_SECTION = mk('00000000-0000-4000-8000-0000000000b1', 'Today: Oaktree closes $5bn credit fund', { firmName: 'Oaktree', firms: ['Oaktree'], firstSeen: '2026-10-08T08:00:00Z', publishedDate: '2026-10-08' })
const TODAY_SAME_FIRM = mk('00000000-0000-4000-8000-0000000000b2', 'Today: Ares Management launches a new fund', { firstSeen: '2026-10-08T07:00:00Z', publishedDate: '2026-10-08' })

let found: { story: Story; all: Story[]; older?: { siblings: Story[] } } | null
let day: Story[] | Error = []
const loadDay = vi.fn(async (d: string) => { if (day instanceof Error) throw day; void d; return day })

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') }, useRouter: () => ({}), usePathname: () => '/', useSearchParams: () => new URLSearchParams() }))
vi.mock('@/lib/news/front-page', () => ({ getStory: async () => found }))
vi.mock('@/lib/news/older-story', async () => {
  const actual = await vi.importActual<typeof import('@/lib/news/older-story')>('@/lib/news/older-story')
  return { ...actual, loadDayStories: (d: string) => loadDay(d) }
})
vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({}) }))
vi.mock('@/lib/news/story-long', () => ({ readLongSummaryDetail: async () => ({ text: 'The fuller summary.', at: '2026-09-11T10:00:00Z' }) }))
vi.mock('@/components/sponsor/SponsorSlot', () => ({ SponsorStrip: () => null, SponsorCard: () => null }))
vi.mock('@/components/site-header', () => ({ SiteHeader: () => null }))
vi.mock('@/components/site-footer', () => ({ SiteFooter: () => null }))
vi.mock('@/components/back-to-top', () => ({ BackToTop: () => null }))
vi.mock('@/components/story/Headline', () => ({ Headline: ({ story: s }: { story: Story }) => <>{s.headline}</> }))
vi.mock('@/components/story/ShareBar', () => ({ ShareBar: () => null }))
vi.mock('@/components/story/StoryBlocks', () => ({
  HeadlineRow: ({ story: s }: { story: Story }) => <li data-testid="row">{s.headline}</li>,
  SectionFlag: ({ label, note }: { label: string; note?: string }) => <h2>{label}{note ? ` (${note})` : ''}</h2>,
}))
vi.mock('@/components/home/Rail', () => ({ LatestRail: () => <aside>Latest rail</aside>, SubscribePanel: () => null }))

async function renderPage() {
  const { default: StoryPage } = await import('@/app/story/[id]/page')
  render(await StoryPage({ params: Promise.resolve({ id: OLD.id }) }))
}
const rows = () => screen.queryAllByTestId('row').map((r) => r.textContent)

beforeEach(() => {
  day = []
  loadDay.mockClear()
  found = { story: OLD, all: [TODAY_SAME_SECTION, TODAY_SAME_FIRM], older: { siblings: [SIBLING] } }
})

describe('an older story’s page', () => {
  it('shows its other outlets and its fuller summary, as a story that is on the page does', async () => {
    await renderPage()
    expect(screen.getByText('The fuller summary.')).toBeTruthy()
    expect(screen.getByText('Ares raises $7 billion')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Coverage (2 sources)' })).toBeTruthy()
  })

  it('puts the same firm’s stories from then, and the section on its own day, in its rails', async () => {
    day = [SAME_DAY, OLD]
    await renderPage()
    expect(loadDay).toHaveBeenCalledWith('2026-09-10')
    expect(rows()).toEqual([SIBLING.headline, SAME_DAY.headline])
    expect(screen.getByRole('heading', { name: /^More on Ares Management/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /More in Private credit \(From the same day\)/i })).toBeTruthy()
  })

  it('never fills a rail from today’s stories', async () => {
    day = [SAME_DAY]
    await renderPage()
    expect(rows()).not.toContain(TODAY_SAME_SECTION.headline)
    expect(rows()).not.toContain(TODAY_SAME_FIRM.headline)
  })

  it('leaves a rail out when nothing is related to put in it', async () => {
    found = { story: OLD, all: [TODAY_SAME_SECTION, TODAY_SAME_FIRM], older: { siblings: [] } }
    day = []
    await renderPage()
    expect(rows()).toEqual([])
    expect(screen.queryByRole('heading', { name: /More on/ })).toBeNull()
    expect(screen.queryByRole('heading', { name: /More in/ })).toBeNull()
  })

  it('goes without the section rail, and still renders, when the day’s lookup fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    day = new Error('timeout')
    await renderPage()
    expect(rows()).toEqual([SIBLING.headline])
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })

  it('writes the structured data with the date the fuller summary was written', async () => {
    await renderPage()
    const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent as string)
    expect(ld.dateModified).toBe('2026-09-11T10:00:00.000Z')
    expect(ld.description).toBe(OLD.summary)
    expect(ld.image).toEqual([`https://fundopshq.com/story/${OLD.id}/opengraph-image`])
    expect(ld.author.name).toBe('FundOpsHQ')
    expect(JSON.stringify(ld)).not.toContain('The fuller summary.')
  })
})

describe('a story still on the page', () => {
  it('keeps the rails it always had, from the ten days', async () => {
    found = { story: OLD, all: [OLD, TODAY_SAME_FIRM, TODAY_SAME_SECTION] }
    await renderPage()
    expect(loadDay).not.toHaveBeenCalled()
    expect(rows()).toEqual([TODAY_SAME_FIRM.headline, TODAY_SAME_SECTION.headline])
  })
})
