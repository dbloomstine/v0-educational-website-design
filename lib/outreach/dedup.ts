/**
 * Outreach dedup queries.
 *
 * Two stages of dedup run in the cron pipeline:
 *
 * 1. firmLevelDedup() — runs after candidate building, BEFORE Apollo.
 *    Two rules:
 *      a. Permanent block. If any row in cold_outreach_sent has status
 *         'opted_out' or 'bounced' for this firm's name or domain, the
 *         firm is off-limits forever. Don't burn sender reputation on a
 *         firm that's already filtering us.
 *      b. Rolling-window count. If we've already sent >= maxContactsPerFirm
 *         contacts to this firm within the last 120 days (any status in
 *         draft_created/sent/replied/replied_positive), drop the firm.
 *         Otherwise allow it — leaves room for multi-contact-per-firm
 *         across runs when maxContactsPerFirm > 1.
 *
 * 2. emailLevelDedup() — runs after Apollo returns verified contacts.
 *    Drops anyone who (a) is already a FundOps Daily subscriber in any
 *    status, or (b) was contacted via cold_outreach_sent in the last
 *    120 days, or (c) is permanently blocked (status opted_out/bounced).
 *    This is the per-person safety net — guarantees nobody gets the
 *    same email twice even when firmLevelDedup allows the firm through
 *    for a multi-contact run.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Candidate, Contact } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

/**
 * Drop candidate firms that match the rolling-window or permanent-block
 * rules in cold_outreach_sent. `maxContactsPerFirm` is the rolling-window
 * allowance — firms get blocked when their 120-day contact count reaches
 * or exceeds this value.
 */
export async function firmLevelDedup(
  supabase: DbClient,
  candidates: Candidate[],
  maxContactsPerFirm: number,
): Promise<Candidate[]> {
  if (candidates.length === 0) return []
  if (maxContactsPerFirm <= 0) return []

  // MVP approach: fetch all rows in the 120-day window + permanent blocks,
  // then filter the candidate list client-side. At small table sizes (we
  // expect <5k rows for the first year), this is simpler than Supabase's
  // awkward .or() filter chain. Revisit if cold_outreach_sent grows large.

  const { data: windowRows, error: winErr } = await supabase
    .from('cold_outreach_sent')
    .select('firm_name, firm_domain, status, created_at')
    .in('status', ['draft_created', 'sent', 'replied', 'replied_positive'])
    .gte('created_at', new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString())

  if (winErr) {
    throw new Error(`firmLevelDedup window query failed: ${winErr.message}`)
  }

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

  // Rolling-window counts, keyed by lowercased firm name. Firm-name drift
  // ("Court Square" vs "Court Square Capital Partners") can undercount in
  // edge cases, but at the current scale that's acceptable — the email-
  // level dedup catches individual-level re-contacts regardless.
  const contactsByFirm: Record<string, number> = {}
  for (const row of windowRows ?? []) {
    if (row.firm_name) {
      const key = row.firm_name.toLowerCase()
      contactsByFirm[key] = (contactsByFirm[key] ?? 0) + 1
    }
  }

  return candidates.filter((c) => {
    const nameKey = c.firmName.toLowerCase()
    // Permanent blocks — immediate drop.
    if (permBlockedFirmNames.has(nameKey)) return false
    if (c.firmDomain && permBlockedDomains.has(c.firmDomain)) return false
    // Rolling-window count — drop if we've hit the per-firm allowance.
    const existingCount = contactsByFirm[nameKey] ?? 0
    if (existingCount >= maxContactsPerFirm) return false
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
