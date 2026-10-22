import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { isEventAudience, isLpAudienceEvent, lpAudienceFilter } from '../audience'
import { COLLECTION_BY_SLUG, EVENT_COLLECTIONS, TOPIC_SHORTCUTS, collectionDescription, collectionTitle, eventSeasonLabel, groupEventsByMonth } from '../collections'

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
    expect(eventSeasonLabel(new Date('2026-11-15T12:00:00Z'))).toBe('2026–27')
    expect(eventSeasonLabel(new Date('2026-12-31T12:00:00Z'))).toBe('2026–27')
    expect(eventSeasonLabel(new Date('2027-01-05T12:00:00Z'))).toBe('2027')
    expect(eventSeasonLabel(new Date('2027-09-30T12:00:00Z'))).toBe('2027')
    expect(eventSeasonLabel(new Date('2027-10-01T12:00:00Z'))).toBe('2027–28')
  })

  it('turn the season at midnight in New York, not in London', () => {
    // 1 October 2026, 2am UTC, is still 30 September in New York.
    expect(eventSeasonLabel(new Date('2026-10-01T02:00:00Z'))).toBe('2026')
    expect(eventSeasonLabel(new Date('2026-10-01T04:30:00Z'))).toBe('2026–27')
    // New Year's Eve evening in New York is already 2027 in UTC; the season stays 2026–27 until midnight Eastern.
    expect(eventSeasonLabel(new Date('2027-01-01T03:00:00Z'))).toBe('2026–27')
    expect(eventSeasonLabel(new Date('2027-01-01T05:30:00Z'))).toBe('2027')
  })

  it('have search titles within 60 characters and descriptions within 155, with the count or without', () => {
    for (const today of [new Date('2026-10-22T12:00:00Z'), new Date('2027-03-01T12:00:00Z')]) {
      for (const c of EVENT_COLLECTIONS) {
        const title = collectionTitle(c, today)
        expect(title.length, title).toBeLessThanOrEqual(60)
        expect(title, c.slug).not.toContain('{')
        for (const n of [null, 0, 1, 14, 999]) {
          const d = collectionDescription(c, n)
          expect(d.length, d).toBeLessThanOrEqual(155)
          expect(d, c.slug).not.toContain('{')
          expect(d, c.slug).not.toContain('…')
        }
      }
    }
  })

  it('put the season in every city and topic title, from the date, never a written year', () => {
    const today = new Date('2026-11-15T12:00:00Z')
    expect(collectionTitle(COLLECTION_BY_SLUG.get('chicago')!, today)).toBe('Chicago Private Equity Events & Conferences 2026–27')
    expect(collectionTitle(COLLECTION_BY_SLUG.get('cfo-ops')!, today)).toBe('Private Equity CFO & COO Conferences 2026–27 | FundOpsHQ')
    expect(collectionTitle(COLLECTION_BY_SLUG.get('compliance')!, today)).toBe('Fund Compliance Conferences & Events 2026–27 | FundOpsHQ')
    // In the spring the brand fits again.
    expect(collectionTitle(COLLECTION_BY_SLUG.get('chicago')!, new Date('2027-03-01T12:00:00Z'))).toBe('Chicago Private Equity Events & Conferences 2027 | FundOpsHQ')
    for (const c of EVENT_COLLECTIONS) {
      if (c.slug === 'webinars') continue // a webinar is weeks out; no season
      expect(c.searchTitle, c.slug).toContain('{years}')
      expect(c.searchTitle, c.slug).not.toMatch(/20\d\d/)
    }
    expect(collectionTitle(COLLECTION_BY_SLUG.get('webinars')!, today)).toBe('Private Equity & Fund Industry Webinars | FundOpsHQ')
  })

  it('count the upcoming events in the description when there are two or more', () => {
    const chicago = COLLECTION_BY_SLUG.get('chicago')!
    expect(collectionDescription(chicago, 14)).toBe('14 upcoming private equity and private markets events in Chicago: conferences, forums and networking for GPs, LPs, and fund service providers.')
    expect(collectionDescription(chicago, 1)).toMatch(/^Upcoming private equity/)
    expect(collectionDescription(chicago, null)).toMatch(/^Upcoming private equity/)
    expect(collectionDescription(COLLECTION_BY_SLUG.get('compliance')!, 9)).toMatch(/^9 upcoming private fund compliance conferences/)
  })

  it('group the list under a heading per month, in date order', () => {
    const months = groupEventsByMonth([
      { id: 'a', startDate: '2026-10-28' },
      { id: 'b', startDate: '2026-11-03' },
      { id: 'c', startDate: '2026-11-19' },
      { id: 'd', startDate: '2027-01-12' },
    ])
    expect(months.map((m) => m.label)).toEqual(['October 2026', 'November 2026', 'January 2027'])
    expect(months[1].events.map((e) => e.id)).toEqual(['b', 'c'])
    expect(groupEventsByMonth([])).toEqual([])
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
