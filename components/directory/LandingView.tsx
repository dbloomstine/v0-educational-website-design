import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Crumbs, FirmsRail, LandingLinks, Pager, PersonList } from '@/components/directory/parts'
import { firmsOf } from '@/lib/directory/firms'
import { loadPeople } from '@/lib/directory/data'
import {
  LANDING_MIN,
  PAGE_SIZE,
  allLandings,
  itemListJsonLd,
  landingCrumbs,
  landingDescription,
  landingPath,
  landingSentence,
  landingTitle,
  nearby,
  pageHref,
  paginate,
  parsePage,
  peopleFor,
  resolveLanding,
} from '@/lib/directory/landing'
import { CATEGORIES, DIRECTORY_PATH, directoryEnabled, type Category } from '@/lib/directory/taxonomy'
import { breadcrumbJsonLd, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

/**
 * The one template behind every generated directory page, in every trade
 * (2026-10-24; /fund-auditors, /fund-tax-advisors, /placement-agents and
 * /fund-finance-bankers since that night):
 * /fund-lawyers/venture-funds, /fund-lawyers/new-york, /fund-lawyers/texas,
 * /fund-lawyers/venture-funds/san-francisco, /fund-lawyers/emerging-managers,
 * /fund-lawyers/lp-counsel… (lib/directory/landing.ts says which exist).
 *
 * A page exists only with LANDING_MIN people; otherwise it is a 404. Its
 * opening sentence is computed from its own list; it links to its parents
 * and the nearby pages that exist; it carries an ItemList and a
 * BreadcrumbList; page 2 onward is ?page=n, each its own canonical.
 */

export type LandingProps = { segments: string[]; page?: string | string[]; category?: Category }

async function build({ segments, page: rawPage, category = CATEGORIES.fund_lawyer }: LandingProps) {
  if (!directoryEnabled() || !category.live) return null
  const key = resolveLanding(segments, category)
  if (!key) return null
  const all = await loadPeople(category.id)
  const people = peopleFor(all, key)
  if (people.length < LANDING_MIN) return null
  const paged = paginate(people, parsePage(rawPage))
  if (!paged) return null
  const path = landingPath(category, key)
  const title = landingTitle(category, key)
  const sentence = landingSentence(category, key, people)
  return { category, key, all, people, paged, path, title, sentence }
}

export async function landingMetadata(props: LandingProps): Promise<Metadata> {
  const b = await build(props)
  if (!b) return { title: 'Not found', robots: { index: false } }
  const pageNote = b.paged.page > 1 ? ` (page ${b.paged.page})` : ''
  const description = landingDescription(b.sentence)
  const canonical = `https://fundopshq.com${pageHref(b.path, b.paged.page)}`
  return {
    title: `${b.title}${pageNote}`,
    description,
    alternates: { canonical },
    ...shareCard(`${b.title} | FundOpsHQ`, description, pageHref(b.path, b.paged.page)),
  }
}

export async function LandingView(props: LandingProps) {
  const b = await build(props)
  if (!b) notFound()
  const { category, key, paged, path, title, sentence, people } = b
  const landings = allLandings(category, b.all)
  const near = nearby(key, landings)
  const firms = firmsOf(people, category)
  // Firm pages are counted on the whole trade (a firm with one person here may have ten elsewhere).
  const tradeFirms = new Map(firmsOf(b.all, category).map((f) => [f.domain, f]))
  const railFirms = firms.filter((f) => (tradeFirms.get(f.domain)?.count ?? 0) >= 2).map((f) => ({ ...f, slug: tradeFirms.get(f.domain)!.slug }))
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, ...landingCrumbs(category, key)]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: c.name, path } : c)))) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(title, pageHref(path, paged.page), paged.items, (paged.page - 1) * PAGE_SIZE)) }} />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <h1 className="mt-3 font-news text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[38px]">{title}</h1>
            <p className="mt-2 max-w-[75ch] font-news text-[16.5px] leading-snug text-foreground/75">{sentence}</p>
            <p className="mt-3 font-ui text-[12.5px] text-muted-foreground">
              Looking for someone in particular?{' '}
              <Link href={`/${category.slug}`} className="font-semibold text-foreground/85 underline underline-offset-2 hover:text-foreground">
                Search all {category.plural.toLowerCase()}
              </Link>
              .
            </p>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-5 lg:px-6">
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section aria-labelledby="landing-list" className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-1.5">
                <h2 id="landing-list" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                  A to Z by surname
                </h2>
                <p className="font-ui text-[12.5px] text-foreground/70">
                  {people.length.toLocaleString('en-US')} people
                  {paged.pages > 1 ? ` · ${(paged.page - 1) * PAGE_SIZE + 1}–${(paged.page - 1) * PAGE_SIZE + paged.items.length}` : ''}
                </p>
              </div>
              <PersonList people={paged.items} label={title} firms={[...tradeFirms.values()]} path={`/${category.slug}`} />
              <Pager path={path} page={paged.page} pages={paged.pages} />
              <p className="mt-6 max-w-[70ch] font-ui text-[12.5px] leading-relaxed text-muted-foreground">
                Who is listed here comes from each firm&rsquo;s own public bio page: the practices, clients and offices it names. Nobody pays to be
                listed or to rank.
              </p>
            </section>

            <aside className="min-w-0 space-y-6" aria-label="Related pages">
              <FirmsRail category={category} firms={railFirms} title={`Firms here`} max={10} />
              <LandingLinks title="Up a level" items={near.parents} />
              <LandingLinks title={key.place ? `Also in ${key.place.name}` : 'Other practices and clients'} items={near.samePlace} />
              <LandingLinks title={key.place?.kind === 'state' ? `Cities in ${key.place.name}, and elsewhere` : 'Other places'} items={near.sameTopic} />
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
