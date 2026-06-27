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

/** Minimum fund size in USD millions to include in newsletter (filters noise). */
const MIN_FUND_SIZE_MILLIONS = 25

/** Look back this many recent editions for cross-day firm-level dedup. */
const CROSS_EDITION_LOOKBACK = 3

/**
 * Extended lookback applied ONLY to fund closes/launches, which are one-time
 * events that should never reappear. A 2026-06 review caught Conifer
 * Infrastructure's $900M close running on 6/18 and again 9 editions later as
 * the 6/27 subject line — well beyond the 3-edition window. For these event
 * types we suppress on the *size-bucketed* fingerprint only (firm|event|size),
 * so a genuinely distinct event at a different size — e.g. a $400M first close
 * followed weeks later by a $900M final close of the same fund — is NOT
 * collapsed. The bare firm|fund key is intentionally left to the 3-edition
 * window so legitimate follow-on news isn't lost.
 */
const EXTENDED_CLOSE_LOOKBACK = 14

const EXTENDED_FINGERPRINT_TYPES = new Set(['fund_close', 'fund_launch'])

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
  /\bSJCERA\b/i,
  /\bCalPERS\b/i,
  /\bCalSTRS\b/i,
  /\bTRS\b/,
  /\bLGPS\b/i,
]

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

function isLpCommitment(article: NewsletterArticle): boolean {
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
    ? { ids: new Set<string>(), fingerprints: new Set<string>() }
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
    const entitiesRaw = row.entities_raw as Array<{ name: string; type: string; role: string | null }> | null
    const firmEntity = entitiesRaw?.find((e) => e.type === 'firm')
    const firmName = (extractedData?.firm_name as string) ?? firmEntity?.name ?? null
    const fundSizeMillions = extractedData?.fund_size_usd_millions as number | null

    return {
      id: row.id,
      title: row.title,
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
      alsoCoveredBy: [],
    }
  })

  // ─── Drop govt/NGO announcements and blocked sources ───────────────────
  const afterGovtFilter = articles.filter((a) => !isGovtProgram(a))

  // ─── Same-day story dedup ──────────────────────────────────────────────
  const deduped = deduplicateByStory(afterGovtFilter)

  // ─── Cross-edition fingerprint dedup ───────────────────────────────────
  const afterCrossDay = deduped.filter((a) => {
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

  // ─── Split into sections ───────────────────────────────────────────────
  const lpCommitments = sizeFiltered.filter(isLpCommitment)
  const lpIds = new Set(lpCommitments.map((a) => a.id))
  const fundActivity = sizeFiltered.filter(
    (a) => FUND_ACTIVITY_TYPES.includes(a.eventType ?? '') && !lpIds.has(a.id)
  )
  const peopleMoves = sizeFiltered.filter((a) => PEOPLE_TYPES.includes(a.eventType ?? ''))
  const deals = sizeFiltered.filter((a) => DEALS_TYPES.includes(a.eventType ?? ''))
  const regulatory = sizeFiltered.filter((a) => REGULATORY_TYPES.includes(a.eventType ?? ''))

  const sortByPriority = (arr: NewsletterArticle[]) =>
    [...arr].sort((a, b) => articlePriorityScore(b) - articlePriorityScore(a))

  const cappedFundActivity = sortByPriority(fundActivity).slice(0, 30)
  const cappedLp = sortByPriority(lpCommitments).slice(0, 6)
  const cappedPeople = sortByPriority(peopleMoves).slice(0, 5)
  const cappedDeals = sortByPriority(deals).slice(0, 5)
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
      if (isSameStory(story[0], article)) {
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

/**
 * The single "strong" fingerprint used for the EXTENDED_CLOSE_LOOKBACK window:
 * `firm|event|size-bucket`. Matches the size-bucketed key that storyFingerprints
 * emits, so a new fund close collides with the same firm/event/size from up to
 * 14 editions ago (the Conifer repeat) — but a different size does not (a $400M
 * first close vs a $900M final close stay distinct). Returns null when there's
 * no firm or no usable size, in which case the recent 3-edition window still
 * applies via storyFingerprints.
 */
export function closeEventFingerprint(
  firmName: string | null,
  eventType: string | null,
  fundSizeUsdMillions: number | null
): string | null {
  const firm = normalizeFirmName(firmName)
  if (!firm) return null
  if (!fundSizeUsdMillions || fundSizeUsdMillions <= 0) return null
  const bucket = Math.round(fundSizeUsdMillions / 500) * 500
  return `${firm}|${eventType ?? ''}|${bucket}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFingerprintFields(row: any): {
  firmName: string | null
  fundName: string | null
  fundSize: number | null
  eventType: string | null
} {
  const extractedData = row.extracted_data as Record<string, unknown> | null
  const entitiesRaw = row.entities_raw as Array<{ name: string; type: string }> | null
  const firmEntity = entitiesRaw?.find((e) => e.type === 'firm')
  const firmName = (extractedData?.firm_name as string) ?? firmEntity?.name ?? null
  const fundName = (extractedData?.fund_name as string) ?? null
  const fundSize = (extractedData?.fund_size_usd_millions as number | null) ?? null
  const eventType = row.event_type ?? row.article_type ?? null
  return { firmName, fundName, fundSize, eventType }
}

async function getPriorEditionExclusions(
  supabase: DbClient
): Promise<{ ids: Set<string>; fingerprints: Set<string> }> {
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

  // Recent window: full fingerprints for every article.
  const recentList = Array.from(recentIds)
  for (let i = 0; i < recentList.length; i += 200) {
    const chunk = recentList.slice(i, i + 200)
    const { data: rowsData } = await supabase
      .from('news_items')
      .select('title, article_type, event_type, extracted_data, entities_raw')
      .in('id', chunk)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (rowsData ?? []) as any[]) {
      const { firmName, fundName, fundSize, eventType } = extractFingerprintFields(row)
      for (const fp of storyFingerprints(firmName, fundName, eventType, fundSize)) {
        fingerprints.add(fp)
      }
    }
  }

  // Extended window: only fund closes/launches, only the strong size key.
  const extendedOnly = Array.from(extendedIds).filter((id) => !recentIds.has(id))
  for (let i = 0; i < extendedOnly.length; i += 200) {
    const chunk = extendedOnly.slice(i, i + 200)
    const { data: rowsData } = await supabase
      .from('news_items')
      .select('article_type, event_type, extracted_data, entities_raw')
      .in('id', chunk)
      .in('article_type', Array.from(EXTENDED_FINGERPRINT_TYPES))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (rowsData ?? []) as any[]) {
      const { firmName, fundSize, eventType } = extractFingerprintFields(row)
      const fp = closeEventFingerprint(firmName, eventType, fundSize)
      if (fp) fingerprints.add(fp)
    }
  }

  return { ids, fingerprints }
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
