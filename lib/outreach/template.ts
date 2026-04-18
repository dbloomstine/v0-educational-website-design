/**
 * Email template + quality gate for the outreach pipeline.
 *
 * v5 template (2026-04-18):
 *
 *   - Drops the 2-line "Founder & Host, FundOpsHQ" signature. Personal-
 *     style cold outreach converts better when it looks like a 1:1 note,
 *     not a marketing signature block. Signature is just "Danny" now.
 *   - Hook in the body is now story-type-specific, built from structured
 *     extracted_data (fund name, size, event type). Pure template
 *     substitution — no LLM, inherits v4's anti-hallucination posture.
 *   - Subscribe URL carries a base64(email) query param so clicking
 *     lands on the homepage with the form pre-filled and a one-click
 *     confirm button.
 *
 * v4 history (2026-04-15, kept for context):
 *   1. H.I.G. / Infinedi collision — stale Apollo record sent a hook
 *      about one firm to a contact at a different firm with the same
 *      person name. Fixed at the Apollo layer and here by dropping the
 *      hook parameter entirely.
 *   2. Stellex "falling short of target" — Haiku-generated hook was
 *      factually true but read as negative framing. Killed the class of
 *      risk by removing the LLM entirely.
 *
 * v5 remains fully STATIC. No LLM. All hook generation is switch-
 * statement over extracted_data fields the classifier already populated
 * and the AUM-leak safety rail has already cleaned.
 *
 * Apollo still provides the person + firm. Everything else is template
 * substitution.
 */

import type { Article, ComposedEmail, QualityGateResult } from './types'
import type { NewsletterPayload } from './newsletter-fetch'
import { shortenFirmName } from './candidates'

/**
 * Version tag stamped on every row we insert into cold_outreach_sent so
 * the post-change reply rate can be cleanly separated from the pre-v5
 * baseline. If we ever run a true A/B, add more values here and split
 * the candidate pool before composition.
 */
export const TEMPLATE_VARIANT = 'forward_v5'

/**
 * Max fund_size_usd_millions we trust as a real fund size. Mirrors the
 * safety rail in lib/newsletter/query-articles.ts (isLikelyAumLeak).
 * Duplicated here to avoid cross-dependency between outreach and
 * newsletter libs. Classifier backfill on 2026-04-18 cleaned historical
 * leaks in the DB, and the prompt rewrite prevents new ones — but
 * belt-and-suspenders: if a value slips through, we don't want it in
 * the hook of an email going to the firm's staff.
 */
const FUND_SIZE_SANITY_CEILING_MILLIONS = 30000

function formatFundSize(millions: number | null | undefined): string | null {
  if (!millions || millions <= 0) return null
  if (millions >= 1000) {
    return `$${(millions / 1000).toFixed(1).replace(/\.0$/, '')}B`
  }
  return `$${Math.round(millions)}M`
}

/**
 * Build a one-line hook describing what happened to the firm today.
 * Source of specificity is the classifier's extracted_data — no LLM.
 * Always returns a safe, generic fallback if the structured data is
 * insufficient to name the event concretely.
 */
