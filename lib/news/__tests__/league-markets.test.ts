import { describe, expect, it } from 'vitest'
import { LEAGUE_MARKETS, marketBySlug, marketForAsset, marketSummary, marketTitle } from '../league-markets'
import { LEAGUE_ASSET_LABEL, type FundClose } from '../league'

const close = (firm: string, fund: string | null, sizeUsdM: number, date: string, o: Partial<FundClose> = {}): FundClose =>
  ({ id: `${firm}-${sizeUsdM}`, memberIds: [], firm, firmSlug: firm.toLowerCase(), fund, sizeUsdM, stage: 'final', date, assetClass: 'credit', headline: '', source: null, url: '', sources: 1, outlets: [], converted: false, region: null, ...o }) as FundClose

describe('the league market pages', () => {
  it('has a page for every market the league ranks, and none for hedge funds', () => {
    expect(LEAGUE_MARKETS.map((m) => m.asset).sort()).toEqual(Object.keys(LEAGUE_ASSET_LABEL).filter((a) => a !== 'hedge').sort())
    expect(new Set(LEAGUE_MARKETS.map((m) => m.slug)).size).toBe(LEAGUE_MARKETS.length)
    for (const m of LEAGUE_MARKETS) expect(m.slug).toMatch(/^[a-z-]+$/)
    expect(marketBySlug('private-credit')?.asset).toBe('credit')
    expect(marketBySlug('hedge-funds')).toBeNull()
    expect(marketForAsset('gp_stakes')?.slug).toBe('gp-stakes')
  })

  it('titles each page as the search is typed', () => {
    expect(marketTitle(marketBySlug('private-credit')!, 2026)).toBe('Largest private credit fund closes of 2026')
    expect(marketTitle(marketBySlug('gp-stakes')!, 2026)).toBe('Largest GP stakes fund closes of 2026')
  })

  it('answers in its first sentence, from the rows as ranked', () => {
    const m = marketBySlug('private-credit')!
    const rows = [close('Arini', 'Arini Direct Lending Fund I', 4000, '2026-10-20'), close('Northwind Group', 'Debt Fund III', 1000, '2026-10-21')]
    expect(marketSummary(m, rows, 2026)).toBe(
      'The largest private credit fund close reported in 2026 so far is Arini Direct Lending Fund I at $4B, first reported October 20. FundOpsHQ has ranked 2 final closes in private credit this year, totalling $5B.',
    )
    expect(marketSummary(m, [close('Northwind Group', 'Debt Fund III', 1000, '2026-10-21', { converted: true })], 2026)).toContain(
      'is Northwind Group’s Debt Fund III at about $1B',
    )
    expect(marketSummary(m, [close('Northwind Group', null, 1000, '2026-10-21')], 2026)).toContain('is a fund from Northwind Group at $1B')
    expect(marketSummary(m, [close('Northwind Group', null, 1000, '2026-10-21')], 2026)).toContain('one final close in private credit')
    expect(marketSummary(m, [], 2026)).toBe('No final close in private credit has been reported with a size in 2026 so far.')
  })
})
