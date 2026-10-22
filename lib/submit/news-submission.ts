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
 * Nothing is published from here. A verified row becomes an ordinary story
 * labelled "announced by the firm to FundOpsHQ" through
 * scripts/news/publish-submission.ts (lib/submit/publish-submission.ts).
 *
 * Everything here is typed by a stranger. This module checks its SHAPE:
 * lengths, a kind from our list, real web addresses, a work email address.
 * Whether it is TRUE is the desk's job.
 */
import { createHash, createHmac, randomBytes } from 'node:crypto'
import { NEWS_KIND_LABELS, type NewsSubmission } from './validate'

// The shape checks live in ./validate (browser-safe, shared with the form); everything else re-exports from here as before.
export * from './validate'

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