function buildStoryHook(article: Article, firmShort: string): string {
  const evt = (article.eventType ?? article.articleType ?? '').toLowerCase()

  // Drop any fund-size that smells like an AUM leak (belt-and-suspenders
  // on top of the backfilled DB + prompt rewrite).
  const rawSize = article.fundSizeUsdMillions
  const isLikelyAumLeak =
    !!rawSize && rawSize > FUND_SIZE_SANITY_CEILING_MILLIONS && !article.fundName
  const size = isLikelyAumLeak ? null : formatFundSize(rawSize)

  // Prefer a concrete fund label when present: "Fund VII" > "Apollo
  // Infrastructure Fund III" > generic "a new fund". Skip the label if
  // it's just the firm name again ("Apollo" for firm=Apollo). Strip the
  // firm name from the front of the fund name when the classifier
  // prefixed it ("Partners Group Secondaries VIII" + firmShort=Partners
  // Group → just "Secondaries VIII" in the hook).
  let fundLabel: string | null = null
  if (article.fundName) {
    let fn = article.fundName.trim()
    const firmFull = article.firmName?.trim() ?? ''
    if (firmFull && fn.toLowerCase().startsWith(firmFull.toLowerCase() + ' ')) {
      fn = fn.slice(firmFull.length).trim()
    } else if (firmShort && fn.toLowerCase().startsWith(firmShort.toLowerCase() + ' ')) {
      fn = fn.slice(firmShort.length).trim()
    }
    if (fn && fn.toLowerCase() !== firmShort.toLowerCase()) {
      fundLabel = fn
    }
  } else if (article.fundNumber) {
    fundLabel = `Fund ${article.fundNumber}`
  }

  switch (evt) {
    case 'fund_close':
      if (fundLabel && size) return `Saw ${firmShort} close ${fundLabel} at ${size} today`
      if (size) return `Saw ${firmShort} wrap a ${size} close today`
      if (fundLabel) return `Saw ${firmShort}'s ${fundLabel} close today`
      return `Saw ${firmShort} in today's FundOps Daily`

    case 'fund_launch':
      if (fundLabel && size) return `Saw ${firmShort} launch ${fundLabel} targeting ${size} today`
      if (fundLabel) return `Saw ${firmShort} launch ${fundLabel} today`
      if (size) return `Saw ${firmShort} launch a ${size} fund today`
      return `Saw ${firmShort} launch a new fund today`

    case 'capital_raise':
      if (fundLabel && size) return `Saw ${firmShort} raise ${size} for ${fundLabel} today`
      if (size) return `Saw ${firmShort}'s ${size} raise today`
      if (fundLabel) return `Saw ${firmShort}'s ${fundLabel} raise today`
      return `Saw ${firmShort}'s fundraise in today's FundOps Daily`

    case 'acquisition':
    case 'merger':
      if (size) return `Saw ${firmShort}'s ${size} deal today`
      return `Saw ${firmShort}'s deal in today's FundOps Daily`

    case 'regulatory_action':
      return `Saw the regulatory news on ${firmShort} today`

    default:
      return `Saw ${firmShort} in today's FundOps Daily`
  }
}

/**
 * Encode the recipient email as a URL-safe base64 deep-link parameter.
 * The homepage's HeroSubscribe reads ?e=<token>, decodes, and pre-fills
 * the subscribe form + swaps the button to a one-click "Subscribe <email>".
 * Using base64url (not raw email) to keep the URL clean and keep emails
 * with special chars (+, %) out of the visible URL in link previews.
 */
function encodeEmailForDeepLink(email: string): string {
  // Node 18+ supports the `base64url` encoding directly.
  return Buffer.from(email, 'utf8').toString('base64url')
}

function subscribeDeepLink(recipientEmail: string): string {
  return `fundopshq.com/?e=${encodeEmailForDeepLink(recipientEmail)}`
}

export function composeEmail(params: {
  firstName: string
  firmName: string
  recipientEmail: string
  article: Article
}): ComposedEmail {
  const { firstName, firmName, recipientEmail, article } = params
  const firmShort = shortenFirmName(firmName)
  const subject = `Covered ${firmShort} today`
  const hook = buildStoryHook(article, firmShort)
  const deepLink = subscribeDeepLink(recipientEmail)

  const body = [
    `Hi ${firstName},`,
    '',
    `${hook}. It's my morning brief for GPs, LPs, and fund service providers in private markets.`,
    '',
    `If you want it daily, one-click subscribe at ${deepLink}.`,
    '',
    'Danny',
  ].join('\n')

  return { subject, body }
}

/**
 * Hard quality gate. Runs AFTER composeEmail() and BEFORE sendGmail().
 * Every check is a hard failure — if any fire, drop the candidate and
 * log a cold_outreach_sent row with status='skipped' and the reason.
 *
 * Blast-radius logic: we'd rather send 7 clean emails than 10 including
 * one that embarrasses Danny. The full batch can run light and still
 * provide daily drip.
 */
