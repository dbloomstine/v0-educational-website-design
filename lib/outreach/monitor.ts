/**
 * Reply/bounce detection for the outreach-monitor cron route.
 *
 * Called hourly by /api/pipeline/outreach-monitor. Takes Gmail messages
 * fetched via the Gmail API client and classifies them:
 *
 *   - Opt-out reply  → flip cold_outreach_sent.status to 'opted_out'
 *   - Bounce         → flip status to 'bounced'
 *   - Generic reply  → flip status to 'replied' (Danny triages manually)
 *
 * Keep the patterns conservative. False-positive opt-outs are OK
 * (we lose one future touch). False negatives are worse (we re-contact
 * someone who said no).
 */

import type { GmailMessageDetail } from './gmail-client'

// ─── Opt-out phrase detection ────────────────────────────────────────────────
// Matches the most common ways people ask to be removed from a list,
// plus the explicit "no thanks" phrase Danny uses in the outreach email.
const OPT_OUT_PATTERNS = [
  /\bno\s+thanks\b/i,
  /\bunsubscribe\b/i,
  /\bremove\s+me\b/i,
  /\btake\s+me\s+off\b/i,
  /\bstop\s+emailing\b/i,
  /\bdo\s+not\s+(email|contact)\b/i,
  /\bplease\s+(remove|stop|unsubscribe)\b/i,
  /\bopt\s*out\b/i,
  /\bnot\s+interested\b/i,
]

export function detectOptOut(body: string): boolean {
  if (!body) return false
  return OPT_OUT_PATTERNS.some((re) => re.test(body))
}

// ─── Bounce detection ───────────────────────────────────────────────────────
// Gmail shows bounces as replies from `mailer-daemon@googlemail.com` or
// `postmaster@*` with a subject like "Delivery Status Notification (Failure)".
// The body typically contains the bounced recipient email and SMTP error.

const BOUNCE_SENDERS = [
  'mailer-daemon@googlemail.com',
  'mailer-daemon@google.com',
  'postmaster@',
]

const BOUNCE_SUBJECT_HINTS = [
  /delivery status notification/i,
  /undeliverable/i,
  /mail delivery failed/i,
  /returned mail/i,
  /failure notice/i,
]

export function isBounceMessage(msg: GmailMessageDetail): boolean {
  const senderMatches = BOUNCE_SENDERS.some((s) =>
    msg.fromEmail.toLowerCase().includes(s),
  )
  if (!senderMatches) return false
  return BOUNCE_SUBJECT_HINTS.some((re) => re.test(msg.subject))
}

/**
 * Parse the bounced recipient email from a Gmail bounce message body.
 * Gmail's format typically includes lines like:
 *
 *   Your message wasn't delivered to recipient@example.com because...
 *   The following address(es) failed:
 *     recipient@example.com
 *
 * Extracts the first email address that appears after "to" / "failed" / etc.
 * Returns null if no parseable recipient found.
 */
export function parseBouncedRecipient(body: string): string | null {
  if (!body) return null

  // Strategy: look for "to <email>" patterns first, then fall back to any
  // email that looks like a bounce target (not the sender, not our sender).
  const toPattern = /(?:to|for|at|address)\s+([^\s<>]+@[^\s<>]+)/gi
  const matches = [...body.matchAll(toPattern)]
  for (const m of matches) {
    const email = m[1].replace(/[.,;:]+$/, '').toLowerCase()
    // Skip addresses that are obviously not the bounced recipient.
    if (email.includes('mailer-daemon')) continue
    if (email.includes('postmaster')) continue
    if (email.includes('dbloomstine@gmail.com')) continue
    if (email.includes('fundopshq.com')) continue
    return email
  }

  // Fallback: any email in the body that isn't our sender or gmail infra.
  const emailPattern = /([^\s<>]+@[^\s<>]+\.[^\s<>]+)/g
  const allEmails = [...body.matchAll(emailPattern)].map((m) =>
    m[1].replace(/[.,;:]+$/, '').toLowerCase(),
  )
  for (const email of allEmails) {
    if (email.includes('mailer-daemon')) continue
    if (email.includes('postmaster')) continue
    if (email.includes('dbloomstine@gmail.com')) continue
    if (email.includes('fundopshq.com')) continue
    return email
  }

  return null
}
