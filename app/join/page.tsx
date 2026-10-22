import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JoinForm } from '@/components/join/JoinForm'
import { EditionExcerpt } from '@/components/join/EditionExcerpt'
import { loadStories } from '@/lib/news/front-page'
import { composeFrontPage, type Story } from '@/lib/news/stories'
import { getSponsorAudience } from '@/lib/sponsor/stats'
import { shareCard } from '@/lib/seo'

// The page the social profiles link to (2026-10-22; next.config.mjs /tiktok, /instagram, /youtube). One promise,
// one field. The homepage asks a visitor from a post to find the signup among the news; this asks nothing else.
// The reader figure is the live one the sponsor page uses (lib/sponsor/stats.ts), never a typed number, and is
// left out when it cannot be read.
//
// Later on 2026-10-22 (design review): the page shows the product. Beside the form on a desk, under it on a phone
// (the one field stays above the fold there), the top of this morning's email: real stories from the front page's
// cache (components/join/EditionExcerpt.tsx). And the form asks what the signup box asks, in the box's gold.

const DESCRIPTION =
  'FundOps Daily: the biggest fund closes, deals and hires in private markets, ranked, in your inbox every morning by 7:30am ET. Free.'

export const metadata: Metadata = {
  title: 'Get FundOps Daily, free',
  description: DESCRIPTION,
  alternates: { canonical: 'https://fundopshq.com/join' },
  ...shareCard('Get FundOps Daily, free | FundOpsHQ', DESCRIPTION, '/join'),
}

// The stories under the form are the front page's; this page is rebuilt on the front page's clock.
export const revalidate = 600

const INSIDE = [
  ['The top stories', 'each with the fund, the size and the stage, in a line'],
  ['Today’s biggest', 'fund closes over $500M, deals over $1B and the senior hires, ranked'],
  ['Every section', 'private equity, venture, credit, real estate, infrastructure, secondaries, LP commitments and people moves'],
  ['On Mondays', 'last week’s largest closes in one list'],
] as const

/** The front page's lead and its first three top stories: four, as a phone shows them without a long scroll. */
async function topStories(): Promise<Story[]> {
  try {
    const front = composeFrontPage(await loadStories(), Date.now())
    return [front.lead, ...front.top].filter((s): s is Story => s != null).slice(0, 4)
  } catch {
    return []
  }
}

export default async function JoinPage() {
  const [audience, stories] = await Promise.all([getSponsorAudience().catch(() => null), topStories()])
  const date = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' })
  const firms = audience?.firms != null && audience.firms >= 10 ? Math.floor(audience.firms / 10) * 10 : null
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="mx-auto grid max-w-[1120px] gap-x-14 gap-y-9 px-4 pb-14 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-6">
          <div className="min-w-0 max-w-[620px]">
            <h1 className="font-news text-[34px] font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-[46px]">
              The biggest fund closes, deals and hires. Every morning by 7:30am ET.
            </h1>
            <p className="mt-3 font-news text-[18px] leading-snug text-foreground/75">
              FundOps Daily is the free morning email for GPs, LPs and fund service providers
              {firms ? <>, read at {firms}+ firms</> : null}. Five minutes, and you know what moved in private markets.
            </p>
            <div className="mt-6">
              <JoinForm />
            </div>
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-2">
            <EditionExcerpt stories={stories} date={date} />
          </div>

          <div className="min-w-0 max-w-[620px]">
            <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
              {INSIDE.map(([what, detail]) => (
                <li key={what} className="py-3 font-news text-[16px] leading-snug text-foreground/80">
                  <span className="font-semibold text-foreground">{what}:</span> {detail}
                </li>
              ))}
            </ul>
            <p className="mt-6 font-ui text-[13.5px] text-muted-foreground">
              Want to look first?{' '}
              <Link href="/news" className="font-semibold text-foreground/80 underline underline-offset-2">Read today’s news</Link>
              {' '}or{' '}
              <Link href="/league-tables" className="font-semibold text-foreground/80 underline underline-offset-2">the year’s biggest closes</Link>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
