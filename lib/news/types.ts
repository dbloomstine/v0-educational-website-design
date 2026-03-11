export interface StoryArticle {
  id: string
  title: string
  sourceUrl: string
  sourceName: string | null
  publishedDate: string | null
}

export interface FirmChip {
  name: string
  slug: string
  logoUrl?: string | null
}

export interface Story {
  id: string
  headline: string
  summary: string | null
  articleCount: number
  firstSeen: string
  lastUpdated: string
  gravityScore: number
  eventType: string | null
  fundCategories: string[]
  maxFundSizeUsd: number | null
  isHighSignal: boolean
  sourceNames: string[]
  firmChips: FirmChip[]
  gpNames: string[]
  articles: StoryArticle[]
}

export interface TrendingFirm {
  firmId: string
  name: string
  slug: string
  mentionCount: number
  logoUrl: string | null
}

export interface FacetCounts {
  categories: Record<string, number>
  types: Record<string, number>
  signalCount: number
  totalInRange: number
}

export interface FeedResponse {
  stories: Story[]
  unclustered: []
  trending: TrendingFirm[]
  facets: FacetCounts
  hasMore: boolean
  offset: number
  limit: number
}
