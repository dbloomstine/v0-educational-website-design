import { describe, expect, it } from 'vitest'
import {
  LANDING_MIN,
  LANDING_MIN_FIRMS,
  OVERLAP_MAX,
  STATE_CITY_MAX,
  absorbedTopic,
  allLandings,
  foldedTitle,
  indexableLandings,
  jaccard,
  landingSet,
  searchTitle,
  landingCrumbs,
  landingPath,
  landingSentence,
  landingTitle,
  nearby,
  paginate,
  parsePage,
  peopleFor,
  resolveLanding,
  TOPICS,
} from '../landing'
import { CITIES, PLACES, cityOf, placeBySlug, stateSlug } from '../places'
import { CATEGORIES, RESERVED_SLUGS } from '../taxonomy'
import { card } from './fixtures'

const L = CATEGORIES.fund_lawyer

describe('slug routing', () => {
  it('resolves a topic, a city, a state and a topic in a place', () => {
    expect(resolveLanding(['venture-funds'])).toMatchObject({ topic: { kind: 'practice', id: 'venture_funds' }, place: null })
    expect(resolveLanding(['new-york'])).toMatchObject({ topic: null, place: { kind: 'city', name: 'New York' } })
    expect(resolveLanding(['texas'])).toMatchObject({ topic: null, place: { kind: 'state', state: 'TX' } })
    expect(resolveLanding(['venture-funds', 'san-francisco'])).toMatchObject({ topic: { slug: 'venture-funds' }, place: { slug: 'san-francisco' } })
    expect(resolveLanding(['emerging-managers', 'boston'])).toMatchObject({ topic: { kind: 'focus' } })
    expect(resolveLanding(['lp-counsel'])).toMatchObject({ topic: { kind: 'side', id: 'investors_lps' } })
  })

  it('resolves nothing else: unknown words, a place before a topic, two topics, three segments, profiles', () => {
    expect(resolveLanding(['jane-smith-kirkland'])).toBeNull()
    expect(resolveLanding(['new-york', 'venture-funds'])).toBeNull()
    expect(resolveLanding(['venture-funds', 'secondaries'])).toBeNull()
    expect(resolveLanding(['venture-funds', 'new-york', 'x'])).toBeNull()
    expect(resolveLanding(['people'])).toBeNull()
    expect(resolveLanding(['people', 'new-york'])).toBeNull()
  })

  it('never lets two lists share a slug', () => {
    const slugs = [...TOPICS.map((t) => t.slug), ...PLACES.map((p) => p.slug)]
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(RESERVED_SLUGS.has(s)).toBe(false)
  })

  it('keeps state addresses apart from city addresses', () => {
    expect(stateSlug('NY')).toBe('new-york-state')
    expect(stateSlug('WA')).toBe('washington-state')
    expect(stateSlug('DC')).toBeNull()
    expect(stateSlug('TX')).toBe('texas')
    expect(placeBySlug('washington-dc')).toMatchObject({ kind: 'city', state: 'DC' })
  })

  it('maps offices to known cities by name, alias and state', () => {
    expect(cityOf({ city: 'Century City', state: 'CA' })?.slug).toBe('los-angeles')
    expect(cityOf({ city: 'Washington', state: 'D.C.' })?.slug).toBe('washington-dc')
    expect(cityOf({ city: 'new york', state: 'New York' })?.slug).toBe('new-york')
    expect(cityOf({ city: 'Portland', state: 'ME' })).toBeNull()
    expect(CITIES.every((c) => /^[a-z0-9-]+$/.test(c.slug))).toBe(true)
  })

  it('builds addresses, titles and crumbs', () => {
    const k = resolveLanding(['venture-funds', 'san-francisco'])!
    expect(landingPath(L, k)).toBe('/fund-lawyers/venture-funds/san-francisco')
    expect(landingTitle(L, k)).toBe('Venture Fund Lawyers in San Francisco')
    expect(landingTitle(L, resolveLanding(['new-york'])!)).toBe('Fund Lawyers in New York')
    expect(landingTitle(L, resolveLanding(['emerging-managers'])!)).toBe('Fund Lawyers for Emerging Managers')
    expect(landingTitle(L, resolveLanding(['lp-counsel'])!)).toBe('Fund Lawyers for LPs and Investors')
    expect(landingCrumbs(L, k).map((c) => c.name)).toEqual(['Fund Lawyers', 'Venture Fund Lawyers', 'San Francisco'])
  })
})

