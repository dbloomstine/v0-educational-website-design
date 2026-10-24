import { describe, expect, it } from 'vitest'
import { intentFor } from '../intent'
import { intentPage, parseIntent } from '../intent-route'
import {
  FIRMLIST_MIN_FIRMS,
  FIRMLIST_PLACE_MIN_FIRMS,
  FIRMLIST_PLACE_MIN_PEOPLE,
  firmItemListJsonLd,
  firmListSearchTitle,
  firmListSentence,
  firmListSet,
  firmListTitle,
  rankFirms,
  resolveFirmList,
} from '../firm-lists'
import { firmListFaq, landingFaq } from '../faq'
import { firmsOf } from '../firms'
import { itemListJsonLd, landingSet, landingTitle, peopleFor, resolveLanding } from '../landing'
import { haystack, runQuery, scoreQuery } from '../search'
import { toRow } from '../rows'
import { CATEGORIES } from '../taxonomy'
import { jsonLdScript } from '@/lib/news/story-jsonld'
import { card } from './fixtures'
import type { PersonCard } from '../people'

const L = CATEGORIES.fund_lawyer
const A = CATEGORIES.fund_auditor
const T = CATEGORIES.fund_tax_advisor

/** `n` people at each of `firms` firms, in a city, with practices. */
function crowd(firms: number, n: number, over: Partial<PersonCard> = {}, tag = 'f'): PersonCard[] {
  const out: PersonCard[] = []
  for (let f = 0; f < firms; f++)
    for (let i = 0; i < n; i++) out.push(card({ firm_name: `Firm ${tag}${f}`, firm_domain: `${tag}${f}.com`, full_name: `Pat ${tag}${f}x${i}`, ...over }))
  return out
}

describe('intent → canonical page (2026-10-24 intent map)', () => {
  // Every page the map names, as if it existed.
  const exists = () => true
  const page = (q: string, fallback?: Parameters<typeof parseIntent>[1]) => intentPage(parseIntent(q, fallback), exists)

  it.each([
    ['venture capital lawyer', '/fund-lawyers/venture-funds'],
    ['VC fund attorney', '/fund-lawyers/venture-funds'],
    ['hedge fund law firm', '/fund-lawyers/hedge-funds/firms'],
    ['hedge fund formation attorney', '/fund-lawyers/hedge-funds'],
    ['lawyer to help set up a private equity fund', '/fund-lawyers/private-equity-funds'],
    ['a lawyer to help set up a real estate fund', '/fund-lawyers/real-estate-funds'],
    ['real estate fund attorney nyc', '/fund-lawyers/real-estate-funds/new-york'],
    ['private equity law firms new york', '/fund-lawyers/private-equity-funds/new-york/firms'],
    ['fund formation attorney', '/fund-lawyers/fund-formation'],
    ['private fund attorney', '/fund-lawyers'],
    ['investment fund law firms', '/fund-lawyers/firms'],
    ['RIA compliance attorney', '/fund-lawyers/funds-regulatory'],
    ['fund tax lawyer', '/fund-lawyers/fund-tax'],
    ['private equity fund auditor', '/fund-auditors/private-equity-funds'],
    ['hedge fund audit firms', '/fund-auditors/hedge-funds/firms'],
    ['hedge fund CPA', '/fund-tax-advisors/hedge-funds'],
    ['private equity tax advisor', '/fund-tax-advisors/private-equity-funds'],
    ['fund tax accountant', '/fund-tax-advisors'],
    ['venture capital cpa firms san francisco', '/fund-tax-advisors/venture-funds/san-francisco/firms'],
  ])('%s → %s', (q, path) => {
    expect(page(q)).toBe(path)
  })

  it('a hub search with no trade word stays in that trade', () => {
    expect(page('hedge funds', 'fund_auditor')).toBe('/fund-auditors/hedge-funds')
  })

  it('falls back to the broadest page that exists', () => {
    const only = new Set(['/fund-lawyers/hedge-funds', '/fund-lawyers/boston'])
    const at = (q: string) => intentPage(parseIntent(q), (p) => only.has(p))
    expect(at('hedge fund law firms in boston')).toBe('/fund-lawyers/hedge-funds')
    expect(at('fund lawyers boston')).toBe('/fund-lawyers/boston')
    expect(at('secondaries lawyer denver')).toBe('/fund-lawyers')
  })

  it('a practice the trade does not have is not offered (auditors have no fund formation page)', () => {
    expect(parseIntent('fund formation auditor').practice).toBeNull()
  })
})

