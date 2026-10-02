import { capitalByAsset, capitalByWeek, closesBySize, type FundClose } from './league'
import { ASSET_LABEL } from './sections'
import type { ChartView } from '@/components/charts/FundraisingChart'

/** The front-page chart's views, all cut from the league table so the two can never disagree. */
export function fundraisingChartViews(league: FundClose[], nowMs: number): ChartView[] {
  return [
    { key: 'asset', tab: 'By market', title: 'Capital closed, by asset class', period: 'Past 30 days', unit: 'usd', layout: 'rows', bars: capitalByAsset(league, nowMs, ASSET_LABEL, '30d').slice(0, 7) },
    { key: 'week', tab: 'By week', title: 'Capital closed each week', period: 'Past 12 weeks', unit: 'usd', layout: 'columns', bars: capitalByWeek(league, nowMs, 12) },
    { key: 'size', tab: 'By size', title: 'Number of closes, by fund size', period: 'Past 30 days', unit: 'count', layout: 'rows', bars: closesBySize(league, nowMs, '30d') },
  ]
}
