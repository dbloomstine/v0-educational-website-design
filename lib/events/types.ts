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
  fundCategories: string[]
  topics: string[]
  opsRelevance: string
  region: string
  isFeatured: boolean
  expectedAttendance: number | null
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
}
