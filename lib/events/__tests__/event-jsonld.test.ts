import { describe, it, expect } from 'vitest'
import {
  eventDates,
  eventJsonLd,
  eventListJsonLd,
  eventOffers,
  noteClockTimes,
  organizerUrl,
  priceAmounts,
  priceCurrency,
  splitVenue,
  utcOffset,
} from '../event-jsonld'
import type { IndustryEvent } from '../types'

const lpgp: IndustryEvent = {
  id: '1',
  slug: '8th-annual-lpgp-connect-cfo-coo-forum-chicago',
  name: '8th Annual LPGP Connect CFO/COO Forum Chicago',
  description: 'One-day forum for CFOs, COOs, finance directors, operations, compliance and risk professionals.',
  eventUrl: 'https://www.lpgpconnect.com/cfo-forum',
  registrationUrl: null,
  organizerName: 'LPGP Connect',
  organizerType: 'conference_producer',
  startDate: '2026-10-22',
  endDate: null,
  timeNote: '8:30AM-4:30PM CT',
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
  status: 'published',
}

describe('the time and its zone', () => {
  it('reads the clock times a note states, through its compact form', () => {
    expect(noteClockTimes('8:30AM-4:30PM CT')).toEqual({ start: { h: 8, m: 30 }, end: { h: 16, m: 30 }, zone: 'CT' })
    expect(noteClockTimes('5:00-8:00 PM ET in person; 5:30-7:00 PM ET by Zoom')).toEqual({ start: { h: 17, m: 0 }, end: { h: 20, m: 0 }, zone: 'ET' })
    expect(noteClockTimes('11:30-1:00 PM ET')).toEqual({ start: { h: 11, m: 30 }, end: { h: 13, m: 0 }, zone: 'ET' })
    expect(noteClockTimes('Begins 12:30 PM ET')).toEqual({ start: { h: 12, m: 30 }, end: null, zone: 'ET' })
    expect(noteClockTimes('12h00 ET')).toEqual({ start: { h: 12, m: 0 }, end: null, zone: 'ET' })
    expect(noteClockTimes('8:30 AM-4:30 PM')).toEqual({ start: { h: 8, m: 30 }, end: { h: 16, m: 30 }, zone: null })
    expect(noteClockTimes('All day')).toBeNull()
    expect(noteClockTimes(null)).toBeNull()
  })

  it('gives the offset for that date, either side of the end of daylight saving (Sunday, November 1, 2026)', () => {
    expect(utcOffset('America/Chicago', '2026-10-31', 9, 0)).toBe('-05:00')
    expect(utcOffset('America/Chicago', '2026-11-02', 9, 0)).toBe('-06:00')
    expect(utcOffset('America/New_York', '2026-11-01', 9, 0)).toBe('-05:00') // the morning after the change
    expect(utcOffset('America/New_York', '2026-03-09', 9, 0)).toBe('-04:00') // the day after it starts (March 8)
    expect(utcOffset('America/New_York', '2026-03-07', 9, 0)).toBe('-05:00')
    expect(utcOffset('America/Phoenix', '2026-07-01', 9, 0)).toBe('-07:00')
    expect(utcOffset('Europe/London', '2026-10-24', 9, 0)).toBe('+01:00')
    expect(utcOffset('Europe/London', '2026-10-26', 9, 0)).toBe('+00:00')
  })

  it('a one-day event with a stated range: start and end times with the zone’s offset', () => {
    expect(eventDates(lpgp)).toEqual({ startDate: '2026-10-22T08:30:00-05:00', endDate: '2026-10-22T16:30:00-05:00' })
    // The same note a fortnight later, after the clocks change.
    expect(eventDates({ ...lpgp, startDate: '2026-11-05' })).toEqual({ startDate: '2026-11-05T08:30:00-06:00', endDate: '2026-11-05T16:30:00-06:00' })
  })

  it('reads "EST" as Eastern time on that date, and Mountain time in Arizona as Phoenix', () => {
    expect(eventDates({ ...lpgp, timeNote: '6:00 PM EST', startDate: '2026-07-15' }).startDate).toBe('2026-07-15T18:00:00-04:00')
    expect(eventDates({ ...lpgp, timeNote: '9:00 AM MT', stateRegion: 'AZ', startDate: '2026-07-15' }).startDate).toBe('2026-07-15T09:00:00-07:00')
    expect(eventDates({ ...lpgp, timeNote: '9:00 AM MT', stateRegion: 'CO', startDate: '2026-07-15' }).startDate).toBe('2026-07-15T09:00:00-06:00')
  })

  it('a multi-day event: the start time on its first day, its last day as a date', () => {
    expect(eventDates({ ...lpgp, endDate: '2026-10-23' })).toEqual({ startDate: '2026-10-22T08:30:00-05:00', endDate: '2026-10-23' })
  })

  it('a single time: the start time, and the day as the end', () => {
    expect(eventDates({ ...lpgp, timeNote: 'Begins 12:30 PM ET', stateRegion: 'NY' })).toEqual({ startDate: '2026-10-22T12:30:00-04:00', endDate: '2026-10-22' })
  })

  it('no zone named: the local time with no offset (Google reads it in the place’s zone); never a guessed offset', () => {
    expect(eventDates({ ...lpgp, timeNote: '8:30 AM-4:30 PM' })).toEqual({ startDate: '2026-10-22T08:30:00', endDate: '2026-10-22T16:30:00' })
    // Online, with no zone and no place: the date alone.
    expect(eventDates({ ...lpgp, timeNote: '1:00 PM', eventFormat: 'virtual' })).toEqual({ startDate: '2026-10-22', endDate: '2026-10-22' })
  })

  it('no stated time, or a zone we cannot place: the dates alone (a one-day event repeats its date)', () => {
    expect(eventDates({ ...lpgp, timeNote: null })).toEqual({ startDate: '2026-10-22', endDate: '2026-10-22' })
    expect(eventDates({ ...lpgp, timeNote: null, endDate: '2026-10-24' })).toEqual({ startDate: '2026-10-22', endDate: '2026-10-24' })
    expect(eventDates({ ...lpgp, timeNote: '9:00 AM GMT' })).toEqual({ startDate: '2026-10-22', endDate: '2026-10-22' })
  })
})

