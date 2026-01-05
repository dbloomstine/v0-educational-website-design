import { Metadata } from 'next'

/**
 * Base site information
 */
export const SITE_CONFIG = {
  name: 'FundOpsHQ',
  url: 'https://fundops.com',
  description: 'Free fund operations resources for private fund professionals',
  twitterCard: 'summary_large_image' as const,
}

/**
 * Options for creating page metadata
 */
export interface PageMetadataOptions {
  /** Page title (will be suffixed with site name if no suffix provided) */
  title: string
  /** Page description */
  description: string
  /** Page path (without domain, e.g., '/about' or '/tools/fund-launch-guide') */
  path: string
  /** Override OpenGraph title (defaults to title) */
  ogTitle?: string
  /** Override OpenGraph description (defaults to description) */
  ogDescription?: string
  /** Override Twitter title (defaults to title) */
  twitterTitle?: string
  /** Override Twitter description (defaults to description) */
  twitterDescription?: string
  /** OpenGraph type (defaults to 'website') */
  type?: 'website' | 'article'
  /** Don't append site name to title */
  noSiteSuffix?: boolean
}

/**
 * Create consistent page metadata
 *
 * @example
 * ```ts
 * export const metadata = createPageMetadata({
 *   title: 'About FundOpsHQ',
 *   description: 'Learn about FundOpsHQ...',
 *   path: '/about',
 * })
 * ```
 */
export function createPageMetadata({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  type = 'website',
  noSiteSuffix = false,
}: PageMetadataOptions): Metadata {
  const url = `${SITE_CONFIG.url}${path}`
  const finalTitle = noSiteSuffix ? title : title

  return {
    title: finalTitle,
    description,
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      type,
      url,
    },
    twitter: {
      card: SITE_CONFIG.twitterCard,
      title: twitterTitle ?? title,
      description: twitterDescription ?? description,
    },
    alternates: {
      canonical: url,
    },
  }
}

/**
 * Options for creating article metadata
 */
export interface ArticleMetadataOptions extends PageMetadataOptions {
  /** Article publish date (ISO string) */
  publishedTime: string
  /** Article modified date (ISO string, defaults to publishedTime) */
  modifiedTime?: string
  /** Article authors */
  authors?: string[]
}

/**
 * Create metadata for article pages
 */
export function createArticleMetadata({
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
  authors = ['FundOpsHQ'],
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
}: ArticleMetadataOptions): Metadata {
  const url = `${SITE_CONFIG.url}${path}`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      type: 'article',
      publishedTime,
      modifiedTime: modifiedTime ?? publishedTime,
      authors,
      url,
      siteName: SITE_CONFIG.name,
    },
    twitter: {
      card: SITE_CONFIG.twitterCard,
      title: twitterTitle ?? title,
      description: twitterDescription ?? description,
    },
    alternates: {
      canonical: url,
    },
  }
}
