/**
 * Query high-value articles for the daily newsletter.
 *
 * Extracted from /api/admin/newsletter-prep to be reusable
 * by both the prep endpoint and the automated daily send.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

const FUND_RELEVANT_TYPES = [
  'fund_launch', 'fund_close', 'capital_raise',
  'executive_hire', 'executive_change', 'executive_departure',
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
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  fund_launch: 'Launch',
  fund_close: 'Close',
  capital_raise: 'Raise',
  executive_hire: 'Hire',
  executive_change: 'Exec Move',
  executive_departure: 'Departure',
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
  fundName: string | null
  fundSizeUsdMillions: number | null
  fundStrategy: string | null
  geography: string[]
  personName: string | null
  personTitle: string | null
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

const ALLOWED_GEO = ['North America', 'Global']

export async function queryNewsletterArticles(
  supabase: DbClient,
  hoursBack: number = 26
): Promise<NewsletterContent> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await supabase
    .from('news_items')
    .select('id, title, source_url, source_name, published_date, article_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data, event_type')
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', since)
    .or('is_high_signal.eq.true,relevance_score.gte.0.5')
    .in('article_type', FUND_RELEVANT_TYPES)
    .order('published_date', { ascending: false })
    .limit(500)

  if (error) {
    throw new Error(`Failed to query articles: ${error.message}`)
  }

  // Filter to North America / Global / unknown geography
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (rows ?? []).filter((row: any) => {
    const geo = (row.extracted_data as Record<string, unknown> | null)?.geography as string[] | null
    if (!geo || geo.length === 0) return true
    return geo.some((g) => ALLOWED_GEO.includes(g))
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
      fundName: (extractedData?.fund_name as string) ?? null,
      fundSizeUsdMillions: fundSizeMillions,
      fundStrategy: (extractedData?.fund_strategy as string) ?? null,
      geography: (extractedData?.geography as string[]) ?? [],
      personName: (extractedData?.person_name as string) ?? null,
      personTitle: (extractedData?.person_title as string) ?? null,
    }
  })

  // Group by primary category
  const grouped: Record<string, NewsletterArticle[]> = {}
  for (const article of articles) {
    const primaryCat = article.fundCategories[0] ?? 'other'
    if (!grouped[primaryCat]) grouped[primaryCat] = []
    grouped[primaryCat].push(article)
  }

  // Sort each group by fund size desc (nulls last)
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => (b.fundSizeUsdMillions ?? 0) - (a.fundSizeUsdMillions ?? 0))
  }

  // Order categories
  const groups: ArticleGroup[] = CATEGORY_ORDER
    .filter((cat) => grouped[cat]?.length > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      articles: grouped[cat],
    }))

  // Add any categories not in the predefined order
  for (const cat of Object.keys(grouped)) {
    if (!CATEGORY_ORDER.includes(cat)) {
      groups.push({
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        articles: grouped[cat],
      })
    }
  }

  return {
    groups,
    totalArticles: articles.length,
    articleIds: articles.map((a) => a.id),
  }
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
