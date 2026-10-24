/**
 * Claiming a directory profile, and what a claimer may change.
 *
 *   1. On the profile, "Is this you?" asks for a work email. It must be at the
 *      firm's own domain (the one we read the bio from), never free mail.
 *   2. We email a one-time link: the news-submission pattern
 *      (lib/submit/news-submission.ts): 32 random bytes, only the SHA-256 kept,
 *      seven days, single use, confirmed by a button press so a mail scanner
 *      opening the link confirms nothing.
 *   3. Confirming marks the profile claimed and opens an edit session: a
 *      signed, http-only cookie for one person, good for a day.
 *   4. Edits are stored as `pending_edits` for the desk to approve; nothing a
 *      claimer types shows until then. Hiding the profile is immediate.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { baseDomain, emailDomain, isFreeMail } from '@/lib/submit/validate'
import { CONFIRM_TTL_DAYS, hashToken, isExpired, looksLikeToken, newConfirmToken } from '@/lib/submit/news-submission'
import { isPracticeId } from './taxonomy'
import { safeHttpsUrl } from './people'
import { EDIT_LIMITS, type ProfileEdits } from './edit-shape'

export { hashToken, looksLikeToken, newConfirmToken, isExpired, CONFIRM_TTL_DAYS, EDIT_LIMITS, type ProfileEdits }

const EMAIL_RE = /^[^\s@<>()",;:]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i

export type DomainCheck = { ok: true; email: string } | { ok: false; reason: 'invalid' | 'free_mail' | 'wrong_domain' }

/**
 * The claim's one real check: the address is at the firm. Same registered
 * domain as the firm's (either may be a subdomain: "ny.kirkland.com" is
 * Kirkland), never a free-mail provider.
 */
export function claimDomainMatches(rawEmail: unknown, firmDomain: string): DomainCheck {
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) return { ok: false, reason: 'invalid' }
  if (isFreeMail(email)) return { ok: false, reason: 'free_mail' }
  const domain = emailDomain(email)
  const firm = firmDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!domain || !firm || baseDomain(domain) !== baseDomain(firm)) return { ok: false, reason: 'wrong_domain' }
  return { ok: true, email }
}

/** Limits: three claim emails a day to one address, five for one profile, ten from one IP address. */
export const CLAIMS_PER_EMAIL_PER_DAY = 3
export const CLAIMS_PER_PERSON_PER_DAY = 5
export const CLAIMS_PER_IP_PER_DAY = 10

export type ClaimOutcome = 'confirm' | 'already' | 'expired' | 'invalid'

export function claimOutcome(row: { confirmed_at: string | null; expires_at: string | null } | null, now = new Date()): ClaimOutcome {
  if (!row) return 'invalid'
  if (row.confirmed_at) return 'already'
  return isExpired(row.expires_at, now) ? 'expired' : 'confirm'
}

export const SITE = 'https://fundopshq.com'

export const claimConfirmUrl = (token: string) => `${SITE}/directory/claim/confirm?t=${token}`

