import { describe, expect, it } from 'vitest'
import { hostLabel, provenance } from '../provenance'
import { mergeRecord, needsProvenance, parseRecord, type ExistingRow } from '../loader'

const base = { firm_name: 'M&T Bank', firm_domain: 'mtb.com' }

describe('provenance labels', () => {
  it('names the kind of page and where it is', () => {
    expect(provenance({ ...base, bio_url: 'https://www.mtb.com/x' }).label).toBe('Firm bio, mtb.com')
    expect(provenance({ ...base, source: 'event_speaker', source_url: 'https://www.fundfinanceassociation.com/events/x/' })).toMatchObject({
      label: 'Speaker bio, Fund Finance Association',
      url: 'https://www.fundfinanceassociation.com/events/x/',
      linkText: 'View the speaker page',
    })
    expect(provenance({ ...base, source: 'press_release', source_url: 'https://www.businesswire.com/news/x' }).label).toBe('Press release, M&T Bank')
    expect(hostLabel('https://events.example.org/a')).toBe('events.example.org')
  })
  it('says how the office city is known when it is not the person', () => {
    expect(provenance({ ...base, city_basis: 'person' }).officeNote).toBeNull()
    expect(provenance({ ...base, city_basis: 'brokercheck', office_source_url: 'https://brokercheck.finra.org/individual/summary/1' })).toMatchObject({ officeNote: 'Office city from FINRA BrokerCheck.', officeUrl: 'https://brokercheck.finra.org/individual/summary/1' })
    expect(provenance({ ...base, city_basis: 'firm_single_office' }).officeNote).toMatch(/one office/)
    expect(provenance({ ...base, city_basis: 'nonsense' }).officeNote).toBeNull()
  })
})

const line = {
  category: 'fund_finance_banker', full_name: 'Jasen Yang', title: 'Managing Director', firm_name: 'Apollo', firm_domain: 'apollo.com',
  offices: [{ city: 'New York', state: 'NY' }], practice_areas: ['fund_finance'], client_focus: [], represents: [], bar_admissions: [], education: [],
  bio_url: 'https://www.fundfinanceassociation.com/events/x/', fetched_at: '2026-10-24T03:45:26Z', slug: 'jasen-yang-apollo',
}

describe('loader provenance', () => {
  it('accepts source, source_url, city_basis and office_source_url', () => {
    const p = parseRecord({ ...line, source: 'event_speaker', source_url: line.bio_url, city_basis: 'brokercheck', office_source_url: 'https://brokercheck.finra.org/x' })
    expect(p.ok && p.value).toMatchObject({ source: 'event_speaker', city_basis: 'brokercheck', office_source_url: 'https://brokercheck.finra.org/x' })
    expect(p.ok && needsProvenance(p.value)).toBe(true)
  })
  it('defaults a line without provenance to the firm site, and refuses bad values', () => {
    const p = parseRecord(line)
    expect(p.ok && p.value).toMatchObject({ source: 'firm_site', source_url: null, city_basis: null })
    expect(p.ok && needsProvenance(p.value)).toBe(false)
    expect(parseRecord({ ...line, source: 'linkedin' }).ok).toBe(false)
    expect(parseRecord({ ...line, source: 'press_release' }).ok).toBe(false)
    expect(parseRecord({ ...line, city_basis: 'guess' }).ok).toBe(false)
  })
  it('inserts with the line source and compares provenance only where the table has it', () => {
    const p = parseRecord({ ...line, source: 'event_speaker', source_url: line.bio_url })
    if (!p.ok) throw new Error(p.error)
    expect(mergeRecord(null, p.value)).toMatchObject({ kind: 'insert', row: { source: 'event_speaker' } })
    const { source: _s, source_url: _u, city_basis: _c, office_source_url: _o, category, ...facts } = p.value
    const old: ExistingRow = { ...facts, category, id: '1', status: 'published', missing_since: null }
    expect(mergeRecord(old, p.value).kind).toBe('unchanged')
    expect(mergeRecord({ ...old, source: 'firm_site', source_url: null, city_basis: null, office_source_url: null }, p.value)).toMatchObject({ kind: 'update', fields: ['source', 'source_url'] })
  })
})
