import { describe, expect, it } from 'vitest'
import { firmJsonLd, firmSummary, firmTitle, yearInNewYork } from '../firm-summary'
import type { FundClose } from '../league'

let seq = 0
const close = (fund: string | null, sizeUsdM: number, date: string, o: Partial<FundClose> = {}): FundClose =>
  ({ id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`, memberIds: [], firm: 'Ares', firmSlug: 'ares', fund, sizeUsdM, stage: 'final', date, assetClass: 'credit', headline: `Ares closes ${fund ?? 'fund'}`, source: null, url: '', sources: 1, outlets: [], converted: false, region: null, altSizeUsdM: null, ...o }) as FundClose

describe('the answer at the top of a firm page', () => {
  it('says nothing when the firm has no close', () => {
    expect(firmSummary('Ares Management', [], 2026)).toBeNull()
  })

  it('counts and totals the final closes of the year, and names the largest', () => {
    const closes = [
      close('Ares Pathfinder III', 12_700, '2026-08-11'),
      close('Ares Senior Direct Lending Fund IV', 3_000, '2026-05-02'),
      close('Ares Climate Infrastructure Partners II', 1_500, '2026-09-30'),
      close('Ares Real Estate Income Fund', 1_000, '2026-03-12'),
    ]
    expect(firmSummary('Ares Management', closes, 2026)).toBe(
      'Ares Management has held 4 final fund closes in 2026 that FundOpsHQ has reported, totalling $18.2B. The largest is Ares Pathfinder III at $12.7B, first reported August 11.',
    )
  })

  it('reads one close as one, and leaves first and interim closes out of the total', () => {
    expect(firmSummary('Ares Management', [close('Ares Pathfinder III', 12_700, '2026-08-11')], 2026)).toBe(
      'Ares Management has held one final fund close in 2026 that FundOpsHQ has reported: Ares Pathfinder III at $12.7B, first reported August 11.',
    )
    const mixed = [
      close('Ares Pathfinder III', 12_700, '2026-08-11'),
      close('Ares Pathfinder III', 6_000, '2026-03-20', { stage: 'first' }),
      close('Ares Europe Fund', 900, '2026-06-01', { stage: 'interim' }),
    ]
    expect(firmSummary('Ares Management', mixed, 2026)).toBe(
      'Ares Management has held one final fund close in 2026 that FundOpsHQ has reported: Ares Pathfinder III at $12.7B, first reported August 11. It has also held a first close and an interim close.',
    )
  })

  it('names the largest first or interim close when there is no final one', () => {
    expect(firmSummary('Arini', [close('Arini Credit Fund II', 500, '2026-06-03', { stage: 'first' })], 2026)).toBe(
      'Arini has held a first close in 2026 that FundOpsHQ has reported: Arini Credit Fund II at $500M (first close, reported June 3).',
    )
    const two = [close('Fund A', 300, '2026-04-01', { stage: 'first' }), close('Fund B', 450, '2026-07-09', { stage: 'first' })]
    expect(firmSummary('Arini', two, 2026)).toBe(
      'Arini has held 2 first closes in 2026 that FundOpsHQ has reported; the largest is Fund B at $450M (first close, reported July 9).',
    )
  })

  it('says "about" for a size converted from another currency, in the close and in a total that includes it', () => {
    const eqt = [close('EQT X', 23_400, '2026-05-14', { converted: true }), close('EQT Nexus', 1_000, '2026-06-01')]
    const s = firmSummary('EQT', eqt, 2026)!
    expect(s).toContain('totalling about $24.4B')
    expect(s).toContain('The largest is EQT X at about $23.4B')
    expect(firmSummary('EQT', [close('EQT Nexus', 1_000, '2026-06-01')], 2026)).not.toContain('about')
  })

  it('says so when the reports did not name the fund', () => {
    expect(firmSummary('Northwind', [close(null, 1_000, '2026-10-21')], 2026)).toBe(
      'Northwind has held one final fund close in 2026 that FundOpsHQ has reported: a fund the reports did not name, at $1B, first reported October 21.',
    )
  })

  it('leads with the current year and adds earlier years only when there are closes in them', () => {
    const closes = [
      close('Fund IV', 2_000, '2027-02-01'),
      close('Fund III', 1_500, '2026-05-01'),
      close('Fund II', 500, '2026-09-01'),
      close('Fund II', 200, '2026-04-01', { stage: 'first' }),
    ]
    expect(firmSummary('Ares Management', closes, 2027)).toBe(
      'Ares Management has held one final fund close in 2027 that FundOpsHQ has reported: Fund IV at $2B, first reported February 1. In 2026 it held 2 final closes, totalling $2B.',
    )
  })

  it('falls back to the latest year with a close, in the past tense, when the current year has none', () => {
    const closes = [close('Fund III', 1_500, '2026-05-01'), close('Fund II', 500, '2026-09-01')]
    expect(firmSummary('Ares Management', closes, 2027)).toBe(
      'Ares Management held 2 final fund closes in 2026 that FundOpsHQ reported, totalling $2B. The largest is Fund III at $1.5B, first reported May 1.',
    )
  })

  it('takes the year in New York', () => {
    expect(yearInNewYork(new Date('2027-01-01T03:00:00Z').getTime())).toBe(2026)
    expect(yearInNewYork(new Date('2027-01-01T06:00:00Z').getTime())).toBe(2027)
  })
})

describe('the firm page title', () => {
  it('carries the year when the firm has a close in it, and promises no closes it does not have', () => {
    expect(firmTitle('Ares Management', [close('Fund III', 1_500, '2026-05-01')], 2026)).toBe('Ares Management: 2026 fund closes, deals and news')
    expect(firmTitle('Ares Management', [close('Fund III', 1_500, '2026-05-01')], 2027)).toBe('Ares Management: fund closes, deals and news')
    expect(firmTitle('CalPERS', [], 2026)).toBe('CalPERS: news, deals and people moves')
  })
})

describe('the firm page structured data', () => {
  it('describes the page, names the firm without inventing its website, and lists the closes as our story pages', () => {
    const closes = [close('Ares Pathfinder III', 12_700, '2026-08-11'), close(null, 900, '2026-06-01', { stage: 'interim', converted: true })]
    const ld = firmJsonLd('ares', 'Ares Management', 'Ares Management: 2026 fund closes, deals and news', closes, 'An answer.')
    expect(ld).toMatchObject({
      '@type': 'CollectionPage',
      url: 'https://fundopshq.com/firm/ares',
      description: 'An answer.',
      about: { '@type': 'Organization', name: 'Ares Management' },
      mainEntity: { '@type': 'ItemList', numberOfItems: 2 },
    })
    expect(ld.about).not.toHaveProperty('url')
    expect(ld.about).not.toHaveProperty('sameAs')
    const items = (ld.mainEntity as { itemListElement: { name: string; url: string; position: number }[] }).itemListElement
    expect(items[0]).toMatchObject({ position: 1, name: 'Ares Pathfinder III — final close, $12.7B' })
    expect(items[0].url).toMatch(/^https:\/\/fundopshq\.com\/story\//)
    expect(items[1].name).toBe('Fund not named in the reports — interim close, about $900M')
  })

  it('has no list and no description when there is nothing to put in them', () => {
    const ld = firmJsonLd('calpers', 'CalPERS', 'CalPERS: news, deals and people moves', [], null)
    expect(ld).not.toHaveProperty('mainEntity')
    expect(ld).not.toHaveProperty('description')
  })
})
