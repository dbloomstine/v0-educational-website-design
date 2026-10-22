export interface IndustryEvent {
  id: string
  slug: string
  name: string
  description: string | null
  eventUrl: string
  registrationUrl: string | null
  organizerName: string
  organizerType: string
  startDate: string
  endDate: string | null
  timeNote: string | null
  city: string | null
  stateRegion: string | null
  country: string | null
  venue: string | null
  eventFormat: string
  eventKind: string
  costType: string
  priceNote: string | null
  /**
   * We saw the cost ourselves on the organizer's registration page (2026-10-15). "Free" is shown only when
   * this is true, and so is the price note: the scout had called a $2,500 law-firm conference free from its
   * event page alone. See costLabel / costDetail in ./constants.
   */
  costVerified: boolean
  fundCategories: string[]
  topics: string[]
  opsRelevance: string
  region: string
  isFeatured: boolean
  expectedAttendance: number | null
  /** The organizer sent it in through /events/submit. The daily email always shows it on its day. */
  isSubmitted: boolean
}

export interface EventFacetCounts {
  kinds: Record<string, number>
  formats: Record<string, number>
  costs: Record<string, number>
  regions: Record<string, number>
  categories: Record<string, number>
  topics: Record<string, number>
  cities: Record<string, number>
  opsHighCount: number
  totalUpcoming: number
}

export interface EventFeedResponse {
  events: IndustryEvent[]
  facets: EventFacetCounts
  hasMore: boolean
  offset: number
  limit: number
  /** How many events match the filters in all (null when the database did not say). */
  total?: number | null
}
