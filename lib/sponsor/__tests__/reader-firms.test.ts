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

describe('what the sponsor page sells', () => {
  const page = readFileSync(join(__dirname, '..', '..', '..', 'app', 'sponsor', 'page.tsx'), 'utf8')
  it('is one sponsor at a time, in the email and on the site', () => {
    // Until 2026-10-02 the page promised a slate "shared with at most four
    // other sponsors" while the product had become one sponsor, everywhere.
    expect(page).toContain('One sponsor at a time')
    expect(page).not.toMatch(/four other sponsors|shared with/i)
    expect(page).toMatch(/On the site, above the stories on every page/)
  })
  it('reads whether the space is open from the bookings, and shows the placements with the real components', () => {
    expect(page).toContain('getSiteSponsorState')
    // Since 2026-10-09 the placements are drawn in the builder, with what the prospect types.
    const builder = readFileSync(join(__dirname, '..', '..', '..', 'components', 'sponsor', 'SponsorBuilder.tsx'), 'utf8')
    expect(page).toContain('<SponsorBuilder openWeeks={openWeeks}')
    expect(builder).toContain('<SponsorStripView sponsor={draft}')
    expect(builder).toContain('<SponsorCardView sponsor={draft}')
  })
})

describe('the house ad', () => {
  it('counts its audience instead of stating it', () => {
    // The same rule as the sponsor page, for the "Your firm here" slot that
    // runs on news pages: the number of firms is read from the subscriber
    // list (getSponsorAudience), never typed into the component.
    const slot = readFileSync(join(__dirname, '..', '..', '..', 'components', 'sponsor', 'SponsorSlot.tsx'), 'utf8')
    expect(slot).toContain('getSponsorAudience')
    expect(slot).not.toMatch(/\b\d{2,5}\s+(firms|readers|subscribers)\b/i)
  })
})
