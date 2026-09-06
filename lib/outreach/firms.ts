/**
 * Target-firm registry for lookalike outreach (Danny, 2026-09-06):
 * "maintain a list of companies or firms who are probably good to do this,
 * and then go through Apollo to see if you can find their information, as
 * opposed to starting with Apollo."
 *
 * `outreach_target_firms` holds referral-partner firms that do not compete
 * with IQ-EQ (lawyers, bankers, auditors, software, placement agents,
 * insurance brokers), seeded from loyal-reader firms plus a curated list.
 * The nightly job walks it least-recently-targeted first, one contact per
 * firm per run, and only falls back to Apollo keyword search when the
 * registry produces nothing. Apollo's role is reduced to "find a person at
 * this firm", searched by domain, which is free until the match call.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { segmentByKey, type LookalikeSegment } from './segments'

export interface TargetFirm {
  id: string
  name: string
  domain: string
  category: string
  keywords: string | null
  source: string
  priority: number
  contacts_found: number
  last_targeted_at: string | null
}

/**
 * Per-category keyword ladder when a firm has no override: tried in order
 * until a domain-scoped search returns someone. Short phrases only —
 * Apollo ANDs tokens. `null` means titles-only (the software firms: the
 * people we want there have generic sales titles).
 */
export const CATEGORY_KEYWORD_LADDER: Record<string, Array<string | null>> = {
  fund_lawyers: ['investment funds', 'private funds', 'fund formation', 'funds'],
  fund_finance_banking: ['fund finance', 'financial sponsors', 'subscription', 'fund banking'],
  fund_auditors: ['alternative investments', 'asset management', 'private equity', 'funds'],
  fund_software: [null],
  placement_agents: [null, 'private capital', 'placement'],
  fund_insurance: ['private equity', 'management liability', 'financial institutions', 'transaction liability'],
}

export function keywordLadderFor(firm: Pick<TargetFirm, 'category' | 'keywords'>): Array<string | null> {
  if (firm.keywords && firm.keywords.trim()) return [firm.keywords.trim()]
  return CATEGORY_KEYWORD_LADDER[firm.category] ?? [null]
}

export function segmentForFirm(firm: Pick<TargetFirm, 'category'>): LookalikeSegment | undefined {
  return segmentByKey(firm.category)
}

/** Least-recently-targeted first (never-targeted before everything), then priority. */
export async function pickTargetFirms(supabase: SupabaseClient, limit: number): Promise<TargetFirm[]> {
  const { data, error } = await supabase
    .from('outreach_target_firms')
    .select('id,name,domain,category,keywords,source,priority,contacts_found,last_targeted_at')
    .eq('is_active', true)
    .order('last_targeted_at', { ascending: true, nullsFirst: true })
    .order('priority', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`pickTargetFirms: ${error.message}`)
  return (data ?? []) as TargetFirm[]
}

/** Stamp the firm so it rotates to the back of the queue, and count what it yielded. */
export async function markFirmTargeted(supabase: SupabaseClient, firm: TargetFirm, contactsFound: number): Promise<void> {
  const { error } = await supabase
    .from('outreach_target_firms')
    .update({ last_targeted_at: new Date().toISOString(), contacts_found: firm.contacts_found + contactsFound })
    .eq('id', firm.id)
  if (error) console.error('markFirmTargeted failed', firm.domain, error.message)
}
