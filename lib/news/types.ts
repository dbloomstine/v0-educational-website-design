export interface NewsArticle {
  id: string
  title: string
  sourceUrl: string
  sourceName: string | null
  publishedDate: string | null
  articleType: string | null
  fundCategories: string[]
  isHighSignal: boolean
  relevanceScore: number | null
  tldr: string | null
  fundSizeUsd: number | null
  eventType: string | null
  firmName: string | null
  fundName: string | null
  fundStrategy: string | null
  geography: string[]
  personName: string | null
  personTitle: string | null
  firmDomain: string | null
}

export interface FacetCounts {
  categories: Record<string, number>
  types: Record<string, number>
  signalCount: number
  totalInRange: number
}

export interface ArticleFeedResponse {
  articles: NewsArticle[]
  facets: FacetCounts
  hasMore: boolean
  offset: number
  limit: number
}
