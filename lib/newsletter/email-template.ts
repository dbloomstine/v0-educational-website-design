/**
 * HTML email template for FundOps Daily newsletter.
 *
 * Editorial newsroom treatment matching the fundopshq.com brand:
 * deep navy header with a newspaper masthead strip, cream editorial
 * body, amber accent on the daily mark, Georgia for display serif,
 * monospace eyebrows for dates and categories.
 *
 * Uses inline CSS only — email clients strip external stylesheets.
 * System fonts only — Google Fonts and @font-face are unreliable.
 * Tested for Gmail, Outlook, Apple Mail compatibility.
 */

import type { ArticleGroup } from './query-articles'
import { getEventTypeLabel, formatFundSize } from './query-articles'
import { getPrimaryLogoUrl, resolveLogoDomain } from '@/lib/news/firm-logo-url'
import { DEFAULT_SPONSOR_SLATE, type Sponsor, type SponsorSlate } from './sponsors'

interface TemplateParams {
  groups: ArticleGroup[]
  totalArticles: number
  editionDate: string
  unsubscribeUrl: string
  sponsorSlate?: SponsorSlate
}

// ─── Brand palette ──────────────────────────────────────────────────────────
// These match the canonical brand colors exposed in app/brand/page.tsx.

const NAVY = '#1E3A5F'
const NAVY_DEEP = '#0F1E33'
const CREAM = '#F8F5EC'
const AMBER = '#E6B045'
const INK = '#1E3A5F' // body text on cream
const INK_MUTED = '#5A6B82' // secondary text on cream
const HAIRLINE = '#D8D0BC' // divider line on cream
const HAIRLINE_DARK = 'rgba(248,245,236,0.18)' // divider on navy

// ─── Typography stacks ─────────────────────────────────────────────────────
// All system fonts — nothing that needs to load from the web.

const FONT_SERIF = `Georgia, 'Times New Roman', Times, serif`
const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`
const FONT_MONO = `ui-monospace, Menlo, Consolas, 'Courier New', monospace`

// ─── Event type badges (editorial, muted) ──────────────────────────────────

const EVENT_BADGE_COLORS: Record<string, string> = {
  fund_launch: '#3B6BA5',
  fund_close: '#9D3B5F',
  capital_raise: '#3E7A4E',
  executive_hire: '#6B5B8A',
  executive_change: '#6B5B8A',
  executive_departure: '#6B5B8A',
  acquisition: '#3B6BA5',
  merger: '#3B6BA5',
  regulatory_action: '#B13B2E',
}

// ─── Category accent bars ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  PE: '#4F46E5',
  VC: '#059669',
  credit: '#D97706',
  hedge: '#7C3AED',
  real_estate: '#EA580C',
  infrastructure: '#0284C7',
  secondaries: '#DB2777',
  gp_stakes: '#0D9488',
  lp_commitments: AMBER,
  people_moves: '#8B5CF6',
  deals: '#0891B2',
  regulatory: '#DC2626',
}

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
    return `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(initial)}" width="22" height="22" style="width:22px;height:22px;border-radius:50%;vertical-align:middle;background:${CREAM};object-fit:contain;border:1px solid ${HAIRLINE};" />`
  }
  return `<span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${CREAM};border:1px solid ${HAIRLINE};color:${INK};font-size:11px;font-weight:700;line-height:20px;text-align:center;vertical-align:middle;font-family:${FONT_SERIF};">${escapeHtml(initial)}</span>`
}

// ─── Single story row ──────────────────────────────────────────────────────

