import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// Outbound-click beacon (navigator.sendBeacon from EventRow / detail CTA).
// Count only — no PII, no cookies. Tells us which events the audience
// actually cares about, which feeds curation and sponsor conversations.
export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return new NextResponse(null, { status: 204 })
    }
    await getSupabaseAdmin().rpc('increment_event_click', { eid: id })
  } catch {
    // beacons never surface errors
  }
  return new NextResponse(null, { status: 204 })
}
