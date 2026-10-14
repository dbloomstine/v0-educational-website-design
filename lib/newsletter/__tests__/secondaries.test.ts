import { describe, it, expect } from 'vitest'
import { secondariesClass } from '../secondaries'
import { assembleNewsletter, buildPriorExclusions, FUND_SECTION_ORDER } from '../query-articles'
import { followsStory } from '../personalize'
import { interestCategories } from '../interests'
import { buildStories } from '@/lib/news/stories'
import { SECTIONS, SECTION_BY_SLUG, homeSectionFor, storyInSection } from '@/lib/news/sections'

// Headlines, tags and strategies below are real rows from the four weeks to 2026-10-14.
const a = (title: string, eventType: string, fundCategories: string[], fundStrategy: string | null = null) => ({ title, eventType, fundCategories, fundStrategy })

describe('what counts as a secondaries story', () => {
  it('takes fund events the classifier tagged secondaries or GP stakes, whatever they are tagged first', () => {
    expect(secondariesClass(a('StepStone’s sixth PE secondaries fundraise passes halfway mark', 'capital_raise', ['PE', 'secondaries'], 'secondaries'))).toBe('secondaries')
    expect(secondariesClass(a('Sweetwater sets high target for sophomore fund', 'capital_raise', ['secondaries'], 'secondaries'))).toBe('secondaries')
    expect(secondariesClass(a('LP-backed Collective Global eyes $1bn for sophomore GP stakes fund', 'capital_raise', ['gp_stakes'], 'gp_stakes'))).toBe('gp_stakes')
    expect(secondariesClass(a('Hamilton Lane surpasses $430 million for debut GP-led fund', 'capital_raise', ['secondaries', 'gp_stakes'], 'GP-led secondaries'))).toBe('secondaries')
  })

  it('takes continuation vehicles the classifier tagged by what they hold', () => {
    expect(secondariesClass(a('GenNx360 closes $285m Churchill-led continuation fund for Whitsons Culinary Group', 'fund_close', ['PE'], 'buyout'))).toBe('secondaries')
    expect(secondariesClass(a('Meridiam raises $4.5bn for multi-asset CV', 'fund_close', ['infrastructure'], 'opportunistic'))).toBe('secondaries')
    expect(secondariesClass(a('WhiteHorse Finance BDC pursues $680M continuation vehicle deal', 'capital_raise', ['credit'], 'continuation vehicle'))).toBe('secondaries')
    expect(secondariesClass(a('Foresight raises $458m for continued investment in mass transit operator Kinetic', 'capital_raise', ['PE'], 'continuation vehicle'))).toBe('secondaries')
  })

  it('takes a hire or a deal only on its headline or strategy, not on the tag alone', () => {
    expect(secondariesClass(a('Duff & Phelps’ EMEA secondary advisory team departs – exclusive', 'executive_departure', ['service_provider']))).toBe('secondaries')
    expect(secondariesClass(a('Sun Capital completes CV for Anderson Global', 'acquisition', ['PE'], 'continuation vehicle'))).toBe('secondaries')
    expect(secondariesClass(a('Amundi completes €620m stake purchase in ICG', 'acquisition', ['PE', 'secondaries', 'credit']))).toBeNull()
  })

  it('leaves alone what only sounds like it', () => {
    expect(secondariesClass(a('Hg completes secondary buyout of Visma unit', 'acquisition', ['PE']))).toBeNull()
    expect(secondariesClass(a('Blackstone sells shares in secondary offering', 'acquisition', ['PE']))).toBeNull()
    expect(secondariesClass(a('Cv Ventures closes $50m seed fund', 'fund_close', ['VC'], 'venture'))).toBeNull()
    // A strategy list that mentions secondaries among five others is a real assets fund.
    expect(secondariesClass(a('Apogem Capital raises its largest real assets fund, exceeds target, closes on $472m', 'fund_close', ['real_estate', 'infrastructure'], 'natural resources, energy, infrastructure, secondaries, direct investments'))).toBeNull()
    expect(secondariesClass(a('TPG raises $10bn for second climate private equity fund', 'fund_close', ['PE'], 'buyout'))).toBeNull()
  })
})

let seq = 0
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(o: Record<string, any>) {
  const { firm, fund, size, close, strategy, ...rest } = o
  return {
    id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`,
    source_url: `https://example.com/${seq}`,
    source_name: 'PE Hub',
    published_date: '2026-10-14',
    created_at: '2026-10-14T12:00:00Z',
    fund_categories: ['PE'],
    is_high_signal: true,
    relevance_score: 0.8,
    tldr: `${firm} announced the news described in the headline.`,
    article_type: rest.event_type,
    entities_raw: [{ name: firm, type: 'firm', role: null, confidence: 0.95 }],
    extracted_data: { firm_name: firm, fund_name: fund ?? null, fund_size_usd_millions: size ?? null, close_type: close ?? null, fund_strategy: strategy ?? null },
    ...rest,
  }
}

