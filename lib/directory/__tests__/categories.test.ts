import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANDING_MIN, allLandings, landingPath, landingSentence, landingTitle, peopleFor, resolveLanding, topicsFor } from '../landing'
import { assignSlug, parseRecord } from '../loader'
import { profilePath } from '../people'
import { placeBySlug } from '../places'
import { firmDirectoryLinks, summarize } from '../summary'
import { CATEGORIES, CATEGORY_IDS, LIVE_CATEGORIES, categoryBySlug, practicesFor, type CategoryId } from '../taxonomy'
import { card } from './fixtures'

const A = CATEGORIES.fund_auditor
const T = CATEGORIES.fund_tax_advisor
const P = CATEGORIES.placement_agent
const B = CATEGORIES.fund_finance_banker
const L = CATEGORIES.fund_lawyer

const many = (n: number, over: Parameters<typeof card>[0]) => Array.from({ length: n }, () => card(over))

describe('the five trades', () => {
  it('are all live, each at its own address', () => {
    expect(LIVE_CATEGORIES.map((c) => c.slug)).toEqual(['fund-lawyers', 'fund-auditors', 'fund-tax-advisors', 'placement-agents', 'fund-finance-bankers'])
    for (const id of CATEGORY_IDS) expect(categoryBySlug(CATEGORIES[id].slug)?.id).toBe(id)
    expect(categoryBySlug('people')).toBeNull()
  })

  it('match the edge-cache list in next.config.mjs', () => {
    const conf = readFileSync(join(process.cwd(), 'next.config.mjs'), 'utf8')
    const m = /const DIRECTORY_SLUGS = \[([^\]]*)\]/.exec(conf)
    expect(m).not.toBeNull()
    const slugs = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(slugs.sort()).toEqual(CATEGORY_IDS.map((id) => CATEGORIES[id].slug).sort())
  })

  it('put profiles under their own trade', () => {
    expect(profilePath({ slug: 'jane-smith-ey', category: 'fund_tax_advisor' })).toBe('/fund-tax-advisors/people/jane-smith-ey')
    expect(profilePath({ slug: 'jo-lee-evercore', category: 'placement_agent' })).toBe('/placement-agents/people/jo-lee-evercore')
  })
})

describe('routing per trade', () => {
  it('gives GP and LP counsel pages to lawyers only', () => {
    expect(resolveLanding(['lp-counsel'], L)).toMatchObject({ topic: { kind: 'side' } })
    for (const c of [A, T, P, B]) {
      expect(resolveLanding(['lp-counsel'], c)).toBeNull()
      expect(resolveLanding(['gp-counsel', 'new-york'], c)).toBeNull()
      expect(topicsFor(c).some((t) => t.kind === 'side')).toBe(false)
    }
  })

  it('gives bankers subscription lines, NAV lending and GP financing, and nobody else', () => {
    for (const s of ['subscription-lines', 'nav-lending', 'gp-financing']) {
      expect(resolveLanding([s], B)).toMatchObject({ topic: { kind: 'practice' } })
      expect(resolveLanding([s, 'new-york'], B)).toMatchObject({ place: { slug: 'new-york' } })
      expect(resolveLanding([s], L)).toBeNull()
      expect(resolveLanding([s], A)).toBeNull()
    }
    expect(practicesFor(B).map((p) => p.id).slice(0, 3)).toEqual(['subscription_lines', 'nav_lending', 'gp_financing'])
  })

  it('gives every trade stage, strategy, city, state and strategy-in-city pages', () => {
    for (const c of [L, A, T, P, B]) {
      expect(resolveLanding(['first-time-funds'], c)).toMatchObject({ topic: { kind: 'focus' } })
      expect(resolveLanding(['emerging-managers'], c)).toMatchObject({ topic: { kind: 'focus' } })
      expect(resolveLanding(['venture-funds'], c)).toMatchObject({ topic: { kind: 'practice' } })
      expect(resolveLanding(['new-york'], c)).toMatchObject({ place: { kind: 'city' } })
      expect(resolveLanding(['texas'], c)).toMatchObject({ place: { kind: 'state' } })
      expect(resolveLanding(['venture-funds', 'boston'], c)).not.toBeNull()
      expect(resolveLanding(['people'], c)).toBeNull()
      expect(resolveLanding(['jane-smith'], c)).toBeNull()
    }
  })

  it('keeps practices that make no sense for a trade off its pages', () => {
    expect(resolveLanding(['fund-formation'], A)).toBeNull()
    expect(resolveLanding(['fund-finance'], B)).toBeNull()
    expect(resolveLanding(['fund-tax'], T)).toBeNull()
  })

  it('names pages the way people search', () => {
    const ny = placeBySlug('new-york')!
    expect(landingTitle(A, { topic: null, place: ny })).toBe('Fund Auditors in New York')
    expect(landingTitle(P, resolveLanding(['venture-funds'], P)!)).toBe('Placement Agents for Venture Funds')
    expect(landingTitle(P, resolveLanding(['first-time-funds'], P)!)).toBe('Placement Agents for First-Time Funds')
    expect(landingTitle(B, resolveLanding(['nav-lending', 'new-york'], B)!)).toBe('Fund Finance Bankers for NAV Lending in New York')
    expect(landingTitle(B, resolveLanding(['subscription-lines'], B)!)).toBe('Fund Finance Bankers for Subscription Lines')
    expect(landingTitle(T, resolveLanding(['venture-funds', 'boston'], T)!)).toBe('Venture Fund Tax Advisors in Boston')
    expect(landingTitle(A, resolveLanding(['hedge-funds'], A)!)).toBe('Hedge Fund Auditors')
    expect(landingPath(P, resolveLanding(['venture-funds', 'san-francisco'], P)!)).toBe('/placement-agents/venture-funds/san-francisco')
  })

  it('writes the opening sentence in the trade’s own words', () => {
    const people = many(6, { category: 'fund_finance_banker', practice_areas: ['nav_lending', 'subscription_lines'], firm_name: 'Wells Fargo', firm_domain: 'wellsfargo.com' })
    const k = resolveLanding(['nav-lending'], B)!
    const s = landingSentence(B, k, peopleFor(people, k))
    expect(s).toMatch(/^6 fund finance bankers at 1 firm list NAV lending work\./)
    expect(s).toContain('subscription lines (6)')
  })
})

