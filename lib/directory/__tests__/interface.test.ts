import { describe, expect, it } from 'vitest'
import { card } from './fixtures'
import { dedupePeople, displayTitle, seniority, visiblePractices } from '../quality'
import { FIRM_MIN, firmSlug, firmsOf, firmsWithPages, peopleAtFirm } from '../firms'
import { editDistance, facetCounts, haystack, runQuery, scoreQuery, wordScore, type Row } from '../search'
import { rowFirms, toRow } from '../rows'
import { logoFor, monogram } from '../logos'
import { CATEGORIES, RESERVED_SLUGS } from '../taxonomy'
import { summarize } from '../summary'
import manifest from '../logos.json'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const PA = CATEGORIES.placement_agent

describe('displayTitle', () => {
  it('cases a title that came all upper or all lower case', () => {
    expect(displayTitle('MANAGING DIRECTOR')).toBe('Managing Director')
    expect(displayTitle('head of nav lending')).toBe('Head of NAV Lending')
    expect(displayTitle('SENIOR VICE PRESIDENT, INVESTOR RELATIONS')).toBe('Senior Vice President, Investor Relations')
  })
  it('leaves a deliberately mixed title alone, tidying spaces and stray punctuation', () => {
    expect(displayTitle('Partner, Fund Advisory')).toBe('Partner, Fund Advisory')
    expect(displayTitle('  Partner ,  Fund Advisory ·')).toBe('Partner, Fund Advisory')
    expect(displayTitle('Co-Head of GP Solutions')).toBe('Co-Head of GP Solutions')
  })
  it('gives null for nothing', () => {
    expect(displayTitle('  ')).toBeNull()
    expect(displayTitle(null)).toBeNull()
  })
})

describe('seniority', () => {
  it.each([
    ['Partner', 'senior'],
    ['Managing Director', 'senior'],
    ['Senior Managing Director', 'senior'],
    ['Partner, Fund Advisory', 'senior'],
    ['Managing Partner', 'senior'],
    ['Co-Head of Private Capital Advisory', 'senior'],
    ['Founder and CEO', 'senior'],
    ['Director', 'other'],
    ['Vice President', 'other'],
    ['Senior Vice President', 'other'],
    ['Associate', 'other'],
    ['Fundraising Analyst', 'other'],
    ['Principal', 'other'],
    ['', 'other'],
  ])('%s → %s', (title, want) => {
    expect(seniority(title)).toBe(want)
  })
})

describe('visiblePractices', () => {
  it('drops practices outside the trade’s vocabulary and keeps the trade’s order', () => {
    const p = card({ category: 'placement_agent', practice_areas: ['secondaries', 'fund_formation', 'buyout_funds', 'other'] })
    expect(visiblePractices(p, PA)).toEqual(['buyout_funds', 'secondaries'])
  })
  it('uses the person’s own tags once claimed', () => {
    const p = card({ category: 'placement_agent', practice_areas: ['secondaries'], claimed_at: '2026-10-01', claimed_practice_areas: ['hedge_funds'] })
    expect(visiblePractices(p, PA)).toEqual(['hedge_funds'])
  })
})

describe('dedupePeople', () => {
  it('keeps one row per person per firm, ignoring initials and suffixes, and the richer one', () => {
    const a = card({ full_name: 'Stuart E. Baldwin', firm_domain: 'hodesweill.com', practice_areas: [] })
    const b = card({ full_name: 'Stuart Baldwin', firm_domain: 'hodesweill.com', practice_areas: ['real_estate_funds'] })
    const c = card({ full_name: 'Stuart Baldwin', firm_domain: 'other.com' })
    const out = dedupePeople([a, b, c])
    expect(out).toEqual([b, c])
  })
})

