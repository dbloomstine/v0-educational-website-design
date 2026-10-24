import { describe, expect, it } from 'vitest'
import {
  LANDING_MIN,
  allLandings,
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
  const sf = (i: number, over = {}) => card({ firm_domain: `firm${i % 3}.com`, firm_name: `Firm ${i % 3}`, offices: [{ city: 'San Francisco', state: 'CA' }], practice_areas: ['venture_funds'], ...over })

  it(`needs ${LANDING_MIN} public people`, () => {
    const four = Array.from({ length: LANDING_MIN - 1 }, (_, i) => sf(i))
    expect(allLandings(L, four)).toEqual([])
    const five = [...four, sf(9)]
    const paths = allLandings(L, five).map((l) => l.path)
    expect(paths).toEqual(expect.arrayContaining(['/fund-lawyers/venture-funds', '/fund-lawyers/san-francisco', '/fund-lawyers/california', '/fund-lawyers/venture-funds/san-francisco', '/fund-lawyers/venture-funds/california']))
    expect(paths).not.toContain('/fund-lawyers/new-york')
  })

  it('does not count people who are not public', () => {
    const people = [...Array.from({ length: 4 }, (_, i) => sf(i)), sf(5, { status: 'review' }), sf(6, { status: 'hidden' }), sf(7, { missing_since: '2020-01-01' })]
    expect(allLandings(L, people)).toEqual([])
  })

  it('matches allLandings to what each page lists', () => {
    const people = [
      ...Array.from({ length: 6 }, (_, i) => sf(i, { client_focus: ['emerging_managers'] })),
      ...Array.from({ length: 5 }, (_, i) => card({ offices: [{ city: 'Austin', state: 'TX' }], represents: ['investors_lps'], firm_domain: `t${i}.com` })),
    ]
    for (const l of allLandings(L, people)) expect(peopleFor(people, l).length).toBe(l.count)
    const paths = allLandings(L, people).map((l) => l.path)
    expect(paths).toEqual(expect.arrayContaining(['/fund-lawyers/emerging-managers/san-francisco', '/fund-lawyers/lp-counsel/texas', '/fund-lawyers/austin']))
  })

  it('links a combination up to its parents and across', () => {
    const people = [
      ...Array.from({ length: 6 }, (_, i) => sf(i)),
      ...Array.from({ length: 5 }, (_, i) => sf(i, { offices: [{ city: 'Palo Alto', state: 'CA' }] })),
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
