import { formatDistanceToNow } from 'date-fns'

export const EVENT_LABELS: Record<string, { label: string; short: string; color: string }> = {
  fund_launch: { label: 'Launch', short: 'Launch', color: 'bg-red-900/50 text-red-300 border-red-800' },
  fund_close: { label: 'Close', short: 'Close', color: 'bg-red-900/50 text-red-300 border-red-800' },
  capital_raise: { label: 'Raise', short: 'Raise', color: 'bg-orange-900/50 text-orange-300 border-orange-800' },
  executive_hire: { label: 'Hire', short: 'Hire', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  executive_change: { label: 'Exec Change', short: 'ExChg', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  acquisition: { label: 'M&A', short: 'M&A', color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  regulatory_action: { label: 'Regulatory', short: 'Reg', color: 'bg-amber-900/50 text-amber-300 border-amber-800' },
  market_commentary: { label: 'Market', short: 'Mkt', color: 'bg-muted text-muted-foreground border-border' },
  press_release: { label: 'Press', short: 'Press', color: 'bg-muted text-muted-foreground border-border' },
}

export const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  PE: { label: 'PE', color: 'bg-indigo-900/50 text-indigo-300' },
  VC: { label: 'VC', color: 'bg-emerald-900/50 text-emerald-300' },
  credit: { label: 'Credit', color: 'bg-amber-900/50 text-amber-300' },
  hedge: { label: 'Hedge', color: 'bg-purple-900/50 text-purple-300' },
  real_estate: { label: 'Real Estate', color: 'bg-orange-900/50 text-orange-300' },
  infrastructure: { label: 'Infra', color: 'bg-sky-900/50 text-sky-300' },
  secondaries: { label: 'Secondaries', color: 'bg-rose-900/50 text-rose-300' },
  gp_stakes: { label: 'GP-Stakes', color: 'bg-teal-900/50 text-teal-300' },
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

export function formatFundSize(usd: number | null): string | null {
  if (!usd) return null
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  return `$${usd.toLocaleString()}`
}

export function formatRelativeDate(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatCompactTime(date: string): string {
  try {
    const now = new Date()
    const d = new Date(date)
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin}m`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay}d`
    const diffWeek = Math.floor(diffDay / 7)
    if (diffWeek < 5) return `${diffWeek}w`
    const diffMo = Math.floor(diffDay / 30)
    return `${diffMo}mo`
  } catch {
    return ''
  }
}
