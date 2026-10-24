import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Crumbs, EmptyDirectory, LandingLinks, Pager, PersonList } from '@/components/directory/parts'
import { loadPeople } from '@/lib/directory/data'
import { allLandings, itemListJsonLd, paginate, parsePage, PAGE_SIZE } from '@/lib/directory/landing'
import { bySurname, cityTally, countsSentence, filterPeople, firmTally, isPublic, type Filters } from '@/lib/directory/people'
import { CATEGORIES, PRACTICES, directoryEnabled, practiceLabel } from '@/lib/directory/taxonomy'
import { breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// The Fund Lawyers hub (2026-10-24): search by name, firm or city, filter by
// practice, city and firm, and the ways into the generated landing pages.
// Reads the query string, so it renders on request; the people come from one
// cached list (lib/directory/data.ts) and the edge keeps each URL for five
// minutes (next.config.mjs). A filtered or searched view is not indexed.

const CATEGORY = CATEGORIES.fund_lawyer
const PATH = `/${CATEGORY.slug}`
const INTRO = 'US lawyers who form, finance and advise private funds, each profile drawn from the firm’s own public bio page.'

type SP = { q?: string; practice?: string; city?: string; firm?: string; page?: string }
type Params = { searchParams: Promise<SP> }

const one = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 80) : '')

function readFilters(sp: SP): Filters {
  return { q: one(sp.q), practice: one(sp.practice), city: one(sp.city), firm: one(sp.firm) }
}

const filtered = (f: Filters) => Boolean(f.q || f.practice || f.city || f.firm)

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  if (!directoryEnabled()) return { title: 'Not found', robots: { index: false } }
  const sp = await searchParams
  const people = (await loadPeople(CATEGORY.id)).filter((p) => isPublic(p))
  const page = parsePage(sp.page)
  const description = metaDescription(people.length ? `${countsSentence(people, CATEGORY)}. ${INTRO}` : INTRO)
  const url = `https://fundopshq.com${PATH}${page > 1 && !filtered(readFilters(sp)) ? `?page=${page}` : ''}`
  return {
    title: CATEGORY.plural,
    description,
    alternates: { canonical: url },
    // Indexed once there are people, and only the plain list: a search or a filter is a view of it.
    robots: people.length && !filtered(readFilters(sp)) ? undefined : { index: false, follow: true },
    ...shareCard(`${CATEGORY.plural} | FundOpsHQ`, description, PATH),
  }
}