describe('which pages exist', () => {
  // Three firms, so every list here clears the two-firm rule.
  const sf = (i: number, over = {}) => card({ firm_domain: `firm${i % 3}.com`, firm_name: `Firm ${i % 3}`, offices: [{ city: 'San Francisco', state: 'CA' }], practice_areas: ['venture_funds'], ...over })

  it(`needs ${LANDING_MIN} public people at ${LANDING_MIN_FIRMS} firms`, () => {
    const short = Array.from({ length: LANDING_MIN - 1 }, (_, i) => sf(i))
    expect(allLandings(L, short)).toEqual([])
    const enough = [...short, sf(9)]
    const paths = allLandings(L, enough).map((l) => l.path)
    expect(paths).toEqual(expect.arrayContaining(['/fund-lawyers/venture-funds', '/fund-lawyers/san-francisco', '/fund-lawyers/venture-funds/san-francisco']))
    expect(paths).not.toContain('/fund-lawyers/new-york')
    const oneFirm = Array.from({ length: LANDING_MIN + 2 }, () => card({ offices: [{ city: 'Austin', state: 'TX' }] }))
    expect(allLandings(L, oneFirm)).toEqual([])
  })

  it('does not count people who are not public', () => {
    const people = [...Array.from({ length: LANDING_MIN - 1 }, (_, i) => sf(i)), sf(5, { status: 'review' }), sf(6, { status: 'hidden' }), sf(7, { missing_since: '2020-01-01' })]
    expect(allLandings(L, people)).toEqual([])
  })

  it('matches allLandings to what each page lists', () => {
    const people = [
      ...Array.from({ length: 9 }, (_, i) => sf(i, { client_focus: ['emerging_managers'] })),
      ...Array.from({ length: 8 }, (_, i) => card({ offices: [{ city: i % 2 ? 'Austin' : 'Houston', state: 'TX' }], represents: ['investors_lps'], firm_domain: `t${i}.com` })),
      ...Array.from({ length: 8 }, (_, i) => card({ offices: [{ city: 'Austin', state: 'TX' }], firm_domain: `a${i}.com` })),
    ]
    for (const l of allLandings(L, people)) expect(peopleFor(people, l).length).toBe(l.count)
    const paths = allLandings(L, people).map((l) => l.path)
    expect(paths).toEqual(expect.arrayContaining(['/fund-lawyers/emerging-managers/san-francisco', '/fund-lawyers/lp-counsel/texas', '/fund-lawyers/austin', '/fund-lawyers/texas']))
  })

  it('links a combination up to its parents and across', () => {
    const people = [
      ...Array.from({ length: 12 }, (_, i) => sf(i)),
      ...Array.from({ length: 9 }, (_, i) => sf(i, { offices: [{ city: 'Palo Alto', state: 'CA' }] })),
      ...Array.from({ length: 10 }, (_, i) => sf(i, { offices: [{ city: 'Boston', state: 'MA' }], practice_areas: ['hedge_funds'] })),
    ]
    const all = allLandings(L, people)
    const k = resolveLanding(['venture-funds', 'san-francisco'])!
    const near = nearby(k, all)
    expect(near.parents.map((x) => x.path)).toEqual(expect.arrayContaining(['/fund-lawyers/venture-funds', '/fund-lawyers/san-francisco', '/fund-lawyers/venture-funds/california']))
    expect(near.sameTopic.map((x) => x.path)).toContain('/fund-lawyers/venture-funds/palo-alto')
    expect(near.sameTopic.map((x) => x.path)).not.toContain('/fund-lawyers/venture-funds/san-francisco')
  })

  it('opens with a sentence from its own list', () => {
    const people = Array.from({ length: 6 }, (_, i) => sf(i, { practice_areas: ['venture_funds', 'fund_formation'] }))
    const s = landingSentence(L, resolveLanding(['venture-funds', 'san-francisco'])!, people)
    expect(s).toMatch(/^6 fund lawyers at 3 firms list venture fund work in San Francisco\./)
    expect(s).toContain('fund formation (6)')
    expect(s).not.toContain('venture funds (')
  })

  it('has a private equity funds page for lawyers once the data carries buyout_funds', () => {
    const people = Array.from({ length: LANDING_MIN }, (_, i) => sf(i, { practice_areas: ['buyout_funds'], offices: [{ city: 'New York', state: 'NY' }] }))
    expect(resolveLanding(['private-equity-funds'], L)).toMatchObject({ topic: { kind: 'practice', id: 'buyout_funds' } })
    const l = allLandings(L, [...people, ...Array.from({ length: 20 }, (_, i) => sf(i))]).find((x) => x.path === '/fund-lawyers/private-equity-funds')
    expect(l).toMatchObject({ title: 'Private Equity Fund Lawyers', count: LANDING_MIN, indexable: true })
  })
})

