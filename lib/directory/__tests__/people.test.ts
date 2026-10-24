import { describe, expect, it } from 'vitest'
import { countsSentence, filterPeople, isIndexable, isPublic, personJsonLd, profilePath, profileTitle, surname, type Person } from '../people'
import { card } from './fixtures'

const now = new Date('2026-10-24T12:00:00Z')

describe('indexability (Danny, 2026-10-24)', () => {
  it('indexes an unclaimed profile with title, firm, office and a practice area', () => {
    expect(isIndexable(card(), now)).toBe(true)
  })
  it('keeps thin unclaimed profiles out', () => {
    expect(isIndexable(card({ title: null }), now)).toBe(false)
    expect(isIndexable(card({ offices: [] }), now)).toBe(false)
    expect(isIndexable(card({ practice_areas: [] }), now)).toBe(false)
    expect(isIndexable(card({ practice_areas: ['other'] }), now)).toBe(false)
  })
  it('always indexes a claimed profile, never a hidden, unreviewed or missing one', () => {
    expect(isIndexable(card({ title: null, practice_areas: [], claimed_at: '2026-10-20T00:00:00Z' }), now)).toBe(true)
    expect(isIndexable(card({ status: 'hidden', claimed_at: '2026-10-20T00:00:00Z' }), now)).toBe(false)
    expect(isIndexable(card({ status: 'review' }), now)).toBe(false)
    expect(isIndexable(card({ missing_since: '2026-10-20' }), now)).toBe(false)
  })
  it('keeps a missing person public for 30 days only', () => {
    expect(isPublic(card({ missing_since: '2026-10-01' }), now)).toBe(true)
    expect(isPublic(card({ missing_since: '2026-09-01' }), now)).toBe(false)
  })
  it("uses the claimer's approved practice tags", () => {
    expect(isIndexable(card({ practice_areas: [], claimed_at: '2026-10-01', claimed_practice_areas: ['secondaries'] }), now)).toBe(true)
  })
})

describe('titles and structured data', () => {
  it('follows the title format', () => {
    expect(profileTitle(card({ full_name: 'Jane Smith' }))).toBe('Jane Smith, Partner at Kirkland & Ellis: Fund Lawyer in New York')
    expect(profileTitle(card({ full_name: 'Jane Smith', title: null, offices: [] }))).toBe('Jane Smith, Kirkland & Ellis: Fund Lawyer')
  })
  it('puts only shown facts in the Person JSON-LD', () => {
    const p = { ...card({ full_name: 'Jane Smith', slug: 'jane-smith' }), bar_admissions: ['New York'], education: [], bio_url: null, fetched_at: null, headline: null, description: null, photo_url: null, contact_url: null, notable: [] } as Person
    const ld = personJsonLd(p)
    expect(ld).toMatchObject({ '@type': 'Person', name: 'Jane Smith', jobTitle: 'Partner', worksFor: { name: 'Kirkland & Ellis', url: 'https://kirkland.com' }, address: { addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' } })
    expect(Object.keys(ld)).not.toContain('email')
    expect(Object.keys(ld)).not.toContain('image')
    expect(profilePath(p)).toBe('/fund-lawyers/people/jane-smith')
  })
})

describe('the hub', () => {
  const people = [
    card({ full_name: 'Ann Zed', firm_domain: 'a.com', firm_name: 'A' }),
    card({ full_name: 'Bob Young', firm_domain: 'b.com', firm_name: 'B LLP', offices: [{ city: 'Boston', state: 'MA' }], practice_areas: ['secondaries'] }),
  ]
  it('counts people, firms and cities', () => {
    expect(countsSentence(people)).toBe('2 fund lawyers at 2 firms in 2 US cities')
    expect(countsSentence(people.slice(0, 1))).toBe('1 fund lawyer at 1 firm in 1 US city')
  })
  it('searches name, firm and city, and filters', () => {
    expect(filterPeople(people, { q: 'boston' }).map((p) => p.full_name)).toEqual(['Bob Young'])
    expect(filterPeople(people, { q: 'b llp young' }).length).toBe(1)
    expect(filterPeople(people, { practice: 'secondaries' }).length).toBe(1)
    expect(filterPeople(people, { city: 'new-york' }).map((p) => p.full_name)).toEqual(['Ann Zed'])
    expect(filterPeople(people, { firm: 'a.com' }).length).toBe(1)
  })
  it('sorts on the surname', () => {
    expect(surname('Jane A. Smith Jr.')).toBe('Smith')
  })
})
