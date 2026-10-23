import { SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { AdSlot } from '@/components/ads/AdSlot'
import { OG_IMAGES } from '@/lib/seo'
import { Panel } from '@/components/story/StoryBlocks'
import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { EventsFinder } from '@/components/events/EventsFinder'
import { EventsBoard } from '@/components/events/EventsBoard'
import Link from 'next/link'
import { getEventFeed } from '@/lib/events/api'
import { EVENT_COLLECTIONS } from '@/lib/events/collections'
import { EventsUpFront } from '@/components/events/EventsUpFront'
import { EventsSignup } from '@/components/events/EventsSignup'
import { mondayEmailLive } from '@/lib/events/weekly-mode'
import { newYorkToday, splitWeeks } from '@/lib/events/highlights'
import type { EventFeedResponse, IndustryEvent } from '@/lib/events/types'
import { eventListJsonLd } from '@/lib/events/event-jsonld'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// Re-rendered on a timer, so the board and its structured data track the
// table without a query per request. The board fetches for itself only when a
// filter is set.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Industry Events Calendar',
  description:
    'The industry events calendar for private markets — conferences, summits, webinars, training, and networking across PE, VC, private credit, real estate, and infrastructure. Curated for GPs, LPs, and fund service providers, with verified dates.',
  openGraph: {
    title: 'Industry Events Calendar | FundOpsHQ',
    description:
      'Conferences, summits, webinars, and networking for the investment funds industry — curated for GPs, LPs, and fund service providers, with verified dates.',
    type: 'website',
    url: 'https://fundopshq.com/events',
    images: OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Industry Events Calendar | FundOpsHQ',
    description:
      'The industry events calendar for private markets — curated for GPs, LPs, and fund service providers.',
  },
  alternates: {
    canonical: 'https://fundopshq.com/events',
  },
}

/** The board's page size. The server sends the first page with the HTML. */
const BOARD_PAGE_SIZE = 100

export default async function EventsPage() {
  // The unfiltered board is fetched here, with the page, and handed to the
  // client board: the plain /events URL arrives with its events in it instead
  // of a skeleton waiting on a second request (which, on 2026-10-02, hung for
  // minutes while the database was busy). Soft dependency: if this fails the
  // page still renders and the board fetches for itself.
  let initial: EventFeedResponse | null = null
  try {
    initial = await getEventFeed({ limit: BOARD_PAGE_SIZE, offset: 0 })
  } catch {
    // the client board fetches on its own
  }
  const jsonLdEvents: IndustryEvent[] = initial?.events.slice(0, 25) ?? []
  // This week and next first (2026-10-22): the first hundred upcoming events cover well over two weeks.
  const { thisWeek, nextWeek } = splitWeeks(initial?.events ?? [], newYorkToday())

  return (
    <div className="flex min-h-screen flex-col">
      {jsonLdEvents.length > 0 && (
        <script
          type="application/ld+json"
          // schema.org Event markup for the next ~25 events, built as each event's own page builds it
          // (lib/events/event-jsonld.ts, 2026-10-22); each Event's url is its page here, no longer the organizer's.
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(eventListJsonLd('Upcoming private markets industry events', 'https://fundopshq.com/events', jsonLdEvents)),
          }}
        />
      )}
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <div className="mx-auto max-w-[1320px] px-4 pb-5 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Events</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
              Conferences, forums, training and webinars for private markets across North America — every date
              verified at the organizer.{' '}
              {/* For organizers: a link, not the page's strongest button (2026-10-22 design critique). */}
              <Link href="/events/submit" className="whitespace-nowrap font-ui text-[13.5px] font-semibold text-foreground underline underline-offset-2 hover:no-underline">
                Hosting one? Submit it free
              </Link>
            </p>
            <EventsFinder facets={initial?.facets ?? null} />
          </div>
        </div>

        <section className="relative">
          <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
            {/* The sponsor strip (or the house notice) heads the list on a desk. On a phone and a tablet it waits
                until after this week's events (2026-10-22 design review): the page's job is finding an event, and
                it was the third block a phone reader saw. */}
            <SponsorStrip className={initial ? 'mb-5 hidden lg:block' : 'mb-5'} />
            {initial && <EventsUpFront thisWeek={thisWeek} nextWeek={nextWeek} afterThisWeek={<SponsorStrip />} />}
            {/* Google's unit under the weeks (lib/ads/config.ts); the sponsor strip above keeps its place. Nothing unless live. */}
            <AdSlot placement="events" className="mt-5" />
            <EventsSignup city={null} monday={mondayEmailLive()} className="my-5" />
            <h2 id="board" className="mb-3 scroll-mt-14 font-news text-[24px] font-medium leading-none tracking-[-0.01em] text-foreground">
              All upcoming events
            </h2>
            <EventsBoard initial={initial} />

            {/* Browse collections — internal-link surface for the landing pages */}
            <div className="mt-8">
              <Panel label="Browse by city and topic">
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2">
                  {EVENT_COLLECTIONS.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/events/${c.slug}`}
                      className="font-news text-[15px] text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground"
                    >
                      {c.title.replace(' | FundOpsHQ', '')}
                    </Link>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
