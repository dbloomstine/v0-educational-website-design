import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { SectionFlag } from '@/components/story/StoryBlocks'
import { SubscribePanel } from '@/components/home/Rail'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { archiveHref, loadArchiveSpan, monthLabel, monthsBetween } from '@/lib/news/archive'
import { OG_IMAGES } from '@/lib/seo'

// The way back into the stories that have left the front pages: one page a
// month, each listing the stories we wrote a fuller summary for.

export const revalidate = 86400

const TITLE = 'Story archive'
const DESCRIPTION =
  'Fund closes, deals, people moves and LP commitments in private markets, month by month — each story with a short summary and links to every outlet that reported it.'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://fundopshq.com/archive'
  const span = await loadArchiveSpan()
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: url },
    // Nothing written yet: nothing to index.
    robots: span ? undefined : { index: false, follow: true },
    openGraph: { title: `${TITLE} | FundOpsHQ`, description: DESCRIPTION, type: 'website', url, images: OG_IMAGES },
    twitter: { card: 'summary_large_image', title: `${TITLE} | FundOpsHQ`, description: DESCRIPTION, images: OG_IMAGES.map((i) => i.url) },
  }
}

export default async function ArchivePage() {
  const span = await loadArchiveSpan()
  const months = span ? monthsBetween(span.first, span.last) : []
  const years = Array.from(new Set(months.map((m) => m.slice(0, 4))))

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-4 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Archive</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
              The front pages keep ten days. Everything we wrote a fuller summary for stays here, a month at a time,
              newest first. Each story links to the outlets that reported it.
            </p>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <div className="min-w-0 space-y-8">
              {years.map((year) => (
                <section key={year} aria-label={year}>
                  <SectionFlag label={year} />
                  <ul className="grid gap-x-8 sm:grid-cols-2">
                    {months.filter((m) => m.startsWith(year)).map((m) => (
                      <li key={m} className="border-b border-border/70 py-2.5">
                        <Link prefetch={false} href={archiveHref(m)} className="hl font-news text-[19px] leading-snug text-foreground">
                          {monthLabel(m)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {months.length === 0 && (
                <p className="font-news text-[16px] text-foreground/70">
                  The archive fills as stories are written up. <Link href="/news" className="underline">Latest news</Link> has the past month.
                </p>
              )}
            </div>
            <aside className="min-w-0 space-y-5">
              <SponsorCard />
              <SubscribePanel title="Stories like these, every morning." body="FundOps Daily is the brief on fund closes, launches, deals and moves. Free, before the open." />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
