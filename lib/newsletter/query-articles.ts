/**
 * Query high-value articles for the daily newsletter.
 *
 * Includes story-level dedup (pick best source per story),
 * prior-edition exclusion, minimum fund size filtering,
 * and a max article cap for curated output.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

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

/** Minimum fund size in USD millions to include in newsletter (filters noise like student funds) */
const MIN_FUND_SIZE_MILLIONS = 25

/**
 * Source tier ranking for picking the best article per story.
 * Lower number = higher priority. Sources not listed default to tier 50.
 */
const SOURCE_TIER: Record<string, number> = {
  'Bloomberg.com': 1, 'bloomberg.com': 1, 'WSJ': 1, 'Reuters': 2,
  'Financial Times': 2, 'Pensions & Investments': 3,
  'PitchBook': 3, 'Buyouts': 3, 'Buyouts Insider': 3,
  'PE Hub': 4, 'Institutional Investor': 4,
  'TechCrunch': 5, 'TechCrunch VC': 5, 'Venture Capital Journal': 5,
  'Private Equity International': 5, 'Private Equity International | PEI': 5,
  'Secondaries Investor': 5, 'Infrastructure Investor': 5,
  'Private Debt Investor': 5, 'PERE': 5, 'Private Equity Wire': 5,
  'Hedge Week': 6, 'Alternative Credit Investor': 6,
  'AltAssets': 7, 'AltAssets Private Equity News': 7,
  'Commercial Observer': 8, 'ESG Today': 8,
  'Business Wire': 10, 'PR Newswire': 10, 'PR Newswire Financial': 10,
  'Alternatives Watch': 10, 'Crain\'s Chicago Business': 10,
  'The Business Journals': 12,
  'Yahoo Finance': 15, 'MSN': 15, 'msn.com': 15,
  'Digital Journal': 20, 'citybiz': 20, 'Pulse 2.0': 20,
  'The Tech Buzz': 25, 'HedgeCo.Net': 25,
  'mexc.co': 40, 'The Manila Times': 40, 'National Today': 40, 'USA Today': 30,
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

export async function queryNewsletterArticles(
  supabase: DbClient,
  hoursBack: number = 26,
  opts: { excludePriorEdition?: boolean } = {}
): Promise<NewsletterContent> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

  // ─── Fetch prior edition's article IDs to exclude cross-day repeats ────
  const excludeIds = opts.excludePriorEdition === false
    ? new Set<string>()
    : await getPriorEditionArticleIds(supabase)

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
  const filtered = (rows ?? []).filter((row: any) => {
    return !excludeIds.has(row.id)
  })

  // Map to newsletter article shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles = filtered.map((row: any) => {
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

  // ─── Story-level dedup: group articles about the same story ────────────
  const deduped = deduplicateByStory(articles)

  // ─── Apply minimum fund size filter for fund activity articles ─────────
  const sizeFiltered = deduped.filter((a) => {
    // Only apply size filter to fund activity types, not exec moves
    const isFundActivity = ['fund_launch', 'fund_close', 'capital_raise'].includes(a.eventType ?? '')
    if (!isFundActivity) return true
    // Keep if no size info (don't penalize missing data)
    if (a.fundSizeUsdMillions == null) return true
    return a.fundSizeUsdMillions >= MIN_FUND_SIZE_MILLIONS
  })

  // ─── Split into sections and cap each independently ────────────────────
  const fundActivity = sizeFiltered.filter(a => FUND_ACTIVITY_TYPES.includes(a.eventType ?? ''))
  const peopleMoves = sizeFiltered.filter(a => PEOPLE_TYPES.includes(a.eventType ?? ''))
  const deals = sizeFiltered.filter(a => DEALS_TYPES.includes(a.eventType ?? ''))
  const regulatory = sizeFiltered.filter(a => REGULATORY_TYPES.includes(a.eventType ?? ''))

  // Rank and cap each section
  const sortByPriority = (arr: NewsletterArticle[]) =>
    [...arr].sort((a, b) => articlePriorityScore(b) - articlePriorityScore(a))

  const cappedFundActivity = sortByPriority(fundActivity).slice(0, 30)
  const cappedPeople = sortByPriority(peopleMoves).slice(0, 5)
  const cappedDeals = sortByPriority(deals).slice(0, 5)
  const cappedRegulatory = sortByPriority(regulatory).slice(0, 3)

  // Group fund activity by category (as before)
  const grouped: Record<string, NewsletterArticle[]> = {}
  for (const article of cappedFundActivity) {
    const primaryCat = article.fundCategories[0] ?? 'other'
    if (!grouped[primaryCat]) grouped[primaryCat] = []
    grouped[primaryCat].push(article)
  }

  // Sort each fund activity group by fund size desc
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => (b.fundSizeUsdMillions ?? 0) - (a.fundSizeUsdMillions ?? 0))
  }

  // Build ordered groups: fund categories first
  const groups: ArticleGroup[] = CATEGORY_ORDER
    .filter((cat) => grouped[cat]?.length > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      articles: grouped[cat],
    }))

  // Add remaining fund categories not in predefined order
  for (const cat of Object.keys(grouped)) {
    if (!CATEGORY_ORDER.includes(cat)) {
      groups.push({
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        articles: grouped[cat],
      })
    }
  }

  // Add People Moves section
  if (cappedPeople.length > 0) {
    groups.push({
      category: 'people_moves',
      label: 'People Moves',
      articles: cappedPeople,
    })
  }

  // Add Deals section
  if (cappedDeals.length > 0) {
    groups.push({
      category: 'deals',
      label: 'Deals',
      articles: cappedDeals,
    })
  }

  // Add Regulatory section
  if (cappedRegulatory.length > 0) {
    groups.push({
      category: 'regulatory',
      label: 'Regulatory',
      articles: cappedRegulatory,
    })
  }

  const allCapped = [...cappedFundActivity, ...cappedPeople, ...cappedDeals, ...cappedRegulatory]

  return {
    groups,
    totalArticles: allCapped.length,
    articleIds: allCapped.map((a) => a.id),
  }
}

