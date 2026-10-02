import { describe, it, expect } from 'vitest'
import { buildLeague, capitalByAsset, capitalByWeek, closesBySize, firmSlug, fundLabel, leagueRows, sameFirmName, type FundClose } from '../league'

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
    assetClass: 'PE', headline: '', source: null, url: '', sources: 1, converted: false, ...o,
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