describe('no doorway pages (2026-10-24)', () => {
  const at = (i: number, city: string, state: string, over = {}) =>
    card({ firm_domain: `firm${i % 4}.com`, firm_name: `Firm ${i % 4}`, offices: [{ city, state }], practice_areas: ['hedge_funds'], ...over })
  const crowd = (n: number, city: string, state: string, over = {}) => Array.from({ length: n }, (_, i) => at(i, city, state, over))

  it('drops a state page that is its main city again, and says where it went', () => {
    // New York State is all New York City; California is San Francisco and Los Angeles.
    const people = [...crowd(20, 'New York', 'NY'), ...crowd(10, 'San Francisco', 'CA'), ...crowd(10, 'Los Angeles', 'CA'), ...crowd(30, 'Boston', 'MA', { practice_areas: ['venture_funds'] })]
    const set = landingSet(L, people)
    const paths = set.pages.map((l) => l.path)
    expect(paths).toContain('/fund-lawyers/new-york')
    expect(paths).not.toContain('/fund-lawyers/new-york-state')
    expect(paths).toContain('/fund-lawyers/california')
    expect(set.merged).toEqual(expect.arrayContaining([expect.objectContaining({ path: '/fund-lawyers/new-york-state', into: '/fund-lawyers/new-york' })]))
    // The same rule under a topic.
    expect(set.merged.map((m) => m.path)).toContain('/fund-lawyers/hedge-funds/new-york-state')
    expect(set.merged.find((m) => m.path === '/fund-lawyers/hedge-funds/new-york-state')?.into).toBe('/fund-lawyers/hedge-funds/new-york')
  })

  it(`keeps a state that adds more than ${Math.round((1 - STATE_CITY_MAX) * 100)}% beyond its main city`, () => {
    const people = [...crowd(18, 'New York', 'NY'), ...crowd(3, 'Albany', 'NY'), ...crowd(40, 'Boston', 'MA')]
    expect(landingSet(L, people).pages.map((l) => l.path)).toContain('/fund-lawyers/new-york-state')
  })

  it(`noindexes a page whose list is more than ${OVERLAP_MAX * 100}% the same as a broader page or a sibling`, () => {
    const people = [
      // Boston: 20 people, 18 of them in hedge funds. Hedge funds in Boston is Boston again.
      ...crowd(18, 'Boston', 'MA'),
      ...crowd(2, 'Boston', 'MA', { practice_areas: ['venture_funds'] }),
      // Chicago: 20 people, half in hedge funds: a page of its own.
      ...crowd(10, 'Chicago', 'IL'),
      ...crowd(10, 'Chicago', 'IL', { practice_areas: ['venture_funds'] }),
      // Elsewhere: so neither topic is the whole directory.
      ...crowd(40, 'Denver', 'CO', { practice_areas: ['real_estate_funds'] }),
    ]
    const pages = allLandings(L, people)
    const page = (path: string) => pages.find((l) => l.path === path)
    expect(page('/fund-lawyers/hedge-funds/boston')).toMatchObject({ indexable: false, duplicateOf: '/fund-lawyers/boston' })
    expect(page('/fund-lawyers/hedge-funds/chicago')).toMatchObject({ indexable: true, duplicateOf: null })
    expect(page('/fund-lawyers/boston')?.indexable).toBe(true)
    // Denver's 40 are all the real estate lawyers there are: the combination repeats both of its broader pages.
    expect(page('/fund-lawyers/real-estate-funds/denver')?.indexable).toBe(false)
    expect(['/fund-lawyers/denver', '/fund-lawyers/real-estate-funds']).toContain(page('/fund-lawyers/real-estate-funds/denver')?.duplicateOf)
    expect(indexableLandings(L, people).every((l) => l.indexable)).toBe(true)
  })

  it('noindexes a topic that is the whole hub again', () => {
    const people = [...crowd(20, 'Boston', 'MA'), ...crowd(2, 'Boston', 'MA', { practice_areas: ['venture_funds'] })]
    const l = allLandings(L, people).find((x) => x.path === '/fund-lawyers/hedge-funds')
    expect(l).toMatchObject({ indexable: false, duplicateOf: '/fund-lawyers' })
    expect(absorbedTopic('/fund-lawyers', allLandings(L, people))).toEqual({ noun: 'Hedge Funds', count: 20 })
  })

  it('noindexes the smaller of two near-identical siblings, and only once', () => {
    // Everyone in Palo Alto is also in Menlo Park: two addresses, one list.
    const both = (i: number) => card({ firm_domain: `f${i % 3}.com`, firm_name: `F${i % 3}`, offices: [{ city: 'Palo Alto', state: 'CA' }, { city: 'Menlo Park', state: 'CA' }], practice_areas: ['venture_funds'] })
    const people = [...Array.from({ length: 10 }, (_, i) => both(i)), card({ firm_domain: 'f1.com', offices: [{ city: 'Menlo Park', state: 'CA' }] }), ...crowd(40, 'Boston', 'MA')]
    const pages = allLandings(L, people)
    expect(pages.find((l) => l.path === '/fund-lawyers/palo-alto')).toMatchObject({ indexable: false, duplicateOf: '/fund-lawyers/menlo-park' })
    expect(pages.find((l) => l.path === '/fund-lawyers/menlo-park')?.indexable).toBe(true)
  })

  it('measures overlap as people in common over people in either', () => {
    expect(jaccard([1, 2, 3, 4], [1, 2, 3, 4])).toBe(1)
    expect(jaccard([1, 2, 3, 4], [1, 2])).toBe(0.5)
    expect(jaccard([1, 2], [3, 4])).toBe(0)
    expect(jaccard([], [])).toBe(0)
  })

  it('dates each page by its newest read or edit', () => {
    const people = crowd(10, 'Boston', 'MA').map((p, i) => ({ ...p, fetched_at: `2026-10-${String(10 + i).padStart(2, '0')}T12:00:00Z`, updated_at: '2026-10-01T00:00:00Z' }))
    expect(allLandings(L, people).find((l) => l.path === '/fund-lawyers/boston')?.lastmod).toBe('2026-10-19T12:00:00Z')
  })
})

