import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { mondayEmailLive } from '@/lib/events/weekly-mode'
import { computeAudience } from '@/lib/sponsor/stats'
import { resendEventById } from '@/lib/newsletter/resend-events'
import { renderSeriesEmail } from '@/lib/newsletter/welcome-series'
import { runWelcomeSeries } from '@/lib/newsletter/welcome-series-send'
import { seriesWindowOpen, welcomeSeriesEnabled, type WelcomeEmailKey } from '@/lib/newsletter/welcome-series-schedule'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const KEYS: WelcomeEmailKey[] = ['1', '2', '3', '3b', '4']

/**
 * The FundOps Daily welcome series (lib/newsletter/welcome-series*.ts). Cron: at :30 past each hour from 16:30 to
 * 20:30 UTC, Tuesday to Friday (vercel.json); a fire sends only between 12:15 and 17:00 New York time, so 12:30 ET is
 * the first fire either side of daylight saving and the later ones are retries. Sends nothing unless
 * WELCOME_SERIES_ENABLED=true.
 *
 *   ?dryRun=1                  who would get which email today, and the plan for everyone else (reads only, any time,
 *                              whatever the switch)
 *   ?preview=1&email=3b        one email rendered with placeholder links, sent to nobody (&format=text for the text)
 *   ?anyTime=1                 a manual live run outside the window (Tuesday to Friday still; the table stops repeats)
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)

  if (url.searchParams.get('preview') === '1') {
    const key = (KEYS.find((k) => k === url.searchParams.get('email')) ?? '1') as WelcomeEmailKey
    const email = renderSeriesEmail(key, {
      unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=PREVIEW',
      preferencesUrl: 'https://fundopshq.com/preferences?token=PREVIEW',
      interestToken: 'PREVIEW',
      audience: null,
      eventsMondayLive: mondayEmailLive(),
    })
    if (url.searchParams.get('format') === 'text' || !email.html) {
      return new NextResponse(`Subject: ${email.subject}\n\n${email.text}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
    }
    return new NextResponse(email.html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const lastEvent = resendApiKey ? (id: string) => resendEventById(resendApiKey, id) : undefined
  const audience = async () => {
    const a = await computeAudience()
    return { readers: a.subscribers, firms: a.firms }
  }

  if (url.searchParams.get('dryRun') === '1') {
    const result = await runWelcomeSeries({ db: getSupabaseAdmin(), mode: 'dry', lastEvent, audience, eventsMondayLive: mondayEmailLive() })
    return NextResponse.json({ enabled: welcomeSeriesEnabled(), ...result }, { status: result.ok ? 200 : 500 })
  }

  if (!welcomeSeriesEnabled()) return NextResponse.json({ ok: true, skipped: 'off' })
  if (!seriesWindowOpen(new Date()) && url.searchParams.get('anyTime') !== '1') {
    return NextResponse.json({ ok: true, skipped: 'outside_send_window' })
  }
  if (!resendApiKey) return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 })

  try {
    const result = await runWelcomeSeries({ db: getSupabaseAdmin(), mode: 'live', resendApiKey, lastEvent, audience, eventsMondayLive: mondayEmailLive() })
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    console.error('[welcome-series] failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Welcome series failed' }, { status: 500 })
  }
}
