import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { loadStories } from '@/lib/news/front-page'
import { writeStorySummary } from '@/lib/news/story-summary'
import { loadMarks, loadRows, saveStatus, saveWritten } from '@/lib/news/story-summary-store'
import { capFor, runStorySummaries, storySummariesEnabled } from '@/lib/news/story-summary-job'

// RUN_BUDGET_MS in story-summary-job tracks this value; change both together.
export const maxDuration = 300

/**
 * Write the long summaries the story pages show (lib/news/story-summary.ts).
 *
 * Scheduled at :45, after ingest (:00), enrichment (:15) and classification
 * (:30), so a story is summarised from the text the earlier steps left.
 * SHIPS DARK: nothing is read, written or sent to the model until
 * STORY_SUMMARIES_ENABLED is "false" (the kill switch; on by default). At most 20 model calls a run
 * (?limit= can only lower that), one story per call.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!storySummariesEnabled()) {
    return NextResponse.json({ ok: true, skipped: 'story_summaries_disabled' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  try {
    const db = getSupabaseAdmin()
    const cap = capFor(new URL(req.url).searchParams.get('limit'))
    const result = await runStorySummaries(
      {
        loadStories,
        loadMarks: () => loadMarks(db),
        loadRows: (ids) => loadRows(db, ids),
        write: (rows) => writeStorySummary(rows, apiKey),
        saveWritten: (id, summary, model) => saveWritten(db, id, summary, model),
        saveStatus: (id, status) => saveStatus(db, id, status),
        now: Date.now,
      },
      { cap },
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Story summaries failed' },
      { status: 500 },
    )
  }
}
