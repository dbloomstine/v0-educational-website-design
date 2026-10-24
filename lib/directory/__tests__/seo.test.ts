import { describe, expect, it } from 'vitest'
import { alternateName, bySurname, displayName, lastChanged, nickname, personJsonLd, profileTitle, surname, verifiedSpan, type Person } from '../people'
import { toRow } from '../rows'
import { peersOf } from '../peers'
import { directorySitemap } from '../sitemap'
import { normalQuery, queryHref } from '../search'
import { itemListJsonLd } from '../landing'
import { CATEGORIES, LIVE_CATEGORIES, type CategoryId } from '../taxonomy'
import { jsonLdScript } from '@/lib/news/story-jsonld'
import { card } from './fixtures'

const L = CATEGORIES.fund_lawyer

const person = (over: Partial<Person> = {}): Person => ({
  ...card(),
  bar_admissions: ['New York'],
  education: [],
  bio_url: 'https://www.kirkland.com/lawyers/s/smith-jane',
  fetched_at: '2026-10-23T15:00:00Z',
  updated_at: '2026-10-24T03:00:00Z',
  headline: null,
  description: null,
  photo_url: null,
  contact_url: null,
  notable: [],
  ...over,
})

/** What a page emits, read back the way a crawler reads it. */
const emitted = (data: unknown) => JSON.parse(jsonLdScript(data))

describe('nicknames (2026-10-24)', () => {
  it('moves a trailing nickname next to the first name, and leaves the rest alone', () => {
    expect(displayName('Jeffrey Misher (Jeff)')).toBe('Jeffrey (Jeff) Misher')
    expect(displayName('Jinyoung Joo (Jin)')).toBe('Jinyoung (Jin) Joo')
    expect(displayName('Charles (Chip) Parsons')).toBe('Charles (Chip) Parsons')
    expect(displayName('Christopher (Topher) A. Michail')).toBe('Christopher (Topher) A. Michail')
    expect(displayName('Jane  Smith')).toBe('Jane Smith')
    expect(displayName('Jane Smith (she/her)')).toBe('Jane Smith (she/her)')
  })

  it('sorts on the surname, never on the nickname', () => {
    expect(surname('Jeffrey Misher (Jeff)')).toBe('Misher')
    expect(surname('Charles (Chip) Parsons')).toBe('Parsons')
    expect(surname('Jane A. Smith Jr.')).toBe('Smith')
    const names = ['Jeffrey Misher (Jeff)', 'Anna Adamo', 'Jinyoung Joo (Jin)', 'Zoe Zimmer'].map((full_name) => ({ full_name }))
    expect(names.sort(bySurname).map((x) => x.full_name)).toEqual(['Anna Adamo', 'Jinyoung Joo (Jin)', 'Jeffrey Misher (Jeff)', 'Zoe Zimmer'])
  })

  it('carries the display name to titles, rows and lists, and the nickname to alternateName', () => {
    const p = card({ full_name: 'Jeffrey Misher (Jeff)', slug: 'jeffrey-misher' })
    expect(nickname(p.full_name)).toBe('Jeff')
    expect(alternateName(p.full_name)).toBe('Jeff Misher')
    expect(profileTitle(p, L)).toMatch(/^Jeffrey \(Jeff\) Misher, Partner at /)
    expect(toRow(p).n).toBe('Jeffrey (Jeff) Misher')
    expect(itemListJsonLd('x', '/fund-lawyers', [p]).itemListElement[0].name).toBe('Jeffrey (Jeff) Misher')
  })
})

