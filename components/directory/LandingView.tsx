import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { DIR_H1, DIR_LEDE } from '@/components/directory/hero'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutLine, Crumbs, FirmListLinks, LandingLinks, Pager, PersonList, Verified } from '@/components/directory/parts'
import { DirectoryCta, FaqList, FirmRanking, QuickFacts, SectionHead, type Fact } from '@/components/directory/intent-parts'
import { LandingSearch } from '@/components/directory/LandingSearch'
import { ViewToggle } from '@/components/directory/ViewToggle'
import { tableHrefFrom } from '@/lib/directory/explore'
import { firmPath, firmsOf } from '@/lib/directory/firms'
import { firmListFor, firmListSet, firmListTitle, rankFirms } from '@/lib/directory/firm-lists'
import { landingFaq, peoplePhrase } from '@/lib/directory/faq'
import { intentFor } from '@/lib/directory/intent'
import { PLACES } from '@/lib/directory/places'
import { toRow } from '@/lib/directory/rows'
import { loadPeople } from '@/lib/directory/data'
import {
  PAGE_SIZE,
  absorbedTopic,
  itemListJsonLd,
  landingCrumbs,
  type LandingKey,
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
import { cityTally, practiceTally, verifiedSpan } from '@/lib/directory/people'
import { CATEGORIES, DIRECTORY_PATH, SENIOR_ONLY, directoryEnabled, practiceLabel, type Category } from '@/lib/directory/taxonomy'
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

/** The title tag's names, best first: "Hedge Fund Lawyers & Attorneys in New York", then the heading itself. */
function titleNames(category: Category, key: LandingKey, title: string): string[] {
  const alt = key.topic && key.topic.kind !== 'side' ? intentFor(category, key.topic.id).titleAlt : null
  return alt ? [`${alt}${key.place ? ` in ${key.place.name}` : ''}`, title] : [title]
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
    : searchTitle(titleNames(b.category, b.key, b.title), b.category, b.people.length, b.landing.firms, absorbedTopic(b.path, b.set.pages), 60 - pageNote.length)
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
  const tradeList = firmsOf(b.all, category)
  // Firm pages are counted on the whole trade (a firm with one person here may have ten elsewhere).
  const tradeFirms = new Map(tradeList.map((f) => [f.domain, f]))
  const ranked = rankFirms(people, tradeList)
  const lists = firmListSet(category, b.all, b.set)
  const ownList = firmListFor(lists, category, key)
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, ...landingCrumbs(category, key)]
  const where = key.place ? ` in ${key.place.name}` : ''
  const answer = sentence.split(/(?<=\.)\s+/)[0]
  const span = verifiedSpan(people)
  const practiceId = key.topic?.kind === 'practice' ? key.topic.id : undefined
  const cityId = key.place?.kind === 'city' ? key.place.slug : undefined
  const hub = `/${category.slug}`
  const peopleHref = (f: { domain: string }) =>
    `${hub}?${new URLSearchParams({ firm: f.domain, ...(practiceId ? { practice: practiceId } : {}), ...(cityId ? { city: cityId } : {}) }).toString()}`
  const who = peoplePhrase(category, key)
  const listId = 'landing-people'

  // Quick facts: four numbers from the list (Zillow's agent finder puts the place's numbers before the people).
  const facts: Fact[] = [
    { label: SENIOR_ONLY.includes(category.id) ? 'Partners' : 'People', value: n(people.length), note: SENIOR_ONLY.includes(category.id) ? 'all at partner level' : undefined },
    { label: 'Firms', value: n(ranked.length), note: ownList ? 'ranked by partners' : undefined, href: ownList?.path },
  ]
  if (ranked[0] && ranked.length >= 2) {
    const top = ranked[0]
    const t = tradeFirms.get(top.domain)
    facts.push({ label: 'Most partners', value: top.name, note: `${n(top.count)} listed here`, href: t && t.count >= 2 ? firmPath(category, t.slug) : undefined })
  }
  if (!key.place || key.place.kind === 'state') {
    const c = cityTally(people).filter((t) => !key.place || PLACES.find((p) => p.slug === t.key)?.state === key.place.state)[0]
    if (c) {
      const page = landings.find((l) => !l.topic && l.place?.slug === c.key)
      facts.push({ label: 'Biggest city', value: c.label, note: `${n(c.count)} here`, href: page ? landingPath(category, { topic: key.topic, place: page.place }) : undefined })
    }
  } else if (key.topic) {
    const placePage = landings.find((l) => !l.topic && l.place?.slug === key.place!.slug)
    if (placePage) facts.push({ label: `Of all in ${key.place.name}`, value: `${Math.round((people.length / placePage.count) * 100)}%`, note: `${n(people.length)} of ${n(placePage.count)}`, href: placePage.path })
  } else {
    const t = practiceTally(people)[0]
    if (t) facts.push({ label: 'Practice listed most', value: practiceLabel(t.key), note: `${n(t.count)} partners` })
  }

  const elsewhere = near.sameTopic.filter((l) => l.place?.kind === 'city').map((l) => ({ name: l.place!.name, count: l.count }))
  const faq = landingFaq({ category, key, people, ranked, verified: span, firmList: ownList ? { path: ownList.path, firms: ownList.firms } : null, elsewhere })
  // Firm rankings next to this one: this place's other practices, this practice's other places.
  const siblingLists = lists.lists.filter(
    (x) => x.path !== ownList?.path && x.indexable && ((x.key.place?.slug ?? null) === (key.place?.slug ?? null) || (key.topic && x.key.topic?.slug === key.topic.slug)),
  )

  // Auditor searches are firm searches (the intent map): their pages put the firms first.
  const firmsFirst = category.id === 'fund_auditor'
  const firmsBlock = ranked.length >= 2 && (
                <section aria-labelledby="landing-firms">
                  <SectionHead
                    id="landing-firms"
                    title={`${firmListTitle(category, key)}, by partners listed`}
                    aside={
                      ownList ? (
                        <Link prefetch={false} href={ownList.path} className="font-semibold text-foreground underline underline-offset-2">
                          All {n(ranked.length)} ranked
                        </Link>
                      ) : undefined
                    }
                  />
                  <FirmRanking category={category} firms={ranked} max={8} peopleHref={peopleHref} label={firmListTitle(category, key)} />
                </section>
              )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: c.name, path } : c)))) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(title, pageHref(path, paged.page), paged.items, (paged.page - 1) * PAGE_SIZE)) }} />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <h1 className={`mt-3 ${DIR_H1}`}>{title}</h1>
            <p className={`mt-2 max-w-[68ch] ${DIR_LEDE}`}>{answer}</p>
            <LandingSearch
              rows={paged.items.map((p) => {
                const r = toRow(p)
                return { s: r.s, n: r.n, f: r.f, o: r.o, c: r.c, p: r.p }
              })}
              total={people.length}
              action={hub}
              practice={practiceId}
              city={cityId}
              listId={listId}
              label={`Search ${title.toLowerCase()}`}
              hint={`Search ${n(people.length)} by name, firm or city`}
            />
            <QuickFacts facts={facts} />
            <Verified span={span} className="mt-2" />
            <nav aria-label="On this page" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-ui text-[13px] font-semibold">
              <a href="#landing-list" className="inline-flex min-h-[24px] items-center text-foreground underline underline-offset-2">
                {cap(who)}, A to Z
              </a>
              {ranked.length >= 2 && (
                <a href={ownList ? ownList.path : '#landing-firms'} className="inline-flex min-h-[24px] items-center text-foreground underline underline-offset-2">
                  {firmListTitle(category, key)}, ranked
                </a>
              )}
              <a href="#faq" className="inline-flex min-h-[24px] items-center text-foreground underline underline-offset-2">
                Questions
              </a>
            </nav>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-6 lg:px-6">
          <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-10">
              {firmsFirst && firmsBlock}
              <section aria-labelledby="landing-list" className="min-w-0">
                <SectionHead
                  id="landing-list"
                  title={`${cap(who)}${where}, A to Z`}
                  aside={`${n(people.length)} ${paged.pages > 1 ? `· ${(paged.page - 1) * PAGE_SIZE + 1}–${(paged.page - 1) * PAGE_SIZE + paged.items.length}` : ''}`}
                />
                <div className="mb-1 mt-2 flex justify-end">
                  <ViewToggle
                    listHref={pageHref(path, paged.page)}
                    tableHref={tableHrefFrom(`${hub}/explore`, {
                      practice: key.topic?.kind === 'practice' ? key.topic.id : undefined,
                      focus: key.topic?.kind === 'focus' ? key.topic.id : undefined,
                      side: key.topic?.kind === 'side' ? key.topic.id : undefined,
                      city: key.place?.kind === 'city' ? key.place.slug : undefined,
                      state: key.place?.kind === 'state' ? key.place.state : undefined,
                    })}
                    current="list"
                  />
                </div>
                <div id={listId}>
                  <PersonList people={paged.items} label={title} firms={[...tradeFirms.values()]} path={hub} />
                </div>
                <Pager path={path} page={paged.page} pages={paged.pages} />
              </section>

              {!firmsFirst && firmsBlock}

              <FaqList items={faq} title="Questions" />
              <DirectoryCta />
              <p className="max-w-[70ch] font-ui text-[12.5px] leading-relaxed text-muted-foreground">
                Who is listed here comes from each firm&rsquo;s own public bio page: the practices, clients and offices it names. Nobody pays to be
                listed or to rank. <AboutLine />
              </p>
            </div>

            <aside className="min-w-0 space-y-6" aria-label="Related pages">
              <LandingLinks title="Up a level" items={near.parents} />
              <LandingLinks title={key.place ? `Also in ${key.place.name}` : 'Other practices and clients'} items={near.samePlace} />
              <LandingLinks title={key.place?.kind === 'state' ? `Cities in ${key.place.name}, and elsewhere` : 'Other places'} items={near.sameTopic} />
              <FirmListLinks title="Firm rankings" items={siblingLists.slice(0, 10)} />
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

const n = (x: number) => x.toLocaleString('en-US')
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/** Anything in the address besides ?page: a filter, a search or a tag (the page itself ignores it). */
export const hasQuery = (sp: Record<string, unknown>) => Object.keys(sp).some((k) => k !== 'page')