describe('firms', () => {
  it('makes a slug from the firm’s name, without asides or legal endings', () => {
    expect(firmSlug('Eaton Partners (Stifel)')).toBe('eaton-partners')
    expect(firmSlug('Moelis & Company')).toBe('moelis-company')
    expect(firmSlug('Frank, Rimerman + Co.')).toBe('frank-rimerman-co')
    expect(firmSlug('Kirkland & Ellis LLP')).toBe('kirkland-ellis')
  })
  it('counts each firm’s people, seniors, cities and practices, biggest first', () => {
    const people = [
      card({ category: 'placement_agent', firm_name: 'Evercore', firm_domain: 'evercore.com', title: 'Managing Director', offices: [{ city: 'New York', state: 'NY' }], practice_areas: ['secondaries'] }),
      card({ category: 'placement_agent', firm_name: 'Evercore', firm_domain: 'evercore.com', title: 'Director', offices: [{ city: 'Dallas', state: 'TX' }], practice_areas: ['secondaries', 'fund_formation'] }),
      card({ category: 'placement_agent', firm_name: 'Lazard', firm_domain: 'lazard.com', title: 'Director' }),
    ]
    const firms = firmsOf(people, PA)
    expect(firms.map((f) => [f.slug, f.count, f.senior])).toEqual([
      ['evercore', 2, 1],
      ['lazard', 1, 0],
    ])
    expect(firms[0].cities.map((c) => c.label)).toEqual(['Dallas', 'New York'])
    // "fund formation" is not a placement agent's practice: not counted.
    expect(firms[0].practices).toEqual([{ key: 'secondaries', label: 'Secondaries', count: 2 }])
    expect(firmsWithPages(firms).map((f) => f.slug)).toEqual(['evercore'])
    expect(FIRM_MIN).toBe(2)
    expect(peopleAtFirm(people, 'EVERCORE.com')).toHaveLength(2)
  })
  it('tells apart two firms whose names make one slug', () => {
    const people = [card({ firm_name: 'Smith Partners', firm_domain: 'smith.com' }), card({ firm_name: 'Smith Partners', firm_domain: 'smithlaw.com' })]
    expect(firmsOf(people, CATEGORIES.fund_lawyer).map((f) => f.slug).sort()).toEqual(['smith-partners-smith', 'smith-partners-smithlaw'])
  })
  it('reserves "firms", so no landing page or person can take the address', () => {
    expect(RESERVED_SLUGS.has('firms')).toBe(true)
  })
  it('gives each summary firm its directory slug', () => {
    const people = [card({ category: 'placement_agent', firm_name: 'Eaton Partners (Stifel)', firm_domain: 'stifelinstitutional.com' })]
    const s = summarize(new Map([['placement_agent', people]]))
    expect(s.firms.find((f) => f.domain === 'stifelinstitutional.com')?.slug).toBe('eaton-partners')
  })
})

describe('search', () => {
  it('measures slips, a swap counting once', () => {
    expect(editDistance('evercore', 'evercore')).toBe(0)
    expect(editDistance('evrecore', 'evercore')).toBe(1)
    expect(editDistance('bostn', 'boston')).toBe(1)
    expect(editDistance('abc', 'xyz', 1)).toBeGreaterThan(1)
  })
  it('scores whole, start, inside and near words in that order', () => {
    expect(wordScore('evercore', 'evercore')).toBe(4)
    expect(wordScore('ever', 'evercore')).toBe(3)
    expect(wordScore('core', 'evercore')).toBe(2)
    expect(wordScore('evrecore', 'evercore')).toBe(1)
    expect(wordScore('xy', 'evercore')).toBe(0)
    // Short words must be typed right: "al" is not "ali".
    expect(wordScore('ak', 'al')).toBe(0)
  })

  const rows: Row[] = [
    toRow(card({ category: 'placement_agent', slug: 'a', full_name: 'Alan Aberg', firm_name: 'Moelis & Company', firm_domain: 'moelis.com', title: 'Managing Director', practice_areas: ['secondaries'] })),
    toRow(card({ category: 'placement_agent', slug: 'b', full_name: 'Dale Addeo', firm_name: 'Evercore', firm_domain: 'evercore.com', title: 'Senior Managing Director' })),
    toRow(card({ category: 'placement_agent', slug: 'c', full_name: 'Asad Azim', firm_name: 'Monument Group', firm_domain: 'monumentgroup.com', title: 'Associate', offices: [{ city: 'Boston', state: 'MA' }] })),
    toRow(card({ category: 'placement_agent', slug: 'd', full_name: 'Zack Evers', firm_name: 'Rede Partners', firm_domain: 'rede-partners.com', title: 'Director', offices: [{ city: 'Los Angeles', state: 'CA' }] })),
  ]

  it('finds through typos, and every word must find a home', () => {
    expect(runQuery(rows, { q: 'evrecore' }).map((r) => r.s)).toEqual(['b'])
    expect(runQuery(rows, { q: 'bostn' }).map((r) => r.s)).toEqual(['c'])
    expect(runQuery(rows, { q: 'addeo evercore' }).map((r) => r.s)).toEqual(['b'])
    expect(runQuery(rows, { q: 'addeo boston' })).toEqual([])
  })
  it('ranks a name match above a firm match', () => {
    // "evers" is Zack Evers' surname, and the start of Evercore.
    expect(runQuery(rows, { q: 'evers' }).map((r) => r.s)).toEqual(['d', 'b'])
    expect(scoreQuery('evers', haystack(rows[3], rows[3].c))).toBeGreaterThan(scoreQuery('evers', haystack(rows[1], rows[1].c)))
  })
  it('filters by practice, city, firm and seniority, and sorts by surname or firm', () => {
    expect(runQuery(rows, { practice: 'secondaries' }).map((r) => r.s)).toEqual(['a'])
    expect(runQuery(rows, { city: 'boston' }).map((r) => r.s)).toEqual(['c'])
    expect(runQuery(rows, { firm: 'evercore.com' }).map((r) => r.s)).toEqual(['b'])
    expect(runQuery(rows, { level: 'senior' }).map((r) => r.s)).toEqual(['a', 'b'])
    expect(runQuery(rows, {}).map((r) => r.s)).toEqual(['a', 'b', 'c', 'd'])
    expect(runQuery(rows, { sort: 'firm' }).map((r) => r.f)).toEqual(['Evercore', 'Moelis & Company', 'Monument Group', 'Rede Partners'])
  })
  it('counts each filter’s choices given the other filters', () => {
    const cities = facetCounts(rows, { level: 'senior' }, 'city')
    expect(cities.get('new-york')).toBe(2)
    expect(cities.get('boston')).toBeUndefined()
    expect(facetCounts(rows, { city: 'boston' }, 'level').get('senior')).toBeUndefined()
  })
  it('makes rows ready to show: cased title, trade vocabulary only, seniority', () => {
    const r = toRow(card({ category: 'placement_agent', title: 'MANAGING DIRECTOR', practice_areas: ['fund_formation', 'hedge_funds'], offices: [{ city: 'New York', state: 'NY' }, { city: 'Boston', state: 'MA' }] }))
    expect(r.t).toBe('Managing Director')
    expect(r.p).toEqual(['hedge_funds'])
    expect(r.sr).toBe(true)
    expect(r.o).toBe('New York, NY')
    expect(r.om).toBe(1)
    expect(r.c).toEqual(['new-york', 'boston'])
  })
  it('sends each firm once, with its mark or initials, and whether it has a page', () => {
    const people = [card({ firm_name: 'Evercore', firm_domain: 'evercore.com' }), card({ firm_name: 'Evercore', firm_domain: 'evercore.com' }), card({ firm_name: 'Hodes Weill & Associates', firm_domain: 'hodesweill.com' })]
    const f = rowFirms(people, firmsOf(people, CATEGORIES.fund_lawyer))
    expect(Object.keys(f)).toEqual(['evercore.com', 'hodesweill.com'])
    expect(f['evercore.com'].page).toBe(true)
    expect(f['hodesweill.com'].page).toBe(false)
    expect(f['hodesweill.com'].mono).toBe('HW')
  })
})

