import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { enrichPendingArticles } from '@/lib/news/enrich-articles'

// Matches the classify route. Enrichment is network-bound, not model-bound, so
// it spends most of its time waiting on publisher pages.
export const maxDuration = 300

/**
 * Fetch article bodies for pending stories, ahead of classification.
 *
 * Scheduled at :15, between news-ingest (:00) and news-process (:30), so each
 * article is ingested, given a body, then classified against that body.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await enrichPendingArticles(getSupabaseAdmin())
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrichment failed' },
      { status: 500 }
    )
  }
}
