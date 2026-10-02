import { describe, it, expect } from 'vitest'
import { anyOfPatterns, firmLookup, ilike, isFirmInStory, isFirmName, lookupFilter, searchPatterns, startsAWord, type FirmLookup } from '../firm-lookup'
import { firmHref, firmSlug } from '../league'

const lookupFor = (key: string) => firmLookup(key) as FirmLookup
/** The expression the database is given, run here: the same syntax means the same thing in both. */
const exact = (key: string, value: string) => new RegExp(lookupFor(key).exact, 'i').test(value)
const loose = (key: string, value: string) => { const p = lookupFor(key).loose; return p !== null && ilike(p, value) }

/** Does the page made from `linked` find a report that wrote the firm as `written`? */
const finds = (linked: string, written: string) => {
  const key = firmSlug(linked).replace(/-/g, ' ')
  return exact(key, written) && isFirmName(written, key)
}

describe('a firm’s page finds the firm', () => {
  // Every name here was a directory link to a 404, or a page missing most of
  // its reports, until 2026-10-02: the key welds initials together and the
  // lookup searched for them side by side.
  it.each([
    'A&O Shearman', 'A&M Capital', 'L&G', 'H&F', 'M&G', 'M&G Investments', 'M & G plc', 'H.I.G. Capital', 'H.I.G.', 'H.I.G. Growth Partners',
    'J.P. Morgan', 'J.P. Morgan Asset Management', 'J. P. Morgan', 'D.E. Shaw', 'A.P. Moller Capital', 'J.F. Lehman & Company',
    'N.Y. State Common Retirement Fund', 'N.J. Pension Fund', 'D.C. Pension', 'U.S. Securities and Exchange Commission',
    'L+M Companies', '5(c) Capital', 'M&G Catalyst', 'N.Y. Common', 'MS+PARTNERS', 'BF.capital', 'Capital-A', 'CD&R', 'IQ-EQ', 'B Capital', 'Hg',
  ])('%s', (name) => {
    expect(firmHref(name)).not.toBeNull()
    expect(finds(name, name)).toBe(true)
  })

  it.each([
    'Ares Management', 'KKR', 'Kirkland & Ellis', 'Blue Owl Capital', '3i Group', 'Partners Group', 'Goldman Sachs Asset Management',
    'I Squared Capital', 'L Catterton', 'T. Rowe Price', "Moody's", 'Moody’s', 'BlackRock', 'KKR & Co. Inc.', 'Apollo Global Management, Inc.',
  ])('and still finds an ordinary name: %s', (name) => {
    expect(finds(name, name)).toBe(true)
  })

  it.each(['Värde Partners', 'Mérieux Equity Partners', 'Santé Ventures', 'Altérra', 'Deutsche Börse', 'Crédit Agricole', 'Vitamin°C'])(
    'and falls back to the letters in order for a name with an accent in it: %s',
    (name) => {
      const key = firmSlug(name).replace(/-/g, ' ')
      expect(exact(key, name)).toBe(false)
      expect(loose(key, name)).toBe(true)
      expect(isFirmName(name, key)).toBe(true)
    },
  )

  it('whichever way the link was written', () => {
    // One page, both spellings: the report that wrote "HIG" and the one that wrote "H.I.G.".
    expect(firmSlug('HIG Capital')).toBe(firmSlug('H.I.G. Capital'))
    expect(finds('HIG Capital', 'H.I.G. Capital')).toBe(true)
    expect(finds('H.I.G. Capital', 'HIG Capital')).toBe(true)
    expect(finds('JP Morgan', 'J.P. Morgan Asset Management')).toBe(true)
    expect(finds('M&G', 'M & G plc')).toBe(true)
  })
})

