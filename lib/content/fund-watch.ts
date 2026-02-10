// --- Types ---

export interface FundArticle {
  title: string
  url: string
  source_name: string
  source_domain: string
  published_date: string | null
  summary: string
}

export interface FundEntry {
  fund_name: string
  firm: string
  firm_slug?: string
  firm_website?: string | null
  amount: string
  amount_usd_millions: number | null
  category: string
  strategy: string | null
  target_geography: string | null
  location: string
  city: string
  state: string
  country: string
  stage: string
  announcement_date: string | null
  source_url: string
  source_name: string
  description_notes: string
  is_covered: boolean
  covered_date: string | null
  date_added: string | null
  articles: FundArticle[]
}

export interface ManagerEntry {
  firm: string
  firm_slug: string
  fund_count: number
  total_aum_millions: number
  categories: string[]
  city: string
  country: string
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
  managers?: ManagerEntry[]
  categories: string[]
  stages: string[]
  strategies: string[]
  geographies: string[]
  feed_health: FeedHealthEntry[]
  stats: FundWatchStats
}

// --- Union types ---

export type FundCategory =
  | "Venture Capital"
  | "Private Equity"
  | "Credit Funds"
  | "Secondaries & GP-Stakes"
  | "Infrastructure"
  | "Real Estate"
  | "Hedge Funds"

export type FundStage = "first close" | "interim close" | "final close" | "launch" | "other"

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
  "Hedge Funds":
    "bg-cyan-950/50 text-cyan-300 border-cyan-800",
}

// --- Helpers ---

// Re-export slugify from shared utility for backwards compatibility
export { slugify } from "@/lib/utils/content-slug"
// Import for local use
import { slugify } from "@/lib/utils/content-slug"

export function formatAum(millions: number): string {
  if (millions >= 1000) {
    const billions = millions / 1000
    return `$${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`
  }
  return `$${millions.toFixed(0)}M`
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function getQuarter(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return null
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return `Q${q} ${d.getFullYear()}`
}

export function getYearMonth(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return null
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export type AmountBucketKey = "all" | "lt500m" | "500m-1b" | "1b-5b" | "5b+" | "undisclosed"

export const AMOUNT_BUCKETS: { key: AmountBucketKey; label: string }[] = [
  { key: "all", label: "All Sizes" },
  { key: "lt500m", label: "Under $500M" },
  { key: "500m-1b", label: "$500M\u2013$1B" },
  { key: "1b-5b", label: "$1B\u2013$5B" },
  { key: "5b+", label: "$5B+" },
  { key: "undisclosed", label: "Undisclosed" },
]

export function getAmountBucket(millions: number | null): AmountBucketKey {
  if (millions === null || millions === 0) return "undisclosed"
  if (millions < 500) return "lt500m"
  if (millions < 1000) return "500m-1b"
  if (millions < 5000) return "1b-5b"
  return "5b+"
}

// --- Stage badge color mapping (dark theme) ---

export const STAGE_BADGE_CLASSES: Record<string, string> = {
  "final close": "bg-emerald-950/50 text-emerald-300 border-emerald-800",
  "first close": "bg-sky-950/50 text-sky-300 border-sky-800",
  "interim close": "bg-amber-950/50 text-amber-300 border-amber-800",
  launch: "bg-violet-950/50 text-violet-300 border-violet-800",
  other: "bg-zinc-800/50 text-zinc-300 border-zinc-700",
}

// --- Common formatting helpers ---

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A"
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00")
  if (isNaN(d.getTime())) return "N/A"
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function getColumnValue(f: FundEntry, col: string): string {
  switch (col) {
    case "firm": return f.firm
    case "category": return f.category
    case "stage": return f.stage
    case "city": return f.city || "N/A"
    case "country": return f.country || "\u2014"
    case "source_name": return f.source_name || "\u2014"
    default: return ""
  }
}

export function getFirmSlug(entry: { firm_slug?: string; firm: string }): string {
  return entry.firm_slug || slugify(entry.firm)
}
