import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Crumbs, EmptyDirectory } from '@/components/directory/parts'
import { ViewToggle } from '@/components/directory/ViewToggle'
import { Explorer } from '@/components/directory/explore/Explorer'
import { loadExplorePeople } from '@/lib/directory/explore-data'
import { FACET_KEYS, emptyQuery, exploreCounts, fieldsPresent, parseExplore, runExplore, toExploreRow, type FacetKey, type FacetValue } from '@/lib/directory/explore'
import { exploreIndexUrl } from '@/lib/directory/explore-index'
import { firmsOf } from '@/lib/directory/firms'
import { rowFirms } from '@/lib/directory/rows'
import { DIRECTORY_PATH, directoryEnabled, type Category } from '@/lib/directory/taxonomy'
import { brandedTitle } from '@/lib/seo'

// /<trade>/explore (2026-10-24): the trade's people as a table to filter and sort
// (components/directory/explore/Explorer.tsx). A tool, not a page of its own: it lists the same people as the hub, so
// it is never offered to search engines, and any query string points at the clean address. Reads the query string,
// so it renders on request; the people come from one cached read (lib/directory/explore-data.ts).

export type ExploreSearchParams = Record<string, string | string[] | undefined>

export const explorePath = (c: Category) => `/${c.slug}/explore`

/** The server's facet counts, trimmed: the browser counts everything itself once its index has come. */
const SERVER_FACET_MAX = 40

export async function exploreMetadata(category: Category): Promise<Metadata> {
  if (!directoryEnabled() || !category.live) return { title: 'Not found', robots: { index: false } }
  return {
    title: { absolute: brandedTitle(`${category.plural}: filter and sort the table`) },
    description: `Every listed ${category.singular.toLowerCase()} in one table: filter by city, firm, practice, title, school and more, then open anyone for their details and how to reach them.`,
    alternates: { canonical: `https://fundopshq.com${explorePath(category)}` },
    robots: { index: false, follow: true },
  }
}

export async function ExploreView({ category, searchParams }: { category: Category; searchParams: ExploreSearchParams }) {
  if (!directoryEnabled() || !category.live) notFound()
  const path = explorePath(category)
  const hub = `/${category.slug}`
  const people = await loadExplorePeople(category.id)
  const year = new Date().getUTCFullYear()
  const rows = people.map((p) => toExploreRow(p, category))
  const initial = parseExplore(searchParams)
  const shown = runExplore(rows, initial, year)
  const full = exploreCounts(rows, initial, year)
  const counts = Object.fromEntries(
    FACET_KEYS.map((k) => {
      const chosen = new Set(initial.f[k] ?? [])
      return [k, full[k].filter((v, i) => i < SERVER_FACET_MAX || chosen.has(v.key))]
    }),
  ) as Record<FacetKey, FacetValue[]>
  // Facets the trade has at all: counted on everyone, so a filter in the address never hides a whole group.
  const everyone = exploreCounts(rows, emptyQuery(), year)
  for (const k of FACET_KEYS) if (everyone[k].length >= 2 && !counts[k].length) counts[k] = everyone[k].slice(0, SERVER_FACET_MAX).map((v) => ({ key: v.key, count: 0 }))
  const firms = rowFirms(people, firmsOf(people, category))
  const p = typeof searchParams.p === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(searchParams.p) && searchParams.p.length <= 120 ? searchParams.p : null
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, { name: category.plural, path: hub }, { name: 'Table' }]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1600px] px-4 pb-4 pt-4 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <h1 className="font-news text-[28px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[34px]">{category.plural}</h1>
                <p className="mt-1.5 max-w-[78ch] font-news text-[16px] leading-snug text-foreground/80">
                  Everyone listed, in one table. Filter by as many fields as you like, sort any column, and open a name for the details and the way to reach them.
                </p>
              </div>
              <ViewToggle listHref={hub} tableHref={path} current="table" />
            </div>
          </header>
        </div>
        <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-3 lg:px-6">
          {rows.length === 0 ? (
            <div className="max-w-[720px] pt-5">
              <EmptyDirectory noun={category.singular.toLowerCase()} />
            </div>
          ) : (
            <Explorer
              trade={{ slug: category.slug, plural: category.plural, singular: category.singular, credentialLabel: category.credentialLabel }}
              path={path}
              hub={hub}
              firms={firms}
              indexUrl={exploreIndexUrl(category.slug)}
              year={year}
              initial={initial}
              initialOpen={p}
              first={{ items: shown.slice(0, 60), total: shown.length, all: rows.length, counts, present: fieldsPresent(rows) }}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
