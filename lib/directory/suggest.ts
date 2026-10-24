/**
 * "Suggest a firm / add yourself" (plan B9): what the form may send. Pure.
 * Everything is queued for the desk (directory_suggestions); nothing is loaded
 * from it without the desk reading the firm's own site, so the checks here are
 * about shape, not truth.
 */
import { baseDomain, emailDomain, isFreeMail } from '@/lib/submit/validate'
import { safeHttpsUrl } from './people'
import { normalizeMissQuery } from './views'
import { CATEGORIES, type CategoryId } from './taxonomy'

export type SuggestionKind = 'add_self' | 'person' | 'firm'

export const SUGGESTION_KINDS: { id: SuggestionKind; label: string }[] = [
  { id: 'add_self', label: 'Add myself' },
  { id: 'person', label: 'Suggest someone' },
  { id: 'firm', label: 'Suggest a firm' },
]

export const SUGGEST_LIMITS = { name: 120, firm: 160, url: 500, message: 1500, perIpPerDay: 5 } as const

const EMAIL_RE = /^[^\s@<>()",;:]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i

export interface Suggestion {
  kind: SuggestionKind
  category: CategoryId
  full_name: string | null
  firm_name: string
  firm_website: string | null
  bio_url: string | null
  contact_email: string
  message: string | null
  domain_match: boolean
  from_query: string | null
}

export type SuggestionCheck = { ok: true; value: Suggestion } | { ok: false; error: string; field: string }

const line = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max + 1) : '')

const hostOf = (url: string | null) => {
  try {
    return url ? new URL(url).hostname.toLowerCase() : null
  } catch {
    return null
  }
}

/** A bare "kirkland.com" is accepted as a website and made https. */
function website(raw: unknown): string | null | 'bad' {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return null
  const withScheme = /^[a-z]+:\/\//i.test(s) ? s : `https://${s}`
  return safeHttpsUrl(withScheme) ?? 'bad'
}

export function validateSuggestion(body: unknown): SuggestionCheck {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request', field: 'form' }
  const b = body as Record<string, unknown>
  const kind = SUGGESTION_KINDS.find((k) => k.id === b.kind)?.id
  if (!kind) return { ok: false, error: 'Choose what you are suggesting.', field: 'kind' }
  const category = typeof b.category === 'string' && b.category in CATEGORIES ? (b.category as CategoryId) : null
  if (!category || !CATEGORIES[category].live) return { ok: false, error: 'Choose a trade.', field: 'category' }

  const full_name = line(b.full_name, SUGGEST_LIMITS.name)
  if (kind !== 'firm' && !full_name) return { ok: false, error: kind === 'add_self' ? 'Enter your name.' : 'Enter their name.', field: 'full_name' }
  if (full_name.length > SUGGEST_LIMITS.name) return { ok: false, error: 'That name is too long.', field: 'full_name' }

  const firm_name = line(b.firm_name, SUGGEST_LIMITS.firm)
  if (!firm_name) return { ok: false, error: 'Enter the firm.', field: 'firm_name' }
  if (firm_name.length > SUGGEST_LIMITS.firm) return { ok: false, error: 'That firm name is too long.', field: 'firm_name' }

  const site = website(b.firm_website)
  if (site === 'bad') return { ok: false, error: 'Enter the firm’s website, like example.com.', field: 'firm_website' }
  const bio = typeof b.bio_url === 'string' && b.bio_url.trim() ? safeHttpsUrl(b.bio_url.trim()) : null
  if (typeof b.bio_url === 'string' && b.bio_url.trim() && !bio) return { ok: false, error: 'The bio link must start with https://', field: 'bio_url' }
  if (bio && bio.length > SUGGEST_LIMITS.url) return { ok: false, error: 'That link is too long.', field: 'bio_url' }
  if (kind !== 'firm' && !bio && !site) return { ok: false, error: 'Give a link to the bio on the firm’s own site, or the firm’s website.', field: 'bio_url' }

  const contact_email = typeof b.contact_email === 'string' ? b.contact_email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(contact_email) || contact_email.length > 200) return { ok: false, error: 'Enter an email address we can reply to.', field: 'contact_email' }
  if (kind === 'add_self' && isFreeMail(contact_email)) return { ok: false, error: 'Use your work address: that is how we know it is you.', field: 'contact_email' }

  const message = typeof b.message === 'string' ? b.message.trim() : ''
  if (message.length > SUGGEST_LIMITS.message) return { ok: false, error: `Keep the message under ${SUGGEST_LIMITS.message} characters.`, field: 'message' }

  const mail = emailDomain(contact_email)
  const hosts = [hostOf(bio), hostOf(site)].filter((h): h is string => Boolean(h))
  const domain_match = Boolean(mail) && hosts.some((h) => baseDomain(h) === baseDomain(mail!))

  return {
    ok: true,
    value: {
      kind,
      category,
      full_name: kind === 'firm' ? full_name || null : full_name,
      firm_name,
      firm_website: site,
      bio_url: bio,
      contact_email,
      message: message || null,
      domain_match,
      from_query: normalizeMissQuery(b.from_query),
    },
  }
}

/** Danny's alert: every typed value labelled, plain text. */
export function suggestionAlertText(s: Suggestion, id: string | null): string {
  const kind = SUGGESTION_KINDS.find((k) => k.id === s.kind)!.label
  return [
    `Directory suggestion (${kind}, ${CATEGORIES[s.category].plural}). UNVERIFIED: typed by the sender; check the firm's own site.`,
    '',
    `Name: ${s.full_name ?? '(none)'}`,
    `Firm: ${s.firm_name}`,
    `Website: ${s.firm_website ?? '(none)'}`,
    `Bio: ${s.bio_url ?? '(none)'}`,
    `From: ${s.contact_email}${s.domain_match ? ' (at the firm’s domain)' : ' (NOT at the firm’s domain)'}`,
    s.from_query ? `Searched for: ${s.from_query}` : '',
    'Message:',
    s.message ?? '(none)',
    '',
    id ? `Then: scripts/directory/review.ts suggestion ${id} added|rejected|done [--reply "..."] --apply` : 'NOT SAVED: the database refused the row. This email is the only copy.',
  ]
    .filter((x) => x !== '')
    .join('\n')
}
