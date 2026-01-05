/**
 * Shared slug creation utilities
 * Used by: blog.ts, newsletters.ts, podcasts.ts
 */

/**
 * Create a URL-safe slug from a title
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Create a slug from title and date for unique identification
 * Format: {title-slug}-{YYYY-MM-DD}
 */
export function createSlugFromTitleAndDate(title: string, date: string): string {
  const dateStr = new Date(date).toISOString().split('T')[0] // YYYY-MM-DD
  const titleSlug = slugify(title || 'untitled')
  return `${titleSlug}-${dateStr}`
}
