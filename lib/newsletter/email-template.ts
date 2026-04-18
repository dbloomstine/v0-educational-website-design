/**
 * HTML email template for FundOps Daily newsletter.
 *
 * Editorial newsroom treatment matching the fundopshq.com brand:
 * deep navy header with a newspaper masthead strip, cream editorial
 * body, amber accent on the daily mark, Georgia for display serif,
 * monospace eyebrows for dates and categories.
 *
 * Style strategy: repeated styles live in a <style> block at the top
 * of <head> as utility classes (font-family, color, font-size,
 * padding, etc). Modern Gmail, Apple Mail, and Outlook Web/365 all
 * honor <style> blocks for those properties, so defining them once
 * and referencing via class="..." cuts email size dramatically vs.
 * repeating inline styles on every element. One-off styles (the
 * masthead wordmark, per-element padding) stay inline. System fonts
 * only — @font-face and Google Fonts are unreliable in email.
 */

import type { ArticleGroup } from './query-articles'
import { getEventTypeLabel, formatFundSize, isLikelyAumLeak } from './query-articles'
import { getPrimaryLogoUrl, resolveLogoDomain } from '@/lib/news/firm-logo-url'
import { DEFAULT_SPONSOR_SLATE, type Sponsor, type SponsorSlate } from './sponsors'

interface TemplateParams {
  groups: ArticleGroup[]
  totalArticles: number
  editionDate: string
  unsubscribeUrl: string
  sponsorSlate?: SponsorSlate
  /**
   * Confirmed subscriber count at send time. Renders into the masthead
   * eyebrow as social proof ("Read by 97 GPs, LPs, and fund service
   * providers") and gently motivates forwards — people are more likely
   * to share a newsletter that a peer group is already reading. Defaults
   * to undefined for test-send contexts where the count is unavailable.
   */
  subscriberCount?: number
}

// ─── Brand palette ──────────────────────────────────────────────────────────
// Mirrors the canonical brand colors exposed in app/brand/page.tsx.

const NAVY = '#1E3A5F'
const NAVY_DEEP = '#0F1E33'
const CREAM = '#F8F5EC'
const AMBER = '#E6B045'
const INK = '#1E3A5F'
const INK_MUTED = '#5A6B82'
const HAIRLINE = '#D8D0BC'
const HAIRLINE_DARK = 'rgba(248,245,236,0.18)'

const FONT_SERIF = `Georgia, 'Times New Roman', Times, serif`
const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`
const FONT_MONO = `ui-monospace, Menlo, Consolas, 'Courier New', monospace`

// ─── Event type badge classes ──────────────────────────────────────────────
// Semantic class names tied to the styles defined in STYLE_BLOCK below.

const EVENT_BADGE_CLASS: Record<string, string> = {
  fund_launch: 'fops-b-launch',
  fund_close: 'fops-b-close',
  capital_raise: 'fops-b-raise',
  executive_hire: 'fops-b-exec',
  executive_change: 'fops-b-exec',
  executive_departure: 'fops-b-exec',
  acquisition: 'fops-b-deal',
  merger: 'fops-b-deal',
  regulatory_action: 'fops-b-reg',
}

const CATEGORY_CLASS: Record<string, string> = {
  PE: 'fops-c-pe',
  VC: 'fops-c-vc',
  credit: 'fops-c-credit',
  hedge: 'fops-c-hedge',
  real_estate: 'fops-c-re',
  infrastructure: 'fops-c-infra',
  secondaries: 'fops-c-sec',
  gp_stakes: 'fops-c-gp',
  lp_commitments: 'fops-c-lp',
  people_moves: 'fops-c-ppl',
  deals: 'fops-c-deals',
  regulatory: 'fops-c-reg',
}

// ─── Style block ───────────────────────────────────────────────────────────
// Every class below maps to a style combination repeated 10+ times in the
// rendered email. Defining them once in <head> saves ~60% on body size vs
// inline repetition, while modern email clients (Gmail, Apple Mail,
// Outlook 365, Outlook Web) all support <style> for these properties.

const STYLE_BLOCK = `
:root { color-scheme: only light; supported-color-schemes: only light; }
body, table, td, div, p, a, span { color-scheme: only light !important; }

