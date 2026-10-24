import { describe, expect, it } from 'vitest'
import { cleanName, stateFromCity, contactProblem, nameProblem, onDomain, setFlags, slugFor, titleProblem, usOffices, validateCandidate } from '../validate'
import type { Candidate, DirectoryRow, SourceRow } from '../types'

const source: Pick<SourceRow, 'key' | 'firm_name' | 'firm_domain' | 'category' | 'selectors' | 'source'> = {
  key: 'asante',
  firm_name: 'Asante Capital',
  firm_domain: 'asantecapital.com',
  category: 'placement_agent',
  selectors: { slug_suffix: 'asante' },
  source: 'firm_site',
}

function cand(over: Partial<Candidate['person']> = {}, page: Partial<Candidate['page']> = {}): Candidate {
  return {
    source_key: 'asante',
    fetched_at: '2026-10-25T00:00:00.000Z',
    page: { url: 'https://www.asantecapital.com/our-team/jane-smith', bio_url: 'https://www.asantecapital.com/our-team/jane-smith', kind: 'bio', ...page },
    person: {
      full_name: 'Jane Smith',
      title: 'Managing Director',
      offices: [{ city: 'New York', state: 'NY', country: 'US' }],
      in_scope: true,
      trade: 'placement_agent',
      scope_evidence: 'raises capital for private equity funds',
      practice_areas: ['buyout_funds'],
      practice_evidence: 'practice list',
      client_focus: [],
      represents: [],
      bar_admissions: [],
      education: [{ school: 'Yale University', degree: 'B.A.', year: 2004 }],
      ...over,
    },
  }
}
const ok = (c: Candidate, s = source) => validateCandidate(c, { source: s, slug: slugFor(c.person.full_name, s.selectors.slug_suffix) })

describe('names', () => {
  it('accepts people, with initials, suffixes and particles', () => {
    for (const n of ['Jane Smith', 'J. Michael Smith', 'William Osborn IV', 'Robert Smith Jr.', 'Jan van der Berg', "Siobhán O'Neill", 'Mary-Kate Olsen Lee', 'Anne-Marie de la Cruz', 'Cindy Le', 'Thanh Van']) expect(nameProblem(n), n).toBeNull()
  })
  it('refuses firms, teams, single words, sentences and long strings', () => {
    expect(nameProblem('Asante Capital')).toMatch(/firm word/)
    expect(nameProblem('Fund Finance Team')).toMatch(/firm word/)
    expect(nameProblem('Madonna')).toMatch(/fewer than two/)
    expect(nameProblem('John Paul George Ringo Smith')).toMatch(/more than four/)
    expect(nameProblem('Meet our people')).toBeTruthy()
    expect(nameProblem('Jane Smith 2')).toMatch(/digits/)
    expect(nameProblem('Jane (Smith)')).toMatch(/symbols/)
    expect(nameProblem('jane smith')).toMatch(/lower-case/)
    expect(nameProblem('J. K.')).toMatch(/initials only/)
  })
  it('strips credentials and re-cases ALL CAPS', () => {
    expect(cleanName('Jane Smith, CPA').name).toBe('Jane Smith')
    expect(cleanName('Dr. Jane Smith CFA').name).toBe('Jane Smith')
    expect(cleanName('JANE SMITH')).toEqual({ name: 'Jane Smith', wasCaps: true })
    expect(cleanName('Alex Wilcox (née Jerez-Fernandez)').name).toBe('Alex Wilcox')
    expect(cleanName('Robert "Bob" Smith').name).toBe('Robert Smith')
  })
  it('slugs as every earlier build did', () => {
    expect(slugFor('Jane Q. Smith Jr.', 'kirkland')).toBe('jane-smith-kirkland')
    expect(slugFor('William Osborn IV', 'pjt')).toBe('william-osborn-pjt')
    expect(slugFor("Siobhán O'Neill", 'rede')).toBe('siobhan-oneill-rede')
  })
})

describe('titles', () => {
  it('accepts the vocabulary', () => {
    for (const t of ['Partner', 'Managing Director', 'Senior Associate, Investments', 'Of Counsel', 'Vice President', 'Principal', 'Co-Founder & Managing Partner', 'Senior Manager', 'Head of Fund Finance']) expect(titleProblem(t), t).toBeNull()
  })
  it('refuses back-office jobs, blanks and unknown words', () => {
    expect(titleProblem('Executive Assistant')).toMatch(/out-of-scope/)
    expect(titleProblem('CFO & COO')).toMatch(/out-of-scope/)
    expect(titleProblem('Director of Marketing')).toMatch(/out-of-scope/)
    expect(titleProblem('Office Manager')).toMatch(/out-of-scope/)
    expect(titleProblem('')).toBe('no title')
    expect(titleProblem('Rockstar Ninja')).toMatch(/no known role/)
  })
})

describe('offices', () => {
  it('keeps US cities with real states, drops regions and foreign offices', () => {
    const r = usOffices([
      { city: 'New York City', state: 'New York', country: 'United States' },
      { city: 'London', state: '', country: 'United Kingdom' },
      { city: 'Americas', state: '', country: '' },
      { city: 'Boston', state: 'MA', country: 'US' },
      { city: 'Boston', state: 'MA', country: 'US' },
    ])
    expect(r.offices).toEqual([{ city: 'New York', state: 'NY' }, { city: 'Boston', state: 'MA' }])
    expect(r.dropped).toHaveLength(2)
  })
  it('fills a missing state only from an unambiguous known city', () => {
    expect(usOffices([{ city: 'New York', state: '', country: 'US' }]).offices).toEqual([{ city: 'New York', state: 'NY' }])
    expect(stateFromCity('Boston')).toBe('MA')
    expect(stateFromCity('Portland')).toBeNull()
    expect(stateFromCity('Springfield')).toBeNull()
    expect(usOffices([{ city: 'New York', state: 'Ontario', country: 'US' }]).offices).toEqual([])
  })
})

