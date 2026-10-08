import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { loadStories } from '@/lib/news/front-page'
import { fetchArticleBody, markEnriched, newFetchContext } from '@/lib/news/enrich-articles'
import { runStoryTextPass } from '@/lib/news/enrich-stories'
import { loadFetchRows } from '@/lib/news/story-text-store'
import { loadMarks } from '@/lib/news/story-summary-store'
import { storySummariesEnabled } from '@/lib/news/story-summary-job'

// RUN_BUDGET_MS in enrich-stories tracks this value; change both together.
export const maxDuration = 300

/**
 * Fetch the publishers' pages for the stories on the site that are still thin,
 * so the long summaries have text to write from (lib/news/enrich-stories.ts).
 *
 * Scheduled at :35, after classification (:30) and before the summaries (:45).
 * Costs no model tokens: HTTP and string handling, at most 40 pages a run and 3
 * from any one host. Follows the story summaries' kill switch, since the text is
 * only for them.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!storySummariesEnabled()) {
    return NextResponse.json({ ok: true, skipped: 'story_summaries_disabled' })
  }

  try {
    const db = getSupabaseAdmin()
    const ctx = newFetchContext()
    const result = await runStoryTextPass({
      loadStories,
      loadMarks: () => loadMarks(db),
      loadRows: (ids, sinceIso) => loadFetchRows(db, ids, sinceIso),
      fetchBody: (url) => fetchArticleBody(url, ctx),
      saveResult: (id, text, error) => markEnriched(db, id, text, error),
      now: Date.now,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Story text pass failed' },
      { status: 500 },
    )
  }
}
