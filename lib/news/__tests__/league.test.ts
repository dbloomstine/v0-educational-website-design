import { describe, it, expect } from 'vitest'
import {
  buildLeague, buildLeagueReport, capitalByAsset, capitalByWeek, closesBySize, firmSlug, fundLabel, fundNameTokens, fundNumbers,
  leagueRows, regionOf, sameFirmName, settleSize, sizeIsTarget, weekCloses, type FundClose,
} from '../league'

let seq = 0
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(o: Record<string, any>) {
  const { firm, fund, size, close = 'final_close', currency, ...rest } = o
  return {
    id: uuid(),
    source_url: `https://example.com/${seq}`,
    source_name: 'AltAssets',
    published_date: '2026-09-20',
    created_at: '2026-09-20T14:00:00Z',
    fund_categories: ['PE'],
    is_high_signal: true,
    relevance_score: 0.8,
    tldr: `${firm} closed ${fund ?? 'its fund'} at $${size}M.`,
    article_type: 'fund_close',
    event_type: 'fund_close',
    entities_raw: [{ name: firm, type: 'firm', role: null, confidence: 0.95 }],
    extracted_data: { firm_name: firm, fund_name: fund ?? null, fund_size_usd_millions: size ?? null, close_type: close, original_currency: currency ?? null },
    ...rest,
  }
}
const NOW = new Date('2026-09-30T18:00:00Z').getTime()

describe('what gets into the league table', () => {
  it('admits a plain final close and carries its evidence', () => {
    const [c] = buildLeague([row({ firm: 'Northcote Equity', fund: 'Northcote Equity Fund II', size: 318, title: 'Northcote Equity closes Fund II at $318m' })])
    expect(c).toMatchObject({ firm: 'Northcote Equity', firmSlug: 'northcote', sizeUsdM: 318, stage: 'final', date: '2026-09-20', sources: 1 })
    expect(c.url).toContain('example.com')
  })
  it('keeps out a fund that has not closed yet, whatever the classifier called it', () => {
    const rows = [
      row({ firm: 'Advent International', size: 26000, title: 'Advent International closes in on $26bn mega buyout fund' }),
      row({ firm: 'ECP', size: 8000, title: 'ECP eyes $8bn close after LPs back hard-cap revision' }),
      row({ firm: 'Founders Fund', size: 6000, title: 'Founders Fund nears $6B close for latest growth fund, sources say' }),
      row({ firm: 'Keppel', fund: 'Data Centre Fund III', size: 2000, title: 'Keppel ‘very close’ to $2bn close for Data Centre Fund III' }),
    ]
    expect(buildLeague(rows)).toHaveLength(0)
  })
  it('does not mistake ordinary words for "not yet"', () => {
    const rows = [
      row({ firm: 'Starwood', fund: 'Starwood Fund XIII', size: 10200, title: 'Starwood eyes ‘attractive entry point’ after $10.2bn close for Fund XIII' }),
      row({ firm: 'Serent Capital', fund: 'Serent Fund VI', size: 1300, title: 'Serent Capital takes less than 90 days to close $1.3bn Fund VI, its biggest fund yet' }),
      row({ firm: 'Blackbird', fund: 'Blackbird Fund VI', size: 740, title: 'Blackbird hits $740m Fund VI record close to back ANZ founders' }),
    ]
    expect(buildLeague(rows).map((c) => c.firm).sort()).toEqual(['Blackbird', 'Serent Capital', 'Starwood'])
  })
  it('keeps out things that are called a close and are not a fund close', () => {
    const rows = [
      row({ firm: 'AQR', fund: 'Long-Short Equity Fund', size: 8000, fund_categories: ['hedge'], title: 'AQR to soft close $8bn Long-Short Equity fund' }),
      row({ firm: 'Pershing Square', fund: 'Pershing Square USA', size: 5000, title: 'Pershing Square Completes Record $5 Billion Closed-End Fund IPO' }),
      row({ firm: 'Ares', size: 1700, title: 'Ares, Antares close $1.7bn continuation vehicle' }),
      row({ firm: 'JPMorgan', size: 1400, fund_categories: ['real_estate'], title: 'JPMorgan pulls plug on $1.4B real estate fund after years of losses' }),
      row({ firm: 'Ares', size: 30000, title: 'Ares’ record $30 billion fundraising eases private credit ‘doomsday’ fears' }),
    ]
    expect(buildLeague(rows)).toHaveLength(0)
  })
  it('refuses a size outside the range any fund has ever been', () => {
    expect(buildLeague([row({ firm: 'Example Capital', fund: 'Example Fund I', size: 250000, title: 'Example Capital closes Fund I at $250bn' })])).toHaveLength(0)
  })
})

