/**
 * Outreach dedup queries.
 *
 * Two stages of dedup run in the cron pipeline:
 *
 * 1. firmLevelDedup() — runs after candidate building, BEFORE Apollo.
 *    Drops firms we've contacted in the last 120 days or permanently
 *    blocked. Matches on BOTH firm_name (lowered) AND firm_domain —
 *    either one hit means drop, because firm-name drift is common
 *    ("Court Square Capital Partners" vs "Court Square Capital").
 *
 * 2. emailLevelDedup() — runs after Apollo returns verified contacts.
 *    Drops anyone who (a) is already a FundOps Daily subscriber in any
 *    status, or (b) was contacted via cold_outreach_sent in the last
 *    120 days, or (c) is permanently blocked (status opted_out/bounced).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Candidate, Contact } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

/**
 * Drop candidate firms that match the rolling-window or permanent-block
 * rules in cold_outreach_sent. Returns the filtered candidate list.
 */
export async function firmLevelDedup(
  supabase: DbClient,
  candidates: Candidate[],
): Promise<Candidate[]> {
  if (candidates.length === 0) return []

  // MVP approach: fetch all rows in the 120-day window + permanent blocks,
  // then filter the candidate list client-side. At small table sizes (we
  // expect <5k rows for the first year), this is simpler than Supabase's
  // awkward .or() filter chain. Revisit if cold_outreach_sent grows large.

  const { data: byName, error: nameErr } = await supabase
    .from('cold_outreach_sent')
    .select('firm_name, firm_domain, status, created_at')
    .in('status', ['draft_created', 'sent', 'replied', 'replied_positive', 'opted_out', 'bounced'])
    // Supabase doesn't support lower() on the select-side of .in(), so we
    // pull matching rows by firm_name using ilike with OR. Simpler approach:
    // fetch a wider set filtered by status, then filter client-side.
    .gte('created_at', new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString())

  if (nameErr) {
    throw new Error(`firmLevelDedup name query failed: ${nameErr.message}`)
  }

  // Also fetch permanent blocks regardless of date (opted_out, bounced).
  const { data: blocked, error: blockedErr } = await supabase
    .from('cold_outreach_sent')
    .select('firm_name, firm_domain, status')
    .in('status', ['opted_out', 'bounced'])

  if (blockedErr) {
    throw new Error(`firmLevelDedup blocked query failed: ${blockedErr.message}`)
  }

  // Build a set of blocked keys from both queries.
  const blockedFirmNames = new Set<string>()
  const blockedDomains = new Set<string>()

  for (const row of [...(byName ?? []), ...(blocked ?? [])]) {
    if (row.firm_name) blockedFirmNames.add(row.firm_name.toLowerCase())
    if (row.firm_domain) blockedDomains.add(row.firm_domain)
  }

  // Drop candidates whose firm_name OR firm_domain is in the block set.
  return candidates.filter((c) => {
    if (blockedFirmNames.has(c.firmName.toLowerCase())) return false
    if (c.firmDomain && blockedDomains.has(c.firmDomain)) return false
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
