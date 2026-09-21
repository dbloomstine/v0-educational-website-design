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
  lead_type: string | null
  readiness: string | null
  service_line: string | null
  share_ok_reason: string | null
  created_at: string
  worked_at: string | null
  firm_id: string
  firm_name: string
  domain: string | null
  website: string | null
  firm_type: string | null
  strategy: string | null
  aum_usd: number | null
  n_funds: number | null
  firm_notes: string | null
  firm_location: string | null
  firm_country: string | null
  person_id: string
  full_name: string
  title: string | null
  role_class: string | null
  email: string
  email_type: string | null
  email_confidence: string | null
  email_verified_at: string | null
  phone: string | null
  linkedin: string | null
  linkedin_verified: boolean
  hold_note: string | null
  person_location: string | null
  source_name: string | null
  source_org: string | null
  source_type: string | null
  research_summary: string | null
  touch_count: number
  /** Pre-written first touch. Never sent by any code path — Danny sends it. */
  email_subject: string | null
  email_body: string | null
  /** Why a draft was withheld: discreet, on hold, or not yet named. */
  draft_note: string | null
  /** Cleared every free check but has no verified email yet. */
  provisional: boolean
  /** Which feed surfaced this lead, e.g. "SEC Form D". Distinct from
   *  source_name, which means the referral partner who sent it. */
  origin: string | null
  /** The signal headline that produced it. */
  origin_note: string | null
}

export interface ContactLogEntry {
  occurred_at: string
  event_type: string
  channel: string | null
  subject: string | null
  notes: string | null
}

const PAGE_SIZE = 1000
const ID_CHUNK = 200

type PageResult = { data: unknown[] | null; error: { message: string } | null }

/**
 * PostgREST caps every response at 1,000 rows whatever `.limit()` says, so a
 * single query silently stops there: on 2026-09-21 the desk showed 1,000 of
 * 1,234 leads and looked as if rows were being deleted. Read in pages until a
 * short page comes back. The caller's query must carry a stable ORDER BY
 * (a unique tiebreaker), or rows can repeat or go missing between pages.
 */
async function fetchAllPages<T>(
  label: string,
  page: (from: number, to: number) => PromiseLike<PageResult>
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`${label} failed: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < PAGE_SIZE) return out
  }
}

/** A long `in (...)` list overflows the request URL; ask in chunks. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * Reads `desk_rows`, which enforces the promotion gate in SQL — disqualified
 * firms, parked leads, and rows without a researched person and a real email
 * are structurally absent. The one exception is a row flagged `provisional`:
 * it cleared every free check but is still waiting on an email reveal, and it
 * shows in the grid labelled as such so it cannot be mistaken for sendable.
 * Do not query `leads` directly for the grid.
 */
export async function fetchDeskRows(): Promise<DeskRow[]> {
  const rows = await fetchAllPages<DeskRow>(
    'Lead Desk query',
    (from, to) =>
      getCrmAdmin()
        .from('desk_rows')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
  )
  return rows
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
export async function fetchShareableCut(leadIds?: string[]): Promise<Record<string, unknown>[]> {
  const groups: (string[] | null)[] = leadIds?.length ? chunk(leadIds, ID_CHUNK) : [null]
  const rows: Record<string, unknown>[] = []
  for (const ids of groups) {
    rows.push(
      ...(await fetchAllPages<Record<string, unknown>>('Shareable cut query', (from, to) => {
        let q = getCrmAdmin().from('leads_shareable').select('*')
        if (ids) q = q.in('lead_id', ids)
        return q
          .order('company', { ascending: true })
          .order('lead_id', { ascending: true })
          .range(from, to)
      }))
    )
  }
  return rows.sort((a, b) => String(a.company ?? '').localeCompare(String(b.company ?? '')))
}

/** Update the editable free-text fields from the grid drawer. */
export async function updateLeadFields(
  leadId: string,
  fields: { notes?: string | null; firmNotes?: string | null; blocker?: string | null }
): Promise<void> {
  const sb = getCrmAdmin()

  if (fields.notes !== undefined || fields.blocker !== undefined) {
    const patch: Record<string, unknown> = {}
    if (fields.notes !== undefined) patch.notes = fields.notes
    if (fields.blocker !== undefined) patch.blocker = fields.blocker
    const { error } = await sb.from('leads').update(patch).eq('id', leadId)
    if (error) throw new Error(`Note update failed: ${error.message}`)
  }

  if (fields.firmNotes !== undefined) {
    const { data, error: readErr } = await sb
      .from('leads').select('firm_id').eq('id', leadId).single()
    if (readErr) throw new Error(`Lookup failed: ${readErr.message}`)
    const { error } = await sb
      .from('firms').update({ notes: fields.firmNotes }).eq('id', data.firm_id)
    if (error) throw new Error(`Firm note update failed: ${error.message}`)
  }
}

/** Full internal export — every column, for Danny only. Never share this file. */
export async function fetchInternalCut(leadIds?: string[]): Promise<Record<string, unknown>[]> {
  const groups: (string[] | null)[] = leadIds?.length ? chunk(leadIds, ID_CHUNK) : [null]
  const rows: Record<string, unknown>[] = []
  for (const ids of groups) {
    rows.push(
      ...(await fetchAllPages<Record<string, unknown>>('Internal export', (from, to) => {
        let q = getCrmAdmin().from('desk_rows').select('*')
        if (ids) q = q.in('id', ids)
        return q
          .order('firm_name', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to)
      }))
    )
  }
  return rows.sort((a, b) => String(a.firm_name ?? '').localeCompare(String(b.firm_name ?? '')))
}
