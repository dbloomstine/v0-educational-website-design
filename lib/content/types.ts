// Core content type definitions

export interface FundType {
  id: string
  name: string
  slug: string
  description: string
  color: string
  pillars: string[] // pillar slugs
}

export interface Pillar {
  id: string
  title: string
  slug: string
  description: string
  fundTypes: string[] // which fund types include this pillar
}

export interface Article {
  id: string
  title: string
  slug: string
  subtitle: string
  fundType: string // fund type slug
  pillar: string // pillar slug
  content: string // markdown content
  metaTitle: string
  metaDescription: string
  publishedDate: string
  readingTime: number // minutes
  relatedArticles?: string[] // article IDs
}

export interface Tool {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: 'active' | 'coming-soon'
}
