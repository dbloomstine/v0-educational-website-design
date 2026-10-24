import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Crumbs } from '@/components/directory/parts'
import { FirmMark } from '@/components/directory/FirmMark'
import { DirectoryFinder } from '@/components/directory/DirectoryFinder'
import { DIR_LEDE, PopularLinks, TrustStrip } from '@/components/directory/hero'
import { loadFinder } from '@/lib/directory/data'
import type { MatrixRow, TradeCard } from '@/lib/directory/finder'
import { finderMeta, matchFinder, peopleSearches } from '@/lib/directory/finder-match'
import { logoFor, monogram } from '@/lib/directory/logos'
import { listJoin } from '@/lib/directory/people'
import { CATEGORIES, CATEGORY_IDS, DIRECTORY_ABOUT_PATH, DIRECTORY_PATH, LIVE_CATEGORIES, directoryEnabled, type CategoryId } from '@/lib/directory/taxonomy'
import { brandedTitle, breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// /directory (2026-10-24 night; redesigned the same day as a search-first front page): one box that takes a name, a
// firm, a strategy or a city across every trade, the reasons to trust the lists, the three trades with their firms,
// and the strategy and city tables. Learnt from (structure, not looks; lib/directory/finder.ts says what from each):
// Zocdoc's home and search, Zillow's agent finder, Chambers' practice tables, Crunchbase's discover grid and Airbnb's
// search suggestions. One small cached read (lib/directory/data.ts loadFinder), kept an hour.
//
// Rendered on request, never at build time (a build that prerendered directory pages failed on database timeouts);
// the edge keeps the page (next.config.mjs). ?q=… is the search box without JavaScript: noindexed, canonical to the page.
export const dynamic = 'force-dynamic'

// The live trades only (placement agents and fund finance bankers are hidden). Built from LIVE_CATEGORIES, so a
// trade switched on or off changes the words with it.
const TRADES = listJoin(LIVE_CATEGORIES.map((c) => c.plural.replace(/^Fund /, '').toLowerCase()))
const HEADING = `Fund ${listJoin(LIVE_CATEGORIES.map((c) => c.plural.replace(/^Fund /, '')))}`
const INTRO = `The partners who work on private funds in the US, at the law and accounting firms: fund ${TRADES}. Every profile is drawn from the firm’s own public bio page and links to it. Free to search; nobody pays to be listed or to rank.`

const n = (x: number) => x.toLocaleString('en-US')
const short = (id: CategoryId) => CATEGORIES[id].plural.replace(/^Fund /, '')

type Params = { searchParams: Promise<{ q?: string | string[] }> }
const readQ = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 80) : '')

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  if (!directoryEnabled()) return { title: 'Not found', robots: { index: false } }
  const [f, sp] = await Promise.all([loadFinder(), searchParams])
  const total = f.trust.people
  const description = metaDescription(INTRO)
  const query = Object.keys(sp ?? {}).length > 0
  return {
    // "Directory of Fund Lawyers, Auditors and Tax Advisors" (52): the brand goes on only if it fits in 60.
    title: { absolute: brandedTitle(`Directory of ${HEADING}`) },
    description: total ? metaDescription(`${n(total)} partners listed. ${INTRO}`) : description,
    alternates: { canonical: `https://fundopshq.com${DIRECTORY_PATH}` },
    // Nothing to offer a search engine until someone is listed; a search (?q=) is a view, not a page.
    robots: total && !query ? undefined : { index: false, follow: true },
    ...shareCard('The FundOpsHQ Directory', description, DIRECTORY_PATH),
  }
}

