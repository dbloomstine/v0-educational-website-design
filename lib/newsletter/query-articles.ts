/**
 * Query high-value articles for the daily newsletter.
 *
 * Pipeline:
 *   1. Pull last 26h of classified articles
 *   2. Drop govt/NGO program announcements and blocked sources
 *   3. Same-day story dedup (shared helpers in lib/news/story-dedup)
 *   4. Cross-edition firm+fund fingerprint dedup (last 3 editions)
 *   5. Quality gate — drop articles with no firm/fund identity or
 *      placeholder "not disclosed" tldrs
 *   6. Minimum fund size filter for fund activity
 *   7. Split into sections, including dedicated LP Commitments
 *   8. Rank, cap, order
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isSameStory,
  normalizeFirmName,
  fundSizesMatch,
  titleJaccard,
  titlesShareSignificantNumber,
} from '@/lib/news/story-dedup'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

const FUND_ACTIVITY_TYPES = [
  'fund_launch', 'fund_close', 'capital_raise',
]

const PEOPLE_TYPES = [
  'executive_hire', 'executive_change', 'executive_departure',
]

const DEALS_TYPES = [
  'acquisition', 'merger',
]

const REGULATORY_TYPES = [
  'regulatory_action',
]

const ALL_NEWSLETTER_TYPES = [
  ...FUND_ACTIVITY_TYPES,
  ...PEOPLE_TYPES,
  ...DEALS_TYPES,
  ...REGULATORY_TYPES,
]

const CATEGORY_ORDER = [
  'PE', 'VC', 'credit', 'hedge', 'real_estate',
  'infrastructure', 'secondaries', 'gp_stakes',
]

const CATEGORY_LABELS: Record<string, string> = {
  PE: 'Private Equity',
  VC: 'Venture Capital',
  credit: 'Credit',
  hedge: 'Hedge Funds',
  real_estate: 'Real Estate',
  infrastructure: 'Infrastructure',
  secondaries: 'Secondaries',
  gp_stakes: 'GP Stakes',
  lp_commitments: 'LP Commitments',
  service_providers: 'Service Providers',
  people_moves: 'People Moves',
  deals: 'Deals',
  regulatory: 'Regulatory',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  fund_launch: 'Launch',
  fund_close: 'Close',
  capital_raise: 'Raise',
  executive_hire: 'Hire',
  executive_change: 'Exec Move',
  executive_departure: 'Departure',
  acquisition: 'M&A',
  merger: 'M&A',
  regulatory_action: 'Reg',
}

/**
 * Minimum fund size in USD millions to include in newsletter (filters noise).
 *
 * Lowered from 25 to 10 in 2026-08. Debut and emerging-manager vehicles
 * routinely land in the $10–25M band and the old floor silently deleted every
 * one of them — a 30-day audit found 7 qualifying fund events dropped here and
 * zero sub-$25M stories ever published.
 */
const MIN_FUND_SIZE_MILLIONS = 10

/**
 * The Emerging Managers section was removed 2026-08-15 on reader feedback.
 * It was a pure size split (any fund event ≤ $250M), which routinely filed
 * multi-billion-AUM firms' smaller vehicles — Mirae Asset's $135M first
 * close, an LP's RFP — under "Emerging Managers". Small fund events now
 * stay in their asset-class section, sorted by size like everything else.
 */

/**
 * Cap on stories from a single firm per edition. Without it one firm's news
 * cycle can occupy several slots — KKR appeared 15 times across 10 editions in
 * the 30-day audit — crowding out the smaller managers above.
 */
const MAX_ARTICLES_PER_FIRM = 2

/** Look back this many recent editions for cross-day firm-level dedup. */
const CROSS_EDITION_LOOKBACK = 3

/**
 * Extended lookback for fund-activity events, which are one-time happenings
 * that should never reappear. A 2026-06 review caught Conifer Infrastructure's
 * $900M close running on 6/18 and again 9 editions later as the 6/27 subject
 * line — well beyond the 3-edition window.
 */
const EXTENDED_CLOSE_LOOKBACK = 14

/**
 * Event types treated as one underlying "a fund raised money" event for
 * extended-window suppression.
 *
 * capital_raise is included deliberately. Outlets describe a single raise
 * inconsistently — one writes "closes $4.75B fund" (fund_close), another
 * "raises $4.75B" (capital_raise) — and the classifier faithfully mirrors
 * whichever verb it sees. Keying on the raw event type therefore let the same
 * raise through twice. Real case, 2026-07: HarbourVest's $4.75B co-investment
 * vehicle ran on 7/11 as a fund_close and again on 7/16 as a capital_raise.
 */
const EXTENDED_FINGERPRINT_TYPES = new Set(['fund_close', 'fund_launch', 'capital_raise'])

/**
 * Relative tolerance for matching a candidate against a fund event already
 * published in the extended window.
 *
 * This replaced a $500M-bucketed hash key, which failed on exactly the case it
 * existed to catch. Bucket edges are absolute, so the same HarbourVest vehicle
 * reported as "$4.75 billion" (→ $5,000M band) and later as "tops $4B" (→
 * $4,000M band) hashed to different keys and evaded suppression, even though
 * the figures are 16% apart and obviously the same raise.
 *
 * A relative comparison has no edges. 25% is wide enough to absorb rounding,
 * currency drift and vague restatement, and still narrow enough to preserve
 * the distinction the buckets were protecting: a $400M first close and a $900M
 * final close of the same fund are 55% apart and stay separate stories.
 */
const EXTENDED_SIZE_TOLERANCE = 0.25

