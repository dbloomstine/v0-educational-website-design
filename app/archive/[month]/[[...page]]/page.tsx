import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { SectionFlag } from '@/components/story/StoryBlocks'
import { SubscribePanel } from '@/components/home/Rail'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { ArchiveList } from '@/components/archive/ArchiveList'
import { archiveHref, isArchiveMonth, loadArchiveMonth, monthLabel, parseArchivePath, shiftMonth } from '@/lib/news/archive'
import { OG_IMAGES } from '@/lib/seo'

// One month of the archive: the stories with a fuller summary, newest first,
// fifty to a page. /archive/2026-10 is the first page, /archive/2026-10/2 the
// next — the page number is in the path, not the query string, because a page
// that reads the query string is rendered on every request (CLAUDE.md, "Speed,
// caching and the database").

export const revalidate = 86400

// Built on first request, then kept a day. A month the archive has no page for
// (before ARCHIVE_FIRST_MONTH, or in the future) is a 404 without a query.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ month: string; page?: string[] }> }

async function resolve({ params }: Params) {
  const { month, page } = await params
  const asked = parseArchivePath(month, page)
  if (!asked) notFound()
  if ('redirect' in asked) permanentRedirect(asked.redirect)
  return asked
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const { month, page } = await resolve(props)
  const { entries } = await loadArchiveMonth(month, page)
  const label = monthLabel(month)
  const title = `${label}: fund closes, deals and moves${page > 1 ? ` (page ${page})` : ''}`
  const description = `Fund closes, deals, people moves and LP commitments in private markets from ${label}${page > 1 ? `, page ${page}` : ''} — each story with a short summary and links to the outlets that reported it.`
  const url = `https://fundopshq.com${archiveHref(month, page)}`
  return {
    title,
    description,
    alternates: { canonical: url },
    // A month with nothing in it yet (the first of the month, before the job has run).
    robots: entries.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} | FundOpsHQ`, description, type: 'website', url, images: OG_IMAGES },
    twitter: { card: 'summary_large_image', title: `${title} | FundOpsHQ`, description, images: OG_IMAGES.map((i) => i.url) },
  }
}

const pagerClass = 'font-ui text-[13px] font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline'

export default async function ArchiveMonthPage(props: Params) {
  const { month, page } = await resolve(props)
  const { entries, hasMore } = await loadArchiveMonth(month, page)
  // Past the last page of a month: there is nothing here.
  if (page > 1 && entries.length === 0) notFound()

  const label = monthLabel(month)
  const earlier = shiftMonth(month, -1)
  const later = shiftMonth(month, 1)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-4 pt-5 lg:px-6">
            <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">
              <Link prefetch={false} href="/archive" className="hover:underline">Archive</Link>
            </p>
            <h1 className="mt-1.5 font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">
              {label}
              {page > 1 && <span className="text-foreground/50"> · page {page}</span>}
            </h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
              Fund closes, deals, people moves and LP commitments from {label}, newest first. Each story links to our
              page for it, with the outlets that reported it.
            </p>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <div className="min-w-0">
              <SectionFlag label={`Stories, ${label}`} />
              {entries.length > 0 ? (
                <ArchiveList entries={entries} />
              ) : (
                <p className="py-6 font-news text-[16px] text-foreground/70">
                  Nothing has been written up for {label} yet. <Link href="/news" className="underline">Latest news</Link> has the past month.
                </p>
              )}

              <nav aria-label="Pages" className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-2 border-foreground pt-3">
                <span className="flex gap-x-5">
                  {page > 1 && <Link prefetch={false} rel="prev" href={archiveHref(month, page - 1)} className={pagerClass}>← Newer stories</Link>}
                  {hasMore && <Link prefetch={false} rel="next" href={archiveHref(month, page + 1)} className={pagerClass}>Older stories →</Link>}
                </span>
                <span className="flex gap-x-5">
                  {isArchiveMonth(earlier) && <Link prefetch={false} href={archiveHref(earlier)} className={pagerClass}>{monthLabel(earlier)}</Link>}
                  {isArchiveMonth(later) && <Link prefetch={false} href={archiveHref(later)} className={pagerClass}>{monthLabel(later)}</Link>}
                  <Link prefetch={false} href="/archive" className={pagerClass}>All months</Link>
                </span>
              </nav>
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
