import { describe, expect, it } from 'vitest'
import { buildFinder } from '../finder'
import { finderMeta, finderScore, matchFinder, namedTrades, peopleSearches, type FinderEntry } from '../finder-match'
import type { CategoryId } from '../taxonomy'
import { card } from './fixtures'

const e = (over: Partial<FinderEntry>): FinderEntry => ({ k: 'page', t: 'Fund Lawyers', h: '/fund-lawyers', n: 10, c: 'Fund Lawyers', ...over })

const ENTRIES: FinderEntry[] = [
  e({ k: 'trade', t: 'Fund Lawyers', h: '/fund-lawyers', n: 1334 }),
  e({ k: 'trade', t: 'Fund Auditors', h: '/fund-auditors', n: 284, c: 'Fund Auditors' }),
  e({ t: 'Hedge Fund Lawyers', h: '/fund-lawyers/hedge-funds', n: 362, w: 'hedge hedgefund hedgefunds' }),
  e({ t: 'Hedge Fund Lawyers in New York', h: '/fund-lawyers/hedge-funds/new-york', n: 150, w: 'hedge hedgefund hedgefunds new york city nyc manhattan ny' }),
  e({ t: 'Venture Fund Lawyers in New York', h: '/fund-lawyers/venture-funds/new-york', n: 160, w: 'vc vcs venture ventures new york city nyc manhattan ny' }),
  e({ t: 'Venture Fund Auditors', h: '/fund-auditors/venture-funds', n: 98, c: 'Fund Auditors', w: 'vc vcs venture ventures' }),
  e({ t: 'Hedge Fund Tax Advisors', h: '/fund-tax-advisors/hedge-funds', n: 95, c: 'Fund Tax Advisors', w: 'hedge' }),
  e({ k: 'firm', t: 'Kirkland & Ellis', h: '/fund-lawyers/firms/kirkland-ellis', n: 251 }),
  e({ k: 'ranking', t: 'Hedge Fund Law Firms', h: '/fund-lawyers/hedge-funds/firms', n: 22, w: 'hedge' }),
]

describe('the directory finder', () => {
  it('puts the most specific page first', () => {
    expect(matchFinder(ENTRIES, 'hedge fund lawyers new york')[0].h).toBe('/fund-lawyers/hedge-funds/new-york')
    expect(matchFinder(ENTRIES, 'hedge fund lawyers')[0].h).toBe('/fund-lawyers/hedge-funds')
  })

  it('reads everyday words and city nicknames', () => {
    expect(matchFinder(ENTRIES, 'vc attorney nyc')[0].h).toBe('/fund-lawyers/venture-funds/new-york')
  })

  it('keeps to a trade the query names', () => {
    expect(namedTrades('vc attorney nyc')).toEqual(['Fund Lawyers'])
    expect(matchFinder(ENTRIES, 'vc attorney').every((x) => x.c === 'Fund Lawyers')).toBe(true)
    expect(matchFinder(ENTRIES, 'hedge fund cpa').map((x) => x.h)).toEqual(['/fund-tax-advisors/hedge-funds'])
    // No trade named: every trade's pages.
    expect(new Set(matchFinder(ENTRIES, 'hedge').map((x) => x.c)).size).toBeGreaterThan(1)
  })

  it('finds a firm by a slip of its name, and never on a filler word alone', () => {
    expect(matchFinder(ENTRIES, 'kirkland')[0].k).toBe('firm')
    expect(matchFinder(ENTRIES, 'kirklnd')[0].k).toBe('firm')
    expect(finderScore('the best', ENTRIES[2])).toBe(0)
    expect(matchFinder(ENTRIES, '   ')).toEqual([])
  })

  it('offers the hubs’ people search for a name, in the trade named', () => {
    const t = [
      { plural: 'Fund Lawyers', slug: 'fund-lawyers' },
      { plural: 'Fund Auditors', slug: 'fund-auditors' },
    ]
    expect(peopleSearches(t, 'Smith').map((s) => s.href)).toEqual(['/fund-lawyers?q=Smith', '/fund-auditors?q=Smith'])
    expect(peopleSearches(t, 'smith auditor').map((s) => s.href)).toEqual(['/fund-auditors?q=smith+auditor'])
  })

  it('says what each suggestion holds', () => {
    expect(finderMeta(ENTRIES[7])).toBe('Fund Lawyers · 251 listed')
    expect(finderMeta(ENTRIES[8])).toBe('22 firms ranked')
  })
})

describe('building the finder', () => {
  const ny = { city: 'New York', state: 'NY' }
  const bos = { city: 'Boston', state: 'MA' }
  const law = [
    ...Array.from({ length: 6 }, () => card({ practice_areas: ['hedge_funds'], offices: [ny] })),
    ...Array.from({ length: 6 }, () => card({ firm_name: 'Sidley Austin', firm_domain: 'sidley.com', practice_areas: ['hedge_funds'], offices: [ny] })),
    card({ firm_name: 'Sidley Austin', firm_domain: 'sidley.com', title: 'Counsel', offices: [bos] }),
    card({ status: 'hidden' }),
  ]
  const f = buildFinder(new Map<CategoryId, ReturnType<typeof card>[]>([['fund_lawyer', law]]))

  it('counts only the public people, and who is at partner level', () => {
    expect(f.trust).toMatchObject({ people: 13, firms: 2, senior: 12 })
    expect(f.trades).toHaveLength(1)
    expect(f.trades[0]).toMatchObject({ id: 'fund_lawyer', count: 13, firms: 2 })
  })

  it('lists the trade, its pages, its firms and its rankings, each once', () => {
    const hrefs = f.entries.map((x) => x.h)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(f.entries.find((x) => x.k === 'trade')?.h).toBe('/fund-lawyers')
    expect(hrefs).toContain('/fund-lawyers/hedge-funds')
    expect(f.entries.filter((x) => x.k === 'firm').map((x) => x.t).sort()).toEqual(['Kirkland & Ellis', 'Sidley Austin'])
    expect(f.entries.find((x) => x.h === '/fund-lawyers/hedge-funds/new-york' || x.h === '/fund-lawyers/new-york')?.w).toContain('nyc')
  })

  it('fills the strategy and city tables from the pages that exist', () => {
    expect(f.strategies.find((r) => r.key === 'hedge_funds')?.cells.fund_lawyer?.count).toBe(12)
    expect(f.cities.find((r) => r.key === 'new-york')?.cells.fund_lawyer?.count).toBe(12)
    expect(f.cities.find((r) => r.key === 'boston')).toBeUndefined()
    expect(f.firms.map((x) => x.name)).toEqual(['Sidley Austin', 'Kirkland & Ellis'])
  })
})
