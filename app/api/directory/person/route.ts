import { NextResponse } from 'next/server'
import { loadPerson } from '@/lib/directory/data'
import { personDetail } from '@/lib/directory/explore-detail'
import { categoryBySlug, directoryEnabled } from '@/lib/directory/taxonomy'

// GET /api/directory/person?trade=fund-lawyers&slug=jane-smith-kirkland: the explorer's side panel
// (lib/directory/explore-detail.ts says what it holds). The same cached profile read as the profile page
// (lib/directory/data.ts loadPerson), so it costs no query of its own; the edge keeps it like the index.

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const trade = categoryBySlug(sp.get('trade') ?? '')
  if (!directoryEnabled() || !trade?.live) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const p = await loadPerson(trade.id, sp.get('slug') ?? '')
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404, headers: { 'cache-control': 'public, max-age=60, s-maxage=300' } })
  return NextResponse.json(personDetail(p), {
    headers: { 'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400', 'x-robots-tag': 'noindex' },
  })
}
