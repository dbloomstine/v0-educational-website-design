import { describe, expect, it } from 'vitest'
import { gzipSync } from 'node:zlib'
import { card } from './fixtures'
import { synthTrade } from './search-index.test'
import {
  FACET_KEYS,
  emptyQuery,
  exploreCounts,
  exploreHref,
  expBucket,
  fieldsPresent,
  isMissingColumn,
  liveFacets,
  normalizeFirm,
  normalizeSchool,
  parseExplore,
  rowKeys,
  runExplore,
  tableHrefFrom,
  titleRank,
  toExploreRow,
  toggleValue,
  yearsIn,
  type ExploreSource,
  type XQuery,
  type XRow,
} from '../explore'
import { decodeExplore, encodeExplore, EXPLORE_VERSION, nameSlug } from '../explore-index'
import { personDetail } from '../explore-detail'
import { CATEGORIES } from '../taxonomy'
import type { Person } from '../people'

const YEAR = 2026
const LAW = CATEGORIES.fund_lawyer

const src = (over: Partial<ExploreSource> = {}): ExploreSource => ({ ...card(), ...over })
const row = (over: Partial<ExploreSource> = {}) => toExploreRow(src(over), LAW)
const q = (over: Partial<XQuery> = {}): XQuery => ({ ...emptyQuery(), ...over })

/** A small trade with every new field filled in some rows and empty in others. */
function trade(): XRow[] {
  return [
    row({ slug: 'ann-able-kirkland', full_name: 'Ann Able', firm_name: 'Kirkland & Ellis', firm_domain: 'kirkland.com', title: 'Partner', offices: [{ city: 'New York', state: 'NY' }], practice_areas: ['venture_funds', 'fund_formation'], primary_practice: 'venture_funds', career_start_year: 2001, schools: ['Harvard Law School'], prior_firms: ['Cooley LLP'], languages: ['Spanish'], client_focus: ['emerging_managers'], fetched_at: '2026-10-20T12:00:00Z' }),
    row({ slug: 'bob-baker-cooley', full_name: 'Bob Baker', firm_name: 'Cooley', firm_domain: 'cooley.com', title: 'Managing Partner', offices: [{ city: 'Palo Alto', state: 'CA' }], practice_areas: ['venture_funds'], primary_practice: 'fund_formation', career_start_year: 2019, education: [{ school: 'Stanford University', degree: 'J.D.' }], fetched_at: '2026-10-22T12:00:00Z' }),
    row({ slug: 'cat-cole-kirkland', full_name: 'Cat Cole', firm_name: 'Kirkland & Ellis', firm_domain: 'kirkland.com', title: 'Partner', offices: [{ city: 'Chicago', state: 'IL' }, { city: 'Austin', state: 'TX' }], practice_areas: ['hedge_funds'], career_start_year: null, schools: ['Yale University'] }),
    row({ slug: 'dan-dunn-ropes', full_name: 'Dan Dunn', firm_name: 'Ropes & Gray', firm_domain: 'ropesgray.com', title: 'Counsel', offices: [{ city: 'Boston', state: 'MA' }], practice_areas: ['secondaries', 'venture_funds'], career_start_year: 2012, represents: ['investors_lps'] }),
  ]
}

