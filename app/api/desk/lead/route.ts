import { NextResponse } from 'next/server'
import { fetchLeadDetail } from '@/lib/crm/queries'

export const runtime = 'nodejs'

/**
 * The drawer-only fields for one lead: internal notes, firm notes, the
 * research summary. The grid no longer carries them for every row, so the
 * drawer asks for them when a row is opened. Gated by `proxy.ts` like every
 * other /api/desk route.
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const detail = await fetchLeadDetail(id)
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ detail })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Query failed' },
      { status: 500 }
    )
  }
}