// ─── Story-level dedup ──────────────────────────────────────────────────────

/**
 * Group articles that cover the same story and pick the best source.
 * Two articles are about the same story if they share the same firmName
 * AND have similar titles (normalized Jaccard similarity > 0.4) or
 * share the same fundName.
 */
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

  // For each story group, pick the best article and note other sources
  return stories.map((group) => {
    // Sort by source tier (lower = better), then by tldr length (more detail = better)
    group.sort((a, b) => {
      const tierA = SOURCE_TIER[a.sourceName ?? ''] ?? 50
      const tierB = SOURCE_TIER[b.sourceName ?? ''] ?? 50
      if (tierA !== tierB) return tierA - tierB
      return (b.tldr?.length ?? 0) - (a.tldr?.length ?? 0)
    })

    const best = group[0]
    // Collect other source names (deduped)
    const otherSources = Array.from(new Set(
      group.slice(1)
        .map((a) => a.sourceName)
        .filter((name): name is string => !!name && name !== best.sourceName)
    ))
    best.alsoCoveredBy = otherSources

    // Use the highest fund size found across all articles in the group
    const maxSize = Math.max(...group.map((a) => a.fundSizeUsdMillions ?? 0))
    if (maxSize > 0 && (best.fundSizeUsdMillions ?? 0) === 0) {
      best.fundSizeUsdMillions = maxSize
    }

    // Use the best tldr (longest, most detailed)
    const bestTldr = group
      .map((a) => a.tldr)
      .filter((t): t is string => !!t)
      .sort((a, b) => b.length - a.length)[0]
    if (bestTldr && bestTldr.length > (best.tldr?.length ?? 0)) {
      best.tldr = bestTldr
    }

    return best
  })
}

/**
 * Check if two articles are about the same underlying story.
 */
function isSameStory(a: NewsletterArticle, b: NewsletterArticle): boolean {
  // Must share a firm name (normalized)
  if (!a.firmName || !b.firmName) return false
  if (normalizeFirmName(a.firmName) !== normalizeFirmName(b.firmName)) return false

  // If both have a fund name and they match, it's the same story
  if (a.fundName && b.fundName) {
    if (normalizeFirmName(a.fundName) === normalizeFirmName(b.fundName)) return true
  }

  // If both have the same fund size, very likely the same story
  if (a.fundSizeUsdMillions && b.fundSizeUsdMillions &&
      a.fundSizeUsdMillions === b.fundSizeUsdMillions) {
    return true
  }

  // Fall back to title similarity
  return titleSimilarity(a.title, b.title) > 0.4
}

function normalizeFirmName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(llc|inc|corp|ltd|lp|group|partners|capital|management|investment|investments|advisors|advisory)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Jaccard similarity of word sets from two titles.
 */
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2))
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  let intersection = 0
  wordsA.forEach((w) => {
    if (wordsB.has(w)) intersection++
  })
  return intersection / (wordsA.size + wordsB.size - intersection)
}

// ─── Prior edition exclusion ────────────────────────────────────────────────

async function getPriorEditionArticleIds(supabase: DbClient): Promise<Set<string>> {
  const { data } = await supabase
    .from('newsletter_editions')
    .select('article_ids')
    .eq('status', 'sent')
    .order('edition_date', { ascending: false })
    .limit(1)
    .single()

  if (!data?.article_ids) return new Set()
  return new Set(data.article_ids as string[])
}

// ─── Article priority scoring for cap ───────────────────────────────────────

function articlePriorityScore(a: NewsletterArticle): number {
  let score = a.relevanceScore ?? 0

  // Boost fund activity with size
  if (['fund_launch', 'fund_close', 'capital_raise'].includes(a.eventType ?? '')) {
    score += 0.3
    if (a.fundSizeUsdMillions) {
      // Log scale bonus: $100M=0.1, $1B=0.2, $10B=0.3
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
