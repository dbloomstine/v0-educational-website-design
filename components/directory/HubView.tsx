import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutLine, Crumbs, EmptyDirectory, FirmsRail, LandingLinks, Verified } from '@/components/directory/parts'
import { DirectoryBrowser } from '@/components/directory/DirectoryBrowser'
import { FirmMark } from '@/components/directory/FirmMark'
import { FIRM_MIN, firmPath, firmsIndexPath, firmsOf } from '@/lib/directory/firms'
import { logoFor, monogram } from '@/lib/directory/logos'
import { rowFirms, toRow } from '@/lib/directory/rows'
import { QUERY_PAGE, facetCounts, isSortKey, runQuery } from '@/lib/directory/search'
import { indexUrl } from '@/lib/directory/search-index'
import { loadPeople } from '@/lib/directory/data'
import { absorbedTopic, allLandings, itemListJsonLd, parsePage, PAGE_SIZE, searchTitle } from '@/lib/directory/landing'
import { bySurname, cityTally, countsSentence, firmTally, isPublic, verifiedSpan, type Filters } from '@/lib/directory/people'
import { DIRECTORY_PATH, directoryEnabled, practicesFor, type Category } from '@/lib/directory/taxonomy'
import { brandedTitle, breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// A trade's hub (2026-10-24; all five trades since that night): search by
// name, firm or city, filter by practice, city and firm, and the ways into the
// generated landing pages. Reads the query string, so it renders on request;
// the people come from one cached list (lib/directory/data.ts) and the edge
// keeps each URL for five minutes (next.config.mjs). A filtered or searched
// view is not indexed.

export type HubSearchParams = { q?: string; practice?: string; city?: string; firm?: string; level?: string; sort?: string; page?: string }

const one = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 80) : '')

function readFilters(sp: HubSearchParams): Filters {
  return { q: one(sp.q), practice: one(sp.practice), city: one(sp.city), firm: one(sp.firm) }
}

const filtered = (f: Filters, sp?: HubSearchParams) => Boolean(f.q || f.practice || f.city || f.firm || sp?.level || (sp?.sort && sp.sort !== 'name'))

/** Anything in the address besides ?page (a search, a filter, a sort, a tag): a view of the list, not a page of its own. */
const isQuery = (sp: HubSearchParams) => Object.keys(sp ?? {}).some((k) => k !== 'page')

export async function hubMetadata(CATEGORY: Category, sp: HubSearchParams): Promise<Metadata> {
  if (!directoryEnabled() || !CATEGORY.live) return { title: 'Not found', robots: { index: false } }
  const PATH = `/${CATEGORY.slug}`
  const INTRO = CATEGORY.intro
  const people = (await loadPeople(CATEGORY.id)).filter((p) => isPublic(p))
  const page = parsePage(sp.page)
  const query = isQuery(sp)
  // The practice page that is this list again (fund formation, for lawyers) gives its words to the hub's title.
  const absorbed = absorbedTopic(PATH, allLandings(CATEGORY, people))
  const firms = firmTally(people).length
  const pageNote = page > 1 && !query ? ` (page ${page})` : ''
  const lead = people.length ? `${countsSentence(people, CATEGORY)}${absorbed ? `, ${absorbed.count.toLocaleString('en-US')} of them in ${absorbed.noun.toLowerCase()}` : ''}. ` : ''
  const description = metaDescription(`${pageNote ? `Page ${page}: ` : ''}${lead}${INTRO}`)
  const url = `https://fundopshq.com${PATH}${pageNote ? `?page=${page}` : ''}`
  const title = people.length
    ? searchTitle([CATEGORY.searchName ?? CATEGORY.plural, CATEGORY.plural], CATEGORY, people.length, firms, absorbed, 60 - pageNote.length)
    : CATEGORY.plural
  return {
    title: { absolute: brandedTitle(`${title}${pageNote}`) },
    description,
    // A searched, filtered or sorted view (or any query string) points at the plain list, and is not indexed itself.
    alternates: { canonical: url },
    robots: people.length && !query ? undefined : { index: false, follow: true },
    ...shareCard(`${CATEGORY.plural} | FundOpsHQ`, description, PATH),
  }
}

