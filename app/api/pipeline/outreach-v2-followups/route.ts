import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { envMode } from '@/lib/outreach-v2/config'
import { createFollowups } from '@/lib/outreach-v2/sponsor-pitch'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron (13:00 UTC, weekdays): queues the one follow-up each sponsor pitch gets,
 * five business days after it went, unless they replied, unsubscribed, bounced
 * or complained (lib/outreach-v2/sponsor-pitch.ts). In preview it only counts
 * what is due; off does nothing.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (envMode() === 'off') return NextResponse.json({ ok: true, skipped: 'mode off' })
  try {
    return NextResponse.json({ ok: true, ...(await createFollowups(getSupabaseAdmin())) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
