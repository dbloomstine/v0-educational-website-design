import { NextResponse } from 'next/server'
import { queryArticleFeed } from '@/lib/news/api'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = url.searchParams

  try {
    const result = await queryArticleFeed({
      q: params.get('q') || undefined,
      range: params.get('range') || undefined,
      category: params.get('category') || undefined,
      type: params.get('type') || undefined,
      fundSizeMin: params.get('fundSizeMin') || undefined,
      fundSizeMax: params.get('fundSizeMax') || undefined,
      sort: params.get('sort') || undefined,
      offset: params.get('offset') ? Number(params.get('offset')) : undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : undefined,
    })

    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
