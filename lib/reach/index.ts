/**
 * The audience block's data: email readers (lib/sponsor/stats.ts), the
 * website's traffic and the social posts' views, cached for an hour under its
 * own key ('site-reach-v1'). Every part is independently nullable; a failure
 * hides its line and never falls back to a remembered value.
 *
 * Website: Vercel Web Analytics' query API (GET /v1/query/web-analytics/visits/count),
 * which is the same data as the dashboard. It needs one env var on Vercel:
 *   VERCEL_ANALYTICS_TOKEN   a Vercel access token (Account Settings → Tokens),
 *                            scoped to the team that owns the project.
 * The project and team ids default to this site's (from .vercel/project.json);
 * VERCEL_ANALYTICS_PROJECT_ID / VERCEL_ANALYTICS_TEAM_ID override them.
 * Until the token is set, or if the API fails, the hand-entered figure
 * (SITE_MONTHLY_VISITORS / SITE_MONTHLY_PAGEVIEWS / SITE_MONTHLY_AS_OF) is
 * used when present; otherwise the line is hidden.
 *
 * Social: the social job already reports each post's numbers from Buffer to
 * /api/social/posts ({ metrics: [...] } → social_metrics). Nothing new is
 * needed on its side; this sums the latest reading of each post.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getSponsorAudience } from '@/lib/sponsor/stats'
import {
  manualSiteTraffic, parseVercelCount, reachLines, sumSocialViews, SOCIAL_MAX_STALENESS_DAYS, SOCIAL_WINDOW_DAYS,
  type ReachLine, type SiteTraffic, type SocialPostRow, type SocialReading, type SocialViews,
} from './figures'

const PROJECT_ID = 'prj_zAFvSM8utEMx6wDSbPkx6ku1mUO8'
const TEAM_ID = 'team_u4pa2nJT8CBLafjMTVFwNbrs'

const todayEt = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

/** The last 30 days from Vercel Web Analytics, or null. */
export async function vercelSiteTraffic(now = Date.now()): Promise<SiteTraffic | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN
  if (!token) return null
  const q = new URLSearchParams({
    projectId: process.env.VERCEL_ANALYTICS_PROJECT_ID || PROJECT_ID,
    teamId: process.env.VERCEL_ANALYTICS_TEAM_ID || TEAM_ID,
    since: String(now - 30 * 86_400_000),
    until: String(now),
  })
  try {
    const res = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/count?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error(`[reach] Vercel Web Analytics answered ${res.status}`)
      return null
    }
    return parseVercelCount(await res.json(), new Date(now).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }))
  } catch (err) {
    console.error('[reach] Vercel Web Analytics unavailable:', err)
    return null
  }
}

export async function siteTraffic(): Promise<SiteTraffic | null> {
  return (await vercelSiteTraffic()) ?? manualSiteTraffic(process.env, todayEt())
}

/** Views on the social posts of the last 30 days, from the readings the social job reports. */
export async function socialViews(now = Date.now()): Promise<SocialViews | null> {
  const db = getSupabaseAdmin()
  // The window ends at the newest reading, which may be up to the staleness limit old.
  const since = new Date(now - (SOCIAL_WINDOW_DAYS + SOCIAL_MAX_STALENESS_DAYS + 1) * 86_400_000).toISOString()
  const { data: posts, error } = await db
    .from('social_posts')
    .select('id, channel, scheduled_for')
    .eq('status', 'posted')
    .gte('scheduled_for', since)
    .limit(5000)
  if (error || !posts?.length) return null
  const readings: SocialReading[] = []
  const ids = posts.map((p) => p.id as string)
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error: e } = await db
      .from('social_metrics')
      .select('post_id, captured_at, views:metrics->views')
      .in('post_id', ids.slice(i, i + 100))
      .limit(1000)
    if (e) return null
    for (const r of data ?? []) {
      const v = Number((r as { views: unknown }).views)
      readings.push({ post_id: r.post_id as string, captured_at: r.captured_at as string, views: Number.isFinite(v) ? v : null })
    }
  }
  return sumSocialViews(posts as SocialPostRow[], readings, now)
}

export interface Reach {
  lines: ReachLine[]
  asOf: string
}

export async function computeReach(): Promise<Reach> {
  const [audience, site, video] = await Promise.all([
    getSponsorAudience().catch(() => null),
    siteTraffic().catch(() => null),
    socialViews().catch(() => null),
  ])
  return {
    lines: reachLines({ subscribers: audience?.subscribers ?? null, firms: audience?.firms ?? null, site, video }),
    asOf: new Date().toISOString(),
  }
}

/** Hourly. A new key: nothing else in site_cache is touched. */
export const getReach = unstable_cache(computeReach, ['site-reach-v1'], { revalidate: 3600, tags: ['sponsor-stats'] })
