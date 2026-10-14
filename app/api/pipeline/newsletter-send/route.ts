import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { sendDailyNewsletter } from '@/lib/newsletter/send-daily'
import { sendWindowOpen } from '@/lib/newsletter/send-time'

export const maxDuration = 120

export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    return NextResponse.json(
      { error: 'Missing RESEND_API_KEY' },
      { status: 500 }
    )
  }

  try {
    const url = new URL(req.url)

    // Two crons a morning (10:30 and 11:30 UTC) keep the send at 6:30 New York
    // time on both sides of daylight saving; the one that lands at 5:30 in
    // winter stops here (lib/newsletter/send-time.ts). ?anyTime=1 lets a
    // manual catch-up run go out before 6:00.
    if (!sendWindowOpen(new Date()) && url.searchParams.get('anyTime') !== '1') {
      return NextResponse.json({ ok: true, skipped: 'before_send_time' })
    }

    // Allow overriding lookback window for testing (e.g. ?hoursBack=72)
    const hoursBack = Number(url.searchParams.get('hoursBack')) || 26

    const result = await sendDailyNewsletter(
      getSupabaseAdmin(),
      resendApiKey,
      hoursBack
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Newsletter send failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Newsletter send failed' },
      { status: 500 }
    )
  }
}
