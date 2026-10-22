/**
 * Stories a firm sent us itself ("Send us your news", /submit), 2026-10-22.
 *
 * A submission the desk has verified is published as an ordinary news_items
 * row (scripts/news/publish-submission.ts) under one source name, so the site
 * can say where it came from: "announced by the firm to FundOpsHQ". The name is
 * the marker because it is one of the columns a story is built from
 * (story-columns.ts); the classifier rewrites extracted_data whole, so nothing
 * kept there would survive.
 *
 * Browser-safe: no server imports.
 */

/** news_items.source_name of every row published from a submission. */
export const SUBMISSION_SOURCE_NAME = 'Announced to FundOpsHQ'

/** What the story page says in place of "first reported by <outlet>". */
export const SUBMISSION_BYLINE = 'announced by the firm to FundOpsHQ'

/** The row (or story) came from a firm's own submission. */
export function isFirmSubmission(sourceName: string | null | undefined): boolean {
  return (sourceName ?? '').trim() === SUBMISSION_SOURCE_NAME
}

/**
 * A link to fundopshq.com itself. A submission with no public announcement is
 * published with its own story page as its link (publish-submission.ts), and
 * "read the full story at…" must not send a reader round in a circle.
 */
export function isOwnSiteUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'fundopshq.com' || host === 'www.fundopshq.com'
  } catch {
    return false
  }
}
