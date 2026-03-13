import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

const FUND_RELEVANT_TYPES = [
  'fund_launch', 'fund_close', 'capital_raise',
  'executive_hire', 'executive_change', 'executive_departure',
  'acquisition', 'merger', 'regulatory_action', 'legal_alert',
]

const CATEGORY_ORDER = ['PE', 'VC', 'credit', 'hedge', 'real_estate', 'infrastructure', 'secondaries', 'gp_stakes']

export async function GET(req: Request) {
  const url = new URL(req.url)
  const password = url.searchParams.get('password')

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end date params required' }, { status: 400 })
  }

  // Query high-value articles in date range
  const { data: rows, error } = await getSupabaseAdmin()
    .from('news_items')
    .select('id, title, source_url, source_name, published_date, article_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data, event_type')
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', start)
    .lte('published_date', end)
    .or(`is_high_signal.eq.true,relevance_score.gte.0.5`)
    .in('article_type', FUND_RELEVANT_TYPES)
    .order('published_date', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles = (rows ?? []).map((row: any) => {
    const extractedData = row.extracted_data as Record<string, unknown> | null
    const entitiesRaw = row.entities_raw as Array<{ name: string; type: string; role: string | null }> | null

    // Extract firm name from entities
    const firmEntity = entitiesRaw?.find((e) => e.type === 'firm')
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
      firmName: firmEntity?.name ?? null,
      fundSizeUsdMillions: fundSizeMillions,
    }
  })

  // Group by primary category
  const grouped: Record<string, typeof articles> = {}
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
  const orderedGroups = CATEGORY_ORDER
    .filter((cat) => grouped[cat]?.length > 0)
    .map((cat) => ({ category: cat, articles: grouped[cat] }))

  // Add any categories not in the order
  for (const cat of Object.keys(grouped)) {
    if (!CATEGORY_ORDER.includes(cat)) {
      orderedGroups.push({ category: cat, articles: grouped[cat] })
    }
  }

  return NextResponse.json({
    dateRange: { start, end },
    totalArticles: articles.length,
    groups: orderedGroups,
  })
}
