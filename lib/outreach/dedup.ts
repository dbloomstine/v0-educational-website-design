/**
 * Outreach dedup queries.
 *
 * Two stages of dedup run in the cron pipeline:
 *
 * 1. firmLevelDedup() — runs after candidate building, BEFORE Apollo.
 *    PERMANENT-BLOCK ONLY. If any row in cold_outreach_sent has status
 *    'opted_out' or 'bounced' for this firm's name or domain, the
 *    firm is off-limits forever. Don't burn sender reputation on a
 *    firm that's already filtering us. No rolling-window count — we
 *    want to drip new people at the same firm over time as news comes
 *    up, not take the whole firm out of rotation after hitting a few
 *    people. Per-run quota is enforced by findContactsForFirm's
 *    maxContacts parameter, not at the firm-dedup layer. Individual
 *    re-contacts are guarded by emailLevelDedup below.
 *
 * 2. emailLevelDedup() — runs after Apollo returns verified contacts.
 *    Drops anyone who (a) is already a FundOps Daily subscriber in any
 *    status, or (b) was contacted via cold_outreach_sent in the last
 *    120 days, or (c) is permanently blocked (status opted_out/bounced).
 *    This is the per-person safety net and the SINGLE SOURCE OF TRUTH
 *    for "don't re-contact this specific person." A given person gets
 *    exactly one cold email per 120-day rolling window, regardless of
 *    how many times their firm cycles through the candidate pool.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Candidate, Contact } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

/**
 * Drop candidate firms with a permanent block (opted_out or bounced)
 * in cold_outreach_sent. No rolling-window count — firms that have been
 * contacted before but haven't permanently blocked us are free to cycle
 * back into the candidate pool with NEW people as news comes up. The
 * per-run quota of contacts per firm is enforced by findContactsForFirm
 * in apollo-client.ts. Individual re-contact protection is handled by
 * emailLevelDedup (120-day rolling window per email address).
 */
export async function firmLevelDedup(
  supabase: DbClient,
  candidates: Candidate[],
): Promise<Candidate[]> {
  if (candidates.length === 0) return []

  // Permanent blocks — any row ever with status opted_out or bounced.
  const { data: blocked, error: blockedErr } = await supabase
    .from('cold_outreach_sent')
    .select('firm_name, firm_domain, status')
    .in('status', ['opted_out', 'bounced'])

  if (blockedErr) {
    throw new Error(`firmLevelDedup blocked query failed: ${blockedErr.message}`)
  }

  // Permanent block sets — firm name OR domain match = drop forever.
  const permBlockedFirmNames = new Set<string>()
  const permBlockedDomains = new Set<string>()
  for (const row of blocked ?? []) {
    if (row.firm_name) permBlockedFirmNames.add(row.firm_name.toLowerCase())
    if (row.firm_domain) permBlockedDomains.add(row.firm_domain)
  }

  return candidates.filter((c) => {
    const nameKey = c.firmName.toLowerCase()
    if (permBlockedFirmNames.has(nameKey)) return false
    if (c.firmDomain && permBlockedDomains.has(c.firmDomain)) return false
    return true
  })
}

/**
 * Drop contacts whose email is already a subscriber, or already in
 * cold_outreach_sent within the rolling window or permanent-block set.
 */
export async function emailLevelDedup(
  supabase: DbClient,
  contacts: Contact[],
): Promise<Contact[]> {
  if (contacts.length === 0) return []

  // 1. newsletter_subscribers check — any status (confirmed, unsubscribed, etc.).
  const { data: subs, error: subErr } = await supabase
    .from('newsletter_subscribers')
    .select('email')

  if (subErr) {
    throw new Error(`emailLevelDedup subscribers query failed: ${subErr.message}`)
  }

  const subscriberEmails = new Set<string>(
    (subs ?? []).map((r) => (r.email as string).toLowerCase()),
  )

  // 2. cold_outreach_sent within rolling window or permanent-block.
  const { data: prior, error: priorErr } = await supabase
    .from('cold_outreach_sent')
    .select('email, status, created_at')
    .gte('created_at', new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString())

  if (priorErr) {
    throw new Error(`emailLevelDedup prior outreach query failed: ${priorErr.message}`)
  }

  const { data: blocked, error: blockedErr } = await supabase
    .from('cold_outreach_sent')
    .select('email, status')
    .in('status', ['opted_out', 'bounced'])

  if (blockedErr) {
    throw new Error(`emailLevelDedup blocked query failed: ${blockedErr.message}`)
  }

  const priorEmails = new Set<string>()
  for (const row of [...(prior ?? []), ...(blocked ?? [])]) {
    if (row.email) priorEmails.add((row.email as string).toLowerCase())
  }

  // Cross-reference against our input.
  return contacts.filter((c) => {
    const lower = c.email.toLowerCase()
    if (subscriberEmails.has(lower)) return false
    if (priorEmails.has(lower)) return false
    return true
  })
}

/**
 * Idempotency guard: has the cron already run successfully today?
 * Returns the count of rows logged today with status in ('sent', 'draft_created').
 */
export async function countTodaysRuns(supabase: DbClient): Promise<number> {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('cold_outreach_sent')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .in('status', ['sent', 'draft_created'])

  if (error) {
    throw new Error(`countTodaysRuns failed: ${error.message}`)
  }

  return count ?? 0
}
