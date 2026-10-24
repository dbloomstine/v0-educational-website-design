import { describe, expect, it } from 'vitest'
import { gzipSync } from 'node:zlib'
import { card } from './fixtures'
import { toRow, rowFirms } from '../rows'
import { decodeIndex, encodeIndex, INDEX_VERSION } from '../search-index'
import { runQuery } from '../search'
import { firmsOf } from '../firms'
import { CATEGORIES } from '../taxonomy'
import type { PersonCard } from '../people'

/** A believable 3,000-person trade: 60 firms, real-looking names, titles, cities and practices. Seeded, so stable. */
export function synthTrade(count = 3000): PersonCard[] {
  let seed = 7
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]
  const first = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Lisa', 'Matthew', 'Nancy', 'Anthony', 'Betty', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'Timothy', 'Melissa', 'Ronald', 'Deborah', 'Jason', 'Stephanie', 'Ryan', 'Rebecca', 'Jacob', 'Laura', 'Gary', 'Sharon', 'Nicholas', 'Cynthia', 'Eric', 'Kathleen', 'Jonathan', 'Amy', 'Stephen', 'Angela', 'Larry', 'Shirley', 'Justin', 'Anna']
  const last = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez']
  const firms = Array.from({ length: 60 }, (_, i) => ({ name: `${pick(last)} ${pick(['& ' + pick(last), 'Partners', 'Capital Advisors', 'LLP', 'Group'])}`, domain: `firm${i}example.com` }))
  const titles = ['Partner', 'Managing Director', 'Senior Managing Director', 'Director', 'Vice President', 'Principal', 'Associate', 'Senior Associate', 'Counsel', 'Of Counsel', 'Managing Partner', 'Head of Fund Finance', 'Senior Vice President', 'Analyst', 'Partner, Fund Advisory']
  const cities = [['New York', 'NY'], ['Boston', 'MA'], ['Chicago', 'IL'], ['San Francisco', 'CA'], ['Los Angeles', 'CA'], ['Palo Alto', 'CA'], ['Dallas', 'TX'], ['Houston', 'TX'], ['Washington', 'DC'], ['Miami', 'FL'], ['Atlanta', 'GA'], ['Charlotte', 'NC'], ['Denver', 'CO'], ['Seattle', 'WA'], ['Philadelphia', 'PA'], ['Stamford', 'CT'], ['Minneapolis', 'MN'], ['Austin', 'TX'], ['Wilmington', 'DE'], ['Irvine', 'CA']]
  const practices = CATEGORIES.fund_lawyer.practices
  const seen = new Set<string>()
  return Array.from({ length: count }, () => {
    const f = pick(firms)
    const name = `${pick(first)} ${rnd() < 0.3 ? pick('ABCDEFGHJKLMNPRSTW'.split('')) + '. ' : ''}${pick(last)}`
    let slug = `${name.toLowerCase().replace(/[^a-z]+/g, '-')}-${f.domain.slice(0, 6)}`
    while (seen.has(slug)) slug += '-2'
    seen.add(slug)
    const offices = Array.from({ length: rnd() < 0.15 ? 2 : 1 }, () => {
      const [city, state] = pick(cities)
      return { city, state }
    })
    const areas = [...new Set(Array.from({ length: Math.floor(rnd() * 4) }, () => pick(practices)))]
    return card({ category: 'fund_lawyer', slug, full_name: name, firm_name: f.name, firm_domain: f.domain, title: pick(titles), offices, practice_areas: areas, claimed_at: rnd() < 0.02 ? '2026-10-01' : null })
  })
}

describe('compact search index', () => {
  it('round-trips every row exactly', () => {
    const people = synthTrade(400)
    const rows = people.map(toRow)
    const names = new Map(people.map((p) => [p.firm_domain, p.firm_name]))
    const back = decodeIndex(JSON.parse(JSON.stringify(encodeIndex(rows))), (d) => names.get(d) ?? d)
    expect(back).toEqual(rows)
    expect(runQuery(back, { q: 'smith', city: 'new-york' })).toEqual(runQuery(rows, { q: 'smith', city: 'new-york' }))
  })

  it('drops what it cannot read, and refuses another version', () => {
    const ix = encodeIndex(synthTrade(3).map(toRow))
    ix.people.push(['x', 'Bad Firm', 99, -1, -1, 0, [], [], 0], ['short'] as never)
    expect(decodeIndex(ix, (d) => d)).toHaveLength(3)
    expect(decodeIndex({ ...ix, v: INDEX_VERSION + 1 }, (d) => d)).toEqual([])
  })

  it('keeps a 3,000-person trade under 60 KB gzipped (and says what the page itself carries)', () => {
    const people = synthTrade(3000)
    const rows = people.map(toRow)
    const ix = encodeIndex(rows)
    const json = JSON.stringify(ix)
    const gz = gzipSync(json, { level: 9 }).length
    // What the page carries instead of the list: its first fifty rows and the trade's firms, once.
    const pageProps = JSON.stringify({ items: rows.slice(0, 50), firms: rowFirms(people, firmsOf(people, CATEGORIES.fund_lawyer)) })
    const oldWay = JSON.stringify(rows)
    console.log(
      `[3,000 people] index ${(json.length / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzipped; ` +
        `page props ${(pageProps.length / 1024).toFixed(1)} KB raw, ${(gzipSync(pageProps).length / 1024).toFixed(1)} KB gzipped; ` +
        `the whole list as rows was ${(oldWay.length / 1024).toFixed(1)} KB raw, ${(gzipSync(oldWay).length / 1024).toFixed(1)} KB gzipped`,
    )
    expect(gz).toBeLessThan(60 * 1024)
    expect(gzipSync(pageProps).length).toBeLessThan(15 * 1024)
  })
})
