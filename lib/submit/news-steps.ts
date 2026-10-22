/**
 * "Send us your news" as one question at a time (2026-10-22): the steps, what
 * each one checks, the review screen's rows and the payload. Browser-safe and
 * free of React, so it is tested on its own (lib/submit/__tests__/news-steps.test.ts);
 * components/submit/SubmitNewsForm.tsx draws it with components/forms/Stepper.tsx.
 *
 * The payload is exactly what the old one-page form sent (its FormData): the
 * same names, strings throughout, `wants_newsletter: 'on'` only when ticked,
 * people as person_name_<i> / person_role_<i>. POST /api/news/submit is unchanged.
 */
import { CURRENCIES, MAX_PEOPLE, NEWS_KINDS, NEWS_KIND_LABELS, type NewsKind } from './fields'
import { newsFieldErrors, parseAmount, type NewsField } from './validate'

export interface NewsDraft {
  kind: NewsKind | ''
  firm: string
  firm_website: string
  headline: string
  details: string
  news_date: string
  amount: string
  currency: string
  url: string
  people: { name: string; role: string }[]
  contact_name: string
  contact_role: string
  contact_email: string
  wants_newsletter: boolean
}

export type NewsStepId = 'kind' | 'firm' | 'headline' | 'details' | 'when' | 'link' | 'people' | 'you'

/** The steps in order, the fields each one asks for, and which may be skipped. The review screen comes after. */
export const NEWS_STEPS: ReadonlyArray<{ id: NewsStepId; fields: readonly NewsField[]; optional?: boolean }> = [
  { id: 'kind', fields: ['kind'] },
  { id: 'firm', fields: ['firm', 'firm_website'] },
  { id: 'headline', fields: ['headline'] },
  { id: 'details', fields: ['details'] },
  { id: 'when', fields: ['news_date', 'amount', 'currency'] },
  { id: 'link', fields: ['url'], optional: true },
  { id: 'people', fields: [], optional: true },
  { id: 'you', fields: ['contact_name', 'contact_role', 'contact_email'] },
]

/** One-line hints on the kind cards. */
export const NEWS_KIND_HINTS: Record<NewsKind, string> = {
  fund_close: 'A final or interim close',
  fund_launch: 'A new fund in the market',
  deal: 'An investment, exit, merger or financing',
  hire: 'A new hire, promotion or board seat',
  other: 'Anything else worth knowing',
}

export const NEWS_KIND_OPTIONS = NEWS_KINDS.map((k) => ({ value: k, label: NEWS_KIND_LABELS[k], hint: NEWS_KIND_HINTS[k] }))
export const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c, label: c }))