describe('the price', () => {
  it('free, only when we checked it: price 0', () => {
    const free = eventJsonLd({ ...lpgp, costType: 'free', costVerified: true, priceNote: null })
    expect(free.isAccessibleForFree).toBe(true)
    expect(free.offers).toEqual({ '@type': 'Offer', url: lpgp.eventUrl, price: 0, priceCurrency: 'USD' })
    const unchecked = eventJsonLd({ ...lpgp, costType: 'free', costVerified: false })
    expect(unchecked).not.toHaveProperty('isAccessibleForFree')
    expect(unchecked).not.toHaveProperty('offers')
  })

  it('paid: the figures in a checked note, in the currency the note or the country says', () => {
    expect(eventOffers({ ...lpgp, priceNote: '$1,940' })).toEqual({ '@type': 'Offer', url: lpgp.eventUrl, price: 1940, priceCurrency: 'USD' })
    expect(eventOffers({ ...lpgp, priceNote: '$1,025 member, $1,800 non-member', registrationUrl: 'https://reg.example/x' })).toEqual({
      '@type': 'AggregateOffer',
      url: 'https://reg.example/x',
      lowPrice: 1025,
      highPrice: 1800,
      priceCurrency: 'USD',
    })
    expect(eventOffers({ ...lpgp, priceNote: '$495', country: 'Canada', stateRegion: 'ON' })).toMatchObject({ price: 495, priceCurrency: 'CAD' })
    expect(priceCurrency('US$495', 'Canada')).toBe('USD')
    expect(priceCurrency('$495', 'United Kingdom')).toBeNull()
  })

  it('unknown: no offer at all (no price checked, a note mixing in free places, or no currency to say)', () => {
    expect(eventOffers({ ...lpgp, priceNote: '$1,940', costVerified: false })).toBeNull()
    expect(eventOffers({ ...lpgp, priceNote: 'Free for IVCA members; $795 non-members' })).toBeNull()
    expect(eventOffers({ ...lpgp, costType: 'paid', priceNote: null })).toBeNull()
    expect(eventOffers({ ...lpgp, priceNote: '$495', country: 'United Kingdom' })).toBeNull()
    expect(eventOffers(lpgp)).toBeNull()
  })

  it('no offer from a price with a deadline: the note does not say which figure is current', () => {
    expect(eventOffers({ ...lpgp, priceNote: '$930 early bird, rises to $1,130 after October 1' })).toBeNull()
    expect(eventOffers({ ...lpgp, priceNote: '$500 until Sep 30; $650 thereafter' })).toBeNull()
    expect(eventOffers({ ...lpgp, priceNote: 'Early-bird $400; standard $550' })).toBeNull()
  })

  it('never says registration is open', () => {
    expect(eventOffers({ ...lpgp, costType: 'free' })).not.toHaveProperty('availability')
    expect(eventOffers({ ...lpgp, priceNote: '$1,940' })).not.toHaveProperty('availability')
  })

  it('reads dollar amounts', () => {
    expect(priceAmounts('$930 early bird, rises to $1,130 after October 1')).toEqual([930, 1130])
    expect(priceAmounts('$99.50')).toEqual([99.5])
    expect(priceAmounts(null)).toEqual([])
  })
})

