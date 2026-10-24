import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isLikelyHuman, normalizeMissQuery, requestTraits } from '@/lib/directory/views'
import { CATEGORIES, categoryBySlug, directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST { trade, q }: a directory search that found nobody (plan B9), from the hub's browser. Counted per
 * day, trade and normalised query (directory_search_misses); a query that could be an address or a phone
 * number is dropped (lib/directory/views.ts normalizeMissQuery). Always 204.
 */
export async function POST(req: Request) {
  const done = new Response(null, { status: 204 })
  if (!directoryEnabled()) return done
  let body: { trade?: unknown; q?: unknown }
  try {
    body = (JSON.parse(await req.text()) ?? {}) as { trade?: unknown; q?: unknown }
  } catch {
    return done
  }
  const t = requestTraits(req.headers)
  if (t.prefetch || (t.fetchSite && t.fetchSite !== 'same-origin') || !isLikelyHuman(t.userAgent)) return done
  const trade = typeof body.trade === 'string' ? (categoryBySlug(body.trade) ?? CATEGORIES[body.trade as keyof typeof CATEGORIES]) : undefined
  const q = normalizeMissQuery(body.q)
  if (!trade?.live || !q) return done
  const { error } = await getSupabaseAdmin().rpc('directory_log_search_miss', { p_category: trade.id, p_query: q })
  if (error) console.error('[directory] search miss not logged:', error.code, error.message)
  return done
}
