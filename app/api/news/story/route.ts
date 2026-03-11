import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const INTEL_API_URL = process.env.INTEL_API_URL || 'https://intel.fundopshq.com'
const INTEL_API_KEY = process.env.INTEL_API_KEY || ''

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const res = await fetch(`${INTEL_API_URL}/api/news/story?id=${id}`, {
      headers: { 'x-api-key': INTEL_API_KEY },
    })
    if (!res.ok) return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 })
  }
}