describe('explorer rows', () => {
  it('reads the new columns, and treats them as empty before the migration', () => {
    const before = row({ full_name: 'Zed Zane' })
    expect(before).toMatchObject({ pp: null, y: null, sc: [], pf: [], lg: [] })
    const after = trade()[0]
    expect(after).toMatchObject({ pp: 'venture_funds', y: 2001, sc: ['Harvard'], pf: ['Cooley'], lg: ['Spanish'], st: ['NY'], c: ['new-york'], rk: 'partner' })
    // Schools fall back to the education column; a primary practice outside the trade's list is dropped.
    expect(trade()[1].sc).toEqual(['Stanford'])
    expect(row({ primary_practice: 'nav_lending' }).pp).toBeNull()
    // Secondary practices count as practices.
    expect(row({ practice_areas: [], secondary_practices: ['hedge_funds'] }).p).toEqual(['hedge_funds'])
    // A prior firm that is the current firm is not a prior firm.
    expect(row({ firm_name: 'Cooley', prior_firms: ['Cooley LLP', 'Latham & Watkins LLP'] }).pf).toEqual(['Latham & Watkins'])
  })

  it('ranks titles by their most senior word', () => {
    expect(titleRank('Managing Partner')).toBe('leader')
    expect(titleRank('Co-Chair, Investment Funds')).toBe('leader')
    expect(titleRank('Partner, Fund Advisory')).toBe('partner')
    expect(titleRank('Principal')).toBe('partner')
    expect(titleRank('Senior Managing Director')).toBe('md')
    expect(titleRank('Vice President')).toBe('vp')
    expect(titleRank('Director')).toBe('director')
    expect(titleRank('Of Counsel')).toBe('counsel')
    expect(titleRank('Associate')).toBe('other')
    expect(titleRank(null)).toBe('other')
  })

  it('groups schools and firms the way a reader means them', () => {
    expect(normalizeSchool('Harvard Law School, J.D.')).toBe('Harvard')
    expect(normalizeSchool('J.D., Harvard University')).toBe('Harvard')
    expect(normalizeSchool('New York University School of Law')).toBe('NYU')
    expect(normalizeSchool('University of California, Berkeley')).toBe('UC Berkeley')
    expect(normalizeSchool('Boston College Law School')).toBe('Boston College')
    expect(normalizeSchool('Emory University School of Law')).toBe('Emory University')
    expect(normalizeSchool('CPA')).toBeNull()
    expect(normalizeSchool('')).toBeNull()
    expect(normalizeFirm('Latham & Watkins LLP')).toBe('Latham & Watkins')
    expect(normalizeFirm('Goldman Sachs & Co. LLC')).toBe('Goldman Sachs')
  })

  it('counts experience in buckets, and ignores a year that cannot be right', () => {
    expect(yearsIn(2001, YEAR)).toBe(25)
    expect(yearsIn(2030, YEAR)).toBeNull()
    expect(yearsIn(1900, YEAR)).toBeNull()
    expect([expBucket(3), expBucket(10), expBucket(19), expBucket(20), expBucket(null)]).toEqual(['0-10', '10-20', '10-20', '20+', null])
  })
})

describe('filtering', () => {
  const rows = trade()
  const names = (q: XQuery) => runExplore(rows, q, YEAR).map((r) => r.n)

  it('any of a facet’s values, all of the facets', () => {
    expect(names(q({ f: { city: ['new-york', 'boston'] } }))).toEqual(['Ann Able', 'Dan Dunn'])
    expect(names(q({ f: { city: ['new-york', 'boston'], practice: ['secondaries'] } }))).toEqual(['Dan Dunn'])
    expect(names(q({ f: { state: ['TX'] } }))).toEqual(['Cat Cole'])
    expect(names(q({ f: { firm: ['kirkland.com'], rank: ['partner'] } }))).toEqual(['Ann Able', 'Cat Cole'])
    expect(names(q({ f: { exp: ['20+'] } }))).toEqual(['Ann Able'])
    expect(names(q({ f: { exp: ['0-10', '10-20'] } }))).toEqual(['Bob Baker', 'Dan Dunn'])
    expect(names(q({ f: { school: ['Harvard'], prior: ['Cooley'], lang: ['Spanish'], focus: ['emerging_managers'] } }))).toEqual(['Ann Able'])
    expect(names(q({ f: { side: ['investors_lps'] } }))).toEqual(['Dan Dunn'])
  })

  it('primary practice versus any practice', () => {
    expect(names(q({ f: { practice: ['venture_funds'] } }))).toEqual(['Ann Able', 'Bob Baker', 'Dan Dunn'])
    expect(names(q({ f: { practice: ['venture_funds'] }, pm: 'primary' }))).toEqual(['Ann Able'])
  })

  it('searches with the hub’s synonyms, and schools and prior firms too', () => {
    expect(names(q({ q: 'vc' }))).toEqual(expect.arrayContaining(['Ann Able', 'Bob Baker', 'Dan Dunn']))
    expect(names(q({ q: 'vc' }))).not.toContain('Cat Cole')
    expect(names(q({ q: 'harvard' }))).toEqual(['Ann Able'])
    expect(names(q({ q: 'kirkland chicago' }))).toEqual(['Cat Cole'])
    expect(names(q({ q: 'Kirkand' }))).toEqual(expect.arrayContaining(['Ann Able', 'Cat Cole']))
  })

  it('counts what each value would leave, given everything else', () => {
    const big = synthTrade(600).map((p, i) => toExploreRow({ ...p, career_start_year: 1990 + (i % 35), schools: [['Harvard', 'Yale', 'NYU'][i % 3]] }, LAW))
    const query = q({ q: 'smith', f: { city: ['new-york', 'boston'], practice: ['venture_funds'], exp: ['20+'] } })
    const counts = exploreCounts(big, query, YEAR)
    // Against the slow way: for each facet, run the query without that facet and count.
    for (const k of FACET_KEYS) {
      const rest = { ...query, f: { ...query.f, [k]: undefined } }
      const brute = new Map<string, number>()
      for (const r of runExplore(big, rest, YEAR)) for (const v of new Set(rowKeys(r, k, YEAR))) brute.set(v, (brute.get(v) ?? 0) + 1)
      for (const v of counts[k]) expect([k, v.key, v.count]).toEqual([k, v.key, brute.get(v.key) ?? 0])
      expect(counts[k].filter((v) => v.count > 0).length).toBe(brute.size)
    }
  })

  it('hides a facet or a column with nothing in it', () => {
    const plain = [row(), row({ offices: [{ city: 'Boston', state: 'MA' }] })]
    const live = liveFacets(exploreCounts(plain, emptyQuery(), YEAR), emptyQuery())
    expect(live).toContain('city')
    expect(live).not.toContain('exp')
    expect(live).not.toContain('school')
    expect(fieldsPresent(plain)).toMatchObject({ y: false, sc: false, pf: false, lg: false, pp: false })
    expect(fieldsPresent(trade())).toMatchObject({ y: true, sc: true, pf: true, lg: true, pp: true })
  })
})