/**
 * Source tier ranking for picking the best article per story.
 * Lower number = higher priority. Matched case-insensitively.
 */
const SOURCE_TIER_RAW: Record<string, number> = {
  'Bloomberg.com': 1, WSJ: 1, Reuters: 2,
  'Financial Times': 2, 'Pensions & Investments': 3,
  PitchBook: 3, Buyouts: 3, 'Buyouts Insider': 3,
  'PE Hub': 4, 'Institutional Investor': 4,
  TechCrunch: 5, 'TechCrunch VC': 5, 'Venture Capital Journal': 5,
  'Private Equity International': 5, 'Private Equity International | PEI': 5,
  'Secondaries Investor': 5, 'Infrastructure Investor': 5,
  'Private Debt Investor': 5, PERE: 5, 'Private Equity Wire': 5,
  'Hedge Week': 6, 'Alternative Credit Investor': 6,
  AltAssets: 7, 'AltAssets Private Equity News': 7,
  'Commercial Observer': 8, 'ESG Today': 8,
  'Business Wire': 10, 'PR Newswire': 10, 'PR Newswire Financial': 10,
  'Alternatives Watch': 10, "Crain's Chicago Business": 10,
  'The Business Journals': 12,
  'Yahoo Finance': 15, MSN: 15,
  'Digital Journal': 20, citybiz: 20, 'Pulse 2.0': 20,
  'The Tech Buzz': 25, 'HedgeCo.Net': 25,
  'news.google.com': 30,
  'mexc.co': 40, 'The Manila Times': 40, 'National Today': 40, 'USA Today': 30,
}

const SOURCE_TIER: Record<string, number> = Object.fromEntries(
  Object.entries(SOURCE_TIER_RAW).map(([k, v]) => [k.toLowerCase(), v])
)

function sourceTier(name: string | null | undefined): number {
  if (!name) return 50
  return SOURCE_TIER[name.toLowerCase()] ?? 50
}

/** Sources dropped outright — social platforms, low-quality aggregators. */
const BLOCKED_SOURCES = new Set<string>([
  'facebook.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'youtube.com',
  't.me',
])

/** Title patterns that indicate government / NGO / municipal programs. */
const GOVT_PROGRAM_PATTERNS = [
  /\bkementerian\b/i,
  /\bministry of\b/i,
  /\bfederation of (canadian|american|european) municipalit/i,
  /\bwelcomes launch of\b/i,
  /\bmunicipal fund\b/i,
  /\bpublic[- ]private partnership fund\b/i,
  /\bbuild communities strong\b/i,
  /\beuropean investment bank\b.*\bprogramme\b/i,
]

/**
 * Startup funding-round patterns. Classifier rule 2 says Series A/B/C and
 * venture rounds are portfolio-company news, not fund activity — but Haiku
 * misses the big ones ("Databricks Closes $5 Billion Round at $190 Billion"
 * ran as a Venture Capital move on 2026-08-16). Belt-and-suspenders filter:
 * a fund-activity story with no extracted fund name whose title reads like a
 * company round is dropped. Real fund events name a fund or say "fund".
 */
const STARTUP_ROUND_PATTERNS = [
  /\bseries [a-k]\b/i,
  /\b(seed|pre-seed) (round|funding)\b/i,
  /\bfundraising round\b/i,
  /\bfunding round\b/i,
  /\bround (at|led by|values)\b/i,
  /\b(closes?|raises?|secures?|lands) \$[\d.,]+\s?(billion|million|bn|mn|[bm])?\s?(round|in funding)\b/i,
]

export function isStartupRound(article: NewsletterArticle): boolean {
  if (!FUND_ACTIVITY_TYPES.includes(article.eventType ?? '')) return false
  if (article.fundName) return false
  if (/\bfund\b/i.test(article.title)) return false
  return STARTUP_ROUND_PATTERNS.some((p) => p.test(article.title))
}

/** Placeholder tldr markers — stories with no real information. */
const PLACEHOLDER_TLDR_PATTERNS = [
  /not (detailed|disclosed|specified|publicly|available)/i,
  /not provided/i,
  /amounts? not disclosed/i,
  /no (fund )?size .* specified/i,
]

/** LP name patterns for pension/institutional allocators. */
const LP_NAME_PATTERNS = [
  /\bteachers?\b/i,
  /\bemployees?\b/i,
  /\bpension\b/i,
  /\bretirement\b/i,
  /\bendowment\b/i,
  /\bsovereign wealth\b/i,
  /\bfire\s*(and|&)?\s*police\b/i,
  /\buniversity of\b/i,
  /\bfoundation\b/i,
  /\b(county|city|state) of [a-z]/i,
  /\bSERS\b/,
  /\bPERS\b/,
  /\bCERS\b/,
  /\bSTRS\b/,
  /\bSJCERA\b/i,
  /\bCalPERS\b/i,
  /\bCalSTRS\b/i,
  /\bTRS\b/,
  /\bLGPS\b/i,
  // Compound pension acronyms, where the system code is welded onto a state or
  // city prefix: NYSTRS, OPERS, MOSERS, LACERS. Every bare pattern above misses
  // these — there is no word boundary inside "NYSTRS" — so they were read as GP
  // fund activity instead of LP allocations. Observed 2026-08-08: "NYSTRS sets
  // private debt pacing for 2027" landed in Private Equity carrying a $1.3B
  // pill and ran as the subject line, presenting an LP pacing plan as a close.
  //
  // Case-sensitive on purpose: a case-insensitive version would match ordinary
  // words ending in these letters ("developers", "helpers"), and every real
  // pension acronym is upper-case.
  /\b[A-Z]{1,8}(?:STRS|SERS|PERS|CERS)\b/,
  /\bMass ?PRIM\b/i,
]

