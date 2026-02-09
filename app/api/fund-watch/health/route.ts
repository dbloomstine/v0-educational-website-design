import { NextResponse } from 'next/server'
import { getFundDirectoryData } from '@/lib/content/fund-watch-loader'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getFundDirectoryData()

    if (!data) {
      return NextResponse.json(
        { error: 'Fund directory data unavailable' },
        { status: 500 }
      )
    }

    // Calculate stale feeds (enabled but no success in 48+ hours)
    const staleFeeds = data.feed_health?.filter((f) => {
      if (!f.enabled || !f.last_success) return false
      const hoursSince =
        (Date.now() - new Date(f.last_success).getTime()) / 3600000
      return hoursSince > 48
    }) ?? []

    // Count disabled feeds
    const disabledFeeds = data.feed_health?.filter((f) => !f.enabled) ?? []

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (disabledFeeds.length > 10 || staleFeeds.length > 10) {
      status = 'unhealthy'
    } else if (disabledFeeds.length > 5 || staleFeeds.length > 5) {
      status = 'degraded'
    }

    // Calculate data freshness
    const generatedAt = new Date(data.generated_at)
    const hoursSinceUpdate = (Date.now() - generatedAt.getTime()) / 3600000

    return NextResponse.json({
      status,
      generated_at: data.generated_at,
      hours_since_update: Math.round(hoursSinceUpdate * 10) / 10,
      total_funds: data.stats?.total_funds ?? 0,
      total_covered: data.stats?.total_covered ?? 0,
      total_aum_millions: data.stats?.total_aum_millions ?? 0,
      feeds_enabled: data.feed_health?.filter((f) => f.enabled).length ?? 0,
      feeds_disabled: disabledFeeds.length,
      feeds_stale: staleFeeds.length,
      date_range: data.stats?.date_range ?? null,
    })
  } catch (error) {
    console.error('[Health API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
