/**
 * Which firms have a page worth a link — the set the news lists and story
 * pages check a firm's name against before linking it (2026-10-22, from the
 * SEO audit: 706 firm pages that no news list linked to).
 *
 * No query of its own. The set is computed from two datasets the site already
 * caches and shares — thirty days of stories and the league table — by the
 * rule the sitemap uses (lib/news/firms.ts firmPageSlugs). Asking the database
 * "does this firm have a page?" per row would be hundreds of trigram lookups a
 * page on a very small instance; see lib/news/firm-lookup.ts.
 *
 * Three layers, cheapest first:
 *   1. this server's own copy, for five minutes — a crawler building story
 *      pages one after another reads nothing at all;
 *   2. the data cache: the slugs alone (a thousand short strings), not the
 *      thirty days of stories they are computed from;
 *   3. on a miss, one server site-wide computes it (buildOnce, the same
 *      turnstile the stories and the league use) from the cached archive and
 *      league; everyone else takes its stored copy.
 */
import { unstable_cache } from 'next/cache'
import { buildOnce } from '@/lib/cache/build-once'
import { loadArchive } from './front-page'
import { loadLeague } from './league-data'
import { firmPageSlugs } from './firms'

// Bump the version if what the set means changes: a deploy must not read the previous rule's copy.
const KEY = 'firm-pages-v1'
const MEMO_MS = 5 * 60_000

const getFirmPageSlugs = unstable_cache(
  () =>
    buildOnce(KEY, async () => {
      const [archive, league] = await Promise.all([loadArchive(), loadLeague()])
      return firmPageSlugs(archive, league)
    }),
  [KEY],
  { revalidate: 900, tags: ['stories', 'league'] },
)

let memo: { at: number; pages: ReadonlySet<string> } | null = null

/**
 * The slugs of the firm pages a link may point to.
 *
 * Never throws. The links are an extra on pages that must render: when the set
 * cannot be had, the last copy is used, or none — the names are then plain
 * bold text, as they were before 2026-10-22, until the page is next rebuilt.
 */
export async function loadFirmPages(): Promise<ReadonlySet<string>> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.pages
  try {
    const pages = new Set(await getFirmPageSlugs())
    memo = { at: Date.now(), pages }
    return pages
  } catch (err) {
    console.error('[firm-pages] could not load the firm pages; names go unlinked:', err)
    return memo?.pages ?? new Set()
  }
}

/**
 * The same set, without waiting for it (2026-10-24 night, for directory profiles): this server's copy when it has
 * one, else whatever the load brings within `ms` (one second by default), else null and the page renders without
 * the link. The load carries on in the background either way, so the next page finds it warm. Never throws.
 */
export async function peekFirmPages(ms = 1000): Promise<ReadonlySet<string> | null> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.pages
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<null>((r) => {
    timer = setTimeout(() => r(null), ms)
  })
  try {
    return await Promise.race([loadFirmPages(), late])
  } finally {
    clearTimeout(timer)
  }
}
