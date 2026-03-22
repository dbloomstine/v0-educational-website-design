import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { sendDailyNewsletter } from '@/lib/newsletter/send-daily'

export const maxDuration = 120

export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const resendApiKey = process.env.RESEND_API_KEY

  if (!anthropicApiKey || !resendApiKey) {
    return NextResponse.json(
      { error: 'Missing ANTHROPIC_API_KEY or RESEND_API_KEY' },
      { status: 500 }
    )
  }

  try {
    // Allow overriding lookback window for testing (e.g. ?hoursBack=72)
    const url = new URL(req.url)
    const hoursBack = Number(url.searchParams.get('hoursBack')) || 26

    const result = await sendDailyNewsletter(
      getSupabaseAdmin(),
      anthropicApiKey,
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
