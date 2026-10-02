import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { Panel, SectionFlag } from '@/components/story/StoryBlocks'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { ARCHIVE_WINDOW_DAYS, loadArchive } from '@/lib/news/front-page'
import { searchFirms } from '@/lib/news/firm-data'
import { firmIndex, firmsByLetter } from '@/lib/news/firms'
import { KIND_LABEL } from '@/lib/news/sections'
import { OG_IMAGES } from '@/lib/seo'

// The way to any firm's page. Browsing lists the firms in this month's
// stories; the search box reaches back a year, to any firm we have carried.

type Params = { searchParams: Promise<{ q?: string }> }

const DESCRIPTION =
  'Every fund manager, investor and service provider in the stories FundOpsHQ has carried — each with a page of its fund closes, deals and people moves.'

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: 'Firms in the news',
    description: DESCRIPTION,
    alternates: { canonical: 'https://fundopshq.com/firms' },
    robots: q ? { index: false, follow: true } : undefined,
    openGraph: { title: 'Firms in the news | FundOpsHQ', description: DESCRIPTION, type: 'website', url: 'https://fundopshq.com/firms', images: OG_IMAGES },
    twitter: { card: 'summary_large_image', title: 'Firms in the news | FundOpsHQ', description: DESCRIPTION, images: OG_IMAGES.map((i) => i.url) },
  }
}

const MOST_COVERED = 20

export default async function FirmsPage({ searchParams }: Params) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 60)
  const [stories, hits] = await Promise.all([loadArchive(), q ? searchFirms(q, 60) : Promise.resolve([])])
  const firms = firmIndex(stories)
  const letters = firmsByLetter(firms)
  const mostCovered = firms.filter((f) => !f.regulator).slice(0, MOST_COVERED)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-4 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Firms</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
              Every manager, investor and service provider in the stories we carry has a page: its fund closes, its
              deals, its people moves. Find one, or browse who has been in the news this month.
            </p>
            <form action="/firms" method="get" role="search" className="mt-3 flex max-w-[640px] items-center gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Find a firm</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Find a firm"
                  className="h-10 w-full rounded-sm border border-foreground/25 bg-card pl-9 pr-3 font-ui text-[14px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
              </label>
              <button type="submit" className="h-10 rounded-sm bg-foreground px-4 font-ui text-[12.5px] font-bold uppercase tracking-[0.06em] text-background hover:bg-foreground/85">
                Find
              </button>
              {q && (
                <Link href="/firms" className="inline-flex h-10 items-center gap-1 px-2 font-ui text-[12.5px] text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </Link>
              )}
            </form>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <div className="min-w-0">
              {q ? (
                <section aria-label="Search results">
                  <SectionFlag label={`Firms matching “${q}”`} note={`${hits.length} found · past year`} />
                  {hits.length === 0 ? (
                    <p className="py-8 font-news text-[17px] text-muted-foreground">
                      No firm by that name in the past year’s stories. Try part of the name — “Ares”, not “Ares Management Corporation”.{' '}
                      <Link href={`/news?q=${encodeURIComponent(q)}`} className="underline underline-offset-2">Search the stories instead</Link>.
                    </p>
                  ) : (
                    <ul className="river">
                      {hits.map((f) => (
                        <li key={f.slug} className="border-b border-border/70 py-[7px] last:border-0">
                          <Link href={`/firm/${f.slug}`} className="hl font-news text-[17px] font-bold leading-snug text-foreground">{f.name}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : (
                <section aria-label="Firms, A to Z">
                  <SectionFlag label="A to Z" note={`${firms.length.toLocaleString('en-US')} firms in the last ${ARCHIVE_WINDOW_DAYS} days’ stories`} />
                  <nav aria-label="Jump to a letter" className="tab-scroll mb-2 mt-2 flex gap-x-1 overflow-x-auto">
                    {letters.map((g) => (
                      <a
                        key={g.letter}
                        href={`#letter-${g.letter === '#' ? 'num' : g.letter}`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-card font-ui text-[12.5px] font-bold text-foreground hover:border-foreground"
                      >
                        {g.letter}
                      </a>
                    ))}
                  </nav>
                  {letters.map((g) => (
                    <div key={g.letter} id={`letter-${g.letter === '#' ? 'num' : g.letter}`} className="scroll-mt-16">
                      <h2 className="day-head">{g.letter === '#' ? '0–9' : g.letter}</h2>
                      <ul className="columns-1 gap-x-8 pb-1 pt-1 sm:columns-2 xl:columns-3">
                        {g.firms.map((f) => (
                          <li key={f.slug} className="break-inside-avoid py-[3px]">
                            <Link href={`/firm/${f.slug}`} className="font-news text-[15.5px] leading-snug text-foreground underline-offset-[3px] hover:underline">
                              {f.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="mt-5 font-ui text-[12.5px] text-muted-foreground">
                    A firm that has not been in the news this month still has its page — find it with the search box above.
                  </p>
                </section>
              )}
            </div>

            <aside className="min-w-0 space-y-5">
              {mostCovered.length > 0 && (
                <Panel label="Most covered" note={`Past ${ARCHIVE_WINDOW_DAYS} days`}>
                  <ol>
                    {mostCovered.map((f, i) => (
                      <li key={f.slug} className="border-b border-border/70 last:border-0">
                        <Link href={`/firm/${f.slug}`} className="group grid grid-cols-[20px_minmax(0,1fr)_auto] items-baseline gap-2 py-[7px]">
                          <span className="font-mono text-[10.5px] text-muted-foreground">{i + 1}</span>
                          <span className="min-w-0">
                            <span className="hl font-news text-[15px] font-bold leading-tight text-foreground">{f.name}</span>
                            <span className="block truncate font-ui text-[11.5px] text-muted-foreground">Mostly {KIND_LABEL[f.topKind].toLowerCase()}</span>
                          </span>
                          <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
                            {f.stories} {f.stories === 1 ? 'story' : 'stories'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </Panel>
              )}
              <SponsorCard />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
