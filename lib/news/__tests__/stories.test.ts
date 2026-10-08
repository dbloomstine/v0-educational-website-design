import { describe, it, expect } from 'vitest'
import { buildStories, composeFrontPage, rankTop, storyHeat, type Story } from '../stories'
import { SECTIONS, homeSectionFor, storyInSection } from '../sections'
import { kickerLabel, sizeLabel, stageLabel, timeLabel } from '../format'
import { leagueRejection } from '../league'

let seq = 0
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(o: Record<string, any>) {
  const { firm, fund, size, close, person, role, ents, ...rest } = o
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
    extracted_data: { firm_name: firm ?? null, fund_name: fund ?? null, fund_size_usd_millions: size ?? null, close_type: close ?? null, person_name: person ?? null, person_title: role ?? null },
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

  it('drops a row that carries another article’s details, as the newsletter does', () => {
    // 2026-09-30: the classifier swapped two neighbours' results, and the Audax
    // headline was stored with HighPost Capital's hire. Firm pages are built
    // here, so this row must not reach /firm/highpost-capital — not even as
    // another outlet's coverage of the Audax sale.
    const stories = buildStories([
      row({
        title: 'Audax Agrees to Sell GCG to Rexel for $1.4 Billion', event_type: 'executive_hire', source_name: 'Private Equity Professional',
        firm: 'HighPost Capital', person: 'David Walsh', ents: ['HighPost Capital', 'Azimut Group'],
        tldr: 'HighPost Capital launched aerospace, defense & cybersecurity (ADC) vertical; David Walsh (ex-Navy, FON Advisors) hired as lead.',
      }),
      row({
        title: 'Audax agrees to sale of specialty wire and cable firm GCG to Rexel', event_type: 'acquisition',
        firm: 'Audax', ents: ['Audax', 'GCG', 'Rexel'], tldr: 'Audax sold portfolio company GCG, a specialty wire and cable distributor, to Rexel.',
      }),
    ])
    expect(stories).toHaveLength(1)
    expect(stories[0].firmName).toBe('Audax')
    expect(stories[0].memberIds).toHaveLength(1)
    expect(stories[0].coverage).toEqual([])
  })

  it('never lets a fund shutting down read as a raise', () => {
    const [s] = buildStories([
      row({ title: '$2 billion hedge fund SoMa Equity Partners is closing down', event_type: 'fund_close', firm: 'SoMa Equity Partners', size: 2000, fund_categories: ['hedge'], tldr: 'SoMa Equity Partners is shutting down.' }),
    ])
    expect(s.leadEligible).toBe(false)
    expect(stageLabel(s)).toBeNull()
  })

  // 2026-10-05, the front page's top story: "$707M · Launch". The row is a
  // column of four items; it carried the first item's firm and size and the
  // second item's fund.
  const fieldNotes = () => row({
    title: 'Field Notes: Farm Credit Canada eyes private capital partnerships for C$1bn fund; Permanent crops ‘abyss has a floor,’ says AgIS Capital',
    event_type: 'fund_launch', firm: 'Farm Credit Canada', fund: 'Area One Farms Fund V', size: 707, ents: ['Farm Credit Canada', 'Mondelez Canada'],
    fund_categories: ['PE'], source_name: 'Agri Investor',
    tldr: 'Farm Credit Canada eyes private capital partnerships for C$1 billion ($707M) fund; Area One Farms Fund V secured Mondelez Canada backing.',
  })

  it('a column of several items carries no size, fund or stage, and never leads (Field Notes, 2026-10-05)', () => {
    const stories = buildStories([
      fieldNotes(),
      row({ title: 'Palmer Square raises $241m for Excelsior hedge fund', event_type: 'capital_raise', firm: 'Palmer Square', size: 241, fund_categories: ['hedge'], source_name: 'Hedgeweek' }),
    ])
    const column = stories.find((s) => s.headline.startsWith('Field Notes'))!
    expect(column.roundup).toBe(true)
    expect([column.sizeUsdM, column.fundName, column.closeType, column.leadEligible]).toEqual([null, null, null, false])
    expect(stageLabel(column)).toBeNull()
    expect(leagueRejection(column)).toBe('multi-story wire')
    // It keeps what is true of the column as a whole.
    expect(column.summary).toMatch(/^Farm Credit Canada eyes/)
    const front = composeFrontPage(stories, NOW)
    expect(front.lead?.firmName).toBe('Palmer Square')
    expect(front.top.map((s) => s.id)).not.toContain(column.id)
  })

  it('a column is not a second story when one of its items has a row of its own on the page', () => {
    const stories = buildStories([
      row({ title: 'Viresco Group targets A$500m for debut Australian farmland fund', event_type: 'capital_raise', firm: 'Viresco Group', fund: 'Queensland Farmland Fund', size: 330, close: 'target', source_name: 'Agri Investor' }),
      row({ title: 'Field Notes: Viresco Group targets A$500m for debut farmland fund; Family-owned cold storage to benefit from nutrient density demand', event_type: 'capital_raise', firm: 'Viresco Group', fund: 'Queensland Farmland Fund', size: 330, close: 'target', source_name: 'Agri Investor' }),
    ])
    expect(stories.map((s) => s.headline)).toEqual(['Viresco Group targets A$500m for debut Australian farmland fund'])
    expect(stories[0].memberIds).toHaveLength(1) // the column is not inside the story either: it lends it nothing
  })

  it('a wire still runs when the only row that tells its item was turned away by the quality gate', () => {
    // 2026-08-06: PE Hub's own article on the deal ends "deal valuation not
    // disclosed" and has no size, which the gate reads as a placeholder.
    const stories = buildStories([
      row({ title: 'Partners Group to acquire Aroma-Zone from Eurazeo', event_type: 'acquisition', firm: 'Partners Group', ents: ['Partners Group', 'Aroma-Zone', 'Eurazeo'], tldr: 'Partners Group acquires Aroma-Zone (beauty/wellness brand founded 1999) from Eurazeo; deal valuation not disclosed.' }),
      row({ title: 'Partners Group in talks to buy beauty biz Aroma-Zone from Eurazeo; CVC, Veritas Capital vie for Bodycote', event_type: 'acquisition', firm: 'Partners Group', ents: ['Partners Group', 'Aroma-Zone', 'Eurazeo'], tldr: 'Partners Group is in talks to buy Aroma-Zone from Eurazeo; CVC and Veritas Capital are bidding for Bodycote.' }),
    ])
    expect(stories).toHaveLength(1)
    expect(stories[0].roundup).toBe(true)
    expect(stories[0].headline).toMatch(/^Partners Group in talks/)
  })

  it('a PE Hub wire is a roundup whatever names the classifier listed for it', () => {
    // Stored with Main Capital's purchase of Qbees, an item its headline does not carry.
    const [s] = buildStories([
      row({ title: 'Hg to debut in Greece with ERP and business software provider ES1; Elvaston makes first deal in Poland with warehouse management systems company', event_type: 'acquisition', firm: 'Main Capital Partners', ents: ['Main Capital Partners', 'Qbees'], tldr: 'Main Capital Partners acquired Qbees, German managed IT services and financial software provider; headline references separate Hg and Elvaston deals in Greece and Poland.' }),
    ])
    expect(s.roundup).toBe(true)
    expect(rankTop([s], NOW, 1)).toHaveLength(0)
  })

  it('shows a summary without the classifier’s remarks, and still selects on the summary as stored', () => {
    const stories = buildStories([
      row({ title: 'Adams Street names partner for venture secondaries', event_type: 'executive_hire', firm: 'Adams Street', source_name: 'Alternatives Watch', tldr: 'Adams Street names partner for venture secondaries strategy. Leadership hire at secondary fund manager.' }),
      // No size, and a summary the quality gate reads as a placeholder: turned
      // away before the change and after it. Cleaning is for the reader only.
      row({ title: 'Starlight Investments Announces Successful Close of UK BTR Fund II', event_type: 'fund_close', firm: 'Starlight Investments', fund: 'UK BTR Fund II', close: 'final_close', fund_categories: ['real_estate'], source_name: 'Yahoo Finance', tldr: 'Starlight Investments closes UK BTR Fund II; specific fund size not disclosed in snippet.' }),
    ])
    expect(stories.map((s) => s.summary)).toEqual(['Adams Street names partner for venture secondaries strategy.'])
  })

  it('leaves a single story with a semicolon alone', () => {
    const [s] = buildStories([
      row({ title: 'TPG Gets $10 Billion for Climate PE Fund; to Close for New Cash', event_type: 'capital_raise', firm: 'TPG', fund: 'TPG Climate PE Fund', size: 10000, source_name: 'Bloomberg.com' }),
    ])
    expect([s.roundup, s.leadEligible, s.sizeUsdM, s.fundName]).toEqual([false, true, 10000, 'TPG Climate PE Fund'])
  })
})

