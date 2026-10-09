import { NextResponse } from 'next/server'
import { socialGate } from '@/lib/social/auth'
import { loadStories } from '@/lib/news/front-page'
import { loadLeagueReport } from '@/lib/news/league-data'
import { getEventFeed } from '@/lib/events/api'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { pickLongSummary } from '@/lib/news/story-summary'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** How far back the job is told what it has already posted, so no story goes out twice. */
const POSTED_DAYS = 21

/** The stories on the site go back ten days; a fuller summary older than this belongs to none of them. */
const SUMMARY_DAYS = 12

type LongRow = { id: string; summary_long: string | null; summary_long_at: string | null }

/**
 * The fuller summaries the site has written (lib/news/story-summary.ts), by row id. One small read of
 * its own: only rows marked `written`, which an index covers. A failure here is logged and the stories
 * go out without them, as they did before 2026-10-09.
 */
async function longSummaries(): Promise<Map<string, LongRow>> {
  const since = new Date(Date.now() - SUMMARY_DAYS * 86_400_000).toISOString()
  const { data, error } = await getSupabaseAdmin()
    .from('news_items')
    .select('id, summary_long, summary_long_at')
    .eq('summary_long_status', 'written')
    .gte('summary_long_at', since)
    .limit(3000)
  if (error) {
    console.error('[social] fuller summaries unavailable:', error.message)
    return new Map()
  }
  return new Map(((data ?? []) as LongRow[]).map((r) => [r.id, r]))
}

/**
 * Everything the nightly social job works from, in one read: the stories the
 * site is showing (ten days, each with its fuller summary where one has been written), the league table, the events board for the next
 * thirty days, and what the job has already posted.
 *
 * The stories, league and events come from the same caches the pages use
 * (lib/news/front-page.ts, lib/news/league-data.ts, lib/events/api.ts), so
 * this costs the database one small query of its own: the list of past posts.
 */
export async function GET(req: Request) {
  const refused = socialGate(req)
  if (refused) return refused

  try {
    const since = new Date(Date.now() - POSTED_DAYS * 86_400_000).toISOString().slice(0, 10)
    const [stories, league, events, posted, long] = await Promise.all([
      loadStories(),
      loadLeagueReport(),
      getEventFeed({ when: '30d', limit: 200, offset: 0 }),
      getSupabaseAdmin()
        .from('social_posts')
        .select('post_date, slug, format, channel, story_ids, status')
        .gte('post_date', since)
        .order('post_date', { ascending: false })
        .limit(2000),
      longSummaries(),
    ])
    if (posted.error) throw new Error(`social_posts: ${posted.error.message}`)

    // Each story with the fuller summary of its best row (or of any row in it), when one has been
    // written: what lets a post say more than the headline (Danny, 2026-10-09: the top stories
    // should have "a few swipes… more information about the deal").
    const withLong = stories.map((s) => {
      const rows = (s.memberIds?.length ? s.memberIds : [s.id]).map((id) => long.get(id)).filter((r): r is LongRow => !!r)
      const summaryLong = rows.length ? pickLongSummary(rows, s.id) : null
      return summaryLong ? { ...s, summaryLong } : s
    })

    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        stories: withLong,
        league: { asOf: league.asOf, closes: league.closes },
        events: events.events,
        posted: posted.data ?? [],
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[social] export failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'export failed' }, { status: 500 })
  }
}
