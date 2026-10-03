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
 *   4. The same close reported again — days later, under another name for the
 *      fund, or with another figure — is one row (sameClose, mergeFunds), dated
 *      to the first report. Where the reports disagree on the figure the lower
 *      one is used and the other is kept as `altSizeUsdM` (settleSize).
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
import { headlineFigureFor, headlineMoney } from './money'
import { barsByMarket, barsBySize, barsByWeek, SIZE_BANDS, type ChartClose } from './chart-math'

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
  /** Their names, so merged rows can count outlets once. */
  outlets: string[]
  /** True when the reports gave the size in another currency. */
  converted: boolean
  /** "North America", "Europe", "Asia-Pacific", "Global"… as the reports describe it, or null. */
  region: string | null
  /**
   * Another figure the reports gave for this close, when it differs from
   * `sizeUsdM` by more than a tenth — usually a total that adds leverage or
   * sister vehicles to the fund's own commitments. The table marks such rows.
   */
  altSizeUsdM: number | null
}

/** A close reported without a size: counted for the "not in the totals" note, never ranked. */
export interface UnsizedClose {
  id: string
  firm: string
  firmSlug: string
  stage: CloseStage
  date: string
  assetClass: string | null
}

export interface LeagueReport {
  closes: FundClose[]
  unsized: UnsizedClose[]
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

/**
 * Continuation vehicles and structured issues are transactions, not blind-pool
 * fund closes; a mandate is one investor's account; an evergreen or listed
 * vehicle takes money continuously and never holds a final close.
 */
const NOT_A_BLIND_POOL_RE = /\b(continuation (fund|vehicle)s?|single-asset|multi-asset continuation|CVs?|CLO|CFO|SRT|CMBS|ABS|construction loans?|debt investments|credit facility|term loan|[Cc]ollaterali[sz]ed|[Ss]ecuriti[sz]ation|[Mm]andates?|[Ee]vergreen|[Pp]erpetual|[Oo]pen-end(ed)?|[Ss]emi-liquid|[Ii]nterval fund|[Nn]on-traded|BDC|[Ll]ong-running)\b/

/**
 * The figure on file is a target when the headline says so: "eyes $70m for
 * fourth fund, hits $25m first close", "halfway mark in €350m-targeting debut
 * fundraise", "first close en route to $50m", "hits halfway mark for $1.5bn
 * sophomore infra fund" (halfway to a figure has not raised it).
 */
const TARGET_BEFORE_RE = /(targets?|targeting|targeted|eyes|eyeing|seeks?|seeking|aims? (for|at)|en route to|towards?|on (its |the )?way to|(goal|target) of|half[- ]?way (mark |point )?(for|to|in|on|of))\s+(a |an |up to |as much as |about |around |nearly )?$/i
const TARGET_AFTER_RE = /^[\s-]*(target|targeting|-targeting|goal)\b/i
/** "first close of €25m Blue Fund", "second close of €800m financing fund": the figure is the fund's size, not the close's. */
const CLOSE_OF_BEFORE_RE = /\b(first|second|third|initial|interim|1st|2nd|3rd)\s+clos(e|ing)\s+(of|for|on)\s+(its |the |a |an )?$/i
const FUND_NOUN_AFTER_RE = /^(?:[\s-]+(?!for\b|in\b|to\b|toward|at\b|on\b|with\b|from\b|as\b)[\w'’&.-]+){0,6}[\s-]+funds?\b/i

/** True when the headline marks the story's own figure as a target rather than money closed. */
export function sizeIsTarget(headline: string, sizeUsdM: number, stage: CloseStage): boolean {
  const fig = headlineFigureFor(sizeUsdM, headline)
  if (!fig) return false
  const before = headline.slice(Math.max(0, fig.index - 30), fig.index)
  const after = headline.slice(fig.end, fig.end + 60)
  if (TARGET_BEFORE_RE.test(before)) return true
  // A final close "at its €5.5bn target", or one that "surpasses its €1.5bn
  // target", did raise that much. Only an earlier close is short of its target.
  if (stage === 'final') return false
  return TARGET_AFTER_RE.test(after.slice(0, 16)) || (CLOSE_OF_BEFORE_RE.test(before) && FUND_NOUN_AFTER_RE.test(after))
}

/** A fund, named or at least called one. "Ares' record $30 billion fundraising" is a firm's year, not a fund. */
const FUND_WORD_RE = /\b(funds?|vehicles?|flagship|strategy|programme|program|vintage|close|closes|closed|closing)\b/i

/** Link target for a firm's page, or null when the name has no usable key. */
export function firmHref(name: string | null | undefined): string | null {
  const slug = firmSlug(name)
  return /^[a-z0-9]+(-[a-z0-9]+){0,7}$/.test(slug) && slug.length <= 60 ? `/firm/${slug}` : null
}

/**
 * Why a story is not a league row, or null when it is. Exported so the audit
 * can say why. With `sizeOptional` the size checks are skipped: that is how the
 * closes reported without a figure are counted.
 */
export function leagueRejection(story: Story, opts: { sizeOptional?: boolean } = {}): string | null {
  // Quote marks sit inside the phrases the patterns look for: Keppel ‘very close’ to $2bn.
  const headline = story.headline.replace(/[‘’“”'"]/g, '')
  if (story.kind !== 'fundraising') return 'not a fundraising story'
  if (story.roundup) return 'multi-story wire'
  if (!story.leadEligible) return 'not a raise (wind-down, CLO pricing, commitment…)'
  if (!story.firmName || !firmSlug(story.firmName)) return 'no manager named'
  if (!story.closeType || !STAGE_OF[story.closeType]) return 'no close stage'
  // "hard_cap" is a close only when the event is a close: a fund that "sets a hard cap" has not closed.
  if (story.closeType === 'hard_cap' && story.eventType !== 'fund_close' && !/\b(hits?|reach(es|ed)|clos(es|ed)|at)\b[^;]*\bhard[- ]cap\b/i.test(story.headline)) return 'hard cap set, not closed'
  if (!opts.sizeOptional) {
    if (!story.sizeUsdM) return 'no size (or the size is the manager’s AUM)'
    if (story.sizeUsdM < MIN_USD_M || story.sizeUsdM > MAX_USD_M) return 'size outside the plausible range'
    if (!/\d/.test(`${story.headline} ${story.summary ?? ''}`)) return 'no figure in the report'
    if (sizeIsTarget(headline, story.sizeUsdM, STAGE_OF[story.closeType])) return 'the figure is a target, not money closed'
  }
  // Hedge funds do not hold final closes; when one "closes" it is closing to new money.
  if (story.assetClasses[0] === 'hedge') return 'hedge fund (no final close)'
  if (NOT_A_FUND_CLOSE_RE.test(headline)) return 'not a private fund close (IPO, soft close, wind-down…)'
  if (NOT_A_BLIND_POOL_RE.test(`${story.headline} ${story.fundName ?? ''}`)) return 'not a closed-end fund (continuation vehicle, CLO, mandate, evergreen…)'
  if (STAGE_OF[story.closeType] === 'final' && NOT_YET_RE.test(headline)) return 'headline says it has not closed yet'
  // No fund named and the headline does not call it one: admit it only when a
  // second outlet reported it and the summary describes a fund.
  if (!story.fundName && !FUND_WORD_RE.test(story.headline) && !(story.coverage.length > 0 && FUND_WORD_RE.test(story.summary ?? ''))) {
    return 'no fund named or described'
  }
  return null
}

/** A bare numeral is a fund number, not a name: "XIV" → "Fund XIV", "III / I" → "Funds III / I". */
export function fundLabel(name: string | null): string | null {
  if (!name) return null
  const t = name.trim()
  if (/^(?:[IVXLC]+|\d{1,2})$/.test(t)) return `Fund ${t}`
  if (/^(?:[IVXLC]+|\d{1,2})(?:\s*[/&,]\s*(?:[IVXLC]+|\d{1,2}))+$/.test(t)) return `Funds ${t}`
  return t
}

/** One region for a close: the one the reports give, "Global" when they give several. */
export function regionOf(geography: string[] | null | undefined): string | null {
  const g = Array.from(new Set((geography ?? []).map((x) => String(x).trim()).filter(Boolean)))
  if (g.length === 0) return null
  return g.length > 1 ? 'Global' : g[0]
}

function toFundClose(story: Story, rowById: Map<string, Row>): FundClose {
  const rows = story.memberIds.map((id) => rowById.get(id)).filter(Boolean)
  // Was the size converted from another currency? The headline says so when it
  // states the figure ("€2.1bn" is, "$2bn" is not). Failing that, most of the
  // reports' own currency fields — one stray "GBP" among dollar reports is the
  // classifier, not the fund.
  const stated = headlineFigureFor(story.sizeUsdM as number, story.headline)
  const currencies = rows.map((r) => String(r.extracted_data?.original_currency ?? '').toUpperCase()).filter(Boolean)
  const foreign = currencies.filter((c) => c !== 'USD').length
  const converted = stated ? stated.currency !== 'USD' : foreign > currencies.length / 2
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
    outlets: Array.from(new Set([story.source, ...story.coverage.map((c) => c.source)].filter((x): x is string => !!x))),
    converted,
    region: regionOf(story.geography),
    altSizeUsdM: null,
  }
}

const DAY_MS = 86_400_000
const daysApart = (a: string, b: string) => Math.abs(new Date(`${a}T12:00:00Z`).getTime() - new Date(`${b}T12:00:00Z`).getTime()) / DAY_MS

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
  const ia = acronymOf(a)
  const ib = acronymOf(b)
  const flat = (k: string) => k.replace(/ /g, '')
  if ((ia.length >= 2 && ia === flat(kb)) || (ib.length >= 2 && ib === flat(ka))) return true
  // A one- or two-letter key identifies nobody: "Capital A" and "A* Capital"
  // both reduce to "a". Such names must match as written.
  if (ka.length < 3 || kb.length < 3) {
    const squash = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, '')
    return squash(a) === squash(b)
  }
  return keysMatch(ka, kb)
}

function sameManager(a: FundClose, b: FundClose): boolean {
  const ka = entityKey(a.firm)
  const kb = entityKey(b.firm)
  if (sameFirmName(a.firm, b.firm)) return true
  const mentions = (key: string, c: FundClose) => key.length >= 4 && ` ${entityKey(`${c.headline} ${c.fund ?? ''}`)} `.includes(` ${key} `)
  return mentions(ka, b) || mentions(kb, a)
}

// ─── Is it the same fund? ───────────────────────────────────────────────────

const ORDINALS: Record<string, number> = {
  first: 1, debut: 1, inaugural: 1, maiden: 1, second: 2, sophomore: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13,
  fourteenth: 14, fifteenth: 15,
}
const ORDINAL_WORDS = Object.keys(ORDINALS).join('|')

/** "VI" → 6. Upper case only, I to XXXIX; anything else is not a fund number. */
function roman(token: string): number | null {
  const m = /^(X{0,3})(IX|IV|V?I{0,3})$/.exec(token)
  if (!m || !token) return null
  const ones: Record<string, number> = { '': 0, I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9 }
  return m[1].length * 10 + ones[m[2]]
}

/**
 * The fund numbers a report gives, from the fund's name ("Partners IX",
 * "GP Finance 2") and from its headline ("Fund VI", "sixth fund", "debut
 * fund"). Two reports that give different numbers are about different funds,
 * whatever else they share. "First close" is a stage, not a number.
 */
export function fundNumbers(c: Pick<FundClose, 'fund' | 'headline'>): Set<number> {
  const out = new Set<number>()
  for (const tok of (c.fund ?? '').split(/[^A-Za-z0-9]+/)) {
    if (!tok) continue
    const r = roman(tok)
    if (r) out.add(r)
    else if (/^\d{1,2}$/.test(tok) && Number(tok) > 0) out.add(Number(tok))
    else if (ORDINALS[tok.toLowerCase()]) out.add(ORDINALS[tok.toLowerCase()])
  }
  const h = c.headline
  for (const m of h.matchAll(/\b[Ff]unds?\s+([IVX]{1,6}|\d{1,2})\b/g)) {
    const n = roman(m[1]) ?? (/^\d+$/.test(m[1]) ? Number(m[1]) : null)
    if (n) out.add(n)
  }
  for (const m of h.matchAll(/\b([IVX]{2,6})\b/g)) {
    const n = roman(m[1])
    if (n) out.add(n)
  }
  const ordinal = new RegExp(
    `\\b(${ORDINAL_WORDS})\\b` +
      // …but not "first close", "second-largest", "third quarter".
      `(?!(?:[\\s-]+[\\w-]+){0,2}?[\\s-]+clos)(?![\\s-]+(?:largest|biggest|time|half|quarter|year|month|week|straight|consecutive|major|ever)\\b)` +
      `(?=(?:[\\s-]+[\\w'’&.-]+){0,5}?[\\s-]+(?:funds?|vehicles?|flagship|vintage|fundraise|programme|program|strategy)\\b)`,
    'gi',
  )
  for (const m of h.matchAll(ordinal)) out.add(ORDINALS[m[1].toLowerCase()])
  return out
}

/** Words every fund name uses, and places: neither tells one of a manager's funds from another. */
const FUND_GENERIC = new Set([
  'fund', 'funds', 'llp', 'partners', 'partner', 'capital', 'the', 'and', 'for', 'series', 'vehicle', 'vehicles',
  'strategy', 'strategies', 'program', 'programme', 'flagship', 'opportunities', 'opportunity', 'investments',
  'investment', 'management', 'holdings', 'group', 'equity', 'private', 'ventures', 'venture', 'new', 'latest',
  'solutions', 'access', 'all',
])
const FUND_GEO = new Set([
  'europe', 'european', 'asia', 'asian', 'pacific', 'america', 'american', 'americas', 'north', 'south', 'southern',
  'northern', 'usa', 'global', 'international', 'japan', 'india', 'china', 'africa', 'african', 'nordic', 'iberia',
  'latin', 'middle', 'east', 'eastern', 'western', 'australia', 'canada', 'korea', 'israel', 'germany', 'france',
  'italy', 'spain', 'emerging', 'markets',
])

/** The words in a fund's name that are its own: not the manager's, not a number, not generic, not a place. */
export function fundNameTokens(c: Pick<FundClose, 'fund' | 'firm'>): string[] {
  const firm = new Set(c.firm.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))
  const acronym = acronymOf(c.firm)
  return Array.from(new Set(
    (c.fund ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) =>
        t.length >= 3 && !firm.has(t) && t !== acronym && !FUND_GENERIC.has(t) && !FUND_GEO.has(t) &&
        !/^\d+$/.test(t) && !/^(x{0,3})(ix|iv|v?i{0,3})$/.test(t) && !ORDINALS[t]),
  ))
}

