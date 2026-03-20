import { getSupabaseAdmin } from '@/lib/supabase/client'
import type { NewsArticle, FacetCounts, ArticleFeedResponse } from './types'

export interface QueryParams {
  q?: string
  range?: string
  category?: string
  type?: string
  fundSizeMin?: string
  fundSizeMax?: string
  offset?: number
  limit?: number
}

const RANGE_TO_DAYS: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export async function queryArticleFeed(params: QueryParams): Promise<ArticleFeedResponse> {
  const limit = Math.min(params.limit ?? 30, 100)
  const offset = params.offset ?? 0

  // Build date cutoff
  const days = RANGE_TO_DAYS[params.range ?? '7d'] ?? 7
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // --- Main articles query ---
  let query = getSupabaseAdmin()
    .from('news_items')
    .select('id, title, source_url, source_name, published_date, article_type, fund_categories, is_high_signal, relevance_score, tldr, extracted_data, event_type')
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .neq('title', '')
    .not('title', 'is', null)
    .gte('published_date', cutoff.split('T')[0])
    .order('updated_at', { ascending: false })
    .order('relevance_score', { ascending: false })
    .range(offset, offset + limit)

  // Category filter (fund_categories is a text[] column)
  if (params.category) {
    const cats = params.category.split(',')
    query = query.overlaps('fund_categories', cats)
  }

  // Article type filter — when no type is explicitly selected,
  // hide "other" (irrelevant noise) and require minimum relevance
  if (params.type) {
    const types = params.type.split(',')
    // Include legacy "merger" articles when filtering by "acquisition"
    if (types.includes('acquisition') && !types.includes('merger')) {
      types.push('merger')
    }
    query = query.in('article_type', types)
  } else {
    query = query.neq('article_type', 'other')
    query = query.gte('relevance_score', 0.4)
  }

  // Text search
  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  // Fund size filters (extracted_data->fund_size_usd_millions is in millions)
  if (params.fundSizeMin) {
    const minMillions = Number(params.fundSizeMin) / 1_000_000
    query = query.gte('extracted_data->>fund_size_usd_millions', minMillions)
  }
  if (params.fundSizeMax) {
    const maxMillions = Number(params.fundSizeMax) / 1_000_000
    query = query.lte('extracted_data->>fund_size_usd_millions', maxMillions)
  }

  const { data: rows, error } = await query

  if (error) {
    console.error('Supabase query error:', error)
    throw new Error('Failed to query articles')
  }

  // Supabase .range() is inclusive on both ends, so we get limit+1 rows.
  // If we got the full range, there are likely more results.
  const allRows = (rows ?? []).map(mapRowToArticle)
  const articles = allRows.slice(0, limit)
  const hasMore = allRows.length > limit

  // --- Facet counts query ---
  const facets = await queryFacets(cutoff.split('T')[0])

  return {
    articles,
    facets,
    hasMore,
    offset,
    limit,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToArticle(row: any): NewsArticle {
  const extractedData = row.extracted_data as Record<string, unknown> | null
  const fundSizeMillions = extractedData?.fund_size_usd_millions as number | null

  return {
    id: row.id,
    title: row.title || row.tldr || 'Untitled article',
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    publishedDate: row.published_date,
    articleType: row.article_type,
    fundCategories: row.fund_categories ?? [],
    isHighSignal: row.is_high_signal ?? false,
    relevanceScore: row.relevance_score,
    tldr: row.tldr,
    fundSizeUsd: fundSizeMillions ? fundSizeMillions * 1_000_000 : null,
    eventType: row.event_type ?? row.article_type,
    firmName: (extractedData?.firm_name as string) ?? null,
    fundName: (extractedData?.fund_name as string) ?? null,
    fundStrategy: (extractedData?.fund_strategy as string) ?? null,
    geography: (extractedData?.geography as string[]) ?? [],
    personName: (extractedData?.person_name as string) ?? null,
    personTitle: (extractedData?.person_title as string) ?? null,
    firmDomain: (extractedData?.firm_domain as string) ?? null,
  }
}

async function queryFacets(dateCutoff: string): Promise<FacetCounts> {
  // Get fund-relevant articles in range for facet counting (exclude noise)
  const { data: facetRows } = await getSupabaseAdmin()
    .from('news_items')
    .select('fund_categories, article_type, is_high_signal')
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', dateCutoff)
    .neq('article_type', 'other')
    .gte('relevance_score', 0.4)

  const categories: Record<string, number> = {}
  const types: Record<string, number> = {}
  let signalCount = 0

  for (const row of facetRows ?? []) {
    // Count categories
    const cats = (row.fund_categories as string[]) ?? []
    for (const cat of cats) {
      categories[cat] = (categories[cat] ?? 0) + 1
    }

    // Count types
    const t = row.article_type as string
    if (t) {
      types[t] = (types[t] ?? 0) + 1
    }

    if (row.is_high_signal) signalCount++
  }

  return {
    categories,
    types,
    signalCount,
    totalInRange: facetRows?.length ?? 0,
  }
}
