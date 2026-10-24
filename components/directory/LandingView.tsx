import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutLine, Crumbs, FirmsRail, LandingLinks, Pager, PersonList, Verified } from '@/components/directory/parts'
import { firmsOf } from '@/lib/directory/firms'
import { loadPeople } from '@/lib/directory/data'
import {
  PAGE_SIZE,
  absorbedTopic,
  itemListJsonLd,
  landingCrumbs,
  landingDescription,
  landingPath,
  landingSet,
  landingSentence,
  landingTitle,
  nearby,
  pageHref,
  paginate,
  parsePage,
  peopleFor,
  resolveLanding,
  searchTitle,
} from '@/lib/directory/landing'
import { verifiedSpan } from '@/lib/directory/people'
import { CATEGORIES, DIRECTORY_PATH, directoryEnabled, type Category } from '@/lib/directory/taxonomy'
import { brandedTitle, breadcrumbJsonLd, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

/**
 * The one template behind every generated directory page, in every trade
 * (2026-10-24; /fund-auditors, /fund-tax-advisors, /placement-agents and
 * /fund-finance-bankers since that night):
 * /fund-lawyers/venture-funds, /fund-lawyers/new-york, /fund-lawyers/texas,
 * /fund-lawyers/venture-funds/san-francisco, /fund-lawyers/emerging-managers,
 * /fund-lawyers/lp-counsel… (lib/directory/landing.ts says which exist).
 *
 * A page exists only as lib/directory/landing.ts landingSet says (eight people
 * at two firms or more; a state only when it adds to its main city, else its
 * address redirects there); a near-copy of a broader page is noindexed. Its
 * opening sentence is computed from its own list; it links to its parents
 * and the nearby pages that exist; it carries an ItemList and a
 * BreadcrumbList; page 2 onward is ?page=n, each its own canonical.
 */

/** `query`: the address carries something other than ?page (a filter or a tracking tag): canonical to the clean page, noindexed. */
export type LandingProps = { segments: string[]; page?: string | string[]; category?: Category; query?: boolean }

async function build({ segments, page: rawPage, category = CATEGORIES.fund_lawyer }: LandingProps) {
  if (!directoryEnabled() || !category.live) return null
  const key = resolveLanding(segments, category)
  if (!key) return null
  const all = await loadPeople(category.id)
  const set = landingSet(category, all)
  const path = landingPath(category, key)
  const page = set.pages.find((l) => l.path === path)
  if (!page) {
    // A state whose list is its main city's: the city's page is the one address (2026-10-24).
    const m = set.merged.find((x) => x.path === path)
    return m ? { redirectTo: m.into } : null
  }
  const people = peopleFor(all, key)
  const paged = paginate(people, parsePage(rawPage))
  if (!paged) return null
  // The heading: the page's own name, or the folded practice's ("Fund Formation Lawyers in New York").
  const title = page.title
  const sentence = landingSentence(category, key, people)
  return { category, key, all, set, landing: page, people, paged, path, title, sentence }
}

export async function landingMetadata(props: LandingProps): Promise<Metadata> {
  const b = await build(props)
  if (!b || 'redirectTo' in b) return { title: 'Not found', robots: { index: false } }
  const pageNote = b.paged.page > 1 ? ` (page ${b.paged.page})` : ''
  const description = landingDescription(b.paged.page > 1 ? `Page ${b.paged.page}: ${b.sentence}` : b.sentence)
  const canonical = `https://fundopshq.com${pageHref(b.path, b.paged.page)}`
  const f = b.landing.folded
  // A folded page counts the folded practice's own partners and firms, so the title's number is true of its words.
  const search = f
    ? searchTitle(b.title, b.category, f.count, f.firms, null, 60 - pageNote.length)
    : searchTitle(b.title, b.category, b.people.length, b.landing.firms, absorbedTopic(b.path, b.set.pages), 60 - pageNote.length)
  return {
    title: { absolute: brandedTitle(`${search}${pageNote}`) },
    description,
    alternates: { canonical },
    // A near-copy of a broader page (lib/directory/landing.ts OVERLAP_MAX), or the page under a query string: kept for
    // readers, not offered to search engines.
    robots: b.landing.indexable && !props.query ? undefined : { index: false, follow: true },
    ...shareCard(`${b.title} | FundOpsHQ`, description, pageHref(b.path, b.paged.page)),
  }
}

export async function LandingView(props: LandingProps) {
  const b = await build(props)
  if (!b) notFound()
  if ('redirectTo' in b) permanentRedirect(b.redirectTo as string)
  const { category, key, paged, path, title, sentence, people } = b
  const landings = b.set.pages
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
            <Verified span={verifiedSpan(people)} className="mt-2" />
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
                listed or to rank. <AboutLine />
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

/** Anything in the address besides ?page: a filter, a search or a tag (the page itself ignores it). */
export const hasQuery = (sp: Record<string, unknown>) => Object.keys(sp).some((k) => k !== 'page')
