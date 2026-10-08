import { describe, it, expect } from 'vitest'
import {
  assembleNewsletter, buildPriorExclusions, extractionMisaligned, isDealShaped, isWindDown,
  placeArticle, plainHeadline, rowToArticle,
} from '../query-articles'
import { cleanHeadline, splitHeadlineByEntities } from '@/lib/news/constants'
import { buildSubject } from '../send-daily'

let seq = 0
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(o: Record<string, any>) {
  const { firm, fund, size, close, person, role, ents, ...rest } = o
  return {
    id: `id-${++seq}`,
    source_url: `https://example.com/${seq}`,
    source_name: 'PE Hub',
    published_date: '2026-09-30',
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
const noMemory = buildPriorExclusions([], new Map())
const section = (content: ReturnType<typeof assembleNewsletter>, category: string) =>
  content.groups.find((g) => g.category === category)?.articles.map((a) => a.title) ?? []

describe('cleanHeadline', () => {
  it('strips publisher suffixes left by the Google News mirror', () => {
    expect(cleanHeadline('Westwind Capital holds first close for European living fund - pei', 'pei-privaterealestate.com')).toBe('Westwind Capital holds first close for European living fund')
    expect(cleanHeadline('Azerbaijan Investment Holding, Silk Road Fund launch USD 1 billion Joint Investment Fund - AZƏRTAC', 'AZERTAC')).toBe('Azerbaijan Investment Holding, Silk Road Fund launch USD 1 billion Joint Investment Fund')
    expect(cleanHeadline("'Clock is ticking' as ASIC warns private credit sector investors could bail - ABC News & Headlines", 'ABC')).toBe("'Clock is ticking' as ASIC warns private credit sector investors could bail")
    expect(cleanHeadline('Vistra Fund Solutions appoints COO - the', 'thedrawdown.co.uk')).toBe('Vistra Fund Solutions appoints COO')
  })
  it('strips house labels and trademark signs', () => {
    expect(cleanHeadline('Exclusive | Audax Private Debt Raises Third Direct-Lending Fund', 'WSJ')).toBe('Audax Private Debt Raises Third Direct-Lending Fund')
    expect(cleanHeadline('In brief: Arrow Global hires CSO', 'x')).toBe('Arrow Global hires CSO')
    expect(cleanHeadline('Seraya Partners Fund II nearly at $1.5bn target – exclusive', 'x')).toBe('Seraya Partners Fund II nearly at $1.5bn target')
    expect(cleanHeadline('Principal Asset Management® and Longevity Partners Launch a platform', 'x')).toBe('Principal Asset Management and Longevity Partners Launch a platform')
  })
  it('leaves a real trailing clause alone', () => {
    expect(cleanHeadline('Citadel rehires Matt Giannini – again', 'Hedgeweek')).toBe('Citadel rehires Matt Giannini – again')
    expect(cleanHeadline('KKR closes $6.6bn fund - its largest in Asia', 'x')).toBe('KKR closes $6.6bn fund - its largest in Asia')
    expect(cleanHeadline('Twin Bridge eyes $600 million for inaugural secondaries fund, report', 'x')).toBe('Twin Bridge eyes $600 million for inaugural secondaries fund, report')
  })
})

describe('headline bolding', () => {
  const bold = (title: string, ents: string[]) => splitHeadlineByEntities(title, ents).filter((s) => s.bold).map((s) => s.text)
  it('does not bold a lowercase word that happens to match a firm name', () => {
    expect(bold('Riverside backs French medical device CDMO Medical Group', ['Riverside', 'Medical Group'])).toEqual(['Riverside', 'Medical Group'])
  })
  it('matches dotted and undotted initials, and exact two-letter names', () => {
    expect(bold('Softcat Crosses the Atlantic with H.I.G.’s GDT', ['HIG Capital', 'Softcat'])).toEqual(['Softcat', 'H.I.G.'])
    expect(bold('Hg agrees majority investment in Greek software firm', ['Hg'])).toEqual(['Hg'])
  })
})

describe('row classification helpers', () => {
  it('spots a transaction filed as a fund event', () => {
    const deal = (title: string) => isDealShaped(rowToArticle(row({ title, event_type: 'capital_raise', firm: title.split(' ')[0] })))
    expect(deal('LLR Partners takes stake in energy management platform EnergyCAP')).toBe(true)
    expect(deal('Apollo provides $585m financing package to KKR-backed TEC')).toBe(true)
    expect(deal('Temasek takes 9% stake in Italian PE firm FSI')).toBe(true)
    expect(deal('Siguler Guff raises $3bn to back small buyouts')).toBe(false)
    expect(deal('British Business Bank backs Advent funds with £135m')).toBe(false)
  })
  it('tells a fund wind-down from a fund close', () => {
    const wind = (title: string, tldr = '') => isWindDown(rowToArticle(row({ title, tldr, event_type: 'fund_close', firm: 'X' })))
    expect(wind('$2 billion tech-focused hedge fund SoMa Equity Partners is closing down')).toBe(true)
    expect(wind('Magellan to close Vinva global equity fund', 'Magellan closing the fund; termination scheduled 12 October.')).toBe(true)
    expect(wind('Golden Age Capital closes debut Greek buyout fund at €250M')).toBe(false)
    expect(wind('Trilantic Spain spinout prepares for first-close')).toBe(false)
  })
  it('refuses extracted details that belong to another article', () => {
    expect(extractionMisaligned('Audax Agrees to Sell GCG to Rexel for $1.4 Billion', 'HighPost Capital', 'HighPost Capital launched aerospace vertical; David Walsh hired as lead.')).toBe(true)
    expect(extractionMisaligned('C.H. Guenther Brings Home the Hushpuppies', 'Pritzker Private Capital', 'PPC-backed C.H. Guenther acquired House-Autry Mills.')).toBe(false)
    expect(extractionMisaligned('Closing The Gap: FSC Sets New Industry Standards For Private Credit', 'Financial Services Council', 'Financial Services Council issues mandatory Standard 30.')).toBe(false)
  })
  it('swaps a punning headline for the plain first clause of the summary, for wordplay sources only', () => {
    const tldr = 'Butterfly Equity acquires Sabert, a manufacturer of food containers; second packaging add-on.'
    expect(plainHeadline('Butterfly Orders Takeout', tldr, 'Private Equity Professional')).toBe('Butterfly Equity acquires Sabert, a manufacturer of food containers')
    expect(plainHeadline('Butterfly Orders Takeout', tldr, 'PE Hub')).toBe('Butterfly Orders Takeout')
    expect(plainHeadline('Riverside’s T3 Services Group Acquires Element Home Services', tldr, 'Private Equity Professional')).toBe('Riverside’s T3 Services Group Acquires Element Home Services')
  })
})

describe('assembleNewsletter — sections', () => {
  it('files each story by what it is, not by the service_provider tag', () => {
    const content = assembleNewsletter([
      row({ title: 'SEC Risk Alert Highlights Adviser Compliance Review Expectations', event_type: 'regulatory_action', firm: null, ents: [], fund_categories: ['service_provider'], tldr: 'SEC issued a risk alert on adviser compliance reviews.' }),
      row({ title: 'Latham-Led Stride Wraps $550M Sophomore Fund', event_type: 'fund_close', firm: 'Stride', size: 550, close: 'final_close', fund_categories: ['credit', 'service_provider'], source_name: 'Law360 Private Equity' }),
      row({ title: 'CIFC hires Nick White to drive European growth', event_type: 'executive_hire', firm: 'CIFC Asset Management', person: 'Nick White', fund_categories: ['credit', 'service_provider'], tldr: 'CIFC Asset Management hired Nick White.' }),
      row({ title: 'Proskauer lands Kirkland partner for fund finance rebuild', event_type: 'executive_hire', firm: 'Proskauer', fund_categories: ['service_provider'], tldr: 'Proskauer hired a fund finance partner from Kirkland.' }),
      row({ title: 'King & Spalding adds disputes partner from Freshfields in Paris', event_type: 'executive_hire', firm: 'King & Spalding', fund_categories: ['service_provider'], tldr: 'King & Spalding hired an arbitration partner in Paris.' }),
      row({ title: 'La Caisse invests $75M in AlphaFixe Capital’s alternative credit strategy', event_type: 'capital_raise', firm: 'AlphaFixe Capital', size: 75, fund_categories: ['credit'] }),
      row({ title: 'LLR Partners takes stake in energy management platform EnergyCAP', event_type: 'capital_raise', firm: 'LLR Partners', ents: ['LLR Partners', 'EnergyCAP'] }),
    ], noMemory)
    expect(section(content, 'regulatory')).toEqual(['SEC Risk Alert Highlights Adviser Compliance Review Expectations'])
    expect(section(content, 'credit')).toEqual(['Latham-Led Stride Wraps $550M Sophomore Fund'])
    expect(section(content, 'people_moves')).toEqual(['CIFC hires Nick White to drive European growth'])
    expect(section(content, 'service_providers')).toEqual(['Proskauer lands Kirkland partner for fund finance rebuild'])
    expect(section(content, 'lp_commitments')).toEqual(['La Caisse invests $75M in AlphaFixe Capital’s alternative credit strategy'])
    expect(section(content, 'deals')).toEqual(['LLR Partners takes stake in energy management platform EnergyCAP'])
    expect(content.dropped?.find((d) => d.title.startsWith('King & Spalding'))?.reason).toMatch(/no fund relevance/)
  })

  it('a wind-down and a CLO run, but never as the lead', () => {
    const content = assembleNewsletter([
      row({ title: '$2 billion hedge fund SoMa Equity Partners is closing down', event_type: 'fund_close', firm: 'SoMa Equity Partners', size: 2000, fund_categories: ['hedge'], tldr: 'SoMa Equity Partners is shutting down.' }),
      row({ title: 'Palmer Square raises $241m for Excelsior hedge fund', event_type: 'capital_raise', firm: 'Palmer Square', size: 241, fund_categories: ['hedge'] }),
    ], noMemory)
    const hedge = content.groups.find((g) => g.category === 'hedge')!.articles
    expect(hedge.map((a) => [a.firmName, a.leadEligible])).toEqual([['Palmer Square', true], ['SoMa Equity Partners', false]])
  })

  it('a column of several items runs after the raises, whatever size its row carries, and names no subject line', () => {
    // 2026-10-05: the column's row held $707M, one item's figure, and would
    // have headed its section and the subject line of the next edition.
    const content = assembleNewsletter([
      row({ title: 'Field Notes: Farm Credit Canada eyes private capital partnerships for C$1bn fund; Permanent crops ‘abyss has a floor,’ says AgIS Capital', event_type: 'fund_launch', firm: 'Farm Credit Canada', fund: 'Area One Farms Fund V', size: 707, ents: ['Farm Credit Canada', 'Mondelez Canada'], source_name: 'Agri Investor', tldr: 'Farm Credit Canada eyes private capital partnerships for C$1 billion ($707M) fund; Area One Farms Fund V secured Mondelez Canada backing.' }),
      row({ title: 'Stride closes $550M sophomore fund', event_type: 'fund_close', firm: 'Stride', size: 550, close: 'final_close', source_name: 'Law360 Private Equity' }),
      row({ title: 'Ruya Ventures closes debut deep tech fund at $50m', event_type: 'fund_close', firm: 'Ruya Ventures', size: 50, close: 'final_close', source_name: 'AltAssets' }),
    ], noMemory)
    const pe = content.groups.find((g) => g.category === 'PE')!.articles
    expect(pe.map((a) => [a.firmName, a.leadEligible])).toEqual([['Stride', true], ['Ruya Ventures', true], ['Farm Credit Canada', false]])
    expect(buildSubject(content)).toBe('Stride, Ruya Ventures + 1 more')
  })
})

describe('assembleNewsletter — repeats', () => {
  it('collapses one first close reported under three firm names into one row', () => {
    const base = { event_type: 'fund_close', size: 54, close: 'first_close', fund_categories: ['VC'] }
    const content = assembleNewsletter([
      row({ ...base, title: 'IIT Madras, Unicorn India Ventures Mark First Close Of Fund I At ₹450 Cr', firm: 'IIT Madras', ents: ['IIT Madras', 'Unicorn India Ventures'], source_name: 'Inc42' }),
      row({ ...base, title: 'IITM Unicorn Frontier Fund I hits Rs 450 Cr first close', firm: 'Indian Institute of Technology Madras', fund: 'IITM Unicorn Frontier Fund I', ents: ['Unicorn India'], tldr: 'Indian Institute of Technology Madras and Unicorn India closed the fund.', source_name: 'YourStory.com' }),
      row({ ...base, title: 'IIT-M & Unicorn India hit ₹450 cr first close for its fund; Backs 4 deep-tech startups', firm: 'IIT Madras', fund: 'IIT-M Unicorn Frontier Fund I', ents: ['IIT Madras', 'Unicorn India'], tldr: 'IIT Madras and Unicorn India hit first close.', source_name: 'The Times of India' }),
    ], noMemory)
    expect(content.totalArticles).toBe(1)
  })

  it('does not re-run a deal that ran four editions ago under a different headline', () => {
    const first = row({ title: 'Bain Capital agrees $230m purchase of SOLitude Lake Management from Rentokil', event_type: 'acquisition', firm: 'Bain Capital', size: 230, ents: ['Bain Capital', 'SOLitude Lake Management', 'Rentokil'], tldr: 'Bain Capital agreed to buy SOLitude Lake Management from Rentokil.' })
    const filler = [1, 2, 3].map((i) => row({ title: `Filler firm ${i} hires someone`, event_type: 'executive_hire', firm: `Filler ${i}` }))
    const editions = [[filler[2].id], [filler[1].id], [filler[0].id], [first.id]] // newest first
    const memory = buildPriorExclusions(editions, new Map([first, ...filler].map((r) => [r.id, r])))
    const again = row({ title: 'Bain Capital Takes SOLitude Independent', event_type: 'acquisition', firm: 'Bain Capital', size: 230, ents: ['Bain Capital', 'SOLitude Lake Management', 'Rentokil Initial'], tldr: 'Bain Capital acquired SOLitude Lake Management from Rentokil Initial.', source_name: 'Private Equity Professional' })
    const fresh = row({ title: 'Bain Capital agrees to buy Kahua at $1bn valuation', event_type: 'acquisition', firm: 'Bain Capital', ents: ['Bain Capital', 'Kahua'], tldr: 'Bain Capital agreed to buy Kahua.' })
    const content = assembleNewsletter([again, fresh], memory)
    // The repeat is gone; the same sponsor's genuinely new deal still runs.
    expect(section(content, 'deals')).toEqual(['Bain Capital agrees to buy Kahua at $1bn valuation'])
    expect(content.dropped?.find((d) => d.id === again.id)?.reason).toMatch(/ran before/)
  })

  it('drops a multi-story wire when one of its items already has its own row', () => {
    const content = assembleNewsletter([
      row({ title: 'Atlantic Street Capital inks majority investment deal for HVAC distributor GLP', event_type: 'acquisition', firm: 'Atlantic Street Capital', ents: ['Atlantic Street Capital', 'GLP'], tldr: 'Atlantic Street Capital invested in GLP.' }),
      row({ title: 'Atlantic Street bets on HVAC with Canada’s GLP; GHK-backed WSB picks up engineering firm; LLR backs energy management biz', event_type: 'acquisition', firm: 'Atlantic Street Capital', ents: ['Atlantic Street Capital', 'GLP', 'GHK Capital Partners', 'WSB', 'LLR Partners'], tldr: 'Atlantic Street Capital invested in GLP; GHK-backed WSB acquired a firm; LLR Partners backed a platform.' }),
    ], noMemory)
    expect(section(content, 'deals')).toEqual(['Atlantic Street Capital inks majority investment deal for HVAC distributor GLP'])
  })
})

describe('assembleNewsletter — one hire, told with and without the name', () => {
  const hire = { event_type: 'executive_hire', fund_categories: ['credit'] }

  it('runs the Barings hire once (2026-10-06: it ran twice, in People Moves)', () => {
    const content = assembleNewsletter([
      row({ ...hire, title: 'Barings expands private credit naming global head of asset-based finance', firm: 'Barings', role: 'Global Head of Asset-Based Finance', published_date: '2026-10-05', source_name: 'Pensions & Investments', tldr: 'Barings appoints global head of asset-based finance to expand private credit platform.' }),
      row({ ...hire, title: 'Barings hires global head of ABF', firm: 'Barings', person: 'Sloan Sutta', role: 'Global Head of Asset-Based Finance', published_date: '2026-10-05', source_name: 'Alternative Credit Investor', tldr: 'Barings appointed Sloan Sutta as global head of asset-based finance (ABF).' }),
      // The same morning's other hires are not swept in.
      row({ ...hire, title: 'Millennium taps Jera power trader', firm: 'Millennium Management', person: 'Matthias Soreau', role: 'power trader', published_date: '2026-10-05', source_name: 'Hedge Week', tldr: 'Millennium Management hires Matthias Soreau.' }),
      row({ ...hire, title: 'Millennium adds veteran fixed-income exec as senior adviser', firm: 'Millennium', role: 'Senior Adviser', published_date: '2026-10-05', source_name: 'hedgeweek.com', tldr: 'Millennium has hired a veteran fixed-income executive as a senior adviser.' }),
    ], noMemory)
    expect(section(content, 'people_moves').filter((t) => t.startsWith('Barings'))).toEqual(['Barings expands private credit naming global head of asset-based finance'])
    expect(section(content, 'people_moves').filter((t) => t.startsWith('Millennium'))).toHaveLength(2)
    const barings = content.groups.flatMap((g) => g.articles).find((a) => a.firmName === 'Barings')!
    expect(barings.alsoCoveredBy).toEqual(['Alternative Credit Investor'])
    expect(barings.personName).toBe('Sloan Sutta')
  })

  it('does not run a hire again the next morning because the second report left the name out (VSS, 2026-10-02 and 10-03)', () => {
    const first = row({ ...hire, title: 'VSS Capital Partners hires ex-World Bank adviser Otilia Ciotau for AI role', firm: 'VSS Capital Partners', person: 'Otilia Ciotau', role: 'Managing Director, AI and Value Creation', published_date: '2026-10-01', tldr: 'VSS Capital Partners hires Otilia Ciotau as Managing Director of AI and Value Creation.' })
    const memory = buildPriorExclusions([[first.id]], new Map([[first.id, first]]))
    const again = row({ ...hire, title: 'VSS hires for AI value creation', firm: 'VSS', published_date: '2026-10-02', source_name: 'Alternatives Watch', tldr: 'VSS hires for AI value creation.' })
    const other = row({ ...hire, title: 'VSS names chief financial officer', firm: 'VSS', published_date: '2026-10-02', source_name: 'Alternatives Watch', tldr: 'VSS names a chief financial officer.' })
    const content = assembleNewsletter([again, other], memory)
    expect(section(content, 'people_moves')).toEqual(['VSS names chief financial officer'])
    expect(content.dropped?.find((d) => d.id === again.id)?.reason).toMatch(/ran before/)
  })
})

describe('placeArticle — an allocator\'s commitment is not fund news (2026-10-01…08 audit)', () => {
  const where = (title: string, o: Record<string, unknown>) => placeArticle(rowToArticle(row({ event_type: 'capital_raise', title, ...o })))?.section

  it('files sovereign funds, state councils and pension acronyms under LP Commitments', () => {
    expect(where('Norwegian wealth fund commits €1.2 billion to renewable energy infrastructure', { firm: 'Norwegian wealth fund', size: 1320, fund_categories: ['infrastructure'] })).toBe('lp_commitments')
    expect(where('New Mexico SIC makes two real estate commitments - pei', { firm: 'New Mexico State Investment Council', fund_categories: ['real_estate'] })).toBe('lp_commitments')
    expect(where('New Mexico adds over $1bn across bustling private markets', { firm: 'New Mexico', size: 1000 })).toBe('lp_commitments')
    expect(where('N.Y. State Common allocates over $600m to U.S. real estate', { firm: 'N.Y. State Common', size: 600 })).toBe('lp_commitments')
    expect(where('LACERA grows real assets portfolio with $200m commitment into Energy Capital fund', { firm: 'LACERA', fund: 'Energy Capital fund', size: 200 })).toBe('lp_commitments')
    expect(where('Texas County & District adds $250 million to direct lending portfolio', { firm: 'Texas County & District', size: 250, fund_categories: ['credit'] })).toBe('lp_commitments')
    expect(where('Investor Intentions: HFRRF reveals private equity pacing plan for 2027', { firm: 'HFRRF', size: 402 })).toBe('lp_commitments')
    expect(where('Investor Intentions: Korea Venture Investment Corporation seeks domestic blind-pool VC funds for 2026', { firm: 'Korea Venture Investment Corporation', size: 23, fund_categories: ['VC'] })).toBe('lp_commitments')
    expect(where('IFC raises $100m for Indian infra(2) - Infrastructure Investor', { firm: 'IFC', size: 100, fund_categories: ['infrastructure'] })).toBe('lp_commitments')
  })

  it('an allocator that "backs" a manager is a commitment, not a deal (Penn SERS, 10-07)', () => {
    expect(where('Penn SERS backs new PE manager despite losses in asset class', { firm: 'Penn SERS' })).toBe('lp_commitments')
    expect(where('PennSERS commits $130 million to buyout fund, co-investment sidecar', { firm: 'PennSERS', size: 130 })).toBe('lp_commitments')
    // …but a direct investment by a big allocator, or a GP's backing, is still a deal.
    expect(where('CPP Investments backs Prestige’s Indian hospitality platform with INR30bn', { firm: 'CPP Investments' })).toBe('deals')
    expect(where('Riverside backs French medical device CDMO Medical Group', { firm: 'Riverside' })).toBe('deals')
  })

  it('a GP\'s raise that names its LP is a fund raise (Tishman Speyer, 10-06)', () => {
    expect(where('Tishman Speyer Hits $395M Second Close of Korea Living Fund With German Pension Backing', { firm: 'Tishman Speyer', fund: 'Korea Living Fund', size: 395, close: 'interim_close', fund_categories: ['real_estate'] })).toBe('fund')
    // An LP in the lead of the headline is still an LP story.
    expect(where('German pension backs Tishman Speyer’s Korean residential fund', { firm: 'Tishman Speyer', fund: 'Tishman Speyer Korean Residential Fund', fund_categories: ['real_estate'] })).toBe('lp_commitments')
  })

  it('"to fund" is a verb: BC Partners financing LIV Golf is a deal (10-06)', () => {
    expect(where('BC Partners Credit commits up to $300m to fund LIV Golf restructuring', { firm: 'BC Partners', size: 300, fund_categories: ['credit'] })).toBe('deals')
    expect(where('Arkansas Teacher commits $200M to Ares Credit Fund', { firm: 'Ares', size: 200 })).toBe('lp_commitments')
  })

  it('does not mistake GP names for allocators', () => {
    expect(where('Blackstone raises $10bn for Strategic Partners fund', { firm: 'Blackstone', size: 10000, close: 'final_close' })).toBe('fund')
    expect(where('Texas Pacific Land raises $500m for energy fund', { firm: 'Texas Pacific Land', size: 500 })).toBe('fund')
  })
})

describe('the email never opens on an allocator', () => {
  it('leaves LP commitments out of the subject line', () => {
    const content = assembleNewsletter([
      row({ event_type: 'capital_raise', title: 'Norwegian wealth fund commits €1.2 billion to renewable energy infrastructure', firm: 'Norwegian wealth fund', size: 1320, fund_categories: ['infrastructure'] }),
      row({ event_type: 'fund_close', title: 'Princeton Equity Group closes $1.3bn Fund III at hard cap', firm: 'Princeton Equity Group', size: 1300, close: 'hard_cap' }),
    ], noMemory)
    expect(buildSubject(content)).not.toMatch(/Norwegian/)
    expect(buildSubject(content)).toMatch(/Princeton Equity/)
  })
})

describe('placeArticle — a transaction typed as a fund event is a deal (2026-10-02, 10-07 audit)', () => {
  const where = (title: string, o: Record<string, unknown>) => placeArticle(rowToArticle(row({ title, ...o })))?.section

  it('files exits, minority sales, company investments and fund restructurings under Deals', () => {
    expect(where('Partners Group restructures €6.6bn evergreen fund after redemption cap', { event_type: 'fund_close', firm: 'Partners Group', fund: 'Partners Group Global Value SICAV', size: 7260 })).toBe('deals')
    expect(where('Apposite Capital seals first Healthcare III exit with CrestOptics sale to Evident', { event_type: 'fund_close', firm: 'Apposite Capital', fund: 'Apposite Capital Healthcare III' })).toBe('deals')
    expect(where('Monzo turns to PE after Nubank ends takeover talks', { event_type: 'capital_raise', firm: 'CVC' })).toBe('deals')
    // Typed fund_launch with a stray "target" stage: the stage does not make it a raise.
    expect(where('AGR backs New Zealand goat dairy producer', { event_type: 'fund_launch', firm: 'AGR', size: 250, close: 'target' })).toBe('deals')
    expect(placeArticle(rowToArticle(row({ title: 'Partners Group restructures €6.6bn evergreen fund after redemption cap', event_type: 'fund_close', firm: 'Partners Group', size: 7260 })))?.leadEligible).toBe(false)
  })

  it('keeps a raise that mentions an exit or a stake', () => {
    expect(where('ECP closes third continuation vehicle at $834m after exiting first two', { event_type: 'fund_close', firm: 'Energy Capital Partners', size: 834, close: 'final_close' })).toBe('fund')
    expect(where('LP-backed Collective Global eyes $1bn for sophomore GP stakes fund', { event_type: 'fund_launch', firm: 'Collective Global', size: 1000, close: 'target', fund_categories: ['gp_stakes'] })).toBe('fund')
    expect(where('Stonelake grows opportunistic real estate strategy 34% with $1bn Fund VIII close', { event_type: 'fund_close', firm: 'Stonelake', size: 1000, fund_categories: ['real_estate'] })).toBe('fund')
    expect(where('British Business Bank backs Advent funds with £135m', { event_type: 'capital_raise', firm: 'Advent' })).toBe('lp_commitments')
  })

  it('a county is an allocator ("Sacramento County adds U.S. buyout fund")', () => {
    expect(where('Sacramento County adds U.S. buyout fund', { event_type: 'capital_raise', firm: 'Sacramento County' })).toBe('lp_commitments')
  })
})
