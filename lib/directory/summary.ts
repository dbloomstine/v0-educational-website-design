/**
 * The directory in numbers (2026-10-24 night): what the /directory index and
 * the firm pages' cross-link need, computed once from the per-trade lists and
 * cached small (lib/directory/data.ts loadDirectorySummary). Pure, so tested.
 */
import { allLandings } from './landing'
import { firmTally, type PersonCard } from './people'
import { firmSlug, firmsOf } from './firms'
import { CATEGORIES, LIVE_CATEGORIES, type CategoryId } from './taxonomy'

export interface SummaryLink {
  path: string
  title: string
  count: number
}

export interface CategorySummary {
  id: CategoryId
  /** Public people. */
  count: number
  firms: number
  /** The biggest city pages that exist (five people or more), biggest first. */
  cities: SummaryLink[]
  /** The biggest practice and client pages that exist. */
  topics: SummaryLink[]
}

/** A firm with people listed in one trade: matched to a /firm/<slug> page by name where the page is built. */
export interface SummaryFirm {
  name: string
  domain: string
  category: CategoryId
  count: number
  /** Its page in the directory: /<trade>/firms/<slug> (lib/directory/firms.ts). */
  slug: string
}

export interface DirectorySummary {
  categories: CategorySummary[]
  firms: SummaryFirm[]
}

export const SUMMARY_TOP = 6

/** `lists`: each live trade's public people. */
export function summarize(lists: ReadonlyMap<CategoryId, PersonCard[]>, now = new Date(), top = SUMMARY_TOP): DirectorySummary {
  const categories: CategorySummary[] = []
  const firms: SummaryFirm[] = []
  for (const c of LIVE_CATEGORIES) {
    const people = lists.get(c.id) ?? []
    const landings = allLandings(CATEGORIES[c.id], people, now)
    const link = (l: (typeof landings)[number]): SummaryLink => ({ path: l.path, title: l.title, count: l.count })
    const tally = firmTally(people)
    categories.push({
      id: c.id,
      count: people.length,
      firms: tally.length,
      cities: landings.filter((l) => !l.topic && l.place?.kind === 'city').slice(0, top).map(link),
      topics: landings.filter((l) => l.topic && !l.place).slice(0, top).map(link),
    })
    const slugs = new Map(firmsOf(people, CATEGORIES[c.id], now).map((f) => [f.domain, f.slug]))
    for (const t of tally) firms.push({ name: t.label, domain: t.key, category: c.id, count: t.count, slug: slugs.get(t.key.toLowerCase()) ?? firmSlug(t.label) })
  }
  return { categories, firms }
}

export interface FirmDirectoryLink {
  category: CategoryId
  href: string
  label: string
  count: number
}

/**
 * A firm page's cross-link (/firm/<slug>): its people in each trade, found by
 * matching each listed firm's name to a firm page the way story rows are
 * matched (`hrefOf`, lib/news/firms.ts firmPageHref). Biggest first.
 */
export function firmDirectoryLinks(summary: DirectorySummary, firmPath: string, hrefOf: (name: string) => string | null): FirmDirectoryLink[] {
  const byCat = new Map<CategoryId, FirmDirectoryLink>()
  for (const f of summary.firms) {
    if (hrefOf(f.name) !== firmPath) continue
    const c = CATEGORIES[f.category]
    const prev = byCat.get(f.category)
    // Two domains for one firm page (rare): link the bigger list; the count is what the link shows.
    if (prev && prev.count >= f.count) continue
    byCat.set(f.category, { category: f.category, href: `/${c.slug}?firm=${encodeURIComponent(f.domain)}`, label: c.plural, count: f.count })
  }
  return [...byCat.values()].sort((a, b) => b.count - a.count)
}
