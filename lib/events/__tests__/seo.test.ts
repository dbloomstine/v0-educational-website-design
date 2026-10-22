import { describe, it, expect } from 'vitest'
import { EVENT_TITLE_MAX, buildEventTitle, eventJsonLd, eventMetaDescription, eventOffers, eventTitleBase, longEventDates, priceAmounts } from '../seo'
import type { IndustryEvent } from '../types'

const lpgp: IndustryEvent = {
  id: '1',
  slug: '8th-annual-lpgp-connect-cfo-coo-forum-chicago',
  name: '8th Annual LPGP Connect CFO/COO Forum Chicago',
  description: 'One-day forum for CFOs, COOs, finance directors, operations, compliance and risk professionals.',
  eventUrl: 'https://example.org/cfo-forum',
  registrationUrl: null,
  organizerName: 'LPGP Connect',
  organizerType: 'conference_producer',
  startDate: '2026-10-22',
  endDate: null,
  timeNote: null,
  city: 'Chicago',
  stateRegion: 'IL',
  country: 'USA',
  venue: 'DoubleTree by Hilton Hotel Chicago - Magnificent Mile',
  eventFormat: 'in_person',
  eventKind: 'forum',
  costType: 'mixed',
  priceNote: 'Complimentary places for CFOs, COOs, CCOs, CROs and CTOs; paid passes for service providers.',
  costVerified: true,
  fundCategories: ['PE', 'credit'],
  topics: [],
  opsRelevance: 'high',
  region: 'north_america',
  isFeatured: false,
  expectedAttendance: null,
  isSubmitted: false,
}

describe('an event page title', () => {
  it('answers what people search: name, city, year, then date, venue and cost', () => {
    expect(buildEventTitle(lpgp)).toBe('8th Annual LPGP Connect CFO/COO Forum Chicago 2026: date, venue, cost')
  })
  it('adds the city and the year only when the name does not say them', () => {
    expect(eventTitleBase({ ...lpgp, name: '2026 IVCA CFO Summit' })).toBe('2026 IVCA CFO Summit, Chicago')
    expect(eventTitleBase({ ...lpgp, name: 'PLI Hedge Fund Management 2026', city: 'New York' })).toBe('PLI Hedge Fund Management 2026, New York')
    expect(eventTitleBase({ ...lpgp, name: 'NCREIF Academy: Due Diligence', city: null, eventFormat: 'virtual' })).toBe('NCREIF Academy: Due Diligence 2026')
  })
  it('promises only what the page has, and carries the brand when it fits', () => {
    expect(buildEventTitle({ ...lpgp, name: 'IVCA CFO Summit', venue: null, costVerified: false })).toBe('IVCA CFO Summit, Chicago 2026: date | FundOpsHQ')
    expect(buildEventTitle({ ...lpgp, name: 'IVCA CFO Summit', endDate: '2026-10-23', costVerified: false })).toBe('IVCA CFO Summit, Chicago 2026: dates and venue | FundOpsHQ')
  })
  it('drops parts from the end to fit, and never runs past the limit unless the name alone does', () => {
    // 53 characters before the suffix: ": date, venue, cost" (72) is too long, ": date and venue" (69) fits.
    const name = 'Private Fund Ops and Compliance Leaders'
    expect(buildEventTitle({ ...lpgp, name })).toBe(`${name}, Chicago 2026: date and venue`)
    // Longer still: the name and its city and year alone.
    const long = 'Private Fund Operations and Compliance Leaders Forum'
    expect(buildEventTitle({ ...lpgp, name: long })).toBe(`${long}, Chicago 2026`)
    const huge = 'A'.repeat(90)
    expect(buildEventTitle({ ...lpgp, name: huge })).toBe(`${huge}, Chicago 2026`)
  })
})

describe('an event page description', () => {
  it('leads with when, where and the checked cost, and fits a search result', () => {
    const d = eventMetaDescription(lpgp)
    expect(d.startsWith('October 22, 2026, DoubleTree by Hilton Hotel Chicago - Magnificent Mile, Chicago, IL. Cost: Complimentary')).toBe(true)
    expect(d.length).toBeLessThanOrEqual(160)
  })
  it('says nothing about cost it did not check', () => {
    expect(eventMetaDescription({ ...lpgp, costVerified: false, costType: 'paid' })).not.toContain('Cost')
  })
  it('writes date ranges with the year', () => {
    expect(longEventDates('2026-10-24', '2026-10-25')).toBe('October 24–25, 2026')
    expect(longEventDates('2026-09-30', '2026-10-02')).toBe('September 30 – October 2, 2026')
    expect(longEventDates('2026-12-30', '2027-01-02')).toBe('December 30, 2026 – January 2, 2027')
  })
})

describe('the structured data', () => {
  it('is a schema.org Event with status, mode, place and organizer', () => {
    const ld = eventJsonLd(lpgp)
    expect(ld).toMatchObject({
      '@type': 'Event',
      name: lpgp.name,
      startDate: '2026-10-22',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: lpgp.venue, address: { addressLocality: 'Chicago', addressRegion: 'IL' } },
      organizer: { '@type': 'Organization', name: 'LPGP Connect' },
      url: 'https://fundopshq.com/events/8th-annual-lpgp-connect-cfo-coo-forum-chicago',
    })
    expect(ld).not.toHaveProperty('endDate')
    expect(ld).not.toHaveProperty('isAccessibleForFree')
  })
  it('calls an event free only when we checked it', () => {
    const free = eventJsonLd({ ...lpgp, costType: 'free', costVerified: true })
    expect(free.isAccessibleForFree).toBe(true)
    expect(free.offers).toMatchObject({ price: 0, priceCurrency: 'USD' })
    expect(eventJsonLd({ ...lpgp, costType: 'free', costVerified: false })).not.toHaveProperty('isAccessibleForFree')
  })
  it('gives prices from a checked note, and none from a note that mixes in free places', () => {
    expect(eventOffers({ ...lpgp, priceNote: '$1,940' })).toMatchObject({ '@type': 'Offer', price: 1940 })
    expect(eventOffers({ ...lpgp, priceNote: '$1,025 member, $1,800 non-member' })).toMatchObject({ '@type': 'AggregateOffer', lowPrice: 1025, highPrice: 1800 })
    expect(eventOffers({ ...lpgp, priceNote: 'Free for IVCA members; $795 non-members' })).toEqual({ '@type': 'Offer', url: lpgp.eventUrl })
    expect(eventOffers({ ...lpgp, priceNote: '$1,940', costVerified: false })).toEqual({ '@type': 'Offer', url: lpgp.eventUrl })
  })
  it('marks a virtual event as online', () => {
    const ld = eventJsonLd({ ...lpgp, eventFormat: 'virtual', city: null })
    expect(ld.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode')
    expect(ld.location).toEqual({ '@type': 'VirtualLocation', url: lpgp.eventUrl })
  })
  it('reads dollar amounts', () => {
    expect(priceAmounts('$930 early bird, rises to $1,130 after October 1')).toEqual([930, 1130])
    expect(priceAmounts('$99.50')).toEqual([99.5])
    expect(priceAmounts(null)).toEqual([])
  })
})

describe('a title for a name with its own colon', () => {
  it('takes a comma rather than a second colon', () => {
    const acg = { ...lpgp, name: 'ACG Richmond October Breakfast: Transaction Panel', city: 'Richmond', venue: 'Lewis Ginter Botanical Garden', costVerified: false }
    expect(buildEventTitle(acg)).toBe('ACG Richmond October Breakfast: Transaction Panel 2026, date and venue')
  })
})
