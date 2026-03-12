import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const INTEL_API_URL = process.env.INTEL_API_URL || 'https://intel.fundopshq.com'
const INTEL_API_KEY = process.env.INTEL_API_KEY || ''

/**
 * Translates website query params to intel API param names.
 * Website uses user-friendly names in URLs; intel API has its own conventions.
 */
const RANGE_TO_DAYS: Record<string, string> = {
  '24h': '1',
  '7d': '7',
  '30d': '30',
  '90d': '90',
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const incoming = url.searchParams

  // Build translated params for intel API
  const params = new URLSearchParams()

  // range → days (e.g., '7d' → '7')
  const range = incoming.get('range')
  if (range && RANGE_TO_DAYS[range]) {
    params.set('days', RANGE_TO_DAYS[range])
  }

  // fundSizeMin → minSize, fundSizeMax → maxSize
  const fundSizeMin = incoming.get('fundSizeMin')
  if (fundSizeMin) {
    params.set('minSize', fundSizeMin)
  }
  const fundSizeMax = incoming.get('fundSizeMax')
  if (fundSizeMax) {
    params.set('maxSize', fundSizeMax)
  }

  // trusted → quality
  if (incoming.get('trusted') === 'true') {
    params.set('quality', 'trusted')
  }

  // Pass through params that already match intel's API
  for (const key of ['q', 'category', 'type', 'firm', 'offset', 'limit']) {
    const val = incoming.get(key)
    if (val) params.set(key, val)
  }

  try {
    const res = await fetch(`${INTEL_API_URL}/api/news/feed?${params.toString()}`, {
      headers: { 'x-api-key': INTEL_API_KEY },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
