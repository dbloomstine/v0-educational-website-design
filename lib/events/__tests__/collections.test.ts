import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { isEventAudience, isLpAudienceEvent, lpAudienceFilter } from '../audience'
import { COLLECTION_BY_SLUG, EVENT_COLLECTIONS, TOPIC_SHORTCUTS, collectionTitle, eventSeasonLabel } from '../collections'

describe('the LP audience', () => {
  // Real names from the board, 2026-10-22.
  it.each([
    ['ILPA Summit New York 2026', 'Institutional Limited Partners Association'],
    ['PREA Spring Conference 2027', 'PREA'],
    ['LP/GP Lunch with Stifel Bank', 'Stifel Venture Banking'],
    ['2027 ACG NY Family Office & Limited Partner Series - Winter Edition', 'ACG (Association for Corporate Growth)'],
    ['12th Annual Pennsylvania Institutional Forum', 'Markets Group'],
    ['2027 Endowments & Foundations Roundtable West', 'Institutional Investor'],
    ['Senior Delegates’ Roundtable', 'Institutional Investor'],
    ['PREA 37th Annual Institutional Investor Conference', 'Pension Real Estate Association (PREA)'],
    ['Boston Family Office & High Net Worth Conference 2026', 'DC Finance'],
    ['PEWIN New York | Allocation Reset: How CIOs Are Recalibrating Their Private Portfolios', 'PEWIN'],
  ])('takes %s', (name, organizerName) => {
    expect(isLpAudienceEvent({ name, organizerName })).toBe(true)
  })

  it.each([
    ['8th Annual LPGP Connect CFO/COO Forum Chicago', 'LPGP Connect'], // a GP CFO forum despite the brand
    ['SuperReturn North America 2027', 'Informa Connect (SuperReturn)'],
    ['McGuireWoods Emerging Manager Conference 2027: Buyouts', 'McGuireWoods'],
    ['Fund Finance Association Help Desk Workshop', 'FFA'], // "Help" is not "LP"
    ['Private Funds CFO Forum', 'PEI'], // CFO is not CIO
  ])('leaves %s', (name, organizerName) => {
    expect(isLpAudienceEvent({ name, organizerName })).toBe(false)
  })

  it('is one PostgREST or-filter with no characters that would break it', () => {
    const f = lpAudienceFilter()
    expect(f).toMatch(/^name\.imatch\./)
    expect(f).toContain('organizer_name.imatch.\\mILPA\\M')
    expect(f).not.toMatch(/[()]/)
    // One comma between each clause and none inside one.
    expect(f.split(',').every((c) => /^(name|organizer_name)\.imatch\.[^,]+$/.test(c))).toBe(true)
  })

  it('knows only the audiences it can filter', () => {
    expect(isEventAudience('lp')).toBe(true)
    expect(isEventAudience('gp')).toBe(false)
    expect(isEventAudience(null)).toBe(false)
  })
})

describe('topic pages', () => {
  it('name the season people search: the year, and the next from October', () => {
    expect(eventSeasonLabel(new Date('2026-10-22T12:00:00Z'))).toBe('2026–27')
    expect(eventSeasonLabel(new Date('2026-12-31T12:00:00Z'))).toBe('2026–27')
    expect(eventSeasonLabel(new Date('2027-01-05T12:00:00Z'))).toBe('2027')
    expect(eventSeasonLabel(new Date('2027-09-30T12:00:00Z'))).toBe('2027')
  })

  it('have search titles within 60 characters and descriptions within 160', () => {
    const today = new Date('2026-10-22T12:00:00Z')
    for (const slug of ['compliance', 'fund-finance', 'lps']) {
      const c = COLLECTION_BY_SLUG.get(slug)!
      expect(c, slug).toBeDefined()
      const title = collectionTitle(c, today)
      expect(title).toMatch(/2026–27 \| FundOpsHQ$/)
      expect(title.length, title).toBeLessThanOrEqual(60)
      expect(c.description!.length, slug).toBeLessThanOrEqual(160)
    }
    expect(collectionTitle(COLLECTION_BY_SLUG.get('compliance')!, today)).toBe('Fund Compliance Conferences & Events 2026–27 | FundOpsHQ')
    // A page without its own search title keeps the old form.
    expect(collectionTitle(COLLECTION_BY_SLUG.get('webinars')!, today)).toBe('Fund Industry Webinars | FundOpsHQ')
  })

  it('/events/lps reads the LP audience and is a /events chip', () => {
    expect(COLLECTION_BY_SLUG.get('lps')?.filter).toEqual({ audience: 'lp' })
    expect(TOPIC_SHORTCUTS.map((t) => t.slug)).toEqual(expect.arrayContaining(['cfo-ops', 'compliance', 'fund-finance', 'lps']))
  })

  it('are all reserved in the loader, so no event slug can take one', () => {
    const loader = readFileSync(join(__dirname, '../../../scripts/events/load-events.mjs'), 'utf8')
    const block = loader.slice(loader.indexOf('const RESERVED_SLUGS'), loader.indexOf('])', loader.indexOf('const RESERVED_SLUGS')))
    for (const c of EVENT_COLLECTIONS) expect(block, c.slug).toContain(`'${c.slug}'`)
  })
})
