import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { loadStories } from '@/lib/news/front-page'
import { writeStorySummary } from '@/lib/news/story-summary'
import { loadMarks, loadRows, saveStatus, saveWritten } from '@/lib/news/story-summary-store'
import { loadRowTextState, loadThinStamps } from '@/lib/news/story-text-store'
import { capFor, runStorySummaries, storySummariesEnabled } from '@/lib/news/story-summary-job'
import { storyPath } from '@/lib/news/story-path'
import type { Story } from '@/lib/news/stories'
import { pingIndexNow } from '@/lib/seo/indexnow'

// RUN_BUDGET_MS in story-summary-job tracks this value; change both together.
export const maxDuration = 300

/**
 * Write the long summaries the story pages show (lib/news/story-summary.ts).
 *
 * Scheduled at :45, after ingest (:00), enrichment (:15) and classification
 * (:30), so a story is summarised from the text the earlier steps left.
 * SHIPS DARK: nothing is read, written or sent to the model until
 * STORY_SUMMARIES_ENABLED is "false" (the kill switch; on by default). At most 20 model calls a run
 * (?limit= can only lower that), one story per call. Stories with stored text
 * (story-text, :35) go first, and a thin story is looked at again when it has
 * gained text or an outlet since it was marked.
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
    // A story given its fuller summary is indexable from now on (lib/news/story-index.ts):
    // its page is sent to IndexNow when the run ends (2026-10-22). Collected from
    // what the job already reads and saves, so no query of its own.
    const byId = new Map<string, Story>()
    const written: string[] = []
    const result = await runStorySummaries(
      {
        loadStories: async () => {
          const stories = await loadStories()
          for (const s of stories) byId.set(s.id, s)
          return stories
        },
        loadMarks: () => loadMarks(db),
        loadRows: (ids) => loadRows(db, ids),
        loadEvidence: async (stories) => ({
          thinAt: await loadThinStamps(db),
          rows: await loadRowTextState(db, stories.flatMap((s) => s.memberIds)),
        }),
        write: (rows) => writeStorySummary(rows, apiKey),
        saveWritten: async (id, summary, model) => {
          await saveWritten(db, id, summary, model)
          const story = byId.get(id)
          if (story) written.push(storyPath(story))
        },
        saveStatus: (id, status) => saveStatus(db, id, status),
        now: Date.now,
      },
      { cap },
    )
    const indexNow = await pingIndexNow(written, { label: 'stories written up' })
    return NextResponse.json({ ok: true, ...result, indexNow })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Story summaries failed' },
      { status: 500 },
    )
  }
}
