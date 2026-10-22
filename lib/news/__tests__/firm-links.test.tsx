import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Story } from '../stories'
import { firmPageHref, firmPageSlugs, headlineRuns, storyFirmRef } from '../firms'
import { LeadStory, RiverRow, TopStory } from '@/components/story/StoryBlocks'
import { Headline } from '@/components/story/Headline'

// Firm names linked to their pages (2026-10-22, from the SEO audit: 706 firm
// pages no news list linked to). A name links only when its page is one worth
// a link, never a person, and never inside a headline that is already a link.

let seq = 0
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
const story = (o: Partial<Story> = {}): Story => ({
  id: uuid(), memberIds: [], headline: 'Conversant Capital closes $705m real estate fund', url: 'https://pehub.example/c', source: 'PE Hub',
  summary: 'Conversant closes its debut fund.', coverage: [], kind: 'fundraising', assetClasses: ['real_estate'], eventType: 'fund_close',
  closeType: 'final_close', sizeUsdM: 705, firmName: 'Conversant Capital', fundName: null, personName: null, geography: [],
  entities: ['Conversant Capital'], firms: ['Conversant Capital'], leadEligible: true, roundup: false,
  firstSeen: '2026-10-07T14:00:00Z', publishedDate: '2026-10-07', weight: 1, ...o,
})

const PAGES = new Set(['conversant', 'hig', 'ares', 'kkr', 'goldman-sachs', 'korea', 'blackstone'])

describe('which firms have a page worth a link', () => {
  it('the league managers, and the firms that are the subject of two stories or more', () => {
    const slugs = firmPageSlugs(
      [
        story({ firmName: 'Ares' }), story({ firmName: 'Ares Management' }), // two spellings, one firm, two stories
        story({ firmName: 'Onestory Partners' }), // one story: its page is the story itself
        story({ firmName: 'Blackstone', roundup: true }), story({ firmName: 'Blackstone', roundup: true }), // wires name no one firm
      ],
      [{ firmSlug: 'oaktree' }],
    )
    expect(slugs.sort()).toEqual(['ares', 'oaktree'])
  })
})

describe('a name to its page', () => {
  it('every spelling with the same key lands on the one page', () => {
    for (const name of ['H.I.G. Capital', 'HIG Capital', 'HIG']) expect(firmPageHref(name, PAGES)).toBe('/firm/hig')
    expect(firmPageHref('Ares Management Corp.', PAGES)).toBe('/firm/ares')
    expect(firmPageHref('KKR & Co. Inc.', PAGES)).toBe('/firm/kkr')
    expect(firmPageHref('  Conversant Capital ', PAGES)).toBe('/firm/conversant')
  })

  it('a division with no page of its own goes to the firm page that carries its stories', () => {
    expect(firmPageHref('Goldman Sachs Alternatives', PAGES)).toBe('/firm/goldman-sachs')
    expect(firmPageHref('Blackstone Infrastructure Partners', PAGES)).toBe('/firm/blackstone')
    // Its own page wins when it has one.
    expect(firmPageHref('Goldman Sachs Alternatives', new Set([...PAGES, 'goldman-sachs-alternatives']))).toBe('/firm/goldman-sachs-alternatives')
  })

  it('no link when there is no page, or the shorter name is not the same firm', () => {
    expect(firmPageHref('Onestory Partners', PAGES)).toBeNull()
    expect(firmPageHref('Korea Exchange', PAGES)).toBeNull() // "Korea" opens many unrelated names
    expect(firmPageHref('Kohlberg Kravis Roberts', PAGES)).toBeNull() // initials are not guessed
    expect(firmPageHref('New London private equity firm', PAGES)).toBeNull() // a description, not a name
    expect(firmPageHref(null, PAGES)).toBeNull()
    expect(firmPageHref('Ares', new Set())).toBeNull()
  })

  it('a story: its firm, never a wire and never a person', () => {
    expect(storyFirmRef(story(), PAGES)).toEqual({ name: 'Conversant Capital', href: '/firm/conversant' })
    expect(storyFirmRef(story({ roundup: true }), PAGES)).toBeNull()
    expect(storyFirmRef(story({ firmName: 'Ares', personName: 'Ares' }), PAGES)).toBeNull()
    expect(storyFirmRef(story({ firmName: 'Onestory Partners' }), PAGES)).toBeNull()
  })
})

