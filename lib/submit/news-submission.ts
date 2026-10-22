/**
 * "Send us your news" (/submit, POST /api/news/submit), 2026-10-22.
 *
 * A firm (GP, LP, fund service provider, law firm, placement agent) sends a
 * fund close, fundraise launch, deal, hire or other news. What arrives is a
 * lead for the news desk, never a story. Version 2 (the same day, Danny's
 * approved plan) adds a work-email check:
 *
 *   unconfirmed --(the sender clicks the emailed link)--> pending (in review)
 *   pending --(the desk verifies it)--> approved | rejected | spam
 *
 * Nothing is published from here. An approved row becomes an ordinary story
 * labelled "Announced by the firm to FundOpsHQ", by a step not designed yet.
 *
 * Everything here is typed by a stranger. This module checks its SHAPE:
 * lengths, a kind from our list, real web addresses, a work email address.
 * Whether it is TRUE is the desk's job.
 */
import { createHash, createHmac, randomBytes } from 'node:crypto'
import {
  CURRENCIES,
  LIMITS,
  MAX_PEOPLE,
  NEWS_KINDS,
  NEWS_KIND_LABELS,
  type Currency,
  type NewsKind,
} from './fields'

export { CURRENCIES, LIMITS, MAX_PEOPLE, NEWS_KINDS, NEWS_KIND_LABELS, type Currency, type NewsKind }

/** The fewest characters a required field may have. */
const MIN = { firm: 2, headline: 10, details: 20, contactName: 2 } as const

export interface Person {
  name: string
  role: string | null
}

export interface NewsSubmission {
  kind: NewsKind
  firm: string
  firm_website: string
  headline: string
  details: string
  amount: number | null
  currency: Currency | null
  news_date: string
  url: string | null
  people: Person[]
  contact_name: string
  contact_email: string
  contact_role: string | null
  wants_newsletter: boolean
  /** The email's domain is the website's domain. A flag for the desk, never a block. */
  domain_match: boolean
}

export type Validation =
  | { ok: true; value: NewsSubmission }
  | { ok: false; field: string; error: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g

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
 * A web address, or null. http or https only, a host name with a dot in it (no
 * bare IP address, no localhost), no user name or password in it. With
 * `bareHost`, "example.com" is read as https://example.com (people type a
 * firm's website that way).
 */
export function cleanUrl(raw: unknown, max: number = LIMITS.url, { bareHost = false } = {}): string | null {
  // Never cut to fit: a shortened address is a different (broken) link. Too long is refused.
  let t = cleanLine(raw, max * 2)
  if (!t || t.length > max || /\s/.test(t)) return null
  if (bareHost && !/^[a-z][a-z0-9+.-]*:/i.test(t)) t = `https://${t}`
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
  return out.length <= max ? out : null
}

// ── Domains ─────────────────────────────────────────────────────────────────

/**
 * The part of a host name a firm registers: "ir.example.com" → "example.com",
 * "www.example.co.uk" → "example.co.uk". An approximation without the public
 * suffix list: a two-letter country code after a generic second level
 * (co, com, org, net, ac, gov, edu, ltd, plc) keeps three labels.
 */
export function baseDomain(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, '').split('.').filter(Boolean)
  if (labels.length <= 2) return labels.join('.')
  const [sld, tld] = labels.slice(-2)
  const keep = tld.length === 2 && /^(co|com|org|net|ac|gov|edu|ltd|plc)$/.test(sld) ? 3 : 2
  return labels.slice(-keep).join('.')
}

/** The domain of an email address, lower case, or null. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@')
  return at > 0 ? email.slice(at + 1).toLowerCase() || null : null
}

/**
 * Free mail: Danny's list of 2026-10-22 (Gmail, Yahoo, Outlook, Hotmail,
 * iCloud, AOL, Proton) and their siblings. We ask for a work address because
 * the confirmation is how we know the sender is at a firm.
 */
const FREE_MAIL = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com', 'rocketmail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aim.com',
  'proton.me', 'protonmail.com', 'protonmail.ch', 'pm.me',
])
/** The same providers under a country domain: yahoo.co.uk, hotmail.fr, outlook.de, gmail.co.uk… */
const FREE_MAIL_COUNTRY = /^(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|aol)\.((co|com)\.)?[a-z]{2}$/

export function isFreeMail(email: string): boolean {
  const domain = emailDomain(email)
  if (!domain) return false
  const base = baseDomain(domain)
  return FREE_MAIL.has(domain) || FREE_MAIL.has(base) || FREE_MAIL_COUNTRY.test(base)
}

