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
  originalCurrency: string | null
  originalAmountMillions: number | null
  storyClusterId: string | null
}

export interface ArticleGroup {
  primaryArticle: NewsArticle
  relatedArticles: NewsArticle[]
  clusterSize: number
}

export interface FacetCounts {
  categories: Record<string, number>
  types: Record<string, number>
  signalCount: number
  totalInRange: number
}

export interface ArticleFeedResponse {
  articles: NewsArticle[]
  groups: ArticleGroup[]
  facets: FacetCounts
  hasMore: boolean
  offset: number
  limit: number
}
