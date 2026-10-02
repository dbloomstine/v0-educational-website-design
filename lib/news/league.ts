/**
 * League tables — fund closes, ranked.
 *
 * A ranking is a stronger claim than a headline: "Bessemer, $5.8B, first" is
 * FundOpsHQ saying so, not a publisher. So this module is deliberately
 * conservative about what it admits, and every row it produces can be traced
 * to the published report it came from.
 *
 * How a row gets in:
 *   1. It is a story (lib/news/stories.ts) — the same screening, clustering and
 *      placement the site and the newsletter use — about a fund close.
 *   2. It names the manager, states a size, and says which close it was.
 *   3. The size is the fund's own (not the manager's AUM), is in a sane range,
 *      and the headline or summary actually contains a figure.
 *   4. The same close reported again days or weeks later is one row
 *      (mergeFunds), dated to the first report.
 *   5. A correction in the `league_overrides` table wins over all of the above.
 *
 * What it does not claim: completeness. It ranks the closes reported in the
 * stories we carried. The page says so.
 *
 * Pure: no I/O. lib/news/league-data.ts fetches and caches.
 */
import { buildStories, type Story } from './stories'
import { entityKey, keysMatch } from '@/lib/newsletter/story-links'
import { fundSizesMatch } from './story-dedup'

export type CloseStage = 'final' | 'first' | 'interim'

export interface FundClose {
  /** Story id — `/story/<id>` is the row's evidence page. */
  id: string
  memberIds: string[]
  firm: string
  firmSlug: string
  fund: string | null
  sizeUsdM: number
  stage: CloseStage
  /** ISO date of the first report. */
  date: string
  /** Asset-class tag (PE, VC, credit…), or null. */
  assetClass: string | null
  headline: string
  source: string | null
  url: string
  /** Distinct outlets that reported it. */
  sources: number
  /** True when the reports gave the size in another currency. */
  converted: boolean
}

