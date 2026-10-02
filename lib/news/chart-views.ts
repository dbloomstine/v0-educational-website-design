import { capitalByAsset, capitalByWeek, closesBySize, type FundClose } from './league'
import { ASSET_LABEL } from './sections'
import type { ChartView } from '@/components/charts/FundraisingChart'

/**
 * The fundraising chart's views, all cut from the league table so the two can
 * never disagree. With `assetClasses`, the chart is one market's — "by market"
 * would be a single bar there, so it is left out.
 */
export function fundraisingChartViews(league: FundClose[], nowMs: number, opts: { assetClasses?: string[] } = {}): ChartView[] {
  const only = opts.assetClasses
  const rows = only ? league.filter((c) => c.assetClass != null && only.includes(c.assetClass)) : league
  const views: ChartView[] = [
    { key: 'week', tab: 'By week', title: 'Capital closed each week', period: 'Past 12 weeks', unit: 'usd', layout: 'columns', bars: capitalByWeek(rows, nowMs, 12) },
    { key: 'size', tab: 'By size', title: 'Number of closes, by fund size', period: only ? 'Past 90 days' : 'Past 30 days', unit: 'count', layout: 'rows', bars: closesBySize(rows, nowMs, only ? '90d' : '30d') },
  ]
  if (only) return views
  return [
    { key: 'asset', tab: 'By market', title: 'Capital closed, by asset class', period: 'Past 30 days', unit: 'usd', layout: 'rows', bars: capitalByAsset(league, nowMs, ASSET_LABEL, '30d').slice(0, 7) },
    ...views,
  ]
}

/** True when the chart has something to draw (the component renders nothing otherwise). */
export function chartHasData(views: ChartView[]): boolean {
  return views.some((v) => v.bars.some((b) => b.value > 0))
}
