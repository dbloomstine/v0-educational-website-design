import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { HeroSubscribe } from '@/components/home/hero-subscribe'
import { EventsRail, LargestCloses, LatestRail, SectionBlock } from '@/components/home/Rail'
import { LeadStory, SectionFlag, TopStory } from '@/components/story/StoryBlocks'
import { StickySubscribeBar } from '@/components/news/StickySubscribeBar'
import { queryEventFeed } from '@/lib/events/api'
import { getStoriesSafe } from '@/lib/news/front-page'
import { composeFrontPage, rankSection } from '@/lib/news/stories'
import { SECTIONS, sectionHref, storyInSection } from '@/lib/news/sections'
import type { IndustryEvent } from '@/lib/events/types'

export const metadata: Metadata = {
  title: 'FundOpsHQ | News, Events & Daily Newsletter for the Investment Funds Industry',
  description:
    'The hub for the investment funds industry. Real-time fund news, the verified industry events calendar, and the FundOps Daily morning newsletter — across PE, VC, private credit, real estate, and infrastructure.',
  openGraph: {
    title: 'FundOpsHQ | News, Events & Daily Newsletter for the Investment Funds Industry',
    description:
      'The hub for the investment funds industry. Real-time fund news, the industry events calendar, and a morning newsletter — built for GPs, LPs, and fund service providers across private markets.',
    type: 'website',
    url: 'https://fundopshq.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundOpsHQ | News, Events & Daily Newsletter for the Investment Funds Industry',
    description:
      'The hub for the investment funds industry — news, events, and the FundOps Daily newsletter. Built for GPs, LPs, and fund service providers across private markets.',
  },
  alternates: {
    canonical: 'https://fundopshq.com',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FundOpsHQ',
  url: 'https://fundopshq.com',
  logo: 'https://fundopshq.com/icon.svg',
  description:
    'FundOpsHQ is the hub for the investment funds industry — home to the FundOps Daily news feed and morning newsletter. Built for GPs, LPs, and fund service providers across private markets.',
  founder: {
    '@type': 'Person',
    name: 'Danny Bloomstine',
    url: 'https://www.linkedin.com/in/danny-bloomstine/',
  },
  sameAs: ['https://www.linkedin.com/in/danny-bloomstine/'],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FundOpsHQ',
  url: 'https://fundopshq.com',
  description: 'Real-time fund news and the FundOps Daily newsletter — the hub for the investment funds industry.',
  publisher: { '@type': 'Organization', name: 'FundOpsHQ' },
}

// The front page is rebuilt at most every ten minutes; the stories behind it
// are cached on the same clock (lib/news/front-page.ts).
export const revalidate = 600

/** Headlines per section block on the front page. */
const PER_BLOCK = 5
/** The rail: enough to show the day is moving, not so much it outruns the page. */
const LATEST_COUNT = 11

export default async function HomePage() {
  // Both feeds are soft dependencies: the page renders even if the DB hiccups.
  const [stories, events] = await Promise.all([
    getStoriesSafe(),
    // The week ahead, at most two a day: six events all happening this
    // afternoon say less than a spread across the week.
    queryEventFeed({ when: '1w', limit: 40 })
      .then((feed) => {
        const perDay = new Map<string, number>()
        return feed.events
          .filter((e) => {
            const n = perDay.get(e.startDate) ?? 0
            perDay.set(e.startDate, n + 1)
            return n < 2
          })
          .slice(0, 6)
      })
      .catch<IndustryEvent[]>(() => []),
  ])

  const nowMs = Date.now()
  const front = composeFrontPage(stories, nowMs)

  // A story appears once on the page. The lead and top stories claim theirs
  // first; each section block then takes its best stories not yet shown, so
  // "Private equity" is never a repeat of "Fundraising" a few inches up.
  const shown = new Set<string>([front.lead?.id, ...front.top.map((s) => s.id)].filter(Boolean) as string[])
  const blockFor = (section: (typeof SECTIONS)[number], count: number) => {
    const picks = rankSection(
      stories.filter((s) => storyInSection(s, section) && !shown.has(s.id) && !s.roundup),
      nowMs,
    ).slice(0, count)
    picks.forEach((s) => shown.add(s.id))
    return { section, picks }
  }
  // By story type first (they sit beside the rail), then by asset class.
  const typeBlocks = SECTIONS.filter((s) => s.group === 'type').map((s) => blockFor(s, PER_BLOCK)).filter((b) => b.picks.length > 0)
  const assetBlocks = SECTIONS.filter((s) => s.group === 'asset').map((s) => blockFor(s, PER_BLOCK)).filter((b) => b.picks.length > 0)

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <h1 className="sr-only">FundOpsHQ — fund news, events and the FundOps Daily newsletter</h1>
        <HeroSubscribe />

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          {/* ─── Front: lead + top stories, with the running rail ─── */}
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px] lg:grid-rows-[auto_1fr]">
            <div className="min-w-0 lg:col-start-1">
              {front.lead ? (
                <LeadStory story={front.lead} />
              ) : (
                <p className="font-news text-lg text-muted-foreground">
                  The newsroom is catching up. The full feed is at <a href="/news" className="underline">Latest</a>.
                </p>
              )}

              {front.top.length > 0 && (
                <section aria-label="Top stories" className="mt-6">
                  <SectionFlag label="Top stories" />
                  <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {front.top.map((s) => (
                      <TopStory key={s.id} story={s} />
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* The running rail. Second in the document so a phone shows it
                right after the top stories; on a desk it is the right column. */}
            <aside className="min-w-0 space-y-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-border lg:pl-8">
              <LatestRail stories={front.latest.slice(0, LATEST_COUNT)} />
              <LargestCloses stories={front.largestCloses} stats={front.stats} />
              <EventsRail events={events} />
            </aside>

            {/* By story type — under the top stories, beside the rail */}
            <div className="min-w-0 lg:col-start-1">
              <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
                {typeBlocks.map(({ section, picks }) => (
                  <SectionBlock
                    key={section.slug}
                    label={section.title}
                    href={sectionHref(section.slug)}
                    stories={picks}
                    moreLabel={section.more}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ─── By asset class ─── */}
          {assetBlocks.length > 0 && (
            <div className="mt-10 border-t border-border pt-6">
              <p className="mb-4 font-news text-[22px] italic leading-none text-foreground">By asset class</p>
              <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {assetBlocks.map(({ section, picks }) => (
                  <SectionBlock
                    key={section.slug}
                    label={section.title}
                    href={sectionHref(section.slug)}
                    stories={picks}
                    moreLabel={section.more}
                  />
                ))}

                {/* How the page is made. Said once, plainly, where a reader
                    who has got this far would look for it. */}
                <section aria-label="About this page" className="border-t-2 border-foreground pt-1.5">
                  <h2 className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">How this page is made</h2>
                  <p className="mt-2 font-news text-[15px] leading-[1.4] text-foreground/80">
                    Stories are gathered every hour from more than 200 publications, grouped so one event is one
                    line, and ranked by size, breadth of coverage and recency. Every headline links to its publisher.
                  </p>
                  <p className="mt-2 font-news text-[15px] leading-[1.4] text-foreground/80">
                    Edited by Danny Bloomstine.{' '}
                    <a href="/about" className="font-semibold underline underline-offset-2">About FundOpsHQ</a>
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
      <StickySubscribeBar />
    </div>
  )
}
