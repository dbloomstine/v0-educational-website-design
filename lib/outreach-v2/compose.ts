/**
 * The words of every outreach v2 email: pure functions from a contact (and a
 * story, or a pitch) to a subject, an HTML part with linked text, the same
 * email as plain text, and the headers that go with it.
 *
 * The copy is Danny's (2026-10-14, after the first test): lead with them,
 * short, signed "Danny".
 *
 * PLAIN TEXT ONLY since 2026-10-22 (Danny: the pitches and notes "all just say
 * delivered… I wish we could just send those as like very generic plain text
 * emails"): no HTML part, at most one link, no unsubscribe link in the body
 * (a reply asking to stop is honoured, inbound.ts asksToStop; the invisible
 * List-Unsubscribe header stays), the postal address as one plain line under
 * the signature. It reads as an email a person typed, and with no HTML part
 * nothing is tracked.
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

/** Under the signature: the postal address, as one plain line (the law asks for it on a commercial email). */
export function footer(_token?: string): string {
  return POSTAL_ADDRESS
}

/** The way out, in words: a reply asking to stop is honoured (inbound.ts asksToStop). */
export const OPT_OUT = "If you'd rather I didn't write again, just reply and say so."

/**
 * One email as plain text. Each paragraph is a list of pieces: plain strings,
 * or a link ({ text, href }) that is written as its address; an email carries
 * one link at most. `html` stays empty: nothing but text is sent.
 */
type Piece = string | { text: string; href: string }
type Para = Piece[]

function render(subject: string, paras: Para[], signature: string[], _token: string): Rendered {
  const textParas = paras.map((p) => p.map((x) => (typeof x === 'string' ? x : x.href)).join(''))
  const text = `${[...textParas, [...signature, footer()].join('\n')].join('\n\n')}\n`
  return { subject, text, html: '' }
}

const SIGN = ['Danny', 'Founder, FundOpsHQ']

/** What a reader reads: the words above the signature, a link and the opt-out line counted as nothing. */
export function readerWords(r: Rendered): number {
  return wordCount(bodyOf(r.text).replace(OPT_OUT, ' ').replace(/https?:\/\/\S+/g, ' '))
}

/** The email above the signature. */
export function bodyOf(text: string): string {
  const cut = text.indexOf('\nDanny\n')
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
  return `about ${Math.floor(subscribers / 10) * 10} readers at ${Math.floor(firms / 10) * 10}+ firms, plus daily TikTok, Instagram and YouTube`
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
      [`I mocked up what a ${c} week would look like: `, { text: `See ${possessive(c)} ad`, href: p.mockup }],
      [young],
      [`Worth trying a week in ${p.month}?`],
      [OPT_OUT],
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
      [`Following up once on the FundOps Daily mock-up for ${c}: `, { text: `See ${possessive(c)} ad`, href: p.mockup }],
      ["If the timing isn't right, no need to reply, and I won't write again."],
    ],
    SIGN,
    p.unsubToken,
  )
}

/* ───────────────────────── news note ───────────────────────── */

export interface NewsNoteInput extends Recipient {
  /** A few words for what we covered, e.g. "$200M Fund III close" (newsPhrase in news-notes.ts). */
  news: string
  storyUrl: string
  /** Which edition carried it: "this morning's" (the default), or e.g. "Saturday's" for a weekend story on Monday. */
  edition?: string
}

export const SUBSCRIBE_URL = `${SITE}/?utm_source=outreach&utm_medium=email&utm_campaign=news_note#subscribe`

export function newsNoteSubject(company: string, edition?: string): string {
  // A weekend story sent on Monday is not "today".
  return edition && edition !== "this morning's" ? `${company.trim()} in FundOps Daily` : `${company.trim()} in FundOps Daily today`
}

export function renderNewsNote(p: NewsNoteInput): Rendered {
  const c = p.company.trim()
  return render(
    newsNoteSubject(c, p.edition),
    [
      [greet(p.firstName)],
      [`We covered ${possessive(c)} ${p.news.trim()} in ${p.edition ?? "this morning's"} FundOps Daily. Here's the story if you'd like to share it with your team: `, { text: 'the story', href: p.storyUrl }],
      ["FundOps Daily is a free morning email on private-markets news for GPs, LPs and fund service providers, at fundopshq.com, if it's ever useful."],
      [OPT_OUT],
    ],
    SIGN,
    p.unsubToken,
  )
}