const story = (o: Partial<Story>): Story => ({
  id: uuid(), memberIds: [], headline: 'A headline', url: 'https://example.com', source: 'PE Hub', summary: 'A summary of what happened.',
  coverage: [], kind: 'fundraising', assetClasses: ['PE'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 500,
  firmName: null, fundName: null, personName: null, geography: [], entities: [], firms: [], leadEligible: true, roundup: false,
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

describe('a deal re-reported a week later', () => {
  const first = { event_type: 'acquisition', firm: '73 Strings', ents: ['73 Strings', 'Callisto'], published_date: '2026-09-24', created_at: '2026-09-24T14:00:00Z' }
  it('is one story when the acquirer, the parties and the stage all match', () => {
    const stories = buildStories([
      row({ ...first, title: '73 Strings buys Callisto to build up private markets automation' }),
      row({ ...first, title: '73 Strings Acquires Callisto', published_date: '2026-09-30', created_at: '2026-09-30T14:00:00Z', source_name: 'Business Wire' }),
    ])
    expect(stories).toHaveLength(1)
    expect(stories[0].coverage).toHaveLength(1)
  })
  it('stays two stories when the same buyer does a different deal that week', () => {
    const stories = buildStories([
      row({ ...first, title: '73 Strings buys Callisto to build up private markets automation' }),
      row({ ...first, ents: ['73 Strings', 'Acme Data'], title: '73 Strings acquires Acme Data', published_date: '2026-09-30', created_at: '2026-09-30T14:00:00Z' }),
    ])
    // Whatever else the gates do with them, the two are never filed as one story.
    expect(stories.every((s) => s.coverage.length === 0)).toBe(true)
  })
})

describe('section names in running text', () => {
  it('reads as English: "All LP stories", not "All lps stories"', async () => {
    const { sectionNoun, SECTION_BY_SLUG } = await import('../sections')
    expect(sectionNoun(SECTION_BY_SLUG.get('lps')!)).toBe('LP')
    expect(sectionNoun(SECTION_BY_SLUG.get('secondaries')!)).toBe('secondaries and GP stakes')
    expect(sectionNoun(SECTION_BY_SLUG.get('private-equity')!)).toBe('private equity')
  })
})

describe('one hire, told with and without the name (Barings, 2026-10-05)', () => {
  const hire = { event_type: 'executive_hire', firm: 'Barings', fund_categories: ['credit'], published_date: '2026-10-05' }
  const barings = () => [
    row({ ...hire, title: 'Barings expands private credit naming global head of asset-based finance', role: 'Global Head of Asset-Based Finance', source_name: 'Pensions & Investments', is_high_signal: false, relevance_score: 0.5, tldr: 'Barings appoints global head of asset-based finance to expand private credit platform.' }),
    row({ ...hire, title: 'Barings hires global head of ABF', person: 'Sloan Sutta', role: 'Global Head of Asset-Based Finance', source_name: 'Alternative Credit Investor', relevance_score: 0.7, tldr: 'Barings appointed Sloan Sutta as global head of asset-based finance (ABF), overseeing the firm\'s $60bn ABF platform spanning public and private markets across commercial, consumer and residential strategies.', entities_raw: [{ name: 'Barings', type: 'firm', role: 'employer', confidence: 0.95 }, { name: 'Sloan Sutta', type: 'person', role: 'Global Head of Asset-Based Finance', confidence: 0.9 }] }),
    row({ ...hire, title: 'Barings Appoints Asset-Based Finance Head - ai', role: 'Head of Asset-Based Finance', source_name: 'ai-cio.com', is_high_signal: false, relevance_score: 0.5, tldr: 'Barings appoints asset-based finance head.' }),
  ]

  it('is one story, with the other outlets as coverage and the person it names', () => {
    const stories = buildStories(barings())
    expect(stories).toHaveLength(1)
    const [s] = stories
    expect(s.kind).toBe('people')
    expect(s.memberIds).toHaveLength(3)
    expect(s.source).toBe('Pensions & Investments') // best desk leads, though its report names nobody
    expect(s.coverage.map((c) => c.source)).toContain('Alternative Credit Investor')
    // The name and the fuller summary come from the report that has them.
    expect(s.personName).toBe('Sloan Sutta')
    expect(s.summary).toMatch(/Sloan Sutta/)
  })

  it('leaves two hires one firm made on one day as two stories', () => {
    const day = { event_type: 'executive_hire', fund_categories: ['hedge'], published_date: '2026-10-05' }
    const stories = buildStories([
      row({ ...day, title: 'Millennium adds veteran fixed-income exec as senior adviser', firm: 'Millennium Management', person: 'Nick Howard', role: 'senior adviser', source_name: 'Hedge Week', tldr: 'Millennium Management adds Nick Howard as senior adviser in London.' }),
      row({ ...day, title: 'Millennium adds veteran fixed-income exec as senior adviser', firm: 'Millennium', role: 'Senior Adviser', source_name: 'hedgeweek.com', tldr: 'Millennium has hired a veteran fixed-income executive as a senior adviser.' }),
      row({ ...day, title: 'Millennium taps Jera power trader', firm: 'Millennium Management', person: 'Matthias Soreau', role: 'power trader', source_name: 'Hedge Week', tldr: 'Millennium Management hires Matthias Soreau to expand Tokyo energy trading operation.' }),
      row({ ...day, title: 'Millennium taps Jera power trader', firm: 'Millennium', role: 'Power Trader', source_name: 'hedgeweek.com', tldr: 'Millennium has hired a trader from Jera to expand its power trading operations.' }),
    ])
    expect(stories.map((s) => s.memberIds.length).sort()).toEqual([2, 2])
  })

  it('does not tie a nameless report to a named one from the week before', () => {
    const [nameless, named] = barings()
    const stories = buildStories([{ ...nameless, published_date: '2026-10-09', created_at: '2026-10-09T14:00:00Z' }, named])
    expect(stories).toHaveLength(2)
  })
})

describe('one raise, re-reported by another outlet five days on (DIG Ventures, 2026-10-01 and 10-06)', () => {
  it('is one story when it names the same fund, however the firm is spelled', () => {
    const stories = buildStories([
      row({ title: 'DIG Ventures raises $120m third fund to target Europe’s AI infrastructure startups', event_type: 'fund_close', firm: 'DIG Ventures', fund: 'DIG Ventures Fund III', size: 120, close: 'final_close', fund_categories: ['VC'], published_date: '2026-10-01', created_at: '2026-10-01T11:00:00Z', source_name: 'AltAssets' }),
      row({ title: 'Dig’s new fund bets on infrastructure built around foundation models', event_type: 'fund_close', firm: 'Dig', fund: 'Dig Fund III', close: 'final_close', fund_categories: ['VC'], published_date: '2026-10-06', created_at: '2026-10-06T21:00:00Z', source_name: 'Venture Capital Journal' }),
    ])
    expect(stories).toHaveLength(1)
  })
  it('two different funds from one firm a week apart stay two', () => {
    const stories = buildStories([
      row({ title: 'Headline raises $400m eighth European fund as it doubles down on AI', event_type: 'fund_close', firm: 'Headline', fund: 'Headline Fund VIII', size: 400, close: 'final_close', fund_categories: ['VC'], published_date: '2026-10-01', created_at: '2026-10-01T11:00:00Z' }),
      row({ title: 'Headline launches $150m growth opportunities fund', event_type: 'fund_close', firm: 'Headline', fund: 'Headline Growth Opportunities Fund', size: 150, close: 'final_close', fund_categories: ['VC'], published_date: '2026-10-07', created_at: '2026-10-07T11:00:00Z' }),
    ])
    expect(stories).toHaveLength(2)
  })
})
