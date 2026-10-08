import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Story } from '../stories'

// What a story page tells search engines, with its neighbours stubbed. The rule
// is decided at render from the story as it is then, so each case below is a
// different state of the same page.
const base: Story = {
  id: '00000000-0000-4000-8000-000000000001',
  memberIds: ['00000000-0000-4000-8000-000000000001'],
  headline: 'Conversant beats debut real estate fund target by 40% with $705m close',
  url: 'https://example.com/original',
  source: 'AltAssets',
  summary: 'Conversant closes debut real estate fund at $705M, 40% above target.',
  coverage: [],
  kind: 'fundraising', assetClasses: ['real_estate'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 705,
  firmName: 'Conversant Capital', fundName: null, personName: null, geography: [], entities: [], firms: ['Conversant Capital'],
  leadEligible: true, roundup: false, firstSeen: '2026-10-07T14:00:00Z', publishedDate: '2026-10-07', weight: 1,
}
let story: Story = base
let long: string | null = null
let readFails = false

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))
vi.mock('@/lib/news/front-page', () => ({ getStory: async () => ({ story, all: [story] }) }))
vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({}) }))
vi.mock('@/lib/news/story-long', () => ({
  readLongSummaryDetail: async (_db: unknown, _s: unknown, opts?: { strict?: boolean }) => {
    if (readFails) {
      if (opts?.strict) throw new Error('database unavailable')
      return null
    }
    return long ? { text: long, at: null } : null
  },
}))
vi.mock('@/components/sponsor/SponsorSlot', () => ({ SponsorStrip: () => null, SponsorCard: () => null }))
vi.mock('@/components/site-header', () => ({ SiteHeader: () => null }))
vi.mock('@/components/site-footer', () => ({ SiteFooter: () => null }))
vi.mock('@/components/back-to-top', () => ({ BackToTop: () => null }))
vi.mock('@/components/story/ShareBar', () => ({ ShareBar: () => null }))
vi.mock('@/components/story/StoryBlocks', () => ({ HeadlineRow: () => null, SectionFlag: () => null }))
vi.mock('@/components/home/Rail', () => ({ LatestRail: () => null, SubscribePanel: () => null }))

const meta = async () => {
  const { generateMetadata } = await import('@/app/story/[id]/page')
  return generateMetadata({ params: Promise.resolve({ id: story.id }) })
}
const second = { source: 'Law360', url: 'https://example.com/law360', headline: 'Conversant wraps $845M fund' }

beforeEach(() => { story = base; long = null; readFails = false; vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('a story page and search engines', () => {
  it('is noindex, follow with one outlet and only the short summary', async () => {
    expect((await meta()).robots).toEqual({ index: false, follow: true })
  })

  it('is indexable once it has a fuller summary', async () => {
    long = 'Conversant Capital closed its first fund.'
    expect((await meta()).robots).toBeUndefined()
  })

  it('is indexable once a second outlet has reported it', async () => {
    story = { ...base, coverage: [second] }
    expect((await meta()).robots).toBeUndefined()
  })

  it('goes back to noindex if the second outlet is gone and there is no fuller summary', async () => {
    story = { ...base, coverage: [second] }
    expect((await meta()).robots).toBeUndefined()
    story = base
    expect((await meta()).robots).toEqual({ index: false, follow: true })
  })

  it('is not hidden because the fuller summary could not be read', async () => {
    readFails = true
    expect((await meta()).robots).toBeUndefined()
  })

  it('still renders, with the short summary, when the fuller summary could not be read', async () => {
    readFails = true
    const { render, screen } = await import('@testing-library/react')
    const { default: StoryPage } = await import('@/app/story/[id]/page')
    render(await StoryPage({ params: Promise.resolve({ id: story.id }) }))
    expect(screen.getByText(base.summary as string)).toBeTruthy()
  })

  it('keeps the canonical tag whatever the rule says', async () => {
    const thin = await meta()
    story = { ...base, coverage: [second] }
    const rich = await meta()
    expect(thin.alternates?.canonical).toBe(`https://fundopshq.com/story/${base.id}`)
    expect(rich.alternates?.canonical).toBe(thin.alternates?.canonical)
  })
})