describe('one fund, one row', () => {
  it('joins a later write-up of the same close, dated to the first report', () => {
    const rows = [
      row({ firm: 'KKR', fund: 'KKR North America Private-Equity Fund', size: 23000, published_date: '2026-04-02', title: 'KKR Closes Record $23 Billion North America Private-Equity Fund' }),
      row({ firm: 'KKR', fund: 'XIV', size: 23000, published_date: '2026-04-27', source_name: 'Buyouts', title: 'KKR raises $23bn for biggest PE fund dedicated to North America' }),
    ]
    const league = buildLeague(rows)
    expect(league).toHaveLength(1)
    expect(league[0].date).toBe('2026-04-02')
  })
  it('joins a firm and its initials', () => {
    const rows = [
      row({ firm: 'Copenhagen Infrastructure Partners', fund: 'Growth Markets Fund II', size: 3000, title: 'Copenhagen Infrastructure Partners’ Growth Markets Fund II closes at USD 3 billion' }),
      row({ firm: 'CIP', fund: 'II', size: 3000, published_date: '2026-09-27', source_name: 'IJGlobal', title: 'CIP hits $3bn final close for second growth markets renewables strategy' }),
    ]
    expect(buildLeague(rows)).toHaveLength(1)
    expect(sameFirmName('Energy Capital Partners', 'ECP')).toBe(true)
    expect(sameFirmName('Energy Capital Partners', 'EQT')).toBe(false)
  })
  it('keeps two funds from one manager apart', () => {
    const rows = [
      row({ firm: 'Blackstone', fund: 'Blackstone Life Sciences VI', size: 6300, title: 'Blackstone closes $6.3bn life sciences fund' }),
      row({ firm: 'Blackstone', fund: 'Blackstone Asia Fund', size: 13100, published_date: '2026-09-27', title: 'Blackstone closes $13.1 billion Asia fund' }),
    ]
    expect(buildLeague(rows)).toHaveLength(2)
  })
  it('keeps a first close and a final close of one fund as two rows', () => {
    const rows = [
      row({ firm: 'Example Partners', fund: 'Example Fund III', size: 400, close: 'first_close', published_date: '2026-05-02', title: 'Example Partners holds $400m first close for Fund III' }),
      row({ firm: 'Example Partners', fund: 'Example Fund III', size: 900, title: 'Example Partners closes Fund III at $900m' }),
    ]
    expect(buildLeague(rows).map((c) => c.stage).sort()).toEqual(['final', 'first'])
  })
})

describe('corrections win', () => {
  const r = row({ firm: 'Dangote', fund: 'Dangote Fund', size: 2500, title: 'Dangote closes $2.5bn fund' })
  it('hide removes the row', () => {
    expect(buildLeague([r], [{ news_item_id: r.id, action: 'hide' }])).toHaveLength(0)
  })
  it('set replaces only what it names', () => {
    const [c] = buildLeague([r], [{ news_item_id: r.id, action: 'set', size_usd_millions: 2400, firm_name: 'Dangote Capital' }])
    expect(c).toMatchObject({ firm: 'Dangote Capital', firmSlug: 'dangote', sizeUsdM: 2400, fund: 'Dangote Fund' })
  })
})