/** The same figure: to the percent, or — when a currency was converted, at whatever rate each outlet used — within six. */
function sameFigure(a: FundClose, b: FundClose): boolean {
  // Two percent, not one: "$5.12bn" in May is "$5.2 billion" by July.
  if (fundSizesMatch(a.sizeUsdM, b.sizeUsdM, 0.02)) return true
  return (a.converted || b.converted) && fundSizesMatch(a.sizeUsdM, b.sizeUsdM, 0.06)
}

/** True when both headlines state one and the same money figure ("€1bn" and "€1 Billion"). */
function headlinesShareFigure(a: string, b: string): boolean {
  const fb = headlineMoney(b)
  return headlineMoney(a).some((x) => fb.some((y) => x.currency === y.currency && Math.abs(x.amountM - y.amountM) <= 0.011 * Math.max(x.amountM, y.amountM)))
}

/** How long after the first report a re-report can still be the same close. */
const SAME_CLOSE_DAYS = 200
/** Reports of one announcement that disagree on the figure arrive close together. */
const SAME_ANNOUNCEMENT_DAYS = 45

/**
 * The same close, reported again. Stories are clustered within a few days of
 * each other and only when their figures agree, so three kinds of repeat reach
 * this point as separate stories: a trade weekly's write-up weeks later, a
 * second name for the same fund, and — the costly one — a second FIGURE for the
 * same fund (EIG's Fund VI ran as $1.9B, the fund, and $4.0B, the fund plus
 * its single-investor vehicles: one fund, counted twice, $5.9B).
 *
 * Same manager and stage always. Then:
 *   · different fund numbers ("Fund V", "Fund VI")  → never the same;
 *   · the same figure                               → the same, unless both are
 *     named differently and the reports are weeks apart;
 *   · different figures, within 45 days            → the same only on evidence:
 *     the names share a word of their own, or one is unnamed and they share a
 *     fund number, a headline figure, or a day.
 */