function renderArticle(article: ArticleGroup['articles'][0]): string {
  const badgeColor = EVENT_BADGE_COLORS[article.eventType ?? ''] ?? INK_MUTED
  const label = getEventTypeLabel(article.eventType)
  const size = formatFundSize(article.fundSizeUsdMillions)
  const logo = renderFirmLogo(article)
  const firmLabel = article.firmName
    ? `<span style="color:${INK_MUTED};font-size:12px;font-family:${FONT_SANS};">${escapeHtml(article.firmName)}</span> `
    : ''

  const badge = label
    ? `<span style="display:inline-block;font-size:9px;font-weight:700;padding:2px 6px;border:1px solid ${badgeColor};color:${badgeColor};letter-spacing:1.2px;text-transform:uppercase;font-family:${FONT_MONO};border-radius:2px;white-space:nowrap;background:${CREAM};">${escapeHtml(label)}</span>`
    : ''

  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${HAIRLINE};">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:top;padding-right:10px;width:62px;">
              ${badge}
            </td>
            <td style="vertical-align:top;padding-right:10px;width:26px;">
              ${logo}
            </td>
            <td style="vertical-align:top;">
              <div style="margin-bottom:4px;">
                ${firmLabel}<a href="${escapeHtml(article.sourceUrl)}" style="color:${INK};text-decoration:none;font-size:15px;font-weight:700;font-family:${FONT_SERIF};line-height:1.35;" target="_blank">${escapeHtml(article.title)}</a>${size ? ` <span style="color:${INK_MUTED};font-size:12px;font-family:${FONT_MONO};font-weight:600;">(${escapeHtml(size)})</span>` : ''}
              </div>
              ${article.tldr ? `<div style="color:${INK_MUTED};font-size:13px;margin-top:4px;line-height:1.55;font-family:${FONT_SANS};">${escapeHtml(article.tldr)}</div>` : ''}
              <div style="color:${INK_MUTED};font-size:10px;margin-top:6px;font-family:${FONT_MONO};letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(article.sourceName ?? '')}${article.alsoCoveredBy && article.alsoCoveredBy.length > 0 ? ` &nbsp;·&nbsp; ALSO: ${article.alsoCoveredBy.slice(0, 3).map(escapeHtml).join(', ')}` : ''}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

// ─── Category section head ─────────────────────────────────────────────────

function renderCategory(group: ArticleGroup): string {
  const color = CATEGORY_COLORS[group.category] ?? INK
  const articleRows = group.articles.map(renderArticle).join('')
  const count = group.articles.length
  const countLabel = `${count} ${count === 1 ? 'STORY' : 'STORIES'}`

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="padding-bottom:10px;border-bottom:2px solid ${color};">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <span style="font-family:${FONT_MONO};font-size:12px;font-weight:700;letter-spacing:2px;color:${INK};text-transform:uppercase;">${escapeHtml(group.label)}</span>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="font-family:${FONT_MONO};font-size:10px;color:${INK_MUTED};letter-spacing:1.5px;">${countLabel}</span>
              </td>
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
  return `<span style="display:inline-block;font-size:${logoHeightPx}px;font-weight:800;color:${INK};letter-spacing:-0.3px;line-height:1;font-family:${FONT_SERIF};">${escapeHtml(sponsor.name)}</span>`
}

function renderSponsorCardTop(sponsor: Sponsor, isFirst: boolean): string {
  const mark = renderSponsorMark(sponsor, 20)
  return `
    <div style="padding:${isFirst ? '6px 0 18px' : '18px 0'};${isFirst ? '' : `border-top:1px solid ${HAIRLINE};`}">
      <div style="margin-bottom:10px;">
        <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:inherit;display:inline-block;">${mark}</a>
      </div>
      <p style="margin:0 0 12px;color:${INK};font-size:13px;line-height:1.6;font-family:${FONT_SANS};">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `
      <div>
        <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="display:inline-block;font-size:10px;font-weight:700;color:${INK};text-decoration:none;border:1px solid ${INK};padding:6px 12px;border-radius:2px;letter-spacing:1.5px;text-transform:uppercase;font-family:${FONT_MONO};">${escapeHtml(sponsor.ctaText)} &rarr;</a>
      </div>` : ''}
    </div>`
}

function renderSponsorCardBottom(sponsor: Sponsor, isFirst: boolean): string {
  const mark = renderSponsorMark(sponsor, 24)
  return `
    <div style="padding:${isFirst ? '6px 0 22px' : '22px 0'};${isFirst ? '' : `border-top:1px solid ${HAIRLINE};`}">
      <div style="margin-bottom:12px;">
        <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:inherit;display:inline-block;">${mark}</a>
      </div>
      <p style="margin:0 0 16px;color:${INK};font-size:14px;line-height:1.65;font-family:${FONT_SANS};">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `
      <div>
        <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="display:inline-block;font-size:11px;font-weight:700;color:${CREAM};background:${INK};text-decoration:none;padding:10px 18px;border-radius:2px;letter-spacing:1.5px;text-transform:uppercase;font-family:${FONT_MONO};">${escapeHtml(sponsor.ctaText)} &rarr;</a>
      </div>` : ''}
    </div>`
}

function renderSponsorTop(slate: SponsorSlate): string {
  if (slate.sponsors.length === 0) return ''
  const cards = slate.sponsors
    .map((sponsor, i) => renderSponsorCardTop(sponsor, i === 0))
    .join('')
  return `
    <tr>
      <td style="padding:20px 32px 18px;background-color:${CREAM};border-bottom:1px solid ${HAIRLINE};">
        <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${INK_MUTED};margin-bottom:6px;text-transform:uppercase;">${escapeHtml(slate.label)}</div>
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
      <td style="padding:28px 32px 28px;background-color:${CREAM};border-top:1px solid ${HAIRLINE};">
        <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${INK_MUTED};margin-bottom:6px;text-transform:uppercase;">${escapeHtml(slate.label)}</div>
        ${cards}
        <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${HAIRLINE};color:${INK_MUTED};font-size:11px;line-height:1.55;font-family:${FONT_SANS};font-style:italic;">Reach GPs, LPs, and fund service providers every morning. <a href="mailto:dbloomstine@gmail.com?subject=FundOps%20Daily%20sponsorship" style="color:${INK};text-decoration:none;font-weight:600;font-style:normal;">Sponsor FundOps Daily &rarr;</a></p>
      </td>
    </tr>`
}

// ─── Main render ───────────────────────────────────────────────────────────

export function renderNewsletterEmail(params: TemplateParams): string {
  const { groups, editionDate, unsubscribeUrl, sponsorSlate = DEFAULT_SPONSOR_SLATE } = params
  const formattedDate = formatDate(editionDate)
  const mastheadDate = formatMastheadDate(editionDate)
  const categoryBlocks = groups.map(renderCategory).join('')
  const sponsorTop = renderSponsorTop(sponsorSlate)
  const sponsorBottom = renderSponsorBottom(sponsorSlate)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>FundOps Daily — ${formattedDate}</title>
  <!--[if mso]>
  <style>table{border-collapse:collapse;}td{font-family:Georgia,serif;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${NAVY_DEEP};font-family:${FONT_SANS};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${NAVY_DEEP};">
    <tr>
      <td align="center" style="padding:24px 10px;">
        <table cellpadding="0" cellspacing="0" border="0" width="680" style="max-width:680px;width:100%;">

          <!-- ─── Masthead ─── -->
          <tr>
            <td style="padding:0;background-color:${NAVY};">

              <!-- Top eyebrow strip -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:14px 32px 12px;border-bottom:1px solid ${HAIRLINE_DARK};">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${CREAM};color-opacity:0.7;text-transform:uppercase;">
                          <span style="color:rgba(248,245,236,0.85);">VOL. I</span>
                          <span style="color:rgba(248,245,236,0.35);"> &nbsp;·&nbsp; </span>
                          <span style="color:rgba(248,245,236,0.7);">${escapeHtml(mastheadDate)}</span>
                        </td>
                        <td align="right" style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(248,245,236,0.7);text-transform:uppercase;">
                          THE DAILY BRIEF
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
                    <span style="font-family:${FONT_SERIF};font-size:36px;font-weight:700;color:${CREAM};letter-spacing:-0.5px;line-height:1;">FundOps</span><span style="font-family:${FONT_SERIF};font-size:36px;font-weight:700;font-style:italic;color:${AMBER};letter-spacing:-0.5px;line-height:1;">Daily</span>
                  </td>
                </tr>
              </table>

              <!-- Bottom eyebrow strip -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:14px 32px;border-top:1px solid ${HAIRLINE_DARK};">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2.5px;color:rgba(248,245,236,0.6);text-transform:uppercase;">
                          NEWS &nbsp;·&nbsp; NEWSLETTER &nbsp;·&nbsp; LIVE SHOW
                        </td>
                        <td align="right" style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${AMBER};text-transform:uppercase;">
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
            <td style="padding:32px 32px 16px;background-color:${CREAM};">
              <!-- Section eyebrow -->
              <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${INK_MUTED};text-transform:uppercase;margin-bottom:6px;">
                Section A &nbsp;·&nbsp; The Wire
              </div>
              <div style="font-family:${FONT_SERIF};font-size:22px;font-weight:700;color:${INK};line-height:1.2;margin-bottom:24px;">
                This morning&rsquo;s <span style="font-style:italic;color:${AMBER};">top stories.</span>
              </div>
              ${categoryBlocks}
            </td>
          </tr>

          <!-- ─── Main CTA ─── -->
          <tr>
            <td style="padding:8px 32px 32px;background-color:${CREAM};text-align:center;">
              <a href="https://fundopshq.com/#news" style="display:inline-block;background-color:${INK};color:${CREAM};font-family:${FONT_MONO};font-size:11px;font-weight:700;padding:14px 28px;border-radius:2px;text-decoration:none;letter-spacing:2px;text-transform:uppercase;">Read the full feed &rarr;</a>
            </td>
          </tr>

          <!-- ─── Sponsor: bottom ─── -->
          ${sponsorBottom}

          <!-- ─── Footer ─── -->
          <tr>
            <td style="padding:24px 32px;background-color:${NAVY};">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:10px;border-bottom:1px solid ${HAIRLINE_DARK};">
                    <span style="font-family:${FONT_SERIF};font-size:18px;font-weight:700;color:${CREAM};letter-spacing:-0.3px;">FundOps</span><span style="font-family:${FONT_SERIF};font-size:18px;font-weight:700;font-style:italic;color:${AMBER};letter-spacing:-0.3px;">Daily</span>
                    <span style="font-family:${FONT_MONO};font-size:10px;color:rgba(248,245,236,0.5);letter-spacing:1.5px;margin-left:10px;text-transform:uppercase;">by FundOpsHQ</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;font-family:${FONT_SANS};font-size:11px;color:rgba(248,245,236,0.55);line-height:1.65;">
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
}