describe('Person structured data (2026-10-24)', () => {
  it('emits valid JSON with sameAs, knowsAbout, worksFor and the office locality', () => {
    const ld = emitted(personJsonLd(person({ full_name: 'Jeffrey Misher (Jeff)' }), { sameAs: 'https://www.kirkland.com/lawyers/s/smith-jane', knowsAbout: ['Fund formation', 'Venture funds'], description: 'A sentence.' }))
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Person')
    expect(ld.name).toBe('Jeffrey (Jeff) Misher')
    expect(ld.alternateName).toBe('Jeff Misher')
    expect(ld.url).toMatch(/^https:\/\/fundopshq\.com\/fund-lawyers\/people\//)
    expect(ld.sameAs).toEqual(['https://www.kirkland.com/lawyers/s/smith-jane'])
    expect(ld.knowsAbout).toEqual(['Fund formation', 'Venture funds'])
    expect(ld.worksFor).toEqual({ '@type': 'Organization', name: 'Kirkland & Ellis', url: 'https://kirkland.com' })
    expect(ld.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' })
    expect(ld.description).toBe('A sentence.')
  })

  it('never puts an unsafe or missing link in sameAs, and leaves out what is not there', () => {
    const ld = emitted(personJsonLd(person({ offices: [], title: null }), { sameAs: 'http://insecure.example/bio' }))
    expect(ld.sameAs).toBeUndefined()
    expect(ld.knowsAbout).toBeUndefined()
    expect(ld.address).toBeUndefined()
    expect(ld.jobTitle).toBeUndefined()
  })

  it('wraps a claimed profile, and only a claimed one, in a ProfilePage with its dates', () => {
    expect(emitted(personJsonLd(person()))['@type']).toBe('Person')
    const ld = emitted(personJsonLd(person({ claimed_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-22T10:00:00Z' })))
    expect(ld['@type']).toBe('ProfilePage')
    expect(ld.dateCreated).toBe('2026-10-20T10:00:00Z')
    expect(ld.dateModified).toBe('2026-10-22T10:00:00Z')
    expect(ld.mainEntity['@type']).toBe('Person')
    expect(ld.mainEntity['@context']).toBeUndefined()
  })

  it('escapes a closing script tag in a name', () => {
    const out = jsonLdScript(personJsonLd(person({ full_name: 'Jane </script> Smith' })))
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out).name).toBe('Jane </script> Smith')
  })
})

describe('last verified and lastmod', () => {
  it('says one day, a span in a month, or a span across months', () => {
    expect(verifiedSpan([{ fetched_at: '2026-10-24T15:00:00Z' }, { fetched_at: '2026-10-24T16:00:00Z' }])).toBe('Oct 24, 2026')
    expect(verifiedSpan([{ fetched_at: '2026-10-21T15:00:00Z' }, { fetched_at: '2026-10-24T16:00:00Z' }])).toBe('Oct 21–24, 2026')
    expect(verifiedSpan([{ fetched_at: '2026-09-30T15:00:00Z' }, { fetched_at: '2026-10-24T16:00:00Z' }])).toBe('Sep 30 – Oct 24, 2026')
    expect(verifiedSpan([{ fetched_at: null }])).toBeNull()
  })

  it('takes the newest of every read and edit', () => {
    expect(lastChanged([{ fetched_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-05T00:00:00Z' }, { fetched_at: '2026-10-03T00:00:00Z', updated_at: null }])).toBe('2026-10-05T00:00:00Z')
    expect(lastChanged([])).toBeNull()
  })
})

describe('the hub list on first load (2026-10-24: stuck on "Searching…")', () => {
  it('builds the server’s address and the browser’s first address alike', () => {
    // What HubView passes as `initial` on a plain /fund-lawyers: page 1 and empty filters.
    const initial = { q: '', practice: '', city: '', firm: '', level: '', sort: 'name' as const, page: 1 }
    const live = { q: '', practice: '', city: '', firm: '', level: '', sort: 'name' as const }
    expect(queryHref('/fund-lawyers', normalQuery(initial), initial.page)).toBe(queryHref('/fund-lawyers', live, 1))
    expect(queryHref('/fund-lawyers', normalQuery(initial), initial.page)).toBe('/fund-lawyers')
    // The old key spread `initial` whole, page included: "?page=1", which never matched.
    expect(queryHref('/fund-lawyers', initial as never, 1)).not.toBe('/fund-lawyers')
    expect(queryHref('/fund-lawyers', normalQuery({ q: ' smith ', city: 'boston', sort: 'firm' }), 2)).toBe('/fund-lawyers?q=smith&city=boston&sort=firm&page=2')
  })
})

describe('partners at other firms (richer profiles)', () => {
  it('lists the same city and shared practices at other firms, at most two a firm', () => {
    const me = card({ firm_domain: 'cooley.com', firm_name: 'Cooley', offices: [{ city: 'San Francisco', state: 'CA' }], practice_areas: ['venture_funds', 'fund_formation'] })
    const others = [
      card({ firm_domain: 'cooley.com', offices: [{ city: 'San Francisco', state: 'CA' }], practice_areas: ['venture_funds'] }),
      ...Array.from({ length: 3 }, () => card({ firm_domain: 'gunder.com', firm_name: 'Gunderson', offices: [{ city: 'San Francisco', state: 'CA' }], practice_areas: ['venture_funds', 'fund_formation'] })),
      card({ firm_domain: 'wsgr.com', firm_name: 'WSGR', offices: [{ city: 'San Francisco', state: 'CA' }], practice_areas: ['fund_formation'] }),
      card({ firm_domain: 'wsgr.com', offices: [{ city: 'Boston', state: 'MA' }], practice_areas: ['venture_funds'] }),
      card({ firm_domain: 'x.com', offices: [{ city: 'San Francisco', state: 'CA' }], practice_areas: ['hedge_funds'] }),
    ]
    const peers = peersOf(me, [me, ...others], 'san-francisco', L)
    expect(peers.map((x) => x.person.firm_domain)).toEqual(['gunder.com', 'gunder.com', 'wsgr.com'])
    expect(peers[0].shared).toEqual(['fund_formation', 'venture_funds'])
  })
})

describe('the directory sitemap', () => {
  it('lists only indexable pages, each with a lastmod', () => {
    const at = (i: number, city: string, state: string, practice: string) =>
      card({ firm_domain: `f${i % 3}.com`, firm_name: `F${i % 3}`, offices: [{ city, state }], practice_areas: [practice], fetched_at: `2026-10-${String(1 + (i % 20)).padStart(2, '0')}T00:00:00Z`, updated_at: '2026-10-22T00:00:00Z' })
    const lawyers = [...Array.from({ length: 20 }, (_, i) => at(i, 'New York', 'NY', 'hedge_funds')), ...Array.from({ length: 20 }, (_, i) => at(i, 'Boston', 'MA', 'venture_funds'))]
    const lists = new Map<CategoryId, ReturnType<typeof card>[]>([['fund_lawyer', lawyers]])
    const entries = directorySitemap(lists, LIVE_CATEGORIES)
    const paths = entries.map((e) => e.path)
    expect(paths.slice(0, 3)).toEqual(['/directory', '/directory/about', '/fund-lawyers'])
    expect(paths).toContain('/fund-lawyers/new-york')
    // Hedge funds in New York is New York again; New York State is New York City: neither is offered.
    expect(paths).not.toContain('/fund-lawyers/hedge-funds/new-york')
    expect(paths).not.toContain('/fund-lawyers/new-york-state')
    expect(entries.every((e) => e.lastmod)).toBe(true)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.filter((p) => p.includes('/people/'))).toHaveLength(40)
  })
})
