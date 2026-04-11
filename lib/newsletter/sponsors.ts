/**
 * Sponsor configuration for the FundOps Daily newsletter.
 *
 * Each sponsor gets a full card in both the top and bottom blocks:
 * eyebrow label, wordmark or logo, and a 2–3 sentence blurb. The
 * bottom block adds a CTA button per sponsor, plus the house "Sponsor
 * FundOps Daily" invitation at the very bottom.
 *
 * Sponsors can supply either a hosted PNG logo (reliable across all
 * email clients — SVG and WebP are NOT) or a pre-styled inline HTML
 * wordmark. Our own FundOpsHQ entry uses the wordmark path so the
 * brand treatment matches the header.
 *
 * For co-sponsorship, the template stacks multiple Sponsor cards in
 * sequence. Keep the slate between 1 and 5 entries — more than 5 and
 * each brand's share of attention starts to suffer.
 */

export interface Sponsor {
  /** Uppercase label above the brand, e.g. "PRESENTED BY" / "SUPPORTED BY". */
  label: string
  /** Brand name — used for alt text, click targets, and the fallback label. */
  name: string
  /** Pre-styled inline HTML wordmark. Takes precedence over logoUrl. */
  wordmarkHtml?: string
  /** Absolute URL (or data URI) to a PNG logo. ~80–120px tall source recommended. */
  logoUrl?: string
  /** Rendered display width in px (height auto). Required if logoUrl is set. */
  logoWidth?: number
  /** 2–3 sentence blurb shown in both the top and bottom cards. */
  blurb: string
  /** Click-through URL for the wordmark and CTA button. */
  ctaUrl: string
  /** Optional CTA button text — only rendered in the bottom block. */
  ctaText?: string
}

/**
 * A slate is just an ordered list of sponsor cards to stack. Type
 * alias rather than an object wrapper because there's no shared slate
 * metadata (each sponsor owns its own label).
 */
export type SponsorSlate = Sponsor[]

/**
 * FundOpsHQ two-tone wordmark matching the header treatment
 * ("FundOps" dark slate + "HQ" blue accent).
 */
const FUNDOPSHQ_WORDMARK_HTML =
  '<span style="display:inline-block;font-size:20px;font-weight:800;letter-spacing:-0.4px;line-height:1;">' +
  '<span style="color:#1e293b;">FundOps</span><span style="color:#3b82f6;">HQ</span>' +
  '</span>'

/**
 * House entry — FundOpsHQ self-recognition so the sponsor block is
 * never empty pre-revenue. Stays in the slate even once paid sponsors
 * land; drop or reorder as needed.
 */
export const FUNDOPSHQ_SPONSOR: Sponsor = {
  label: 'PRESENTED BY',
  name: 'FundOpsHQ',
  wordmarkHtml: FUNDOPSHQ_WORDMARK_HTML,
  blurb:
    'FundOpsHQ is the hub for the investment funds industry — home to the daily news feed, this newsletter, and FundOpsHQ Live every Thursday. Built for the GPs, LPs, and operators working in and around private markets.',
  ctaUrl: 'https://fundopshq.com',
  ctaText: 'Visit FundOpsHQ',
}

/**
 * Default slate used when no paid sponsors are configured for an
 * edition. Contains only the house entry. Add paid sponsor cards
 * above or below FUNDOPSHQ_SPONSOR once they're booked.
 */
export const DEFAULT_SPONSOR_SLATE: SponsorSlate = [FUNDOPSHQ_SPONSOR]
