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
  shortDescription: string
  fullDescription?: string
  inputs: string[]
  outputs: string[]
  categories: ToolCategory[]
  personas: ToolPersona[]
  complexity: ToolComplexity
  status: 'active' | 'coming-soon'
  icon?: string
}

export type ToolCategory =
  | 'Fund Formation'
  | 'Pricing and Costs'
  | 'Fund Economics'
  | 'Operations and Compliance'
  | 'Investor Relations'

export type ToolPersona =
  | 'GP'
  | 'CFO or Controller'
  | 'COO or Operations'
  | 'Investor Relations'
  | 'Compliance'
  | 'Lawyer'
  | 'LP'

export type ToolComplexity =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
