import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { currentReaderFirms, domainBelongsTo, isPersonalDomain, READER_FIRMS } from '../reader-firms'

describe('reader firms', () => {
  it('names a firm only while a subscriber is on its domain', () => {
    const groups = currentReaderFirms(['kirkland.com', 'us.dlapiper.com', 'maybern.com', 'gmail.com'])
    const named = groups.flatMap((g) => g.firms)
    expect(named).toEqual(expect.arrayContaining(['Kirkland & Ellis', 'DLA Piper', 'Maybern']))
    // On the list, but nobody there reads it today: not shown.
    expect(named).not.toContain('JPMorgan')
    expect(named).not.toContain('TPG')
    expect(currentReaderFirms([])).toEqual([])
  })

  it('matches subdomains but not look-alike domains', () => {
    expect(domainBelongsTo('us.dlapiper.com', ['dlapiper.com'])).toBe(true)
    expect(domainBelongsTo('notdlapiper.com', ['dlapiper.com'])).toBe(false)
  })

  it('never names the editor’s employer, and treats webmail as personal', () => {
    expect(READER_FIRMS.some((f) => f.domains.some((d) => d.includes('iqeq')))).toBe(false)
    expect(isPersonalDomain('gmail.com')).toBe(true)
    expect(isPersonalDomain('kirkland.com')).toBe(false)
  })
})

describe('sponsor page', () => {
  it('prints no hand-typed audience numbers', () => {
    // The page once said "98 confirmed readers" for weeks after the list
    // passed 140. Figures must come from getSponsorStats(), not from the file.
    const page = readFileSync(join(__dirname, '..', '..', '..', 'app', 'sponsor', 'page.tsx'), 'utf8')
    expect(page).toContain('getSponsorStats')
    expect(page).not.toMatch(/\b\d{2,5}\s+(confirmed\s+)?(readers|subscribers)\b/i)
    expect(page).not.toMatch(/kpi:\s*'\d/)
    expect(page).not.toMatch(/\d+%\s*(open|click)/i)
  })
})