describe('fund formation folded into the lawyers’ hub and place pages (2026-10-24)', () => {
  const at = (i: number, city: string, state: string, practices: string[], over = {}) =>
    card({ firm_domain: `firm${i % 4}.com`, firm_name: `Firm ${i % 4}`, offices: [{ city, state }], practice_areas: practices, ...over })
  // 40 lawyers: 36 in fund formation (so formation is the hub again), Boston 30 of them, New York 10.
  const people = [
    ...Array.from({ length: 27 }, (_, i) => at(i, 'Boston', 'MA', ['fund_formation'])),
    ...Array.from({ length: 3 }, (_, i) => at(i, 'Boston', 'MA', ['hedge_funds'])),
    ...Array.from({ length: 9 }, (_, i) => at(i, 'New York', 'NY', ['fund_formation'])),
    at(1, 'New York', 'NY', ['hedge_funds']),
  ]

  it('builds no fund formation copy: its addresses redirect to the hub and the place page', () => {
    const set = landingSet(L, people)
    const paths = set.pages.map((l) => l.path)
    expect(paths).not.toContain('/fund-lawyers/fund-formation')
    expect(paths).not.toContain('/fund-lawyers/fund-formation/boston')
    const into = new Map(set.merged.map((m) => [m.path, m.into]))
    expect(into.get('/fund-lawyers/fund-formation')).toBe('/fund-lawyers')
    expect(into.get('/fund-lawyers/fund-formation/boston')).toBe('/fund-lawyers/boston')
    // The state copy went to the formation city page, which went to the city: one hop, not two.
    expect(into.get('/fund-lawyers/fund-formation/massachusetts')).toBe('/fund-lawyers/boston')
    expect(indexableLandings(L, people).some((l) => l.path.includes('fund-formation'))).toBe(false)
  })

  it('gives the hub and the place pages the folded practice’s heading and counts', () => {
    const set = landingSet(L, people)
    expect(set.hubFolded).toEqual({ adj: 'Fund Formation', noun: 'Fund Formation', count: 36, firms: 4 })
    const boston = set.pages.find((l) => l.path === '/fund-lawyers/boston')!
    expect(boston).toMatchObject({ title: 'Fund Formation Lawyers in Boston', count: 30, indexable: true, folded: { count: 27, firms: 4 } })
    expect(searchTitle(boston.title, L, boston.folded!.count, boston.folded!.firms)).toBe('Fund Formation Lawyers in Boston: 27 Partners at 4 Firms')
    expect(foldedTitle(L, { topic: null, place: null }, set.hubFolded!)).toBe('Fund Formation Lawyers')
  })

  it('folds only where the overlap rule flagged the copy, and only for lawyers', () => {
    // Formation is a minority here: its page stands on its own.
    const mixed = [...Array.from({ length: 10 }, (_, i) => at(i, 'Boston', 'MA', ['fund_formation'])), ...Array.from({ length: 30 }, (_, i) => at(i, 'Boston', 'MA', ['hedge_funds']))]
    const set = landingSet(L, mixed)
    expect(set.pages.find((l) => l.path === '/fund-lawyers/fund-formation')?.indexable).toBe(true)
    expect(set.hubFolded).toBeNull()
    const tax = people.map((p) => ({ ...p, category: 'fund_tax_advisor' as const }))
    const taxSet = landingSet(CATEGORIES.fund_tax_advisor, tax)
    expect(taxSet.hubFolded).toBeNull()
    expect(taxSet.pages.find((l) => l.path === '/fund-tax-advisors/fund-formation')).toMatchObject({ indexable: false })
  })
})