/** The email. It repeats nothing anyone typed: only the profile's own name and firm, which are ours. */
export function claimEmail(person: { full_name: string; firm_name: string }, token: string, now = new Date()) {
  const link = claimConfirmUrl(token)
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const day = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
  const subject = 'Confirm your FundOpsHQ directory profile'
  const text = [
    `Someone asked on ${day} to claim the FundOpsHQ directory profile of ${person.full_name} (${person.firm_name}) with this email address.`,
    '',
    'If it was you, confirm here. You can then add a headline, a short description, a photo and a contact link, or hide the profile:',
    link,
    '',
    `The link works once and expires in ${CONFIRM_TTL_DAYS} days.`,
    "If it wasn't you, ignore this email: nothing happens without the click.",
    '',
    'FundOpsHQ',
  ].join('\n')
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f8f5ec;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
<div style="max-width:520px;margin:0 auto;">
<p style="font-size:15px;line-height:1.5;margin:0 0 14px;">Someone asked on ${day} to claim the FundOpsHQ directory profile of <strong>${esc(person.full_name)}</strong> (${esc(person.firm_name)}) with this email address.</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 18px;">If it was you, confirm it. You can then add a headline, a short description, a photo and a contact link, or hide the profile.</p>
<p style="margin:0 0 18px;"><a href="${link}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:2px;">Confirm my profile</a></p>
<p style="font-size:13px;line-height:1.5;color:#555;margin:0 0 6px;">The link works once and expires in ${CONFIRM_TTL_DAYS} days.</p>
<p style="font-size:13px;line-height:1.5;color:#555;margin:0;">If it wasn&rsquo;t you, ignore this email: nothing happens without the click.</p>
</div></body></html>`
  return { subject, text, html }
}

// ── The edit session ────────────────────────────────────────────────────────

export const SESSION_COOKIE = 'fohq_dir_edit'
export const SESSION_HOURS = 24

const secret = () => process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const sign = (payload: string, key: string) => createHmac('sha256', key).update(`directory-edit:${payload}`).digest('base64url')

/** "<person id>.<expiry ms>.<signature>". Null without a server secret. */
export function signSession(personId: string, now = Date.now(), key = secret()): string | null {
  if (!key) return null
  const payload = `${personId}.${now + SESSION_HOURS * 3_600_000}`
  return `${payload}.${sign(payload, key)}`
}

/** The person id a session cookie is good for, or null. */
export function verifySession(raw: string | null | undefined, now = Date.now(), key = secret()): string | null {
  if (!raw || !key) return null
  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const [id, exp, sig] = parts
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^\d{13}$/.test(exp) || Number(exp) <= now) return null
  const want = Buffer.from(sign(`${id}.${exp}`, key))
  const got = Buffer.from(sig)
  return want.length === got.length && timingSafeEqual(want, got) ? id : null
}

// ── What a claimer may send ─────────────────────────────────────────────────

const line = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max + 1) : '')

export type EditCheck = { ok: true; value: ProfileEdits } | { ok: false; error: string; field: string }

export function validateEdits(body: unknown, now = new Date()): EditCheck {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request', field: 'form' }
  const b = body as Record<string, unknown>
  const headline = line(b.headline, EDIT_LIMITS.headline)
  if (headline.length > EDIT_LIMITS.headline) return { ok: false, error: `Keep the headline under ${EDIT_LIMITS.headline} characters.`, field: 'headline' }
  const description = typeof b.description === 'string' ? b.description.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : ''
  if (description.length > EDIT_LIMITS.description) return { ok: false, error: `Keep the description to ${EDIT_LIMITS.description} characters.`, field: 'description' }
  const photo = typeof b.photo_url === 'string' && b.photo_url.trim() ? safeHttpsUrl(b.photo_url) : null
  if (typeof b.photo_url === 'string' && b.photo_url.trim() && !photo) return { ok: false, error: 'The photo link must start with https://', field: 'photo_url' }
  const contact = typeof b.contact_url === 'string' && b.contact_url.trim() ? safeHttpsUrl(b.contact_url) : null
  if (typeof b.contact_url === 'string' && b.contact_url.trim() && !contact) return { ok: false, error: 'The contact link must start with https://', field: 'contact_url' }
  const areas = Array.isArray(b.practice_areas) ? [...new Set(b.practice_areas.filter(isPracticeId))] : []
  const rawNotable = Array.isArray(b.notable) ? b.notable : []
  if (rawNotable.length > EDIT_LIMITS.notable) return { ok: false, error: `Up to ${EDIT_LIMITS.notable} notable matters.`, field: 'notable' }
  const notable: ProfileEdits['notable'] = []
  for (const n of rawNotable) {
    const x = (n && typeof n === 'object' ? n : { text: n }) as Record<string, unknown>
    const text = line(x.text, EDIT_LIMITS.notableText)
    if (!text) continue
    if (text.length > EDIT_LIMITS.notableText) return { ok: false, error: `Keep each matter under ${EDIT_LIMITS.notableText} characters.`, field: 'notable' }
    const y = Number(x.year)
    notable.push({ text, year: Number.isInteger(y) && y >= 1980 && y <= now.getUTCFullYear() ? y : null })
  }
  return {
    ok: true,
    value: { headline: headline || null, description: description || null, photo_url: photo, contact_url: contact, practice_areas: areas, notable },
  }
}

/** The owner's alert for an edit: every typed value labelled, plain text. */
export function editAlertText(person: { full_name: string; firm_name: string; slug: string }, e: ProfileEdits, path: string): string {
  return [
    `${person.full_name} (${person.firm_name}) sent profile edits. UNREVIEWED: nothing shows until you approve it.`,
    `Profile: ${SITE}${path}`,
    '',
    `Headline: ${e.headline ?? '(none)'}`,
    `Description: ${e.description ?? '(none)'}`,
    `Photo: ${e.photo_url ?? '(none)'}`,
    `Contact link: ${e.contact_url ?? '(none)'}`,
    `Practice tags: ${e.practice_areas.join(', ') || '(none)'}`,
    'Notable matters (self-reported):',
    ...(e.notable.length ? e.notable.map((n) => `  - ${n.text}${n.year ? ` (${n.year})` : ''}`) : ['  (none)']),
    '',
    `Approve: npx tsx --env-file=.env.local scripts/directory/review.ts approve-edits ${person.slug} --apply`,
    `Reject:  npx tsx --env-file=.env.local scripts/directory/review.ts reject-edits ${person.slug} --apply`,
  ].join('\n')
}

// ── Removal and correction requests ─────────────────────────────────────────

export type RequestKind = 'removal' | 'correction'
export const REQUEST_LIMITS = { message: 2000, perIpPerDay: 5 } as const

export type RequestCheck =
  | { ok: true; value: { slug: string; kind: RequestKind; message: string | null; contact_email: string } }
  | { ok: false; error: string; field: string }

export function validateRequest(body: unknown): RequestCheck {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request', field: 'form' }
  const b = body as Record<string, unknown>
  const slug = typeof b.slug === 'string' ? b.slug.trim().toLowerCase() : ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return { ok: false, error: 'Unknown profile', field: 'slug' }
  const kind = b.kind === 'removal' || b.kind === 'correction' ? b.kind : null
  if (!kind) return { ok: false, error: 'Choose removal or correction.', field: 'kind' }
  const message = typeof b.message === 'string' ? b.message.trim() : ''
  if (message.length > REQUEST_LIMITS.message) return { ok: false, error: `Keep the message under ${REQUEST_LIMITS.message} characters.`, field: 'message' }
  if (kind === 'correction' && !message) return { ok: false, error: 'Tell us what is wrong and what it should say.', field: 'message' }
  const email = typeof b.contact_email === 'string' ? b.contact_email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, error: 'Enter an email address we can reply to.', field: 'contact_email' }
  return { ok: true, value: { slug, kind, message: message || null, contact_email: email } }
}