const day = () => [
  row({ title: 'GenNx360 closes $285m Churchill-led continuation fund for Whitsons Culinary Group', event_type: 'fund_close', firm: 'GenNx360', size: 285, close: 'final_close', strategy: 'buyout' }),
  row({ title: 'StepStone’s sixth PE secondaries fundraise passes halfway mark', event_type: 'capital_raise', firm: 'StepStone', size: 6000, fund_categories: ['PE', 'secondaries'], strategy: 'secondaries' }),
  row({ title: 'Collective Global eyes $1bn for sophomore GP stakes fund', event_type: 'capital_raise', firm: 'Collective Global', size: 1000, fund_categories: ['gp_stakes'], strategy: 'gp_stakes' }),
  row({ title: 'Audax Private Debt closes $10bn direct lending fund', event_type: 'fund_close', firm: 'Audax Private Debt', size: 10000, close: 'final_close', fund_categories: ['credit'], strategy: 'direct lending' }),
  row({ title: 'Thoma Bravo closes $3bn growth fund', event_type: 'fund_close', firm: 'Thoma Bravo', size: 3000, close: 'final_close', strategy: 'buyout' }),
  row({ title: 'Millennium launches $500m hedge fund', event_type: 'fund_launch', firm: 'Millennium', size: 500, fund_categories: ['hedge'] }),
  row({ title: 'Brookfield closes $2bn core infrastructure fund', event_type: 'fund_close', firm: 'Brookfield', size: 2000, close: 'final_close', fund_categories: ['infrastructure'] }),
]

describe('the email’s Secondaries section', () => {
  const content = assembleNewsletter(day(), buildPriorExclusions([], new Map()))
  const titles = (category: string) => content.groups.find((g) => g.category === category)?.articles.map((x) => x.title) ?? []

  it('holds secondaries funds, continuation vehicles and GP stakes funds, and Private Equity does not', () => {
    expect(titles('secondaries')).toEqual([
      'StepStone’s sixth PE secondaries fundraise passes halfway mark',
      'Collective Global eyes $1bn for sophomore GP stakes fund',
      'GenNx360 closes $285m Churchill-led continuation fund for Whitsons Culinary Group',
    ])
    expect(titles('PE')).toEqual(['Thoma Bravo closes $3bn growth fund'])
    expect(content.groups.find((g) => g.category === 'gp_stakes')).toBeUndefined()
    expect(content.groups.find((g) => g.category === 'secondaries')?.label).toBe('Secondaries & GP Stakes')
  })

  it('runs its fund sections in the order of the site’s asset-class tabs', () => {
    const siteOrder = SECTIONS.filter((s) => s.group === 'asset').map((s) => s.assetClasses![0])
    expect([...FUND_SECTION_ORDER]).toEqual(siteOrder)
    expect(content.groups.map((g) => g.category)).toEqual(['PE', 'credit', 'infrastructure', 'secondaries', 'hedge'])
  })
})

describe('the site’s Secondaries tab', () => {
  const secondaries = SECTION_BY_SLUG.get('secondaries')!

  it('is a continuation vehicle’s home section, and the PE tab still lists it', () => {
    const [s] = buildStories([day()[0]])
    expect(s.assetClasses).toEqual(['secondaries', 'PE'])
    expect(homeSectionFor(s)?.slug).toBe('secondaries')
    expect(storyInSection(s, SECTION_BY_SLUG.get('private-equity')!)).toBe(true)
  })

  it('lists a hire whose headline is about secondaries, in People as before', () => {
    const [s] = buildStories([
      row({ title: 'Duff & Phelps’ EMEA secondary advisory team departs', event_type: 'executive_departure', firm: 'Duff & Phelps', fund_categories: ['service_provider'], person_name: null }),
    ])
    expect(s.kind).not.toBe('fundraising')
    expect(storyInSection(s, secondaries)).toBe(true)
  })

  it('takes the tag from another report of the same fund, never from a different one', () => {
    const ares = buildStories([
      row({ title: 'Ares Raises $4.2 Billion for Inaugural Global Structured Solutions Fund', event_type: 'fund_close', firm: 'Ares', size: 4200, close: 'final_close', fund_categories: ['PE'], source_name: 'WSJ' }),
      row({ title: 'Ares raises $4.2bn for first structured solutions secondaries fund', event_type: 'fund_close', firm: 'Ares', size: 4200, close: 'final_close', fund_categories: ['PE', 'secondaries'], source_name: 'Secondaries Investor' }),
    ])
    expect(ares).toHaveLength(1)
    expect(homeSectionFor(ares[0])?.slug).toBe('secondaries')

    const tpg = buildStories([
      row({ title: 'TPG Gets $10 Billion for Climate PE Fund', event_type: 'capital_raise', firm: 'TPG', size: 10000, source_name: 'WSJ' }),
      row({ title: 'LA pension among backers of TPG’s second GP-led fund', event_type: 'capital_raise', firm: 'TPG', fund_categories: ['PE', 'secondaries'], strategy: 'secondaries', source_name: 'Buyouts' }),
    ])
    const climate = tpg.find((s) => s.headline.includes('Climate'))!
    expect(homeSectionFor(climate)?.slug).toBe('private-equity')
  })
})

describe('a reader who follows secondaries', () => {
  it('gets the continuation vehicle the classifier tagged PE', () => {
    const cv = { title: 'Certares, New 2ND Capital close continuation fund for Guardian Alarm', fundCategories: ['PE'], fundStrategy: null, eventType: 'fund_close' }
    expect(followsStory(cv, interestCategories(['secondaries']))).toBe(true)
    expect(followsStory(cv, interestCategories(['PE']))).toBe(true)
    expect(followsStory(cv, interestCategories(['credit']))).toBe(false)
  })
})
