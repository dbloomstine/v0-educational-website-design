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
  industry_analysis: { label: 'Industry', short: 'Industry', color: 'bg-muted text-muted-foreground border-border' },
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
  service_provider: { label: 'Services', color: 'bg-slate-800/60 text-slate-300' },
}

// Normalize variant source names to canonical forms.
// Only collapses true duplicates (e.g. "Bloomberg.com" → "Bloomberg"),
// not legitimately different publications (e.g. "Bloomberg Law" stays distinct).
export const SOURCE_NAME_MAP: Record<string, string> = {
  'bloomberg.com': 'Bloomberg',
  'news.bloombergtax.com': 'Bloomberg Tax',
  'bloomberg law news': 'Bloomberg Law',
  'msn.com': 'MSN',
  'pr newswire financial': 'PR Newswire',
  'pr newswire - financial services': 'PR Newswire',
  'pr newswire uk': 'PR Newswire',
  'pr newswire asia': 'PR Newswire',
  'prnewswire.com': 'PR Newswire',
  'globenewswire financial services': 'GlobeNewswire',
  'business wire india': 'Business Wire',
  'the wall street journal': 'WSJ',
  'newswire.com': 'Newswire.com',
  'www.newswire.com': 'Newswire.com',
  'newswire': 'Newswire.com',
}