/** Today as YYYY-MM-DD, in the sender's own calendar. */
export function localToday(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

export function emptyNewsDraft(firm = '', today = ''): NewsDraft {
  return {
    kind: '',
    firm,
    firm_website: '',
    headline: '',
    details: '',
    // Most news is sent the day it's announced: the date starts at today, and the sender changes it if not.
    news_date: today,
    amount: '',
    currency: 'USD',
    url: '',
    people: [{ name: '', role: '' }],
    contact_name: '',
    contact_role: '',
    contact_email: '',
    wants_newsletter: false,
  }
}

/** A draft read back from storage: anything malformed falls back to the empty draft's value. */
export function restoreNewsDraft(saved: Partial<NewsDraft>, initial: NewsDraft): NewsDraft {
  const str = (k: keyof NewsDraft) => (typeof saved[k] === 'string' ? (saved[k] as string) : (initial[k] as string))
  const people = Array.isArray(saved.people)
    ? saved.people
        .filter((p) => p && typeof p === 'object')
        .slice(0, MAX_PEOPLE)
        .map((p) => ({ name: typeof p.name === 'string' ? p.name : '', role: typeof p.role === 'string' ? p.role : '' }))
    : initial.people
  const kind = NEWS_KINDS.find((k) => k === saved.kind) ?? initial.kind
  return {
    kind,
    // A firm named in the link (?firm=) fills in only an empty answer: what the sender typed wins.
    firm: str('firm') || initial.firm,
    firm_website: str('firm_website'),
    headline: str('headline'),
    details: str('details'),
    news_date: str('news_date') || initial.news_date,
    amount: str('amount'),
    currency: str('currency') || 'USD',
    url: str('url'),
    people: people.length ? people : [{ name: '', role: '' }],
    contact_name: str('contact_name'),
    contact_role: str('contact_role'),
    contact_email: str('contact_email'),
    wants_newsletter: saved.wants_newsletter === true,
  }
}

/** A link typed without https:// gets it (a press release address is often pasted as "example.com/news/..."). */
export function withScheme(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, '')}`
}

/** What POST /api/news/submit receives: the same shape the one-page form's FormData had. */
export function newsPayload(d: NewsDraft, honeypot = ''): Record<string, string> {
  const out: Record<string, string> = {
    website: honeypot,
    kind: d.kind,
    news_date: d.news_date,
    firm: d.firm,
    firm_website: d.firm_website,
    headline: d.headline,
    details: d.details,
    amount: d.amount,
    currency: d.currency || 'USD',
    url: withScheme(d.url),
    contact_name: d.contact_name,
    contact_role: d.contact_role,
    contact_email: d.contact_email.trim(),
  }
  d.people.slice(0, MAX_PEOPLE).forEach((p, i) => {
    out[`person_name_${i}`] = p.name
    out[`person_role_${i}`] = p.role
  })
  if (d.wants_newsletter) out.wants_newsletter = 'on'
  return out
}

/** The problems on one step, keyed by field, in the server's own words. Empty: move on. */
export function newsStepErrors(stepId: NewsStepId, d: NewsDraft, now = new Date()): Partial<Record<NewsField, string>> {
  const step = NEWS_STEPS.find((s) => s.id === stepId)
  return step ? newsFieldErrors(newsPayload(d), step.fields, now) : {}
}

/** The step that asks for a field (for a refusal from the server). People rows live on the 'people' step. */
export function newsStepForField(field: string): NewsStepId | undefined {
  if (/^person_/.test(field) || field === 'people') return 'people'
  return NEWS_STEPS.find((s) => (s.fields as readonly string[]).includes(field))?.id
}

const nonEmpty = (s: string) => (s.trim() ? s.trim() : null)

/** "22 October 2026" from YYYY-MM-DD (read as a calendar date, not a moment). */
export function formatDay(ymd: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return nonEmpty(ymd)
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "450M USD" as typed, with the currency, or null. */
function amountLine(d: NewsDraft): string | null {
  const a = nonEmpty(d.amount)
  if (!a) return null
  const n = parseAmount(a)
  return n === null || Number.isNaN(n) ? a : `${a} ${d.currency || 'USD'}`
}

export interface NewsReviewRow {
  stepId: NewsStepId
  label: string
  value: string | null
}

/** Every answer, labelled, in the order asked; null for one not given. */
export function newsReview(d: NewsDraft): NewsReviewRow[] {
  const people = d.people
    .filter((p) => p.name.trim())
    .map((p) => (p.role.trim() ? `${p.name.trim()}, ${p.role.trim()}` : p.name.trim()))
  return [
    { stepId: 'kind', label: 'Kind of news', value: d.kind ? NEWS_KIND_LABELS[d.kind] : null },
    { stepId: 'firm', label: 'Firm', value: nonEmpty(d.firm) },
    { stepId: 'firm', label: 'Website', value: nonEmpty(d.firm_website) },
    { stepId: 'headline', label: 'Headline', value: nonEmpty(d.headline) },
    { stepId: 'details', label: 'What happened', value: nonEmpty(d.details) },
    { stepId: 'when', label: 'Date', value: formatDay(d.news_date) },
    { stepId: 'when', label: 'Amount', value: amountLine(d) },
    { stepId: 'link', label: 'Public link', value: nonEmpty(d.url) ? withScheme(d.url) : null },
    { stepId: 'people', label: 'People involved', value: people.length ? people.join('\n') : null },
    { stepId: 'you', label: 'Your name', value: nonEmpty(d.contact_name) },
    { stepId: 'you', label: 'Your role', value: nonEmpty(d.contact_role) },
    { stepId: 'you', label: 'Work email', value: nonEmpty(d.contact_email) },
  ]
}
