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

      <main id="main-content" className="paper flex-1">
        <section>
          <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
            <header className="mb-3 border-b border-border pb-3">
              <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">
                Latest
              </h1>
              <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
                Every story as it arrives — fund closes, launches, deals, moves and regulation — with search, filters and
                the full archive.
              </p>
            </header>

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
