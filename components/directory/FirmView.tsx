import type { Metadata } from 'next'
import Link from 'next/link'
import { DIR_H1, DIR_LEDE } from '@/components/directory/hero'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutLine, Crumbs, FirmsRail, Pager, PersonList, Verified } from '@/components/directory/parts'
import { FirmMark } from '@/components/directory/FirmMark'
import { OUTBOUND } from '@/components/story/StoryLink'
import { loadPeople } from '@/lib/directory/data'
import { FIRM_MIN, firmPath, firmTitle, firmsIndexPath, firmsOf, firmsWithPages, peopleAtFirm, type FirmSummary } from '@/lib/directory/firms'
import { firmListSet, rankFirms } from '@/lib/directory/firm-lists'
import { LANDING_MIN, allLandings, peopleFor, itemListJsonLd, pageHref, paginate, parsePage, PAGE_SIZE } from '@/lib/directory/landing'
import { logoFor, monogram } from '@/lib/directory/logos'
import { displayDomain, firmUrl, isPublic, listJoin, verifiedSpan } from '@/lib/directory/people'
import { DIRECTORY_PATH, SENIOR_ONLY, directoryEnabled, lowerNoun, type Category } from '@/lib/directory/taxonomy'
import { brandedTitle, breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

/**
 * A firm inside the directory (2026-10-24 night): /placement-agents/firms/evercore, "Placement Agents at Evercore".
 * Crunchbase's organisation page and Chambers' firm page for structure: the mark and the name, what the firm's people
 * here add up to (how many, how senior, where, on what), the people themselves, and the firm's own website. Facts only, each one counted from the list below it.
 *
 * Exists with FIRM_MIN people or more; indexed with LANDING_MIN (eight since 2026-10-24) or more (a thin page is still useful to a reader who
 * clicked a firm's name, but not one to offer a search engine).
 */

const SITE = 'https://fundopshq.com'
const n = (x: number) => x.toLocaleString('en-US')

async function build(category: Category, slug: string, rawPage?: string | string[]) {
  if (!directoryEnabled() || !category.live) return null
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  const all = await loadPeople(category.id)
  const firms = firmsOf(all, category)
  const firm = firms.find((f) => f.slug === slug)
  if (!firm || firm.count < FIRM_MIN) return null
  const people = peopleAtFirm(all, firm.domain)
  const paged = paginate(people, parsePage(rawPage))
  if (!paged) return null
  return { all, firms, firm, people, paged, path: firmPath(category, firm.slug), title: firmTitle(category, firm.name) }
}

/** "35 placement agents at Evercore are listed, 28 of them partners or managing directors. Offices: New York (30) and Boston (3). The practices they list most: secondaries (12) and private credit funds (4)." */
export function firmSentence(category: Category, f: FirmSummary): string {
  const parts = [`${n(f.count)} ${lowerNoun(category, f.count)} at ${f.name} ${f.count === 1 ? 'is' : 'are'} listed${f.senior ? `, ${n(f.senior)} of them partners or managing directors` : ''}.`]
  if (f.cities.length) parts.push(`${f.cities.length === 1 ? 'Office' : 'Offices'}: ${listJoin(f.cities.slice(0, 4).map((c) => `${c.label} (${n(c.count)})`))}${f.cities.length > 4 ? ` and ${f.cities.length - 4} more` : ''}.`)
  if (f.practices.length) parts.push(`The practices they list most: ${listJoin(f.practices.slice(0, 3).map((p) => `${p.label.toLowerCase().replace(/\bnav\b/, 'NAV').replace(/\bgp\b/, 'GP')} (${n(p.count)})`))}.`)
  return parts.join(' ')
}

export async function firmMetadata(category: Category, slug: string, page?: string | string[]): Promise<Metadata> {
  const b = await build(category, slug, page)
  if (!b) return { title: 'Not found', robots: { index: false } }
  const description = metaDescription(firmSentence(category, b.firm))
  const at = pageHref(b.path, b.paged.page)
  const pageNote = b.paged.page > 1 ? ` (page ${b.paged.page})` : ''
  const counted = `${b.title}: ${n(b.firm.count)} ${SENIOR_ONLY.includes(category.id) ? 'Partners' : 'People'}`
  return {
    title: { absolute: brandedTitle(`${counted.length + pageNote.length <= 60 ? counted : b.title}${pageNote}`) },
    description: b.paged.page > 1 ? metaDescription(`Page ${b.paged.page}: ${firmSentence(category, b.firm)}`) : description,
    alternates: { canonical: `${SITE}${at}` },
    robots: b.firm.count >= LANDING_MIN ? undefined : { index: false, follow: true },
    ...shareCard(`${b.title} | FundOpsHQ`, description, at),
  }
}

export async function FirmView({ category, slug, page }: { category: Category; slug: string; page?: string | string[] }) {
  const b = await build(category, slug, page)
  if (!b) notFound()
  const { firm, paged, path, title } = b
  // One read: the trade's cached list, the same one its hub uses (lib/directory/data.ts loadPeople). No second
  // query on a cold cache: the news firm pages and the cross-trade summary are left to the firm's own /firm page.
  const site = firmUrl(firm.domain)
  const landings = allLandings(category, b.all)
  const cityPage = (key: string) => landings.find((l) => !l.topic && l.place?.kind === 'city' && l.place.slug === key)?.path
  const practicePage = (key: string) => landings.find((l) => l.topic?.kind === 'practice' && l.topic.id === key && !l.place)?.path
  const others = firmsWithPages(b.firms).filter((f) => f.domain !== firm.domain)
  // Where the firm stands in each national firm ranking it is on (lib/directory/firm-lists.ts): a count's rank, a fact.
  const standings = firmListSet(category, b.all)
    .lists.filter((x) => x.indexable && !x.key.place)
    .flatMap((x) => {
      const ranked = rankFirms(x.key.topic ? peopleFor(b.all, x.key) : b.all.filter((p) => isPublic(p)), b.firms)
      const me = ranked.find((r) => r.domain === firm.domain)
      return me ? [{ label: x.title, rank: me.rank, of: ranked.length, href: x.path }] : []
    })
    .sort((a, b2) => a.rank - b2.rank || a.label.localeCompare(b2.label, 'en'))
  const crumbs = [
    { name: 'Directory', path: DIRECTORY_PATH },
    { name: category.plural, path: `/${category.slug}` },
    { name: 'Firms', path: firmsIndexPath(category) },
    { name: firm.name },
  ]
  const logo = logoFor(firm.domain)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: c.name, path } : c)))) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: firm.name,
            ...(site ? { url: site } : {}),
            ...(logo ? { logo: `${SITE}${logo.src}` } : {}),
          }),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(title, pageHref(path, paged.page), paged.items, (paged.page - 1) * PAGE_SIZE)) }} />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-6 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <FirmMark name={firm.name} logo={logo} mono={monogram(firm.name)} size="lg" eager className="border border-border bg-card" />
              <div className="min-w-0">
                <h1 className={`${DIR_H1}`}>{title}</h1>
                <p className={`mt-2 max-w-[75ch] ${DIR_LEDE}`}>{firmSentence(category, firm)}</p>
                <Verified span={verifiedSpan(b.people)} against={displayDomain(firm.domain)} className="mt-2" />
                <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-ui text-[13px] font-semibold">
                  {site && (
                    <a href={site} {...OUTBOUND} className="inline-flex items-center gap-1 text-foreground underline underline-offset-2">
                      {displayDomain(firm.domain)}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </p>
              </div>
            </div>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-5 lg:px-6">
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section aria-labelledby="firm-people" className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-1.5">
                <h2 id="firm-people" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                  A to Z by surname
                </h2>
                <p className="font-ui text-[12.5px] text-foreground/70">
                  {paged.pages > 1 ? `${n((paged.page - 1) * PAGE_SIZE + 1)}–${n((paged.page - 1) * PAGE_SIZE + paged.items.length)} of ` : ''}
                  {n(b.people.length)} people
                </p>
              </div>
              <PersonList people={paged.items} label={title} firms={b.firms} path={`/${category.slug}`} hideFirm />
              <Pager path={path} page={paged.page} pages={paged.pages} />
              <p className="mt-5 font-ui text-[13px] text-foreground/80">
                <Link prefetch={false} href={`/${category.slug}?firm=${encodeURIComponent(firm.domain)}`} className="font-semibold text-foreground underline underline-offset-2">
                  Search and filter {firm.name}&rsquo;s {category.plural.toLowerCase()}
                </Link>
              </p>
              <p className="mt-4 font-ui text-[12.5px] text-muted-foreground">
                Facts from {displayDomain(firm.domain)}, in surname order. Nobody pays to be listed or to rank. <AboutLine />
              </p>
            </section>

            <aside className="min-w-0 space-y-6" aria-label={`More about ${firm.name}`}>
              {firm.cities.length >= 2 && (
                <Facts title="Offices" items={firm.cities.map((c) => ({ label: c.label, count: c.count, href: cityPage(c.key) ? `/${category.slug}?firm=${encodeURIComponent(firm.domain)}&city=${c.key}` : undefined }))} />
              )}
              {firm.practices.length >= 2 && (
                <Facts title="Practices" items={firm.practices.map((p) => ({ label: p.label, count: p.count, href: practicePage(p.key) ? `/${category.slug}?firm=${encodeURIComponent(firm.domain)}&practice=${p.key}` : undefined }))} />
              )}
              {standings.length > 0 && (
                <section aria-label="Firm rankings">
                  <h2 className="mb-1 border-t-2 border-foreground pt-1.5 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">Firm rankings</h2>
                  <p className="mb-1 font-ui text-[12px] leading-snug text-foreground/65">By partners listed for each practice: a count, not a rating.</p>
                  <ul>
                    {standings.slice(0, 8).map((x) => (
                      <li key={x.href} className="border-b border-border/60 last:border-0">
                        <Link prefetch={false} href={x.href} className="flex items-baseline justify-between gap-3 py-[6px] font-news text-[15.5px] leading-snug text-foreground hover:underline">
                          <span>{x.label}</span>
                          <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-foreground/65">
                            #{x.rank} of {x.of}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <FirmsRail category={category} firms={others} title="Other firms" max={8} allHref={firmsIndexPath(category)} />
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function Facts({ title, items }: { title: string; items: { label: string; count: number; href?: string }[] }) {
  if (items.length < 2) return null
  return (
    <section aria-label={title}>
      <h2 className="mb-1 border-t-2 border-foreground pt-1.5 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">{title}</h2>
      <ul>
        {items.map((i) => (
          <li key={i.label} className="flex items-baseline justify-between gap-3 border-b border-border/60 py-[6px] last:border-0">
            {i.href ? (
              <Link prefetch={false} href={i.href} className="font-news text-[15.5px] leading-snug text-foreground hover:underline">
                {i.label}
              </Link>
            ) : (
              <span className="font-news text-[15.5px] leading-snug text-foreground">{i.label}</span>
            )}
            <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-foreground/65">{n(i.count)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── /<trade>/firms ──────────────────────────────────────────────────────────

async function buildIndex(category: Category) {
  if (!directoryEnabled() || !category.live) return null
  const all = await loadPeople(category.id)
  const firms = firmsWithPages(firmsOf(all, category))
  return firms.length >= 2 ? { firms, title: `${category.plural} by Firm` } : null
}

export async function firmsIndexMetadata(category: Category): Promise<Metadata> {
  const b = await buildIndex(category)
  if (!b) return { title: 'Not found', robots: { index: false } }
  const description = metaDescription(`${b.firms.length} firms with ${category.plural.toLowerCase()} listed in the FundOpsHQ directory, each with its people, offices and practices. ${category.intro}`)
  return { title: { absolute: brandedTitle(`${b.title}: ${n(b.firms.length)} Firms`) }, description, alternates: { canonical: `${SITE}${firmsIndexPath(category)}` }, ...shareCard(`${b.title} | FundOpsHQ`, description, firmsIndexPath(category)) }
}

export async function FirmsIndexView({ category }: { category: Category }) {
  const b = await buildIndex(category)
  if (!b) notFound()
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, { name: category.plural, path: `/${category.slug}` }, { name: 'Firms' }]
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: c.name, path: firmsIndexPath(category) } : c)))) }} />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <h1 className={`mt-3 ${DIR_H1}`}>{b.title}</h1>
            <p className={`mt-2 max-w-[72ch] ${DIR_LEDE}`}>
              {n(b.firms.length)} firms, biggest list first. Each page counts the firm&rsquo;s {category.plural.toLowerCase()} listed here, where they sit and what they work on.
            </p>
            <p className="mt-2 font-ui text-[12.5px] text-foreground/70">
              <AboutLine />
            </p>
          </header>
        </div>
        <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-6 lg:px-6">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {b.firms.map((f) => (
              <li key={f.domain}>
                <Link prefetch={false} href={firmPath(category, f.slug)} className="panel group flex h-full items-center gap-3 px-3 py-3 hover:border-foreground/40">
                  <FirmMark name={f.name} logo={logoFor(f.domain)} mono={monogram(f.name)} size="md" decorative />
                  <span className="min-w-0">
                    <span className="block font-news text-[17px] font-semibold leading-snug text-foreground group-hover:underline">{f.name}</span>
                    <span className="block font-ui text-[12.5px] leading-snug text-foreground/70">
                      {n(f.count)} listed{f.cities[0] ? ` · ${f.cities.length > 1 ? `${f.cities[0].label} and ${f.cities.length - 1} more` : f.cities[0].label}` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
