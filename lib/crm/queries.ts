import { getCrmAdmin } from './supabase'

export type WorkState = 'to_do' | 'in_progress' | 'done' | 'parked'
export type ShareOk = 'yes' | 'no_discreet' | 'no_internal'

export interface DeskRow {
  id: string
  lead_ref: string
  work_state: WorkState
  priority: 'A' | 'B' | 'C' | null
  share_ok: ShareOk
  target_raise: string | null
  date_received: string | null
  status: string
  blocker: string | null
  notes: string | null
  created_at: string
  worked_at: string | null
  firm_id: string
  firm_name: string
  domain: string | null
  website: string | null
  firm_type: string | null
  strategy: string | null
  firm_location: string | null
  person_id: string
  full_name: string
  title: string | null
  role_class: string | null
  email: string
  email_type: string | null
  email_confidence: string | null
  phone: string | null
  linkedin: string | null
  hold_note: string | null
  person_location: string | null
  source_name: string | null
  source_org: string | null
  source_type: string | null
}

export interface ContactLogEntry {
  occurred_at: string
  event_type: string
  channel: string | null
  subject: string | null
  notes: string | null
}

/**
 * Reads `desk_rows`, which enforces the promotion gate in SQL — disqualified
 * firms, parked leads, and rows without a researched person and a real email
 * are structurally absent. Do not query `leads` directly for the grid.
 */
export async function fetchDeskRows(limit = 1000): Promise<DeskRow[]> {
  const { data, error } = await getCrmAdmin()
    .from('desk_rows')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Lead Desk query failed: ${error.message}`)
  return (data ?? []) as DeskRow[]
}

export async function fetchContactLog(firmId: string): Promise<ContactLogEntry[]> {
  const { data, error } = await getCrmAdmin()
    .from('contact_log')
    .select('occurred_at, event_type, channel, subject, notes')
    .eq('firm_id', firmId)
    .order('occurred_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(`Contact log query failed: ${error.message}`)
  return (data ?? []) as ContactLogEntry[]
}

/**
 * Marking work done ALSO writes a contact_log row. Without that the
 * suppression window would start from when the row appeared rather than from
 * when Danny actually worked it, and the firm would resurface too soon.
 *
 * `logAs` maps to the two suppression windows:
 *   researched -> 9 months     contacted -> 6 months
 */
export async function setWorkState(
  leadIds: string[],
  workState: WorkState,
  logAs: 'researched' | 'contacted' | null
): Promise<{ updated: number; logged: number }> {
  if (leadIds.length === 0) return { updated: 0, logged: 0 }
  const sb = getCrmAdmin()

  const { data: rows, error: readErr } = await sb
    .from('leads')
    .select('id, firm_id, person_id')
    .in('id', leadIds)
  if (readErr) throw new Error(`Lookup failed: ${readErr.message}`)

  const now = new Date().toISOString()
  const { error: updErr } = await sb
    .from('leads')
    .update({
      work_state: workState,
      worked_at: workState === 'done' ? now : null,
    })
    .in('id', leadIds)
  if (updErr) throw new Error(`Update failed: ${updErr.message}`)

  let logged = 0
  if (logAs && rows?.length) {
    const entries = rows.map((r) => ({
      firm_id: r.firm_id,
      person_id: r.person_id,
      event_type: logAs,
      occurred_at: now,
      channel: logAs === 'contacted' ? 'email' : 'none',
      notes: `Marked ${workState} from Lead Desk`,
      created_by: 'danny',
    }))
    const { error: logErr } = await sb.from('contact_log').insert(entries)
    if (logErr) throw new Error(`Contact log write failed: ${logErr.message}`)
    logged = entries.length
  }

  return { updated: leadIds.length, logged }
}

/**
 * The client-facing export. Reads `leads_shareable`, which structurally omits
 * source, priority, readiness, blocker, lead_ref and notes — they cannot leak
 * because they are not columns in that view. Never build an export from
 * `leads` or `desk_rows`.
 */
export async function fetchShareableCut(): Promise<Record<string, unknown>[]> {
  const { data, error } = await getCrmAdmin()
    .from('leads_shareable')
    .select('*')
    .order('company', { ascending: true })

  if (error) throw new Error(`Shareable cut query failed: ${error.message}`)
  return (data ?? []) as Record<string, unknown>[]
}
