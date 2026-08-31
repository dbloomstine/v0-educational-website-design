import { fetchShareableCut } from '@/lib/crm/queries'

export const runtime = 'nodejs'

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  // Guard against CSV/formula injection when this opens in Excel or Sheets.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * Client-facing export. Reads `leads_shareable` only — source, priority,
 * blocker, lead_ref and the internal notes are not columns in that view, so
 * they cannot be exported by accident.
 */
export async function GET() {
  try {
    const rows = await fetchShareableCut()
    const headers = [
      'company', 'contact', 'title', 'location', 'fund_type',
      'strategy', 'fund_target', 'status', 'email', 'website',
    ]
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(',')),
    ].join('\r\n')

    const stamp = new Date().toISOString().slice(0, 10)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shareable-cut-${stamp}.csv"`,
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
