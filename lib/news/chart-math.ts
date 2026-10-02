/**
 * The arithmetic behind "Fundraising, charted".
 *
 * The chart is interactive: a reader switches the cut (market, region, size,
 * week, fund, firm), the period and the measure, and opens any bar to see the
 * funds inside it. All of that happens in the browser, so the closes
 * themselves are sent to the page — trimmed to what a chart needs — and this
 * module turns them into bars. The server uses the same functions for the
 * static panels, so a number on the league-table page and the same number in
 * the chart come out of one piece of code.
 *
 * Pure, and imports nothing from the server: it is bundled for the browser.
 */

/** What the chart needs to know about one close. Short keys: the list is sent to the page. */
export interface ChartClose {
  /** Story id: `/story/<id>` shows the reports. */
  id: string
  /** Manager. */
  f: string
  /** Its page: `/firm/<s>`. */
  s: string
  /** Fund name, when a report gave one. */
  n: string | null
  /** Size, USD millions. */
  v: number
  /** ISO date of the first report. */
  d: string
  /** Asset-class tag. */
  a: string | null
  /** Region, as the reports describe it. */
  r: string | null
  /** Outlets that reported it. */
  o: number
  /** 1 when the size was converted from another currency. */
  c?: 1
  /** Another figure the reports gave, when they disagree. */
  alt?: number
}

export type ChartViewKey = 'market' | 'region' | 'size' | 'weeks' | 'funds' | 'firms'
export type ChartPeriod = 7 | 30 | 90
export type ChartMeasure = 'capital' | 'count'

export interface Bar {
  key: string
  label: string
  /** Capital in the bar, USD millions. */
  capital: number
  /** Closes in the bar. */
  count: number
  /** The closes, largest first. */
  closes: ChartClose[]
  /** A period that is not over: the bar will grow. */
  partial?: boolean
  /** The bar is one firm or one fund, and this is its page. */
  href?: string
}

const DAY_MS = 86_400_000
const at = (iso: string) => new Date(`${iso}T12:00:00Z`).getTime()

/** "$5.4B", "$550M", "$87M". */
export function usd(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(m >= 10_000 ? 0 : 1).replace(/\.0$/, '')}B`
  return `$${Math.round(m)}M`
}

/** Closes reported in the `days` up to and including `today`. */
export function inWindow<T extends { d: string }>(closes: T[], days: number, today: string): T[] {
  const end = at(today)
  return closes.filter((c) => c.d <= today && end - at(c.d) <= days * DAY_MS)
}

function bar(key: string, label: string, closes: ChartClose[], extra: Partial<Bar> = {}): Bar {
  const sorted = [...closes].sort((a, b) => b.v - a.v)
  return { key, label, capital: sorted.reduce((s, c) => s + c.v, 0), count: sorted.length, closes: sorted, ...extra }
}

/** The number a bar is drawn to. */
export const barValue = (b: Bar, measure: ChartMeasure) => (measure === 'capital' ? b.capital : b.count)

function grouped(closes: ChartClose[], keyOf: (c: ChartClose) => string, labelOf: (key: string) => string, measure: ChartMeasure): Bar[] {
  const groups = new Map<string, ChartClose[]>()
  for (const c of closes) {
    const k = keyOf(c)
    groups.set(k, [...(groups.get(k) ?? []), c])
  }
  return Array.from(groups.entries())
    .map(([k, list]) => bar(k, labelOf(k), list))
    .sort((a, b) => barValue(b, measure) - barValue(a, measure) || b.capital - a.capital)
}

/** By asset class. A close with no tag is "Other", said plainly rather than dropped. */
export function barsByMarket(closes: ChartClose[], labels: Record<string, string>, measure: ChartMeasure = 'capital'): Bar[] {
  return grouped(closes, (c) => (c.a && labels[c.a] ? c.a : 'other'), (k) => labels[k] ?? 'Other', measure)
}

const REGION_ORDER = ['North America', 'Europe', 'Asia-Pacific', 'Global']

/**
 * By region. The big three and "Global" (a fund the reports place in more than
 * one) keep their names; the rest are folded into "Elsewhere"; a close whose
 * reports name no region is "Not stated" — its own bar, last, so the reader
 * can see how much of the total the chart cannot place.
 */
export function barsByRegion(closes: ChartClose[], measure: ChartMeasure = 'capital'): Bar[] {
  const keyOf = (c: ChartClose) => (!c.r ? 'none' : REGION_ORDER.includes(c.r) ? c.r : 'elsewhere')
  const labelOf = (k: string) => (k === 'none' ? 'Not stated' : k === 'elsewhere' ? 'Elsewhere' : k === 'Global' ? 'Global / several' : k)
  const bars = grouped(closes, keyOf, labelOf, measure)
  return [...bars.filter((b) => b.key !== 'none'), ...bars.filter((b) => b.key === 'none')]
}

export const SIZE_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: 'lt100', label: 'Under $100M', min: 0, max: 100 },
  { key: '100-500', label: '$100M – $500M', min: 100, max: 500 },
  { key: '500-1b', label: '$500M – $1B', min: 500, max: 1000 },
  { key: '1b-5b', label: '$1B – $5B', min: 1000, max: 5000 },
  { key: 'gt5b', label: '$5B and up', min: 5000, max: Infinity },
]

/** By fund size, smallest band first: the order is the scale. */
export function barsBySize(closes: ChartClose[]): Bar[] {
  return SIZE_BANDS.map((b) => bar(b.key, b.label, closes.filter((c) => c.v >= b.min && c.v < b.max)))
}

/** The Monday on or before a date. */
export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

/** Week by week, oldest first. The week `today` falls in is marked partial. */
export function barsByWeek(closes: ChartClose[], today: string, weeks = 12): Bar[] {
  const thisWeek = mondayOf(today)
  const out: Bar[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${thisWeek}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i * 7)
    const start = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    out.push(bar(start, label, closes.filter((c) => c.d <= today && mondayOf(c.d) === start), i === 0 ? { partial: true } : {}))
  }
  return out
}

/** The largest funds: one bar each. */
export function barsBiggest(closes: ChartClose[], limit = 8): Bar[] {
  return [...closes]
    .sort((a, b) => b.v - a.v)
    .slice(0, limit)
    .map((c) => bar(c.id, c.f, [c], { href: `/firm/${c.s}` }))
}

/** The managers that closed the most, across all their funds in the period. */
export function barsByManager(closes: ChartClose[], measure: ChartMeasure = 'capital', limit = 8): Bar[] {
  const names = new Map<string, string>()
  for (const c of closes) if (!names.has(c.s) || c.f.length > (names.get(c.s) as string).length) names.set(c.s, c.f)
  return grouped(closes, (c) => c.s, (k) => names.get(k) ?? k, measure)
    .slice(0, limit)
    .map((b) => ({ ...b, href: `/firm/${b.key}` }))
}

export function barsFor(
  view: ChartViewKey,
  closes: ChartClose[],
  opts: { today: string; period: ChartPeriod; measure: ChartMeasure; labels: Record<string, string> },
): Bar[] {
  if (view === 'weeks') return barsByWeek(closes, opts.today, 12)
  const rows = inWindow(closes, opts.period, opts.today)
  switch (view) {
    case 'market': return barsByMarket(rows, opts.labels, opts.measure)
    case 'region': return barsByRegion(rows, opts.measure)
    case 'size': return barsBySize(rows)
    case 'funds': return barsBiggest(rows)
    case 'firms': return barsByManager(rows, opts.measure)
  }
}
