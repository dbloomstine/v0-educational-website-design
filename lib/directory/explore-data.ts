/**
 * The explorer's read (2026-10-24): a trade's published cards plus the fields only the table uses (education, and the
 * columns migration 20261026_directory_fields.sql adds). Its own cache key, `directory-explore-v1`, tagged `directory`
 * like the rest, so a hide or an approved edit drops it too. Plain unstable_cache (never the shared site_cache table).
 *
 * Before that migration is applied the extra columns do not exist and Postgres refuses the select (42703): the read
 * then asks again without them, and the table shows what it has. Once the columns exist, the next hourly refresh picks
 * them up with no change here. Never throws: an empty list when the database cannot answer.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { CARD_COLUMNS, isPublic } from './people'
import { dedupePeople } from './quality'
import { DIRECTORY_TAG } from './data'
import { EXPLORE_EXTRA_COLUMNS, isMissingColumn, type ExploreSource } from './explore'
import type { CategoryId } from './taxonomy'

const PAGE = 1000
const MAX_ROWS = 20_000

async function readAll(category: CategoryId, columns: string): Promise<ExploreSource[]> {
  const db = getSupabaseAdmin()
  const out: ExploreSource[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await db.from('directory_people').select(columns).eq('category', category).eq('status', 'published').order('slug').range(from, from + PAGE - 1)
    if (error) throw Object.assign(new Error(error.message), { code: error.code })
    out.push(...((data ?? []) as unknown as ExploreSource[]))
    if (!data || data.length < PAGE) break
  }
  return out
}

async function readExplore(category: CategoryId): Promise<ExploreSource[]> {
  const base = `${CARD_COLUMNS}, education`
  try {
    return await readAll(category, `${base}, ${EXPLORE_EXTRA_COLUMNS.join(', ')}`)
  } catch (err) {
    if (!isMissingColumn(err as { code?: string; message?: string })) throw err
    return readAll(category, base)
  }
}

const cachedExplore = unstable_cache(readExplore, ['directory-explore-v1'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

/** A trade's public people with the explorer's fields, one row per person per firm. Never throws. */
export async function loadExplorePeople(category: CategoryId): Promise<ExploreSource[]> {
  try {
    return dedupePeople(await cachedExplore(category)).filter((p) => isPublic(p))
  } catch (err) {
    console.error('[directory] could not load the explorer:', err instanceof Error ? err.message : err)
    return []
  }
}
