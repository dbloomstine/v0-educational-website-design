import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { NewsFeed } from '@/components/news/NewsFeed'
import { SubscribeWidget } from '@/components/news/SubscribeWidget'
import { ReachOut } from '@/components/reach-out'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Fund Operations News',
  description:
    'Real-time intelligence on fund launches, capital raises, executive moves, and M&A across private equity, venture capital, credit, and alternative investments.',
  openGraph: {
    title: 'Fund Operations News',
    description:
      'Real-time intelligence on fund activity, executive moves, and market developments.',
    type: 'website',
    url: 'https://fundops.com/news',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fund Operations News',
    description:
      'Real-time intelligence on fund activity, executive moves, and market developments.',
  },
  alternates: {
    canonical: 'https://fundops.com/news',
  },
}

export default function NewsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1 bg-background">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          <div className="mb-3 flex items-baseline gap-3">
            <h1 className="text-xl font-heading font-bold text-foreground">
              Fund News
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time fund activity, executive moves &amp; market developments
            </p>
          </div>
          <div className="mb-3">
            <SubscribeWidget />
          </div>
          <Suspense fallback={<NewsFeedSkeleton />}>
            <NewsFeed />
          </Suspense>
        </div>
        <ReachOut />
      </main>

      <SiteFooter />
    </div>
  )
}

function NewsFeedSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 flex-1 bg-muted rounded-lg" />
        <div className="h-8 w-32 bg-muted rounded-lg" />
        <div className="h-8 w-20 bg-muted rounded-lg" />
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