describe('sorting', () => {
  const rows = trade()
  const names = (q: XQuery) => runExplore(rows, q, YEAR).map((r) => r.n)
  it('by surname by default, best match first when words are typed', () => {
    expect(names(q())).toEqual(['Ann Able', 'Bob Baker', 'Cat Cole', 'Dan Dunn'])
  })
  it('by any column, either way, with the unknowns last both ways', () => {
    expect(names(q({ sort: 'exp', dir: -1 }))).toEqual(['Ann Able', 'Dan Dunn', 'Bob Baker', 'Cat Cole'])
    expect(names(q({ sort: 'exp', dir: 1 }))).toEqual(['Bob Baker', 'Dan Dunn', 'Ann Able', 'Cat Cole'])
    expect(names(q({ sort: 'title', dir: 1 }))[0]).toBe('Bob Baker')
    expect(names(q({ sort: 'firm', dir: 1 }))).toEqual(['Bob Baker', 'Ann Able', 'Cat Cole', 'Dan Dunn'])
    expect(names(q({ sort: 'verified', dir: -1 })).slice(0, 2)).toEqual(['Bob Baker', 'Ann Able'])
  })
})

describe('addresses', () => {
  it('round-trip a query, each value its own parameter, defaults left out', () => {
    const query = q({ q: 'smith', f: { city: ['new-york', 'boston'], school: ['University of California, Berkeley'], exp: ['20+'] }, pm: 'primary', sort: 'exp', dir: -1 })
    const href = exploreHref('/fund-lawyers/explore', query)
    expect(href).toBe('/fund-lawyers/explore?q=smith&city=new-york&city=boston&exp=20%2B&school=University+of+California%2C+Berkeley&pm=primary&sort=exp')
    expect(parseExplore(new URL(`https://x.com${href}`).searchParams)).toEqual(query)
    expect(exploreHref('/x', emptyQuery())).toBe('/x')
    // Next's searchParams: a repeated key arrives as an array.
    expect(parseExplore({ city: ['a', 'b'], sort: 'name', dir: 'desc' })).toMatchObject({ f: { city: ['a', 'b'] }, sort: 'name', dir: -1 })
  })

  it('ignore what they do not know, and read the hub’s own filters', () => {
    expect(parseExplore({ rank: ['partner', 'emperor'], exp: 'forever', sort: 'salary', page: '3' })).toEqual(q({ f: { rank: ['partner'] } }))
    expect(parseExplore({ level: 'senior' }).f.rank).toEqual(['leader', 'partner', 'md'])
    expect(tableHrefFrom('/fund-lawyers/explore', { practice: 'venture_funds', city: 'boston', level: 'senior' })).toBe(
      '/fund-lawyers/explore?practice=venture_funds&city=boston&rank=leader&rank=partner&rank=md',
    )
    expect(tableHrefFrom('/fund-lawyers/explore', {})).toBe('/fund-lawyers/explore')
  })

  it('toggle a value without touching the old query', () => {
    const a = q({ f: { city: ['boston'] } })
    const b = toggleValue(a, 'city', 'new-york')
    expect(b.f.city).toEqual(['boston', 'new-york'])
    expect(a.f.city).toEqual(['boston'])
    expect(toggleValue(a, 'city', 'boston').f.city).toBeUndefined()
  })
})

