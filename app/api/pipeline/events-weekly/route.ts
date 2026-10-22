import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { eventsWeeklyMode } from '@/lib/events/weekly-mode'
import { newYorkToday } from '@/lib/events/highlights'
import { planForReader, renderWeeklyEmail, renderWeeklyText, selectWeeklyEvents, weeklySendWindowOpen, weeklySubject } from '@/lib/events/weekly-email'
import { loadUpcomingEvents, runEventsWeekly } from '@/lib/events/weekly-send'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const CITY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * The Monday events email (lib/events/weekly-email.ts, lib/events/weekly-send.ts). Cron: Mondays at 10:45 and
 * 11:45 UTC (vercel.json); only the fire that lands between 6:15 and 7:15 New York time sends (6:45 either side
 * of daylight saving). Does nothing unless EVENTS_WEEKLY_MODE is `preview` (one copy to the owner) or `live`.
 *
 *   ?preview=1                 the rendered HTML, sent to nobody, whatever the mode
 *   ?preview=1&city=chicago    as a reader following Chicago would get it
 *   ?preview=1&format=text     the plain-text part
 *   ?anyTime=1                 a manual run outside the Monday window (the week's record still stops a repeat)
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)

  if (url.searchParams.get('preview') === '1') {
    const city = (url.searchParams.get('city') ?? '').trim().toLowerCase()
    const todayIso = newYorkToday()
    const plan = planForReader(selectWeeklyEvents(await loadUpcomingEvents(), todayIso), CITY.test(city) ? [city] : [])
    const params = { plan, todayIso, eventsUnsubscribeUrl: '#', unsubscribeAllUrl: '#' }
    if (url.searchParams.get('format') === 'text') {
      return new NextResponse(`Subject: ${weeklySubject(plan)}\n\n${renderWeeklyText(params)}`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }
    return new NextResponse(renderWeeklyEmail(params), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
  }

  const mode = eventsWeeklyMode()
  if (mode === 'off') return NextResponse.json({ ok: true, mode, skipped: 'off' })

  if (!weeklySendWindowOpen(new Date()) && url.searchParams.get('anyTime') !== '1') {
    return NextResponse.json({ ok: true, mode, skipped: 'outside_send_window' })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 })

  try {
    const result = await runEventsWeekly({ db: getSupabaseAdmin(), mode, resendApiKey })
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    console.error('[events-weekly] failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Events weekly send failed' }, { status: 500 })
  }
}