describe('the five-people rule, per trade', () => {
  it('builds a page at five people and not at four', () => {
    const four = many(4, { category: 'fund_auditor', offices: [{ city: 'Chicago', state: 'IL' }], practice_areas: ['hedge_funds'] })
    expect(allLandings(A, four).map((l) => l.path)).toEqual([])
    const five = [...four, card({ category: 'fund_auditor', offices: [{ city: 'Chicago', state: 'IL' }], practice_areas: ['hedge_funds'] })]
    const paths = allLandings(A, five).map((l) => l.path)
    expect(paths).toEqual(expect.arrayContaining(['/fund-auditors/chicago', '/fund-auditors/illinois', '/fund-auditors/hedge-funds', '/fund-auditors/hedge-funds/chicago']))
    expect(allLandings(A, five).every((l) => l.count >= LANDING_MIN)).toBe(true)
  })

  it('never builds a page the trade has no topic for, whatever the data says', () => {
    const people = many(8, { category: 'fund_auditor', represents: ['investors_lps'], practice_areas: ['fund_formation'] })
    const paths = allLandings(A, people).map((l) => l.path)
    expect(paths.some((p) => p.includes('lp-counsel') || p.includes('fund-formation'))).toBe(false)
    expect(paths).toContain('/fund-auditors/new-york')
  })

  it('counts only public people', () => {
    const people = [...many(4, { category: 'placement_agent' }), card({ category: 'placement_agent', status: 'hidden' }), card({ category: 'placement_agent', status: 'review' })]
    expect(allLandings(P, people)).toEqual([])
  })
})

