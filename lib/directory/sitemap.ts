/**
 * The directory's part of the sitemap (2026-10-24, the SEO audit): only pages that are indexed, each with a lastmod
 * from its people's newest read or edit (fetched_at, updated_at). Pure, so the counts are tested and the before/after
 * numbers can be replayed from a snapshot.
 *
 *   /directory and /directory/about     once anyone is listed
 *   /<trade>                            once the trade has people
 *   /<trade>/<topic>[/<place>]          lib/directory/landing.ts: exists and is not a near-copy of another page
 *   /<trade>/firms, /<trade>/firms/<x>  the index with two firm pages or more; a firm page from LANDING_MIN people
 *   /<trade>/people/<slug>              lib/directory/people.ts isIndexable
 */
import { DIRECTORY_ABOUT_PATH, DIRECTORY_PATH, type Category, type CategoryId } from './taxonomy'
import { LANDING_MIN, indexableLandings } from './landing'
import { firmPath, firmsIndexPath, firmsOf, firmsWithPages, peopleAtFirm } from './firms'
import { isIndexable, lastChanged, latest, profilePath, type PersonCard } from './people'

export interface DirectorySitemapEntry {
  path: string
  lastmod: string | null
  changeFrequency: 'weekly' | 'monthly'
  priority: number
}

export function directorySitemap(lists: ReadonlyMap<CategoryId, PersonCard[]>, categories: Category[], now = new Date()): DirectorySitemapEntry[] {
  const out: DirectorySitemapEntry[] = []
  for (const category of categories) {
    const people = lists.get(category.id) ?? []
    if (!people.length) continue
    out.push({ path: `/${category.slug}`, lastmod: lastChanged(people), changeFrequency: 'weekly', priority: 0.6 })
    for (const l of indexableLandings(category, people, now)) out.push({ path: l.path, lastmod: l.lastmod, changeFrequency: 'weekly', priority: 0.5 })
    const firms = firmsWithPages(firmsOf(people, category, now))
    if (firms.length >= 2) out.push({ path: firmsIndexPath(category), lastmod: lastChanged(people), changeFrequency: 'weekly', priority: 0.5 })
    for (const f of firms) {
      if (f.count < LANDING_MIN) continue
      out.push({ path: firmPath(category, f.slug), lastmod: lastChanged(peopleAtFirm(people, f.domain, now)), changeFrequency: 'weekly', priority: 0.5 })
    }
    for (const p of people) if (isIndexable(p, now)) out.push({ path: profilePath(p), lastmod: latest([p.fetched_at, p.updated_at]), changeFrequency: 'monthly', priority: 0.4 })
  }
  if (out.length) {
    const newest = latest(out.map((e) => e.lastmod))
    out.unshift(
      { path: DIRECTORY_PATH, lastmod: newest, changeFrequency: 'weekly', priority: 0.6 },
      { path: DIRECTORY_ABOUT_PATH, lastmod: newest, changeFrequency: 'monthly', priority: 0.4 },
    )
  }
  return out
}
