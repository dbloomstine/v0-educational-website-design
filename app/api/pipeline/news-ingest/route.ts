import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { runIngestion } from '@/lib/news/ingest-worker'

export const maxDuration = 120

export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const tiersParam = url.searchParams.get('tiers')
  const tiers = tiersParam
    ? tiersParam.split(',').map(Number).filter((n) => !isNaN(n))
    : undefined

  try {
    const result = await runIngestion({
      supabase: supabaseAdmin,
      tiers,
    })

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 500 }
    )
  }
}
