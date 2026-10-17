import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { envMode } from '@/lib/outreach-v2/config'
import { dispatchOne } from '@/lib/outreach-v2/send'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron (every five minutes, 13:00–21:55 UTC, weekdays): sends at most ONE
 * queued outreach email (lib/outreach-v2/send.ts), so a batch goes out about
 * five minutes apart, inside New York business hours, under the daily cap of
 * thirty. Does nothing (and touches nothing) unless OUTREACH_V2_MODE=live and
 * the halt flag is clear.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (envMode() !== 'live') return NextResponse.json({ ok: true, skipped: `mode ${envMode()}` })
  try {
    // `?anyTime=1` on an authorised manual call sends outside weekday hours (Danny, 2026-10-17: "send some today",
    // a Saturday). The daily cap, the halt flag and every exclusion still apply.
    const anyTime = new URL(req.url).searchParams.get('anyTime') === '1'
    const result = await dispatchOne(getSupabaseAdmin(), new Date(), { ignoreHours: anyTime })
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
