import { describe, expect, it } from 'vitest'
import { CLAIM_FIELDS, assertCrawledOnly, compareFiles, diffCrawl, type StoredRow } from '../diff'
import type { DirectoryRow } from '../types'

const row = (slug: string, over: Partial<DirectoryRow> = {}): DirectoryRow => ({
  category: 'placement_agent',
  full_name: slug.split('-').slice(0, 2).map((s) => s[0].toUpperCase() + s.slice(1)).join(' '),
  title: 'Managing Director',
  firm_name: 'Asante Capital',
  firm_domain: 'asantecapital.com',
  offices: [{ city: 'New York', state: 'NY' }],
  practice_areas: [],
  client_focus: [],
  represents: [],
  bar_admissions: [],
  education: [],
  bio_url: `https://www.asantecapital.com/our-team/${slug}`,
  fetched_at: '2026-10-25T00:00:00.000Z',
  slug,
  source: 'firm_site',
  source_url: null,
  city_basis: 'person',
  office_source_url: null,
  ...over,
})
const stored = (slug: string, over: Partial<StoredRow> = {}): StoredRow => {
  const { fetched_at: _f, ...r } = row(slug)
  return { ...r, id: `id-${slug}`, status: 'published', missing_since: null, claimed_at: null, fetched_at: '2026-10-18T00:00:00.000Z', ...over }
}
const opt = { today: '2026-10-25', firms: new Set(['asantecapital.com']), categories: new Set(['placement_agent' as const]) }

describe('diffCrawl', () => {
  it('sorts rows into new, changed, date-only and missing', () => {
    const d = diffCrawl(
      [stored('a-one-asante'), stored('b-two-asante'), stored('c-three-asante'), stored('d-four-asante')],
      [row('a-one-asante'), row('b-two-asante', { title: 'Partner' }), row('c-three-asante'), row('e-five-asante')],
      opt,
    )
    expect(d.added.map((r) => r.slug)).toEqual(['e-five-asante'])
    expect(d.changed.map((c) => [c.slug, c.fields])).toEqual([['b-two-asante', ['title']]])
    expect(d.changed[0].set).toEqual({ title: 'Partner', fetched_at: '2026-10-25T00:00:00.000Z' })
    expect(d.touched.map((c) => c.slug)).toEqual(['a-one-asante', 'c-three-asante'])
    expect(d.missing.map((m) => m.slug)).toEqual(['d-four-asante'])
  })

  it('clears missing_since for someone back, and expires someone missing over 30 days', () => {
    const d = diffCrawl(
      [stored('a-one-asante', { missing_since: '2026-10-11' }), stored('b-two-asante', { missing_since: '2026-09-01' }), stored('c-three-asante', { missing_since: '2026-10-20' }), stored('d-four-asante')],
      [row('a-one-asante'), row('d-four-asante')],
      opt,
    )
    expect(d.returned).toEqual(['a-one-asante'])
    expect(d.changed[0].set.missing_since).toBeNull()
    expect(d.expired.map((e) => e.slug)).toEqual(['b-two-asante'])
    // Already stamped and within 30 days: neither re-stamped nor expired.
    expect(d.missing).toEqual([])
  })

  it('does not stamp a stored person the crawl read but refused (they are still on the site)', () => {
    const d = diffCrawl([stored('a-one-asante'), stored('b-two-asante')], [row('a-one-asante')], { ...opt, refused: new Set(['b-two-asante']) })
    expect(d.missing).toEqual([])
    expect(d.refused.map((r) => r.slug)).toEqual(['b-two-asante'])
  })

  it('never touches removed rows, other trades, or firms the crawl did not cover', () => {
    const d = diffCrawl(
      [
        stored('a-one-asante', { status: 'removed' }),
        stored('b-two-asante', { category: 'fund_lawyer' }),
        stored('c-three-rede', { firm_domain: 'rede-partners.com' }),
        stored('z-gone-asante', { status: 'removed' }),
      ],
      [row('a-one-asante'), row('b-two-asante')],
      opt,
    )
    expect(d.skipped.map((s) => s.reason)).toEqual(['removed: never re-added by a crawl', 'slug belongs to a fund_lawyer'])
    expect(d.missing).toEqual([])
    expect(d.added).toEqual([])
  })

  it('stamps nobody at a firm whose crawl found too few (a redesign, not an exodus)', () => {
    const st = ['a', 'b', 'c', 'd', 'e'].map((x) => stored(`${x}-x-asante`))
    const d = diffCrawl(st, [row('a-x-asante'), row('b-x-asante')], opt)
    expect(d.suppressed).toEqual([{ firm_domain: 'asantecapital.com', crawled: 2, stored: 5 }])
    expect(d.missing).toEqual([])
    const d2 = diffCrawl(st, ['a', 'b', 'c', 'd'].map((x) => row(`${x}-x-asante`)), opt)
    expect(d2.missing.map((m) => m.slug)).toEqual(['e-x-asante'])
  })

  it('marks changes to a claimed profile and never writes a claim field', () => {
    const d = diffCrawl([stored('a-one-asante', { claimed_at: '2026-10-20T00:00:00Z' })], [row('a-one-asante', { title: 'Partner' })], opt)
    expect(d.changed[0].claimed).toBe(true)
    for (const f of CLAIM_FIELDS) expect(Object.keys(d.changed[0].set)).not.toContain(f)
    expect(() => assertCrawledOnly(d.changed[0].set)).not.toThrow()
    expect(() => assertCrawledOnly({ title: 'x', headline: 'Best lawyer' })).toThrow(/headline/)
    expect(() => assertCrawledOnly({ status: 'published' })).toThrow(/status/)
  })

  it('does not treat a column the table lacks (source_url before the migration) as a change', () => {
    const s = stored('a-one-asante')
    delete (s as Partial<StoredRow>).source_url
    const d = diffCrawl([s], [row('a-one-asante')], opt)
    expect(d.changed).toEqual([])
  })

  it('never moves the read date backwards', () => {
    const d = diffCrawl([stored('a-one-asante', { fetched_at: '2026-10-30T00:00:00Z' })], [row('a-one-asante')], opt)
    expect(d.touched).toEqual([])
    expect(d.changed).toEqual([])
  })
})

describe('compareFiles', () => {
  it('reports only-old, only-new and field changes by slug', () => {
    const c = compareFiles([row('a-one-asante'), row('b-two-asante')], [row('b-two-asante', { practice_areas: ['buyout_funds'] }), row('c-three-asante')])
    expect(c.onlyOld.map((r) => r.slug)).toEqual(['a-one-asante'])
    expect(c.onlyNew.map((r) => r.slug)).toEqual(['c-three-asante'])
    expect(c.fieldChanges.practice_areas).toHaveLength(1)
    expect(c.both).toBe(1)
  })
})