export function sameClose(a: FundClose, b: FundClose): boolean {
  if (a.stage !== b.stage) return false
  const gap = daysApart(a.date, b.date)
  if (gap > SAME_CLOSE_DAYS || !sameManager(a, b)) return false

  const na = fundNumbers(a)
  const nb = fundNumbers(b)
  const sharedNumber = [...na].some((n) => nb.has(n))
  if (na.size > 0 && nb.size > 0 && !sharedNumber) return false

  const ta = fundNameTokens(a)
  const tb = fundNameTokens(b)
  const sharedWord = ta.some((t) => tb.includes(t))
  const namesConflict = ta.length > 0 && tb.length > 0 && !sharedWord

  if (sameFigure(a, b)) return !(namesConflict && gap > SAME_ANNOUNCEMENT_DAYS)
  if (gap > SAME_ANNOUNCEMENT_DAYS || namesConflict) return false

  const ratio = Math.max(a.sizeUsdM, b.sizeUsdM) / Math.min(a.sizeUsdM, b.sizeUsdM)
  if (sharedWord) return ratio <= 3
  // From here at least one of the two reports does not name the fund.
  if (headlinesShareFigure(a.headline, b.headline)) return ratio <= 3
  // The same fund number and nearly the same figure: "more than $800m" and "the $750m hard cap".
  if (sharedNumber && ratio <= 1.1) return true
  const sameMarket = a.assetClass === b.assetClass
  if (sharedNumber && sameMarket) return ratio <= 2.05
  return gap <= 1 && sameMarket && ratio <= 2.05
}

