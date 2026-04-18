/**
 * Sponsor configuration for the FundOps Daily newsletter.
 *
 * A SponsorSlate carries one shared label ("PRESENTED BY") rendered
 * once at the top of each sponsor block, plus a list of sponsor cards
 * stacked underneath. Each card has a wordmark (or hosted logo) and a
 * 2–3 sentence blurb. The bottom block adds a CTA button per card,
 * plus the house "Sponsor FundOps Daily" invitation below the stack.
 *
 * Sponsors can supply either a hosted PNG logo (reliable across all
 * email clients — SVG and WebP are NOT) or a pre-styled inline HTML
 * wordmark. Our own FundOpsHQ entry uses the wordmark path so the
 * brand treatment matches the header.
 *
 * Keep the slate between 1 and 5 sponsors — more than 5 and each
 * brand's share of attention starts to suffer.
 */

/** A single sponsor card inside a slate. */
export interface Sponsor {
  /** Brand name — used for alt text and click targets. */
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

/** A slate of co-sponsors shown together under a shared label. */
export interface SponsorSlate {
  /** Uppercase label rendered once at the top of the sponsor block. */
  label: string
  /** The sponsor cards to stack. */
  sponsors: Sponsor[]
}

/**
 * Generic "visit fundopshq" house entry. Kept around for the test-send
 * and preview scripts (scripts/send-test-email.ts, scripts/preview-
 * newsletter.ts) which simulate the co-sponsor "PRESENTED BY"
 * experience we'll show once paid sponsors book. Not used in live
 * production sends — the default slate cross-promotes the Live Show
 * instead (see LIVE_SHOW_HOUSE_SPONSOR below).
 */
export const FUNDOPSHQ_SPONSOR: Sponsor = {
  name: 'FundOpsHQ',
  logoUrl: 'https://fundopshq.com/sponsors/fundopshq-wordmark.png',
  logoWidth: 180,
  blurb:
    'FundOpsHQ is the hub for the investment funds industry — home to the daily news feed, this newsletter, and FundOpsHQ Live every Thursday. Built for GPs, LPs, and the fund service providers working in and around private markets.',
  ctaUrl: 'https://fundopshq.com',
  ctaText: 'Visit FundOpsHQ',
}

/**
 * Live-show cross-promo entry — fills the default sponsor slot pre-
 * revenue with a real FundOpsHQ product tease rather than a self-
 * referential "visit us" card. The show is our highest-leverage
 * conversion surface: readers who watch an episode stick around on
 * the newsletter, and vice versa. Wordmark uses inline HTML so the
 * amber "Live" italic matches the FundOpsDaily masthead treatment.
 */
export const LIVE_SHOW_HOUSE_SPONSOR: Sponsor = {
  name: 'FundOpsHQ Live',
  wordmarkHtml:
    `<span style="white-space:nowrap;font-family:Georgia,'Times New Roman',Times,serif;font-size:18px;font-weight:800;letter-spacing:-0.3px;line-height:1.1;"><span style="color:#1E3A5F;">FundOpsHQ</span>&nbsp;<span style="font-style:italic;color:#E6B045;">Live</span></span>`,
  blurb:
    'The weekly broadcast covering private markets — fund launches, closes, exec moves, and regulatory actions, with guest GPs, LPs, and service providers. Thursdays at 11 AM ET, replays on-demand.',
  ctaUrl: 'https://www.youtube.com/@dbloomstine/streams',
  ctaText: 'Watch latest episode',
}

/**
 * Default slate used when no paid sponsors are configured for an
 * edition. Cross-promotes FundOpsHQ Live. When a paid sponsor books,
 * replace the entire slate — relabel to "PRESENTED BY" and put the
 * paid sponsor card in the `sponsors` array (optionally keep the
 * Live Show entry as a secondary card).
 */
export const DEFAULT_SPONSOR_SLATE: SponsorSlate = {
  label: 'ALSO FROM FUNDOPSHQ',
  sponsors: [LIVE_SHOW_HOUSE_SPONSOR],
}
