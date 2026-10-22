/**
 * A made-up board for the Monday events email's tests and `scripts/preview-events-weekly.ts --fixture`.
 * Monday 2026-10-26: this week runs to Sunday 2026-11-01, next week is 2026-11-02 to 2026-11-08.
 * The names and organizers are invented.
 */
import type { IndustryEvent } from '../types'

export const FIXTURE_TODAY = '2026-10-26'

export function ev(id: string, startDate: string, o: Partial<IndustryEvent> = {}): IndustryEvent {
  return {
    id,
    slug: `event-${id}`,
    name: `Event ${id}`,
    description: null,
    eventUrl: `https://example.org/${id}`,
    registrationUrl: null,
    organizerName: 'Example Org',
    organizerType: 'association',
    startDate,
    endDate: null,
    timeNote: null,
    city: 'New York',
    stateRegion: 'NY',
    country: 'United States',
    venue: null,
    eventFormat: 'in_person',
    eventKind: 'networking',
    costType: 'paid',
    priceNote: null,
    costVerified: false,
    fundCategories: [],
    topics: [],
    opsRelevance: 'medium',
    region: 'north_america',
    isFeatured: false,
    expectedAttendance: null,
    isSubmitted: false,
    ...o,
  }
}

const chi = { city: 'Chicago', stateRegion: 'IL' }
const tor = { city: 'Toronto', stateRegion: 'ON', country: 'Canada' }

export const FIXTURE_EVENTS: IndustryEvent[] = [
  ev('nyc-cfo', '2026-10-27', { name: 'Fund CFO Breakfast', organizerName: 'Hudson Fund Finance Forum', timeNote: '8:00-9:30 AM', opsRelevance: 'high' }),
  ev('chi-lp', '2026-10-28', { ...chi, name: 'Midwest LP Roundtable', organizerName: 'Lakeshore Institutional Forum', timeNote: '4:00 PM', costType: 'invite_only' }),
  ev('chi-ops', '2026-10-29', { ...chi, name: 'Private Credit Ops Summit', organizerName: 'Loop Credit Council', eventKind: 'summit', endDate: '2026-10-30', opsRelevance: 'high' }),
  ev('tor-tax', '2026-10-29', { ...tor, name: 'Canadian Fund Tax Day', organizerName: 'Bay Street Tax Group', costType: 'free', costVerified: true }),
  ev('bos-vc', '2026-10-30', { city: 'Boston', stateRegion: 'MA', name: 'Venture Back Office Drinks', organizerName: 'Back Bay VC Ops' }),
  ev('web', '2026-10-30', { city: null, stateRegion: null, country: null, eventFormat: 'virtual', isSubmitted: true, name: 'Fund Admin Webinar: Year-End Close', organizerName: 'Example Fund Services' }),
  ev('mex', '2026-10-28', { city: 'Mexico City', stateRegion: null, country: 'Mexico', name: 'LatAm PE Forum', organizerName: 'Reforma Capital Events' }),
  ev('ldn', '2026-10-28', { city: 'London', stateRegion: null, country: 'United Kingdom', region: 'europe', name: 'London GP Social', organizerName: 'Thames Events' }),
  ev('chi-next', '2026-11-04', { ...chi, name: 'Chicago Fund Finance Lunch', organizerName: 'Loop Credit Council' }),
  ev('dal-sum', '2026-11-05', { city: 'Dallas', stateRegion: 'TX', name: 'Texas Alternatives Summit', organizerName: 'Lone Star Allocators', eventKind: 'summit', isFeatured: true, opsRelevance: 'high', expectedAttendance: 800 }),
  ev('sf-small', '2026-11-06', { city: 'San Francisco', stateRegion: 'CA', name: 'SF GP Coffee', organizerName: 'Bay Area Emerging Managers', opsRelevance: 'low' }),
  ev('past', '2026-10-25', { name: 'Last Sunday Thing' }),
  ev('later', '2026-11-09', { name: 'The Week After Next' }),
]