export interface LeagueOverride {
  news_item_id: string
  action: 'hide' | 'set'
  firm_name?: string | null
  fund_name?: string | null
  size_usd_millions?: number | null
  stage?: CloseStage | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

/** Close types the classifier emits → the three stages the table shows. */
const STAGE_OF: Record<string, CloseStage> = {
  final_close: 'final',
  hard_cap: 'final',
  first_close: 'first',
  interim_close: 'interim',
  second_close: 'interim',
}
export const LEAGUE_CLOSE_TYPES = Object.keys(STAGE_OF)

/** Smallest and largest fund the table will print. The largest private fund ever raised is about $30B. */
const MIN_USD_M = 5
const MAX_USD_M = 60_000

/** The address of a firm's page: "Ares Management" → "ares". */
export function firmSlug(name: string | null | undefined): string {
  return entityKey(name).replace(/\s+/g, '-')
}

/**
 * Headlines that say the fund has NOT closed yet. The classifier files "Advent
 * closes in on $26bn mega buyout fund" and "ECP eyes $8bn close" as final
 * closes; they are news, but they are not closes, and a ranking that counted
 * them would list the same fund twice — once on the rumour, once on the day.
 */
const NOT_YET_RE =
  /\b(nears?|nearing|approach(es|ing)?|closes in on|closing in on|close in on|on track (for|to)|set to|poised to|expects? to|expected to|aims? (for|to)|plans? to|seeks?|seeking|to soft[- ]close|to close (in|by|this|next|soon|later)|(very )?close to (a |an |its |the |final|first|closing|[$€£¥]|\d)|is closing|(sets?|with|unveils?|reveals?) (a |an |its )?[$€£¥][\d.,]+\s?\w* target|said to|sources say|reportedly|in talks|could|may|weighs?|mulls?|ahead of|returns? to market|back in market|eyes (a |an |its |the |first|final|close|[$€£¥]|\d)|targets [$€£¥])\b/i

/**
 * Things that are called a "close" and are not a private fund's final close:
 * a hedge fund shutting to new money, a listed vehicle's IPO, a fund being
 * wound up.
 */
const NOT_A_FUND_CLOSE_RE =
  /\b(soft[- ]close[sd]?|clos(es|ed|ing) to new (clients|investors|money|capital|cash)|ipo|closed-end|unwinds?|unwinding|winds? down|winding down|liquidat\w+|shut(s|ting)? down|pulls? (the )?plug|scraps?|shelves?|abandons?)\b/i

/** Continuation vehicles and structured issues are transactions, not blind-pool fund closes. */
const NOT_A_BLIND_POOL_RE = /\b(continuation (fund|vehicle)s?|single-asset|multi-asset continuation|CVs?|CLO|CFO|SRT|CMBS|ABS|construction loans?|debt investments|credit facility|term loan|[Cc]ollaterali[sz]ed|[Ss]ecuriti[sz]ation)\b/

/** A fund, named or at least called one. "Ares' record $30 billion fundraising" is a firm's year, not a fund. */
const FUND_WORD_RE = /\b(funds?|vehicles?|flagship|strategy|programme|program|vintage|close|closes|closed|closing)\b/i

/** Link target for a firm's page, or null when the name has no usable key. */
export function firmHref(name: string | null | undefined): string | null {
  const slug = firmSlug(name)
  return /^[a-z0-9]+(-[a-z0-9]+){0,7}$/.test(slug) && slug.length <= 60 ? `/firm/${slug}` : null
}

/** Why a story is not a league row, or null when it is. Exported so the audit can say why. */
export function leagueRejection(story: Story): string | null {
  // Quote marks sit inside the phrases the patterns look for: Keppel ‘very close’ to $2bn.
  const headline = story.headline.replace(/[‘’“”'"]/g, '')
  if (story.kind !== 'fundraising') return 'not a fundraising story'
  if (story.roundup) return 'multi-story wire'
  if (!story.leadEligible) return 'not a raise (wind-down, CLO pricing, commitment…)'
  if (!story.firmName || !firmSlug(story.firmName)) return 'no manager named'
  if (!story.closeType || !STAGE_OF[story.closeType]) return 'no close stage'
  // "hard_cap" is a close only when the event is a close: a fund that "sets a hard cap" has not closed.
  if (story.closeType === 'hard_cap' && story.eventType !== 'fund_close' && !/\b(hits?|reach(es|ed)|clos(es|ed)|at)\b[^;]*\bhard[- ]cap\b/i.test(story.headline)) return 'hard cap set, not closed'
  if (!story.sizeUsdM) return 'no size (or the size is the manager’s AUM)'
  if (story.sizeUsdM < MIN_USD_M || story.sizeUsdM > MAX_USD_M) return 'size outside the plausible range'
  if (!/\d/.test(`${story.headline} ${story.summary ?? ''}`)) return 'no figure in the report'
  // Hedge funds do not hold final closes; when one "closes" it is closing to new money.
  if (story.assetClasses[0] === 'hedge') return 'hedge fund (no final close)'
  if (NOT_A_FUND_CLOSE_RE.test(headline)) return 'not a private fund close (IPO, soft close, wind-down…)'
  if (NOT_A_BLIND_POOL_RE.test(`${story.headline} ${story.fundName ?? ''}`)) return 'continuation vehicle or structured issue'
  if (STAGE_OF[story.closeType] === 'final' && NOT_YET_RE.test(headline)) return 'headline says it has not closed yet'
  // No fund named and the headline does not call it one: admit it only when a
  // second outlet reported it and the summary describes a fund.
  if (!story.fundName && !FUND_WORD_RE.test(story.headline) && !(story.coverage.length > 0 && FUND_WORD_RE.test(story.summary ?? ''))) {
    return 'no fund named or described'
  }
  return null
}

/** A bare numeral is a fund number, not a name: "XIV" → "Fund XIV". */
export function fundLabel(name: string | null): string | null {
  if (!name) return null
  const t = name.trim()
  if (/^(?:[IVXLC]+|\d{1,2})$/.test(t)) return `Fund ${t}`
  return t
}

function toFundClose(story: Story, rowById: Map<string, Row>): FundClose {
  const rows = story.memberIds.map((id) => rowById.get(id)).filter(Boolean)
  const converted = rows.some((r) => {
    const c = String(r.extracted_data?.original_currency ?? '').toUpperCase()
    return !!c && c !== 'USD'
  })
  // "Fund III" lives in fund_number when the reports never spelled out a fund name.
  const fundNumber = rows.map((r) => r.extracted_data?.fund_number).find((n) => typeof n === 'string' && n.trim()) as string | undefined
  const date = rows.map((r) => String(r.published_date).slice(0, 10)).sort()[0] ?? story.publishedDate ?? story.firstSeen.slice(0, 10)
  return {
    id: story.id,
    memberIds: story.memberIds,
    firm: story.firmName as string,
    firmSlug: firmSlug(story.firmName),
    fund: fundLabel(story.fundName ?? fundNumber ?? null),
    sizeUsdM: story.sizeUsdM as number,
    stage: STAGE_OF[story.closeType as string],
    date,
    assetClass: story.assetClasses[0] ?? null,
    headline: story.headline,
    source: story.source,
    url: story.url,
    sources: story.coverage.length + 1,
    converted,
  }
}

const DAY_MS = 86_400_000
const daysApart = (a: string, b: string) => Math.abs(new Date(`${a}T12:00:00Z`).getTime() - new Date(`${b}T12:00:00Z`).getTime()) / DAY_MS

/** Fund names compared without the manager's own name in them ("Ares Fund VI" → "vi"). */
function fundKey(c: FundClose): string {
  const firm = entityKey(c.firm).split(' ')
  return entityKey(c.fund)
    .split(' ')
    .filter((t) => t && !firm.includes(t))
    .join(' ')
}

/**
 * The same manager, allowing for a parent and its affiliate: "Oaktree" on one
 * report and "17Capital" on another were one NAV fund ("Oaktree's 17Capital
 * Attracts $7.5 Billion"). An affiliate counts only when one report's manager
 * is named in the other's headline or fund name.
 */
/** "Copenhagen Infrastructure Partners" → "cip", "Energy Capital Partners" → "ecp". */
export function acronymOf(name: string): string {
  const words = name.replace(/&/g, ' ').split(/[\s-]+/).filter((w) => /^[A-Z]/.test(w))
  return words.length >= 2 ? words.map((w) => w[0]).join('').toLowerCase() : ''
}

/** True when two names are one firm: the same key, a prefix of it, or one is the other's initials. */
export function sameFirmName(a: string, b: string): boolean {
  const ka = entityKey(a)
  const kb = entityKey(b)
  if (keysMatch(ka, kb)) return true
  const ia = acronymOf(a)
  const ib = acronymOf(b)
  const flat = (k: string) => k.replace(/ /g, '')
  return (ia.length >= 2 && ia === flat(kb)) || (ib.length >= 2 && ib === flat(ka))
}

function sameManager(a: FundClose, b: FundClose): boolean {
  const ka = entityKey(a.firm)
  const kb = entityKey(b.firm)
  if (sameFirmName(a.firm, b.firm)) return true
  const mentions = (key: string, c: FundClose) => key.length >= 4 && ` ${entityKey(`${c.headline} ${c.fund ?? ''}`)} `.includes(` ${key} `)
  return mentions(ka, b) || mentions(kb, a)
}

/**
 * The same close, reported again. Stories are clustered within a few days of
 * each other; a trade weekly's write-up three weeks later is a new story but
 * not a new close. Same manager, same stage, and either the same fund name or
 * the same figure, within four months.
 */
export function sameClose(a: FundClose, b: FundClose): boolean {
  if (a.stage !== b.stage) return false
  if (daysApart(a.date, b.date) > 200) return false
  if (!sameManager(a, b)) return false
  const fa = fundKey(a)
  const fb = fundKey(b)
  // The very same figure from the same manager at the same stage is the same
  // fund, whatever each outlet called it: "KKR North America Private-Equity
  // Fund" and "XIV" were one $23B close. Names are extracted by software and
  // disagree far more often than two real funds share a figure to the percent.
  if (fundSizesMatch(a.sizeUsdM, b.sizeUsdM, 0.011)) return true
  if (fa && fb) {
    // Two named funds at different figures: only the same name joins them.
    return fa === fb && fundSizesMatch(a.sizeUsdM, b.sizeUsdM, 0.25)
  }
  return fundSizesMatch(a.sizeUsdM, b.sizeUsdM, 0.05)
}

export function mergeFunds(closes: FundClose[]): FundClose[] {
  const parent = closes.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (let i = 0; i < closes.length; i++) {
    for (let j = i + 1; j < closes.length; j++) {
      if (find(i) !== find(j) && sameClose(closes[i], closes[j])) parent[find(j)] = find(i)
    }
  }
  const groups = new Map<number, FundClose[]>()
  closes.forEach((c, i) => {
    const r = find(i)
    groups.set(r, [...(groups.get(r) ?? []), c])
  })
  return Array.from(groups.values()).map((g) => {
    if (g.length === 1) return g[0]
    // The best-sourced report stands for the close; it is dated to the first.
    const best = [...g].sort((a, b) => b.sources - a.sources || a.date.localeCompare(b.date))[0]
    return {
      ...best,
      fund: best.fund ?? g.map((c) => c.fund).find(Boolean) ?? null,
      date: g.map((c) => c.date).sort()[0],
      memberIds: g.flatMap((c) => c.memberIds),
      sources: Math.max(best.sources, new Set(g.map((c) => c.source)).size),
    }
  })
}

export function buildLeague(rows: Row[], overrides: LeagueOverride[] = []): FundClose[] {
  const rowById = new Map<string, Row>(rows.map((r) => [r.id, r]))
  const closes = buildStories(rows)
    .filter((s) => leagueRejection(s) === null)
    .map((s) => toFundClose(s, rowById))

  const merged = mergeFunds(closes)

  // Corrections last, so they hold whatever the reports or the rules say.
  const out: FundClose[] = []
  for (const c of merged) {
    const o = overrides.find((x) => c.memberIds.includes(x.news_item_id))
    if (o?.action === 'hide') continue
    if (o?.action === 'set') {
      const firm = o.firm_name ?? c.firm
      out.push({
        ...c,
        firm,
        firmSlug: firmSlug(firm),
        fund: o.fund_name ?? c.fund,
        sizeUsdM: o.size_usd_millions ?? c.sizeUsdM,
        stage: o.stage ?? c.stage,
      })
      continue
    }
    out.push(c)
  }
  return out.sort((a, b) => b.sizeUsdM - a.sizeUsdM || b.date.localeCompare(a.date))
}

// ─── Reading the table ──────────────────────────────────────────────────────

export const LEAGUE_PERIODS = [
  { key: '30d', label: 'Past 30 days', days: 30 },
  { key: '90d', label: 'Past 90 days', days: 90 },
  { key: 'ytd', label: 'Year to date', days: null },
] as const
export type LeaguePeriod = (typeof LEAGUE_PERIODS)[number]['key']

export function inPeriod(c: FundClose, period: LeaguePeriod, nowMs: number): boolean {
  const today = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  if (c.date > today) return false
  if (period === 'ytd') return c.date >= `${today.slice(0, 4)}-01-01`
  const days = LEAGUE_PERIODS.find((p) => p.key === period)?.days ?? 30
  return daysApart(c.date, today) <= days
}

export interface LeagueFilter { period: LeaguePeriod; asset?: string | null; stage?: CloseStage | 'all' }

export function leagueRows(all: FundClose[], f: LeagueFilter, nowMs: number): FundClose[] {
  const stage = f.stage ?? 'final'
  return all.filter(
    (c) => inPeriod(c, f.period, nowMs) && (stage === 'all' || c.stage === stage) && (!f.asset || c.assetClass === f.asset),
  )
}

// ─── Chart series for the front page ────────────────────────────────────────

export interface ChartBar { label: string; value: number; count: number }

/** Capital in final closes over the period, by asset class, largest first. */
export function capitalByAsset(all: FundClose[], nowMs: number, labels: Record<string, string>, period: LeaguePeriod = '30d'): ChartBar[] {
  const m = new Map<string, ChartBar>()
  for (const c of leagueRows(all, { period }, nowMs)) {
    const label = labels[c.assetClass ?? ''] ?? 'Other'
    const b = m.get(label) ?? { label, value: 0, count: 0 }
    b.value += c.sizeUsdM
    b.count++
    m.set(label, b)
  }
  return Array.from(m.values()).sort((a, b) => b.value - a.value)
}

/** Capital in final closes per week (Monday-start, ET dates), oldest first. */
export function capitalByWeek(all: FundClose[], nowMs: number, weeks = 12): ChartBar[] {
  const monday = (iso: string) => {
    const d = new Date(`${iso}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  }
  const today = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const thisWeek = monday(today)
  const out: ChartBar[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${thisWeek}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i * 7)
    const start = d.toISOString().slice(0, 10)
    const inWeek = all.filter((c) => c.stage === 'final' && c.date <= today && monday(c.date) === start)
    out.push({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      value: inWeek.reduce((s, c) => s + c.sizeUsdM, 0),
      count: inWeek.length,
    })
  }
  return out
}

export const SIZE_BANDS: { label: string; min: number; max: number }[] = [
  { label: 'Under $100M', min: 0, max: 100 },
  { label: '$100M – $500M', min: 100, max: 500 },
  { label: '$500M – $1B', min: 500, max: 1000 },
  { label: '$1B – $5B', min: 1000, max: 5000 },
  { label: '$5B and up', min: 5000, max: Infinity },
]

/** How many final closes fell in each size band over the period. Value is the count. */
export function closesBySize(all: FundClose[], nowMs: number, period: LeaguePeriod = '30d'): ChartBar[] {
  const rows = leagueRows(all, { period }, nowMs)
  return SIZE_BANDS.map((b) => {
    const n = rows.filter((c) => c.sizeUsdM >= b.min && c.sizeUsdM < b.max).length
    return { label: b.label, value: n, count: n }
  })
}
