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
  type ArticleSchemaOptions,
  type BreadcrumbItem,
  type FAQSchemaItem,
  type HowToSchemaOptions,
  type SoftwareApplicationSchemaOptions,
} from './schema'
