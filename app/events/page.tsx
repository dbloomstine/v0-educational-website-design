import { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { EventsBoard } from '@/components/events/EventsBoard'
import Link from 'next/link'
import { queryEventFeed } from '@/lib/events/api'
import { EVENT_COLLECTIONS } from '@/lib/events/collections'
import type { IndustryEvent } from '@/lib/events/types'

// Re-render hourly so the server-side JSON-LD tracks the live table without
// a query per request. The interactive board still fetches client-side.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Industry Events Calendar | FundOpsHQ',
  description:
    'The industry events calendar for private markets — conferences, summits, webinars, training, and networking across PE, VC, private credit, real estate, and infrastructure. Curated for GPs, LPs, and fund service providers, with verified dates.',
  openGraph: {
    title: 'Industry Events Calendar | FundOpsHQ',
    description:
      'Conferences, summits, webinars, and networking for the investment funds industry — curated for GPs, LPs, and fund service providers, with verified dates.',
    type: 'website',
    url: 'https://fundopshq.com/events',
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

export default async function EventsPage() {
  // Soft dependency: the page must render even if the DB hiccups.
  let jsonLdEvents: IndustryEvent[] = []
  try {
    const feed = await queryEventFeed({ limit: 25 })
    jsonLdEvents = feed.events
  } catch {
    // no structured data this render — the client board fetches on its own
  }

  return (
    <div className="flex min-h-screen flex-col">
      {jsonLdEvents.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildEventsJsonLd(jsonLdEvents)) }}
        />
      )}
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="relative border-t-2 border-foreground/15 bg-background">
          {/* Editorial section masthead */}
          <div className="border-b border-foreground/10">
            <div className="container mx-auto max-w-[1400px] px-4">
              <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-3">
                  <span className="text-foreground/80">Section B</span>
                  <span aria-hidden="true" className="text-foreground/20">·</span>
                  <span>The Circuit</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-400/90">Updated Weekly</span>
                </span>
              </div>
            </div>
          </div>

          <div className="container mx-auto max-w-[1400px] px-4 py-10 sm:py-14">
            <div className="mb-8 grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <h1
                  className="font-display text-foreground"
                  style={{
                    fontSize: 'clamp(36px, 5vw, 64px)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  The industry calendar,
                  <br />
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                  >
                    curated for fund ops.
                  </span>
                </h1>
              </div>
              <div className="lg:col-span-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed">
                  Conferences · Summits · Forums<br />
                  Webinars · Training · Networking<br />
                  <span className="text-foreground/70">Every date verified at the source.</span>
                </p>
                <Link
                  href="/events/submit"
                  className="mt-4 inline-flex items-center gap-2 rounded-sm border border-amber-400/50 bg-amber-400/10 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 transition-colors hover:bg-amber-400/20 hover:border-amber-400"
                >
                  Submit an event — free
                </Link>
              </div>
            </div>

            <Suspense fallback={<EventsBoardSkeleton />}>
              <EventsBoard />
            </Suspense>

            {/* Browse collections — internal-link surface for the landing pages */}
            <div className="mt-12 border-t border-foreground/10 pt-6">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                Browse
              </span>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {EVENT_COLLECTIONS.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/events/${c.slug}`}
                    className="text-[12px] text-muted-foreground hover:text-amber-400 transition-colors"
                  >
                    {c.title.replace(' | FundOpsHQ', '')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function EventsBoardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 flex-1 rounded-lg bg-muted" />
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="h-8 w-24 rounded-lg bg-muted" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 border-b border-border/40 px-3 py-2.5">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