describe('headings people search for', () => {
  it('names each strategy the way it is searched, with one firm phrase', () => {
    expect(intentFor(L, 'venture_funds')).toMatchObject({ head: 'Venture Fund Lawyers', firms: 'Venture Capital Fund Law Firms', titleAlt: 'Venture Fund Lawyers & Attorneys' })
    expect(intentFor(L, 'hedge_funds')).toMatchObject({ head: 'Hedge Fund Lawyers', firms: 'Hedge Fund Law Firms', people: 'hedge fund attorneys' })
    expect(intentFor(L, 'buyout_funds').head).toBe('Private Equity Fund Lawyers')
    expect(intentFor(A, 'hedge_funds')).toMatchObject({ head: 'Hedge Fund Auditors', firms: 'Hedge Fund Audit Firms' })
    expect(intentFor(T, 'hedge_funds')).toMatchObject({ head: 'Hedge Fund Tax Advisors', titleAlt: 'Hedge Fund Tax Advisors & CPAs' })
  })

  it('the landing heading follows the intent, and plain names stay where nobody searches otherwise', () => {
    expect(landingTitle(L, resolveLanding(['funds-regulatory'])!)).toBe('Investment Adviser and Fund Regulatory Lawyers')
    expect(landingTitle(L, resolveLanding(['emerging-managers'])!)).toBe('Lawyers for Emerging Fund Managers')
    expect(landingTitle(L, resolveLanding(['hedge-funds', 'new-york'])!)).toBe('Hedge Fund Lawyers in New York')
    expect(landingTitle(L, resolveLanding(['lp-counsel'])!)).toBe('Fund Lawyers for LPs and Investors')
    expect(landingTitle(CATEGORIES.placement_agent, resolveLanding(['venture-funds'], CATEGORIES.placement_agent)!)).toBe('Placement Agents for Venture Funds')
  })
})

describe('the search box understands everyday words', () => {
  const vc = toRow(card({ full_name: 'Ann Venter', practice_areas: ['venture_funds'] }))
  const pe = toRow(card({ full_name: 'Peter Smith', practice_areas: ['buyout_funds'] }))
  const peter = toRow(card({ full_name: 'Peter Jones', practice_areas: ['hedge_funds'] }))
  const rows = [vc, pe, peter]
  const q = (s: string) => runQuery(rows, { q: s }).map((r) => r.n)

  it('"VC" and "venture capital" find venture fund people', () => {
    expect(q('VC')).toEqual(['Ann Venter'])
    expect(q('venture capital lawyer')).toEqual(['Ann Venter'])
  })
  it('"PE" finds private equity, not every Peter', () => {
    expect(q('pe')).toEqual(['Peter Smith'])
    expect(q('private equity attorney')).toEqual(['Peter Smith'])
  })
  it('trade words and filler never empty the list', () => {
    expect(q('attorney')).toHaveLength(3)
    expect(q('a lawyer to help set up a hedge fund')).toEqual(['Peter Jones'])
  })
  it('names still come first', () => {
    expect(scoreQuery('peter', haystack(peter, peter.c))).toBeGreaterThan(0)
    expect(q('peter')).toEqual(['Peter Jones', 'Peter Smith'])
  })
})