describe('contact details and domains', () => {
  it('finds emails and phones in any field, not digits in URLs', () => {
    expect(contactProblem({ title: 'Partner jane@firm.com' })).toMatch(/email in title/)
    expect(contactProblem({ education: [{ school: 'Call (212) 555-1234' }] })).toMatch(/phone number in education/)
    expect(contactProblem({ bio_url: 'https://firm.com/people/2125551234-jane' })).toBeNull()
    expect(contactProblem({ bio_url: 'mailto:jane@firm.com' })).toMatch(/email/)
    expect(contactProblem({ education: [{ school: 'Yale', year: 2004 }] })).toBeNull()
  })
  it('matches a domain and its subdomains only', () => {
    expect(onDomain('https://www.kirkland.com/lawyers/s/smith', 'kirkland.com')).toBe(true)
    expect(onDomain('https://people.kirkland.com/x', 'kirkland.com')).toBe(true)
    expect(onDomain('https://notkirkland.com/x', 'kirkland.com')).toBe(false)
    expect(onDomain('https://www.linkedin.com/in/jane', 'kirkland.com')).toBe(false)
  })
})

describe('validateCandidate', () => {
  it('passes a clean row in the loader shape', () => {
    const v = ok(cand())
    expect(v.ok).toBe(true)
    expect(v.row).toMatchObject({ slug: 'jane-smith-asante', category: 'placement_agent', firm_domain: 'asantecapital.com', source: 'firm_site', source_url: null, offices: [{ city: 'New York', state: 'NY' }] })
  })
  it('rejects out-of-scope, no US office, off-domain bio, contact details', () => {
    expect(ok(cand({ in_scope: false, scope_evidence: 'operations' })).errors[0]).toMatch(/out of scope/)
    expect(ok(cand({ offices: [{ city: 'London', state: '', country: 'UK' }] })).errors.join()).toMatch(/no US office/)
    expect(ok(cand({}, { bio_url: 'https://www.linkedin.com/in/jane' })).errors.join()).toMatch(/not on asantecapital.com/)
    expect(ok(cand({ title: 'Managing Director, +1 212 555 1234' })).errors.join()).toMatch(/phone/)
  })
  it('rejects an office taken from a coverage sentence, flags one not quoted', () => {
    expect(ok(cand({ office_evidence: 'driving new client acquisition in New York' })).errors.join()).toMatch(/coverage area/)
    expect(ok(cand({ office_evidence: 'covers investors across the Northeast' })).ok).toBe(false)
    expect(ok(cand({ office_evidence: 'Office: New York' })).ok).toBe(true)
    expect(ok(cand({ office_evidence: 'based in New York and covering North American investors' })).ok).toBe(true)
    expect(ok(cand({ office_evidence: '' })).flags.join()).toMatch(/not quoted/)
  })
  it('allows an approved domain (an event site) and keeps the source URL', () => {
    const s = { ...source, source: 'event_speaker' as const, selectors: { slug_suffix: 'asante', approved_domains: ['fundfinanceassociation.com'] } }
    const v = ok(cand({}, { url: 'https://www.fundfinanceassociation.com/speakers', bio_url: 'https://www.asantecapital.com/our-team/jane-smith' }), s)
    expect(v.ok).toBe(true)
    expect(v.row?.source).toBe('event_speaker')
    expect(v.row?.source_url).toBe('https://www.fundfinanceassociation.com/speakers')
  })
  it('drops practice tags outside the trade and flags them; drops inferred sides outside law', () => {
    const v = ok(cand({ practice_areas: ['fund_formation', 'buyout_funds', 'private_equity_funds'], represents: ['sponsors_gps'] }))
    expect(v.row?.practice_areas).toEqual(['buyout_funds'])
    expect(v.row?.represents).toEqual([])
    expect(v.flags.join()).toMatch(/fund_formation.*dropped/)
  })
  it('uses a single-office default only when the page states no office, and flags it', () => {
    const s = { ...source, selectors: { slug_suffix: 'hark', default_office: { city: 'New York', state: 'NY', evidence_url: 'https://www.harkcap.com/contact' } } }
    const v = ok(cand({ offices: [] }), s)
    expect(v.row?.offices).toEqual([{ city: 'New York', state: 'NY' }])
    expect(v.flags.join()).toMatch(/single-office/)
    expect(ok(cand({ offices: [{ city: 'London', state: '', country: 'UK' }] }), s).ok).toBe(false)
  })
  it('for an accounting source, takes the model trade and refuses one outside the list', () => {
    const s = { ...source, category: 'fund_auditor' as const, firm_domain: 'asantecapital.com', selectors: { slug_suffix: 'x', categories: ['fund_auditor' as const, 'fund_tax_advisor' as const] } }
    expect(ok(cand({ trade: 'fund_tax_advisor', title: 'Tax Partner', practice_areas: [] }), s).row?.category).toBe('fund_tax_advisor')
    expect(ok(cand({ trade: 'none', title: 'Tax Partner' }), s).errors.join()).toMatch(/trade/)
  })
  it('flags a bio URL many people share', () => {
    const r = (slug: string, bio_url: string) => ({ slug, bio_url }) as DirectoryRow
    const f = setFlags([r('a', 'https://x.com/team'), r('b', 'https://x.com/team'), r('c', 'https://x.com/c')])
    expect([...f.keys()].sort()).toEqual(['a', 'b'])
  })
})