export default async function FundLawyersHub({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const sp = await searchParams
  const f = readFilters(sp)
  const page = parsePage(sp.page)
  const people = (await loadPeople(CATEGORY.id)).filter((p) => isPublic(p)).sort(bySurname)
  const shown = filterPeople(people, f)
  const paged = paginate(shown, page)
  if (!paged) notFound()

  const landings = allLandings(CATEGORY, people)
  const byKind = (kind: string, placeKind?: 'city' | 'state') =>
    landings.filter((l) => (kind === 'place' ? !l.topic && l.place?.kind === placeKind : l.topic?.kind === kind && !l.place))
  const firms = firmTally(people)
  const cities = cityTally(people)
  const query = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString()
  const crumbs = [{ name: CATEGORY.plural }]

  const selectClass =
    'h-10 w-full rounded-sm border border-foreground/25 bg-card px-2 font-ui text-[14px] text-foreground focus:border-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground'
  const labelClass = 'mb-1 block font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/65'

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: 'Directory' }, { name: CATEGORY.plural, path: PATH }])) }} />
      {paged.items.length > 0 && !filtered(f) && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(CATEGORY.plural, PATH, paged.items, (paged.page - 1) * PAGE_SIZE)) }} />
      )}

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <p className="mt-3 font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">Directory</p>
            <h1 className="mt-1 font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">{CATEGORY.plural}</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16.5px] leading-snug text-foreground/75">{INTRO}</p>
            {people.length > 0 && <p className="mt-1.5 font-ui text-[13px] font-semibold text-foreground/80">{countsSentence(people, CATEGORY)}.</p>}

            {people.length > 0 && (
              <form action={PATH} method="get" role="search" aria-label={`Search ${CATEGORY.plural.toLowerCase()}`} className="mt-4 grid max-w-[1000px] gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="dir-q" className={labelClass}>
                    Name, firm or city
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                      id="dir-q"
                      type="search"
                      name="q"
                      defaultValue={f.q}
                      placeholder="e.g. Smith, Kirkland, Boston"
                      className="h-10 w-full rounded-sm border border-foreground/25 bg-card pl-9 pr-3 font-ui text-[16px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground sm:text-[14px]"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="dir-practice" className={labelClass}>
                    Practice
                  </label>
                  <select id="dir-practice" name="practice" defaultValue={f.practice} className={selectClass}>
                    <option value="">All practices</option>
                    {PRACTICES.filter((p) => p.id !== 'other').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dir-city" className={labelClass}>
                    City
                  </label>
                  <select id="dir-city" name="city" defaultValue={f.city} className={selectClass}>
                    <option value="">All cities</option>
                    {cities.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label} ({c.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dir-firm" className={labelClass}>
                    Firm
                  </label>
                  <select id="dir-firm" name="firm" defaultValue={f.firm} className={selectClass}>
                    <option value="">All firms</option>
                    {[...firms].sort((a, b) => a.label.localeCompare(b.label, 'en')).map((x) => (
                      <option key={x.key} value={x.key}>
                        {x.label} ({x.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" className="h-10 rounded-sm bg-foreground px-4 font-ui text-[12.5px] font-bold uppercase tracking-[0.06em] text-background hover:bg-foreground/85">
                    Find
                  </button>
                  {filtered(f) && (
                    <Link href={PATH} className="inline-flex h-10 items-center gap-1 px-1 font-ui text-[12.5px] text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Clear
                    </Link>
                  )}
                </div>
              </form>
            )}
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-5 lg:px-6">
          {people.length === 0 ? (
            <div className="max-w-[720px]">
              <EmptyDirectory noun={CATEGORY.singular.toLowerCase()} />
            </div>
          ) : (
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section aria-labelledby="dir-results" className="min-w-0">
                <div className="mb-1 flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-1.5">
                  <h2 id="dir-results" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                    {filtered(f) ? 'Matching' : 'A to Z by surname'}
                  </h2>
                  <p className="font-ui text-[11.5px] text-muted-foreground" role="status">
                    {shown.length.toLocaleString('en-US')} {shown.length === 1 ? 'person' : 'people'}
                    {f.practice ? ` · ${practiceLabel(f.practice)}` : ''}
                  </p>
                </div>
                {shown.length === 0 ? (
                  <p className="py-8 font-news text-[17px] text-muted-foreground">
                    Nobody matches that. Try fewer words, or a firm&rsquo;s short name (&ldquo;Kirkland&rdquo;, not &ldquo;Kirkland &amp; Ellis LLP&rdquo;).
                  </p>
                ) : (
                  <PersonList people={paged.items} label={CATEGORY.plural} />
                )}
                <Pager path={PATH} page={paged.page} pages={paged.pages} query={query} />
                <p className="mt-6 max-w-[70ch] font-ui text-[12.5px] leading-relaxed text-muted-foreground">
                  Listed in surname order; nobody pays to be listed or to rank. Facts come from each firm&rsquo;s public bio page, dated on the
                  profile. A listed lawyer can claim their profile, correct it or have it removed.
                </p>
              </section>

              <aside className="min-w-0 space-y-6" aria-label="Browse the directory">
                <LandingLinks title="By practice" items={byKind('practice')} />
                <LandingLinks title="By client" items={[...byKind('focus'), ...byKind('side')]} />
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
