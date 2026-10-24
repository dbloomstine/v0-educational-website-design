import type { Metadata } from 'next'
import Link from 'next/link'
import { DIR_H1, DIR_LEDE } from '@/components/directory/hero'
import { notFound, permanentRedirect } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutLine, Crumbs, Verified } from '@/components/directory/parts'
import { DirectoryCta, FaqList, FirmRanking, QuickFacts, RelatedLinks, SectionHead, type Fact } from '@/components/directory/intent-parts'
import { loadPeople } from '@/lib/directory/data'
import { firmPath, firmsOf } from '@/lib/directory/firms'
import { firmItemListJsonLd, firmListPath, firmListSearchTitle, firmListSentence, firmListSet, rankFirms, resolveFirmList } from '@/lib/directory/firm-lists'
import { firmListFaq, peoplePhrase } from '@/lib/directory/faq'
import { landingCrumbs, landingSet, nearby, peopleFor } from '@/lib/directory/landing'
import { isPublic, verifiedSpan } from '@/lib/directory/people'
import { DIRECTORY_PATH, SENIOR_ONLY, directoryEnabled, type Category } from '@/lib/directory/taxonomy'
import { brandedTitle, breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

/**
 * A firm list (2026-10-24): /fund-lawyers/hedge-funds/firms, "Hedge Fund Law Firms", for the searches that want a
 * firm, not a person ("hedge fund law firms", "private equity fund audit firms"). lib/directory/firm-lists.ts says
 * which exist and which are indexed. The ranking is Chambers' table, set as a newspaper's: rank, mark, firm, where
 * its partners sit, how many. The order is a count of partners each firm's own website lists, said over the table.
 */

const SITE = 'https://fundopshq.com'
const n = (x: number) => x.toLocaleString('en-US')

export type FirmListProps = { segments: string[]; category: Category; query?: boolean }

async function build({ segments, category }: FirmListProps) {
  if (!directoryEnabled() || !category.live) return null
  const key = resolveFirmList(segments, category)
  if (!key) return null
  const all = await loadPeople(category.id)
  const set = landingSet(category, all)
  const fl = firmListSet(category, all, set)
  const path = firmListPath(category, key)
  const list = fl.lists.find((x) => x.path === path)
  if (!list) {
    const r = fl.redirects.find((x) => x.path === path)
    return r ? { redirectTo: r.into } : null
  }
  const people = key.topic || key.place ? peopleFor(all, key) : all.filter((p) => isPublic(p))
  const tradeFirms = firmsOf(all, category)
  const ranked = rankFirms(people, tradeFirms)
  return { category, key, all, set, fl, list, path, people, ranked, sentence: firmListSentence(category, key, ranked) }
}

export async function firmListMetadata(props: FirmListProps): Promise<Metadata> {
  const b = await build(props)
  if (!b || 'redirectTo' in b) return { title: 'Not found', robots: { index: false } }
  const description = metaDescription(b.sentence)
  return {
    title: { absolute: brandedTitle(firmListSearchTitle(b.category, b.list.title, b.ranked.length, b.people.length)) },
    description,
    alternates: { canonical: `${SITE}${b.path}` },
    robots: b.list.indexable && !props.query ? undefined : { index: false, follow: true },
    ...shareCard(`${b.list.title} | FundOpsHQ`, description, b.path),
  }
}

export async function FirmListView(props: FirmListProps) {
  const b = await build(props)
  if (!b) notFound()
  if ('redirectTo' in b) permanentRedirect(b.redirectTo as string)
  const { category, key, list, path, people, ranked } = b
  const hub = `/${category.slug}`
  const where = key.place ? ` in ${key.place.name}` : ''
  const practiceId = key.topic?.kind === 'practice' ? key.topic.id : undefined
  const cityId = key.place?.kind === 'city' ? key.place.slug : undefined
  const peopleHref = (f: { domain: string }) =>
    `${hub}?${new URLSearchParams({ firm: f.domain, ...(practiceId ? { practice: practiceId } : {}), ...(cityId ? { city: cityId } : {}) }).toString()}`
  const base = landingCrumbs(category, key)
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, ...base.map((c, i) => (i === base.length - 1 ? { ...c, path: list.peoplePath } : c)), { name: 'Firms' }]
  const span = verifiedSpan(people)
  const senior = SENIOR_ONLY.includes(category.id)
  const who = senior ? 'partners' : 'people'
  const what = key.topic?.kind === 'practice' ? ` for ${key.topic.work} work` : ''

  const facts: Fact[] = [
    { label: 'Firms', value: n(ranked.length) },
    { label: senior ? 'Partners' : 'People', value: n(people.length), note: 'listed here', href: list.peoplePath },
  ]
  if (ranked.length >= 2) facts.push({ label: 'Most partners', value: ranked[0].name, note: `${n(ranked[0].count)} listed`, href: ranked[0].page ? firmPath(category, ranked[0].slug) : undefined })
  facts.push({ label: `Firms with 5 or more`, value: n(ranked.filter((f) => f.count >= 5).length) })

  const faq = firmListFaq({ category, key, ranked, verified: span })
  const near = nearby(key, b.set.pages)
  const byPath = new Map(b.fl.lists.map((x) => [x.path, x]))
  const asList = (paths: string[]) => paths.flatMap((p) => (byPath.get(`${p}/firms`)?.indexable ? [byPath.get(`${p}/firms`)!] : []))
  const otherLists = [...asList(near.samePlace.map((l) => l.path)), ...(key.topic || key.place ? [] : b.fl.lists.filter((x) => x.path !== path && x.indexable && !x.key.place))]
  const placeLists = asList(near.sameTopic.map((l) => l.path))

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: list.title, path } : c)))) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(firmItemListJsonLd(list.title, path, ranked, category)) }} />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <h1 className={`mt-3 ${DIR_H1}`}>{list.title}</h1>
            <p className={`mt-2 max-w-[68ch] ${DIR_LEDE}`}>{b.sentence}</p>
            <p className="mt-3 font-ui text-[13.5px]">
              <Link prefetch={false} href={list.peoplePath} className="font-semibold text-foreground underline underline-offset-2">
                See all {n(people.length)} {peoplePhrase(category, key)}
                {where}, by name
              </Link>
            </p>
            <QuickFacts facts={facts} />
            <Verified span={span} className="mt-2" />
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-6 lg:px-6">
          <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-10">
              <section aria-labelledby="firm-ranking">
                <SectionHead id="firm-ranking" title={`${list.title}, ranked`} aside={`${n(ranked.length)} firms`} />
                <p className="mb-1 font-ui text-[12.5px] leading-relaxed text-foreground/70">
                  Ranked by the number of {who} each firm&rsquo;s own website lists{what}
                  {where}. A count, not a rating; firms with the same number share a rank.
                </p>
                <FirmRanking category={category} firms={ranked} peopleHref={peopleHref} label={list.title} />
              </section>

              <FaqList items={faq} title="Questions" />

              <DirectoryCta />
              <p className="max-w-[70ch] font-ui text-[12.5px] leading-relaxed text-muted-foreground">
                Counts come from each firm&rsquo;s own public bio pages. Nobody pays to be listed or to rank. <AboutLine />
              </p>
            </div>
            <aside className="min-w-0 space-y-6" aria-label="Related pages">
              <RelatedLinks
                stack
                groups={[
                  { title: key.place ? `Other rankings in ${key.place.name}` : 'Other rankings', items: otherLists.slice(0, 10).map((x) => ({ href: x.path, title: x.title, count: x.firms })) },
                  { title: key.topic ? 'In other places' : 'By city', items: (key.topic ? placeLists : b.fl.lists.filter((x) => x.indexable && x.key.place && !x.key.topic)).slice(0, 10).map((x) => ({ href: x.path, title: x.title, count: x.firms })) },
                ]}
              />
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