describe('logos', () => {
  it('gives initials for a firm with no mark', () => {
    expect(monogram('Hodes Weill & Associates')).toBe('HW')
    expect(monogram('Park Madison Partners')).toBe('PM')
    expect(monogram('EY')).toBe('EY')
    expect(monogram('BDO USA')).toBe('BDO')
    expect(monogram('Davis Polk & Wardwell')).toBe('DP')
    expect(monogram('Cooley')).toBe('C')
  })
  it('finds a mark by domain, in any spelling of the domain', () => {
    expect(logoFor('evercore.com')?.src).toBe('/logos/directory/evercore.com.png')
    expect(logoFor('https://www.Evercore.com/')?.src).toBe('/logos/directory/evercore.com.png')
    expect(logoFor('nobody-here.example')).toBeNull()
  })
  it('lists a source and a date for every mark, and every file it names exists', () => {
    const firms = (manifest as { firms: Record<string, { file: string | null; source_url?: string; page?: string; fetched_at?: string; mode?: string; width?: number; height?: number; moved_to?: string; via?: string }> }).firms
    for (const [domain, e] of Object.entries(firms)) {
      expect(e.fetched_at, domain).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      if (!e.file) continue
      expect(e.source_url, domain).toMatch(/^https:\/\//)
      // From the firm's own site: the page it was read from is on the firm's own domain (or the one it forwards to).
      const host = new URL(e.page!).hostname.replace(/^www\./, '')
      // …or Wikimedia Commons, public domain, matched by the firm's own domain (scripts/directory/logos.ts).
      const commons = /Commons/.test(e.via ?? '') && /(^|\.)wikimedia\.org$/.test(host)
      expect(host.endsWith(domain) || host === e.moved_to || commons, domain).toBe(true)
      expect(['ink', 'plate', 'own']).toContain(e.mode)
      expect(e.width! > 0 && e.height! > 0, domain).toBe(true)
      expect(existsSync(join(process.cwd(), 'public', e.file)), e.file).toBe(true)
    }
  })
})
