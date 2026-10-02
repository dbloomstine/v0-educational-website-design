import { SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { OG_IMAGES } from '@/lib/seo'
import { Panel } from '@/components/story/StoryBlocks'
import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { EventsBoard } from '@/components/events/EventsBoard'
import Link from 'next/link'
import { getEventFeed } from '@/lib/events/api'
import { EVENT_COLLECTIONS } from '@/lib/events/collections'
import type { EventFeedResponse, IndustryEvent } from '@/lib/events/types'

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

// schema.org Event markup for the next ~25 events — this is what lets the
// board rank for searches like "private equity events new york".
function buildEventsJsonLd(events: IndustryEvent[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Upcoming private markets industry events',
    url: 'https://fundopshq.com/events',
    itemListElement: events.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: e.name,
        startDate: e.startDate,
        ...(e.endDate ? { endDate: e.endDate } : {}),
        eventAttendanceMode:
          e.eventFormat === 'virtual'
            ? 'https://schema.org/OnlineEventAttendanceMode'
            : e.eventFormat === 'hybrid'
              ? 'https://schema.org/MixedEventAttendanceMode'
              : 'https://schema.org/OfflineEventAttendanceMode',
        location:
          e.eventFormat === 'virtual'
            ? { '@type': 'VirtualLocation', url: e.eventUrl }
            : {
                '@type': 'Place',
                name: e.venue ?? e.city ?? 'TBA',
                address: {
                  '@type': 'PostalAddress',
                  ...(e.city ? { addressLocality: e.city } : {}),
                  ...(e.stateRegion ? { addressRegion: e.stateRegion } : {}),
                  ...(e.country ? { addressCountry: e.country } : {}),
                },
              },
        organizer: { '@type': 'Organization', name: e.organizerName },
        url: e.eventUrl,
      },
    })),
  }
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

  return (
    <div className="flex min-h-screen flex-col">
      {jsonLdEvents.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildEventsJsonLd(jsonLdEvents)) }}
        />
      )}
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pb-4 pt-5 lg:px-6">
            <div>
              <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Events</h1>
              <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
                Conferences, forums, training and webinars for private markets across North America — every date
                verified at the organizer.
              </p>
            </div>
            <Link
              href="/events/submit"
              className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 font-ui text-[12px] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-foreground/85"
            >
              Submit an event — free
            </Link>
          </div>
        </div>

        <section className="relative">
          <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
            <SponsorStrip className="mb-5" />
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