describe('firm lists (2026-10-24)', () => {
  it('ranks firms by partners listed; ties share a rank', () => {
    const people = [...crowd(1, 5, {}, 'a'), ...crowd(2, 3, {}, 'b'), ...crowd(1, 1, {}, 'c')]
    const ranked = rankFirms(people, firmsOf(people, L))
    expect(ranked.map((f) => [f.name, f.count, f.rank])).toEqual([
      ['Firm a0', 5, 1],
      ['Firm b0', 3, 2],
      ['Firm b1', 3, 2],
      ['Firm c0', 1, 4],
    ])
    expect(ranked[0].page).toBe(true)
    expect(ranked[3].page).toBe(false)
    expect(ranked[0].cities[0]).toMatchObject({ key: 'new-york', count: 5 })
  })

  it(`a practice list needs ${FIRMLIST_MIN_FIRMS} firms; a place's needs ${FIRMLIST_PLACE_MIN_FIRMS} firms and ${FIRMLIST_PLACE_MIN_PEOPLE} partners`, () => {
    const hedge = { practice_areas: ['hedge_funds'] }
    const chi = { offices: [{ city: 'Chicago', state: 'IL' }] }
    const people = [
      ...crowd(FIRMLIST_MIN_FIRMS, 2, { ...hedge, ...chi }, 'h'),
      ...crowd(FIRMLIST_MIN_FIRMS - 1, 3, { practice_areas: ['real_estate_funds'], ...chi }, 'r'),
      ...crowd(30, 1, { practice_areas: ['venture_funds'] }, 'v'),
    ]
    const fl = firmListSet(L, people)
    const paths = fl.lists.map((x) => x.path)
    expect(paths).toContain('/fund-lawyers/firms')
    expect(paths).toContain('/fund-lawyers/hedge-funds/firms')
    expect(paths).not.toContain('/fund-lawyers/real-estate-funds/firms') // four firms: a sentence, not a ranking
    expect(paths).toContain('/fund-lawyers/venture-funds/new-york/firms') // 30 firms, 30 partners
    expect(paths).not.toContain('/fund-lawyers/hedge-funds/chicago/firms') // 5 firms, 10 partners in one city
    expect(paths).not.toContain('/fund-lawyers/emerging-managers/firms') // client focus: never a firm list
  })

  it('a list is indexed only when its people page is, and a merged address redirects', () => {
    const people = crowd(10, 3, { practice_areas: ['hedge_funds', 'fund_formation'] })
    const set = landingSet(L, people)
    const fl = firmListSet(L, people, set)
    for (const x of fl.lists) {
      const l = set.pages.find((p) => p.path === x.peoplePath)
      if (l) expect(x.indexable).toBe(l.indexable)
    }
    // New York State is New York City's list again: its firm list goes where its page went.
    expect(fl.redirects).toContainEqual({ path: '/fund-lawyers/new-york-state/firms', into: '/fund-lawyers/new-york/firms' })
  })

  it('resolves only real lists', () => {
    expect(resolveFirmList([])).toEqual({ topic: null, place: null })
    expect(resolveFirmList(['hedge-funds', 'new-york'])?.place?.slug).toBe('new-york')
    expect(resolveFirmList(['gp-counsel'])).toBeNull()
    expect(resolveFirmList(['people'])).toBeNull()
  })

  it('titles and sentences carry the firm search words and true counts', () => {
    const k = resolveLanding(['hedge-funds', 'new-york'])!
    expect(firmListTitle(L, k)).toBe('Hedge Fund Law Firms in New York')
    expect(firmListTitle(A, resolveLanding(['private-equity-funds'], A)!)).toBe('Private Equity Fund Audit Firms')
    expect(firmListSearchTitle(L, 'Hedge Fund Law Firms', 37, 362)).toBe('Hedge Fund Law Firms: 37 Firms, 362 Partners')
    const people = [...crowd(1, 4, { practice_areas: ['hedge_funds'] }, 'a'), ...crowd(2, 2, { practice_areas: ['hedge_funds'] }, 'b')]
    const ranked = rankFirms(people, firmsOf(people, L))
    expect(firmListSentence(L, resolveLanding(['hedge-funds'])!, ranked)).toBe(
      '3 firms have fund lawyers listed for hedge fund work: 8 partners in all. Firm a0 has the most (4), then Firm b0 (2) and Firm b1 (2).',
    )
  })
})