describe('the directory summary', () => {
  const lists = new Map<CategoryId, ReturnType<typeof card>[]>([
    ['fund_lawyer', many(7, {})],
    ['fund_auditor', [...many(5, { category: 'fund_auditor', firm_name: 'Deloitte', firm_domain: 'deloitte.com', offices: [{ city: 'Boston', state: 'MA' }] }), card({ category: 'fund_auditor', firm_name: 'Kirkland & Ellis', firm_domain: 'kirkland.com' })]],
  ])
  const s = summarize(lists)

  it('counts every trade, with its biggest pages', () => {
    expect(s.categories.map((c) => c.id)).toEqual(CATEGORY_IDS)
    const law = s.categories.find((c) => c.id === 'fund_lawyer')!
    expect(law).toMatchObject({ count: 7, firms: 1 })
    expect(law.cities[0]).toMatchObject({ path: '/fund-lawyers/new-york', title: 'Fund Lawyers in New York', count: 7 })
    expect(law.topics[0]).toMatchObject({ path: '/fund-lawyers/fund-formation' })
    expect(s.categories.find((c) => c.id === 'fund_auditor')!.cities.map((c) => c.path)).toEqual(['/fund-auditors/boston'])
    expect(s.categories.find((c) => c.id === 'placement_agent')).toMatchObject({ count: 0, cities: [], topics: [] })
  })

  it('cross-links a firm page to its people in each trade', () => {
    const hrefOf = (name: string) => (name.startsWith('Kirkland') ? '/firm/kirkland-ellis' : name === 'Deloitte' ? '/firm/deloitte' : null)
    expect(firmDirectoryLinks(s, '/firm/kirkland-ellis', hrefOf)).toEqual([
      { category: 'fund_lawyer', href: '/fund-lawyers?firm=kirkland.com', label: 'Fund Lawyers', count: 7 },
      { category: 'fund_auditor', href: '/fund-auditors?firm=kirkland.com', label: 'Fund Auditors', count: 1 },
    ])
    expect(firmDirectoryLinks(s, '/firm/deloitte', hrefOf)).toHaveLength(1)
    expect(firmDirectoryLinks(s, '/firm/nobody', hrefOf)).toEqual([])
  })
})

describe('loading several trades', () => {
  const line = { full_name: 'Jane Smith', firm_name: 'EY', firm_domain: 'ey.com', offices: [{ city: 'New York', state: 'NY' }], slug: 'jane-smith-ey' }

  it('takes a line’s own category, else the file’s, and refuses an unknown one', () => {
    const own = parseRecord({ ...line, category: 'fund_tax_advisor' }, 'fund_auditor')
    expect(own.ok && own.value.category).toBe('fund_tax_advisor')
    const fallback = parseRecord(line, 'fund_auditor')
    expect(fallback.ok && fallback.value.category).toBe('fund_auditor')
    expect(parseRecord(line).ok && (parseRecord(line) as { value: { category: string } }).value.category).toBe('fund_lawyer')
    expect(parseRecord({ ...line, category: 'fund_admin' }).ok).toBe(false)
  })

  it('warns on a practice outside the trade but keeps it as a tag', () => {
    const p = parseRecord({ ...line, practice_areas: ['nav_lending', 'hedge_funds'] }, 'fund_auditor')
    expect(p.ok).toBe(true)
    if (!p.ok) return
    expect(p.value.practice_areas).toEqual(['nav_lending', 'hedge_funds'])
    expect(p.warnings.some((w) => w.includes('nav_lending'))).toBe(true)
  })

  const owner = (category: CategoryId, full_name = 'Jane Smith', firm_domain = 'ey.com') => ({ category, full_name, firm_domain })
  const rec = (category: CategoryId) => ({ slug: 'jane-smith-ey', category, full_name: 'Jane Smith', firm_domain: 'ey.com' })

  it('keeps a slug that is free, or already this trade’s', () => {
    expect(assignSlug(rec('fund_tax_advisor'), new Map(), new Map())).toEqual({ slug: 'jane-smith-ey' })
    expect(assignSlug(rec('fund_tax_advisor'), new Map([['jane-smith-ey', owner('fund_tax_advisor')]]), new Map())).toEqual({ slug: 'jane-smith-ey' })
  })

  it('suffixes a slug another trade holds, and finds the same row on the next run', () => {
    const existing = new Map([['jane-smith-ey', owner('fund_auditor')]])
    expect(assignSlug(rec('fund_tax_advisor'), existing, new Map())).toEqual({ slug: 'jane-smith-ey-tax' })
    existing.set('jane-smith-ey-tax', owner('fund_tax_advisor'))
    expect(assignSlug(rec('fund_tax_advisor'), existing, new Map())).toEqual({ slug: 'jane-smith-ey-tax' })
  })

  it('never lands on a stranger’s suffixed row', () => {
    const existing = new Map([
      ['jane-smith-ey', owner('fund_auditor')],
      ['jane-smith-ey-tax', owner('fund_tax_advisor', 'Janet Smith')],
    ])
    expect(assignSlug(rec('fund_tax_advisor'), existing, new Map())).toEqual({ slug: 'jane-smith-ey-tax-2' })
  })

  it('suffixes within one file across trades, and flags a true duplicate', () => {
    const taken = new Map([['jane-smith-ey', owner('fund_auditor')]])
    expect(assignSlug(rec('fund_tax_advisor'), new Map(), taken)).toEqual({ slug: 'jane-smith-ey-tax' })
    expect(assignSlug(rec('fund_auditor'), new Map(), taken)).toEqual({ duplicate: true })
  })
})
