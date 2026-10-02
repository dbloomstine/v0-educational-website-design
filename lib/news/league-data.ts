/**
 * Fetching and caching for the league tables (lib/news/league.ts is the logic).
 *
 * One query for every fund-close report since coverage began, one cached build
 * shared by the league page, the firm pages and the front-page chart. Never
 * throws: a database hiccup renders an empty table, not an error page.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { ALL_NEWSLETTER_TYPES } from '@/lib/newsletter/query-articles'
import { buildLeague, LEAGUE_CLOSE_TYPES, type FundClose, type LeagueOverride } from './league'

/**
 * The classifier and the feed set that produce reliable close data came on
 * line in March 2026; earlier rows are sparse. The table does not reach back
 * past this date, and the page says so.
 */
export const LEAGUE_SINCE = '2026-03-01'

export const LEAGUE_COLUMNS =
  'id, title, source_url, source_name, published_date, created_at, article_type, event_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchLeagueRows(): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = []
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await getSupabaseAdmin()
      .from('news_items')
      .select(LEAGUE_COLUMNS)
      .eq('classification_status', 'complete')
      .eq('is_duplicate', false)
      .gte('published_date', LEAGUE_SINCE)
      .or('is_high_signal.eq.true,relevance_score.gte.0.3')
      .in('article_type', ALL_NEWSLETTER_TYPES)
      .in('event_type', ['fund_close', 'capital_raise'])
      .in('extracted_data->>close_type', LEAGUE_CLOSE_TYPES)
      .order('published_date', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(`league query failed: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return rows
}

/** Corrections. The table may not exist in a fresh environment; that is not an error. */
export async function fetchLeagueOverrides(): Promise<LeagueOverride[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('league_overrides')
    .select('news_item_id, action, firm_name, fund_name, size_usd_millions, stage')
    .limit(2000)
  if (error) return []
  return (data ?? []) as LeagueOverride[]
}

async function computeLeague(): Promise<FundClose[]> {
  const [rows, overrides] = await Promise.all([fetchLeagueRows(), fetchLeagueOverrides()])
  return buildLeague(rows, overrides)
}

const getLeague = unstable_cache(computeLeague, ['league-v1'], { revalidate: 1800, tags: ['league'] })

export async function getLeagueSafe(): Promise<FundClose[]> {
  try {
    return await getLeague()
  } catch (err) {
    console.error('[league] fetch failed:', err)
    return []
  }
}
