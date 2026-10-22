import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { classifyPendingArticles } from '@/lib/news/classify-articles'
import { sendPipelineAlert } from '@/lib/pipeline/alert'
import { loadStories } from '@/lib/news/front-page'
import { pingIndexNow, type PingResult } from '@/lib/seo/indexnow'
import { HUB_PATHS, hubsDue, newStoryPaths } from '@/lib/seo/indexnow-pages'

// 300s is the Vercel Pro ceiling for Node functions. A measured 15-article
// batch takes ~20s, so the 100-article cap needs ~141s — that did not fit in
// the previous 120s, and runs would have been killed mid-flight once the
// backlog made the cap reachable. RUN_BUDGET_MS in classify-articles tracks
// this value; change both together.
export const maxDuration = 300

export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Recovery: reset stuck articles that have been "processing" for >10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    await getSupabaseAdmin()
      .from('news_items')
      .update({ classification_status: 'pending' })
      .eq('classification_status', 'processing')
      .lt('updated_at', tenMinAgo)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      await sendPipelineAlert(
        getSupabaseAdmin(),
        'classification_api_outage',
        'ANTHROPIC_API_KEY is not set',
        ['Article classification cannot run, so the newsletter will skip.']
      )
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
    }

    const result = await classifyPendingArticles(getSupabaseAdmin(), apiKey)

    // An API outage strands everything downstream: the newsletter has nothing
    // to select from and records a 'skipped' edition, which is indistinguishable
    // from a quiet news day. Say so out loud instead.
    if (result.apiOutage) {
      await sendPipelineAlert(
        getSupabaseAdmin(),
        'classification_api_outage',
        'Article classification is down',
        [
          'The Claude API refused the request or could not be reached, so classification aborted.',
          `${result.articlesDeferred} article(s) went back on the queue and will retry automatically — nothing was lost.`,
          'Most likely: the Anthropic credit balance is exhausted, or ANTHROPIC_API_KEY is expired.',
          `Error: ${result.errors[0] ?? 'unknown'}`,
          'The newsletter will keep skipping until this clears.',
        ]
      )
    }

    const indexNow = await submitNewPages(Date.now())

    return NextResponse.json({
      ok: true,
      ...result,
      indexNow,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Tell IndexNow about the story pages that appeared in the previous clock hour
 * (lib/seo/indexnow-pages.ts), and once a day about the front pages
 * (2026-10-22). Read from the shared story cache, so no query of its own; it
 * runs whatever happened to classification, since those stories were
 * classified by the previous run. Never throws: a failed ping is a log line.
 */
async function submitNewPages(nowMs: number): Promise<{ stories: PingResult | null; hubs: PingResult | null }> {
  let stories: PingResult | null = null
  try {
    stories = await pingIndexNow(newStoryPaths(await loadStories(), nowMs), { label: 'new stories' })
  } catch (err) {
    console.error('[indexnow] the stories could not be read:', err instanceof Error ? err.message : err)
  }
  const hubs = hubsDue(nowMs) ? await pingIndexNow(HUB_PATHS, { label: 'front pages' }) : null
  return { stories, hubs }
}
