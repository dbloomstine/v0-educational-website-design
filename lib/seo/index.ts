/**
 * SEO utilities barrel export
 */

export {
  SITE_CONFIG,
  createPageMetadata,
  createArticleMetadata,
  type PageMetadataOptions,
  type ArticleMetadataOptions,
} from './metadata'

export {
  DEFAULT_AUTHOR,
  DEFAULT_PUBLISHER,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateToolSchema,
  generateVideoSchema,
  type ArticleSchemaOptions,
  type BreadcrumbItem,
  type FAQSchemaItem,
  type HowToSchemaOptions,
  type SoftwareApplicationSchemaOptions,
  type VideoSchemaOptions,
} from './schema'