/** Reports this close to the latest one are the same announcement; older ones are an earlier stage of the raise. */
const FINAL_WORD_DAYS = 21

/**
 * One figure for a close its reports disagree about.
 *
 * The lower one, among the reports of the final announcement. When two
 * figures circulate for one fund the higher is nearly always a total that adds
 * something to the fund's own commitments — leverage ("$10B of investable
 * capital" on a $5.4B fund), single-investor vehicles, a sister fund, or a
 * local currency read as dollars. A league table that understates a little is
 * defensible; one that overstates is not. A figure under a fifth of the highest
 * is treated as a stray number, and figures within 8% of each other as one
 * figure (conversion rates differ by outlet), read from the best-sourced report.
 */
export function settleSize(group: Pick<FundClose, 'sizeUsdM' | 'date' | 'sources'>[]): { sizeUsdM: number; altSizeUsdM: number | null } {
  const latest = group.map((c) => c.date).sort().pop() as string
  const recent = group.filter((c) => daysApart(c.date, latest) <= FINAL_WORD_DAYS)
  const hi = Math.max(...recent.map((c) => c.sizeUsdM))
  const eligible = recent.filter((c) => c.sizeUsdM >= 0.2 * hi).sort((x, y) => x.sizeUsdM - y.sizeUsdM)
  const lowest = [eligible[0]]
  for (const c of eligible.slice(1)) {
    if (c.sizeUsdM <= lowest[lowest.length - 1].sizeUsdM * 1.08) lowest.push(c)
    else break
  }
  const sizeUsdM = [...lowest].sort((x, y) => y.sources - x.sources || x.sizeUsdM - y.sizeUsdM)[0].sizeUsdM
  return { sizeUsdM, altSizeUsdM: hi > sizeUsdM * 1.1 ? hi : null }
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
    const { sizeUsdM, altSizeUsdM } = settleSize(g)
    // The row is represented by a report that carries the figure it shows —
    // the best-sourced of those — so its headline and its number agree.
    const agree = g.filter((c) => fundSizesMatch(c.sizeUsdM, sizeUsdM, 0.08))
    const best = [...(agree.length ? agree : g)].sort((a, b) => b.sources - a.sources || a.date.localeCompare(b.date))[0]
    // The fullest name any report gave the fund.
    const fund = [...g]
      .filter((c) => c.fund)
      .sort((a, b) => fundNameTokens(b).length - fundNameTokens(a).length || (b.fund as string).length - (a.fund as string).length)[0]?.fund ?? null
    const outlets = Array.from(new Set(g.flatMap((c) => c.outlets)))
    // The manager's name as most reports wrote it; the longer form on a tie
    // ("Hamilton Lane" over "HL", "Climate Fund Managers" over "CFM").
    const votes = new Map<string, number>()
    for (const c of g) votes.set(c.firm, (votes.get(c.firm) ?? 0) + c.sources)
    const firm = Array.from(votes.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0]
    return {
      ...best,
      firm,
      firmSlug: firmSlug(firm),
      fund,
      sizeUsdM,
      altSizeUsdM,
      date: g.map((c) => c.date).sort()[0],
      memberIds: g.flatMap((c) => c.memberIds),
      outlets,
      sources: Math.max(outlets.length, ...g.map((c) => c.sources)),
      converted: g.some((c) => c.converted),
      region: best.region ?? g.map((c) => c.region).find(Boolean) ?? null,
    }
  })
}

