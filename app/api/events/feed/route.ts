import { NextResponse } from 'next/server'
import { getEventFeed, queryEventFeed, type EventQueryParams } from '@/lib/events/api'

export const dynamic = 'force-dynamic'

/**
 * Served from the edge for two minutes, and for ten more while a fresh copy
 * is fetched behind it: the board's filters are a small set of URLs that many
 * visitors share, and the events behind them change weekly.
 */
const CACHE = 'public, s-maxage=120, stale-while-revalidate=600'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = url.searchParams

  const query: EventQueryParams = {
    q: params.get('q') || undefined,
    when: params.get('when') || undefined,
    kind: params.get('kind') || undefined,
    format: params.get('format') || undefined,
    cost: params.get('cost') || undefined,
    category: params.get('category') || undefined,
    topic: params.get('topic') || undefined,
    city: params.get('city') || undefined,
    region: params.get('region') || undefined,
    ops: params.get('ops') || undefined,
    offset: params.get('offset') ? Number(params.get('offset')) : undefined,
    limit: params.get('limit') ? Number(params.get('limit')) : undefined,
  }

  try {
    // A text search goes to the table; everything else is one of a small set of views, and is kept.
    const result = query.q ? await queryEventFeed(query) : await getEventFeed(query)
    return NextResponse.json({ data: result }, { headers: { 'Cache-Control': CACHE } })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
