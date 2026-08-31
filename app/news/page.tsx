import { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { NewsFeed } from '@/components/news/NewsFeed'

// The full news archive: every filter, search, and the whole back catalogue.
// The homepage carries only the top of the feed and links here — before this
// page existed the header's "News" link was an anchor to the homepage, which
// left the hub and the archive as the same surface.

export const metadata: Metadata = {
  title: 'Fund News',
  description:
    'Real-time news for the investment funds industry — fund launches, closes, executive moves, M&A, and regulatory action across PE, VC, private credit, real estate, and infrastructure. Tracked across 200+ sources for GPs, LPs, and fund service providers.',
  openGraph: {
    title: 'Fund News | FundOpsHQ',
    description:
      'Real-time fund news across PE, VC, private credit, real estate, and infrastructure — tracked across 200+ sources.',
    type: 'website',
    url: 'https://fundopshq.com/news',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fund News | FundOpsHQ',
    description: 'Real-time fund news for GPs, LPs, and fund service providers.',
  },
  alternates: {
    canonical: 'https://fundopshq.com/news',
  },
}

export default function NewsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="border-t-2 border-foreground/15 bg-background">
          {/* Section masthead — same editorial furniture as /events */}
          <div className="border-b border-foreground/10">
            <div className="container mx-auto max-w-[1400px] px-4">
              <div className="flex items-center justify-between gap-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-foreground/80">Section A</span>
                  <span aria-hidden="true" className="text-foreground/20">·</span>
                  <span>News</span>
                </span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-emerald-400/90">Live · 200+ sources</span>
                </span>
              </div>
            </div>
          </div>

          <div className="container mx-auto max-w-[1400px] px-4 py-3 sm:py-4">
            <h1
              className="mb-2.5 font-display text-foreground"
              style={{
                fontSize: 'clamp(19px, 2.2vw, 26px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Fund news
              <span
                className="italic"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
              >
                {' '}— launches, closes, moves, and deals.
              </span>
            </h1>

            <Suspense fallback={<NewsFeedSkeleton />}>
              <NewsFeed />
            </Suspense>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function NewsFeedSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 flex-1 rounded-lg bg-muted" />
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="h-8 w-20 rounded-lg bg-muted" />
      </div>
      <div>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
