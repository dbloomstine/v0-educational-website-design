/**
 * Email template + quality gate for the outreach pipeline.
 *
 * v4 template (2026-04-15 iteration #2, after two failure modes hit
 * production on the first live test):
 *
 *   1. H.I.G. / Infinedi collision — stale Apollo record sent a hook
 *      about one firm to a contact at a different firm with the same
 *      person name. Fixed at the Apollo layer and here by dropping the
 *      hook parameter entirely.
 *
 *   2. Stellex "falling short of target" — Haiku-generated hook was
 *      factually true but read as negative framing ("closed $2.37B,
 *      falling short of $2.5B target"). Killed the class of risk by
 *      removing the LLM entirely.
 *
 * v4 is fully STATIC. Zero LLM. Every email is identical except the
 * first name and firm name. No hallucinated dollar amounts, no wrong-
 * firm cross-wiring, no em-dash surprises (line-break greeting avoids
 * Gmail's web renderer visually "improving" ` - ` to ` — `).
 *
 * Apollo still provides the person + firm. Everything else is template
 * substitution.
 */

import type { ComposedEmail, QualityGateResult } from './types'
import { shortenFirmName } from './candidates'

export function composeEmail(params: {
  firstName: string
  firmName: string
}): ComposedEmail {
  const { firstName, firmName } = params
  const firmShort = shortenFirmName(firmName)
  const subject = `Covered ${firmShort} today`

  const body = [
    `Hi ${firstName},`,
    '',
    `Noticed an article about ${firmShort} today and figured I'd reach out. It made today's edition of FundOps Daily, my morning brief for GPs, LPs, and fund service providers.`,
    '',
    `If you're interested in seeing more news like this or subscribing to the newsletter, you can visit fundopshq.com.`,
    '',
    'Danny',
    'Founder & Host, FundOpsHQ',
  ].join('\n')

  return { subject, body }
}

/**
 * Hard quality gate. Runs AFTER composeEmail() and BEFORE sendGmail().
 * Every check is a hard failure — if any fire, drop the candidate and
 * log a cold_outreach_sent row with status='skipped' and the reason.
 *
 * Blast-radius logic: we'd rather send 7 clean emails than 10 including
 * one that embarrasses Danny. The full batch can run light and still
 * provide daily drip.
 */
export function qualityGate(body: string, subject: string): QualityGateResult {
  // 1. Word count cap. Static template renders to ~55 words; cap at 70
  // to catch pathological firm-name expansion.
  const words = body.trim().split(/\s+/).filter(Boolean).length
  if (words > 70) return { ok: false, reason: 'over_word_cap' }

  // 2. Required content — fundopshq.com link somewhere in the body.
  if (!body.includes('fundopshq.com')) {
    return { ok: false, reason: 'missing_link' }
  }

  // 3. Required content — signature block with title.
  if (!body.includes('Founder & Host, FundOpsHQ')) {
    return { ok: false, reason: 'missing_signature' }
  }

  // 4. No em/en dashes. Template is clean but a firm name could
  // theoretically contain one — belt-and-suspenders.
  if (body.includes('\u2014') || body.includes('\u2013')) {
    return { ok: false, reason: 'em_dash' }
  }

  // 5. Greeting present — "Hi {Name},\n" form. Block missing greeting
  // and the empty-first-name "Hi ," form.
  if (!body.startsWith('Hi ') || body.startsWith('Hi ,')) {
    return { ok: false, reason: 'missing_greeting' }
  }

  // 6. Subject shape.
  if (!subject.startsWith('Covered ')) {
    return { ok: false, reason: 'wrong_subject_prefix' }
  }
  if (!subject.endsWith(' today')) {
    return { ok: false, reason: 'wrong_subject_suffix' }
  }

  return { ok: true }
}

/**
 * Helper: count words the same way the quality gate does. Exposed so the
 * Anthropic hook generator can self-check output length before it gets
 * composed into the full body.
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
