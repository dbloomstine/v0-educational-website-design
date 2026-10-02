import { LEAGUE_ASSET_LABEL, toChartClose, type LeagueReport } from './league'
import type { ChartClose, ChartViewKey } from './chart-math'

/**
 * What the interactive chart is given: the final closes of the last quarter
 * (twelve whole weeks plus the current one needs up to ninety days), the dates
 * of the closes no report put a size on, and the labels. Cut on the server, so
 * a section page sends only its own market.
 */
export interface ChartData {
  closes: ChartClose[]
  unsized: string[]
  today: string
  updated: string | null
  labels: Record<string, string>
  views: ChartViewKey[]
  scopeAsset?: string
}

/** Days of closes sent to the page: the 90-day period, and the twelve-week view's oldest Monday. */
const CHART_WINDOW_DAYS = 92

export function chartData(report: LeagueReport & { asOf?: string }, nowMs: number, opts: { assetClasses?: string[] } = {}): ChartData {
  const today = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const since = new Date(new Date(`${today}T12:00:00Z`).getTime() - CHART_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  const only = opts.assetClasses
  const inScope = (asset: string | null) => !only || (asset != null && only.includes(asset))
  const closes = report.closes
    .filter((c) => c.stage === 'final' && c.date >= since && c.date <= today && inScope(c.assetClass))
    .map(toChartClose)
  const unsized = report.unsized
    .filter((u) => u.stage === 'final' && u.date >= since && u.date <= today && inScope(u.assetClass))
    .map((u) => u.date)
  const updated = report.asOf
    ? `${new Date(report.asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET`
    : null
  return {
    closes,
    unsized,
    today,
    updated,
    labels: LEAGUE_ASSET_LABEL,
    // One market has no "by market" cut: its own chart opens on the weeks.
    views: only ? ['weeks', 'size', 'funds', 'firms', 'region'] : ['market', 'weeks', 'size', 'funds', 'firms', 'region'],
    ...(only?.length === 1 ? { scopeAsset: only[0] } : {}),
  }
}
