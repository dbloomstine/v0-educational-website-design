import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { NewsFeed } from '@/components/news/NewsFeed'
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Fund Operations News
            </h1>
            <p className="mt-2 text-muted-foreground">
              Real-time intelligence on fund activity, executive moves, and market developments
            </p>
          </div>
          <Suspense fallback={<NewsFeedSkeleton />}>
            <NewsFeed />
          </Suspense>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function NewsFeedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded-lg" />
      <div className="h-6 bg-muted rounded-lg w-3/4" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}