describe('reading the table', () => {
  const mk = (o: Partial<FundClose>): FundClose => ({
    id: uuid(), memberIds: [], firm: 'A', firmSlug: 'a', fund: null, sizeUsdM: 100, stage: 'final', date: '2026-09-20',
    assetClass: 'PE', headline: '', source: null, url: '', sources: 1, outlets: [], converted: false, region: null, altSizeUsdM: null, ...o,
  })
  const all = [
    mk({ sizeUsdM: 5000, assetClass: 'credit', date: '2026-09-25' }),
    mk({ sizeUsdM: 300, assetClass: 'PE', date: '2026-09-10' }),
    mk({ sizeUsdM: 80, assetClass: 'VC', date: '2026-06-01' }),
    mk({ sizeUsdM: 900, assetClass: 'PE', date: '2026-09-12', stage: 'first' }),
  ]
  it('filters by period, stage and asset class; final closes by default', () => {
    expect(leagueRows(all, { period: '30d' }, NOW)).toHaveLength(2)
    expect(leagueRows(all, { period: 'ytd' }, NOW)).toHaveLength(3)
    expect(leagueRows(all, { period: '30d', stage: 'all' }, NOW)).toHaveLength(3)
    expect(leagueRows(all, { period: 'ytd', asset: 'VC' }, NOW)).toHaveLength(1)
  })
  it('chart series add up to the table', () => {
    const byAsset = capitalByAsset(all, NOW, { PE: 'Private equity', credit: 'Credit', VC: 'Venture' })
    expect(byAsset.map((b) => [b.label, b.value, b.count])).toEqual([['Credit', 5000, 1], ['Private equity', 300, 1]])
    const weeks = capitalByWeek(all, NOW, 4)
    expect(weeks).toHaveLength(4)
    expect(weeks.reduce((s, w) => s + w.value, 0)).toBe(5300)
    expect(closesBySize(all, NOW).reduce((s, b) => s + b.count, 0)).toBe(2)
  })
  it('names a firm page and a fund number sensibly', () => {
    expect(firmSlug('Ares Management')).toBe('ares')
    expect(firmSlug('Thoma Bravo')).toBe('thoma-bravo')
    expect(fundLabel('XIV')).toBe('Fund XIV')
    expect(fundLabel('Fund XIV')).toBe('Fund XIV')
  })
})

// ─── 2026-10-02: one fund, two figures ──────────────────────────────────────
// An audit of every pair of rows from one manager found funds counted twice
// because the reports disagreed on the figure. These are those cases.

