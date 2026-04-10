/**
 * Sponsor configuration for the FundOps Daily newsletter.
 *
 * Renders at the top (compact) and bottom (with CTA + "want this spot?"
 * tease) of every edition. Swap DEFAULT_SPONSOR to rotate sponsors without
 * touching the template.
 *
 * Sponsors can supply either a hosted PNG logo (reliable across all email
 * clients — SVG is NOT) or a pre-styled inline HTML wordmark. Our own
 * FundOpsHQ entry uses the wordmark path so the brand treatment matches
 * the header.
 */

export interface Sponsor {
  /** Uppercase label above the brand, e.g. "PRESENTED BY" / "SUPPORTED BY" */
  label: string
  /** Brand name — used for alt text, click targets, and the fallback label */
  name: string
  /** Pre-styled inline HTML wordmark. Takes precedence over logoUrl. */
  wordmarkHtml?: string
  /** Absolute URL to a PNG logo. ~80px tall source recommended. */
  logoUrl?: string
  /** Rendered display width in px (height auto). Required if logoUrl set. */
  logoWidth?: number
  /** 2-3 sentence blurb shown in both the top and bottom blocks. */
  blurb: string
  /** Click-through URL for the wordmark and CTA. */
  ctaUrl: string
  /** Optional CTA button text in the bottom block. */
  ctaText?: string
}

/**
 * FundOpsHQ two-tone wordmark matching the header treatment
 * ("FundOps" dark slate + "HQ" blue accent).
 */
const FUNDOPSHQ_WORDMARK_HTML =
  '<span style="display:inline-block;font-size:20px;font-weight:800;letter-spacing:-0.4px;line-height:1;">' +
  '<span style="color:#1e293b;">FundOps</span><span style="color:#3b82f6;">HQ</span>' +
  '</span>'

export const DEFAULT_SPONSOR: Sponsor = {
  label: 'PRESENTED BY',
  name: 'FundOpsHQ',
  wordmarkHtml: FUNDOPSHQ_WORDMARK_HTML,
  blurb:
    'FundOpsHQ is the hub for the investment funds industry — home to the daily news feed, this newsletter, and FundOpsHQ Live every Thursday. Built for the GPs, LPs, and operators working in and around private markets.',
  ctaUrl: 'https://fundopshq.com',
  ctaText: 'Visit FundOpsHQ',
}
