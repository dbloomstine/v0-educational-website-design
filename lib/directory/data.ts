/**
 * Reading the directory for the public pages. Two cached reads, both on NEW
 * cache keys (nothing else on the site shares them):
 *
 *   - `directory-people-v1`: every published card in a category, a handful of
 *     short columns (a few thousand rows, read a thousand at a time). Every
 *     hub, landing page, filter and count is computed from it in memory, so a
 *     crawler walking a thousand landing pages costs one query an hour.
 *   - `directory-person-v1`: one whole profile, by slug.
 *
 * Tag `directory`: a hide, a removal request or an approved edit drops both
 * (revalidateTag). Plain unstable_cache, not buildOnce: the read is one small
 * indexed query, and buildOnce would write to the shared site_cache table.
 *
 * Never throws: before the migration (or when the database is down) a page
 * gets an empty list and shows its empty state, noindexed.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { CARD_COLUMNS, PERSON_COLUMNS, type Person, type PersonCard } from './people'
import type { CategoryId } from './taxonomy'

export const DIRECTORY_TAG = 'directory'
const PAGE = 1000
const MAX_ROWS = 20_000

async function readCards(category: CategoryId): Promise<PersonCard[]> {
  const db = getSupabaseAdmin()
  const out: PersonCard[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await db
      .from('directory_people')
      .select(CARD_COLUMNS)
      .eq('category', category)
      .eq('status', 'published')
      .order('slug')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as unknown as PersonCard[]))
    if (!data || data.length < PAGE) break
  }
  return out
}

const cachedCards = unstable_cache(readCards, ['directory-people-v1'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

export async function loadPeople(category: CategoryId): Promise<PersonCard[]> {
  try {
    return await cachedCards(category)
  } catch (err) {
    console.error('[directory] could not load people:', err instanceof Error ? err.message : err)
    return []
  }
}

async function readPerson(category: CategoryId, slug: string): Promise<Person | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('directory_people')
    .select(PERSON_COLUMNS)
    .eq('category', category)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as Person | null) ?? null
}

const cachedPerson = unstable_cache(readPerson, ['directory-person-v1'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

export async function loadPerson(category: CategoryId, slug: string): Promise<Person | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  try {
    return await cachedPerson(category, slug)
  } catch (err) {
    console.error('[directory] could not load a profile:', err instanceof Error ? err.message : err)
    return null
  }
}
