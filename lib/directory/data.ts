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
 *   - `directory-person-any-v1`: one whole profile by slug alone (slugs are
 *     unique across the five trades), for the claim and request forms.
 *   - `directory-summary-v2` (v2 2026-10-24 night: each firm's directory slug): the index page's counts and top pages, and the
 *     firms with people listed (for the cross-link on /firm/<slug>), built
 *     from the per-trade lists above. Small, so a firm page reads it for free.
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
import { CARD_COLUMNS, PERSON_COLUMNS, isPublic, type Person, type PersonCard } from './people'
import { LIVE_CATEGORIES, type CategoryId } from './taxonomy'
import { summarize, type DirectorySummary } from './summary'
import { dedupePeople } from './quality'

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

const cachedCards = unstable_cache(readCards, ['directory-people-v3'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

export async function loadPeople(category: CategoryId): Promise<PersonCard[]> {
  try {
    // One row per person per firm on every page (a firm's site listing someone twice is not two people).
    return dedupePeople(await cachedCards(category))
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

const cachedPerson = unstable_cache(readPerson, ['directory-person-v4'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

export async function loadPerson(category: CategoryId, slug: string): Promise<Person | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  try {
    return await cachedPerson(category, slug)
  } catch (err) {
    console.error('[directory] could not load a profile:', err instanceof Error ? err.message : err)
    return null
  }
}

async function readPersonAny(slug: string): Promise<Person | null> {
  const { data, error } = await getSupabaseAdmin().from('directory_people').select(PERSON_COLUMNS).eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as Person | null) ?? null
}

const cachedPersonAny = unstable_cache(readPersonAny, ['directory-person-any-v4'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

/** A published profile in any trade, by slug (slugs are unique across trades): the claim and request forms. */
export async function loadPersonBySlug(slug: string): Promise<Person | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  try {
    return await cachedPersonAny(slug)
  } catch (err) {
    console.error('[directory] could not load a profile:', err instanceof Error ? err.message : err)
    return null
  }
}

// ── Every trade at once (2026-10-24 night) ──────────────────────────────────
// The sitemap and the /directory summary need every trade. Five per-trade reads on a cold cache (during a build,
// say) were five queries racing a small instance; this is one read of the same short columns, on its own key.

async function readAllCards(): Promise<PersonCard[]> {
  const db = getSupabaseAdmin()
  const out: PersonCard[] = []
  for (let from = 0; from < MAX_ROWS * 3; from += PAGE) {
    const { data, error } = await db.from('directory_people').select(CARD_COLUMNS).eq('status', 'published').order('slug').range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as unknown as PersonCard[]))
    if (!data || data.length < PAGE) break
  }
  return out
}

const cachedAllCards = unstable_cache(readAllCards, ['directory-people-all-v3'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

/** Every live trade's public people, from one cached read. Never throws: an empty map when the database cannot answer. */
export async function loadAllPeople(): Promise<Map<CategoryId, PersonCard[]>> {
  const out = new Map<CategoryId, PersonCard[]>(LIVE_CATEGORIES.map((c) => [c.id, []]))
  try {
    for (const p of dedupePeople(await cachedAllCards())) if (isPublic(p)) out.get(p.category)?.push(p)
  } catch (err) {
    console.error('[directory] could not load everyone:', err instanceof Error ? err.message : err)
  }
  return out
}

async function buildSummary(): Promise<DirectorySummary> {
  return summarize(await loadAllPeople())
}

const cachedSummary = unstable_cache(buildSummary, ['directory-summary-v4'], { revalidate: 3600, tags: [DIRECTORY_TAG] })

const EMPTY: DirectorySummary = { categories: LIVE_CATEGORIES.map((c) => ({ id: c.id, count: 0, firms: 0, cities: [], topics: [] })), firms: [] }

/** The directory in numbers (the /directory page, the firm-page cross-link). Never throws. */
export async function loadDirectorySummary(): Promise<DirectorySummary> {
  try {
    return await cachedSummary()
  } catch (err) {
    console.error('[directory] could not build the summary:', err instanceof Error ? err.message : err)
    return EMPTY
  }
}
