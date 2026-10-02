import { describe, it, expect } from 'vitest'
import { barValue, barsBiggest, barsByManager, barsByMarket, barsByRegion, barsBySize, barsByWeek, barsFor, inWindow, mondayOf, usd, type ChartClose } from '../chart-math'

let seq = 0
const mk = (o: Partial<ChartClose>): ChartClose => ({ id: `c${++seq}`, f: 'Firm', s: 'firm', n: null, v: 100, d: '2026-09-20', a: 'PE', r: null, o: 1, ...o })
const TODAY = '2026-09-30' // a Wednesday
const LABELS = { PE: 'Private equity', VC: 'Venture & growth', credit: 'Credit' }

const closes = [
  mk({ f: 'Ares Management', s: 'ares', v: 4200, a: 'credit', r: 'North America', d: '2026-09-29' }),
  mk({ f: 'Ares', s: 'ares', v: 1150, a: 'PE', r: 'Global', d: '2026-09-28' }),
  mk({ f: 'ICG', s: 'icg', v: 13200, a: 'credit', r: 'Europe', d: '2026-09-09' }),
  mk({ f: 'Bessemer', s: 'bessemer', v: 5750, a: 'VC', r: 'North America', d: '2026-09-25' }),
  mk({ f: 'Airnergize', s: 'airnergize', v: 215, a: 'VC', r: 'Africa', d: '2026-09-14' }),
  mk({ f: 'NoTag Capital', s: 'notag', v: 60, a: null, r: null, d: '2026-09-02' }),
  mk({ f: 'Old Fund', s: 'old', v: 900, a: 'PE', r: 'Europe', d: '2026-07-01' }),
]

describe('periods', () => {
  it('keeps the closes of the last N days, today included', () => {
    expect(inWindow(closes, 7, TODAY).map((c) => c.s)).toEqual(['ares', 'ares', 'bessemer'])
    expect(inWindow(closes, 30, TODAY)).toHaveLength(6)
    expect(inWindow(closes, 90, TODAY)).toHaveLength(6) // Jul 1 is 91 days back
    expect(inWindow([mk({ d: '2026-10-05' })], 30, TODAY)).toHaveLength(0) // nothing from the future
  })
})

describe('the cuts', () => {
  const rows = inWindow(closes, 30, TODAY)
  it('by market: largest first, untagged closes shown as Other rather than dropped', () => {
    const bars = barsByMarket(rows, LABELS)
    expect(bars.map((b) => [b.label, b.capital, b.count])).toEqual([
      ['Credit', 17400, 2], ['Venture & growth', 5965, 2], ['Private equity', 1150, 1], ['Other', 60, 1],
    ])
    // The bars account for every dollar.
    expect(bars.reduce((s, b) => s + b.capital, 0)).toBe(rows.reduce((s, c) => s + c.v, 0))
    // Inside a bar, the largest fund comes first.
    expect(bars[0].closes[0].f).toBe('ICG')
  })
  it('by market, counting funds instead of dollars, reorders', () => {
    const bars = barsByMarket(rows, LABELS, 'count')
    expect(bars.slice(0, 2).map((b) => b.count)).toEqual([2, 2])
    expect(barValue(bars[0], 'count')).toBe(2)
  })
  it('by region: small regions folded, "not stated" shown last and never hidden', () => {
    const bars = barsByRegion(rows)
    expect(bars.map((b) => b.label)).toEqual(['Europe', 'North America', 'Global / several', 'Elsewhere', 'Not stated'])
    expect(bars[bars.length - 1]).toMatchObject({ key: 'none', capital: 60 })
  })
  it('by size: bands in order of size, empty bands kept so the scale reads', () => {
    const bars = barsBySize(rows)
    expect(bars.map((b) => b.count)).toEqual([1, 1, 0, 2, 2])
    expect(bars.reduce((s, b) => s + b.count, 0)).toBe(rows.length)
  })
  it('by week: Monday-start weeks, oldest first, the current one marked unfinished', () => {
    expect(mondayOf('2026-09-30')).toBe('2026-09-28')
    expect(mondayOf('2026-09-28')).toBe('2026-09-28')
    expect(mondayOf('2026-09-27')).toBe('2026-09-21')
    const bars = barsByWeek(closes, TODAY, 4)
    expect(bars.map((b) => b.key)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'])
    expect(bars.map((b) => b.capital)).toEqual([13200, 215, 5750, 5350])
    expect(bars.map((b) => !!b.partial)).toEqual([false, false, false, true])
  })
  it('the largest funds: one bar each, linked to the firm', () => {
    const bars = barsBiggest(rows, 3)
    expect(bars.map((b) => [b.label, b.capital])).toEqual([['ICG', 13200], ['Bessemer', 5750], ['Ares Management', 4200]])
    expect(bars[0].href).toBe('/firm/icg')
  })
  it('managers: a firm’s funds are added up under its fuller name', () => {
    const bars = barsByManager(rows)
    expect(bars.map((b) => b.key)).toEqual(['icg', 'bessemer', 'ares', 'airnergize', 'notag'])
    expect(bars[2]).toMatchObject({ key: 'ares', label: 'Ares Management', capital: 5350, count: 2, href: '/firm/ares' })
  })
  it('barsFor picks the cut and the period; weeks ignore the period', () => {
    const opts = { today: TODAY, measure: 'capital' as const, labels: LABELS }
    expect(barsFor('market', closes, { ...opts, period: 7 }).reduce((s, b) => s + b.count, 0)).toBe(3)
    expect(barsFor('weeks', closes, { ...opts, period: 7 })).toHaveLength(12)
  })
})

describe('labels', () => {
  it('writes dollars the way the league does', () => {
    expect([usd(87), usd(550), usd(1150), usd(5400), usd(13200), usd(105_000)]).toEqual(['$87M', '$550M', '$1.1B', '$5.4B', '$13B', '$105B'])
  })
})