/** The email's domain belongs to the firm's website (same registered domain, either may be a subdomain). */
export function domainsMatch(email: string, website: string): boolean {
  const domain = emailDomain(email)
  let host: string
  try {
    host = new URL(website).hostname
  } catch {
    return false
  }
  return !!domain && baseDomain(domain) === baseDomain(host)
}

// ── Amount and date ─────────────────────────────────────────────────────────

const SCALE: Record<string, number> = { k: 1e3, m: 1e6, mm: 1e6, mn: 1e6, b: 1e9, bn: 1e9 }

/**
 * An amount as people type it, in full units: "450,000,000", "$450M", "1.2bn",
 * "450 million". Null when empty; NaN when it cannot be read.
 */
export function parseAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : NaN
  if (typeof raw !== 'string') return NaN
  const t = raw.trim().toLowerCase().replace(/[$€£¥,\s]/g, '').replace(/^(usd|eur|gbp|cad|aud|chf|jpy|sgd|hkd)/, '')
  if (!t) return null
  const m = t.match(/^(\d+(?:\.\d+)?)(k|m|mm|mn|million|b|bn|billion)?$/)
  if (!m) return NaN
  const unit = m[2] === 'million' ? 'm' : m[2] === 'billion' ? 'b' : m[2]
  const n = Number(m[1]) * (unit ? SCALE[unit] : 1)
  return Number.isFinite(n) && n > 0 && n < 1e13 ? n : NaN
}

/** How far back, and forward, the date of the news may be. Older news is not news; a date far ahead is a typo. */
export const DATE_DAYS_BACK = 365
export const DATE_DAYS_AHEAD = 90

