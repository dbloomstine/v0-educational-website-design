import { NextResponse } from 'next/server'
import { loadExplorePeople } from '@/lib/directory/explore-data'
import { toExploreRow } from '@/lib/directory/explore'
import { encodeExplore } from '@/lib/directory/explore-index'
import { categoryBySlug, directoryEnabled } from '@/lib/directory/taxonomy'

// GET /api/directory/explore?trade=fund-lawyers: one trade's explorer index (lib/directory/explore-index.ts), fetched
// by /<trade>/explore as soon as it loads. Built from its own cached read (lib/directory/explore-data.ts); the edge
// keeps it an hour and serves a stale copy for a day while it refreshes.

export async function GET(req: Request) {
  const trade = categoryBySlug(new URL(req.url).searchParams.get('trade') ?? '')
  if (!directoryEnabled() || !trade?.live) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const people = await loadExplorePeople(trade.id)
  const year = new Date().getUTCFullYear()
  // An empty list is a database that did not answer: kept a minute, not an hour.
  const cache = people.length ? 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' : 'public, max-age=30, s-maxage=60'
  return NextResponse.json(encodeExplore(people.map((p) => toExploreRow(p, trade)), year), { headers: { 'cache-control': cache, 'x-robots-tag': 'noindex' } })
}
