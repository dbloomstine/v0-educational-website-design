/**
 * Sponsor configuration for the FundOps Daily newsletter.
 *
 * FundOps Daily uses a co-sponsor model: 3–5 brands per edition appear
 * together on equal footing in a "SUPPORTED BY" logo strip at the top
 * and bottom of the brief — PBS NewsHour-style funder recognition, not
 * a single-brand takeover.
 *
 * Each mark can supply either a hosted PNG logo (reliable across all
 * email clients — SVG is NOT) or a pre-styled inline HTML wordmark.
 * Our own FundOpsHQ entry uses the wordmark path so the brand
 * treatment matches the header.
 */

/** A single sponsor mark in the slate. */
export interface SponsorMark {
  /** Brand name — used for alt text and the fallback text label. */
  name: string
  /** Click-through URL for the logo. */
  ctaUrl: string
  /** Pre-styled inline HTML wordmark. Takes precedence over logoUrl. */
  wordmarkHtml?: string
  /** Absolute URL to a PNG logo. ~80px tall source recommended. */
  logoUrl?: string
  /**
   * Per-mark max display width override in px. Defaults vary by block
   * (top strip is more compact than the bottom strip). Use only when a
   * specific brand's aspect ratio makes the default look off.
   */
  maxWidth?: number
}

/**
 * A slate of co-sponsors shown together. Keep between 1 and 5 marks —
 * more than 5 makes the strip feel cluttered and each brand gets
 * diminishing visual weight.
 */
export interface SponsorSlate {
  /** Uppercase eyebrow rendered above the logo strip. */
  label: string
  /** The brands to display, left-to-right. */
  marks: SponsorMark[]
}

/**
 * FundOpsHQ two-tone wordmark matching the header treatment
 * ("FundOps" dark slate + "HQ" blue accent).
 */
const FUNDOPSHQ_WORDMARK_HTML =
  '<span style="display:inline-block;font-size:20px;font-weight:800;letter-spacing:-0.4px;line-height:1;">' +
  '<span style="color:#1e293b;">FundOps</span><span style="color:#3b82f6;">HQ</span>' +
  '</span>'

/**
 * Default slate used when no paid sponsors are configured for an
 * edition. Contains a single FundOpsHQ self-recognition mark so the
 * block is never empty — swap this out once real sponsors are booked.
 */
export const DEFAULT_SPONSOR_SLATE: SponsorSlate = {
  label: 'SUPPORTED BY',
  marks: [
    {
      name: 'FundOpsHQ',
      wordmarkHtml: FUNDOPSHQ_WORDMARK_HTML,
      ctaUrl: 'https://fundopshq.com',
    },
  ],
}