describe('questions answered from the list', () => {
  const people = [
    ...crowd(1, 4, { practice_areas: ['buyout_funds', 'fund_formation'] }, 'k'),
    ...crowd(1, 2, { practice_areas: ['buyout_funds', 'secondaries'], offices: [{ city: 'Chicago', state: 'IL' }] }, 's'),
    ...crowd(1, 1, { practice_areas: ['buyout_funds', 'fund_formation'], offices: [{ city: 'Boston', state: 'MA' }] }, 'w'),
  ]
  const key = resolveLanding(['private-equity-funds'])!
  const list = peopleFor(people, key)
  const ranked = rankFirms(list, firmsOf(people, L))
  const faq = landingFaq({ category: L, key, people: list, ranked, verified: 'Oct 23, 2026', firmList: { path: '/fund-lawyers/private-equity-funds/firms', firms: 3 }, elsewhere: [] })
  const a = (q: RegExp) => faq.find((f) => q.test(f.q))

  it('counts', () => {
    expect(a(/^How many private equity fund attorneys/)?.a).toBe(
      "7 partners at 3 firms. Last checked Oct 23, 2026. Each one is at partner level, and their firm's own bio page names private equity fund work.",
    )
  })
  it('the firms with the most, linked to the full ranking', () => {
    const f = a(/^Which private equity fund law firms have the most partners/)
    expect(f?.a).toMatch(/^Firm k0 \(4\), Firm s0 \(2\) and Firm w0 \(1\)/)
    expect(f?.link?.href).toBe('/fund-lawyers/private-equity-funds/firms')
  })
  it('where they are, and what else they do', () => {
    expect(a(/^Where are/)?.a).toBe('The cities with the most: New York (4), Chicago (2) and Boston (1).')
    expect(a(/^What else/)?.a).toBe('The practices they list most alongside private equity fund work: fund formation (5) and secondaries (2).')
  })
  it('answers "a lawyer to set up a private equity fund" with a count', () => {
    expect(a(/help set up new private equity funds/)?.a).toBe('5 of the 7 also list fund formation work, the setting up of a fund and its terms with investors.')
  })
  it('leaves out a question the list cannot answer', () => {
    const one = crowd(1, 9, { practice_areas: ['hedge_funds'] })
    const k = resolveLanding(['hedge-funds', 'new-york'])!
    const f = landingFaq({ category: L, key: k, people: one, ranked: rankFirms(one, firmsOf(one, L)), verified: null, firmList: null, elsewhere: [{ name: 'Chicago', count: 3 }] })
    expect(f.some((x) => /firms have the most/.test(x.q))).toBe(false)
    expect(f.some((x) => /other cities/.test(x.q))).toBe(false)
    expect(f.some((x) => /Last checked/.test(x.a))).toBe(false)
  })
  it('a firm list says how it is ordered and how many firms it has', () => {
    const f = firmListFaq({ category: L, key, ranked, verified: null })
    expect(f.find((x) => x.q === 'How is this list ordered?')?.a).toMatch(/^By the number of partners each firm's own website lists for private equity fund work, most first\./)
    expect(f.find((x) => /^How many/.test(x.q))?.a).toBe('3 firms, with 7 partners between them.')
  })
})

describe('structured data parses', () => {
  it('the firm ranking and the people list are valid JSON-LD', () => {
    const people = crowd(3, 2, { practice_areas: ['hedge_funds'], full_name: 'O</script><b>x' })
    const ranked = rankFirms(people, firmsOf(people, L))
    const firms = JSON.parse(jsonLdScript(firmItemListJsonLd('Hedge Fund Law Firms', '/fund-lawyers/hedge-funds/firms', ranked, L)))
    expect(firms['@type']).toBe('ItemList')
    expect(firms.itemListElement.map((x: { position: number }) => x.position)).toEqual([1, 2, 3])
    expect(firms.itemListElement[0].url).toMatch(/^https:\/\/fundopshq\.com\/fund-lawyers\/firms\//)
    const script = jsonLdScript(itemListJsonLd('Hedge Fund Lawyers', '/fund-lawyers/hedge-funds', people.slice(0, 2)))
    expect(script).not.toContain('</script>')
    expect(JSON.parse(script).itemListElement).toHaveLength(2)
  })
})
