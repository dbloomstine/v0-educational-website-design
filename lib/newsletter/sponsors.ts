/**
 * Sponsor types for the FundOps Daily newsletter.
 *
 * ONE sponsor at a time. Who it is on a given day is a row in
 * `sponsor_bookings` (lib/sponsor/bookings.ts), which the daily send and the
 * site both read; nothing here is edited to put a sponsor up or take one down.
 * With nobody booked the email carries the house "Your firm here" notice.
 *
 * A slate is the shape the template takes: one label ("PRESENTED BY") and the
 * sponsor under it. It is a list for history's sake — an earlier design
 * stacked up to five co-sponsors — and holds one sponsor or none.
 *
 * A sponsor supplies a hosted PNG logo (reliable across email clients; SVG and
 * WebP are not) or is set as a wordmark in the email's own type.
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
  /** The mock-up shown to prospects: leaves out the "your firm here next" line under a real sponsor's card. */
  sample?: boolean
}

/**
 * Generic FundOpsHQ house card. Used as the default pre-revenue
 * sponsor entry and by the preview/test scripts. Reads as a quiet
 * "brought to you by" mark rather than promoting any one surface —
 * an earlier iteration cross-promoted the live show with a "Thursdays
 * at 11 AM ET" line, but doubling that callout on every edition (top
 * + bottom sponsor slot) was louder than the show needed.
 */
export const FUNDOPSHQ_SPONSOR: Sponsor = {
  name: 'FundOpsHQ',
  logoUrl: 'https://fundopshq.com/sponsors/fundopshq-wordmark.png',
  logoWidth: 180,
  blurb:
    'Brought to you by FundOpsHQ — the hub for the investment funds industry. Daily news, this newsletter, and more, built for GPs, LPs, and the fund service providers working in and around private markets.',
  ctaUrl: 'https://fundopshq.com',
  ctaText: 'Visit FundOpsHQ',
}

/**
 * What the template falls back to when it is handed no slate at all (previews,
 * test renders): nobody. Empty since 2026-08-30 (Danny: "remove the FundOpsHQ
 * sponsor or presented by section") — the house card was a full screen at the
 * top of every edition telling subscribers about the thing they had already
 * subscribed to. An empty slate renders the slim "Your firm here" notice.
 */
export const DEFAULT_SPONSOR_SLATE: SponsorSlate = {
  label: 'BROUGHT TO YOU BY',
  sponsors: [],
}

/**
 * Sample slate used ONLY by the /newsletter/sample route, which sponsor
 * prospects reach from the /sponsor page. One sponsor, because that is what
 * is for sale: one presenting sponsor per edition (Danny, 2026-10-02: "it
 * should look like its just one sponsor. we're just trying to attract that
 * one first sponsor"). An earlier sample stacked five cards — the house card
 * and four made-up firms — which showed a prospect their logo fourth in a
 * queue. The mark is an empty dashed box, so nobody mistakes the example for
 * a client. Never used in a real send.
 */
function placeholderWordmark(label: string): string {
  return `<span style="display:inline-block;padding:10px 26px;border:2px dashed #B8AF99;background:#FFFFFF;border-radius:3px;font-family:Georgia,'Times New Roman',Times,serif;font-size:17px;font-weight:700;letter-spacing:0.5px;line-height:1.1;color:#5A6B82;text-align:center;white-space:nowrap;">${label}</span>`
}

export const SAMPLE_SPONSOR: Sponsor = {
  name: 'Your firm',
  wordmarkHtml: placeholderWordmark('YOUR LOGO HERE'),
  blurb:
    'Up to 60 words, in your own voice: what your firm does for the people who run private funds, and why they should look this morning. It appears here, under the masthead, and again at the foot of every edition in your run, with one link to wherever you choose.',
  ctaUrl: 'https://fundopshq.com/sponsor',
  ctaText: 'Your link here',
}

export const SAMPLE_SPONSOR_SLATE: SponsorSlate = {
  label: 'PRESENTED BY',
  sponsors: [SAMPLE_SPONSOR],
  sample: true,
}