/** The league, and the closes that could not be ranked because no report gave a size. */
export function buildLeagueReport(rows: Row[], overrides: LeagueOverride[] = []): LeagueReport {
  const rowById = new Map<string, Row>(rows.map((r) => [r.id, r]))
  const stories = buildStories(rows)
  const closes = stories.filter((s) => leagueRejection(s) === null).map((s) => toFundClose(s, rowById))

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
        // A corrected size is the size: there is no "other figure" left to show.
        altSizeUsdM: o.size_usd_millions ? null : c.altSizeUsdM,
        stage: o.stage ?? c.stage,
      })
      continue
    }
    out.push(c)
  }
  out.sort((a, b) => b.sizeUsdM - a.sizeUsdM || b.date.localeCompare(a.date))

  // Closes no report put a number on. A report of a close the table already
  // has (another outlet's version that left the figure out) is not one of them.
  const hidden = new Set(overrides.filter((o) => o.action === 'hide').map((o) => o.news_item_id))
  const unsized: UnsizedClose[] = []
  for (const s of stories) {
    if (s.sizeUsdM || leagueRejection(s, { sizeOptional: true }) !== null) continue
    if (s.memberIds.some((id) => hidden.has(id))) continue
    const rowsOf = s.memberIds.map((id) => rowById.get(id)).filter(Boolean)
    const u: UnsizedClose = {
      id: s.id,
      firm: s.firmName as string,
      firmSlug: firmSlug(s.firmName),
      stage: STAGE_OF[s.closeType as string],
      date: rowsOf.map((r) => String(r.published_date).slice(0, 10)).sort()[0] ?? s.firstSeen.slice(0, 10),
      assetClass: s.assetClasses[0] ?? null,
    }
    const near = (c: { firm: string; stage: CloseStage; date: string }) =>
      c.stage === u.stage && daysApart(c.date, u.date) <= SAME_ANNOUNCEMENT_DAYS && sameFirmName(c.firm, u.firm)
    if (out.some(near) || unsized.some(near)) continue
    unsized.push(u)
  }

  return { closes: out, unsized }
}

