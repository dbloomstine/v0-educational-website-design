/**
 * The checks of "Send us your news" (/submit), browser-safe: the server route
 * (through lib/submit/news-submission.ts, which re-exports all of this) and
 * the step-by-step form (components/submit/SubmitNewsForm.tsx) run the same
 * code, so the form refuses on the right step with the server's own words.
 * Split out of news-submission.ts on 2026-10-22, unchanged except that the
 * one validator became one check per field.
 *
 * Everything here is typed by a stranger. This module checks its SHAPE:
 * lengths, a kind from our list, real web addresses, a work email address.
 * Whether it is TRUE is the desk's job.
 */
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

type Body = Record<string, unknown>
type Check<T> = (b: Body, now: Date) => { ok: true; value: T } | { ok: false; error: string }
const pass = <T,>(value: T) => ({ ok: true as const, value })
const bad = (error: string) => ({ ok: false as const, error })

/**
 * One check per field, in the order the form asks for them. The server runs
 * all of them (`validateNewsSubmission`); the step-by-step form runs the ones
 * on the screen in front of the sender (`newsFieldErrors`), so a refusal shows
 * on the step it belongs to, with the same words, before anything is sent.
 */
const CHECKS = {
  kind: ((b) => {
    const kind = NEWS_KINDS.find((k) => k === b.kind)
    return kind ? pass(kind) : bad('Choose the kind of news, so we know who to send it to.')
  }) as Check<NewsKind>,
  firm: ((b) => {
    const firm = cleanLine(b.firm, LIMITS.firm)
    return firm && firm.length >= MIN.firm ? pass(firm) : bad('Add the name of your firm.')
  }) as Check<string>,
  firm_website: ((b) => {
    if (typeof b.firm_website !== 'string' || !b.firm_website.trim()) return bad("Add your firm's website, like example.com.")
    const site = cleanUrl(b.firm_website, LIMITS.firmWebsite, { bareHost: true })
    return site ? pass(site) : bad("That doesn't look like a web address. Try something like example.com.")
  }) as Check<string>,
  headline: ((b) => {
    const headline = cleanLine(b.headline, LIMITS.headline)
    return headline && headline.length >= MIN.headline ? pass(headline) : bad('Give it a one-line headline of at least 10 characters.')
  }) as Check<string>,
  details: ((b) => {
    const details = cleanBlock(b.details, LIMITS.details)
    return details && details.length >= MIN.details ? pass(details) : bad('Tell us what happened in a sentence or two (at least 20 characters).')
  }) as Check<string>,
  amount: ((b) => {
    const amount = parseAmount(b.amount)
    return amount !== null && Number.isNaN(amount) ? bad('Write the amount as a number, like 450M, 1.2bn or 450,000,000.') : pass(amount)
  }) as Check<number | null>,
  currency: ((b) => {
    if (parseAmount(b.amount) === null) return pass(null)
    const c = typeof b.currency === 'string' && b.currency.trim() ? b.currency.trim().toUpperCase() : 'USD'
    const currency = CURRENCIES.find((x) => x === c) ?? null
    return currency ? pass(currency) : bad('Choose a currency from the list.')
  }) as Check<Currency | null>,
  news_date: ((b, now) => {
    if (typeof b.news_date !== 'string' || !b.news_date.trim()) return bad('Add the date it was announced or took effect.')
    const d = cleanDate(b.news_date, now)
    return d ? pass(d) : bad('Choose a date within the past year (or the next 90 days).')
  }) as Check<string>,
  url: ((b) => {
    if (typeof b.url !== 'string' || !b.url.trim()) return pass(null)
    const url = cleanUrl(b.url)
    return url ? pass(url) : bad('That link needs to be a full web address, starting https://')
  }) as Check<string | null>,
  contact_name: ((b) => {
    const name = cleanLine(b.contact_name, LIMITS.contactName)
    return name && name.length >= MIN.contactName ? pass(name) : bad('Add your name, so the desk knows who to thank.')
  }) as Check<string>,
  contact_role: ((b) => {
    const role = cleanLine(b.contact_role, LIMITS.contactRole)
    return role ? pass(role) : bad('Add your role, like Head of IR or Partner.')
  }) as Check<string>,
  contact_email: ((b) => {
    const email = cleanLine(b.contact_email, LIMITS.contactEmail)?.toLowerCase() ?? null
    if (!email || !EMAIL.test(email)) return bad('Add your work email address, like you@yourfirm.com.')
    return isFreeMail(email) ? bad(FREE_MAIL_ERROR) : pass(email)
  }) as Check<string>,
} as const

export type NewsField = keyof typeof CHECKS
export const NEWS_FIELDS = Object.keys(CHECKS) as NewsField[]

/** The refusals for just these fields (each field's first problem), keyed by field. Empty when they all pass. */
export function newsFieldErrors(body: unknown, fields: readonly NewsField[], now = new Date()): Partial<Record<NewsField, string>> {
  const b = (body && typeof body === 'object' ? body : {}) as Body
  const out: Partial<Record<NewsField, string>> = {}
  for (const f of fields) {
    const r = CHECKS[f](b, now)
    if (!r.ok) out[f] = r.error
  }
  return out
}

export function validateNewsSubmission(body: unknown, now = new Date()): Validation {
  const b = (body && typeof body === 'object' ? body : {}) as Body
  const v: Record<string, unknown> = {}
  for (const f of NEWS_FIELDS) {
    const r = CHECKS[f](b, now)
    if (!r.ok) return { ok: false, field: f, error: r.error }
    v[f] = r.value
  }
  const value = v as Omit<NewsSubmission, 'people' | 'wants_newsletter' | 'domain_match'>
  return {
    ok: true,
    value: {
      kind: value.kind,
      firm: value.firm,
      firm_website: value.firm_website,
      headline: value.headline,
      details: value.details,
      amount: value.amount,
      currency: value.currency,
      news_date: value.news_date,
      url: value.url,
      people: cleanPeople(b),
      contact_name: value.contact_name,
      contact_email: value.contact_email,
      contact_role: value.contact_role,
      wants_newsletter: ticked(b.wants_newsletter),
      domain_match: domainsMatch(value.contact_email, value.firm_website),
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

