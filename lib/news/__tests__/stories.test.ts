import { describe, it, expect } from 'vitest'
import { buildStories, composeFrontPage, rankTop, storyHeat, type Story } from '../stories'
import { SECTIONS, homeSectionFor, storyInSection } from '../sections'
import { kickerLabel, sizeLabel, stageLabel, timeLabel } from '../format'

let seq = 0
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(o: Record<string, any>) {
  const { firm, fund, size, close, person, ents, ...rest } = o
  return {
    id: uuid(),
    source_url: `https://example.com/${seq}`,
    source_name: 'PE Hub',
    published_date: '2026-09-30',
    created_at: '2026-09-30T14:00:00Z',
    fund_categories: ['PE'],
    is_high_signal: true,
    relevance_score: 0.8,
    tldr: `${firm ?? 'The firm'} announced the news described in the headline.`,
    article_type: rest.event_type,
    entities_raw: (ents ?? [firm].filter(Boolean)).map((name: string) => ({ name, type: 'firm', role: null, confidence: 0.95 })),
    extracted_data: { firm_name: firm ?? null, fund_name: fund ?? null, fund_size_usd_millions: size ?? null, close_type: close ?? null, person_name: person ?? null },
    ...rest,
  }
}
const NOW = new Date('2026-09-30T18:00:00Z').getTime()

describe('buildStories', () => {
  it('turns several outlets’ rows into one story with the others listed as coverage', () => {
    const stories = buildStories([
      row({ title: 'Audax Private Debt Raises Third Direct-Lending Fund', event_type: 'capital_raise', firm: 'Audax Private Debt', fund_categories: ['credit'], source_name: 'WSJ' }),
      row({ title: 'Audax Private Debt Closes Largest Fund in Firm’s History, Raising $10 Billion', event_type: 'fund_close', firm: 'Audax Private Debt', size: 10000, close: 'final_close', fund_categories: ['credit'], source_name: 'Business Wire' }),
      row({ title: 'Audax Private Debt grows direct lending fund 80% with $5.4bn hard-cap close', event_type: 'fund_close', firm: 'Audax Private Debt', size: 10000, close: 'final_close', fund_categories: ['credit'], source_name: 'AltAssets Private Equity News' }),
    ])
    expect(stories).toHaveLength(1)
    const [s] = stories
    expect(s.source).toBe('WSJ') // best desk leads
    expect(s.coverage.map((c) => c.source)).toEqual(['AltAssets', 'Business Wire'])
    expect(s.memberIds).toHaveLength(3)
    expect(s.sizeUsdM).toBe(10000) // the size any version carried
    expect(s.kind).toBe('fundraising')
    expect(s.assetClasses[0]).toBe('credit')
  })

  it('files stories under the same headings as the newsletter', () => {
    const stories = buildStories([
      row({ title: 'SEC proposes widening retail access to private markets', event_type: 'regulatory_action', firm: null, ents: [], fund_categories: ['service_provider'], tldr: 'SEC proposed rule amendments to widen retail access.' }),
      row({ title: 'CIFC hires Nick White to drive European growth', event_type: 'executive_hire', firm: 'CIFC Asset Management', person: 'Nick White', fund_categories: ['credit', 'service_provider'], tldr: 'CIFC Asset Management hired Nick White.' }),
      row({ title: 'Proskauer lands Kirkland partner for fund finance rebuild', event_type: 'executive_hire', firm: 'Proskauer', fund_categories: ['service_provider'], tldr: 'Proskauer hired a fund finance partner.' }),
      row({ title: 'La Caisse invests $75M in AlphaFixe Capital’s alternative credit strategy', event_type: 'capital_raise', firm: 'AlphaFixe Capital', size: 75, fund_categories: ['credit'] }),
      row({ title: 'LLR Partners takes stake in energy management platform EnergyCAP', event_type: 'capital_raise', firm: 'LLR Partners' }),
      row({ title: 'King & Spalding adds disputes partner from Freshfields in Paris', event_type: 'executive_hire', firm: 'King & Spalding', fund_categories: ['service_provider'], tldr: 'King & Spalding hired an arbitration partner.' }),
    ])
    const kindOf = (needle: string) => stories.find((s) => s.headline.includes(needle))?.kind
    expect(kindOf('SEC proposes')).toBe('regulation')
    expect(kindOf('CIFC')).toBe('people')
    expect(kindOf('Proskauer')).toBe('providers')
    expect(kindOf('La Caisse')).toBe('lps')
    expect(kindOf('LLR Partners')).toBe('deals')
    expect(kindOf('King & Spalding')).toBeUndefined() // no fund angle: not a story
  })

  it('never lets a fund shutting down read as a raise', () => {
    const [s] = buildStories([
      row({ title: '$2 billion hedge fund SoMa Equity Partners is closing down', event_type: 'fund_close', firm: 'SoMa Equity Partners', size: 2000, fund_categories: ['hedge'], tldr: 'SoMa Equity Partners is shutting down.' }),
    ])
    expect(s.leadEligible).toBe(false)
    expect(stageLabel(s)).toBeNull()
  })
})

