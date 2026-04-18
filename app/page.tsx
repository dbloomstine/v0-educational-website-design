import { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { HeroSubscribe } from '@/components/home/hero-subscribe'
import { LiveShowFeature } from '@/components/home/live-show-feature'
import { NewsFeed } from '@/components/news/NewsFeed'
import { StickySubscribeBar } from '@/components/news/StickySubscribeBar'
import { fetchPlaylistVideos } from '@/lib/youtube'

export const metadata: Metadata = {
  title: 'FundOpsHQ | News, Newsletter & Live Show for the Investment Funds Industry',
  description:
    'The hub for the investment funds industry. Real-time fund launches, capital raises, exec moves, and regulatory news across PE, VC, private credit, real estate, and infrastructure — plus the FundOpsHQ Live weekly show. Subscribe to FundOps Daily.',
  openGraph: {
    title: 'FundOpsHQ | News, Newsletter & Live Show for the Investment Funds Industry',
    description:
      'The hub for the investment funds industry. Real-time fund news, a morning newsletter, and the FundOpsHQ Live weekly show — built for GPs, LPs, and fund service providers across private markets.',
    type: 'website',
    url: 'https://fundopshq.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundOpsHQ | News, Newsletter & Live Show for the Investment Funds Industry',
    description:
      'The hub for the investment funds industry. Built for GPs, LPs, and fund service providers across private markets. Subscribe to FundOps Daily.',
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
    'FundOpsHQ is the hub for the investment funds industry — home to the FundOps Daily news feed and newsletter, and the FundOpsHQ Live weekly broadcast show. Built for GPs, LPs, and fund service providers across private markets.',
  founder: {
    '@type': 'Person',
    name: 'Danny Bloomstine',
    url: 'https://www.linkedin.com/in/danny-bloomstine/',
  },
  sameAs: [
    'https://www.linkedin.com/in/danny-bloomstine/',
    'https://www.youtube.com/@dbloomstine',
    'https://www.tiktok.com/@dannybloomstine',
  ],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FundOpsHQ',
  url: 'https://fundopshq.com',
  description:
    'Real-time fund news, the FundOps Daily newsletter, and the weekly FundOpsHQ Live show — the hub for the investment funds industry.',
  publisher: {
    '@type': 'Organization',
    name: 'FundOpsHQ',
  },
}

export default async function HomePage() {
  const videos = await fetchPlaylistVideos()
  const latestVideo = videos[0] ?? null

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
        {/* ─── Hero: subscribe + live show CTA over massive wordmark ─── */}
        <HeroSubscribe />

        {/* ─── News Feed ─── */}
        <section id="news" className="relative border-t-2 border-foreground/15 bg-background">
          {/* Editorial section masthead */}
          <div className="border-b border-foreground/10">
            <div className="container mx-auto max-w-[1400px] px-4">
              <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-3">
                  <span className="text-foreground/80">Section A</span>
                  <span aria-hidden="true" className="text-foreground/20">·</span>
                  <span>The Wire</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-emerald-400/90">Updating Live</span>
                </span>
              </div>
            </div>
          </div>

          <div className="container mx-auto max-w-[1400px] px-4 py-10 sm:py-14">
            <div className="mb-8 grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <h2
                  className="font-display text-foreground"
                  style={{
                    fontSize: 'clamp(36px, 5vw, 64px)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  Fund operations news,
                  <br />
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                  >
                    in real time.
                  </span>
                </h2>
              </div>
              <div className="lg:col-span-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed">
                  Fund launches · Capital raises<br />
                  Exec moves · M&amp;A · Reg actions<br />
                  <span className="text-foreground/70">Sourced from 200+ publications.</span>
                </p>
              </div>
            </div>

            <Suspense fallback={<NewsFeedSkeleton />}>
              <NewsFeed />
            </Suspense>
          </div>
        </section>

        {/* ─── Live Show Feature ─── */}
        <LiveShowFeature latestVideo={latestVideo} />
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