describe('the explorer index', () => {
  it('round-trips every row exactly', () => {
    const rows = [...trade(), ...synthTrade(300).map((p) => toExploreRow(p, LAW))]
    const names = new Map(rows.map((r) => [r.d, r.f]))
    const back = decodeExplore(JSON.parse(JSON.stringify(encodeExplore(rows, YEAR))), (d) => names.get(d) ?? d)
    expect(back).toEqual(rows)
  })

  it('sends the usual slug as a number', () => {
    expect(nameSlug("Bridget R. O'Neill")).toBe('bridget-oneill')
    expect(nameSlug('Charles "Chuck" Charpentier')).toBe('charles-charpentier')
    expect(nameSlug('Kathleen (Kat) Saunders Gregor Jr.')).toBe('kathleen-gregor')
    const ix = encodeExplore(trade(), YEAR)
    expect(ix.people.filter((t) => t[0] === 0).length).toBe(4)
  })

  it('drops what it cannot read, and refuses another version', () => {
    const ix = encodeExplore(trade(), YEAR)
    ix.people.push(['x', 'Bad Firm', 99], ['short'] as never, [0, 42, 0])
    expect(decodeExplore(ix, (d) => d)).toHaveLength(4)
    expect(decodeExplore({ ...ix, v: EXPLORE_VERSION + 1 }, (d) => d)).toEqual([])
  })

  it('keeps a 3,000-person trade, every field filled, under 80 KB gzipped', () => {
    let seed = 11
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
    const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]
    const schools = Array.from({ length: 400 }, (_, i) => `${pick(['University of', 'College of', 'State University of'])} Place${i}`)
    const priors = Array.from({ length: 250 }, (_, i) => `Prior Firm ${i} LLP`)
    const rows = synthTrade(3000).map((p) =>
      toExploreRow(
        {
          ...p,
          fetched_at: `2026-10-${String(10 + Math.floor(rnd() * 14)).padStart(2, '0')}T10:00:00Z`,
          career_start_year: 1975 + Math.floor(rnd() * 45),
          primary_practice: p.practice_areas[0] ?? null,
          schools: [pick(schools), ...(rnd() < 0.7 ? [pick(['Harvard Law School', 'NYU School of Law', 'Columbia Law School', 'Georgetown University Law Center'])] : [])],
          prior_firms: rnd() < 0.5 ? [pick(priors)] : [],
          languages: rnd() < 0.1 ? [pick(['Spanish', 'Mandarin', 'French'])] : [],
          client_focus: rnd() < 0.3 ? ['emerging_managers'] : [],
        },
        LAW,
      ),
    )
    const json = JSON.stringify(encodeExplore(rows, YEAR))
    const gz = gzipSync(json, { level: 9 }).length
    console.log(`[3,000 people, every field] explorer index ${(json.length / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzipped`)
    expect(gz).toBeLessThan(80 * 1024)
  })
})

describe('the side panel', () => {
  const person = (over: Partial<Person> = {}): Person => ({
    ...card(),
    bar_admissions: ['New York'],
    education: [{ school: 'Harvard Law School', degree: 'J.D.', year: 2001 }, { school: 'CPA' }],
    bio_url: 'https://kirkland.com/lawyers/a/able-ann',
    headline: 'Funds partner',
    description: null,
    photo_url: null,
    contact_url: 'https://calendly.com/ann',
    notable: [],
    ...over,
  })

  it('offers the person’s own link only once they have claimed the profile', () => {
    const unclaimed = personDetail(person())
    expect(unclaimed.contact).toBeNull()
    expect(unclaimed.headline).toBeNull()
    expect(unclaimed.source).toMatchObject({ url: 'https://kirkland.com/lawyers/a/able-ann', text: 'Full bio on kirkland.com', fromFirm: true })
    expect(unclaimed.education).toEqual([{ school: 'Harvard Law School', degree: 'J.D.', year: '2001' }])
    const claimed = personDetail(person({ claimed_at: '2026-10-01T00:00:00Z' }))
    expect(claimed.contact).toBe('https://calendly.com/ann')
    expect(personDetail(person({ claimed_at: '2026-10-01', contact_url: 'javascript:alert(1)' })).contact).toBeNull()
  })

  it('never carries an email address or a phone number', () => {
    const d = JSON.stringify(personDetail(person({ claimed_at: '2026-10-01', contact_url: 'mailto:ann@kirkland.com' })))
    expect(d).not.toMatch(/mailto:|@kirkland\.com|tel:/)
  })
})

describe('before the migration', () => {
  it('knows a missing column when PostgREST reports one', () => {
    expect(isMissingColumn({ code: '42703', message: 'column directory_people.schools does not exist' })).toBe(true)
    expect(isMissingColumn({ code: 'PGRST204' })).toBe(true)
    expect(isMissingColumn({ code: '57014', message: 'canceling statement due to statement timeout' })).toBe(false)
  })
})
