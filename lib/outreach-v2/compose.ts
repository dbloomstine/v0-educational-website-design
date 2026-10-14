/**
 * The words of every outreach v2 email: pure functions from a contact (and a
 * story, or a pitch) to a subject, an HTML part with linked text, the same
 * email as plain text, and the headers that go with it.
 *
 * The copy is Danny's (2026-10-14, after the first test): lead with them,
 * short, linked text and never a raw URL in the HTML body, signed "Danny".
 *
 * TRACKING: Resend's open and click tracking are switched on for the whole
 * fundopshq.com domain (the newsletter's figures depend on them) and cannot be
 * switched off per email, so the HTML part of these emails is tracked like the
 * newsletter. Sending text only would avoid it, at the cost of raw URLs.
 *
 * Browser-safe: no server imports.
 */
import { POSTAL_ADDRESS, SITE, UNSUBSCRIBE_MAILBOX } from './config'

export interface Recipient {
  firstName: string
  company: string
  unsubToken: string
}

export interface Rendered {
  subject: string
  text: string
  html: string
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** "ToltIQ's", "73 Strings'". */
export const possessive = (name: string) => (/s$/i.test(name.trim()) ? `${name.trim()}'` : `${name.trim()}'s`)

export function unsubscribeUrl(token: string): string {
  return `${SITE}/api/outreach/unsubscribe?t=${encodeURIComponent(token)}`
}

/** RFC 2369 + RFC 8058: the one-click link first, the mailbox as the fallback. */
export function listUnsubscribeHeaders(token: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl(token)}>, <mailto:${UNSUBSCRIBE_MAILBOX}?subject=unsubscribe-${encodeURIComponent(token)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

/** The postal address and a visible way out, under the signature of every email (plain-text form). */
export function footer(token: string): string {
  return ['--', POSTAL_ADDRESS, `To get no more emails from FundOpsHQ: ${unsubscribeUrl(token)}`].join('\n')
}

function footerHtml(token: string): string {
  return `<p style="margin:24px 0 0;color:#777;font-size:12px;line-height:1.5">${esc(POSTAL_ADDRESS)}<br>To get no more emails from FundOpsHQ, <a href="${esc(unsubscribeUrl(token))}" style="color:#777">unsubscribe here</a>.</p>`
}

/**
 * One email in both forms. Each paragraph is a list of pieces: plain strings,
 * or links ({ text, href }) that read as linked text in HTML and as
 * "text: url" in the plain-text part.
 */
type Piece = string | { text: string; href: string }
type Para = Piece[]

function render(subject: string, paras: Para[], signature: string[], token: string): Rendered {
  const textParas = paras.map((p) => p.map((x) => (typeof x === 'string' ? x : `${x.text.replace(/\s*→$/, '')}: ${x.href}`)).join(''))
  const htmlParas = paras.map(
    (p) => `<p style="margin:0 0 14px">${p.map((x) => (typeof x === 'string' ? esc(x) : `<a href="${esc(x.href)}" style="color:#1a4fa0">${esc(x.text)}</a>`)).join('')}</p>`,
  )
  const text = `${[...textParas, signature.join('\n')].join('\n\n')}\n\n${footer(token)}`
  const html = `<!doctype html><html><body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222"><div style="max-width:560px">${htmlParas.join('')}<p style="margin:0">${signature.map(esc).join('<br>')}</p>${footerHtml(token)}</div></body></html>`
  return { subject, text, html }
}

const SIGN = ['Danny', 'Founder, FundOpsHQ']

/** What a reader reads: everything above the footer, with each link counted by its words only. */
export function readerWords(r: Rendered): number {
  const body = r.html
    .replace(/<p style="margin:24px 0 0[\s\S]*$/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/g, ' ')
  return wordCount(body.replace(/→/g, ''))
}

/** The plain-text part above the footer. */
export function bodyOf(text: string): string {
  const cut = text.indexOf('\n--\n')
  return cut >= 0 ? text.slice(0, cut) : text
}

const greet = (firstName: string) => (firstName.trim() ? `Hi ${firstName.trim()},` : 'Hello,')

/* ───────────────────────── sponsor pitch ───────────────────────── */

export interface SponsorMockup {
  company: string
  domain?: string | null
  logoUrl?: string | null
  adLine?: string | null
}

/**
 * The /sponsor ad builder, opened with this company's ad already drawn and
 * scrolled to the preview (components/sponsor/SponsorBuilder.tsx reads these).
 * The logo is only ever a file on the company's own website: /api/sponsor/logo checks.
 */
export function mockupUrl(m: SponsorMockup): string {
  const q = new URLSearchParams()
  q.set('firm', m.company.trim())
  if (m.domain) q.set('site', m.domain.trim())
  if (m.logoUrl) q.set('logo', m.logoUrl.trim())
  if (m.adLine) q.set('line', m.adLine.trim())
  return `${SITE}/sponsor?${q.toString()}#ad-preview`
}

/** The short form in the email: /sponsor/m/<first 8 of the pitch's id> redirects to mockupUrl. Nothing is counted. */
export function mockupShortUrl(messageId: string): string {
  return `${SITE}/sponsor/m/${messageId.slice(0, 8).toLowerCase()}`
}

/** Danny: "Worth trying a week in <next month>?" — the next calendar month, or the one after once a month is past its 20th. */
export function pitchMonth(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  const ahead = d > 20 ? 2 : 1
  return new Date(Date.UTC(y, m - 1 + ahead, 1)).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
}

/** "about 150 readers at 60+ firms": each figure rounded down to ten. Null when either is unknown (then left out, never guessed). */
export function audienceLine(subscribers: number | null, firms: number | null): string | null {
  if (subscribers == null || firms == null || subscribers < 10 || firms < 10) return null
  return `about ${Math.floor(subscribers / 10) * 10} readers at ${Math.floor(firms / 10) * 10}+ firms, plus daily TikTok and LinkedIn`
}

export interface PitchInput extends Recipient {
  /** One short clause about them ("Congrats on the Series A."), already judged fresh enough; empty to leave it out. */
  hookClause: string | null
  audience: string | null
  /** The month to suggest, e.g. "November". */
  month: string
  mockup: string
}

export function sponsorPitchSubject(company: string): string {
  return `${company.trim()} in FundOps Daily?`
}

export function renderSponsorPitch(p: PitchInput): Rendered {
  const c = p.company.trim()
  const clause = (p.hookClause ?? '').trim()
  const lead = `${possessive(c)} buyers read FundOps Daily every morning: ops, finance and deal teams at GPs, LPs and the firms that serve them.`
  const young = p.audience
    ? `One sponsor at a time takes over the email and fundopshq.com. While the list is young (${p.audience}) it's a founding rate of $150 a week.`
    : "One sponsor at a time takes over the email and fundopshq.com. While the list is young it's a founding rate of $150 a week."
  return render(
    sponsorPitchSubject(c),
    [
      [greet(p.firstName)],
      [clause ? `${lead} ${clause}` : lead],
      [`I mocked up what a ${c} week would look like: `, { text: `See ${possessive(c)} ad →`, href: p.mockup }],
      [young],
      [`Worth trying a week in ${p.month}?`],
    ],
    SIGN,
    p.unsubToken,
  )
}

export interface FollowupInput extends Recipient {
  mockup: string
  original: { subject: string }
}

export function renderSponsorFollowup(p: FollowupInput): Rendered {
  const c = p.company.trim()
  const subject = /^re:/i.test(p.original.subject) ? p.original.subject : `Re: ${p.original.subject}`
  return render(
    subject,
    [
      [greet(p.firstName)],
      [`Following up once on the FundOps Daily mock-up for ${c}: `, { text: `See ${possessive(c)} ad →`, href: p.mockup }],
      ["If the timing isn't right, no need to reply, and I won't write again."],
    ],
    SIGN,
    p.unsubToken,
  )
}

/* ───────────────────────── news note ───────────────────────── */

export interface NewsNoteInput extends Recipient {
  headline: string
  storyUrl: string
}

export const SUBSCRIBE_URL = `${SITE}/?utm_source=outreach&utm_medium=email&utm_campaign=news_note#subscribe`

export function newsNoteSubject(company: string): string {
  return `${company.trim()} in FundOps Daily today`
}

export function renderNewsNote(p: NewsNoteInput): Rendered {
  const c = p.company.trim()
  return render(
    newsNoteSubject(c),
    [
      [greet(p.firstName)],
      [`${c} is in today's FundOps Daily: `, { text: p.headline.trim(), href: p.storyUrl }],
      ['Feel free to share it. The morning email is free for GPs, LPs and the firms that serve them: ', { text: 'subscribe here', href: SUBSCRIBE_URL }, '.'],
    ],
    SIGN,
    p.unsubToken,
  )
}
