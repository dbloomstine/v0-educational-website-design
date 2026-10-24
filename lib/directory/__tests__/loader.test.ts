import { describe, expect, it } from 'vitest'
import { mergeRecord, missingFrom, parseRecord, type ExistingRow, type SourceRecord } from '../loader'

const raw = {
  full_name: ' Jane  Smith ',
  title: 'Partner',
  firm_name: 'Kirkland & Ellis',
  firm_domain: 'https://www.kirkland.com/',
  offices: [{ city: 'New York', state: 'NY' }, { city: 'London', state: 'UK' }],
  practice_areas: ['fund_formation', 'made_up'],
  client_focus: ['emerging_managers'],
  represents: ['sponsors_gps'],
  bar_admissions: ['New York'],
  education: [{ school: 'Harvard Law School', degree: 'J.D.', year: 2005 }],
  bio_url: 'https://www.kirkland.com/lawyers/s/smith-jane',
  fetched_at: '2026-10-24T10:00:00Z',
  slug: 'jane-smith-kirkland',
}

const rec = () => {
  const p = parseRecord(raw)
  if (!p.ok) throw new Error(p.error)
  return p.value
}

const existing = (over: Partial<ExistingRow> = {}): ExistingRow => {
  const r: SourceRecord = rec()
  return { ...r, id: 'id-1', category: 'fund_lawyer', status: 'published', missing_since: null, ...over }
}

describe('parsing a line', () => {
  it('normalises, keeps US offices only and drops unknown practice areas', () => {
    const p = parseRecord(raw)
    expect(p.ok).toBe(true)
    if (!p.ok) return
    expect(p.value.full_name).toBe('Jane Smith')
    expect(p.value.firm_domain).toBe('kirkland.com')
    expect(p.value.offices).toEqual([{ city: 'New York', state: 'NY' }])
    expect(p.value.practice_areas).toEqual(['fund_formation'])
    expect(p.warnings.length).toBe(2)
  })
  it('refuses a person with no US office, a bad slug or a reserved slug', () => {
    expect(parseRecord({ ...raw, offices: [{ city: 'London', state: 'UK' }] })).toMatchObject({ ok: false })
    expect(parseRecord({ ...raw, slug: 'Jane Smith' })).toMatchObject({ ok: false })
    expect(parseRecord({ ...raw, slug: 'people' })).toMatchObject({ ok: false })
    expect(parseRecord({ ...raw, firm_domain: '' })).toMatchObject({ ok: false })
  })
})

describe('merge rules', () => {
  it('inserts a new person as review', () => {
    expect(mergeRecord(null, rec(), 'fund_lawyer')).toMatchObject({ kind: 'insert', row: { status: 'review', source: 'firm_site', category: 'fund_lawyer' } })
  })
  it('updates only firm-site fields, never the status or a claim field', () => {
    const m = mergeRecord(existing({ title: 'Associate' }), rec(), 'fund_lawyer')
    expect(m).toMatchObject({ kind: 'update', fields: ['title'] })
    if (m.kind !== 'update') return
    expect(Object.keys(m.changes).sort()).toEqual(['title'])
    for (const k of ['status', 'headline', 'description', 'photo_url', 'contact_url', 'notable', 'claimed_at', 'claimed_practice_areas', 'pending_edits']) expect(m.changes).not.toHaveProperty(k)
  })
  it('leaves an unchanged person alone, and moves the "as of" date forward only', () => {
    expect(mergeRecord(existing(), rec(), 'fund_lawyer')).toEqual({ kind: 'unchanged', slug: 'jane-smith-kirkland' })
    expect(mergeRecord(existing({ fetched_at: '2026-10-01T00:00:00.000Z' }), rec(), 'fund_lawyer')).toMatchObject({ kind: 'update', fields: [], changes: { fetched_at: '2026-10-24T10:00:00.000Z' } })
    expect(mergeRecord(existing({ fetched_at: '2026-11-01T00:00:00.000Z' }), rec(), 'fund_lawyer')).toMatchObject({ kind: 'unchanged' })
  })
  it('clears missing_since when the person is back', () => {
    expect(mergeRecord(existing({ missing_since: '2026-10-01' }), rec(), 'fund_lawyer')).toMatchObject({ kind: 'update', changes: { missing_since: null } })
  })
  it('never brings back a removed person, or takes another category’s slug', () => {
    expect(mergeRecord(existing({ status: 'removed', title: 'x' }), rec(), 'fund_lawyer')).toMatchObject({ kind: 'skip' })
    expect(mergeRecord(existing({ category: 'fund_auditor' }), rec(), 'fund_lawyer')).toMatchObject({ kind: 'skip' })
  })
  it('stamps as missing only people at firms this file covers', () => {
    const rows = [
      existing({ id: '1', slug: 'gone', firm_domain: 'kirkland.com' }),
      existing({ id: '2', slug: 'other-firm', firm_domain: 'lw.com' }),
      existing({ id: '3', slug: 'jane-smith-kirkland' }),
      existing({ id: '4', slug: 'already', missing_since: '2026-10-01' }),
      existing({ id: '5', slug: 'removed', status: 'removed' }),
    ]
    const out = missingFrom(rows, new Set(['jane-smith-kirkland']), new Set(['kirkland.com']), 'fund_lawyer')
    expect(out.map((r) => r.slug)).toEqual(['gone'])
  })
})