/**
 * Service-provider detection for the dedicated Service Providers section
 * (added 2026-08-15 on reader feedback — law firms, fund admins, auditors,
 * valuation shops, fund finance and prime brokerage are core audience but
 * had no home; a King & Spalding fund-finance team hire ran with no
 * category at all).
 *
 * Two signals, either is enough:
 *   1. The classifier tagged fund_categories: ['service_provider']
 *      (added to the prompt the same day — only future articles carry it).
 *   2. Title or firm name matches provider patterns / a known-provider list
 *      (covers the existing backlog until reclassification).
 */
const SERVICE_PROVIDER_TITLE_PATTERNS = [
  /\blaw firms?\b/i,
  /\b(fund formation|funds? (counsel|lawyers?|attorneys?))\b/i,
  /\bfund (administration|administrators?|admin)\b/i,
  /\bfund financ(e|ing)\b/i,
  /\b(subscription (line|credit)|NAV (loan|lending|facility))\b/i,
  /\bprime broker(age|s)?\b/i,
  /\b(custodian|custody|depositary|transfer agent)\b/i,
  /\b(fund )?(audit(or|ors)?|assurance) (firm|practice|team)\b/i,
  /\bvaluation (firm|services|practice|advisory)\b/i,
  /\bplacement agent\b/i,
  /\bfund tech(nology)?\b/i,
]

const KNOWN_SERVICE_PROVIDERS = [
  // Law
  'kirkland & ellis', 'latham & watkins', 'proskauer', 'ropes & gray',
  'debevoise', 'simpson thacher', 'skadden', 'paul weiss', 'paul hastings',
  'goodwin', 'dechert', 'willkie', 'akin gump', 'schulte roth',
  'morgan lewis', 'gibson dunn', 'cleary gottlieb', 'king & spalding',
  'fried frank', 'sidley austin', 'clifford chance', 'linklaters',
  'travers smith', 'macfarlanes', 'maples group', 'walkers', 'ogier',
  'carey olsen', 'mourant', 'appleby',
  // Fund admin / services
  'citco', 'ss&c', 'apex group', 'alter domus', 'gen ii', 'iq-eq',
  'jtc group', 'csc global', 'ocorian', 'waystone', 'aztec group',
  'northern trust', 'state street', 'bny mellon', 'sei investments',
  'standish management', 'ultimus', 'juniper square', 'carta',
  // Valuation / accounting / consulting
  'kroll', 'houlihan lokey', 'lincoln international', 'stout',
  'eisneramper', 'rsm us', 'grant thornton', 'bdo', 'cohen & company',
  'deloitte', 'kpmg', 'ernst & young', 'pwc', 'pricewaterhousecoopers',
  'aca group', 'accelex', 'mercer', 'cambridge associates', 'albourne',
]

function isServiceProvider(article: NewsletterArticle): boolean {
  if (article.fundCategories.includes('service_provider')) return true
  if (SERVICE_PROVIDER_TITLE_PATTERNS.some((p) => p.test(article.title))) return true
  const firm = (article.firmName ?? '').toLowerCase()
  if (firm && KNOWN_SERVICE_PROVIDERS.some((p) => firm.includes(p))) return true
  return false
}

export interface NewsletterArticle {
  id: string
  title: string
  sourceUrl: string
  sourceName: string | null
  publishedDate: string | null
  articleType: string | null
  eventType: string | null
  fundCategories: string[]
  isHighSignal: boolean
  relevanceScore: number | null
  tldr: string | null
  firmName: string | null
  firmDomain: string | null
  fundName: string | null
  fundSizeUsdMillions: number | null
  fundStrategy: string | null
  geography: string[]
  personName: string | null
  personTitle: string | null
  closeType: string | null
  /**
   * Other firms involved in the story (co-managers, acquirer/target,
   * JV partners) from entity extraction — high-confidence firm entities
   * distinct from firmName. Drives the multi-favicon rendering.
   */
  coFirms: string[]
  /** Other sources that also covered this story (populated by story dedup) */
  alsoCoveredBy: string[]
}

export interface ArticleGroup {
  category: string
  label: string
  articles: NewsletterArticle[]
}

export interface NewsletterContent {
  groups: ArticleGroup[]
  totalArticles: number
  articleIds: string[]
}

export function isLpCommitment(article: NewsletterArticle): boolean {
  if (article.eventType !== 'capital_raise') return false
  // Primary path: firm_name is the LP (e.g. "Arkansas Teacher Retirement System")
  if (article.firmName && LP_NAME_PATTERNS.some((p) => p.test(article.firmName!))) {
    return true
  }
  // Fallback: Claude sometimes extracts the underlying GP as firm_name on
  // stories like "Arkansas Teacher commits $200M to Ares Credit Fund". If
  // an LP pattern appears in the title, treat it as an LP commitment.
  if (LP_NAME_PATTERNS.some((p) => p.test(article.title))) {
    return true
  }
  return false
}

function isGovtProgram(article: NewsletterArticle): boolean {
  const src = article.sourceName?.toLowerCase() ?? ''
  if (BLOCKED_SOURCES.has(src)) return true
  return GOVT_PROGRAM_PATTERNS.some((p) => p.test(article.title))
}

/**
 * Quality gate: drop articles with no identifiable entity or real info.
 * - No firm AND no fund → unknown issuer
 * - Placeholder tldr AND no fund size → no real information
 */
