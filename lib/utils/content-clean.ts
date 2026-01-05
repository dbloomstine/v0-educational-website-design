/**
 * Shared content cleaning and extraction utilities
 * Used by: blog.ts, newsletters.ts
 */

/**
 * Clean Beehiiv RSS content by removing styles and wrapper divs
 */
export function cleanBeehiivContent(content: string): string {
  // Remove style tags and their content
  let cleaned = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  // Remove Beehiiv wrapper div
  cleaned = cleaned.replace(/<div class=['"]beehiiv['"]>/gi, '')
  cleaned = cleaned.replace(/<\/div>\s*$/gi, '')
  // Clean up extra whitespace
  cleaned = cleaned.trim()
  return cleaned
}

/**
 * Strip all HTML tags from content
 */
export function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Extract a summary from HTML content
 * @param content - Raw HTML content
 * @param maxLength - Maximum length of summary (default 200)
 * @param cleanFn - Optional content cleaning function to apply first
 */
export function extractSummary(
  content: string,
  maxLength: number = 200,
  cleanFn?: (content: string) => string
): string {
  // Clean content first if function provided
  const cleaned = cleanFn ? cleanFn(content) : content
  // Strip HTML
  const textContent = stripHtml(cleaned)
  // Get first maxLength characters
  const summary = textContent.substring(0, maxLength)
  // Find last complete sentence
  const lastPeriod = summary.lastIndexOf('.')
  if (lastPeriod > maxLength / 2) {
    return summary.substring(0, lastPeriod + 1)
  }
  return summary + '...'
}

/**
 * Extract summary from Beehiiv content specifically
 */
export function extractBeehiivSummary(content: string, maxLength: number = 200): string {
  return extractSummary(content, maxLength, cleanBeehiivContent)
}
