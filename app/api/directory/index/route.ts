import { NextResponse } from 'next/server'
import { loadPeople } from '@/lib/directory/data'
import { isPublic } from '@/lib/directory/people'
import { toRow } from '@/lib/directory/rows'
import { encodeIndex } from '@/lib/directory/search-index'
import { categoryBySlug, directoryEnabled } from '@/lib/directory/taxonomy'

// GET /api/directory/index?trade=placement-agents: one trade's compact search index (lib/directory/search-index.ts),
// fetched by the hub's browser the first time a reader searches, filters, sorts or pages. Built from the same cached
// list as the hub (lib/directory/data.ts loadPeople), so it costs no query of its own; the edge keeps it an hour and
// serves a stale copy for a day while it refreshes. A hide or a removal is reflected within the hour (the profile
// itself goes at once: the `directory` tag).

export async function GET(req: Request) {
  const trade = categoryBySlug(new URL(req.url).searchParams.get('trade') ?? '')
  if (!directoryEnabled() || !trade?.live) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const people = (await loadPeople(trade.id)).filter((p) => isPublic(p))
  return NextResponse.json(encodeIndex(people.map(toRow)), {
    headers: { 'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