/* Typography utilities */
.fops-serif { font-family: ${FONT_SERIF}; }
.fops-sans { font-family: ${FONT_SANS}; }
.fops-mono { font-family: ${FONT_MONO}; }

/* Color utilities */
.fops-ink { color: ${INK}; }
.fops-ink-muted { color: ${INK_MUTED}; }
.fops-cream { color: ${CREAM}; }
.fops-amber { color: ${AMBER}; }
.fops-bg-cream { background-color: ${CREAM}; }
.fops-bg-navy { background-color: ${NAVY}; }
.fops-bg-navy-deep { background-color: ${NAVY_DEEP}; }

/* Story row */
.fops-row { padding: 16px 0; border-bottom: 1px solid ${HAIRLINE}; }
.fops-meta { margin-bottom: 8px; }
.fops-meta td { vertical-align: middle; padding-right: 8px; }
.fops-meta-badge { padding-right: 10px !important; }

.fops-title-wrap { margin-bottom: 6px; }
.fops-title {
  color: ${INK};
  text-decoration: none;
  font-size: 17px;
  font-weight: 700;
  font-family: ${FONT_SERIF};
  line-height: 1.3;
}
.fops-size {
  color: ${INK_MUTED};
  font-size: 13px;
  font-family: ${FONT_MONO};
  font-weight: 600;
}
.fops-blurb {
  color: ${INK_MUTED};
  font-size: 14px;
  line-height: 1.6;
  font-family: ${FONT_SANS};
  margin: 0 0 8px;
}
.fops-source {
  color: ${INK_MUTED};
  font-size: 10px;
  font-family: ${FONT_MONO};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.5;
}
.fops-firm {
  color: ${INK_MUTED};
  font-size: 12px;
  font-family: ${FONT_SANS};
  font-weight: 600;
}

