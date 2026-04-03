/**
 * HTML email template for FundOps Daily newsletter.
 *
 * Uses inline CSS only — email clients strip external stylesheets.
 * Tested for Gmail, Outlook, Apple Mail compatibility.
 */

import type { ArticleGroup } from './query-articles'
import { getEventTypeLabel, formatFundSize } from './query-articles'
import { getFirmDomain } from '@/lib/news/firm-logos'

interface TemplateParams {
  introText: string
  groups: ArticleGroup[]
  totalArticles: number
  editionDate: string
  unsubscribeUrl: string
}

const EVENT_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  fund_launch: { bg: '#dbeafe', text: '#1e40af' },
  fund_close: { bg: '#fce7f3', text: '#9d174d' },
  capital_raise: { bg: '#dcfce7', text: '#166534' },
  executive_hire: { bg: '#ede9fe', text: '#5b21b6' },
  executive_change: { bg: '#ede9fe', text: '#5b21b6' },
  executive_departure: { bg: '#ede9fe', text: '#5b21b6' },
  acquisition: { bg: '#dbeafe', text: '#1e40af' },
  merger: { bg: '#dbeafe', text: '#1e40af' },
  regulatory_action: { bg: '#fef2f2', text: '#991b1b' },
}

const CATEGORY_COLORS: Record<string, string> = {
  PE: '#4f46e5',
  VC: '#059669',
  credit: '#d97706',
  hedge: '#7c3aed',
  real_estate: '#ea580c',
  infrastructure: '#0284c7',
  secondaries: '#db2777',
  gp_stakes: '#0d9488',
  people_moves: '#8b5cf6',
  deals: '#0891b2',
  regulatory: '#dc2626',
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

function renderFirmLogo(article: ArticleGroup['articles'][0]): string {
  // Use curated domain map first, then fall back to pipeline domain, then letter initial
  const resolvedDomain = getFirmDomain(article.firmName) ?? article.firmDomain
  if (resolvedDomain) {
    const initial = (article.firmName ?? '?')[0].toUpperCase()
    // Use Google Favicons API with a letter-initial fallback via alt text
    return `<img src="https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${escapeHtml(resolvedDomain)}&size=128" alt="${escapeHtml(initial)}" width="20" height="20" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;background:#e2e8f0;" />`
  }
  // No domain — show letter initial in a circle
  const initial = (article.firmName ?? '?')[0].toUpperCase()
  return `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#e2e8f0;color:#475569;font-size:11px;font-weight:600;line-height:20px;text-align:center;vertical-align:middle;">${escapeHtml(initial)}</span>`
}

function renderArticle(article: ArticleGroup['articles'][0]): string {
  const badge = EVENT_BADGE_COLORS[article.eventType ?? ''] ?? { bg: '#f1f5f9', text: '#475569' }
  const label = getEventTypeLabel(article.eventType)
  const size = formatFundSize(article.fundSizeUsdMillions)
  const logo = renderFirmLogo(article)
  const firmLabel = article.firmName ? `<span style="color:#64748b;font-size:12px;">${escapeHtml(article.firmName)}</span> ` : ''

  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:top;padding-right:8px;width:60px;">
              ${label ? `<span style="display:inline-block;background:${badge.bg};color:${badge.text};font-size:11px;font-weight:600;padding:2px 6px;border-radius:3px;white-space:nowrap;">${escapeHtml(label)}</span>` : ''}
            </td>
            <td style="vertical-align:top;padding-right:8px;width:24px;">
              ${logo}
            </td>
            <td style="vertical-align:top;">
              <div>
                ${firmLabel}<a href="${escapeHtml(article.sourceUrl)}" style="color:#1e293b;text-decoration:none;font-size:14px;font-weight:600;" target="_blank">${escapeHtml(article.title)}</a>${size ? ` <span style="color:#64748b;font-size:12px;">(${escapeHtml(size)})</span>` : ''}
              </div>
              ${article.tldr ? `<div style="color:#475569;font-size:13px;margin-top:3px;line-height:1.5;">${escapeHtml(article.tldr)}</div>` : ''}
              <div style="color:#64748b;font-size:11px;margin-top:3px;">${escapeHtml(article.sourceName ?? '')}${article.alsoCoveredBy && article.alsoCoveredBy.length > 0 ? ` &middot; Also: ${article.alsoCoveredBy.slice(0, 3).map(escapeHtml).join(', ')}` : ''}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

function renderCategory(group: ArticleGroup): string {
  const color = CATEGORY_COLORS[group.category] ?? '#6b7280'
  const articleRows = group.articles.map(renderArticle).join('')

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="padding-bottom:8px;">
          <span style="display:inline-block;background:${color};color:#ffffff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(group.label)}</span>
          <span style="color:#94a3b8;font-size:12px;margin-left:8px;">${group.articles.length} ${group.articles.length === 1 ? 'story' : 'stories'}</span>
        </td>
      </tr>
      ${articleRows}
    </table>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderNewsletterEmail(params: TemplateParams): string {
  const { introText, groups, totalArticles, editionDate, unsubscribeUrl } = params
  const formattedDate = formatDate(editionDate)
  const categoryBlocks = groups.map(renderCategory).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>FundOps Daily — ${formattedDate}</title>
  <!--[if mso]>
  <style>table{border-collapse:collapse;}td{font-family:Arial,sans-serif;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 24px 16px;background-color:#1e293b;border-radius:8px 8px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.5px;">FundOps</span><span style="font-size:22px;font-weight:700;color:#60a5fa;letter-spacing:-0.5px;">Daily</span>
                  </td>
                  <td align="right" style="color:#94a3b8;font-size:12px;">
                    ${escapeHtml(formattedDate)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Articles by category -->
          <tr>
            <td style="padding:24px;background-color:#ffffff;">
              ${categoryBlocks}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:16px 24px 24px;background-color:#ffffff;text-align:center;">
              <a href="https://fundopshq.com/news" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:6px;text-decoration:none;">View All News on FundOpsHQ</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="color:#64748b;font-size:11px;line-height:1.6;">
                    <p style="margin:0;">
                      <strong style="color:#475569;">FundOps Daily</strong> by <a href="https://fundopshq.com" style="color:#475569;text-decoration:none;">FundOpsHQ</a>
                    </p>
                    <p style="margin:6px 0 0;">
                      You're receiving this because you subscribed at fundopshq.com.
                    </p>
                    <p style="margin:6px 0 0;">
                      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
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
