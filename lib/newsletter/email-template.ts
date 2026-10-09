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
import { cleanEntityName, splitHeadlineByEntities } from '@/lib/news/constants'
import {
  formatEventDates,
  formatEventLocation,
  formatEventDayHeading,
  compactTimeNote,
} from '@/lib/events/constants'
import type { IndustryEvent } from '@/lib/events/types'
import { DEFAULT_SPONSOR_SLATE, type Sponsor, type SponsorSlate } from './sponsors'
import { arrangeEdition, kickerParts, sizeWords, type TopPick } from './top-stories'
import { entityKey, keysMatch } from './story-links'
import { pullFollowed } from './personalize'

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
  /**
   * The next week of board events (North America, plus hand-flagged exceptions). The Circuit stopped being its own
   * weekly email on 2026-08-30 (Danny) and rides at the bottom of the daily
   * instead — one send, one habit. Empty array renders no section.
   */
  events?: IndustryEvent[]
  /**
   * How many firms the list is read at (distinct work domains among confirmed
   * subscribers), counted at send time. Used by the house "Your firm here"
   * notice; omitted, the notice describes the readers without a number.
   */
  readerFirms?: number
  /**
   * The past week's largest fund closes, from the league table. The send
   * passes it on Mondays ("Last week's largest closes"); otherwise absent.
   */
  recap?: WeekRecap | null
  /**
   * What this reader said they follow (lib/newsletter/interests.ts). Their
   * stories are pulled under one heading after the top stories. Absent or
   * empty, the edition is the same for everyone.
   */
  interests?: string[]
  /** The reader's own page for changing what they follow; a footer link when given. */
  preferencesUrl?: string
  /**
   * Appended to the email's links to the sponsor page (`r=<this>`), so the page
   * can tell the owner which reader came to look (app/api/sponsor/interest).
   * The send passes a sentinel and swaps in each subscriber's id.
   */
  readerTag?: string
}

