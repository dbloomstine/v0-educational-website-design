/**
 * Suppression for FundOpsHQ outreach.
 *
 * Two rules, both from Danny (2026-09-06):
 *  1. Never email anyone the IQ-EQ Lead Desk is (or may be) reaching out to.
 *     The two datasets must never be joined, so the FundOpsHQ side holds
 *     ONLY SHA-256 hashes of Lead Desk emails (outreach_suppression_hashes),
 *     computed inside the Lead Desk database so no identity crosses over.
 *  2. Never email an iqeq.com address (colleagues; several are subscribers).
 */
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

export function sha256Hex(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

export interface SuppressionOutcome<T> {
  kept: T[]
  dropped: Array<{ email: string; reason: 'iqeq_domain' | 'lead_desk_suppressed' }>
}

export async function filterSuppressed<T extends { email: string }>(
  supabase: DbClient,
  contacts: T[],
): Promise<SuppressionOutcome<T>> {
  const dropped: SuppressionOutcome<T>['dropped'] = []
  const notIqeq = contacts.filter((c) => {
    if (c.email.toLowerCase().endsWith('@iqeq.com')) { dropped.push({ email: c.email, reason: 'iqeq_domain' }); return false }
    return true
  })
  if (notIqeq.length === 0) return { kept: [], dropped }
  const hashes = notIqeq.map((c) => sha256Hex(c.email))
  const { data, error } = await supabase
    .from('outreach_suppression_hashes')
    .select('hash')
    .in('hash', hashes)
  if (error) throw new Error(`suppression lookup failed: ${error.message}`)
  const hit = new Set((data ?? []).map((r) => r.hash as string))
  const kept = notIqeq.filter((c) => {
    if (hit.has(sha256Hex(c.email))) { dropped.push({ email: c.email, reason: 'lead_desk_suppressed' }); return false }
    return true
  })
  return { kept, dropped }
}