describe('one fund reported with two figures is one row', () => {
  it('uses the fund’s own figure, not the total that adds sister vehicles, and keeps the other as a note', () => {
    const rows = [
      row({ firm: 'EIG', fund: 'Senior Infrastructure Debt Fund VI', size: 4000, published_date: '2026-09-09', fund_categories: ['infrastructure'], source_name: 'Business Wire', title: 'EIG Announces Final Close of Senior Infrastructure Debt Fund VI With $4.0 Billion Raised Across Its Direct Lending Platform' }),
      row({ firm: 'EIG', fund: 'EIG Senior Infrastructure Debt Fund VI', size: 1900, published_date: '2026-09-10', fund_categories: ['infrastructure'], source_name: 'AltAssets', title: 'EIG nearly doubles infrastructure debt fund to $1.9bn, total raised for latest series tops $4bn' }),
    ]
    const league = buildLeague(rows)
    expect(league).toHaveLength(1)
    expect(league[0]).toMatchObject({ sizeUsdM: 1900, altSizeUsdM: 4000, date: '2026-09-09', sources: 2 })
    // The row is represented by the report that carries the figure it shows.
    expect(league[0].headline).toContain('$1.9bn')
  })
  it('reads a local currency taken for dollars as the lower figure, and names the manager in full', () => {
    const rows = [
      row({ firm: 'Blackbird', fund: 'Blackbird 2025 Funds', size: 1100, published_date: '2026-08-16', fund_categories: ['VC'], title: 'Blackbird Closes Sixth Fund Above $1 Billion, Short of Its Own Record' }),
      row({ firm: 'Blackbird Ventures', fund: 'Blackbird Fund VI', size: 740, published_date: '2026-08-25', fund_categories: ['VC'], source_name: 'PitchBook', currency: 'AUD', title: 'Blackbird hits $740m Fund VI record close to back ANZ founders' }),
      row({ firm: 'Blackbird Ventures', fund: 'Blackbird Fund VI', size: 740, published_date: '2026-08-25', fund_categories: ['VC'], source_name: 'Venture Capital Journal', currency: 'AUD', title: 'Blackbird broadens LP base for Fund VI and hits record $740m' }),
    ]
    const [c, ...rest] = buildLeague(rows)
    expect(rest).toHaveLength(0)
    // "≈" is for a figure we converted. PitchBook's headline already says "$740m".
    expect(c).toMatchObject({ firm: 'Blackbird Ventures', sizeUsdM: 740, altSizeUsdM: 1100, converted: false })
  })
  it('takes the later figure when the smaller one is an earlier stage of the raise', () => {
    // Six weeks apart: the June filing is not the fund's final size.
    expect(settleSize([
      { sizeUsdM: 84, date: '2026-06-15', sources: 2 },
      { sizeUsdM: 125, date: '2026-07-28', sources: 3 },
    ])).toEqual({ sizeUsdM: 125, altSizeUsdM: null })
  })
  it('treats figures within a few percent as one figure, read from the best-sourced report', () => {
    expect(settleSize([
      { sizeUsdM: 800, date: '2026-03-31', sources: 2 },
      { sizeUsdM: 750, date: '2026-04-07', sources: 1 },
    ])).toEqual({ sizeUsdM: 800, altSizeUsdM: null })
  })
  it('ignores a stray small number', () => {
    expect(settleSize([
      { sizeUsdM: 2000, date: '2026-05-01', sources: 4 },
      { sizeUsdM: 300, date: '2026-05-02', sources: 1 },
    ])).toEqual({ sizeUsdM: 2000, altSizeUsdM: null })
  })
  it('joins an unnamed report to a numbered one on the same fund number', () => {
    const rows = [
      row({ firm: 'Hamilton Lane', size: 3800, published_date: '2026-07-01', source_name: 'Yahoo Finance', title: 'Hamilton Lane Holds Final Close of Sixth Direct Equity Fund, Raising $3.8 Billion in and alongside the Fund' }),
      row({ firm: 'Hamilton Lane', size: 3800, published_date: '2026-07-02', source_name: 'Private Equity Wire', title: 'Hamilton Lane raises $3.8bn for sixth direct equity fund' }),
      row({ firm: 'HL', fund: 'HL Equity Opportunities Fund VI', size: 2500, published_date: '2026-07-06', source_name: 'Buyouts', title: 'HL touts distributions as it closes new direct equity fund' }),
    ]
    const league = buildLeague(rows)
    expect(league).toHaveLength(1)
    expect(league[0]).toMatchObject({ firm: 'Hamilton Lane', firmSlug: 'hamilton-lane', fund: 'HL Equity Opportunities Fund VI', sizeUsdM: 2500, altSizeUsdM: 3800 })
  })
  it('joins two first-close reports whose headlines state the same original figure', () => {
    const rows = [
      row({ firm: 'Charterhouse Capital Partners', size: 1640, close: 'first_close', published_date: '2026-03-03', title: 'Charterhouse raises €1bn first close for CCP XII' }),
      row({ firm: 'Charterhouse', size: 1100, close: 'first_close', published_date: '2026-03-02', source_name: 'Bloomberg', currency: 'EUR', title: 'Charterhouse Said to Raise €1 Billion at First Close of New Fund' }),
    ]
    const league = buildLeague(rows)
    expect(league).toHaveLength(1)
    expect(league[0].sizeUsdM).toBe(1100)
  })
})

