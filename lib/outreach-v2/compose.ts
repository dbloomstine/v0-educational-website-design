/**
 * The words of every outreach v2 email, and nothing else: pure functions from
 * a contact (and a story, or a pitch) to a subject, a plain-text body and the
 * headers that go with it.
 *
 * PLAIN TEXT ONLY, on purpose. Resend's open and click tracking are switched
 * on for the whole fundopshq.com domain (the newsletter's engagement figures
 * depend on them) and cannot be switched off per email. Tracking works by
 * adding a pixel to the HTML part and rewriting its links, so an email with no
 * HTML part carries neither. A one-to-one note from a founder reads as plain
 * text anyway.
 *
 * Browser-safe: no server imports.
 */
import { POSTAL_ADDRESS, SIGNATURE, SITE, UNSUBSCRIBE_MAILBOX } from './config'

export interface Recipient {
  firstName: string
  company: string
  unsubToken: string
}

export interface Rendered {
  subject: string
  text: string
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

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

/** The postal address and a visible way out, under the signature of every email. */
export function footer(token: string): string {
  return ['--', POSTAL_ADDRESS, `To get no more emails from FundOpsHQ: ${unsubscribeUrl(token)}`].join('\n')
}

function greet(firstName: string): string {
  const n = firstName.trim()
  return n ? `Hi ${n},` : 'Hello,'
}

const signed = (body: string[]) => [...body, '', ...SIGNATURE].join('\n')

/** The part a reader reads: everything above the footer. Word limits are measured on this. */
export function bodyOf(text: string): string {
  const cut = text.indexOf('\n--\n')
  return cut >= 0 ? text.slice(0, cut) : text
}

/* ───────────────────────── sponsor pitch ───────────────────────── */

export interface SponsorMockup {
  company: string
  domain?: string | null
  logoUrl?: string | null
  adLine?: string | null
}

/**
 * The /sponsor ad builder, opened with this company's ad already drawn in the
 * live preview (components/sponsor/SponsorBuilder.tsx reads these). The logo
 * is only ever a file on the company's own website: /api/sponsor/logo checks.
 */
export function mockupUrl(m: SponsorMockup): string {
  const q = new URLSearchParams()
  q.set('firm', m.company.trim())
  if (m.domain) q.set('site', m.domain.trim())
  if (m.logoUrl) q.set('logo', m.logoUrl.trim())
  if (m.adLine) q.set('line', m.adLine.trim())
  return `${SITE}/sponsor?${q.toString()}#book`
}

/**
 * The short form that goes in the email: /sponsor/m/<first 8 of the pitch's id> redirects to the full mockupUrl
 * (app/sponsor/m/[code]/route.ts). A long query string reads badly in a plain-text email. Nothing is counted.
 */
export function mockupShortUrl(messageId: string): string {
  return `${SITE}/sponsor/m/${messageId.slice(0, 8).toLowerCase()}`
}

export interface PitchInput extends Recipient {
  /** One sentence, written to be read as-is, about why we are writing to them now. */
  hook: string
  /** Confirmed subscribers right now: the number is never typed. */
  subscribers: number
  mockup: string
}

export function sponsorPitchSubject(company: string): string {
  return `A FundOps Daily ad for ${company.trim()}`
}

export function renderSponsorPitch(p: PitchInput): Rendered {
  const hook = p.hook.trim().replace(/\s+/g, ' ')
  const body = [
    greet(p.firstName),
    '',
    `I'm Danny Bloomstine, founder of FundOpsHQ: daily private-markets news on fundopshq.com and FundOps Daily, a morning email for GPs, LPs and fund service providers. ${hook}`,
    '',
    `We're early and targeted: about ${p.subscribers} subscribers, plus daily posts on TikTok and LinkedIn. One sponsor at a time takes over the email and the site, at founding rates of $150 a week, $450 for four weeks or $1,200 a quarter.`,
    '',
    `Here is a mock-up of a ${p.company.trim()} ad, as it would run:`,
    p.mockup,
    '',
    'Happy to change any of it, and a no is fine too.',
  ]
  return { subject: sponsorPitchSubject(p.company), text: `${signed(body)}\n\n${footer(p.unsubToken)}` }
}

export interface FollowupInput extends Recipient {
  mockup: string
  original: { subject: string; text: string; sentAt: Date }
}

/** "> " before every line of the earlier email, the way a mail app quotes it. */
function quote(text: string): string {
  return bodyOf(text).split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n')
}

export function renderSponsorFollowup(p: FollowupInput): Rendered {
  const when = p.original.sentAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
  const body = [
    greet(p.firstName),
    '',
    `Following up once on my note below about sponsoring FundOps Daily. The mock-up of a ${p.company.trim()} ad is still here:`,
    p.mockup,
    '',
    "If the timing isn't right, no need to reply, and I won't write again.",
  ]
  const subject = /^re:/i.test(p.original.subject) ? p.original.subject : `Re: ${p.original.subject}`
  return {
    subject,
    text: `${signed(body)}\n\nOn ${when}, Danny Bloomstine wrote:\n${quote(p.original.text)}\n\n${footer(p.unsubToken)}`,
  }
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
  const body = [
    greet(p.firstName),
    '',
    `We covered news from ${p.company.trim()} in today's FundOps Daily:`,
    p.headline.trim(),
    p.storyUrl,
    '',
    'Feel free to share it. FundOps Daily is a free morning email on private markets for GPs, LPs and fund service providers; if it would be useful, you can subscribe here:',
    SUBSCRIBE_URL,
  ]
  return { subject: newsNoteSubject(p.company), text: `${signed(body)}\n\n${footer(p.unsubToken)}` }
}
