import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Story } from '../stories'

// The story page with its neighbours stubbed: what it puts under the headline, and what it leaves alone.
let long: string | null = null
const story: Story = {
  id: '00000000-0000-4000-8000-000000000001',
  memberIds: ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'],
  headline: 'Conversant beats debut real estate fund target by 40% with $705m close',
  url: 'https://example.com/original',
  source: 'AltAssets',
  summary: 'Conversant closes debut real estate fund at $705M, 40% above target.',
  coverage: [{ source: 'Law360', url: 'https://example.com/law360', headline: 'Fried Frank-Led Conversant Wraps $845M Real Estate Fund' }],
  kind: 'fundraising', assetClasses: ['real_estate'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 705,
  firmName: 'Conversant Capital', fundName: null, personName: null, geography: [], entities: [], firms: ['Conversant Capital'],
  leadEligible: true, roundup: false, firstSeen: '2026-10-07T14:00:00Z', publishedDate: '2026-10-07', weight: 1,
}

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') }, useRouter: () => ({}), usePathname: () => '/', useSearchParams: () => new URLSearchParams() }))
vi.mock('@/lib/news/front-page', () => ({ getStory: async () => ({ story, all: [story] }) }))
vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({}) }))
vi.mock('@/lib/news/story-summary-store', () => ({ readLongSummary: async () => long }))
vi.mock('@/components/sponsor/SponsorSlot', () => ({ SponsorStrip: () => null, SponsorCard: () => null }))
vi.mock('@/components/site-header', () => ({ SiteHeader: () => null }))
vi.mock('@/components/site-footer', () => ({ SiteFooter: () => null }))
vi.mock('@/components/back-to-top', () => ({ BackToTop: () => null }))
vi.mock('@/components/story/Headline', () => ({ Headline: ({ story: s }: { story: Story }) => <>{s.headline}</> }))
vi.mock('@/components/story/ShareBar', () => ({ ShareBar: () => null }))
vi.mock('@/components/story/StoryBlocks', () => ({ HeadlineRow: () => null, SectionFlag: () => null }))
vi.mock('@/components/home/Rail', () => ({ LatestRail: () => null, SubscribePanel: () => null }))

async function renderPage() {
  const { default: StoryPage } = await import('@/app/story/[id]/page')
  render(await StoryPage({ params: Promise.resolve({ id: story.id }) }))
}

beforeEach(() => { long = null })

describe('the story page summary', () => {
  it('shows today’s short summary, as the pull-quote, when no row has a long one', async () => {
    await renderPage()
    expect(screen.getByText(story.summary as string).tagName).toBe('P')
    expect(screen.getByText(story.summary as string).className).toContain('border-l-2')
  })

  it('shows the long summary instead, as paragraphs of reading text', async () => {
    long = 'Conversant Capital closed its first fund.\n\nLaw360 puts the close at $845 million; AltAssets says $705 million.'
    await renderPage()
    expect(screen.queryByText(story.summary as string)).toBeNull()
    const first = screen.getByText('Conversant Capital closed its first fund.')
    const second = screen.getByText(/Law360 puts the close at \$845 million/)
    expect(first.tagName).toBe('P')
    expect(second.tagName).toBe('P')
    expect(first.parentElement).toBe(second.parentElement)
    expect(first.className).not.toContain('border-l-2') // not a pull-quote
  })

  it('keeps the read-the-full-story button directly under it, and the disclaimer', async () => {
    long = 'One paragraph of the long summary.'
    await renderPage()
    const para = screen.getByText('One paragraph of the long summary.')
    const button = screen.getByRole('link', { name: /Read the full story at AltAssets/ })
    expect(button.getAttribute('href')).toBe('https://example.com/original')
    // paragraphs block, then the button row, as siblings in that order
    const block = para.parentElement as HTMLElement
    expect(block.nextElementSibling).toBe(button.parentElement)
    expect(screen.getByText(/can contain errors/)).toBeTruthy()
    expect(within(document.body).getAllByText(/The linked/).length).toBeGreaterThan(0)
  })

  it('leaves the JSON-LD description on the short summary', async () => {
    long = 'The long summary.'
    await renderPage()
    const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent as string)
    expect(ld.description).toBe(story.summary)
  })

  it('leaves the meta description on the short summary', async () => {
    long = 'The long summary.'
    const { generateMetadata } = await import('@/app/story/[id]/page')
    const meta = await generateMetadata({ params: Promise.resolve({ id: story.id }) })
    expect(meta.description).toBe(story.summary)
  })
})