describe('two funds stay two rows', () => {
  it('never joins different fund numbers, even on an identical figure', () => {
    const rows = [
      row({ firm: 'Eurazeo', fund: 'Eurazeo Direct Lending Fund VI', size: 2530, published_date: '2026-08-18', fund_categories: ['credit'], title: 'Eurazeo closes sixth direct lending fund on €2.3bn' }),
      row({ firm: 'Eurazeo', fund: 'Eurazeo Fund V', size: 2530, published_date: '2026-07-06', fund_categories: ['secondaries'], title: 'Eurazeo surpasses target for its largest-ever secondaries vehicle at $2.53bn' }),
    ]
    expect(buildLeague(rows)).toHaveLength(2)
  })
  it('keeps one manager’s two funds apart when they close in the same week', () => {
    const rows = [
      row({ firm: 'Ares Management', fund: 'I', size: 4200, published_date: '2026-10-01', fund_categories: ['credit'], title: 'Ares Blows Past Target to Raise $4.2 Billion for Structured Fund' }),
      row({ firm: 'Ares', fund: 'PE secondaries Fund I', size: 1150, published_date: '2026-09-29', fund_categories: ['PE'], title: 'Ares raises $1.15bn for PE secondaries Fund I' }),
    ]
    expect(buildLeague(rows)).toHaveLength(2)
  })
  it('does not take two firms for one because their names shrink to the same letter', () => {
    expect(sameFirmName('Capital A', 'A* Capital')).toBe(false)
    expect(sameFirmName('Hamilton Lane', 'HL')).toBe(true)
    expect(sameFirmName('KKR', 'KKR & Co.')).toBe(true)
  })
  it('reads fund numbers from names and headlines, and knows a stage from a number', () => {
    expect([...fundNumbers({ fund: 'West Street Capital Partners IX', headline: '' })]).toEqual([9])
    expect([...fundNumbers({ fund: 'Dawson GP Finance 2', headline: '' })]).toEqual([2])
    expect([...fundNumbers({ fund: null, headline: 'Blackbird Closes Sixth Fund Above $1 Billion' })]).toEqual([6])
    expect([...fundNumbers({ fund: null, headline: 'Seine Capital closes debut fund above target' })]).toEqual([1])
    // "First close" is a stage; "second-largest" is a rank; neither is a fund number.
    expect([...fundNumbers({ fund: null, headline: 'Charterhouse Said to Raise €1 Billion at First Close of New Fund' })]).toEqual([])
    expect([...fundNumbers({ fund: null, headline: 'Blue Owl closes its second-largest fund' })]).toEqual([])
    expect([...fundNumbers({ fund: 'Blackbird 2025 Funds', headline: '' })]).toEqual([])
  })
  it('knows which words in a fund’s name are its own', () => {
    expect(fundNameTokens({ firm: 'EIG', fund: 'EIG Senior Infrastructure Debt Fund VI' })).toEqual(['senior', 'infrastructure', 'debt'])
    expect(fundNameTokens({ firm: 'Hamilton Lane', fund: 'HL Equity Opportunities Fund VI' })).toEqual([])
    expect(fundNameTokens({ firm: 'Hines', fund: 'Hines European Value-Add Fund' })).toEqual(['value', 'add'])
  })
})

describe('more things that are not a fund close', () => {
  it('keeps out a mandate and an evergreen vehicle, and keeps in a fund that mentions managed accounts', () => {
    const rows = [
      row({ firm: 'Partners Group', size: 1000, fund_categories: ['credit'], title: 'Partners Group secures $1bn Asia private credit mandate' }),
      row({ firm: 'Hercules Capital', fund: 'Hercules Evergreen Fund', size: 2300, fund_categories: ['credit'], title: 'Hercules closes $2.3bn of capital for private credit' }),
      row({ firm: 'Siguler Guff', fund: 'Small Buyout Opportunities Fund VI LP', size: 3000, title: 'Siguler Guff closed its Small Buyout Opportunities Fund VI LP with total capital exceeding $3B ($2.3B commingled, $700M separately managed accounts)' }),
    ]
    expect(buildLeague(rows).map((c) => c.firm)).toEqual(['Siguler Guff'])
  })
  it('does not rank a target as money closed', () => {
    const first = { close: 'first_close' }
    const rows = [
      row({ ...first, firm: 'N49P', fund: 'N49P Fund IV', size: 70, title: 'N49P eyes $70m for fourth Canada-focused tech seed fund, hits $25m first close' }),
      row({ ...first, firm: 'Eighteen48 Partners', size: 385, title: 'Eighteen48 Partners hits halfway mark in €350m-targeting debut fundraise' }),
      row({ ...first, firm: 'Redstone', fund: 'Blue Fund', size: 28, title: 'Redstone Reaches First Close Of €25 Million Blue Fund To Back Ocean Technology Startups' }),
      row({ ...first, firm: 'Founders First', size: 50, title: 'Founders First hits first close en route to $50m for private credit fund' }),
      // 2026-10-03: filed as an interim close of $1.5bn. Halfway to $1.5bn is about $750m, and the report names no close.
      row({ close: 'interim_close', firm: 'Seraya', size: 1500, fund_categories: ['infrastructure'], event_type: 'capital_raise', article_type: 'capital_raise', title: 'Seraya hits halfway mark for $1.5bn sophomore infra fund' }),
    ]
    expect(buildLeague(rows)).toHaveLength(0)
    expect(sizeIsTarget('CIP confirms €1.3bn first close for Green Credit fund', 1430, 'first')).toBe(false)
    // The figure a fund has closed on is not its target, even when the headline also says how far along it is.
    expect(sizeIsTarget('Northcote reaches halfway mark with $500m first close', 500, 'first')).toBe(false)
  })
  it('counts a final close at, or past, its target', () => {
    const rows = [
      row({ firm: 'Triton Partners', fund: 'Triton Fund 6', size: 6050, title: 'Triton Partners closes Fund 6 at €5.5bn target' }),
      row({ firm: 'Charterhouse Capital Partners', fund: 'Charterhouse Capital Partners XII', size: 1650, title: 'Charterhouse surpasses €1.5bn target for latest flagship' }),
    ]
    expect(buildLeague(rows)).toHaveLength(2)
  })
})

