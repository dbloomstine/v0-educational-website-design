/**
 * JSON-LD Schema generators for SEO
 */

import { SITE_CONFIG } from './metadata'

/**
 * Default author information
 */
export const DEFAULT_AUTHOR = {
  '@type': 'Person' as const,
  name: 'Danny Bloomstine',
  url: 'https://www.linkedin.com/in/danny-bloomstine/',
  jobTitle: 'Managing Director',
  worksFor: {
    '@type': 'Organization' as const,
    name: 'IQ-EQ',
  },
}

/**
 * Default publisher information
 */
export const DEFAULT_PUBLISHER = {
  '@type': 'Organization' as const,
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
}

/**
 * Options for article schema
 */
export interface ArticleSchemaOptions {
  /** Article headline */
  headline: string
  /** Article description */
  description: string
  /** Full URL of the article */
  url: string
  /** Publish date (ISO string) */
  datePublished?: string
  /** Modified date (ISO string) */
  dateModified?: string
  /** Custom author (defaults to Danny Bloomstine) */
  author?: typeof DEFAULT_AUTHOR
}

/**
 * Generate Article JSON-LD schema
 */
export function generateArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  author = DEFAULT_AUTHOR,
}: ArticleSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author,
    publisher: DEFAULT_PUBLISHER,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified: dateModified ?? datePublished }),
  }
}

/**
 * Breadcrumb item for schema
 */
export interface BreadcrumbItem {
  name: string
  /** Full URL or path (will be prefixed with site URL if path) */
  url: string
}

/**
 * Generate Breadcrumb JSON-LD schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  }
}

/**
 * FAQ item for schema
 */
export interface FAQSchemaItem {
  question: string
  answer: string
}

/**
 * Generate FAQPage JSON-LD schema
 */
export function generateFAQSchema(items: FAQSchemaItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

/**
 * Options for HowTo schema
 */
export interface HowToSchemaOptions {
  name: string
  description: string
  steps: Array<{
    name: string
    text: string
  }>
}

/**
 * Generate HowTo JSON-LD schema
 */
export function generateHowToSchema({ name, description, steps }: HowToSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  }
}

/**
 * Options for SoftwareApplication schema (for tools)
 */
export interface SoftwareApplicationSchemaOptions {
  name: string
  description: string
  url: string
  applicationCategory?: string
}

/**
 * Generate SoftwareApplication JSON-LD schema for tools
 */
export function generateToolSchema({
  name,
  description,
  url,
  applicationCategory = 'FinanceApplication',
}: SoftwareApplicationSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory,
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }
}