describe('what is asked of the database', () => {
  it('is whole words: Ares is not Antares, Man Group is not every "Management"', () => {
    expect(exact('ares', 'Ares Management')).toBe(true)
    expect(exact('ares', 'Antares Capital')).toBe(false)
    expect(exact('man', 'Man Group')).toBe(true)
    expect(exact('man', 'Apollo Global Management')).toBe(false)
    expect(exact('one', 'One Equity Partners')).toBe(true)
    expect(exact('one', 'Blackstone')).toBe(false)
  })
  it('reads a short word as initials too, and nothing longer', () => {
    for (const hit of ['M&G', 'M & G plc', 'MG Partners', 'M&G Investments', 'M.G.', 'Prudential (M&G)', 'M and G']) expect(exact('mg', hit), hit).toBe(true)
    // "%mg%" would be Omega and Magnetar.
    for (const miss of ['Omega Funds', 'Magnetar Capital', 'MGX', 'AMG', 'Morgan Group']) expect(exact('mg', miss), miss).toBe(false)
    expect(exact('hig', 'H.I.G. Capital')).toBe(true)
    expect(exact('hig', 'Highland Capital')).toBe(false)
    expect(exact('blackstone', 'B.L.A.C.K.S.T.O.N.E')).toBe(false)
  })
  it('finds the firm in a headline, possessive or not', () => {
    for (const hit of ['KKR closes fund', 'KKR’s new fund', "KKR's new fund", 'Ex-KKR partner launches firm', 'Blackstone, KKR in talks', 'Fund backed by KKR']) expect(exact('kkr', hit), hit).toBe(true)
    for (const miss of ['KKRX raises', 'Bookkeeper wanted']) expect(exact('kkr', miss), miss).toBe(false)
  })
  it('writes its word edges out, so the index can serve it', () => {
    // An open-ended "not a letter or digit" read every row of the year; and one
    // character from outside ASCII inside the class does the same.
    for (const key of ['ares', 'mg', 'b', 'kkr', 'ao shearman', 'ny state common retirement']) {
      const { exact: re } = lookupFor(key)
      expect(re).not.toMatch(/\[\^/)
      expect(re).not.toMatch(/["\\]/)
      for (const cls of re.match(/\[[^\]]*\]/g) ?? []) expect(cls).toMatch(/^[\x20-\x7e]+$/)
      expect(() => new RegExp(re, 'i')).not.toThrow()
    }
  })
  it('offers the loose pattern only where it can be served', () => {
    expect(lookupFor('blackstone').loose).toBe('%blackstone%')
    expect(lookupFor('ao shearman').loose).toBe('%ao%shearman%')
    for (const key of ['mg', 'b', '5c', 'cd r', 'iq eq']) expect(lookupFor(key).loose).toBeNull()
    expect(firmLookup('')).toBeNull()
  })
  it('is written as a quoted filter, loose only when asked', () => {
    const lookup = lookupFor('ares')
    expect(lookupFilter('title', lookup)).toBe(`title.imatch."${lookup.exact}"`)
    expect(lookupFilter('title', lookup, { loose: true })).toBe(`title.imatch."${lookup.exact}",title.ilike."%ares%"`)
    expect(lookupFilter('title', lookupFor('mg'), { loose: true })).not.toContain('ilike')
    expect(anyOfPatterns('title', ['%h.i.g%', '%5(c%'])).toBe('title.ilike."%h.i.g%",title.ilike."%5(c%"')
  })
})

describe('who counts as the firm', () => {
  it('is decided by the key, not by the pattern that fetched the row', () => {
    expect(isFirmName('Antares Capital', 'ares')).toBe(false)
    expect(isFirmName('Ares Management', 'ares')).toBe(true)
    expect(isFirmName('Ares Capital Corporation', 'ares')).toBe(true)
    expect(isFirmName('Smith I Growth Fund', 'hig')).toBe(false)
    expect(isFirmName('LG Group', 'mg')).toBe(false)
  })
  it('takes initials only when the headline itself uses them', () => {
    const cip = 'Copenhagen Infrastructure Partners'
    expect(isFirmInStory(cip, 'cip', 'CIP closes fifth flagship fund at €12bn')).toBe(true)
    expect(isFirmInStory(cip, 'cip', 'Copenhagen Infrastructure Partners names new principal')).toBe(false)
    // Another firm with the same initials, in a headline that happens to contain the letters.
    expect(isFirmInStory('Capital Investment Partners', 'cip', 'Capital Investment Partners backs recipe-box startup')).toBe(false)
  })
  it('never takes two-letter initials: Ares Management is not A&M', () => {
    expect(isFirmInStory('Ares Management', 'am', 'Ares raises $4.2bn for AM strategy')).toBe(false)
    expect(isFirmInStory('Apollo Management', 'am', 'Apollo AM hires')).toBe(false)
    expect(isFirmInStory('Macquarie Group', 'mg', 'MG closes fund')).toBe(false)
    expect(isFirmInStory('A&M Capital', 'am', 'A&M Capital closes fund')).toBe(true)
  })
})

describe('searching the directory', () => {
  it('tries a short query as initials too', () => {
    expect(searchPatterns('hig')).toEqual(expect.arrayContaining(['%hig%', '%h.i.g%']))
    expect(searchPatterns('mg')).toEqual(expect.arrayContaining(['%mg%', '%m&g%']))
    expect(searchPatterns('blackstone')).toEqual(['%blackstone%'])
    expect(searchPatterns('hamilton lane')).toEqual(['%hamilton lane%'])
    expect(searchPatterns('100%_"')).toEqual(['%100%'])
    expect(searchPatterns('  ')).toEqual([])
  })
  it('counts welded initials as a word the query can start', () => {
    expect(startsAWord('H.I.G. Capital', 'hig')).toBe(true)
    expect(startsAWord('Highland Capital', 'hig')).toBe(true)
    expect(startsAWord('M&G Investments', 'mg')).toBe(true)
    expect(startsAWord('Antares Capital', 'ares')).toBe(false)
  })
})