export function qualityGate(body: string, subject: string): QualityGateResult {
  // 1. Word count cap. Static template renders to ~55 words; cap at 70
  // to catch pathological firm-name expansion.
  const words = body.trim().split(/\s+/).filter(Boolean).length
  if (words > 70) return { ok: false, reason: 'over_word_cap' }

  // 2. Required content — fundopshq.com link somewhere in the body.
  if (!body.includes('fundopshq.com')) {
    return { ok: false, reason: 'missing_link' }
  }

  // 3. Required content — "Danny" signature on its own line. v5 dropped
  // the "Founder & Host, FundOpsHQ" second line to read as a 1:1 note
  // rather than a marketing signature block.
  if (!/\nDanny\s*$/.test(body)) {
    return { ok: false, reason: 'missing_signature' }
  }

  // 4. No em/en dashes. Template is clean but a firm name could
  // theoretically contain one — belt-and-suspenders.
  if (body.includes('\u2014') || body.includes('\u2013')) {
    return { ok: false, reason: 'em_dash' }
  }

  // 5. Greeting present — "Hi {Name},\n" form. Block missing greeting
  // and the empty-first-name "Hi ," form.
  if (!body.startsWith('Hi ') || body.startsWith('Hi ,')) {
    return { ok: false, reason: 'missing_greeting' }
  }

  // 6. Subject shape.
  if (!subject.startsWith('Covered ')) {
    return { ok: false, reason: 'wrong_subject_prefix' }
  }
  if (!subject.endsWith(' today')) {
    return { ok: false, reason: 'wrong_subject_suffix' }
  }

  return { ok: true }
}

/**
 * Helper: count words the same way the quality gate does. Exposed so the
 * Anthropic hook generator can self-check output length before it gets
 * composed into the full body.
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ─── Forward-mode composition ──────────────────────────────────────────────

/**
 * Compose a "forward" email — a personal note from Danny at the top,
 * followed by the cleaned FundOps Daily newsletter body. Returns both
 * a plain-text and HTML version so the Gmail client can send
 * multipart/alternative.
 *
 * The HTML version injects the intro as a new table block immediately
 * after the newsletter's `<body>` open tag, preserving all of the
 * newsletter's own `<head>` styles so the layout renders correctly.
 * The text version just prepends the intro paragraph before the
 * newsletter's plain-text body with a forwarded-message separator.
 */