export function buildLeague(rows: Row[], overrides: LeagueOverride[] = []): FundClose[] {
  return buildLeagueReport(rows, overrides).closes
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

/**
 * What the league and its charts call each market. The classifier files growth
 * equity with venture (PSG's €4.4B growth fund, Bessemer's growth fund), so the
 * bucket is named for what is in it.
 */
export const LEAGUE_ASSET_LABEL: Record<string, string> = {
  PE: 'Private equity',
  VC: 'Venture & growth',
  credit: 'Credit',
  real_estate: 'Real estate',
  infrastructure: 'Infrastructure',
  secondaries: 'Secondaries',
  gp_stakes: 'GP stakes',
  hedge: 'Hedge funds',
}

export const STAGE_LABEL: Record<CloseStage, string> = { final: 'Final close', first: 'First close', interim: 'Interim close' }

/**
 * The past week's closes, largest first — the "Largest closes" panel on the
 * site and the Monday recap in the email. Every stage is listed (each row says
 * which); the totals count final closes only, as the charts do.
 */
export function weekCloses(
  all: FundClose[],
  nowMs: number,
  opts: { days?: number; assetClasses?: string[]; limit?: number } = {},
): { rows: FundClose[]; finals: number; capitalUsdM: number } {
  const days = opts.days ?? 7
  const today = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const inWindow = all.filter(
    (c) =>
      c.date <= today && daysApart(c.date, today) <= days &&
      (!opts.assetClasses || (c.assetClass != null && opts.assetClasses.includes(c.assetClass))),
  )
  const finals = inWindow.filter((c) => c.stage === 'final')
  return {
    rows: [...inWindow].sort((a, b) => b.sizeUsdM - a.sizeUsdM).slice(0, opts.limit ?? 6),
    finals: finals.length,
    capitalUsdM: finals.reduce((sum, c) => sum + c.sizeUsdM, 0),
  }
}

export function leagueRows(all: FundClose[], f: LeagueFilter, nowMs: number): FundClose[] {
  const stage = f.stage ?? 'final'
  return all.filter(
    (c) => inPeriod(c, f.period, nowMs) && (stage === 'all' || c.stage === stage) && (!f.asset || c.assetClass === f.asset),
  )
}

// ─── Chart series ───────────────────────────────────────────────────────────
// The arithmetic lives in chart-math.ts (it also runs in the browser, for the
// interactive chart). These wrappers are what the server-rendered panels use,
// so the two can never disagree.

/** A close, trimmed to what the chart needs and what is worth sending to the page. */
export function toChartClose(c: FundClose): ChartClose {
  return {
    id: c.id, f: c.firm, s: c.firmSlug, n: c.fund, v: c.sizeUsdM, d: c.date, a: c.assetClass, r: c.region, o: c.sources,
    ...(c.converted ? { c: 1 as const } : {}),
    ...(c.altSizeUsdM ? { alt: c.altSizeUsdM } : {}),
  }
}

export interface ChartBar { label: string; value: number; count: number }

/** Capital in final closes over the period, by asset class, largest first. */
export function capitalByAsset(all: FundClose[], nowMs: number, labels: Record<string, string>, period: LeaguePeriod = '30d'): ChartBar[] {
  return barsByMarket(leagueRows(all, { period }, nowMs).map(toChartClose), labels).map((b) => ({ label: b.label, value: b.capital, count: b.count }))
}

/** Capital in final closes per week (Monday-start, ET dates), oldest first. */
export function capitalByWeek(all: FundClose[], nowMs: number, weeks = 12): ChartBar[] {
  const today = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  return barsByWeek(all.filter((c) => c.stage === 'final').map(toChartClose), today, weeks).map((b) => ({ label: b.label, value: b.capital, count: b.count }))
}

export { SIZE_BANDS }

/** How many final closes fell in each size band over the period. Value is the count. */
export function closesBySize(all: FundClose[], nowMs: number, period: LeaguePeriod = '30d'): ChartBar[] {
  return barsBySize(leagueRows(all, { period }, nowMs).map(toChartClose)).map((b) => ({ label: b.label, value: b.count, count: b.count }))
}