/** A real calendar date, YYYY-MM-DD, within the window around `now`; else null. */
export function cleanDate(raw: unknown, now = new Date()): string | null {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return null
  const t = raw.trim()
  const d = new Date(`${t}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== t) return null
  const days = (d.getTime() - now.getTime()) / 86_400_000
  return days >= -DATE_DAYS_BACK - 1 && days <= DATE_DAYS_AHEAD ? t : null
}

// ── People ──────────────────────────────────────────────────────────────────

/**
 * "Deal team / people involved". The form sends person_name_0…4 and
 * person_role_0…4; a script may send `people: [{name, role}]`. Rows without a
 * name are dropped; more than five are cut to five.
 */
export function cleanPeople(b: Record<string, unknown>): Person[] {
  const raw: Array<{ name?: unknown; role?: unknown }> = Array.isArray(b.people)
    ? (b.people as unknown[]).filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    : Array.from({ length: MAX_PEOPLE }, (_, i) => ({ name: b[`person_name_${i}`], role: b[`person_role_${i}`] }))
  const out: Person[] = []
  for (const p of raw) {
    const name = cleanLine(p.name, LIMITS.personName)
    if (!name) continue
    out.push({ name, role: cleanLine(p.role, LIMITS.personRole) })
    if (out.length === MAX_PEOPLE) break
  }
  return out
}

/** A tick-box: the browser sends "on"; a script may send true. */
function ticked(raw: unknown): boolean {
  return raw === true || raw === 'on' || raw === 'true' || raw === '1'
}

export const FREE_MAIL_ERROR =
  'Please use your work email address. We confirm every submission with the firm, so we can’t accept Gmail, Yahoo, Outlook, iCloud, AOL or Proton addresses.'

export function validateNewsSubmission(body: unknown, now = new Date()): Validation {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const fail = (field: string, error: string): Validation => ({ ok: false, field, error })

  const kind = NEWS_KINDS.find((k) => k === b.kind)
  if (!kind) return fail('kind', 'Choose what kind of news this is')

  const firm = cleanLine(b.firm, LIMITS.firm)
  if (!firm || firm.length < MIN.firm) return fail('firm', 'Firm name is required')

  if (typeof b.firm_website !== 'string' || !b.firm_website.trim()) return fail('firm_website', "Your firm's website is required")
  const firmWebsite = cleanUrl(b.firm_website, LIMITS.firmWebsite, { bareHost: true })
  if (!firmWebsite) return fail('firm_website', "The firm's website must be a web address, like example.com")

  const headline = cleanLine(b.headline, LIMITS.headline)
  if (!headline || headline.length < MIN.headline) return fail('headline', 'A one-line headline is required')

  const details = cleanBlock(b.details, LIMITS.details)
  if (!details || details.length < MIN.details) return fail('details', 'Tell us what happened in a sentence or two')

  const amount = parseAmount(b.amount)
  if (amount !== null && Number.isNaN(amount)) return fail('amount', 'Write the amount as a number, like 450000000 or 450M')
  let currency: Currency | null = null
  if (amount !== null) {
    const c = typeof b.currency === 'string' && b.currency.trim() ? b.currency.trim().toUpperCase() : 'USD'
    currency = CURRENCIES.find((x) => x === c) ?? null
    if (!currency) return fail('currency', 'Choose a currency from the list')
  }

  if (typeof b.news_date !== 'string' || !b.news_date.trim()) return fail('news_date', 'The date is required')
  const newsDate = cleanDate(b.news_date, now)
  if (!newsDate) return fail('news_date', 'Choose a real date within the past year')

  let url: string | null = null
  if (typeof b.url === 'string' && b.url.trim()) {
    url = cleanUrl(b.url)
    if (!url) return fail('url', 'The link must be a full web address (https://…)')
  }

  const contactName = cleanLine(b.contact_name, LIMITS.contactName)
  if (!contactName || contactName.length < MIN.contactName) return fail('contact_name', 'Your name is required')

  const contactRole = cleanLine(b.contact_role, LIMITS.contactRole)
  if (!contactRole) return fail('contact_role', 'Your role is required')

  const contactEmail = cleanLine(b.contact_email, LIMITS.contactEmail)?.toLowerCase() ?? null
  if (!contactEmail || !EMAIL.test(contactEmail)) return fail('contact_email', 'A valid work email address is required')
  if (isFreeMail(contactEmail)) return fail('contact_email', FREE_MAIL_ERROR)

  return {
    ok: true,
    value: {
      kind,
      firm,
      firm_website: firmWebsite,
      headline,
      details,
      amount,
      currency,
      news_date: newsDate,
      url,
      people: cleanPeople(b),
      contact_name: contactName,
      contact_email: contactEmail,
      contact_role: contactRole,
      wants_newsletter: ticked(b.wants_newsletter),
      domain_match: domainsMatch(contactEmail, firmWebsite),
    },
  }
}

/**
 * Looks like link spam rather than a firm's news: more than three web
 * addresses in the headline and details together. Such a row is kept as
 * `spam` (so a pattern can be seen); no email goes to anyone.
 */
export function looksLikeSpam(s: Pick<NewsSubmission, 'headline' | 'details'>): boolean {
  const links = `${s.headline}\n${s.details ?? ''}`.match(/https?:\/\/|www\./gi)
  return (links?.length ?? 0) > 3
}

// ── Abuse control ───────────────────────────────────────────────────────────

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

/**
 * Limits. The form emails whatever address it is given, so the tightest one is
 * per address: three confirmation emails a day, whoever asks (nobody's inbox
 * can be flooded through us). Five a day from one IP address, five waiting
 * from one contact, two hundred waiting in review, and a hundred unconfirmed
 * in a day in all.
 */
export const PER_IP_PER_DAY = 5
export const PER_CONTACT_PER_DAY = 3
export const PER_CONTACT_WAITING = 5
export const QUEUE_CAP = 200
export const UNCONFIRMED_PER_DAY = 100

// ── The confirm link ────────────────────────────────────────────────────────

/** A confirm link works for seven days, once. */
export const CONFIRM_TTL_DAYS = 7

/** SHA-256 of a token, hex: what the table keeps. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** A new random token (32 bytes, URL-safe), its hash and when it expires. */
export function newConfirmToken(now = new Date()): { token: string; hash: string; expiresAt: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token), expiresAt: new Date(now.getTime() + CONFIRM_TTL_DAYS * 86_400_000).toISOString() }
}

/** The shape of a token we issued: 43 URL-safe characters. Anything else is not looked up. */
export function looksLikeToken(raw: unknown): raw is string {
  return typeof raw === 'string' && /^[A-Za-z0-9_-]{43}$/.test(raw)
}

export function isExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return true
  const t = new Date(expiresAt).getTime()
  return Number.isNaN(t) || t <= now.getTime()
}

/**
 * What a confirm attempt finds, for a row looked up by its token's hash:
 * confirm it, or say why not. A row past `unconfirmed` was confirmed already
 * (the link is single-use; clicking it again is harmless and says so).
 */
export type ConfirmOutcome = 'confirm' | 'already' | 'expired' | 'invalid' | 'spam'

export function confirmOutcome(
  row: { status: string; confirm_expires_at: string | null } | null,
  now = new Date(),
): ConfirmOutcome {
  if (!row) return 'invalid'
  if (row.status === 'spam') return 'spam'
  if (row.status !== 'unconfirmed') return 'already'
  return isExpired(row.confirm_expires_at, now) ? 'expired' : 'confirm'
}

export const SITE = 'https://fundopshq.com'

export function confirmUrl(token: string): string {
  return `${SITE}/submit/confirm?t=${token}`
}

/**
 * The email to the address given. It repeats NOTHING the sender typed: the
 * form will email any address, so a stranger's words must not ride along to
 * someone else's inbox. Only the kind (from our own list) and the date.
 */
export function confirmEmail(s: Pick<NewsSubmission, 'kind'>, token: string, now = new Date()) {
  const link = confirmUrl(token)
  const what = NEWS_KIND_LABELS[s.kind].toLowerCase()
  const day = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
  const subject = 'Confirm your news for FundOpsHQ'
  const text = [
    `Someone sent FundOpsHQ news (a ${what}) from this email address on ${day}.`,
    '',
    'If it was you, confirm it here and it goes to the news desk for review:',
    link,
    '',
    `The link works once and expires in ${CONFIRM_TTL_DAYS} days.`,
    "If it wasn't you, ignore this email: nothing happens without the click.",
    '',
    'FundOpsHQ',
  ].join('\n')
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f8f5ec;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
<div style="max-width:520px;margin:0 auto;">
<p style="font-size:15px;line-height:1.5;margin:0 0 14px;">Someone sent FundOpsHQ news (a ${what}) from this email address on ${day}.</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 18px;">If it was you, confirm it and it goes to the news desk for review.</p>
<p style="margin:0 0 18px;"><a href="${link}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:2px;">Confirm my news</a></p>
<p style="font-size:13px;line-height:1.5;color:#555;margin:0 0 6px;">The link works once and expires in ${CONFIRM_TTL_DAYS} days.</p>
<p style="font-size:13px;line-height:1.5;color:#555;margin:0;">If it wasn&rsquo;t you, ignore this email: nothing happens without the click.</p>
</div></body></html>`
  return { subject, text, html }
}

// ── The owner's alert ───────────────────────────────────────────────────────

/** The owner's alert: plain text, every typed value labelled, and a reminder that none of it is checked. */
export function alertSubject(s: Pick<NewsSubmission, 'kind' | 'firm' | 'headline'>): string {
  return `[News submission] ${NEWS_KIND_LABELS[s.kind]}: ${s.firm.slice(0, 60)} — ${s.headline.slice(0, 80)}`
}

/** A stored row or a fresh submission: the fields the alert prints. */
export type AlertFields = Omit<NewsSubmission, 'amount'> & { amount: number | string | null }

export function alertText(s: AlertFields, opts: { state: 'confirmed' | 'not_saved' | 'confirm_email_failed'; newsletter?: string | null }): string {
  const amount = s.amount !== null && s.amount !== '' ? `${s.currency ?? ''} ${Number(s.amount).toLocaleString('en-US')}`.trim() : '(none)'
  const people = s.people?.length ? s.people.map((p) => `  - ${p.name}${p.role ? `, ${p.role}` : ''}`).join('\n') : '  (none)'
  const head = {
    confirmed: 'News confirmed by its sender at fundopshq.com/submit and now pending review.',
    not_saved: 'News sent at fundopshq.com/submit, NOT SAVED: the database refused the row (is the news_submissions_confirm migration applied?). This email is the only copy, and no confirmation email went out.',
    confirm_email_failed: 'News sent at fundopshq.com/submit. Saved as UNCONFIRMED, but the confirmation email to the sender failed. Confirm the sender by hand before reviewing.',
  }[opts.state]
  return [
    head,
    'UNVERIFIED: everything below was typed by the sender. Nothing runs until it is verified.',
    '',
    `Kind: ${NEWS_KIND_LABELS[s.kind]}`,
    `Firm: ${s.firm} (${s.firm_website})`,
    `Headline: ${s.headline}`,
    `Date: ${s.news_date}`,
    `Amount: ${amount}`,
    `Link: ${s.url ?? '(none)'}`,
    '',
    'What happened:',
    s.details,
    '',
    'People involved:',
    people,
    '',
    `From: ${s.contact_name}${s.contact_role ? `, ${s.contact_role}` : ''} <${s.contact_email}>`,
    `Email domain matches the website: ${s.domain_match ? 'yes' : 'NO, check the sender is at the firm'}`,
    `FundOps Daily: ${s.wants_newsletter ? `asked to subscribe${opts.newsletter ? ` (${opts.newsletter})` : ''}` : 'not asked'}`,
    '',
    opts.state === 'not_saved'
      ? ''
      : "Review queue: select * from news_submissions where status = 'pending' order by created_at desc;",
  ]
    .join('\n')
    .trimEnd()
}