/** A trade's card: what it is, how many, its biggest firms by mark and name, and the two ways in. */
function Trade({ t }: { t: TradeCard }) {
  const c = CATEGORIES[t.id]
  const href = `/${c.slug}`
  return (
    <article aria-labelledby={`dir-${c.slug}`} className="flex flex-col border-t-[3px] border-foreground pt-3">
      <h2 id={`dir-${c.slug}`} className="font-news text-[26px] font-medium leading-tight tracking-[-0.01em] text-foreground">
        <Link href={href} className="hover:underline">
          {c.plural}
        </Link>
      </h2>
      <p className="mt-0.5 font-ui text-[13.5px] font-semibold tabular-nums text-foreground/80">
        {n(t.count)} listed at {n(t.firms)} firms{t.cities ? `, in ${n(t.cities)} cities` : ''}
      </p>
      <p className="mt-2 font-news text-[15.5px] leading-snug text-foreground/80">{c.intro.replace(/, each profile drawn from the firm’s own public bio page\.$/, '.')}</p>
      {t.topFirms.length >= 2 && (
        <ul aria-label={`Firms with the most ${c.plural.toLowerCase()} listed`} className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-3">
          {t.topFirms.map((f) => (
            <li key={f.domain} className="bg-card">
              <Link prefetch={false} href={f.href} className="group flex h-full flex-col items-center gap-1 px-2 pb-2 pt-2.5 text-center hover:bg-background">
                <FirmMark name={f.name} logo={logoFor(f.domain)} mono={monogram(f.name)} size="sm" decorative />
                <span className="line-clamp-1 font-ui text-[12px] font-semibold leading-tight text-foreground group-hover:underline">{f.name}</span>
                <span className="font-ui text-[11.5px] tabular-nums leading-tight text-foreground/65">{n(f.count)} listed</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
        <Link
          href={href}
          className="inline-flex min-h-[40px] items-center rounded-[3px] bg-foreground px-4 font-ui text-[13.5px] font-semibold text-background hover:bg-foreground/85"
        >
          Browse all {n(t.count)}
        </Link>
        <Link prefetch={false} href={`${href}/firms`} className="inline-flex min-h-[40px] items-center font-ui text-[13.5px] font-semibold text-foreground underline underline-offset-2">
          Firms, ranked
        </Link>
      </div>
    </article>
  )
}

/** Practice (or city) by trade, each cell the page and its count: Chambers' practice table, with our basis in words. */
function Matrix({ id, title, caption, rows, trades }: { id: string; title: string; caption: string; rows: MatrixRow[]; trades: CategoryId[] }) {
  if (rows.length < 2) return null
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h2 id={id} className="border-t-[3px] border-foreground pt-3 font-news text-[24px] font-medium leading-tight text-foreground">
        {title}
      </h2>
      <table className="mt-2 w-full border-collapse">
        <caption className="pb-2 text-left font-ui text-[12.5px] text-foreground/70">{caption}</caption>
        <thead>
          <tr className="border-b border-foreground/30">
            <th scope="col" className="py-1.5 pr-2 text-left font-ui text-[12px] font-semibold text-foreground/70">
              <span className="sr-only">{title}</span>
            </th>
            {trades.map((t) => (
              <th key={t} scope="col" className="w-[22%] py-1.5 pl-2 text-right font-ui text-[12px] font-semibold leading-tight text-foreground/80">
                {short(t)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/70">
              <th scope="row" className="py-2 pr-2 text-left font-news text-[16px] font-normal leading-snug text-foreground">
                {r.label}
              </th>
              {trades.map((t) => {
                const cell = r.cells[t]
                return (
                  <td key={t} className="py-1 pl-2 text-right font-ui text-[14px] tabular-nums">
                    {cell ? (
                      <Link
                        prefetch={false}
                        href={cell.path}
                        aria-label={`${cell.title}: ${n(cell.count)} listed`}
                        className="inline-flex min-h-[36px] min-w-[44px] items-center justify-end font-semibold text-foreground underline decoration-foreground/25 underline-offset-[3px] hover:decoration-foreground"
                      >
                        {n(cell.count)}
                      </Link>
                    ) : (
                      <span className="text-foreground/35">
                        <span aria-hidden="true">–</span>
                        <span className="sr-only">no page yet</span>
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default async function DirectoryIndex({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const [f, sp] = await Promise.all([loadFinder(), searchParams])
  const q = readQ(sp?.q)
  const trades = f.trades.map((t) => t.id)
  const liveTrades = f.trades.map((t) => ({ plural: CATEGORIES[t.id].plural, slug: CATEGORIES[t.id].slug }))
  const results = q ? matchFinder(f.entries, q, 12) : []
  const coming = CATEGORY_IDS.filter((id) => CATEGORIES[id].live && !trades.includes(id))
  const t = f.trust
  const seniorShare = t.people ? Math.round((t.senior / t.people) * 100) : 0

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: 'Directory', path: DIRECTORY_PATH }])) }} />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-7 pt-5 lg:px-6">
            <Crumbs crumbs={[{ name: 'Directory' }]} />
            <div className="mt-4 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div className="min-w-0 max-w-[780px]">
                <h1 className="font-news text-[34px] font-medium leading-[1.02] tracking-[-0.022em] text-foreground sm:text-[50px]">{HEADING}</h1>
                <p className={`mt-3 max-w-[64ch] ${DIR_LEDE}`}>
                  The partners who work on private funds at US law and accounting firms, each drawn from the firm&rsquo;s own bio page. Free to search;
                  nobody pays to be listed or to rank.
                </p>
                <div className="mt-6">
                  <DirectoryFinder entries={f.entries} popular={f.popular} trades={liveTrades} initial={q} />
                </div>
              </div>
              {f.trades.length > 0 && (
                <dl aria-label="Listed in the directory" className="grid grid-cols-3 border-y border-foreground/20 lg:grid-cols-1 lg:border-y-0 lg:border-l lg:pl-6">
                  {f.trades.map((x, i) => (
                    <div key={x.id} className={`flex min-w-0 flex-col py-2.5 ${i > 0 ? 'border-l border-foreground/15 pl-3 lg:border-l-0 lg:border-t lg:pl-0' : ''}`}>
                      <dt className="mt-1 font-ui text-[12.5px] font-semibold leading-tight text-foreground/70">{CATEGORIES[x.id].plural}</dt>
                      <dd className="order-first font-news text-[26px] font-medium leading-none tabular-nums text-foreground sm:text-[30px]">
                        <Link href={`/${CATEGORIES[x.id].slug}`} className="hover:underline">
                          {n(x.count)}
                        </Link>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {q ? (
              <section aria-labelledby="dir-results" className="mt-6 max-w-[780px]">
                <h2 id="dir-results" className="font-ui text-[14px] font-semibold text-foreground">
                  {results.length ? `${results.length} ${results.length === 1 ? 'page matches' : 'pages match'} “${q}”` : `No page matches “${q}”. Try a name below, or a strategy or city.`}
                </h2>
                <ul className="mt-2 divide-y divide-border border-y border-border bg-card/60">
                  {results.map((e) => (
                    <li key={e.h}>
                      <Link prefetch={false} href={e.h} className="flex items-baseline justify-between gap-4 px-3 py-2.5 hover:bg-card">
                        <span className="font-news text-[16px] leading-snug text-foreground">{e.t}</span>
                        <span className="shrink-0 font-ui text-[12px] tabular-nums text-foreground/60">{finderMeta(e)}</span>
                      </Link>
                    </li>
                  ))}
                  {peopleSearches(liveTrades, q).map((s) => (
                    <li key={s.href}>
                      <Link prefetch={false} href={s.href} className="flex items-baseline justify-between gap-4 px-3 py-2.5 hover:bg-card">
                        <span className="font-news text-[16px] italic leading-snug text-foreground/85">{s.label}</span>
                        <span className="shrink-0 font-ui text-[12px] text-foreground/60">People, by name</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <PopularLinks items={f.popular} className="mt-4 max-w-[900px]" />
            )}
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-14 pt-6 lg:px-6">
          {t.people > 0 && (
            <TrustStrip
              facts={[
                { title: 'From the firms’ own pages', body: `Every profile is read from the firm’s public bio page and links back to it. ${n(t.firms)} firms so far.` },
                { title: 'Senior people', body: `${seniorShare}% of the ${n(t.people)} listed hold the title partner or managing director.` },
                { title: 'Checked, and dated', body: t.verified ? `Last verified ${t.verified}. Each profile shows the day it was read.` : 'Each profile shows the day it was read.' },
                {
                  title: 'No paid placement',
                  body: (
                    <>
                      Nobody pays to be listed or to rank. Lists run A to Z; rankings count partners.{' '}
                      <Link href={DIRECTORY_ABOUT_PATH} className="font-semibold text-foreground underline underline-offset-2">
                        How it works
                      </Link>
                    </>
                  ),
                },
              ]}
            />
          )}

          {f.trades.length > 0 && (
            <div className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {f.trades.map((x) => (
                <Trade key={x.id} t={x} />
              ))}
            </div>
          )}

          <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-2">
            <Matrix id="dir-strategy" title="By strategy" caption="People listed for each fund strategy, by trade. Each number opens its page." rows={f.strategies} trades={trades} />
            <Matrix id="dir-city" title="By city" caption="People listed in each city, by trade. Each number opens its page." rows={f.cities} trades={trades} />
          </div>

          {f.firms.length >= 4 && (
            <section aria-labelledby="dir-firms" className="mt-12">
              <h2 id="dir-firms" className="border-t-[3px] border-foreground pt-3 font-news text-[24px] font-medium leading-tight text-foreground">
                Firms with the most people listed
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
                {f.firms.map((x) => (
                  <li key={x.domain} className="bg-card">
                    <Link prefetch={false} href={x.href} className="group flex h-full flex-col items-center gap-1.5 px-2 pb-3 pt-3 text-center hover:bg-background">
                      <FirmMark name={x.name} logo={logoFor(x.domain)} mono={monogram(x.name)} size="md" decorative />
                      <span className="line-clamp-2 font-ui text-[13px] font-semibold leading-tight text-foreground group-hover:underline">{x.name}</span>
                      <span className="font-ui text-[12px] leading-tight text-foreground/65">
                        <span className="tabular-nums">{n(x.count)}</span> · {x.trades.map((p) => p.replace(/^Fund /, '')).join(', ')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {coming.length > 0 && (
            <p className="mt-10 border-t border-border pt-3 font-news text-[16px] leading-snug text-foreground/85">
              <span className="font-semibold text-foreground">Being put together:</span> {listJoin(coming.map((id) => CATEGORIES[id].plural.toLowerCase()))}. Each opens
              here once its first profiles are checked.
            </p>
          )}
          <p className="mt-10 max-w-[70ch] border-t border-border pt-4 font-ui text-[12.5px] leading-relaxed text-foreground/70">
            Lists are in surname order, never ranked by anything paid. Anyone listed can claim their profile with a work email at their firm, correct it
            or have it removed from the link on their page. See{' '}
            <Link href={DIRECTORY_ABOUT_PATH} className="underline underline-offset-2">
              how the directory works
            </Link>{' '}
            and the{' '}
            <Link href="/privacy#directory" className="underline underline-offset-2">
              privacy notice
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