describe('the place', () => {
  it('in person: a Place with its postal address', () => {
    const ld = eventJsonLd(lpgp)
    expect(ld.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
    expect(ld.location).toEqual({
      '@type': 'Place',
      name: lpgp.venue,
      address: { '@type': 'PostalAddress', addressLocality: 'Chicago', addressRegion: 'IL', addressCountry: 'US' },
    })
  })

  it('a venue line carrying a street address gives the street', () => {
    expect(splitVenue('Convene, 117 West 46th Street')).toEqual({ name: 'Convene', street: '117 West 46th Street' })
    expect(splitVenue('200 E Randolph St')).toEqual({ name: '200 E Randolph St', street: '200 E Randolph St' })
    expect(splitVenue('1 Hotel Brooklyn Bridge')).toEqual({ name: '1 Hotel Brooklyn Bridge', street: null })
    expect(splitVenue(null)).toEqual({ name: null, street: null })
    const ld = eventJsonLd({ ...lpgp, venue: 'Convene, 117 West 46th Street', city: 'New York', stateRegion: 'NY' })
    expect(ld.location).toMatchObject({ name: 'Convene', address: { streetAddress: '117 West 46th Street', addressLocality: 'New York' } })
  })

  it('no venue: the city names the place', () => {
    expect(eventJsonLd({ ...lpgp, venue: null }).location).toMatchObject({ '@type': 'Place', name: 'Chicago' })
  })

  it('virtual: a VirtualLocation', () => {
    const ld = eventJsonLd({ ...lpgp, eventFormat: 'virtual', city: null })
    expect(ld.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode')
    expect(ld.location).toEqual({ '@type': 'VirtualLocation', url: lpgp.eventUrl })
  })

  it('hybrid: both the Place and the VirtualLocation', () => {
    const ld = eventJsonLd({ ...lpgp, eventFormat: 'hybrid' })
    expect(ld.eventAttendanceMode).toBe('https://schema.org/MixedEventAttendanceMode')
    expect(ld.location).toEqual([
      expect.objectContaining({ '@type': 'Place', name: lpgp.venue }),
      { '@type': 'VirtualLocation', url: lpgp.eventUrl },
    ])
  })
})

describe('the organizer', () => {
  it('links the organizer’s site when the event page is plainly on it', () => {
    expect(organizerUrl(lpgp)).toBe('https://lpgpconnect.com')
    expect(organizerUrl({ eventUrl: 'https://www.peievents.com/en/event/cfo-forum/', organizerName: 'PEI' })).toBe('https://peievents.com')
    expect(organizerUrl({ eventUrl: 'https://www.lowenstein.com/events/venturecrush', organizerName: 'Lowenstein Sandler' })).toBe('https://lowenstein.com')
    expect(organizerUrl({ eventUrl: 'https://ilpa.org/event/summit', organizerName: 'Institutional Limited Partners Association' })).toBe('https://ilpa.org')
    expect(organizerUrl({ eventUrl: 'https://www.acg.org/chicago/events/x', organizerName: 'ACG Chicago' })).toBe('https://acg.org')
    expect(organizerUrl({ eventUrl: 'https://events.bvca.co.uk/x', organizerName: 'BVCA' })).toBe('https://bvca.co.uk')
  })

  it('no link when the page is on a ticketing site, a generic domain or someone else’s', () => {
    expect(organizerUrl({ eventUrl: 'https://www.eventbrite.com/e/123', organizerName: 'ACG Chicago' })).toBeNull()
    expect(organizerUrl({ eventUrl: 'https://events.com/x', organizerName: 'Fund Ops Events' })).toBeNull()
    expect(organizerUrl({ eventUrl: 'https://www.kirkland.com/events/x', organizerName: 'IVCA' })).toBeNull()
    expect(organizerUrl({ eventUrl: 'not a url', organizerName: 'IVCA' })).toBeNull()
    expect(eventJsonLd({ ...lpgp, eventUrl: 'https://www.eventbrite.com/e/123' }).organizer).toEqual({ '@type': 'Organization', name: 'LPGP Connect' })
  })
})

describe('the Event', () => {
  it('carries what Google asks for, from the row', () => {
    expect(eventJsonLd(lpgp)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: lpgp.name,
      startDate: '2026-10-22T08:30:00-05:00',
      endDate: '2026-10-22T16:30:00-05:00',
      description: lpgp.description,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: expect.objectContaining({ '@type': 'Place' }),
      image: ['https://fundopshq.com/opengraph-image'],
      organizer: { '@type': 'Organization', name: 'LPGP Connect', url: 'https://lpgpconnect.com' },
      url: 'https://fundopshq.com/events/8th-annual-lpgp-connect-cfo-coo-forum-chicago',
    })
  })

  it('a cancelled event says so', () => {
    expect(eventJsonLd({ ...lpgp, status: 'cancelled' }).eventStatus).toBe('https://schema.org/EventCancelled')
    expect(eventJsonLd({ ...lpgp, status: 'archived' }).eventStatus).toBe('https://schema.org/EventScheduled')
    expect(eventJsonLd({ ...lpgp, status: undefined }).eventStatus).toBe('https://schema.org/EventScheduled')
  })

  it('a list page: each Event in full, pointing to its own page on FundOpsHQ', () => {
    const list = eventListJsonLd('Chicago events', 'https://fundopshq.com/events/chicago', [lpgp, { ...lpgp, slug: 'other', name: 'Other' }])
    expect(list).toMatchObject({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Chicago events', url: 'https://fundopshq.com/events/chicago' })
    expect(list.itemListElement).toHaveLength(2)
    expect(list.itemListElement[1]).toMatchObject({ '@type': 'ListItem', position: 2, item: { '@type': 'Event', name: 'Other', url: 'https://fundopshq.com/events/other' } })
    expect(list.itemListElement[0].item).not.toHaveProperty('@context')
  })
})