const story = (o: Partial<Story>): Story => ({
  id: uuid(), memberIds: [], headline: 'A headline', url: 'https://example.com', source: 'PE Hub', summary: 'A summary of what happened.',
  coverage: [], kind: 'fundraising', assetClasses: ['PE'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 500,
  firmName: null, fundName: null, personName: null, geography: [], entities: [], leadEligible: true, roundup: false,
  firstSeen: '2026-09-30T14:00:00Z', publishedDate: '2026-09-30', weight: 1, ...o,
})

describe('front page ranking', () => {
  it('decays with age: yesterday’s equal story ranks below today’s', () => {
    const today = story({ firstSeen: '2026-09-30T16:00:00Z', weight: 2 })
    const yesterday = story({ firstSeen: '2026-09-29T10:00:00Z', weight: 2 })
    expect(storyHeat(today, NOW)).toBeGreaterThan(storyHeat(yesterday, NOW))
  })

  it('does not fill the top of the page with one kind or one firm', () => {
    const closes = Array.from({ length: 6 }, (_, i) => story({ firmName: `Firm ${i}`, weight: 3 - i * 0.05 }))
    const deal = story({ kind: 'deals', firmName: 'Dealmaker', weight: 2.2 })
    const dupFirm = story({ firmName: 'Firm 0', weight: 2.9 })
    const top = rankTop([...closes, deal, dupFirm], NOW, 5)
    expect(top.some((s) => s.kind === 'deals')).toBe(true)
    expect(top.filter((s) => s.firmName === 'Firm 0')).toHaveLength(1)
  })

  it('leads with a story it can put a name and number on, and counts the week', () => {
    const windDown = story({ leadEligible: false, weight: 9, firmName: 'Shutting Fund' })
    const close = story({ firmName: 'Real Close', weight: 2, sizeUsdM: 1200 })
    const front = composeFrontPage([windDown, close, story({ kind: 'deals', firmName: 'D' }), story({ kind: 'people', firmName: 'P' })], NOW)
    expect(front.lead?.firmName).toBe('Real Close')
    expect(front.largestCloses.map((s) => s.firmName)).toEqual(['Real Close'])
    expect(front.stats).toEqual({ funds: 1, capitalUsdM: 1200, deals: 1, moves: 1 })
  })

  it('a multi-story wire never takes a top slot', () => {
    const top = rankTop([story({ roundup: true, weight: 9 }), story({ firmName: 'X', weight: 1 })], NOW, 2)
    expect(top).toHaveLength(1)
    expect(top[0].firmName).toBe('X')
  })
})

describe('sections', () => {
  it('a fund event belongs to its type tab and its asset-class tab', () => {
    const s = story({ kind: 'fundraising', assetClasses: ['credit'] })
    const inTabs = SECTIONS.filter((sec) => storyInSection(s, sec)).map((sec) => sec.slug)
    expect(inTabs).toEqual(['fundraising', 'private-credit'])
    expect(homeSectionFor(s)?.slug).toBe('private-credit')
    expect(kickerLabel(s)).toBe('Credit')
  })
  it('a deal tagged with an asset class shows under both Deals and that class', () => {
    const s = story({ kind: 'deals', assetClasses: ['infrastructure'] })
    expect(SECTIONS.filter((sec) => storyInSection(s, sec)).map((sec) => sec.slug)).toEqual(['deals', 'infrastructure'])
    expect(homeSectionFor(s)?.slug).toBe('deals')
  })
})

describe('formatting', () => {
  it('sizes keep the precision a reader expects', () => {
    expect(sizeLabel(13500)).toBe('$13.5B')
    expect(sizeLabel(2000)).toBe('$2B')
    expect(sizeLabel(550)).toBe('$550M')
    expect(sizeLabel(11.3)).toBe('$11.3M')
    expect(sizeLabel(null)).toBeNull()
  })
  it('time is hours while fresh, then the calendar', () => {
    expect(timeLabel('2026-09-30T17:20:00Z', NOW)).toBe('40m ago')
    expect(timeLabel('2026-09-30T12:00:00Z', NOW)).toBe('6h ago')
    expect(timeLabel('2026-09-29T15:00:00Z', NOW)).toBe('Yesterday')
    expect(timeLabel('2026-09-25T15:00:00Z', NOW)).toBe('Sep 25')
  })
})