describe('search titles (2026-10-24)', () => {
  it('puts the words and the counts first, and fits 60 characters', () => {
    expect(searchTitle('Fund Formation Lawyers in New York', L, 412, 31)).toBe('Fund Formation Lawyers in New York: 412 Partners at 31 Firms')
    expect(searchTitle('Fund Lawyers in Boston', L, 120, 20, { noun: 'Fund Formation', count: 89 })).toBe('Fund Lawyers in Boston: 120 Partners, 89 in Fund Formation')
    expect(searchTitle('Fund Lawyers in New York', L, 564, 31, { noun: 'Fund Formation', count: 460 })).toBe('Fund Lawyers in New York: 564 Partners at 31 Firms')
    const long = searchTitle('Infrastructure Fund Lawyers in Washington, D.C.', L, 12, 5)
    expect(long.length).toBeLessThanOrEqual(60)
    expect(long).toBe('Infrastructure Fund Lawyers in Washington, D.C.: 12 Partners')
    expect(searchTitle(['Private Fund Lawyers', 'Fund Lawyers'], L, 1218, 37, { noun: 'Fund Formation', count: 1003 })).toBe('Fund Lawyers: 1,218 Partners, 1,003 in Fund Formation')
    expect(searchTitle('Placement Agents for Venture Funds', CATEGORIES.placement_agent, 9, 3)).toBe('Placement Agents for Venture Funds: 9 People at 3 Firms')
  })

  it('gives every page that exists its own title', () => {
    const people = [
      ...Array.from({ length: 30 }, (_, i) => card({ firm_domain: `f${i % 5}.com`, offices: [{ city: i % 2 ? 'Boston' : 'Chicago', state: i % 2 ? 'MA' : 'IL' }], practice_areas: i % 3 ? ['hedge_funds'] : ['venture_funds'] })),
      ...Array.from({ length: 30 }, (_, i) => card({ firm_domain: `g${i % 5}.com`, offices: [{ city: 'Denver', state: 'CO' }], practice_areas: ['real_estate_funds'] })),
    ]
    const pages = allLandings(L, people)
    const titles = pages.map((l) => searchTitle(l.title, L, l.count, l.firms, absorbedTopic(l.path, pages)))
    expect(new Set(titles).size).toBe(titles.length)
  })
})

describe('pages of a list', () => {
  it('paginates and refuses pages that are not there', () => {
    const xs = Array.from({ length: 120 }, (_, i) => i)
    expect(paginate(xs, 1)?.items.length).toBe(50)
    expect(paginate(xs, 3)).toMatchObject({ page: 3, pages: 3 })
    expect(paginate(xs, 3)?.items.length).toBe(20)
    expect(paginate(xs, 4)).toBeNull()
    expect(paginate([], 1)).toMatchObject({ pages: 1 })
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage('2')).toBe(2)
    for (const bad of ['0', '-1', '1.5', 'abc', '01']) expect(Number.isNaN(parsePage(bad))).toBe(true)
  })
})
