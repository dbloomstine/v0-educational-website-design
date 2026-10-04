import { NextResponse } from 'next/server'
import { socialGate } from '@/lib/social/auth'
import { loadStories } from '@/lib/news/front-page'
import { loadLeagueReport } from '@/lib/news/league-data'
import { getEventFeed } from '@/lib/events/api'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** How far back the job is told what it has already posted, so no story goes out twice. */
const POSTED_DAYS = 21

/**
 * Everything the nightly social job works from, in one read: the stories the
 * site is showing (ten days), the league table, the events board for the next
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
    const [stories, league, events, posted] = await Promise.all([
      loadStories(),
      loadLeagueReport(),
      getEventFeed({ when: '30d', limit: 200, offset: 0 }),
      getSupabaseAdmin()
        .from('social_posts')
        .select('post_date, slug, format, channel, story_ids, status')
        .gte('post_date', since)
        .order('post_date', { ascending: false })
        .limit(2000),
    ])
    if (posted.error) throw new Error(`social_posts: ${posted.error.message}`)

    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        stories,
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
