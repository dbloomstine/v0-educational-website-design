import { formatDistanceToNow } from 'date-fns'

export const EVENT_LABELS: Record<string, { label: string; short: string; color: string }> = {
  fund_launch: { label: 'Fund Launch', short: 'Launch', color: 'bg-red-900/50 text-red-300 border-red-800' },
  fund_close: { label: 'Final Close', short: 'Close', color: 'bg-red-900/50 text-red-300 border-red-800' },
  capital_raise: { label: 'Capital Raise', short: 'Raise', color: 'bg-orange-900/50 text-orange-300 border-orange-800' },
  executive_hire: { label: 'New Hire', short: 'Hire', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  executive_change: { label: 'Exec Move', short: 'Move', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  executive_departure: { label: 'Departure', short: 'Dept', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  acquisition: { label: 'M&A', short: 'M&A', color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  merger: { label: 'M&A', short: 'M&A', color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  regulatory_action: { label: 'Regulatory', short: 'Reg', color: 'bg-amber-900/50 text-amber-300 border-amber-800' },
  legal_alert: { label: 'Legal Alert', short: 'Legal', color: 'bg-amber-900/50 text-amber-300 border-amber-800' },
  market_commentary: { label: 'Analysis', short: 'Analysis', color: 'bg-muted text-muted-foreground border-border' },
  industry_analysis: { label: 'Industry', short: 'Ind', color: 'bg-muted text-muted-foreground border-border' },
  press_release: { label: 'Press Release', short: 'Press', color: 'bg-muted text-muted-foreground border-border' },
  award: { label: 'Award', short: 'Award', color: 'bg-muted text-muted-foreground border-border' },
  other: { label: 'Other', short: 'Other', color: 'bg-muted text-muted-foreground border-border' },
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
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
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
    // Date-only strings (YYYY-MM-DD) are parsed as UTC midnight, which shifts
    // backward in local timezones west of UTC. Append T12:00:00 to keep the
    // correct calendar day regardless of timezone.
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date
    const d = new Date(normalized)

    // Same calendar day: "Today"
    if (d.toDateString() === now.toDateString()) return 'Today'

    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

    // Within 7 days: show day name
    const diffMs = now.getTime() - d.getTime()
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDay < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })

    // Older: show date
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