function passesQualityGate(article: NewsletterArticle): boolean {
  if (!article.firmName && !article.fundName) return false
  if (!article.fundSizeUsdMillions && article.tldr) {
    if (PLACEHOLDER_TLDR_PATTERNS.some((p) => p.test(article.tldr!))) {
      return false
    }
  }
  return true
}

/** Pick primary fund category, skipping 'other' when possible. */
function primaryCategoryFor(article: NewsletterArticle): string {
  for (const cat of article.fundCategories) {
    if (cat && cat !== 'other') return cat
  }
  return article.fundCategories[0] ?? 'other'
}

export async function queryNewsletterArticles(
  supabase: DbClient,
  hoursBack: number = 26,
  opts: { excludePriorEdition?: boolean } = {}
): Promise<NewsletterContent> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

  // ─── Fetch prior editions' article IDs + firm/fund fingerprints ────────
  const priorExclusions = opts.excludePriorEdition === false
    ? {
        ids: new Set<string>(),
        fingerprints: new Set<string>(),
        priorEvents: [] as PriorFundEvent[],
        priorTitles: [] as PriorTitle[],
        priorPeople: new Set<string>(),
      }
    : await getPriorEditionExclusions(supabase)

  const { data: rows, error } = await supabase
    .from('news_items')
    .select('id, title, source_url, source_name, published_date, article_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data, event_type')
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', since)
    .or('is_high_signal.eq.true,relevance_score.gte.0.3')
    .in('article_type', ALL_NEWSLETTER_TYPES)
    .order('published_date', { ascending: false })
    .limit(500)

  if (error) {
    throw new Error(`Failed to query articles: ${error.message}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (rows ?? []).filter((row: any) => !priorExclusions.ids.has(row.id))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: NewsletterArticle[] = filtered.map((row: any) => {
    const extractedData = row.extracted_data as Record<string, unknown> | null
    const entitiesRaw = row.entities_raw as Array<{ name: string; type: string; role: string | null; confidence?: number }> | null
    // Entity fallback for a missing firm_name requires high confidence — a
    // 0.6-confidence "related entity" once put "Siri" (Apple's assistant,
    // mentioned in passing) on a story as the firm, paired with the news
    // outlet's favicon.
    const firmEntity = entitiesRaw?.find(
      (e) => e.type === 'firm' && (e.confidence ?? 0) >= 0.8
    )
    const firmName = (extractedData?.firm_name as string) ?? firmEntity?.name ?? null
    const fundSizeMillions = extractedData?.fund_size_usd_millions as number | null

    // Additional high-confidence firms beyond the primary — co-managers,
    // acquirer/target pairs, JV partners. Cap at 2 extras. Any token overlap
    // with the primary firm means it's almost certainly the same org under a
    // variant name ("Korea's National Pension Service" vs "Korea's NPS",
    // "Goldman Sachs" vs "Goldman Sachs Alternatives") — skip those.
    const primaryNorm = normalizeFirmName(firmName)
    const primaryTokens = new Set(primaryNorm.split(' '))
    const coFirms: string[] = []
    for (const e of entitiesRaw ?? []) {
      if (e.type !== 'firm' || (e.confidence ?? 0) < 0.8) continue
      const norm = normalizeFirmName(e.name)
      if (!norm || norm === primaryNorm) continue
      if (norm.split(' ').some((t) => primaryTokens.has(t))) continue
      if (coFirms.some((c) => normalizeFirmName(c) === norm)) continue
      coFirms.push(e.name)
      if (coFirms.length >= 2) break
    }

    return {
      id: row.id,
      // Some feeds (HedgeCo) end headlines with a dangling colon — trim it.
      title: (row.title as string).replace(/\s*:\s*$/, ''),
      sourceUrl: row.source_url,
      sourceName: row.source_name,
      publishedDate: row.published_date,
      articleType: row.article_type,
      eventType: row.event_type ?? row.article_type,
      fundCategories: row.fund_categories ?? [],
      isHighSignal: row.is_high_signal,
      relevanceScore: row.relevance_score,
      tldr: row.tldr,
      firmName,
      firmDomain: (extractedData?.firm_domain as string) ?? null,
      fundName: (extractedData?.fund_name as string) ?? null,
      fundSizeUsdMillions: fundSizeMillions,
      fundStrategy: (extractedData?.fund_strategy as string) ?? null,
      geography: (extractedData?.geography as string[]) ?? [],
      personName: (extractedData?.person_name as string) ?? null,
      personTitle: (extractedData?.person_title as string) ?? null,
      closeType: (extractedData?.close_type as string) ?? null,
      coFirms,
      alsoCoveredBy: [],
    }
  })

  // ─── Drop govt/NGO announcements, blocked sources, startup rounds ──────
  const afterGovtFilter = articles.filter(
    (a) => !isGovtProgram(a) && !isStartupRound(a)
  )

  // ─── Same-day story dedup ──────────────────────────────────────────────
  const deduped = deduplicateByStory(afterGovtFilter)

  // ─── Cross-edition fingerprint dedup ───────────────────────────────────
  const afterCrossDay = deduped.filter((a) => {
    // Extended window: same firm, same-sized fund event within ~25%.
    if (
      matchesPriorFundEvent(
        priorFundEvent(a.firmName, a.eventType, a.fundSizeUsdMillions),
        priorExclusions.priorEvents
      )
    ) {
      return false
    }
    // Title memory: catches re-reports that carry no size or fund name and
    // therefore evade every fingerprint. Real case, 2026-07-31→08-01: "CVC
    // aims for Q3 close for 6th secondaries fund" ran twice on consecutive
    // days because the second copy had null size and null fund name.
    if (matchesPriorTitle(a.title, a.firmName, priorExclusions.priorTitles)) {
      return false
    }
    // Person memory: an exec move re-reported next day with a different firm
    // extraction ("Blackstone" vs "BCRED") shares no firm fingerprint, but
    // the person is the same. 2026-07-27→28: Jonathan Bock ran twice.
    if (a.personName && PEOPLE_TYPES.includes(a.eventType ?? '')) {
      const person = normalizeFirmName(a.personName)
      if (person && priorExclusions.priorPeople.has(person)) return false
    }
    // Recent window: exact fingerprint keys.
    const fps = storyFingerprints(a.firmName, a.fundName, a.eventType, a.fundSizeUsdMillions)
    if (fps.length === 0) return true
    return !fps.some((fp) => priorExclusions.fingerprints.has(fp))
  })

  // ─── Quality gate ──────────────────────────────────────────────────────
  const gated = afterCrossDay.filter(passesQualityGate)

  // ─── Minimum fund size filter for fund activity ────────────────────────
  const sizeFiltered = gated.filter((a) => {
    const isFundActivity = FUND_ACTIVITY_TYPES.includes(a.eventType ?? '')
    if (!isFundActivity) return true
    if (a.fundSizeUsdMillions == null) return true
    return a.fundSizeUsdMillions >= MIN_FUND_SIZE_MILLIONS
  })

  // ─── Per-firm cap ──────────────────────────────────────────────────────
  // Applied before sectioning so a single firm's news cycle can't consume
  // slots across several sections at once.
  const firmCapped = capPerFirm(sizeFiltered)

  // ─── Split into sections ───────────────────────────────────────────────
  // Service providers first — a Kirkland fund-formation team move belongs in
  // Service Providers, not People Moves, regardless of its event type.
  const serviceProviders = firmCapped.filter(isServiceProvider)
  const spIds = new Set(serviceProviders.map((a) => a.id))
  const nonSp = firmCapped.filter((a) => !spIds.has(a.id))

  const lpCommitments = nonSp.filter(isLpCommitment)
  const lpIds = new Set(lpCommitments.map((a) => a.id))
  const fundActivity = nonSp.filter(
    (a) => FUND_ACTIVITY_TYPES.includes(a.eventType ?? '') && !lpIds.has(a.id)
  )
  const peopleMoves = nonSp.filter((a) => PEOPLE_TYPES.includes(a.eventType ?? ''))
  const deals = nonSp.filter((a) => DEALS_TYPES.includes(a.eventType ?? ''))
  const regulatory = nonSp.filter((a) => REGULATORY_TYPES.includes(a.eventType ?? ''))

  const sortByPriority = (arr: NewsletterArticle[]) =>
    [...arr].sort((a, b) => articlePriorityScore(b) - articlePriorityScore(a))

  const cappedFundActivity = sortByPriority(fundActivity).slice(0, 36)
  const cappedLp = sortByPriority(lpCommitments).slice(0, 6)
  const cappedSp = sortByPriority(serviceProviders).slice(0, 6)
  const cappedPeople = sortByPriority(peopleMoves).slice(0, 6)
  const cappedDeals = sortByPriority(deals).slice(0, 8)
  const cappedRegulatory = sortByPriority(regulatory).slice(0, 3)

  // Group fund activity by primary category
  const grouped: Record<string, NewsletterArticle[]> = {}
  for (const article of cappedFundActivity) {
    const primaryCat = primaryCategoryFor(article)
    if (!grouped[primaryCat]) grouped[primaryCat] = []
    grouped[primaryCat].push(article)
  }

  // Secondaries stands as its own section, consistent with every other
  // asset class. (It was previously rolled into PE whenever it had <2
  // stories on a given day; a 2026-06 review found that quietly hid the
  // category even on days it had supply, so the rollup was removed.)
  // Suppress "other" entirely — classification orphans that pass the
  // quality gate should be reclassified upstream, not leaked to readers.
  delete grouped.other

  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => (b.fundSizeUsdMillions ?? 0) - (a.fundSizeUsdMillions ?? 0))
  }

  const groups: ArticleGroup[] = CATEGORY_ORDER
    .filter((cat) => grouped[cat]?.length > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      articles: grouped[cat],
    }))

  if (cappedLp.length > 0) {
    groups.push({
      category: 'lp_commitments',
      label: CATEGORY_LABELS.lp_commitments,
      articles: cappedLp,
    })
  }

  if (cappedSp.length > 0) {
    groups.push({
      category: 'service_providers',
      label: CATEGORY_LABELS.service_providers,
      articles: cappedSp,
    })
  }

  if (cappedPeople.length > 0) {
    groups.push({
      category: 'people_moves',
      label: CATEGORY_LABELS.people_moves,
      articles: cappedPeople,
    })
  }

  if (cappedDeals.length > 0) {
    groups.push({
      category: 'deals',
      label: CATEGORY_LABELS.deals,
      articles: cappedDeals,
    })
  }

  if (cappedRegulatory.length > 0) {
    groups.push({
      category: 'regulatory',
      label: CATEGORY_LABELS.regulatory,
      articles: cappedRegulatory,
    })
  }

  deduplicateAcrossSections(groups)

  const includedIds = new Set<string>()
  for (const g of groups) {
    for (const a of g.articles) includedIds.add(a.id)
  }

  return {
    groups,
    totalArticles: includedIds.size,
    articleIds: Array.from(includedIds),
  }
}

// ─── Per-firm cap ───────────────────────────────────────────────────────────

/**
 * Keep at most MAX_ARTICLES_PER_FIRM stories per firm, highest priority first.
 *
 * These are distinct stories that survived dedup, so this is an editorial
 * choice rather than a correctness fix: on a day when one firm does four
 * newsworthy things, the brief covers its two biggest and gives the rest of
 * the space to other managers. Articles with no extractable firm are never
 * capped — they'd all collide on the empty key.
 */
export function capPerFirm(articles: NewsletterArticle[]): NewsletterArticle[] {
  const ranked = [...articles].sort(
    (a, b) => articlePriorityScore(b) - articlePriorityScore(a)
  )
  const seen = new Map<string, number>()
  const kept: NewsletterArticle[] = []

  for (const article of ranked) {
    const firm = normalizeFirmName(article.firmName)
    if (!firm) {
      kept.push(article)
      continue
    }
    const count = seen.get(firm) ?? 0
    if (count >= MAX_ARTICLES_PER_FIRM) continue
    seen.set(firm, count + 1)
    kept.push(article)
  }

  return kept
}

// ─── Cross-section dedup ────────────────────────────────────────────────────

/**
 * Cross-section dedup pass. Runs AFTER sectioning to catch the rare
 * case where classifier variance put the same story into two different
 * section groups. Example: 2026-04-18 sovereign-funds consortium
 * ("Sovereign funds from China, Indonesia, Azerbaijan team up to
 * launch $1B PE fund" classified as Private Equity with firm "China
 * Sovereign Fund", and "Wealth funds of China, Indonesia, Azerbaijan
 * launch $1b PE platform" classified as LP Commitments with firm
 * "China State Pension Fund" — completely different firm extractions
 * so isSameStory correctly refused to merge them within the same-day
 * pre-section dedup).
 *
 * Uses a deliberately looser matcher than isSameStory: fund sizes
 * within 10% AND title Jaccard >= 0.4. Cross-section collisions are
 * rare in practice (most classifier noise clusters within one section),
 * so the broader matcher's false-positive blast radius is small.
 *
 * Keeps the article in the earlier group (fund_activity > lp_commitments
 * > people_moves > deals > regulatory, matching the order of pushes
 * above) and drops the later. alsoCoveredBy is carried over so the
 * reader still sees the duplicate source attribution.
 */
export function deduplicateAcrossSections(groups: ArticleGroup[]): void {
  for (let i = 0; i < groups.length; i++) {
    const keepers = groups[i].articles
    for (let j = i + 1; j < groups.length; j++) {
      const droppers = groups[j].articles
      const toRemove = new Set<string>()

      for (const k of keepers) {
        for (const d of droppers) {
          if (k.id === d.id) continue
          if (toRemove.has(d.id)) continue
          if (!fundSizesMatch(k.fundSizeUsdMillions, d.fundSizeUsdMillions)) continue
          if (titleJaccard(k.title, d.title) < 0.4) continue

          const merged = new Set(k.alsoCoveredBy)
          if (d.sourceName && d.sourceName !== k.sourceName) merged.add(d.sourceName)
          for (const src of d.alsoCoveredBy) {
            if (src !== k.sourceName) merged.add(src)
          }
          k.alsoCoveredBy = Array.from(merged)
          toRemove.add(d.id)
        }
      }

      if (toRemove.size > 0) {
        groups[j].articles = droppers.filter((d) => !toRemove.has(d.id))
      }
    }
  }
}

// ─── Story-level dedup (same day) ───────────────────────────────────────────

function deduplicateByStory(articles: NewsletterArticle[]): NewsletterArticle[] {
  const stories: NewsletterArticle[][] = []

  for (const article of articles) {
    let matched = false
    for (const story of stories) {
      // Compare against every member, not just the representative — story
      // identity is not transitive through one member. Real case, 2026-08-15:
      // nine outlets covered one Mirae first close; the ₹1,800cr-target
      // variant matched the ₹1,125cr variant but not the cluster's $118M
      // representative, so it escaped as a ninth "distinct" story.
      if (story.some((member) => isSameStory(member, article))) {
        story.push(article)
        matched = true
        break
      }
    }
    if (!matched) {
      stories.push([article])
    }
  }

  return stories.map((group) => {
    group.sort((a, b) => {
      const tierA = sourceTier(a.sourceName)
      const tierB = sourceTier(b.sourceName)
      if (tierA !== tierB) return tierA - tierB
      return (b.tldr?.length ?? 0) - (a.tldr?.length ?? 0)
    })

    const best = group[0]
    const otherSources = Array.from(new Set(
      group.slice(1)
        .map((a) => a.sourceName)
        .filter((name): name is string => !!name && name !== best.sourceName)
    ))
    best.alsoCoveredBy = otherSources

    const maxSize = Math.max(...group.map((a) => a.fundSizeUsdMillions ?? 0))
    if (maxSize > 0 && (best.fundSizeUsdMillions ?? 0) === 0) {
      best.fundSizeUsdMillions = maxSize
    }

    const bestTldr = group
      .map((a) => a.tldr)
      .filter((t): t is string => !!t)
      .sort((a, b) => b.length - a.length)[0]
    if (bestTldr && bestTldr.length > (best.tldr?.length ?? 0)) {
      best.tldr = bestTldr
    }

    // Promote a non-null firm name from other versions if the best one is missing it.
    if (!best.firmName) {
      const alt = group.find((a) => a.firmName)
      if (alt) best.firmName = alt.firmName
    }

    return best
  })
}

// ─── Cross-edition fingerprint dedup ────────────────────────────────────────

/**
 * Fingerprints used to suppress cross-day repeats. Returns 1-2 keys per
 * article — the dedup filter rejects the new article if ANY key matches
 * any article from the CROSS_EDITION_LOOKBACK window.
 *
 * Emitted keys, by what the article carries:
 *   - fund name + size  →  [`firm|fund`, `firm|event|size-bucket`]
 *   - fund name only    →  [`firm|fund`]
 *   - size only         →  [`firm|event|size-bucket`]
 *   - neither           →  [`firm|event`]  (exec moves, regulatory)
 *
 * Size is bucketed into $500M bands so currency drift and rounding
 * don't break the match. The old single-key version lost Adams Street
 * on 4/14→4/15 because one edition's fingerprint was
 * `adams street|private credit iii` and the other was
 * `adams street|fund_close`; the size-bucketed key gives both sides a
 * common `adams street|fund_close|7500` to collide on.
 */
export function storyFingerprints(
  firmName: string | null,
  fundName: string | null,
  eventType: string | null,
  fundSizeUsdMillions: number | null
): string[] {
  const firm = normalizeFirmName(firmName)
  if (!firm) return []
  const fund = normalizeFirmName(fundName)
  const evt = eventType ?? ''
  const out: string[] = []
  if (fund) out.push(`${firm}|${fund}`)
  if (fundSizeUsdMillions && fundSizeUsdMillions > 0) {
    const bucket = Math.round(fundSizeUsdMillions / 500) * 500
    out.push(`${firm}|${evt}|${bucket}`)
  } else if (!fund) {
    out.push(`${firm}|${evt}`)
  }
  return out
}

/** A fund-activity event already published in the extended lookback window. */
export interface PriorFundEvent {
  firm: string
  sizeMillions: number
}

/**
 * Build the extended-window record for one article, or null if it can't
 * participate (no firm, no usable size, or not a fund-activity event).
 */
export function priorFundEvent(
  firmName: string | null,
  eventType: string | null,
  fundSizeUsdMillions: number | null
): PriorFundEvent | null {
  if (!EXTENDED_FINGERPRINT_TYPES.has(eventType ?? '')) return null
  const firm = normalizeFirmName(firmName)
  if (!firm) return null
  if (!fundSizeUsdMillions || fundSizeUsdMillions <= 0) return null
  return { firm, sizeMillions: fundSizeUsdMillions }
}

/**
 * True when a candidate repeats a fund event already published in the extended
 * window — same firm, and a size within EXTENDED_SIZE_TOLERANCE.
 *
 * Event type is intentionally not compared: close/launch/raise are the same
 * underlying event wearing different verbs (see EXTENDED_FINGERPRINT_TYPES).
 */
export function matchesPriorFundEvent(
  candidate: PriorFundEvent | null,
  priorEvents: PriorFundEvent[]
): boolean {
  if (!candidate) return false
  return priorEvents.some(
    (prior) =>
      prior.firm === candidate.firm &&
      fundSizesMatch(prior.sizeMillions, candidate.sizeMillions, EXTENDED_SIZE_TOLERANCE)
  )
}

/** A title published in the recent-edition window, with its normalized firm. */
export interface PriorTitle {
  firm: string
  title: string
}

/**
 * True when a candidate headline repeats a story already published in the
 * recent-edition window. Three tiers:
 *   1. Near-verbatim title (Jaccard ≥ 0.85), any firm.
 *   2. Same firm + similar title (Jaccard ≥ 0.55) — null-size re-reports.
 *   3. Shared significant headline figure + moderate similarity (≥ 0.3) +
 *      a firm-name link: either the same normalized firm (Mirae's first
 *      close ran three straight days, 8/14-8/16, while size drift beat
 *      every tolerance but every headline cited ₹1,800 crore), or the
 *      candidate's firm named in the prior headline ("EMERGING, Promethean
 *      eye $300m…" re-ran as "Promethean, Emerging Launch $300M…" under a
 *      different extracted firm).
 */
export function matchesPriorTitle(
  candidateTitle: string,
  candidateFirmName: string | null,
  priorTitles: PriorTitle[]
): boolean {
  const candFirm = normalizeFirmName(candidateFirmName)
  const candFirmTokens = candFirm.split(' ').filter((t) => t.length > 2)
  for (const prior of priorTitles) {
    const sim = titleJaccard(candidateTitle, prior.title)
    if (sim >= 0.85) return true
    if (candFirm && prior.firm === candFirm && sim >= 0.55) return true
    if (sim >= 0.3 && titlesShareSignificantNumber(candidateTitle, prior.title)) {
      if (candFirm && prior.firm === candFirm) return true
      const priorTitleLower = prior.title.toLowerCase()
      if (candFirmTokens.some((t) => priorTitleLower.includes(t))) return true
    }
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFingerprintFields(row: any): {
  firmName: string | null
  fundName: string | null
  fundSize: number | null
  eventType: string | null
  personName: string | null
} {
  const extractedData = row.extracted_data as Record<string, unknown> | null
  const entitiesRaw = row.entities_raw as Array<{ name: string; type: string }> | null
  const firmEntity = entitiesRaw?.find((e) => e.type === 'firm')
  const firmName = (extractedData?.firm_name as string) ?? firmEntity?.name ?? null
  const fundName = (extractedData?.fund_name as string) ?? null
  const fundSize = (extractedData?.fund_size_usd_millions as number | null) ?? null
  const eventType = row.event_type ?? row.article_type ?? null
  const personName = (extractedData?.person_name as string) ?? null
  return { firmName, fundName, fundSize, eventType, personName }
}

async function getPriorEditionExclusions(
  supabase: DbClient
): Promise<{
  ids: Set<string>
  fingerprints: Set<string>
  priorEvents: PriorFundEvent[]
  priorTitles: PriorTitle[]
  priorPeople: Set<string>
}> {
  // Pull the extended window once (newest first). The most recent
  // CROSS_EDITION_LOOKBACK editions contribute full fingerprints + the
  // exact-id exclusion; the older editions in the window contribute only the
  // strong close/launch fingerprint (see EXTENDED_CLOSE_LOOKBACK).
  const { data: editions } = await supabase
    .from('newsletter_editions')
    .select('article_ids')
    .eq('status', 'sent')
    .order('edition_date', { ascending: false })
    .limit(EXTENDED_CLOSE_LOOKBACK)

  const recentIds = new Set<string>()
  const extendedIds = new Set<string>()
  if (editions) {
    editions.forEach((ed, idx) => {
      const arr = (ed as { article_ids: string[] | null }).article_ids
      if (!arr) return
      const target = idx < CROSS_EDITION_LOOKBACK ? recentIds : extendedIds
      for (const id of arr) target.add(id)
    })
  }

  // Exact-id exclusion stays scoped to the recent window — an article that ran
  // days ago won't re-enter the 26h query anyway, and the extended window is
  // meant to soft-suppress by size, not hard-block by id.
  const ids = recentIds
  const fingerprints = new Set<string>()

  // Recent window: full fingerprints, titles, and people for every article.
  const priorTitles: PriorTitle[] = []
  const priorPeople = new Set<string>()
  const recentList = Array.from(recentIds)
  for (let i = 0; i < recentList.length; i += 200) {
    const chunk = recentList.slice(i, i + 200)
    const { data: rowsData } = await supabase
      .from('news_items')
      .select('title, article_type, event_type, extracted_data, entities_raw')
      .in('id', chunk)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (rowsData ?? []) as any[]) {
      const { firmName, fundName, fundSize, eventType, personName } = extractFingerprintFields(row)
      for (const fp of storyFingerprints(firmName, fundName, eventType, fundSize)) {
        fingerprints.add(fp)
      }
      if (row.title) {
        priorTitles.push({ firm: normalizeFirmName(firmName), title: row.title as string })
      }
      if (personName && PEOPLE_TYPES.includes(eventType ?? '')) {
        const person = normalizeFirmName(personName)
        if (person) priorPeople.add(person)
      }
    }
  }

  // Extended window: fund-activity events, compared by relative size rather
  // than a hashed bucket (see EXTENDED_SIZE_TOLERANCE). Every article in the
  // window contributes, including those in the recent slice — a repeat two
  // editions later should be caught by size as well as by exact id.
  const allWindowIds = Array.from(new Set([...recentIds, ...extendedIds]))
  const priorEvents: PriorFundEvent[] = []
  for (let i = 0; i < allWindowIds.length; i += 200) {
    const chunk = allWindowIds.slice(i, i + 200)
    const { data: rowsData } = await supabase
      .from('news_items')
      .select('article_type, event_type, extracted_data, entities_raw')
      .in('id', chunk)
      .in('article_type', Array.from(EXTENDED_FINGERPRINT_TYPES))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (rowsData ?? []) as any[]) {
      const { firmName, fundSize, eventType } = extractFingerprintFields(row)
      const evt = priorFundEvent(firmName, eventType, fundSize)
      if (evt) priorEvents.push(evt)
    }
  }

  return { ids, fingerprints, priorEvents, priorTitles, priorPeople }
}

// ─── Article priority scoring for cap ───────────────────────────────────────

function articlePriorityScore(a: NewsletterArticle): number {
  let score = a.relevanceScore ?? 0
  if (FUND_ACTIVITY_TYPES.includes(a.eventType ?? '')) {
    score += 0.3
    if (a.fundSizeUsdMillions) {
      score += Math.min(0.3, Math.log10(a.fundSizeUsdMillions / 100 + 1) * 0.15)
    }
  }
  if (a.isHighSignal) score += 0.2
  return score
}

export function getEventTypeLabel(type: string | null): string {
  if (!type) return ''
  return EVENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ')
}

export function formatFundSize(millions: number | null): string {
  if (!millions) return ''
  if (millions >= 1000) return `$${(millions / 1000).toFixed(1).replace(/\.0$/, '')}B`
  return `$${millions}M`
}

/**
 * Single-fund sizes above $30B are extremely rare and always named.
 * Any candidate above this without a fund_name is almost certainly firm
 * AUM leaking into fund_size_usd_millions from the classifier — real
 * incidents: 4/10 "Ares Management Corp $623B" exec-hire leak,
 * 4/9 "Lemssouguer Fund $20B" career-profile leak, 4/18 "Nest
 * $81B" private-credit-mandate leak (£60bn AUM misattributed).
 *
 * Used as a sanity rail in both buildSubject (kills AUM-leak headlines)
 * and the row-pill renderer (kills AUM-leak pills in story rows).
 */
export const FUND_SIZE_SANITY_CEILING_MILLIONS = 30000

export function isLikelyAumLeak(
  sizeMillions: number | null | undefined,
  fundName: string | null | undefined
): boolean {
  if (!sizeMillions) return false
  return sizeMillions > FUND_SIZE_SANITY_CEILING_MILLIONS && !fundName
}
