import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Story } from '../stories'
import type { FundClose } from '../league'
import { LeadStory, TopStory, HeadlineRow, LatestRow, RiverRow } from '@/components/story/StoryBlocks'
import { LatestRail, MostCovered, SectionBlock } from '@/components/home/Rail'

// Where a headline goes. Decided 2026-10-08: to our page for the story, with
// the outlet beside it as the way out to the publisher. Roundups, and the
// citations in the league tables, go straight out as before.
const ID = '00000000-0000-4000-8000-000000000001'
const mk = (over: Partial<Story> = {}): Story => ({
  id: ID, memberIds: [ID], headline: 'Conversant Capital closes $705m real estate fund', url: 'https://pehub.example/conversant',
  source: 'PE Hub', summary: 'Conversant closes its debut real estate fund.',
  coverage: [
    { source: 'Law360', url: 'https://law360.example/c', headline: 'Conversant wraps fund' },
    { source: 'AltAssets', url: 'https://altassets.example/c', headline: 'Conversant beats target' },
    { source: 'Reuters', url: 'https://reuters.example/c', headline: 'Conversant raises $705m' },
  ],
  kind: 'fundraising', assetClasses: ['real_estate'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 705,
  firmName: 'Conversant Capital', fundName: null, personName: null, geography: [], entities: ['Conversant Capital'], firms: ['Conversant Capital'],
  leadEligible: true, roundup: false, firstSeen: '2026-10-07T14:00:00Z', publishedDate: '2026-10-07', weight: 1, ...over,
})
const story = mk()
const wire = mk({
  id: '00000000-0000-4000-8000-000000000002', headline: 'Field Notes: Farm Credit backs X; Y to acquire Z', url: 'https://pehub.example/wire',
  roundup: true, leadEligible: false, coverage: [], source: 'Wire Outlet',
})
const solo = mk({ id: '00000000-0000-4000-8000-000000000003', headline: 'Ares hires a head of ABF', url: 'https://pei.example/ares', source: 'PEI', coverage: [] })

const STORY = `/story/${ID}`
// By the link's text content: a bold firm name leaves no space in the accessible name.
const hrefOf = (name: RegExp | string) => {
  const hit = screen.getAllByRole('link').find((a) => (typeof name === 'string' ? a.textContent === name : name.test(a.textContent ?? '')))
  if (!hit) throw new Error(`no link ${name}`)
  return hit.getAttribute('href')
}
/** The link out to the publisher: target and rel as every outbound link has them. */
function expectOutbound(a: HTMLElement, url: string) {
  expect(a.getAttribute('href')).toBe(url)
  expect(a.getAttribute('target')).toBe('_blank')
  expect(a.getAttribute('rel')).toContain('noopener')
}
const outbound = () => screen.getAllByRole('link').filter((a) => a.getAttribute('target') === '_blank')
const internalStory = () => screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/story/'))

describe('lead and top stories', () => {
  it('lead: the headline opens our page; the first outlet is the way out and the others are counted', () => {
    render(<LeadStory story={story} />)
    expect(hrefOf(/Conversant Capital closes/)).toBe(STORY)
    expectOutbound(screen.getByRole('link', { name: 'PE Hub' }), story.url)
    expect(screen.getByText(/also/)).toBeTruthy()
    expectOutbound(screen.getByRole('link', { name: 'Law360' }), 'https://law360.example/c')
    // The secondary link to our page ("4 sources") is gone: the headline is that link.
    expect(internalStory()).toHaveLength(1)
  })

  it('top story: the same', () => {
    render(<TopStory story={story} />)
    expect(hrefOf(/Conversant Capital closes/)).toBe(STORY)
    expectOutbound(screen.getByRole('link', { name: 'PE Hub' }), story.url)
    expect(screen.getByText('+1')).toBeTruthy() // Reuters: three others, two shown
    expect(internalStory()).toHaveLength(1)
  })

  it('a story with one outlet still has its way out', () => {
    render(<TopStory story={solo} />)
    expect(hrefOf(/Ares hires/)).toBe(`/story/${solo.id}`)
    expectOutbound(screen.getByRole('link', { name: 'PEI' }), solo.url)
  })
})

describe('headline rows', () => {
  it('a plain row (section blocks, Latest) opens our page and has nothing else to click', () => {
    render(<ul><LatestRow story={story} /></ul>)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(hrefOf(/Conversant Capital closes/)).toBe(STORY)
  })

  it('a row with its source (related stories on a story page): headline in, outlet out, count of the others', () => {
    render(<ul><HeadlineRow story={story} showSource /></ul>)
    expect(hrefOf(/Conversant Capital closes/)).toBe(STORY)
    expectOutbound(screen.getByRole('link', { name: 'PE Hub' }), story.url)
    expect(screen.getByRole('listitem').textContent).toContain('+3')
  })

  it('the Latest rail', () => {
    render(<LatestRail stories={[story, solo]} />)
    expect(hrefOf(/Conversant Capital closes/)).toBe(STORY)
    expect(hrefOf(/Ares hires/)).toBe(`/story/${solo.id}`)
    expect(outbound()).toHaveLength(0)
  })

  it('a section block on the front page', () => {
    render(<SectionBlock label="Private equity" href="/news/private-equity" moreLabel="More" stories={[story, solo]} />)
    expect(hrefOf(/Conversant Capital closes/)).toBe(STORY)
    expect(hrefOf(/Ares hires/)).toBe(`/story/${solo.id}`)
    expect(outbound()).toHaveLength(0)
  })
})

describe('river rows (/news, sections, firm pages)', () => {
  it('headline in, outlet out with its arrow, the others counted, and no timestamp added', () => {
    render(<ul><RiverRow story={story} tags={['Fund close']} date="Oct 7" /></ul>)
    expect(hrefOf(/Conversant Capital closes/)).toBe(STORY)
    const out = screen.getByRole('link', { name: 'PE Hub' })
    expectOutbound(out, story.url)
    expect(out.querySelector('svg')).toBeTruthy() // the outward arrow
    const li = screen.getByRole('listitem')
    expect(li.textContent).toContain('+3')
    expect(li.textContent).toContain('Fund close')
    expect(within(li).getAllByRole('link')).toHaveLength(2)
  })

  it('a one-outlet story shows no count', () => {
    render(<ul><RiverRow story={solo} /></ul>)
    expect(screen.getByRole('listitem').textContent).not.toMatch(/\+\d/)
  })
})

describe('most covered', () => {
  it('headline in; the first outlet out, with the count of the others where "N sources" was', () => {
    render(<MostCovered stories={[story, mk({ id: '00000000-0000-4000-8000-000000000004', url: 'https://x.example/4' }), mk({ id: '00000000-0000-4000-8000-000000000005', url: 'https://x.example/5' })]} />)
    const first = screen.getAllByRole('listitem')[0]
    expect(within(first).getAllByRole('link')[0].getAttribute('href')).toBe(STORY)
    expectOutbound(within(first).getByRole('link', { name: 'PE Hub' }), story.url)
    expect(first.textContent).toContain('+3')
    expect(screen.queryByText(/sources/)).toBeNull()
  })
})

describe('roundups keep linking straight out', () => {
  it('in every kind of row', () => {
    render(
      <>
        <ul><LatestRow story={wire} /></ul>
        <ul><HeadlineRow story={wire} showSource /></ul>
        <ul><RiverRow story={wire} /></ul>
        <SectionBlock label="Deals" href="/news/deals" moreLabel="More" stories={[wire]} />
      </>,
    )
    expect(internalStory()).toHaveLength(0)
    for (const a of screen.getAllByRole('link', { name: /Field Notes/ })) expectOutbound(a, wire.url)
    expect(screen.getAllByRole('link', { name: /Field Notes/ })).toHaveLength(4)
  })
})

// The league tables and a firm's page cite where a figure came from.
describe('league tables and firm pages', () => {
  const close = (over: Partial<FundClose> = {}): FundClose => ({
    id: ID, memberIds: [ID], firm: 'Conversant Capital', firmSlug: 'conversant-capital', fund: 'Conversant Real Estate Fund I', sizeUsdM: 705,
    stage: 'final', date: '2026-10-05', assetClass: 'real_estate', headline: story.headline, source: 'PE Hub', url: story.url,
    sources: 4, outlets: ['PE Hub', 'Law360', 'AltAssets', 'Reuters'], converted: false, region: null, altSizeUsdM: null, ...over,
  })

  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'))
  })

  async function leaguePage(closes: FundClose[]) {
    vi.doMock('@/lib/news/league-data', () => ({ LEAGUE_SINCE: '2026-03-01', loadLeagueReport: async () => ({ closes, unsized: [], asOf: '2026-10-08T11:00:00Z' }) }))
    vi.doMock('@/components/sponsor/SponsorSlot', () => ({ SponsorStrip: () => null, SponsorCard: () => null }))
    vi.doMock('@/components/site-header', () => ({ SiteHeader: () => null }))
    vi.doMock('@/components/site-footer', () => ({ SiteFooter: () => null }))
    vi.doMock('@/components/back-to-top', () => ({ BackToTop: () => null }))
    vi.doMock('@/components/home/Rail', () => ({ SubscribePanel: () => null }))
    const { default: Page } = await import('@/app/league-tables/page')
    render(await Page({ searchParams: Promise.resolve({}) }))
  }

  it('league: the fund name opens our page; the source stays a citation to the publisher; the count goes to our page', async () => {
    await leaguePage([close()])
    expect(hrefOf('Conversant Real Estate Fund I')).toBe(STORY)
    expectOutbound(screen.getByRole('link', { name: 'PE Hub' }), story.url)
    expect(hrefOf('4 sources')).toBe(STORY)
    expect(hrefOf('Conversant Capital')).toBe('/firm/conversant-capital')
  })

  it('league: a close with no fund name keeps its citation', async () => {
    await leaguePage([close({ fund: null, sources: 1 })])
    expect(screen.getByText('Fund not named in the reports')).toBeTruthy()
    expectOutbound(screen.getByRole('link', { name: 'PE Hub' }), story.url)
  })

  it('firm page: the same', async () => {
    vi.doMock('@/lib/news/firm-data', () => ({
      FIRM_WINDOW_DAYS: 365,
      getFirm: async () => ({ slug: 'conversant-capital', name: 'Conversant Capital', stories: [story, wire], mentions: [solo], closes: [close()] }),
    }))
    vi.doMock('@/components/sponsor/SponsorSlot', () => ({ SponsorStrip: () => null, SponsorCard: () => null }))
    vi.doMock('@/components/site-header', () => ({ SiteHeader: () => null }))
    vi.doMock('@/components/site-footer', () => ({ SiteFooter: () => null }))
    vi.doMock('@/components/back-to-top', () => ({ BackToTop: () => null }))
    vi.doMock('@/components/home/Rail', () => ({ SubscribePanel: () => null }))
    const { default: Page } = await import('@/app/firm/[slug]/page')
    render(await Page({ params: Promise.resolve({ slug: 'conversant-capital' }) }))
    // the close: fund name in, citation out
    expect(hrefOf('Conversant Real Estate Fund I')).toBe(STORY)
    const cells = screen.getAllByRole('link', { name: 'PE Hub' })
    for (const a of cells) expectOutbound(a, story.url)
    // the stories: headline in, outlet out; the wire goes out
    expect(hrefOf(/^Conversant Capital closes \$705m/)).toBe(STORY)
    expectOutbound(screen.getAllByRole('link', { name: /Field Notes/ })[0], wire.url)
    expect(hrefOf(/Ares hires/)).toBe(`/story/${solo.id}`)
    expectOutbound(screen.getByRole('link', { name: 'PEI' }), solo.url)
  })
})