/* Event badges */
.fops-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 3px 6px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  font-family: ${FONT_MONO};
  border-radius: 2px;
  white-space: nowrap;
  background: ${CREAM};
  border-width: 1px;
  border-style: solid;
}
.fops-b-launch { border-color: #3B6BA5; color: #3B6BA5; }
.fops-b-close { border-color: #9D3B5F; color: #9D3B5F; }
.fops-b-raise { border-color: #3E7A4E; color: #3E7A4E; }
.fops-b-exec { border-color: #6B5B8A; color: #6B5B8A; }
.fops-b-deal { border-color: #3B6BA5; color: #3B6BA5; }
.fops-b-reg { border-color: #B13B2E; color: #B13B2E; }
.fops-b-default { border-color: ${INK_MUTED}; color: ${INK_MUTED}; }

/* Category section heads */
.fops-cat { margin-bottom: 28px; }
.fops-cat-head {
  padding-bottom: 10px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
}
.fops-cat-label {
  font-family: ${FONT_MONO};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${INK};
  text-transform: uppercase;
}
.fops-cat-count {
  font-family: ${FONT_MONO};
  font-size: 10px;
  color: ${INK_MUTED};
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.fops-c-pe { border-bottom-color: #4F46E5; }
.fops-c-vc { border-bottom-color: #059669; }
.fops-c-credit { border-bottom-color: #D97706; }
.fops-c-hedge { border-bottom-color: #7C3AED; }
.fops-c-re { border-bottom-color: #EA580C; }
.fops-c-infra { border-bottom-color: #0284C7; }
.fops-c-sec { border-bottom-color: #DB2777; }
.fops-c-gp { border-bottom-color: #0D9488; }
.fops-c-lp { border-bottom-color: ${AMBER}; }
.fops-c-ppl { border-bottom-color: #8B5CF6; }
.fops-c-deals { border-bottom-color: #0891B2; }
.fops-c-reg { border-bottom-color: #DC2626; }
.fops-c-default { border-bottom-color: ${INK_MUTED}; }

/* Firm logo */
.fops-logo {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  vertical-align: middle;
  background: ${CREAM};
  border: 1px solid ${HAIRLINE};
}
.fops-logo-img { object-fit: contain; }
.fops-logo-fallback {
  display: inline-block;
  color: ${INK};
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  font-family: ${FONT_SERIF};
}

/* Eyebrow labels (SUPPORTED BY / PRESENTED BY / SECTION A etc.) */
.fops-eyebrow {
  font-family: ${FONT_MONO};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${INK_MUTED};
  text-transform: uppercase;
}
.fops-eyebrow-light {
  font-family: ${FONT_MONO};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(248,245,236,0.7);
  text-transform: uppercase;
}
.fops-eyebrow-amber {
  font-family: ${FONT_MONO};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${AMBER};
  text-transform: uppercase;
}

/* Sponsor card chrome */
.fops-sponsor-blurb {
  margin: 0 0 12px;
  color: ${INK};
  font-size: 13px;
  line-height: 1.6;
  font-family: ${FONT_SANS};
}
.fops-sponsor-blurb-lg {
  margin: 0 0 16px;
  color: ${INK};
  font-size: 14px;
  line-height: 1.65;
  font-family: ${FONT_SANS};
}
/* CTA buttons — color + background-color MUST also be inlined on
   the anchor elements. Classes lose to Gmail's a:link specificity,
   and Gmail Desktop occasionally strips background-* from <style>. */
.fops-cta-outline {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  border-width: 1px;
  border-style: solid;
  border-color: ${INK};
  padding: 6px 12px;
  border-radius: 2px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: ${FONT_MONO};
}
.fops-cta-solid {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 2px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: ${FONT_MONO};
}
.fops-house-cta {
  margin: 26px 0 0;
  padding-top: 18px;
  border-top: 1px solid ${HAIRLINE};
  color: ${INK_MUTED};
  font-size: 11px;
  line-height: 1.55;
  font-family: ${FONT_SANS};
  font-style: italic;
}

/* Dark-mode opt-out re-pinning — Gmail iOS/Android auto-invert otherwise. */
@media (prefers-color-scheme: dark) {
  body, table, td, div { background-color: inherit !important; }
  .fops-bg-navy { background-color: ${NAVY} !important; }
  .fops-bg-navy-deep { background-color: ${NAVY_DEEP} !important; }
  .fops-bg-cream { background-color: ${CREAM} !important; }
  .fops-cream { color: ${CREAM} !important; }
  .fops-amber { color: ${AMBER} !important; }
  .fops-ink { color: ${INK} !important; }
  .fops-ink-muted { color: ${INK_MUTED} !important; }
}
u + .body .fops-bg-navy { background-color: ${NAVY} !important; }
u + .body .fops-bg-cream { background-color: ${CREAM} !important; }
[data-ogsc] .fops-bg-navy { background-color: ${NAVY} !important; }
[data-ogsc] .fops-bg-cream { background-color: ${CREAM} !important; }
`.trim()

// ─── Helpers ───────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(dateStr: string): string {
  // Append noon UTC to prevent date-string parsing (midnight UTC) from
  // rolling back a day when converted to America/New_York.
  const d = new Date(dateStr + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

function formatMastheadDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York',
    })
    .toUpperCase()
}

/**
 * Collapse per-line whitespace/indentation in the rendered HTML without
 * touching inline text spacing. Keeps the template source readable while
 * shrinking the delivered body ~15%.
 */
function collapseTemplateWhitespace(html: string): string {
  return html
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('')
}

// ─── Firm logos (circular favicon with cream tile) ─────────────────────────

function renderFirmLogo(article: ArticleGroup['articles'][0]): string {
  const resolvedDomain = resolveLogoDomain(
    article.firmName,
    article.firmDomain,
    article.sourceName,
  )
  const displayName = article.firmName ?? article.sourceName ?? '?'
  const initial = displayName[0].toUpperCase()
  if (resolvedDomain) {
    const logoUrl = getPrimaryLogoUrl(resolvedDomain)
    return `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(initial)}" width="22" height="22" class="fops-logo fops-logo-img" />`
  }
  return `<span class="fops-logo fops-logo-fallback">${escapeHtml(initial)}</span>`
}

// ─── Single story row ──────────────────────────────────────────────────────

function renderArticle(article: ArticleGroup['articles'][0]): string {
  const badgeClass =
    EVENT_BADGE_CLASS[article.eventType ?? ''] ?? 'fops-b-default'
  const label = getEventTypeLabel(article.eventType)
  // Suppress size pill on likely AUM leaks (e.g. 4/18 "Nest $81B" where
  // classifier put £60bn firm AUM into fund_size_usd_millions on an
  // unnamed private-credit mandate). Same rail as buildSubject.
  const size = isLikelyAumLeak(article.fundSizeUsdMillions, article.fundName)
    ? ''
    : formatFundSize(article.fundSizeUsdMillions)
  const logo = renderFirmLogo(article)

  const badgeHtml = label
    ? `<span class="fops-badge ${badgeClass}">${escapeHtml(label)}</span>`
    : ''

  const firmHtml = article.firmName
    ? `<span class="fops-firm">${escapeHtml(article.firmName)}</span>`
    : ''

  // Compact inline meta row — badge + logo + firm name. Content-sized
  // table so the cells hug the left edge and the full-width title/
  // blurb/source below can breathe across the entire column.
  const metaRow = `
    <table cellpadding="0" cellspacing="0" border="0" class="fops-meta">
      <tr>
        ${badgeHtml ? `<td class="fops-meta-badge">${badgeHtml}</td>` : ''}
        <td>${logo}</td>
        ${firmHtml ? `<td>${firmHtml}</td>` : ''}
      </tr>
    </table>`

  const alsoCoveredBy =
    article.alsoCoveredBy && article.alsoCoveredBy.length > 0
      ? ` &nbsp;·&nbsp; ALSO: ${article.alsoCoveredBy.slice(0, 3).map(escapeHtml).join(', ')}`
      : ''

  const sizeHtml = size ? ` <span class="fops-size">(${escapeHtml(size)})</span>` : ''

  return `
    <tr>
      <td class="fops-row">
        ${metaRow}
        <div class="fops-title-wrap">
          <a href="${escapeHtml(article.sourceUrl)}" class="fops-title" style="color:${INK};text-decoration:none;" target="_blank">${escapeHtml(article.title)}</a>${sizeHtml}
        </div>
        ${article.tldr ? `<div class="fops-blurb">${escapeHtml(article.tldr)}</div>` : ''}
        <div class="fops-source">${escapeHtml(article.sourceName ?? '')}${alsoCoveredBy}</div>
      </td>
    </tr>`
}

// ─── Category section head ─────────────────────────────────────────────────

function renderCategory(group: ArticleGroup): string {
  const categoryClass = CATEGORY_CLASS[group.category] ?? 'fops-c-default'
  const articleRows = group.articles.map(renderArticle).join('')
  const count = group.articles.length
  const countLabel = `${count} ${count === 1 ? 'STORY' : 'STORIES'}`

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" class="fops-cat">
      <tr>
        <td class="fops-cat-head ${categoryClass}">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td><span class="fops-cat-label">${escapeHtml(group.label)}</span></td>
              <td align="right"><span class="fops-cat-count">${countLabel}</span></td>
            </tr>
          </table>
        </td>
      </tr>
      ${articleRows}
    </table>`
}

// ─── Sponsor marks ─────────────────────────────────────────────────────────

function renderSponsorMark(sponsor: Sponsor, logoHeightPx: number): string {
  if (sponsor.wordmarkHtml) return sponsor.wordmarkHtml
  if (sponsor.logoUrl) {
    const width = sponsor.logoWidth ?? logoHeightPx * 5
    return `<img src="${escapeHtml(sponsor.logoUrl)}" alt="${escapeHtml(sponsor.name)}" width="${width}" style="width:${width}px;height:auto;display:block;" />`
  }
  return `<span class="fops-serif fops-ink" style="display:inline-block;font-size:${logoHeightPx}px;font-weight:800;letter-spacing:-0.3px;line-height:1;">${escapeHtml(sponsor.name)}</span>`
}

function renderSponsorCardTop(sponsor: Sponsor, isFirst: boolean): string {
  const mark = renderSponsorMark(sponsor, 20)
  return `
    <div style="padding:${isFirst ? '6px 0 18px' : '18px 0'};${isFirst ? '' : `border-top:1px solid ${HAIRLINE};`}">
      <div style="margin-bottom:10px;">
        <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:${INK};display:inline-block;">${mark}</a>
      </div>
      <p class="fops-sponsor-blurb">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `<div><a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" class="fops-cta-outline" style="color:${INK};text-decoration:none;">${escapeHtml(sponsor.ctaText)} &rarr;</a></div>` : ''}
    </div>`
}

function renderSponsorCardBottom(sponsor: Sponsor, isFirst: boolean): string {
  const mark = renderSponsorMark(sponsor, 24)
  return `
    <div style="padding:${isFirst ? '6px 0 22px' : '22px 0'};${isFirst ? '' : `border-top:1px solid ${HAIRLINE};`}">
      <div style="margin-bottom:12px;">
        <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:${INK};display:inline-block;">${mark}</a>
      </div>
      <p class="fops-sponsor-blurb-lg">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `<div><a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" class="fops-cta-solid" style="color:${CREAM};background-color:${INK};text-decoration:none;">${escapeHtml(sponsor.ctaText)} &rarr;</a></div>` : ''}
    </div>`
}

function renderSponsorTop(slate: SponsorSlate): string {
  if (slate.sponsors.length === 0) return ''
  const cards = slate.sponsors
    .map((sponsor, i) => renderSponsorCardTop(sponsor, i === 0))
    .join('')
  return `
    <tr>
      <td class="fops-bg-cream" style="padding:20px 32px 18px;background-color:${CREAM};border-bottom:1px solid ${HAIRLINE};">
        <div class="fops-eyebrow" style="margin-bottom:6px;">${escapeHtml(slate.label)}</div>
        ${cards}
      </td>
    </tr>`
}

function renderSponsorBottom(slate: SponsorSlate): string {
  if (slate.sponsors.length === 0) return ''
  const cards = slate.sponsors
    .map((sponsor, i) => renderSponsorCardBottom(sponsor, i === 0))
    .join('')
  return `
    <tr>
      <td class="fops-bg-cream" style="padding:28px 32px 28px;background-color:${CREAM};border-top:1px solid ${HAIRLINE};">
        <div class="fops-eyebrow" style="margin-bottom:6px;">${escapeHtml(slate.label)}</div>
        ${cards}
        <p class="fops-house-cta">Reach GPs, LPs, and fund service providers every morning. <a href="mailto:dbloomstine@gmail.com?subject=FundOps%20Daily%20sponsorship" style="color:${INK};text-decoration:none;font-weight:600;font-style:normal;">Sponsor FundOps Daily &rarr;</a></p>
      </td>
    </tr>`
}

// ─── Main render ───────────────────────────────────────────────────────────

export function renderNewsletterEmail(params: TemplateParams): string {
  const {
    groups,
    editionDate,
    unsubscribeUrl,
    sponsorSlate = DEFAULT_SPONSOR_SLATE,
    subscriberCount,
  } = params
  const formattedDate = formatDate(editionDate)
  const mastheadDate = formatMastheadDate(editionDate)
  const categoryBlocks = groups.map(renderCategory).join('')
  const sponsorTop = renderSponsorTop(sponsorSlate)
  const sponsorBottom = renderSponsorBottom(sponsorSlate)

  // Social-proof eyebrow fragment. Omitted when count is unavailable
  // (test sends) or absurdly small.
  const socialProof =
    subscriberCount && subscriberCount >= 25
      ? `READ BY ${subscriberCount} PROS`
      : 'THE DAILY BRIEF'

  // Biggest story of the day for the bottom share block. Falls back to
  // the first group's first article when category ordering lands deals
  // below the wire. Used only as a suggested share prompt.
  const topStory = groups[0]?.articles[0]
  const topStoryHeadline = topStory?.title ?? 'today\'s top fund news'
  const shareText = `Top fund news today: "${topStoryHeadline}" — from FundOps Daily`
  const shareUrl = 'https://fundopshq.com/?ref=share'
  const mailtoBody = `${shareText}\n\nSubscribe: ${shareUrl}`
  const shareMailto = `mailto:?subject=${encodeURIComponent('Thought this was worth passing along')}&body=${encodeURIComponent(mailtoBody)}`
  const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const shareX = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const html = `<!DOCTYPE html>
<html lang="en" style="color-scheme:only light;supported-color-schemes:only light;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="only light">
  <meta name="supported-color-schemes" content="only light">
  <title>FundOps Daily — ${formattedDate}</title>
  <style>${STYLE_BLOCK}</style>
  <!--[if mso]>
  <style>table{border-collapse:collapse;}td{font-family:Georgia,serif;}</style>
  <![endif]-->
</head>
<body class="body fops-sans" style="margin:0;padding:0;background-color:${NAVY_DEEP};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" class="fops-bg-navy-deep" style="background-color:${NAVY_DEEP};">
    <tr>
      <td align="center" style="padding:24px 10px;">
        <table cellpadding="0" cellspacing="0" border="0" width="680" style="max-width:680px;width:100%;">

          <!-- ─── Forwarded-to-you strip ─── -->
          <!-- Shown at the very top of every edition. Readers who got
               the email forwarded by a peer see a direct "subscribe"
               path. Near-zero cost to people who are already subscribers
               (they scroll past) but a meaningful conversion path for
               the (harder-to-measure) forwards. -->
          <tr>
            <td class="fops-bg-cream" style="padding:10px 32px;background-color:${CREAM};border-bottom:1px solid rgba(30,58,95,0.08);">
              <div class="fops-mono" style="font-size:10px;color:rgba(30,58,95,0.7);letter-spacing:1.5px;text-transform:uppercase;text-align:center;">
                Forwarded to you? &nbsp;<a href="https://fundopshq.com/?ref=fwd" style="color:${INK};text-decoration:underline;font-weight:700;">Subscribe to FundOps Daily &rarr;</a>
              </div>
            </td>
          </tr>

          <!-- ─── Masthead ─── -->
          <tr>
            <td class="fops-bg-navy" style="padding:0;background-color:${NAVY};">

              <!-- Top eyebrow strip -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:14px 32px 12px;border-bottom:1px solid ${HAIRLINE_DARK};">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td class="fops-eyebrow-light">
                          <span style="color:rgba(248,245,236,0.85);">VOL. I</span>
                          <span style="color:rgba(248,245,236,0.35);"> &nbsp;·&nbsp; </span>
                          <span>${escapeHtml(mastheadDate)}</span>
                        </td>
                        <td align="right" class="fops-eyebrow-light">
                          ${escapeHtml(socialProof)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Wordmark row -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:26px 32px 24px;text-align:left;">
                    <span class="fops-serif fops-cream" style="font-size:36px;font-weight:700;letter-spacing:-0.5px;line-height:1;">FundOps</span><span class="fops-serif fops-amber" style="font-size:36px;font-weight:700;font-style:italic;letter-spacing:-0.5px;line-height:1;">Daily</span>
                  </td>
                </tr>
              </table>

              <!-- Bottom eyebrow strip -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:14px 32px;border-top:1px solid ${HAIRLINE_DARK};">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td class="fops-eyebrow-light" style="letter-spacing:2.5px;">
                          NEWS &nbsp;·&nbsp; NEWSLETTER &nbsp;·&nbsp; LIVE SHOW
                        </td>
                        <td align="right" class="fops-eyebrow-amber">
                          FUNDOPSHQ.COM
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ─── Sponsor: top ─── -->
          ${sponsorTop}

          <!-- ─── Content ─── -->
          <tr>
            <td class="fops-bg-cream" style="padding:32px 32px 16px;background-color:${CREAM};">
              <div class="fops-eyebrow" style="margin-bottom:6px;">
                Section A &nbsp;·&nbsp; The Wire
              </div>
              <div class="fops-serif fops-ink" style="font-size:22px;font-weight:700;line-height:1.2;margin-bottom:24px;">
                This morning&rsquo;s <span class="fops-amber" style="font-style:italic;">top stories.</span>
              </div>
              ${categoryBlocks}
            </td>
          </tr>

          <!-- ─── Main CTA ─── -->
          <tr>
            <td class="fops-bg-cream" style="padding:8px 32px 32px;background-color:${CREAM};text-align:center;">
              <a href="https://fundopshq.com/#news" class="fops-mono" style="display:inline-block;background-color:${INK};color:${CREAM};font-size:11px;font-weight:700;padding:14px 28px;border-radius:2px;text-decoration:none;letter-spacing:2px;text-transform:uppercase;">Read the full feed &rarr;</a>
            </td>
          </tr>

          <!-- ─── Sponsor: bottom ─── -->
          ${sponsorBottom}

          <!-- ─── Share this edition ─── -->
          <!-- Sits between the sponsor slot and the footer so it reads as
               a friendly closer rather than a CTA blast. mailto pre-fills
               the subject + the top story headline + the subscribe URL,
               so the recipient can click-forward in one move. LinkedIn
               and X links go through their share intents; readers hit
               their own composer, nothing auto-posts. -->
          <tr>
            <td class="fops-bg-cream" style="padding:8px 32px 28px;background-color:${CREAM};text-align:center;">
              <div class="fops-eyebrow" style="margin-bottom:10px;">Share this edition</div>
              <div class="fops-sans" style="font-size:13px;color:rgba(30,58,95,0.75);line-height:1.5;margin-bottom:14px;max-width:460px;margin-left:auto;margin-right:auto;">
                If today&rsquo;s brief was useful, forward it to a peer &mdash; that&rsquo;s how this list grows.
              </div>
              <div>
                <a href="${escapeHtml(shareMailto)}" class="fops-mono" style="display:inline-block;background-color:${INK};color:${CREAM};font-size:10px;font-weight:700;padding:10px 16px;border-radius:2px;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;margin:0 4px 6px;">Forward by email</a>
                <a href="${escapeHtml(shareLinkedIn)}" class="fops-mono" style="display:inline-block;background-color:${INK};color:${CREAM};font-size:10px;font-weight:700;padding:10px 16px;border-radius:2px;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;margin:0 4px 6px;">Post to LinkedIn</a>
                <a href="${escapeHtml(shareX)}" class="fops-mono" style="display:inline-block;background-color:${INK};color:${CREAM};font-size:10px;font-weight:700;padding:10px 16px;border-radius:2px;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;margin:0 4px 6px;">Share on X</a>
              </div>
            </td>
          </tr>

          <!-- ─── Footer ─── -->
          <tr>
            <td class="fops-bg-navy" style="padding:24px 32px;background-color:${NAVY};">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:10px;border-bottom:1px solid ${HAIRLINE_DARK};">
                    <span class="fops-serif fops-cream" style="font-size:18px;font-weight:700;letter-spacing:-0.3px;">FundOps</span><span class="fops-serif fops-amber" style="font-size:18px;font-weight:700;font-style:italic;letter-spacing:-0.3px;">Daily</span>
                    <span class="fops-mono" style="font-size:10px;color:rgba(248,245,236,0.5);letter-spacing:1.5px;margin-left:10px;text-transform:uppercase;">by FundOpsHQ</span>
                  </td>
                </tr>
                <tr>
                  <td class="fops-sans" style="padding-top:14px;font-size:11px;color:rgba(248,245,236,0.55);line-height:1.65;">
                    <p style="margin:0;">
                      You&rsquo;re receiving this because you subscribed at <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.75);text-decoration:none;">fundopshq.com</a>.
                    </p>
                    <p style="margin:6px 0 0;">
                      <a href="${escapeHtml(unsubscribeUrl)}" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Unsubscribe</a>
                      &nbsp;·&nbsp;
                      <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Visit FundOpsHQ</a>
                      &nbsp;·&nbsp;
                      <a href="https://www.youtube.com/@dbloomstine/streams" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Live Show</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return collapseTemplateWhitespace(html)
}
