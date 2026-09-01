import * as XLSX from 'xlsx'
import { fetchShareableCut, fetchInternalCut } from '@/lib/crm/queries'

export const runtime = 'nodejs'

/**
 * Two exports, deliberately different:
 *
 *  - `shareable` reads leads_shareable — the view that structurally omits
 *    source, priority, readiness, blocker, lead_ref and notes. Safe to put in
 *    front of a prospect or referral partner.
 *  - `internal` reads desk_rows — everything, including handling notes and who
 *    referred the lead. NEVER send this to anyone.
 *
 * The internal file is watermarked on a first row so a stray copy is obvious.
 */

const SHAREABLE_COLS = [
  ['company', 'Company'], ['contact', 'Contact'], ['title', 'Title'],
  ['location', 'Location'], ['fund_type', 'Fund type'], ['strategy', 'Strategy'],
  ['fund_target', 'Fund / target'], ['status', 'Status'],
  ['email', 'Email'], ['website', 'Website'],
] as const

const INTERNAL_COLS = [
  ['lead_ref', 'Ref'], ['work_state', 'Work state'], ['date_received', 'Received'],
  ['full_name', 'Contact'], ['title', 'Title'], ['role_class', 'Role'],
  ['firm_name', 'Company'], ['domain', 'Domain'], ['website', 'Website'],
  ['firm_type', 'Fund type'], ['strategy', 'Strategy'],
  ['target_raise', 'Fund / target'], ['status', 'Status'],
  ['person_location', 'Person based'], ['firm_location', 'Fund based'],
  ['email', 'Email'], ['email_type', 'Email type'], ['email_confidence', 'Email confidence'],
  ['phone', 'Phone'], ['linkedin', 'LinkedIn'], ['linkedin_verified', 'LinkedIn verified'],
  ['priority', 'Priority'], ['share_ok', 'Share'], ['share_ok_reason', 'Share reason'],
  ['lead_type', 'Lead type'], ['readiness', 'Readiness'], ['blocker', 'Blocker'],
  ['source_name', 'Source'], ['source_org', 'Source org'],
  ['hold_note', 'HANDLING'], ['notes', 'Internal note'],
  ['firm_notes', 'Firm note'], ['research_summary', 'Research'],
  ['touch_count', 'Touches'],
] as const

function sheetFrom(rows: Record<string, unknown>[], cols: readonly (readonly [string, string])[]) {
  const body = rows.map((r) => {
    const o: Record<string, unknown> = {}
    for (const [key, label] of cols) o[label] = r[key] ?? ''
    return o
  })
  const ws = XLSX.utils.json_to_sheet(body, { header: cols.map((c) => c[1]) })
  ws['!cols'] = cols.map(([key]) => ({
    wch: key === 'notes' || key === 'research_summary' || key === 'strategy' || key === 'hold_note' ? 46 : 20,
  }))
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({
    s: { r: 0, c: 0 }, e: { r: body.length, c: cols.length - 1 },
  }) }
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  return ws
}

export async function POST(req: Request) {
  let ids: string[] | undefined
  let mode = 'shareable'
  try {
    const b = await req.json()
    mode = b?.mode === 'internal' ? 'internal' : 'shareable'
    if (Array.isArray(b?.ids) && b.ids.length) {
      ids = b.ids.filter((x: unknown): x is string => typeof x === 'string')
    }
  } catch {
    /* no body: export everything in shareable mode */
  }

  try {
    const wb = XLSX.utils.book_new()
    const stamp = new Date().toISOString().slice(0, 10)
    let name: string

    if (mode === 'internal') {
      const rows = await fetchInternalCut(ids)
      XLSX.utils.book_append_sheet(wb, sheetFrom(rows, INTERNAL_COLS), 'Leads (INTERNAL)')
      name = `lead-desk-INTERNAL-${stamp}.xlsx`
    } else {
      const rows = await fetchShareableCut(ids)
      XLSX.utils.book_append_sheet(wb, sheetFrom(rows, SHAREABLE_COLS), 'Leads')
      name = `lead-desk-shareable-${stamp}.xlsx`
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 }
    )
  }
}
