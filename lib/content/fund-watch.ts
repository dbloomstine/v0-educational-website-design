// --- Types ---

export interface FundEntry {
  fund_name: string
  firm: string
  amount: string
  amount_usd_millions: number | null
  category: string
  location: string
  stage: string
  announcement_date: string | null
  source_url: string
  source_name: string
  description_notes: string
  is_covered: boolean
  covered_date: string | null
}

export interface FeedHealthEntry {
  feed_name: string
  feed_url: string
  last_fetch: string | null
  last_success: string | null
  error_count: number
  article_count: number
  last_error: string
  enabled: boolean
}

export interface FundWatchStats {
  total_funds: number
  total_covered: number
  total_uncovered: number
  total_aum_millions: number
  by_category: Record<string, number>
  by_stage: Record<string, number>
  article_count: number
  feed_count: number
  date_range: {
    earliest: string | null
    latest: string | null
  }
}

export interface FundDirectoryData {
  generated_at: string
  funds: FundEntry[]
  categories: string[]
  stages: string[]
  feed_health: FeedHealthEntry[]
  stats: FundWatchStats
}

// --- Category badge color mapping (dark theme) ---

export const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  "Venture Capital":
    "bg-violet-950/50 text-violet-300 border-violet-800",
  "Private Equity":
    "bg-blue-950/50 text-blue-300 border-blue-800",
  "Credit Funds":
    "bg-emerald-950/50 text-emerald-300 border-emerald-800",
  "Secondaries & GP-Stakes":
    "bg-amber-950/50 text-amber-300 border-amber-800",
  Infrastructure:
    "bg-sky-950/50 text-sky-300 border-sky-800",
  "Real Estate":
    "bg-rose-950/50 text-rose-300 border-rose-800",
}

// Bar chart colors per category
export const CATEGORY_COLORS: Record<string, string> = {
  "Venture Capital": "#8b5cf6",
  "Private Equity": "#3b82f6",
  "Credit Funds": "#10b981",
  "Secondaries & GP-Stakes": "#f59e0b",
  Infrastructure: "#0ea5e9",
  "Real Estate": "#f43f5e",
}

// --- Helpers ---

export function formatAum(millions: number): string {
  if (millions >= 1000) {
    const billions = millions / 1000
    return `$${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`
  }
  return `$${millions.toFixed(0)}M`
}
