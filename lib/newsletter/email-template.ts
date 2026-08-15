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
import { formatFundSize, isLikelyAumLeak } from './query-articles'
import { getPrimaryLogoUrl, resolveFirmLogoDomain } from '@/lib/news/firm-logo-url'
import { getFirmDomain } from '@/lib/news/firm-logos'
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

// ─── Category section-head classes ─────────────────────────────────────────
// Event-type pills were removed 2026-08-15 on reader feedback ("the pills
// are becoming distracting") — the classification survives in the data and
// section placement; the row itself now leads with firm + headline.

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
  service_providers: 'fops-c-sp',
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

/* Story row — dense, executive-brief style. One compact meta line
   (favicons + firm + size), headline, then a single truncated summary
   line with the source folded onto its end. ~2x the stories per screen
   vs the pre-2026-08 layout. */
.fops-row { padding: 9px 0; border-bottom: 1px solid ${HAIRLINE}; }
.fops-m { line-height: 18px; margin: 0 0 3px; }
.fops-title {
  color: ${INK};
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
  font-family: ${FONT_SERIF};
  line-height: 1.35;
}
.fops-size {
  color: ${INK};
  font-size: 11px;
  font-family: ${FONT_MONO};
  font-weight: 700;
  padding-left: 6px;
}
.fops-blurb {
  color: ${INK_MUTED};
  font-size: 12px;
  line-height: 1.5;
  font-family: ${FONT_SANS};
  margin: 2px 0 0;
}
.fops-source {
  color: rgba(90,107,130,0.75);
  font-size: 10px;
  font-family: ${FONT_MONO};
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.fops-firm {
  color: ${INK};
  font-size: 12px;
  font-family: ${FONT_SANS};
  font-weight: 700;
  vertical-align: middle;
}

/* Category section heads */
.fops-cat { margin-bottom: 16px; }
.fops-cat-head {
  padding-bottom: 5px;
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
.fops-c-sp { border-bottom-color: #475569; }
.fops-c-ppl { border-bottom-color: #8B5CF6; }
.fops-c-deals { border-bottom-color: #0891B2; }
.fops-c-reg { border-bottom-color: #DC2626; }
.fops-c-default { border-bottom-color: ${INK_MUTED}; }

/* Firm logo — 18px inline favicon(s) on the meta line. */
.fops-logo {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  vertical-align: middle;
  background: #FFFFFF;
  border: 1px solid ${HAIRLINE};
  margin-right: 5px;
}
.fops-logo-img { object-fit: contain; }
.fops-logo-fallback {
  display: inline-block;
  color: ${INK};
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
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

// ─── Firm logos (circular favicon with white tile) ─────────────────────────

function logoImg(domain: string, alt: string): string {
  const logoUrl = getPrimaryLogoUrl(domain)
  return `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(alt)}" width="18" height="18" class="fops-logo fops-logo-img" />`
}

/**
 * Favicon strip + firm names for the meta line. Renders the primary firm's
 * favicon plus up to two co-firm favicons (M&A counterparties, co-managers).
 *
 * Accuracy rules:
 *   - A favicon next to a firm name must come from THAT firm (curated map
 *     or classify-time domain) — never from the news outlet.
 *   - Co-firm favicons come from the curated map only; an unmapped co-firm
 *     still shows its name, just without an icon.
 *   - No firm at all → no favicon and no label (the headline carries it);
 *     an outlet favicon would only mislead.
 */
function renderMetaIdentity(article: ArticleGroup['articles'][0]): string {
  const parts: string[] = []
  const names: string[] = []

  if (article.firmName) {
    const primaryDomain = resolveFirmLogoDomain(article.firmName, article.firmDomain)
    if (primaryDomain) {
      parts.push(logoImg(primaryDomain, article.firmName[0].toUpperCase()))
    } else {
      parts.push(
        `<span class="fops-logo fops-logo-fallback">${escapeHtml(article.firmName[0].toUpperCase())}</span>`
      )
    }
    names.push(article.firmName)

    for (const coFirm of article.coFirms.slice(0, 2)) {
      const coDomain = getFirmDomain(coFirm)
      if (coDomain) parts.push(logoImg(coDomain, coFirm[0].toUpperCase()))
      names.push(coFirm)
    }
  }

  if (names.length === 0) return ''
  const nameHtml = `<span class="fops-firm">${names.map(escapeHtml).join(' <span style="color:rgba(90,107,130,0.5);font-weight:400;">·</span> ')}</span>`
  return parts.join('') + nameHtml
}

/** Truncate a summary at a word boundary so the blurb stays ~one line. */
function truncateBlurb(text: string, max = 150): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[,;:.\s]+$/, '')}…`
}

// ─── Single story row ──────────────────────────────────────────────────────

function renderArticle(article: ArticleGroup['articles'][0]): string {
  // Suppress size on likely AUM leaks (e.g. 4/18 "Nest $81B" where
  // classifier put £60bn firm AUM into fund_size_usd_millions on an
  // unnamed private-credit mandate). Same rail as buildSubject.
  const size = isLikelyAumLeak(article.fundSizeUsdMillions, article.fundName)
    ? ''
    : formatFundSize(article.fundSizeUsdMillions)

  const identity = renderMetaIdentity(article)
  const sizeHtml = size ? `<span class="fops-size">${escapeHtml(size)}</span>` : ''
  const metaLine =
    identity || sizeHtml ? `<div class="fops-m">${identity}${sizeHtml}</div>` : ''

  const extraSources = article.alsoCoveredBy?.length
    ? ` +${article.alsoCoveredBy.length}`
    : ''
  const sourceHtml = article.sourceName
    ? ` <span class="fops-source">&mdash; ${escapeHtml(article.sourceName)}${extraSources}</span>`
    : ''

  const blurbHtml = article.tldr
    ? `<div class="fops-blurb">${escapeHtml(truncateBlurb(article.tldr))}${sourceHtml}</div>`
    : `<div class="fops-blurb">${sourceHtml}</div>`

  return `
    <tr>
      <td class="fops-row">
        ${metaLine}
        <div><a href="${escapeHtml(article.sourceUrl)}" class="fops-title" style="color:${INK};text-decoration:none;" target="_blank">${escapeHtml(article.title)}</a></div>
        ${blurbHtml}
      </td>
    </tr>`
}

// ─── Category section head ─────────────────────────────────────────────────

function renderCategory(group: ArticleGroup): string {
  const categoryClass = CATEGORY_CLASS[group.category] ?? 'fops-c-default'
  const articleRows = group.articles.map(renderArticle).join('')
  const count = group.articles.length
  const countLabel = `${count} ${count === 1 ? 'MOVE' : 'MOVES'}`

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

// Sponsor cards stack vertically: logo on top, blurb + CTA below. An
// earlier side-by-side (logo-left / text-right) layout saved ~40px of
// vertical space but compressed the blurb into a ~200px column on
// mobile, causing each word to wrap to its own line. Vertical stack
// renders cleanly on desktop Gmail AND narrow mobile widths without
// needing media queries (which Outlook strips).
function renderSponsorMark(sponsor: Sponsor, logoHeightPx: number): string {
  if (sponsor.wordmarkHtml) return sponsor.wordmarkHtml
  if (sponsor.logoUrl) {
    const width = sponsor.logoWidth ?? logoHeightPx * 5
    return `<img src="${escapeHtml(sponsor.logoUrl)}" alt="${escapeHtml(sponsor.name)}" width="${width}" style="width:${width}px;height:auto;display:block;max-width:100%;" />`
  }
  return `<span class="fops-serif fops-ink" style="display:inline-block;font-size:${logoHeightPx}px;font-weight:800;letter-spacing:-0.3px;line-height:1;">${escapeHtml(sponsor.name)}</span>`
}

function renderSponsorCardTop(sponsor: Sponsor, isFirst: boolean): string {
  const mark = renderSponsorMark(sponsor, 18)
  const padTopBottom = isFirst ? '6px 0 14px' : '14px 0'
  const borderTop = isFirst ? '' : `border-top:1px solid ${HAIRLINE};`
  return `
    <div style="padding:${padTopBottom};${borderTop}">
      <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:${INK};display:inline-block;margin:0 0 10px;">${mark}</a>
      <p class="fops-sponsor-blurb" style="margin:0 0 8px;">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `<a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" class="fops-cta-outline" style="color:${INK};text-decoration:none;">${escapeHtml(sponsor.ctaText)} &rarr;</a>` : ''}
    </div>`
}

function renderSponsorCardBottom(sponsor: Sponsor, isFirst: boolean): string {
  const mark = renderSponsorMark(sponsor, 20)
  const padTopBottom = isFirst ? '6px 0 18px' : '18px 0'
  const borderTop = isFirst ? '' : `border-top:1px solid ${HAIRLINE};`
  return `
    <div style="padding:${padTopBottom};${borderTop}">
      <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:${INK};display:inline-block;margin:0 0 12px;">${mark}</a>
      <p class="fops-sponsor-blurb-lg" style="margin:0 0 12px;">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `<a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" class="fops-cta-solid" style="color:${CREAM};background-color:${INK};text-decoration:none;">${escapeHtml(sponsor.ctaText)} &rarr;</a>` : ''}
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

// ─── Preheader (inbox preview text) ────────────────────────────────────────
// Most important piece of copy in the email after the subject line: it's
// what Gmail / iOS Mail show as the preview next to the subject. Without an
// explicit preheader, clients fall back to the first visible text in <body>
// (in our case the "Forwarded to you?" strip) — a wasted first impression.
// We build it from the top 2 size-led GP fund events, same rail as
// buildSubject in send-daily.ts.

function buildPreheader(groups: ArticleGroup[], totalArticles: number): string {
  const typePriority: Record<string, number> = {
    fund_close: 3,
    fund_launch: 2,
    capital_raise: 1,
  }
  type Candidate = { firm: string; sizeStr: string; size: number; priority: number }
  const candidates: Candidate[] = []
  for (const group of groups) {
    if (group.category === 'lp_commitments') continue
    for (const article of group.articles) {
      if (!article.firmName) continue
      const prio = typePriority[article.eventType ?? ''] ?? -1
      if (prio < 0) continue
      const size = article.fundSizeUsdMillions ?? 0
      if (size <= 0) continue
      if (isLikelyAumLeak(size, article.fundName)) continue
      const sizeStr =
        size >= 1000
          ? `$${(size / 1000).toFixed(1).replace(/\.0$/, '')}B`
          : `$${size}M`
      candidates.push({ firm: article.firmName, sizeStr, size, priority: prio })
    }
  }
  candidates.sort((a, b) => b.priority - a.priority || b.size - a.size)
  const top = candidates.slice(0, 2)
  if (top.length === 0) {
    return `${totalArticles} moves across private markets this morning — fund launches, closes, exec changes, regulatory actions.`
  }
  const headlines = top.map((c) => `${c.firm} ${c.sizeStr}`).join(' · ')
  const remaining = totalArticles - top.length
  return remaining > 0
    ? `${headlines} · + ${remaining} more moves across private markets.`
    : `${headlines}.`
}

// ─── Main render ───────────────────────────────────────────────────────────

export function renderNewsletterEmail(params: TemplateParams): string {
  const {
    groups,
    totalArticles,
    editionDate,
    unsubscribeUrl,
    sponsorSlate = DEFAULT_SPONSOR_SLATE,
    subscriberCount,
  } = params
  const preheader = buildPreheader(groups, totalArticles)
  const formattedDate = formatDate(editionDate)
  const mastheadDate = formatMastheadDate(editionDate)
  const categoryBlocks = groups.map(renderCategory).join('')
  const sponsorTop = renderSponsorTop(sponsorSlate)
  const sponsorBottom = renderSponsorBottom(sponsorSlate)

  // Social-proof eyebrow fragment. Omitted when count is unavailable
  // (test sends) or absurdly small. "In private markets" is the
  // canonical short-form audience phrase (per workspace CLAUDE.md) —
  // covers GPs, LPs, and fund service providers without overclaiming.
  const socialProof =
    subscriberCount && subscriberCount >= 25
      ? `READ BY ${subscriberCount} IN PRIVATE MARKETS`
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
  <!-- Preheader: inbox preview text. Hidden in the rendered email,
       shown by Gmail/iOS Mail next to the subject line. Zero-width
       whitespace padding prevents the next visible text (the
       "Forwarded to you?" strip) from bleeding into the preview. -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">
    ${escapeHtml(preheader)}
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>
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
                          PE &nbsp;·&nbsp; VC &nbsp;·&nbsp; CREDIT &nbsp;·&nbsp; REAL ESTATE &nbsp;·&nbsp; INFRA
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
              <div class="fops-eyebrow" style="margin-bottom:4px;">
                Section A &nbsp;·&nbsp; The Wire
              </div>
              <div class="fops-serif fops-ink" style="font-size:20px;font-weight:700;line-height:1.2;margin-bottom:16px;">
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
                      <a href="https://fundopshq.com/about" style="color:rgba(248,245,236,0.65);text-decoration:underline;">About</a>
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