export function composeForwardEmail(params: {
  firstName: string
  firmName: string
  article: Article
  newsletter: NewsletterPayload
  recipientEmail: string
}): ComposedEmail {
  const { firstName, firmName, article, newsletter, recipientEmail } = params
  const firmShort = shortenFirmName(firmName)

  // Derive the newsletter section the firm appears in, so the intro
  // can tell the recipient where to scroll to find their story. When
  // the section can't be determined, fall back to no parenthetical.
  const section = sectionForArticle(article)
  const sectionParenthetical = section ? ` (${section} section)` : ''

  // Story-type-specific hook from extracted_data — no LLM. See
  // buildStoryHook for the full switch table.
  const hook = buildStoryHook(article, firmShort)

  // Homepage deep-link with recipient email pre-encoded, so clicking
  // lands in a pre-filled one-click subscribe state.
  const subscribeUrl = subscribeDeepLink(recipientEmail)
  const subscribeUrlWithScheme = `https://${subscribeUrl}`

  // Subject: firm-specific rather than echoing the newsletter's generic
  // subject. The newsletter's own subject line features whichever story
  // topped the edition ("Adams Street Partners $7.5B + 25 more"), which
  // the recipient doesn't care about. A firm-specific subject speaks
  // directly to them in the inbox preview. Retains "Fwd:" prefix for
  // authentic forward framing.
  const subject = `Fwd: Covered ${firmShort} in FundOps Daily today`

  // ─── text/plain version ───────────────────────────────────────────
  // Two-sentence intro + signature. v5: specific hook replaces the
  // generic "came up" line; signature collapses to just "Danny".
  const textIntro = [
    `Hi ${firstName},`,
    '',
    `${hook}${sectionParenthetical}. Forwarding the full brief so you can see it. If this is up your alley, one-click subscribe at ${subscribeUrl}.`,
    '',
    'Danny',
    '',
    '---------- Forwarded message ----------',
    `From: ${newsletter.fromName} <${newsletter.fromEmail}>`,
    `Date: ${newsletter.date}`,
    `Subject: ${newsletter.subject}`,
    '',
    '',
  ].join('\n')

  const textBody = textIntro + newsletter.cleanedText

  // ─── text/html version ────────────────────────────────────────────
  // Lighter visual: no cream background, no heavy double border. Plain
  // white table container with a light 1px grey bottom border just to
  // separate the intro from the newsletter header. Feels more like a
  // real Gmail forward, less like a branded banner. Still uses a table
  // for cross-client compatibility — divs render inconsistently on
  // Outlook.
  const htmlIntro =
    '<!-- injected forward intro from FundOpsHQ outreach pipeline -->\n' +
    '<table cellpadding="0" cellspacing="0" border="0" width="100%" ' +
    'style="background:#ffffff;margin:0;">' +
    '<tr><td style="padding:24px 32px 16px 32px;font-family:-apple-system,' +
    "BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;" +
    'font-size:15px;line-height:1.55;color:#202124;">' +
    `<p style="margin:0 0 14px 0;">Hi ${escapeHtml(firstName)},</p>` +
    `<p style="margin:0 0 14px 0;">${escapeHtml(hook)}${escapeHtml(sectionParenthetical)}. Forwarding the full brief so you can see it. If this is up your alley, <a href="${escapeHtml(subscribeUrlWithScheme)}" style="color:#1a73e8;text-decoration:underline;">one-click subscribe here</a>.</p>` +
    '<p style="margin:0 0 18px 0;">Danny</p>' +
    '<p style="margin:0;color:#80868b;font-size:12px;font-family:monospace;">' +
    `---------- Forwarded message ----------<br>` +
    `From: ${escapeHtml(newsletter.fromName)} &lt;${escapeHtml(newsletter.fromEmail)}&gt;<br>` +
    `Date: ${escapeHtml(newsletter.date)}<br>` +
    `Subject: ${escapeHtml(newsletter.subject)}` +
    '</p>' +
    '</td></tr></table>\n'

  // Inject the intro block immediately after the <body...> opening tag.
  // If no body tag found (pathological), prepend to the whole document.
  const bodyOpenMatch = newsletter.cleanedHtml.match(/<body\b[^>]*>/i)
  let htmlBody: string
  if (bodyOpenMatch && bodyOpenMatch.index !== undefined) {
    const insertAt = bodyOpenMatch.index + bodyOpenMatch[0].length
    htmlBody =
      newsletter.cleanedHtml.slice(0, insertAt) +
      '\n' +
      htmlIntro +
      newsletter.cleanedHtml.slice(insertAt)
  } else {
    htmlBody = htmlIntro + newsletter.cleanedHtml
  }

  return { subject, body: textBody, html: htmlBody }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Map an article to its FundOps Daily newsletter section name, so the
 * forward-mode intro can tell the recipient where to scroll. Returns
 * null when we can't determine the section confidently — the intro
 * then omits the parenthetical rather than guess wrong.
 *
 * Mapping rules (in priority order):
 *   1. M&A events (acquisition/merger) → "Deals"
 *   2. Executive moves → "People Moves" (unreachable today because
 *      Block G drops person-move articles before they reach Apollo,
 *      but left in place in case the block is ever relaxed).
 *   3. Firm name matches LP/pension language → "LP Commitments"
 *   4. fund_categories asset class → Credit / VC / PE / Hedge Funds /
 *      Real Estate / Infrastructure
 *   5. Unknown → null (no parenthetical in the intro)
 *
 * fund_categories values in Supabase are capitalized acronyms (PE, VC)
 * and lowercase words (credit, real_estate, hedge, infrastructure).
 * See the distinct-values query in the newsletter-fetch notes.
 */
function sectionForArticle(article: Article): string | null {
  const evt = (article.eventType ?? article.articleType ?? '').toLowerCase()

  // Deals section: M&A events take priority over asset class.
  if (evt === 'acquisition' || evt === 'merger') return 'Deals'

  // People Moves section: executive events. Unreachable via Block G.
  if (
    evt.startsWith('executive_') ||
    evt === 'hire' ||
    evt === 'appointment' ||
    evt === 'departure'
  ) {
    return 'People Moves'
  }

  // LP Commitments section: firm name heuristic for pensions,
  // sovereign wealth, retirement systems, state investment boards.
  // The classifier's article_type for these is usually 'capital_raise'
  // so we can't rely on it — match the firm name directly.
  const firm = (article.firmName ?? '').toLowerCase()
  if (
    firm.includes('pension') ||
    firm.includes('retirement') ||
    firm.includes('sovereign wealth') ||
    firm.includes('teachers') ||
    firm.includes('endowment') ||
    firm.includes('state investment board') ||
    firm.includes('state investment council') ||
    firm === 'calpers' ||
    firm === 'calstrs' ||
    firm === 'cppib'
  ) {
    return 'LP Commitments'
  }

  // Asset class from fund_categories. Real Supabase values as of
  // 2026-04-15: "PE", "VC", "credit", "real_estate", "hedge",
  // "infrastructure", "secondaries", "gp_stakes".
  const cats = (article.fundCategories ?? []).map((c) => c.toLowerCase())
  if (cats.includes('credit')) return 'Credit'
  if (cats.includes('vc')) return 'Venture Capital'
  if (cats.includes('pe')) return 'Private Equity'
  if (cats.includes('hedge')) return 'Hedge Funds'
  if (cats.includes('real_estate')) return 'Real Estate'
  if (cats.includes('infrastructure')) return 'Infrastructure'
  // Secondaries and gp_stakes don't have dedicated sections — they're
  // typically grouped under Private Equity in the newsletter layout.
  if (cats.includes('secondaries') || cats.includes('gp_stakes')) {
    return 'Private Equity'
  }

  return null
}

/**
 * Quality gate for forward-mode composed emails. Much lighter than the
 * short-mode gate because the body is dominated by the newsletter HTML
 * (which is Danny's own trusted content, already QA'd by his newsletter
 * pipeline). We only check the WRAPPER — the personal note at the top —
 * plus that the subject is the expected `Fwd: ...` shape and the HTML
 * doesn't accidentally still contain a recipient-specific unsubscribe
 * token.
 */
export function qualityGateForward(
  composed: ComposedEmail,
  params: { firstName: string; firmName: string },
): QualityGateResult {
  const { subject, body, html } = composed

  // 1. Subject shape: firm-specific "Fwd: Covered {firmShort} in FundOps
  //    Daily today" form. Checks prefix AND suffix so we know the
  //    template rendered correctly.
  if (!subject.startsWith('Fwd: Covered ')) {
    return { ok: false, reason: 'wrong_subject_prefix' }
  }
  if (!subject.endsWith(' in FundOps Daily today')) {
    return { ok: false, reason: 'wrong_subject_suffix' }
  }

  // 2. Text body must start with "Hi <name>," — no empty first name.
  if (!body.startsWith(`Hi ${params.firstName},`)) {
    return { ok: false, reason: 'missing_greeting' }
  }
  if (!params.firstName.trim()) {
    return { ok: false, reason: 'missing_greeting' }
  }

  // 3. Wrapper must mention the target firm (either full name or the
  //    shortened form used in the subject line).
  if (!body.includes(params.firmName) && !body.includes(shortenFirmName(params.firmName))) {
    return { ok: false, reason: 'missing_firm_mention' }
  }

  // 4. Both text and HTML must contain fundopshq.com (the subscribe link).
  if (!body.includes('fundopshq.com')) {
    return { ok: false, reason: 'missing_link' }
  }
  if (html && !html.includes('fundopshq.com')) {
    return { ok: false, reason: 'missing_link' }
  }

  // 5. Signature present — v5 just "Danny" on its own line (drops the
  // title block which read like a marketing footer in 1:1 notes).
  // Text body: "Danny" on a line followed by a forwarded-message marker.
  if (!/\nDanny\n/.test(body)) {
    return { ok: false, reason: 'missing_signature' }
  }
  // HTML intro paragraph: `<p ...>Danny</p>`.
  if (html && !/>Danny<\/p>/.test(html)) {
    return { ok: false, reason: 'missing_signature' }
  }

  // 6. CRITICAL: the HTML must NOT contain any recipient-specific
  // unsubscribe token. Belt-and-suspenders check — if newsletter-fetch's
  // cleaning ever misses a token, this catches it before sending.
  if (html) {
    if (/\/api\/newsletter\/unsubscribe\?token=/i.test(html)) {
      return { ok: false, reason: 'leaked_unsubscribe_token' }
    }
    if (/%2Fapi%2Fnewsletter%2Funsubscribe/i.test(html)) {
      return { ok: false, reason: 'leaked_unsubscribe_token' }
    }
    if (/resend-clicks-a\.com/i.test(html)) {
      return { ok: false, reason: 'leaked_resend_wrapper' }
    }
  }

  // 7. No em/en dashes in the TEXT intro — Danny's rule applies to his
  //    own wrapper copy. (The newsletter body is his own content and is
  //    allowed to have them; the HTML intro uses &mdash; which is an
  //    entity, not a Unicode dash, so it doesn't trip this check.)
  const textIntroOnly = body.split('---------- Forwarded message ----------')[0]
  if (textIntroOnly.includes('\u2014') || textIntroOnly.includes('\u2013')) {
    return { ok: false, reason: 'em_dash' }
  }

  return { ok: true }
}
