import { describe, expect, it } from 'vitest'
import { parseLine } from '../../../scripts/directory/apply-fields'

const ok = {
  slug: 'jane-doe-kirkland',
  career_start_year: 2013,
  primary_practice: 'fund_formation',
  secondary_practices: ['secondaries', 'secondaries'],
  prior_firms: ['Latham & Watkins'],
  schools: ['Duke University School of Law'],
  languages: [],
  field_evidence: { career_start_year: 'Duke University School of Law J.D. 2013' },
}

describe('apply-fields parseLine', () => {
  it('accepts a good line and dedupes arrays', () => {
    expect(parseLine(ok).secondary_practices).toEqual(['secondaries'])
  })
  it('allows nulls', () => {
    expect(parseLine({ ...ok, career_start_year: null, primary_practice: null }).primary_practice).toBeNull()
  })
  it('refuses a practice outside the vocabulary, a bad year, a bad slug', () => {
    expect(() => parseLine({ ...ok, primary_practice: 'm_and_a' })).toThrow()
    expect(() => parseLine({ ...ok, secondary_practices: ['nope'] })).toThrow()
    expect(() => parseLine({ ...ok, career_start_year: 1013 })).toThrow()
    expect(() => parseLine({ ...ok, slug: 'Bad Slug' })).toThrow()
    expect(() => parseLine({ ...ok, field_evidence: [] })).toThrow()
  })
})
