import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { HeroSubscribe } from '@/components/home/hero-subscribe'
import { NewsFeed } from '@/components/news/NewsFeed'
import { HomeEventsStrip } from '@/components/events/HomeEventsStrip'
import { queryEventFeed } from '@/lib/events/api'
import type { IndustryEvent } from '@/lib/events/types'
import { StickySubscribeBar } from '@/components/news/StickySubscribeBar'

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
  sameAs: [
    'https://www.linkedin.com/in/danny-bloomstine/',
  ],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FundOpsHQ',
  url: 'https://fundopshq.com',
  description:
    'Real-time fund news and the FundOps Daily newsletter — the hub for the investment funds industry.',
  publisher: {
    '@type': 'Organization',
    name: 'FundOpsHQ',
  },
}

// Refresh the server-rendered events strip every 15 minutes
export const revalidate = 900

export default async function HomePage() {
  // Section B strip — the page must render even if the DB hiccups
  let upcomingEvents: IndustryEvent[] = []
  try {
    const feed = await queryEventFeed({ when: '60d', limit: 14 })
    upcomingEvents = feed.events
  } catch {
    // strip hides itself when empty
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ─── Compact hub hero (slim band + inline subscribe) ─── */}
        <HeroSubscribe />

        {/* ─── The hub: Wire (news) + Circuit (events) side by side ───
            Density is the point: both datasets visible the moment the
            page loads, Gary's Guide-style, in the editorial skin. */}
        <div className="border-t border-foreground/10 bg-background">
          <div className="container mx-auto max-w-[1400px] px-4 py-5">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* ── Section A · The Wire ── */}
              <section id="news" className="lg:col-span-8 min-w-0 scroll-mt-16">
                <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-foreground/15 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  <span className="flex items-center gap-3">
                    <span className="text-foreground/80">Section A</span>
                    <span aria-hidden="true" className="text-foreground/20">·</span>
                    <span>The Wire — Fund News</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400/90">Live · 200+ sources</span>
                  </span>
                </div>
                <Suspense fallback={<NewsFeedSkeleton />}>
                  <NewsFeed />
                </Suspense>
              </section>

              {/* ── Section B · The Circuit (events rail) ── */}
              <section id="events" className="lg:col-span-4 min-w-0 scroll-mt-16">
                <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-foreground/15 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  <span className="flex items-center gap-3">
                    <span className="text-foreground/80">Section B</span>
                    <span aria-hidden="true" className="text-foreground/20">·</span>
                    <span>The Circuit — Events</span>
                  </span>
                  <span className="text-amber-400/90">Dates Verified</span>
                </div>
                {upcomingEvents.length > 0 ? (
                  <>
                    <HomeEventsStrip events={upcomingEvents} rail />
                    <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed">
                      <Link href="/events" className="text-foreground/70 hover:text-amber-400 transition-colors">
                        Filter by city, topic &amp; date →
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
                    The events calendar is at{' '}
                    <Link href="/events" className="text-amber-400 hover:text-amber-300">fundopshq.com/events</Link>.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
      <StickySubscribeBar />
    </div>
  )
}

function NewsFeedSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 flex-1 rounded-lg bg-muted" />
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="h-8 w-20 rounded-lg bg-muted" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
