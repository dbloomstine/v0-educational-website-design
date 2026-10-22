/**
 * The firm behind each republished row, for rows read without their
 * description (2026-10-22; lib/news/source-credit.ts says why).
 *
 * The story pages read up to twelve thousand rows at a time, and the
 * description is the one long column; reading it for all of them would
 * double what each read carries. Instead the page reads `author` (short), and
 * only for JD Supra rows from before 2026-10-22, which have no author, this
 * reads their descriptions by primary key, a hundred at a time. A failure is
 * logged and those rows keep the plain outlet name, as before.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isRepublisher, sourceCredit } from './source-credit'

type CreditRow = { id: string; source_name?: string | null; author?: string | null; description?: string | null; source_credit?: string | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withSourceCredits<T extends CreditRow>(rows: T[], db?: SupabaseClient<any, any>): Promise<T[]> {
  const need = rows.filter((r) => isRepublisher(r.source_name) && !r.author && r.description === undefined)
  const descriptions = new Map<string, string | null>()
  for (let i = 0; i < need.length; i += 100) {
    const { data, error } = await (db ?? getSupabaseAdmin())
      .from('news_items')
      .select('id, description')
      .in('id', need.slice(i, i + 100).map((r) => r.id))
    if (error) {
      console.error('[source-credit] descriptions unavailable:', error.message)
      break
    }
    for (const d of (data ?? []) as { id: string; description: string | null }[]) descriptions.set(d.id, d.description)
  }
  for (const r of rows) {
    if (!isRepublisher(r.source_name)) continue
    r.source_credit = sourceCredit({
      sourceName: r.source_name,
      author: r.author,
      description: r.description ?? descriptions.get(r.id) ?? null,
    })
  }
  return rows
}