export function normalizeSourceName(raw: string | null): string | null {
  if (!raw) return null
  return SOURCE_NAME_MAP[raw.toLowerCase().trim()] ?? raw
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

export function formatCompactTime(date: string, dateRange?: string): string {
  try {
    const now = new Date()
    // Date-only strings (YYYY-MM-DD) have no time component — we can't show
    // granular relative times like "9m ago" because we don't know the real time.
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date)

    // Append T12:00:00 to date-only strings to keep the correct calendar day
    // regardless of timezone (UTC midnight shifts backward in western zones).
    const normalized = isDateOnly ? `${date}T12:00:00` : date
    const d = new Date(normalized)

    // Same calendar day
    if (d.toDateString() === now.toDateString()) {
      // Only show granular relative times when we have an actual timestamp
      if (!isDateOnly) {
        const diffMs = now.getTime() - d.getTime()
        const diffMin = Math.floor(diffMs / 60_000)
        const diffHr = Math.floor(diffMs / 3_600_000)
        if (diffMin < 1) return 'Just now'
        if (diffMin < 60) return `${diffMin}m ago`
        return `${diffHr}h ago`
      }
      return 'Today'
    }

    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

    // Within 7 days: show day name only for 24h view (unambiguous).
    // For 7d/30d/90d views, "Friday" is ambiguous — use "Mar 28" instead.
    if (!dateRange || dateRange === '24h') {
      const diffMs = now.getTime() - d.getTime()
      const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (diffDay < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
    }

    // Older (or non-24h view): show date
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

/**
 * Suffix words that don't distinguish one firm from another. "GenNx360
 * Capital Partners" and "StepStone Group" are recognised by their first
 * token; the rest is boilerplate shared with hundreds of other managers.
 */
const GENERIC_FIRM_TOKENS = new Set([
  'capital', 'partners', 'group', 'management', 'advisors', 'advisers',
  'ventures', 'holdings', 'investments', 'investment', 'asset', 'assets',
  'fund', 'funds', 'company', 'co', 'corp', 'corporation', 'inc', 'llc',
  'llp', 'lp', 'ltd', 'plc', 'associates', 'international', 'global',
  'the', 'and', '&',
])

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

/**
 * Strip parenthetical asides from an entity name — "AdvancingVC (Tim Hsia &
 * Neil Devani)" → "AdvancingVC". They break core extraction (the scan stops
 * at the "&" inside the parens) and are noise wherever the name is displayed.
 */
export function cleanEntityName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * The firm label to show beside a headline, or null when the headline
 * already identifies the firm.
 *
 * Favicons were removed site-wide on 2026-08-30, so the firm name became the
 * identity anchor — but printing "GENNX360 CAPITAL PARTNERS" next to
 * "GenNx360 scores $865m Fund IV close" just steals width from the headline.
 * Matching on the distinctive core (everything before the generic suffix
 * words) catches those, while still surfacing the firm when the headline
 * genuinely omits it — e.g. "Buying the Platform Does Not Buy You Liquidity"
 * keeps its "Victory Capital" label, and a headline that only says "a16z"
 * keeps "Andreessen Horowitz".
 */
export function firmLabelFor(rawFirmName: string | null, title: string): string | null {
  if (!rawFirmName) return null
  const firmName = cleanEntityName(rawFirmName)
  if (!firmName) return null
  const haystack = normalizeForMatch(title)
  if (!haystack) return firmName

  // Full name present ("LGT Capital Partners beats target…") → redundant.
  if (haystack.includes(normalizeForMatch(firmName))) return null

  const tokens = firmName.split(/\s+/).filter(Boolean)
  const core = tokens.filter((t) => !GENERIC_FIRM_TOKENS.has(t.toLowerCase().replace(/[^a-z0-9&]/g, '')))
  // An all-generic name ("Capital Group") has no distinctive core to match
  // on; the full-name check above is the only safe test for it.
  if (core.length === 0) return firmName

  const coreKey = normalizeForMatch(core.join(''))
  // Single-letter or numeric-only cores would match almost any headline.
  if (coreKey.length < 3) return firmName

  return haystack.includes(coreKey) ? null : firmName
}

export interface HeadlineSegment {
  text: string
  bold: boolean
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The distinctive part of a firm name — "GenNx360 Capital Partners" →
 * "GenNx360". Returns null when the name is all boilerplate.
 */
function distinctiveCore(name: string): string | null {
  const tokens = name.split(/\s+/).filter(Boolean)
  const core: string[] = []
  for (const t of tokens) {
    if (GENERIC_FIRM_TOKENS.has(t.toLowerCase().replace(/[^a-z0-9&]/g, ''))) break
    core.push(t)
  }
  const joined = core.join(' ').trim()
  return joined.length >= 3 && joined.length < name.length ? joined : null
}

/**
 * Split a headline into bold/regular runs, bolding the entities it names.
 *
 * Danny (2026-08-30): "I want a lot of the letters to be not bold and then
 * just the main focus bold, like the manager name or the person's name." An
 * all-bold headline gives the eye nothing to land on; bolding only the actor
 * turns the column into a scannable index of who did what.
 *
 * Matching is case-insensitive and boundary-aware, and tries each entity's
 * full name before its distinctive core, so "StepStone Group" bolds
 * "StepStone" in "StepStone raises $1.7bn". Entities the headline never names
 * (a16z for "Andreessen Horowitz") simply don't match, leaving the headline
 * unbolded rather than guessing.
 */
export function splitHeadlineByEntities(
  title: string,
  entities: (string | null | undefined)[],
): HeadlineSegment[] {
  const candidates: string[] = []
  for (const raw of entities) {
    const name = raw ? cleanEntityName(raw) : ''
    if (!name || name.length < 3) continue
    candidates.push(name)
    const core = distinctiveCore(name)
    if (core) candidates.push(core)
  }
  if (candidates.length === 0) return [{ text: title, bold: false }]

  // Longest first so "Rahul Seth" wins over a shorter overlapping candidate.
  candidates.sort((a, b) => b.length - a.length)

  const ranges: Array<[number, number]> = []
  for (const c of candidates) {
    // Boundaries are non-alphanumeric so we never match inside a longer word,
    // while still catching possessives ("Rahul Seth's").
    const re = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegExp(c)})(?![A-Za-z0-9])`, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(title)) !== null) {
      const start = m.index + m[1].length
      const end = start + m[2].length
      if (!ranges.some(([s, e]) => start < e && end > s)) ranges.push([start, end])
      re.lastIndex = end
    }
  }
  if (ranges.length === 0) return [{ text: title, bold: false }]

  ranges.sort((a, b) => a[0] - b[0])
  const segments: HeadlineSegment[] = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) segments.push({ text: title.slice(cursor, start), bold: false })
    segments.push({ text: title.slice(start, end), bold: true })
    cursor = end
  }
  if (cursor < title.length) segments.push({ text: title.slice(cursor), bold: false })
  return segments
}
