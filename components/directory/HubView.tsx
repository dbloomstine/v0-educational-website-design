import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutLine, Crumbs, EmptyDirectory, FirmListLinks, FirmsRail, LandingLinks, Verified } from '@/components/directory/parts'
import { firmListSet } from '@/lib/directory/firm-lists'
import { intentPage, parseIntent } from '@/lib/directory/intent-route'
import { DirectoryBrowser } from '@/components/directory/DirectoryBrowser'
import { ViewToggle } from '@/components/directory/ViewToggle'
import { tableHrefFrom } from '@/lib/directory/explore'
import { FirmMark } from '@/components/directory/FirmMark'
import { DIR_H1, DIR_LEDE, PopularLinks } from '@/components/directory/hero'
import { QuickFacts, type Fact } from '@/components/directory/intent-parts'
import { FIRM_MIN, firmPath, firmsIndexPath, firmsOf } from '@/lib/directory/firms'
import { logoFor, monogram } from '@/lib/directory/logos'
import { rowFirms, toRow } from '@/lib/directory/rows'
import { QUERY_PAGE, facetCounts, isSortKey, runQuery } from '@/lib/directory/search'
import { indexUrl } from '@/lib/directory/search-index'
import { loadPeople } from '@/lib/directory/data'
import { absorbedTopic, allLandings, foldedTitle, itemListJsonLd, landingSet, parsePage, PAGE_SIZE, searchTitle } from '@/lib/directory/landing'
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
  const set = landingSet(CATEGORY, people)
  const folded = set.hubFolded
  const absorbed = folded ? { noun: folded.noun, count: folded.count } : absorbedTopic(PATH, set.pages)
  const firms = firmTally(people).length
  const pageNote = page > 1 && !query ? ` (page ${page})` : ''
  const lead = people.length ? `${countsSentence(people, CATEGORY)}${absorbed ? `, ${absorbed.count.toLocaleString('en-US')} of them in ${absorbed.noun.toLowerCase()}` : ''}. ` : ''
  const description = metaDescription(`${pageNote ? `Page ${page}: ` : ''}${lead}${INTRO}`)
  const url = `https://fundopshq.com${PATH}${pageNote ? `?page=${page}` : ''}`
  // A folded practice (fund formation, for lawyers) names the hub, counted on its own partners and firms; "fund
  // lawyers" stays in the description and the intro, so both searches find the page.
  const title = !people.length
    ? CATEGORY.plural
    : folded
      ? searchTitle(foldedTitle(CATEGORY, { topic: null, place: null }, folded), CATEGORY, folded.count, folded.firms, null, 60 - pageNote.length)
      : searchTitle([CATEGORY.searchName ?? CATEGORY.plural, CATEGORY.plural], CATEGORY, people.length, firms, absorbed, 60 - pageNote.length)
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

  const set = landingSet(CATEGORY, people)
  const landings = set.pages
  const firmLists = firmListSet(CATEGORY, people, set).lists
  // A search that names a page ("hedge fund law firms", "VC fund attorney new york"): offer that page (lib/directory/intent-route.ts).
  const titles = new Map<string, string>([...landings.map((l) => [l.path, l.title] as const), ...firmLists.map((x) => [x.path, x.title] as const)])
  const suggestion = f.q && !f.practice && !f.city ? intentPage(parseIntent(f.q, CATEGORY.id), (p) => titles.has(p)) : null
  const suggested = suggestion && suggestion !== PATH && parseIntent(f.q!, CATEGORY.id).category === CATEGORY.id ? { path: suggestion, title: titles.get(suggestion)! } : null
  const heading = set.hubFolded ? foldedTitle(CATEGORY, { topic: null, place: null }, set.hubFolded) : CATEGORY.plural
  const byKind = (kind: string, placeKind?: 'city' | 'state') =>
    landings.filter((l) => (kind === 'place' ? !l.topic && l.place?.kind === placeKind : l.topic?.kind === kind && !l.place))
  const cities = cityTally(people)
  const usedPractices = new Set(rows.flatMap((r) => r.p))
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, { name: CATEGORY.plural }]
  const withPages = firms.filter((x) => x.count >= FIRM_MIN)
  // The head's numbers (Zillow's agent finder: the place's numbers before the people) and its most-searched pages
  // (Zocdoc's popular searches): the biggest strategy pages and the biggest city pages, three of each.
  const senior = rows.filter((r) => r.sr).length
  const facts: Fact[] = [
    { label: 'Listed', value: n(people.length), note: people.length ? `${Math.round((senior / people.length) * 100)}% partners or MDs` : undefined },
    { label: 'Firms', value: n(firmTally(people).length), note: 'ranked by people listed', href: firmsIndexPath(CATEGORY) },
    { label: 'Cities', value: n(cities.length), note: cities[0] ? `most in ${cities[0].label}` : undefined },
  ]
  if (withPages[0]) facts.push({ label: 'Most listed', value: withPages[0].name, note: `${n(withPages[0].count)} people`, href: firmPath(CATEGORY, withPages[0].slug) })
  const top = (xs: typeof landings) => [...xs].sort((a, b) => b.count - a.count).slice(0, 3)
  const popular = [...top(byKind('practice').filter((l) => l.path !== `${PATH}/fund-formation`)), ...top(byKind('place', 'city'))].map((l) => ({ path: l.path, title: l.title, count: l.count }))

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
            {/* The page head (components/directory/hero.tsx), the same on every directory page. The list's own toolbar
                below the band carries the search and any list/table switch; nothing here moves when one is added. */}
            <h1 className={`mt-3 ${DIR_H1}`}>{heading}</h1>
            <p className={`mt-2 max-w-[68ch] ${DIR_LEDE}`}>{INTRO}</p>
            {people.length > 0 && <p className="sr-only">{countsSentence(people, CATEGORY)}.</p>}
            {people.length > 0 && <QuickFacts facts={facts} />}
            {people.length > 0 && <Verified span={verifiedSpan(people)} className="mt-2" />}
            <PopularLinks items={popular} label="Most searched" className="mt-3 max-sm:hidden" />
            {suggested && (
              <p className="mt-3 font-ui text-[14px] text-foreground">
                Looking for{' '}
                <Link prefetch={false} href={suggested.path} className="font-semibold underline underline-offset-2">
                  {suggested.title}
                </Link>
                ?
              </p>
            )}
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
                      <span className="max-w-[112px] truncate font-ui text-[12px] font-semibold leading-tight text-foreground">{x.name}</span>
                      <span className="font-ui text-[11.5px] leading-tight text-foreground/65">{x.count} listed</span>
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
                <div className="mb-1 flex justify-end">
                  <ViewToggle listHref={PATH} tableHref={tableHrefFrom(`${PATH}/explore`, { ...f, level })} current="list" />
                </div>
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
                <FirmListLinks title="Firm rankings" items={firmLists.filter((x) => x.indexable && !x.key.place)} />
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

const n = (x: number) => x.toLocaleString('en-US')
