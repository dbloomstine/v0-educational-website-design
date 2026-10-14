import { Metadata } from 'next'
import { EDITOR, SOCIAL } from '@/lib/brand/social'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { EventsRail, LatestRail, SectionBlock } from '@/components/home/Rail'
import { LeagueStrip } from '@/components/home/LeagueStrip'
import { LeadStory, SectionFlag, TopStory } from '@/components/story/StoryBlocks'
import { StickySubscribeBar } from '@/components/news/StickySubscribeBar'
import { InTheNews } from '@/components/home/InTheNews'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { firmsInTheNews } from '@/lib/news/firms'
import { FundraisingChart } from '@/components/charts/FundraisingChart'
import { loadLeagueReport } from '@/lib/news/league-data'
import { chartData } from '@/lib/news/chart-views'
import { biggestRaises } from '@/lib/news/league'
import { getEventFeed } from '@/lib/events/api'
import { loadStories } from '@/lib/news/front-page'
import { composeFrontPage, rankSection } from '@/lib/news/stories'
import { SECTIONS, sectionHref, storyInSection } from '@/lib/news/sections'
import type { IndustryEvent } from '@/lib/events/types'

// The front page's title is the one a search result shows for the brand: under
// 60 characters (it was 76, and cut), brand first, "private markets news" in it.
// `lib/__tests__/site-title.test.ts` holds the limit.
export const metadata: Metadata = {
  title: { absolute: 'FundOpsHQ — Private Markets News and Daily Newsletter' },
  description:
    'Private markets news for GPs, LPs, and fund service providers: fund closes, deals, people moves and events, with the FundOps Daily morning newsletter.',
  openGraph: {
    title: 'FundOpsHQ — Private Markets News and Daily Newsletter',
    description:
      'The hub for the investment funds industry. Real-time fund news, the industry events calendar, and a morning newsletter — built for GPs, LPs, and fund service providers across private markets.',
    type: 'website',
    url: 'https://fundopshq.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundOpsHQ — Private Markets News and Daily Newsletter',
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
    name: EDITOR.name,
    url: EDITOR.href,
    sameAs: [EDITOR.href],
  },
  // The organisation's own accounts (lib/brand/social.ts); the founder's profile is his, above.
  sameAs: SOCIAL.map((x) => x.href),
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
  // Stories and the league throw if they cannot be had: this page is cached,
  // and failing to rebuild it keeps the last good copy on the site, where
  // rendering it empty would put the empty copy there for ten minutes.
  const [stories, league, events] = await Promise.all([
    loadStories(),
    loadLeagueReport(),
    // The week ahead, at most two a day: six events all happening this
    // afternoon say less than a spread across the week.
    getEventFeed({ when: '1w', limit: 40 })
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
  const chart = chartData(league, nowMs)
  // The biggest raises come from the league, like the chart: one definition
  // of a close on the page. They lead the page (Danny, 2026-10-14: "League
  // table up top"), so the rail no longer repeats them as "Largest closes".
  const raises = biggestRaises(league.closes, nowMs)
  const inTheNews = firmsInTheNews(stories, nowMs, 7, 10)
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
        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-4 lg:px-6">
          <InTheNews firms={inTheNews} />
          <SponsorStrip className="mb-5" />

          {/* ─── Front: the league strip, lead + top stories, with the running rail ───
              On a desk the strip runs across the top of both columns. On a
              phone the document order holds: the lead opens the page, the
              strip follows it, then the top stories. */}
          <div className="grid gap-x-9 gap-y-6 lg:grid-cols-[minmax(0,1fr)_332px] lg:grid-rows-[auto_auto_auto_1fr]">
            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              {front.lead ? (
                <LeadStory story={front.lead} />
              ) : (
                <p className="font-news text-lg text-muted-foreground">
                  The newsroom is catching up. The full feed is at <a href="/news" className="underline">Latest</a>.
                </p>
              )}
            </div>

            <LeagueStrip raises={raises} className="min-w-0 lg:col-span-2 lg:row-start-1" />

            {front.top.length > 0 && (
              <section aria-label="Top stories" className="min-w-0 lg:col-start-1 lg:row-start-3">
                <SectionFlag label="Top stories" />
                <div className="col-rule grid gap-x-10 gap-y-4 sm:grid-cols-2">
                  {front.top.map((s) => (
                    <TopStory key={s.id} story={s} />
                  ))}
                </div>
              </section>
            )}

            {/* The running rail. After the top stories in the document so a
                phone shows it next; on a desk it is the right column. */}
            <aside className="min-w-0 space-y-5 lg:col-start-2 lg:row-span-3 lg:row-start-2">
              {/* The chart leads the rail: it is the one thing on the page a
                  reader can play with, so it sits where it is seen first. */}
              <FundraisingChart {...chart} href="/league-tables" />
              <SponsorCard />
              <LatestRail stories={front.latest.slice(0, LATEST_COUNT)} />
              <EventsRail events={events} />
            </aside>

            {/* By story type — under the top stories, beside the rail */}
            <div className="min-w-0 pt-2 lg:col-start-1 lg:row-start-4">
              <div className="col-rule grid gap-x-10 gap-y-8 sm:grid-cols-2">
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
        </div>

        {/* ─── By asset class: its own zone, on the deeper band ─── */}
        {assetBlocks.length > 0 && (
          <div className="band band-top">
            <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-6 lg:px-6">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="font-news text-[24px] font-medium leading-none tracking-[-0.01em] text-foreground">By asset class</h2>
                <span className="font-ui text-[12px] text-muted-foreground">The same stories, by market</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {assetBlocks.map(({ section, picks }) => (
                  <SectionBlock
                    key={section.slug}
                    label={section.title}
                    href={sectionHref(section.slug)}
                    stories={picks}
                    moreLabel={section.more}
                    panel
                  />
                ))}

                {/* How the page is made. Said once, plainly, where a reader
                    who has got this far would look for it. */}
                <section aria-label="About this page" className="panel-ink">
                  <h2 className="font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em]">How this page is made</h2>
                  <p className="mt-2 font-news text-[15px] leading-[1.4] opacity-85">
                    Stories are gathered every hour from more than 200 publications, grouped so one event is one
                    line, and ranked by size, breadth of coverage and recency. Every headline links to its publisher.
                  </p>
                  <p className="mt-2 font-news text-[15px] leading-[1.4] opacity-85">
                    Edited by Danny Bloomstine.{' '}
                    <a href="/about" className="font-semibold underline underline-offset-2">About FundOpsHQ</a>
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
      <BackToTop />
      <StickySubscribeBar />
    </div>
  )
}
