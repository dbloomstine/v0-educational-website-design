import { NextResponse } from 'next/server'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { queryCircuitContent, renderCircuitEmail, sendCircuitEmail } from '@/lib/events/circuit-email'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// The Circuit — weekly events digest. Cron: Mondays (vercel.json).
// SHIPS DARK: with CIRCUIT_ENABLED unset/false, each run emails a [PREVIEW]
// to Danny only. Set CIRCUIT_ENABLED=true in Vercel env to send to the
// confirmed FundOps Daily list.
//
// Manual testing:
//   ?preview=1  → returns the rendered HTML (no email sent)
export async function GET(req: Request) {
  const url = new URL(req.url)

  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (url.searchParams.get('preview') === '1') {
    const content = await queryCircuitContent()
    const html = renderCircuitEmail(content, 'https://fundopshq.com/events')
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  try {
    const result = await sendCircuitEmail(resendApiKey)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Circuit send failed' },
      { status: 500 }
    )
  }
}
