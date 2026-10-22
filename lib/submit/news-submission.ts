/**
 * "Submit your news" (/submit, POST /api/news/submit), 2026-10-22.
 *
 * A firm sends a fund close, launch, hire or deal. What arrives is a lead for
 * the news desk, never a story: it is stored as `pending` in news_submissions
 * and the owner is emailed. Nothing is published from it. A story runs only
 * when the firm's own announcement or a credible outlet says it, which is why
 * the link to the announcement is required.
 *
 * Everything here is typed by a stranger. This module checks its shape (and
 * only its shape): lengths, a kind from our list, a real http(s) link, an
 * email address. Whether it is TRUE is the desk's job, at the link.
 */
import { createHmac } from 'node:crypto'
import { LIMITS, NEWS_KINDS, NEWS_KIND_LABELS, type NewsKind } from './fields'

export { LIMITS, NEWS_KINDS, NEWS_KIND_LABELS, type NewsKind }

/** The fewest characters a required field may have. */
const MIN = { firm: 2, headline: 10, contactName: 2 } as const

export interface NewsSubmission {
  kind: NewsKind
  firm: string
  headline: string
  details: string | null
  url: string
  contact_name: string
  contact_email: string
  contact_role: string | null
  wants_newsletter: boolean
}

export type Validation =
  | { ok: true; value: NewsSubmission }
  | { ok: false; field: string; error: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g

/** One line of text: control and direction-changing characters out, runs of whitespace to one space. */
export function cleanLine(raw: unknown, max: number): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim()
  return t || null
}

/** A few lines of text: line breaks kept (at most one blank line in a row), the rest as `cleanLine`. */
export function cleanBlock(raw: unknown, max: number): string | null {
  if (typeof raw !== 'string') return null
  const t = raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL, ' ')
    .split('\n')
    .map((l) => l.replace(/[^\S\n]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
    .trim()
  return t || null
}

/**
 * The announcement's address, or null. http or https only, a host name with a
 * dot in it (no bare IP address, no localhost), no user name or password in it.
 */
export function cleanUrl(raw: unknown): string | null {
  // Never cut to fit: a shortened address is a different (broken) link. Too long is refused.
  const t = cleanLine(raw, LIMITS.url * 2)
  if (!t || t.length > LIMITS.url || /\s/.test(t)) return null
  let u: URL
  try {
    u = new URL(t)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  if (u.username || u.password) return null
  const host = u.hostname.toLowerCase()
  if (!host.includes('.') || host.endsWith('.')) return null
  if (/^\d+(\.\d+){3}$/.test(host) || host.startsWith('[')) return null
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return null
  const out = u.toString()
  return out.length <= LIMITS.url ? out : null
}

/** A tick-box: the browser sends "on"; a script may send true. */
function ticked(raw: unknown): boolean {
  return raw === true || raw === 'on' || raw === 'true' || raw === '1'
}

export function validateNewsSubmission(body: unknown): Validation {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const fail = (field: string, error: string): Validation => ({ ok: false, field, error })

  const firm = cleanLine(b.firm, LIMITS.firm)
  if (!firm || firm.length < MIN.firm) return fail('firm', 'Firm name is required')

  const kind = NEWS_KINDS.find((k) => k === b.kind)
  if (!kind) return fail('kind', 'Choose what kind of news this is')

  const headline = cleanLine(b.headline, LIMITS.headline)
  if (!headline || headline.length < MIN.headline) return fail('headline', 'A one-line headline is required')

  const details = cleanBlock(b.details, LIMITS.details)

  if (typeof b.url !== 'string' || !b.url.trim()) {
    return fail('url', 'A link to the announcement is required')
  }
  const url = cleanUrl(b.url)
  if (!url) return fail('url', 'The link must be a full web address (https://…) to the announcement')

  const contactName = cleanLine(b.contact_name, LIMITS.contactName)
  if (!contactName || contactName.length < MIN.contactName) return fail('contact_name', 'Your name is required')

  const contactEmail = cleanLine(b.contact_email, LIMITS.contactEmail)?.toLowerCase() ?? null
  if (!contactEmail || !EMAIL.test(contactEmail)) return fail('contact_email', 'A valid email address is required')

  return {
    ok: true,
    value: {
      kind,
      firm,
      headline,
      details,
      url,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_role: cleanLine(b.contact_role, LIMITS.contactRole),
      wants_newsletter: ticked(b.wants_newsletter),
    },
  }
}

/**
 * Looks like link spam rather than a firm's news: more than three web
 * addresses in the headline and details together. Such a row is kept as
 * `spam` (so a pattern can be seen) and the owner is not emailed.
 */
export function looksLikeSpam(s: Pick<NewsSubmission, 'headline' | 'details'>): boolean {
  const links = `${s.headline}\n${s.details ?? ''}`.match(/https?:\/\/|www\./gi)
  return (links?.length ?? 0) > 3
}

/** The sender's IP address as Vercel passes it, or null. */
export function clientIp(headers: Headers): string | null {
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim()
  return ip ? ip.slice(0, 64) : null
}

/** Signed with a secret only the server holds (the same ones lib/newsletter/ticket.ts uses). */
const secret = () => process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * A keyed hash of the IP address, so one sender's submissions can be counted
 * without keeping the address. Null without an address or a secret (an
 * unkeyed hash of an IPv4 address can be reversed by trying them all).
 */
export function hashIp(ip: string | null, key = secret()): string | null {
  if (!ip || !key) return null
  return createHmac('sha256', key).update(`news-submit:${ip}`).digest('hex').slice(0, 32)
}

/** How many submissions one IP address may send in a day, one contact address may have waiting, and the whole queue may hold. */
export const PER_IP_PER_DAY = 5
export const PER_CONTACT_PENDING = 5
export const QUEUE_CAP = 200

/** The owner's alert: plain text, every typed value labelled, and a reminder that none of it is checked. */
export function alertSubject(s: NewsSubmission): string {
  return `[News submission] ${NEWS_KIND_LABELS[s.kind]}: ${s.firm.slice(0, 60)} — ${s.headline.slice(0, 80)}`
}

export function alertText(s: NewsSubmission, opts: { stored: boolean; newsletter?: string | null }): string {
  return [
    'New news submitted at fundopshq.com/submit. UNVERIFIED: everything below was typed by the sender.',
    'Nothing runs until the link (or a credible outlet) says the same.',
    '',
    `Kind: ${NEWS_KIND_LABELS[s.kind]}`,
    `Firm: ${s.firm}`,
    `Headline: ${s.headline}`,
    `Link: ${s.url}`,
    '',
    'Details:',
    s.details ?? '(none)',
    '',
    `From: ${s.contact_name}${s.contact_role ? `, ${s.contact_role}` : ''} <${s.contact_email}>`,
    `FundOps Daily: ${s.wants_newsletter ? `asked to subscribe${opts.newsletter ? ` (${opts.newsletter})` : ''}` : 'not asked'}`,
    '',
    opts.stored
      ? "It is in the queue: select * from news_submissions where status = 'pending' order by created_at desc;"
      : 'NOT SAVED: the database refused the row (is the news_submissions migration applied?). This email is the only copy.',
  ].join('\n')
}