export async function HubView({ category: CATEGORY, searchParams: sp }: { category: Category; searchParams: HubSearchParams }) {
  if (!directoryEnabled() || !CATEGORY.live) notFound()
  const PATH = `/${CATEGORY.slug}`
  const INTRO = CATEGORY.intro
  const f = readFilters(sp)
  const page = parsePage(sp.page)
  const people = (await loadPeople(CATEGORY.id)).filter((p) => isPublic(p)).sort(bySurname)
  const rows = people.map(toRow)
  const firms = firmsOf(people, CATEGORY)
  const marks = rowFirms(people, firms)
  const sort = isSortKey(sp.sort) ? sp.sort : 'name'
  const level = one(sp.level) === 'senior' ? 'senior' : ''
  // The first page a reader (or a crawler) is served is the browser's own first render; an address past the last page is a 404.
  const initialQuery = { ...f, level, sort }
  const shown = runQuery(rows, initialQuery)
  if (!Number.isInteger(page) || page < 1 || (page > 1 && page > Math.ceil(shown.length / QUERY_PAGE))) notFound()
  const firstPage = shown.slice((page - 1) * QUERY_PAGE, page * QUERY_PAGE)

  const landings = allLandings(CATEGORY, people)
  const byKind = (kind: string, placeKind?: 'city' | 'state') =>
    landings.filter((l) => (kind === 'place' ? !l.topic && l.place?.kind === placeKind : l.topic?.kind === kind && !l.place))
  const cities = cityTally(people)
  const usedPractices = new Set(rows.flatMap((r) => r.p))
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, { name: CATEGORY.plural }]
  const withPages = firms.filter((x) => x.count >= FIRM_MIN)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: 'Directory', path: DIRECTORY_PATH }, { name: CATEGORY.plural, path: PATH }])) }} />
      {firstPage.length > 0 && !filtered(f) && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(CATEGORY.plural, PATH, people.filter((p) => firstPage.some((r) => r.s === p.slug)), (page - 1) * PAGE_SIZE)) }} />
      )}

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <h1 className="mt-3 font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">{CATEGORY.plural}</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16.5px] leading-snug text-foreground/80">{INTRO}</p>
            {people.length > 0 && <p className="mt-1.5 font-ui text-[13px] font-semibold text-foreground/85">{countsSentence(people, CATEGORY)}.</p>}
            {people.length > 0 && <Verified span={verifiedSpan(people)} className="mt-1" />}
            {withPages.length >= 2 && (
              <ul aria-label="Firms with the most people listed" className="tab-scroll -mx-4 mt-4 flex gap-x-2 overflow-x-auto px-4 pb-1 lg:hidden">
                {withPages.slice(0, 8).map((x) => (
                  <li key={x.domain} className="relative shrink-0">
                    <Link
                      prefetch={false}
                      href={firmPath(CATEGORY, x.slug)}
                      className="flex h-full flex-col items-center gap-1 rounded-[3px] border border-transparent px-2 py-1.5 hover:border-foreground/25 hover:bg-card"
                    >
                      <FirmMark name={x.name} logo={logoFor(x.domain)} mono={monogram(x.name)} size="md" decorative eager />
                      <span className="font-ui text-[12px] leading-tight text-foreground/75">
                        <span className="sr-only">{x.name}: </span>
                        {x.count} listed
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-12 lg:px-6">
          {people.length === 0 ? (
            <div className="max-w-[720px] pt-5">
              <EmptyDirectory noun={CATEGORY.singular.toLowerCase()} />
            </div>
          ) : (
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section aria-label={`${CATEGORY.plural}, searchable`} className="min-w-0">
                <DirectoryBrowser
                  path={PATH}
                  plural={CATEGORY.plural}
                  singular={CATEGORY.singular}
                  searchHint={CATEGORY.searchHint}
                  firmHint={CATEGORY.firmHint}
                  first={{
                    items: firstPage,
                    total: shown.length,
                    counts: {
                      practice: [...facetCounts(rows, initialQuery, 'practice')],
                      city: [...facetCounts(rows, initialQuery, 'city')],
                      firm: [...facetCounts(rows, initialQuery, 'firm')],
                      level: [...facetCounts(rows, initialQuery, 'level')],
                    },
                  }}
                  indexUrl={indexUrl(CATEGORY.slug)}
                  firms={marks}
                  practices={practicesFor(CATEGORY).filter((p) => usedPractices.has(p.id)).map((p) => ({ id: p.id, label: p.label }))}
                  cities={cities.map((c) => ({ key: c.key, label: c.label }))}
                  initial={{ ...f, level, sort, page }}
                />
                <p className="mt-6 max-w-[70ch] font-ui text-[12.5px] leading-relaxed text-foreground/70">
                  Nobody pays to be listed or to rank. Facts come from each firm&rsquo;s public bio page, dated on the profile. Anyone listed
                  can claim their profile, correct it or have it removed. <AboutLine />
                </p>
              </section>

              <aside className="min-w-0 space-y-6 lg:pt-3" aria-label="Browse the directory">
                <FirmsRail category={CATEGORY} firms={withPages} allHref={firmsIndexPath(CATEGORY)} />
                <LandingLinks title="By practice" items={byKind('practice')} />
                <LandingLinks title={CATEGORY.sides ? 'By client' : 'By stage'} items={[...byKind('focus'), ...byKind('side')]} />
                <LandingLinks title="By city" items={byKind('place', 'city')} />
                <LandingLinks title="By state" items={byKind('place', 'state')} />
              </aside>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
