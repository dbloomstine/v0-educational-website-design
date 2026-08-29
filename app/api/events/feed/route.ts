import { NextResponse } from 'next/server'
import { queryEventFeed } from '@/lib/events/api'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = url.searchParams

  try {
    const result = await queryEventFeed({
      q: params.get('q') || undefined,
      when: params.get('when') || undefined,
      kind: params.get('kind') || undefined,
      format: params.get('format') || undefined,
      cost: params.get('cost') || undefined,
      category: params.get('category') || undefined,
      region: params.get('region') || undefined,
      ops: params.get('ops') || undefined,
      offset: params.get('offset') ? Number(params.get('offset')) : undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : undefined,
    })

    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