describe('the bold names in a headline', () => {
  const hrefFor = (name: string) => firmPageHref(name, PAGES)
  const s = story({
    headline: "Blackstone's Jon Gray backs H.I.G. deal with Ares and Onestory",
    firmName: 'Blackstone', personName: 'Jon Gray',
    entities: ['Blackstone', 'Jon Gray', 'HIG Capital', 'Ares Management', 'Onestory Partners'],
    firms: ['Blackstone', 'HIG Capital', 'Ares Management', 'Onestory Partners'],
  })

  it('firms with a page are linked; a person and a firm without a page stay bold text', () => {
    const runs = headlineRuns(s, hrefFor)
    expect(runs.map((r) => r.text).join('')).toBe(s.headline)
    const linked = Object.fromEntries(runs.filter((r) => r.bold).map((r) => [r.text, r.href ?? null]))
    expect(linked).toEqual({ Blackstone: '/firm/blackstone', 'Jon Gray': null, 'H.I.G.': '/firm/hig', Ares: '/firm/ares', Onestory: null })
  })

  it('a name the story gives as both firm and person is never linked', () => {
    const odd = story({ headline: 'Ares joins Conversant', firmName: 'Conversant Capital', personName: 'Ares', entities: ['Ares', 'Conversant Capital'], firms: ['Conversant Capital', 'Ares'] })
    const runs = headlineRuns(odd, hrefFor)
    expect(runs.find((r) => r.text === 'Ares')?.href).toBeUndefined()
    expect(runs.find((r) => r.text === 'Conversant')?.href).toBe('/firm/conversant')
  })

  it('on the story page the headline links them; without the lookup it is plain bold', () => {
    const { container, unmount } = render(<h1><Headline story={s} firmHref={hrefFor} /></h1>)
    expect(Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual(['/firm/blackstone', '/firm/hig', '/firm/ares'])
    unmount()
    const plain = render(<h1><Headline story={s} /></h1>)
    expect(plain.container.querySelectorAll('a')).toHaveLength(0)
    expect(plain.container.querySelectorAll('strong').length).toBeGreaterThanOrEqual(4)
  })
})

describe('in the lists', () => {
  const s = story()
  const firm = storyFirmRef(s, PAGES)
  const nested = (root: HTMLElement) => root.querySelectorAll('a a').length

  it('a river row: the firm leads the line under the headline, outside the headline link', () => {
    const { container } = render(<ul><RiverRow story={s} tags={['Fundraising']} firm={firm} /></ul>)
    const link = screen.getByRole('link', { name: 'Conversant Capital' })
    expect(link.getAttribute('href')).toBe('/firm/conversant')
    expect(nested(container)).toBe(0)
    // The headline is still the one link to the story, and still has the name in bold.
    const headline = container.querySelector('a[href^="/story/"]') as HTMLElement
    expect(headline.querySelector('strong')?.textContent).toBe('Conversant Capital')
  })

  it('lead and top stories carry it too; without a page there is no firm link', () => {
    for (const el of [<LeadStory key="l" story={s} firm={firm} />, <TopStory key="t" story={s} firm={firm} />]) {
      const { container, unmount } = render(el)
      expect(container.querySelectorAll('a[href="/firm/conversant"]')).toHaveLength(1)
      expect(nested(container)).toBe(0)
      unmount()
    }
    const { container } = render(<ul><RiverRow story={s} firm={storyFirmRef(s, new Set())} /></ul>)
    expect(container.querySelectorAll('a[href^="/firm/"]')).toHaveLength(0)
  })
})