/** One row of the weekly recap: a close as the league table has it. */
export interface RecapRow {
  id: string
  firm: string
  fund: string | null
  stage: string
  sizeUsdM: number
  converted?: boolean
}
export interface WeekRecap {
  rows: RecapRow[]
  /** Final closes in the week, and their capital. */
  finals: number
  capitalUsdM: number
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
/** Amber dark enough to read as text on cream: the site's ochre. The brand amber is for fills. */
const OCHRE = '#9C6410'
/** The deeper cream of the site's bands: day heads, the frame inside a notice. */
const BAND = '#EFEADC'
const FRAME = '#B9B3A2'
/** The paper a framed notice sits on: a shade lighter than the page, as the site's cards are. */
const CARD = '#FFFDF8'

const FONT_SERIF = `Georgia, 'Times New Roman', Times, serif`
const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`
const FONT_MONO = `ui-monospace, Menlo, Consolas, 'Courier New', monospace`

// ─── Category section-head classes ─────────────────────────────────────────
// Event-type pills were removed 2026-08-15 on reader feedback ("the pills
// are becoming distracting") — the classification survives in the data and
// section placement; the row itself now leads with firm + headline.


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
.fops-bg-card { background-color: ${CARD}; }
.fops-bg-navy { background-color: ${NAVY}; }
.fops-bg-navy-deep { background-color: ${NAVY_DEEP}; }

/* Story row — dense, executive-brief style. One compact meta line
   (firm + size), headline, then a single truncated summary
   line with the source folded onto its end. ~2x the stories per screen
   vs the pre-2026-08 layout. */
.fops-row { padding: 7px 0; border-bottom: 1px solid ${HAIRLINE}; }
.fops-m { line-height: 18px; margin: 0 0 3px; }
/* Events meta line — small, muted, mono: the same hierarchy the site uses,
   where the event name carries the weight and the details recede. */
.fops-etd {
  font-family: ${FONT_MONO};
  font-size: 11.5px;
  line-height: 18px;
  color: ${INK_MUTED};
  text-transform: uppercase;
  padding: 6px 10px 6px 0;
  vertical-align: top;
  white-space: nowrap;
  width: 78px;
}
.fops-ecell {
  padding: 6px 0;
  vertical-align: top;
  border-bottom: 1px solid ${HAIRLINE};
}
.fops-etitle {
  color: ${INK};
  text-decoration: none;
  font-family: ${FONT_SERIF};
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}
/* A day in the week ahead: a tinted strip with the amber tab, as on the
   site's events board, so the eye finds "Tuesday" before it reads an event. */
.fops-eday {
  font-family: ${FONT_MONO};
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: ${INK};
  text-transform: uppercase;
  margin: 14px 0 2px;
  padding: 5px 10px;
  background-color: ${BAND};
  border-left: 4px solid ${AMBER};
}
.fops-emeta {
  font-family: ${FONT_MONO};
  font-size: 11.5px;
  line-height: 17px;
  color: ${INK_MUTED};
  letter-spacing: 0.3px;
  text-transform: uppercase;
  margin: 2px 0 0;
}
.fops-title {
  color: ${INK};
  text-decoration: none;
  font-size: 15.5px;
  font-weight: 400;
  font-family: ${FONT_SERIF};
  line-height: 1.3;
}
/* Only the actor is bold inside a headline, so the eye lands on who did
   the thing rather than on a wall of uniform bold. */
.fops-title b { font-weight: 700; }
/* Top stories: the same headline a size up, under a one-line kicker that
   says where it is from and, for a raise or a deal, how much. */
.fops-top {
  color: ${INK};
  text-decoration: none;
  font-size: 18px;
  font-weight: 400;
  font-family: ${FONT_SERIF};
  line-height: 1.27;
}
.fops-top b { font-weight: 700; }
.fops-kicker {
  font-family: ${FONT_MONO};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: ${OCHRE};
  text-transform: uppercase;
  margin: 0 0 3px;
}
.fops-blurb {
  color: ${INK_MUTED};
  font-size: 13px;
  line-height: 1.45;
  font-family: ${FONT_SANS};
  margin: 2px 0 0;
}
.fops-source {
  color: rgba(90,107,130,0.75);
  font-size: 11px;
  font-family: ${FONT_MONO};
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.fops-firm {
  color: ${INK};
  font-size: 13px;
  font-family: ${FONT_SANS};
  font-weight: 700;
  vertical-align: middle;
}

/* Category section heads — a solid navy band with reversed type.
   Danny, 2026-10-01: the old heads (12px navy label over a thin coloured
   rule) "blend in when your eye scans". They were the same navy as the
   headlines and smaller than them, so nothing marked where one section
   stopped and the next began. A filled band is a different *kind* of object
   from a row of text, which is what the eye needs to find the breaks.
   The colours are also set inline on the cell: a forwarded or quoted copy
   loses this style block, and the head would otherwise fall back to plain
   body text. */
.fops-cat { margin-bottom: 14px; }
.fops-cat-head {
  padding: 6px 10px 5px;
  background-color: ${NAVY};
  border-left: 4px solid ${AMBER};
}
.fops-cat-label {
  font-family: ${FONT_MONO};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${CREAM};
  text-transform: uppercase;
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
  margin: 0 0 8px;
  color: ${INK};
  font-size: 12px;
  line-height: 1.5;
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

/* Mobile: reclaim horizontal space. Desktop keeps the 32px editorial
   gutters; phones drop to 16px inner + 4px outer, worth ~36px of extra
   content width per line. Gmail iOS/Android, Apple Mail, and Outlook
   mobile all honor embedded media queries. */
@media only screen and (max-width: 520px) {
  .fops-shell { padding: 12px 4px !important; }
  .fops-px {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
}

/* Dark-mode opt-out re-pinning — Gmail iOS/Android auto-invert otherwise. */
@media (prefers-color-scheme: dark) {
  body, table, td, div { background-color: inherit !important; }
  .fops-bg-navy { background-color: ${NAVY} !important; }
  .fops-bg-navy-deep { background-color: ${NAVY_DEEP} !important; }
  .fops-bg-cream { background-color: ${CREAM} !important; }
  .fops-bg-card { background-color: ${CARD} !important; }
  .fops-eday { background-color: ${BAND} !important; }
  .fops-cream { color: ${CREAM} !important; }
  .fops-amber { color: ${AMBER} !important; }
  .fops-ink { color: ${INK} !important; }
  .fops-ink-muted { color: ${INK_MUTED} !important; }
}
u + .body .fops-bg-navy { background-color: ${NAVY} !important; }
u + .body .fops-bg-cream { background-color: ${CREAM} !important; }
u + .body .fops-bg-card { background-color: ${CARD} !important; }
[data-ogsc] .fops-bg-navy { background-color: ${NAVY} !important; }
[data-ogsc] .fops-bg-cream { background-color: ${CREAM} !important; }
[data-ogsc] .fops-bg-card { background-color: ${CARD} !important; }
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
  return stripComments(html)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('')
}

/**
 * The notes in this file are for whoever edits it, not for the reader's inbox.
 * Until 2026-10-02 every edition carried them — about 3KB of "why this strip
 * exists" in each message, against the size at which Gmail clips one.
 *
 * Outlook's conditional comments (`<!--[if mso]>…<![endif]-->`) are code, not
 * notes, and stay. CSS comments are removed inside <style> only: a "/*" in a
 * link elsewhere is somebody's URL.
 */
function stripComments(html: string): string {
  return html
    .replace(/<style>([\s\S]*?)<\/style>/g, (_, css: string) => `<style>${css.replace(/\/\*[\s\S]*?\*\//g, '')}</style>`)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
}

// ─── Firm identity (names only) ────────────────────────────────────────────


/**
 * Headline with its named entities bolded and the rest at regular weight.
 * Mirrors the site rows so the email and the page read the same way.
 */
function renderHeadline(article: ArticleGroup['articles'][0]): string {
  const segments = splitHeadlineByEntities(
    article.title,
    article.headlineEntities?.length
      ? article.headlineEntities
      : [article.firmName, ...article.coFirms, article.personName],
  )
  return segments
    .map((seg) => (seg.bold ? `<b>${escapeHtml(seg.text)}</b>` : escapeHtml(seg.text)))
    .join('')
}


// ─── Events: the week ahead ────────────────────────────────────────────────


/**
 * One event row, Gary's Guide-style: the time sits in a narrow left column so
 * a reader scans the day vertically by clock, and the bold event title carries
 * the row with organizer and city beneath it.
 */
function renderEvent(event: IndustryEvent): string {
  const time = compactTimeNote(event.timeNote)
  const isRange = event.endDate && event.endDate !== event.startDate
  const when = time ?? (isRange ? formatEventDates(event.startDate, event.endDate) : 'All day')

  const under = [
    cleanEntityName(event.organizerName),
    formatEventLocation(event),
    event.costType === 'free' ? 'Free' : undefined,
  ]
    .filter(Boolean)
    .join(' \u00b7 ')

  return `
    <tr>
      <td class="fops-etd">${escapeHtml(when)}</td>
      <td class="fops-ecell">
        <a href="https://fundopshq.com/events/${escapeHtml(event.slug)}" class="fops-etitle" style="color:${INK};text-decoration:none;" target="_blank">${escapeHtml(event.name)}</a>
        <div class="fops-emeta">${escapeHtml(under)}</div>
      </td>
    </tr>`
}

function renderEventsSection(events: IndustryEvent[]): string {
  if (events.length === 0) return ''

  // Group consecutive events by start date — the list arrives date-sorted.
  const days: { heading: string; events: IndustryEvent[] }[] = []
  for (const event of events) {
    const heading = formatEventDayHeading(event.startDate)
    const last = days[days.length - 1]
    if (last && last.heading === heading) last.events.push(event)
    else days.push({ heading, events: [event] })
  }

  const dayBlocks = days
    .map(
      (day) => `
              <div class="fops-eday">${escapeHtml(day.heading)}</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${day.events.map(renderEvent).join('')}
              </table>`,
    )
    .join('')

  return `
          <tr>
            <td class="fops-bg-cream fops-px" style="padding:4px 16px 12px;background-color:${CREAM};">
              <div class="fops-serif fops-ink" style="font-size:20px;font-weight:700;line-height:1.2;margin-bottom:2px;">
                The week <span class="fops-amber" style="font-style:italic;">ahead.</span>
              </div>
              <div style="font-family:${FONT_MONO};font-size:10px;line-height:15px;color:${INK_MUTED};text-transform:uppercase;">Every date verified at the organizer</div>
              ${dayBlocks}
              <div style="padding-top:12px;">
                <a href="https://fundopshq.com/events" class="fops-mono" style="color:${INK};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;">Full calendar &rarr;</a>
                <span style="color:rgba(90,107,130,0.4);">&nbsp;&nbsp;</span>
                <a href="https://fundopshq.com/events/submit" class="fops-mono" style="color:${INK};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;">Submit an event &mdash; free</a>
              </div>
            </td>
          </tr>`
}

// ─── Single story row ──────────────────────────────────────────────────────

function renderArticle(article: ArticleGroup['articles'][0]): string {
  // Headlines only (2026-08-30, Danny: "The news section of the email should
  // be like the website now. It should be headlines only"). The summary blurb
  // and source attribution are gone — the site's stream carries neither, and
  // the headline plus its bolded actor is what a reader scans. The firm still
  // appears above the headline in the rare case the headline omits it.
  return `
    <tr>
      <td class="fops-row">
        <div><a href="${escapeHtml(article.sourceUrl)}" class="fops-title" style="color:${INK};text-decoration:none;font-weight:400;" target="_blank">${renderHeadline(article)}</a></div>
      </td>
    </tr>`
}

function renderCategory(group: ArticleGroup): string {
  const articleRows = group.articles.map(renderArticle).join('')

  // fops-bg-navy / fops-cream are the classes the dark-mode block re-pins, so
  // an auto-inverting client keeps the band navy with cream type.
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" class="fops-cat">
      <tr>
        <td class="fops-cat-head fops-bg-navy" bgcolor="${NAVY}" style="background-color:${NAVY};border-left:4px solid ${AMBER};padding:6px 10px 5px;">
          <span class="fops-cat-label fops-cream" style="font-family:${FONT_MONO};font-size:12px;font-weight:700;letter-spacing:2px;color:${CREAM};text-transform:uppercase;">${escapeHtml(group.label)}</span>
        </td>
      </tr>
      ${articleRows}
    </table>`
}

// ─── Top stories ───────────────────────────────────────────────────────────
// The edition's lead: the stories lib/newsletter/top-stories.ts picked, each
// under a kicker. Font and colour are inline as well as in the style block —
// a forwarded copy loses the block, and the top of the email is what gets
// forwarded.

function renderTopStory(pick: TopPick, isLast: boolean): string {
  const kicker = kickerParts(pick).map(escapeHtml).join(' &nbsp;&middot;&nbsp; ')
  return `
    <tr>
      <td style="padding:9px 0 10px;${isLast ? '' : `border-bottom:1px solid ${HAIRLINE};`}">
        <div class="fops-kicker" style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:1.5px;color:${OCHRE};text-transform:uppercase;margin:0 0 3px;">${kicker}</div>
        <div><a href="${escapeHtml(pick.article.sourceUrl)}" class="fops-top" style="color:${INK};text-decoration:none;font-family:${FONT_SERIF};font-size:18px;font-weight:400;line-height:1.27;" target="_blank">${renderHeadline(pick.article)}</a></div>
      </td>
    </tr>`
}

function renderTopStories(top: TopPick[]): string {
  if (top.length === 0) return ''
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;border-top:2px solid ${INK};border-bottom:1px solid ${HAIRLINE};">
      ${top.map((pick, i) => renderTopStory(pick, i === top.length - 1)).join('')}
    </table>`
}

// ─── The week's largest closes (Mondays) ───────────────────────────────────
// The league table's past seven days, as a small table: who, which fund, how
// much. Each row opens the close's page on the site, where the reports are.

function renderRecap(recap: WeekRecap | null | undefined): string {
  if (!recap || recap.rows.length < 3) return ''
  const rows = recap.rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:7px 8px 7px 0;vertical-align:top;width:18px;font-family:${FONT_MONO};font-size:11px;line-height:20px;color:${INK_MUTED};border-bottom:1px solid ${HAIRLINE};">${i + 1}</td>
        <td style="padding:7px 8px 7px 0;vertical-align:top;border-bottom:1px solid ${HAIRLINE};">
          <a href="https://fundopshq.com/story/${escapeHtml(r.id)}" style="color:${INK};text-decoration:none;font-family:${FONT_SERIF};font-size:15.5px;font-weight:700;line-height:1.3;" target="_blank">${escapeHtml(r.firm)}</a>
          <div style="font-family:${FONT_SANS};font-size:12px;line-height:17px;color:${INK_MUTED};">${escapeHtml([r.fund, r.stage].filter(Boolean).join(' \u00b7 '))}</div>
        </td>
        <td align="right" style="padding:7px 0;vertical-align:top;white-space:nowrap;font-family:${FONT_MONO};font-size:14px;font-weight:700;line-height:20px;color:${INK};border-bottom:1px solid ${HAIRLINE};">${r.converted ? '&asymp;' : ''}${escapeHtml(sizeWords(r.sizeUsdM))}</td>
      </tr>`,
    )
    .join('')
  const total =
    recap.finals > 0
      ? `<b style="color:${INK};">${escapeHtml(sizeWords(recap.capitalUsdM))}</b> in ${recap.finals} final ${recap.finals === 1 ? 'close' : 'closes'} last week, as reported. `
      : ''
  return `
          <tr>
            <td class="fops-bg-cream fops-px" style="padding:4px 16px 20px;background-color:${CREAM};">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" class="fops-cat" style="margin-bottom:0;">
                <tr>
                  <td colspan="3" class="fops-cat-head fops-bg-navy" bgcolor="${NAVY}" style="background-color:${NAVY};border-left:4px solid ${AMBER};padding:6px 10px 5px;">
                    <span class="fops-cat-label fops-cream" style="font-family:${FONT_MONO};font-size:12px;font-weight:700;letter-spacing:2px;color:${CREAM};text-transform:uppercase;">Last week&rsquo;s largest closes</span>
                  </td>
                </tr>
                ${rows}
              </table>
              <div style="padding-top:8px;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${INK_MUTED};">
                ${total}<a href="https://fundopshq.com/league-tables" style="color:${INK};font-weight:600;text-decoration:underline;" target="_blank">The league tables: the month, the quarter, the year &rarr;</a>
              </div>
            </td>
          </tr>`
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

/**
 * The frame every notice in the email sits in: an ink rule outside, a hairline
 * inside — the financial pages' tombstone, and the same frame the sponsor slot
 * has on the site. Nested tables, because that is what Outlook draws. The card
 * colour is pinned in all three dark-mode layers, like the cream and the navy:
 * unpinned, Gmail on a phone in dark mode turns a pale box dark.
 */
function framed(inner: string, cellStyle: string): string {
  return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="fops-bg-card" bgcolor="${CARD}" style="border:1px solid ${INK};background-color:${CARD};">
          <tr>
            <td style="padding:3px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${FRAME};">
                <tr>
                  <td style="${cellStyle}">${inner}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`
}

const SPONSOR_PAGE = 'https://fundopshq.com/sponsor'
/** A caret after "Your firm here": the name is still to be typed. Drawn, not animated — most mail clients do not animate. */
const CARET = `<span style="display:inline-block;width:2px;height:0.78em;margin-left:3px;background-color:${AMBER};vertical-align:-0.06em;">&#8203;</span>`
const kickerStyle = `font-family:${FONT_MONO};font-size:9.5px;font-weight:700;letter-spacing:2px;color:${OCHRE};text-transform:uppercase;`

function renderSponsorCardTop(sponsor: Sponsor, label: string): string {
  const mark = renderSponsorMark(sponsor, 17)
  return framed(
    `
      <div style="${kickerStyle}margin:0 0 7px;">${escapeHtml(label)}</div>
      <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:${INK};display:inline-block;margin:0 0 6px;">${mark}</a>
      <p class="fops-sponsor-blurb" style="margin:0 0 6px;font-size:13px;">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `<a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${INK};text-decoration:underline;">${escapeHtml(sponsor.ctaText)} &rarr;</a>` : ''}`,
    'padding:11px 14px 12px;',
  )
}

function renderSponsorCardBottom(sponsor: Sponsor, label: string): string {
  const mark = renderSponsorMark(sponsor, 22)
  return framed(
    `
      <div style="${kickerStyle}margin:0 0 10px;">${escapeHtml(label)}</div>
      <a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" style="text-decoration:none;color:${INK};display:inline-block;margin:0 0 10px;">${mark}</a>
      <p class="fops-sponsor-blurb-lg" style="margin:0 0 14px;">${escapeHtml(sponsor.blurb)}</p>
      ${sponsor.ctaText ? `<a href="${escapeHtml(sponsor.ctaUrl)}" target="_blank" class="fops-cta-solid" style="color:${CREAM};background-color:${INK};text-decoration:none;">${escapeHtml(sponsor.ctaText)} &rarr;</a>` : ''}`,
    'padding:16px 18px 18px;',
  )
}

/**
 * The house notice, top: one slim line under the masthead. It is where a
 * sponsor's card goes, and it says so to the people most likely to take it —
 * the readers. Slim on purpose: a house block that filled the top of the
 * email was removed on 2026-08-30 for telling subscribers about the thing
 * they had already subscribed to.
 */
function renderHouseTop(): string {
  const inner = `
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="vertical-align:middle;">
                        <span style="${kickerStyle}">Space available</span>
                        <span style="font-family:${FONT_SERIF};font-size:19px;font-style:italic;line-height:1.1;color:${INK};white-space:nowrap;">&nbsp;Your firm here${CARET}</span>
                      </td>
                      <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:10px;">
                        <a href="${SPONSOR_PAGE}?ref=email-top" target="_blank" style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${INK};text-decoration:underline;">Sponsor this brief &rarr;</a>
                      </td>
                    </tr>
                  </table>`
  return `
    <tr>
      <td class="fops-bg-cream fops-px" style="padding:12px 16px 0;background-color:${CREAM};">
        ${framed(inner, 'padding:7px 12px 7px;')}
      </td>
    </tr>`
}

/** The line about who reads it. The number is counted at send time, never typed. */
function readerLine(readerFirms: number | undefined): string {
  return readerFirms && readerFirms >= 24
    ? `FundOps Daily is read each morning at ${readerFirms.toLocaleString('en-US')} firms: GPs, LPs, and fund service providers.`
    : 'FundOps Daily is the morning brief for GPs, LPs, and fund service providers.'
}

/** The house notice, bottom: the whole tombstone. */
function renderHouseBottom(readerFirms: number | undefined): string {
  const inner = `
                  <div style="${kickerStyle}">Space available</div>
                  <div style="font-family:${FONT_SERIF};font-size:30px;font-style:italic;line-height:1.1;color:${INK};padding-top:8px;">Your firm here${CARET}</div>
                  <div style="font-family:${FONT_SERIF};font-size:15px;line-height:1.45;color:${INK_MUTED};padding-top:9px;max-width:400px;margin:0 auto;">${escapeHtml(readerLine(readerFirms))}</div>
                  <div style="padding-top:14px;">
                    <a href="${SPONSOR_PAGE}?ref=email" target="_blank" class="fops-cta-solid" style="color:${CREAM};background-color:${INK};text-decoration:none;">Sponsor FundOps Daily &rarr;</a>
                  </div>
                  <div style="margin-top:15px;padding-top:8px;border-top:1px solid ${HAIRLINE};font-family:${FONT_MONO};font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:${INK_MUTED};">This announcement appears as a matter of record only.</div>`
  return `
    <tr>
      <td class="fops-bg-cream fops-px" style="padding:22px 16px 22px;background-color:${CREAM};border-top:1px solid ${HAIRLINE};">
        ${framed(inner, 'padding:16px 18px 11px;text-align:center;')}
      </td>
    </tr>`
}

function renderSponsorTop(slate: SponsorSlate): string {
  if (slate.sponsors.length === 0) return renderHouseTop()
  const cards = slate.sponsors.map((sponsor) => renderSponsorCardTop(sponsor, slate.label)).join('<div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>')
  return `
    <tr>
      <td class="fops-bg-cream fops-px" style="padding:12px 16px 0;background-color:${CREAM};">
        ${cards}
      </td>
    </tr>`
}

function renderSponsorBottom(slate: SponsorSlate, readerFirms: number | undefined): string {
  if (slate.sponsors.length === 0) return renderHouseBottom(readerFirms)
  const cards = slate.sponsors.map((sponsor) => renderSponsorCardBottom(sponsor, slate.label)).join('<div style="height:10px;line-height:10px;font-size:10px;">&nbsp;</div>')
  return `
    <tr>
      <td class="fops-bg-cream fops-px" style="padding:22px 16px 20px;background-color:${CREAM};border-top:1px solid ${HAIRLINE};">
        ${cards}
        ${slate.sample ? '' : `<p style="margin:12px 0 0;font-family:${FONT_SANS};font-size:11px;line-height:1.5;color:${INK_MUTED};font-style:italic;">Your firm here next. <a href="${SPONSOR_PAGE}?ref=email" target="_blank" style="color:${INK};text-decoration:none;font-weight:600;font-style:normal;">Sponsor FundOps Daily &rarr;</a></p>`}
      </td>
    </tr>`
}

/**
 * Sponsors that are also in this edition's news. The sponsor page promises
 * that such an edition says so; this is where it is found out.
 */
function sponsorsInTheNews(slate: SponsorSlate, groups: ArticleGroup[]): string[] {
  return slate.sponsors
    .filter((sponsor) => {
      const key = entityKey(sponsor.name)
      if (key.length < 3) return false
      return groups.some((g) =>
        g.articles.some((a) => [a.firmName, ...a.coFirms, ...(a.headlineEntities ?? [])].some((n) => n && keysMatch(entityKey(n), key))),
      )
    })
    .map((sponsor) => sponsor.name)
}

// ─── Preheader (inbox preview text) ────────────────────────────────────────
// Most important piece of copy in the email after the subject line: it's
// what Gmail / iOS Mail show as the preview next to the subject. Without an
// explicit preheader, clients fall back to the first visible text in <body>
// (in our case the "Forwarded to you?" strip) — a wasted first impression.

/**
 * What happened, in the publishers' own words: the lead headline, and the
 * second if there is room. The subject line already names WHO is in the news
 * ("Apax Partners, Ares Management + 37 more"); until 2026-10-02 the preview
 * text repeated those names with a figure, so the two lines an inbox shows
 * said the same thing twice.
 */
export function buildPreheader(top: TopPick[], groups: ArticleGroup[], totalArticles: number): string {
  const lead = top[0]?.article.title ?? groups[0]?.articles[0]?.title
  if (!lead) return `${totalArticles} moves across private markets this morning.`
  const second = top[1]?.article.title ?? (top.length === 0 ? groups[0]?.articles[1]?.title : undefined)
  const withSecond = second && lead.length + second.length <= 150
  const text = withSecond ? `${lead} · ${second}` : lead
  const rest = totalArticles - (withSecond ? 2 : 1)
  return rest > 0 ? `${text} · and ${rest} more this morning.` : text
}

// ─── Main render ───────────────────────────────────────────────────────────

/**
 * On the email's links to our own pages. A visitor arriving with it is reading
 * their own copy, so the site's signup card never asks them to subscribe
 * (lib/newsletter/prompt-rules.ts: arrivedAsSubscriber).
 */
const FROM_EMAIL = '?utm_source=newsletter&amp;utm_medium=email'

export function renderNewsletterEmail(params: TemplateParams): string {
  const {
    groups,
    totalArticles,
    editionDate,
    unsubscribeUrl,
    sponsorSlate = DEFAULT_SPONSOR_SLATE,
    subscriberCount,
    events = [],
    readerFirms,
    recap,
    interests,
    preferencesUrl,
    readerTag,
  } = params
  // The edition in reading order: the top stories, the reader's own section
  // if they have one, then the sections without either.
  const arranged = arrangeEdition(groups, totalArticles)
  const top = arranged.top
  const { followed, sections } = pullFollowed(arranged.sections, interests)
  const followedBlock = followed ? renderCategory(followed) : ''
  const preheader = buildPreheader(top, groups, totalArticles)
  const formattedDate = formatDate(editionDate)
  const mastheadDate = formatMastheadDate(editionDate)
  const topBlock = renderTopStories(top)
  const categoryBlocks = sections.map(renderCategory).join('')
  const sponsorTop = renderSponsorTop(sponsorSlate)
  const sponsorBottom = renderSponsorBottom(sponsorSlate, readerFirms)
  const recapSection = renderRecap(recap)
  const eventsSection = renderEventsSection(events)
  const covered = sponsorsInTheNews(sponsorSlate, groups)

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
  const topStory = top[0]?.article ?? groups[0]?.articles[0]
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
      <td align="center" class="fops-shell" style="padding:24px 10px;">
        <table cellpadding="0" cellspacing="0" border="0" width="680" style="max-width:680px;width:100%;">

          <!-- ─── Forwarded-to-you strip ─── -->
          <!-- Shown at the very top of every edition. Readers who got
               the email forwarded by a peer see a direct "subscribe"
               path. Near-zero cost to people who are already subscribers
               (they scroll past) but a meaningful conversion path for
               the (harder-to-measure) forwards. -->
          <tr>
            <td class="fops-bg-cream fops-px" style="padding:10px 16px;background-color:${CREAM};border-bottom:1px solid rgba(30,58,95,0.08);">
              <div class="fops-mono" style="font-size:10px;color:rgba(30,58,95,0.7);letter-spacing:1.5px;text-transform:uppercase;text-align:center;">
                Forwarded to you? &nbsp;<a href="https://fundopshq.com/?ref=fwd" style="color:${INK};text-decoration:underline;font-weight:700;">Subscribe to FundOps Daily &rarr;</a>
              </div>
            </td>
          </tr>

          <!-- ─── Masthead ─── -->
          <tr>
            <td class="fops-bg-navy" style="padding:0;background-color:${NAVY};">

              <!-- Wordmark row -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="fops-px" style="padding:14px 16px 10px;text-align:left;">
                    <span class="fops-serif fops-cream" style="font-size:34px;font-weight:700;letter-spacing:-0.5px;line-height:1;">FundOps</span><span class="fops-serif fops-amber" style="font-size:34px;font-weight:700;font-style:italic;letter-spacing:-0.5px;line-height:1;">Daily</span>
                  </td>
                </tr>
              </table>

              <!-- Date / readership strip -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="fops-px" style="padding:8px 16px 10px;border-top:1px solid ${HAIRLINE_DARK};">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td class="fops-eyebrow-light">${escapeHtml(mastheadDate)}</td>
                        <td align="right" class="fops-eyebrow-light">${escapeHtml(socialProof)}</td>
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
            <td class="fops-bg-cream fops-px" style="padding:20px 16px 12px;background-color:${CREAM};">
              <div class="fops-serif fops-ink" style="font-size:20px;font-weight:700;line-height:1.2;margin-bottom:${top.length > 0 ? 8 : 16}px;">
                This morning&rsquo;s <span class="fops-amber" style="font-style:italic;">top stories.</span>
              </div>
              ${topBlock}${followedBlock}
              ${categoryBlocks}
            </td>
          </tr>

          <!-- ─── Main CTA ─── -->
          <tr>
            <td class="fops-bg-cream fops-px" style="padding:8px 16px 24px;background-color:${CREAM};text-align:center;">
              <a href="https://fundopshq.com/news${FROM_EMAIL}" class="fops-mono" style="display:inline-block;background-color:${INK};color:${CREAM};font-size:11px;font-weight:700;padding:14px 28px;border-radius:2px;text-decoration:none;letter-spacing:2px;text-transform:uppercase;">Read the full feed &rarr;</a>
            </td>
          </tr>

          <!-- ─── Monday: last week's largest closes ─── -->
          ${recapSection}

          <!-- ─── The week ahead ─── -->
          ${eventsSection}

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
            <td class="fops-bg-cream fops-px" style="padding:8px 16px 20px;background-color:${CREAM};text-align:center;">
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
            <td class="fops-bg-navy fops-px" style="padding:20px 16px;background-color:${NAVY};">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:10px;border-bottom:1px solid ${HAIRLINE_DARK};">
                    <span class="fops-serif fops-cream" style="font-size:18px;font-weight:700;letter-spacing:-0.3px;">FundOps</span><span class="fops-serif fops-amber" style="font-size:18px;font-weight:700;font-style:italic;letter-spacing:-0.3px;">Daily</span>
                    <span class="fops-mono" style="font-size:10px;color:rgba(248,245,236,0.5);letter-spacing:1.5px;margin-left:10px;text-transform:uppercase;">by FundOpsHQ</span>
                  </td>
                </tr>
                <tr>
                  <td class="fops-sans" style="padding-top:14px;font-size:11px;color:rgba(248,245,236,0.55);line-height:1.65;">
                    <p style="margin:0 0 10px;">
                      <span style="color:rgba(248,245,236,0.45);">On the site:&nbsp;</span>
                      <a href="https://fundopshq.com/news${FROM_EMAIL}" style="color:rgba(248,245,236,0.8);text-decoration:underline;">Latest</a>
                      &nbsp;·&nbsp;
                      <a href="https://fundopshq.com/league-tables${FROM_EMAIL}" style="color:rgba(248,245,236,0.8);text-decoration:underline;">League tables</a>
                      &nbsp;·&nbsp;
                      <a href="https://fundopshq.com/firms${FROM_EMAIL}" style="color:rgba(248,245,236,0.8);text-decoration:underline;">Firms</a>
                      &nbsp;·&nbsp;
                      <a href="https://fundopshq.com/events${FROM_EMAIL}" style="color:rgba(248,245,236,0.8);text-decoration:underline;">Events</a>
                    </p>${
                      covered.length > 0
                        ? `
                    <p style="margin:0 0 10px;">
                      ${escapeHtml(covered.join(' and '))} ${covered.length === 1 ? 'sponsors' : 'sponsor'} this edition and ${covered.length === 1 ? 'is' : 'are'} in today&rsquo;s news. Coverage is not traded for sponsorship.
                    </p>`
                        : ''
                    }
                    <p style="margin:0;">
                      You&rsquo;re receiving this because you subscribed at <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.75);text-decoration:none;">fundopshq.com</a>.
                    </p>
                    <p style="margin:6px 0 0;">
                      <a href="${escapeHtml(unsubscribeUrl)}" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Unsubscribe</a>
                      &nbsp;·&nbsp;${
                        preferencesUrl
                          ? `
                      <a href="${escapeHtml(preferencesUrl)}" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Choose what you follow</a>
                      &nbsp;·&nbsp;`
                          : ''
                      }
                      <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Visit FundOpsHQ</a>
                      &nbsp;·&nbsp;
                      <a href="https://fundopshq.com/about" style="color:rgba(248,245,236,0.65);text-decoration:underline;">About</a>
                      &nbsp;·&nbsp;
                      <a href="https://fundopshq.com/sponsor" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Sponsor</a>
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

  const out = collapseTemplateWhitespace(html)
  return readerTag ? tagSponsorLinks(out, readerTag) : out
}

/** Every link to our own sponsor page gains `r=<tag>`: the house notice's two buttons and the footer's link. */
export function tagSponsorLinks(html: string, tag: string): string {
  return html.replace(/href="https:\/\/fundopshq\.com\/sponsor(\?[^"]*)?"/g, (_m, query: string | undefined) =>
    `href="https://fundopshq.com/sponsor${query ? `${query}&amp;` : '?'}r=${tag}"`)
}