describe('closes no report put a number on', () => {
  it('are counted, never ranked — and not when the table already has that close', () => {
    const report = buildLeagueReport([
      row({ firm: 'SeaAhead', fund: 'SeaAhead Fund I', size: null, fund_categories: ['VC'], title: 'SeaAhead closes debut fund to back ocean-tech startups', tldr: 'SeaAhead closed its debut fund.' }),
      row({ firm: 'Northcote Equity', fund: 'Northcote Equity Fund II', size: 318, title: 'Northcote Equity closes Fund II at $318m' }),
      row({ firm: 'Northcote Equity', fund: null, size: null, published_date: '2026-09-27', source_name: 'PE Hub', title: 'Northcote Equity wraps up second flagship fund', tldr: 'Northcote Equity closed its second fund.' }),
    ])
    expect(report.closes.map((c) => c.firm)).toEqual(['Northcote Equity'])
    expect(report.unsized.map((u) => u.firm)).toEqual(['SeaAhead'])
    expect(report.unsized[0]).toMatchObject({ stage: 'final', assetClass: 'VC' })
  })
})

describe('small things the pages rely on', () => {
  it('one region per close', () => {
    expect(regionOf(['Europe'])).toBe('Europe')
    expect(regionOf(['North America', 'Europe'])).toBe('Global')
    expect(regionOf([])).toBeNull()
    expect(regionOf(null)).toBeNull()
  })
  it('labels several fund numbers as several funds', () => {
    expect(fundLabel('III / I')).toBe('Funds III / I')
  })
  it('the week’s closes: every stage listed, final closes totalled', () => {
    const mk = (o: Partial<FundClose>): FundClose => ({
      id: uuid(), memberIds: [], firm: 'A', firmSlug: 'a', fund: null, sizeUsdM: 100, stage: 'final', date: '2026-09-28',
      assetClass: 'PE', headline: '', source: null, url: '', sources: 1, outlets: [], converted: false, region: null, altSizeUsdM: null, ...o,
    })
    const all = [mk({ sizeUsdM: 900 }), mk({ sizeUsdM: 400, stage: 'first', assetClass: 'VC' }), mk({ sizeUsdM: 5000, date: '2026-09-10' })]
    const week = weekCloses(all, NOW)
    expect(week.rows.map((c) => c.sizeUsdM)).toEqual([900, 400])
    expect(week).toMatchObject({ finals: 1, capitalUsdM: 900 })
    expect(weekCloses(all, NOW, { assetClasses: ['VC'] }).rows).toHaveLength(1)
  })
})

describe('the ≈ mark', () => {
  it('follows the headline’s own currency, and one stray currency field does not set it', () => {
    const eur = buildLeague([row({ firm: 'Azora', fund: 'Azora Southern Europe Fund', size: 2310, currency: 'EUR', title: 'Azora closes largest-ever Southern Europe fund on €2.1bn' })])
    expect(eur[0].converted).toBe(true)
    const usd = buildLeague([
      row({ firm: 'Oaktree Capital Management', fund: 'Oaktree Asset-Backed Finance Fund I', size: 2000, currency: 'GBP', title: 'Oaktree closes debut ABF fund on $2bn' }),
    ])
    expect(usd[0].converted).toBe(false)
  })
})
