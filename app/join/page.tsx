import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JoinForm } from '@/components/join/JoinForm'
import { getSponsorAudience } from '@/lib/sponsor/stats'
import { shareCard } from '@/lib/seo'

// The page the social profiles link to (2026-10-22; next.config.mjs /tiktok, /instagram, /youtube). One promise,
// one field. The homepage asks a visitor from a post to find the signup among the news; this asks nothing else.
// The reader figure is the live one the sponsor page uses (lib/sponsor/stats.ts), never a typed number, and is
// left out when it cannot be read.

const DESCRIPTION =
  'FundOps Daily: the biggest fund closes, deals and hires in private markets, ranked, in your inbox every morning by 7:30 ET. Free.'

export const metadata: Metadata = {
  title: 'Get FundOps Daily, free',
  description: DESCRIPTION,
  alternates: { canonical: 'https://fundopshq.com/join' },
  ...shareCard('Get FundOps Daily, free | FundOpsHQ', DESCRIPTION, '/join'),
}

export const revalidate = 3600

const INSIDE = [
  ['The top stories', 'each with the fund, the size and the stage, in a line'],
  ['Today’s biggest', 'fund closes over $500M, deals over $1B and the senior hires, ranked'],
  ['Every section', 'private equity, venture, credit, real estate, infrastructure, secondaries, LP commitments and people moves'],
  ['On Mondays', 'last week’s largest closes in one list'],
] as const

export default async function JoinPage() {
  const audience = await getSponsorAudience().catch(() => null)
  const firms = audience?.firms != null && audience.firms >= 10 ? Math.floor(audience.firms / 10) * 10 : null
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[640px] px-4 pb-14 pt-8 sm:pt-12 lg:px-6">
          <h1 className="font-news text-[34px] font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-[46px]">
            The biggest fund closes, deals and hires. Every morning by 7:30.
          </h1>
          <p className="mt-3 font-news text-[18px] leading-snug text-foreground/75">
            FundOps Daily is the free morning email for GPs, LPs and fund service providers
            {firms ? <>, read at {firms}+ firms</> : null}. Five minutes, and you know what moved in private markets.
          </p>
          <div className="mt-6">
            <JoinForm />
            <p className="mt-2 font-ui text-[12.5px] text-muted-foreground">One email a day. Unsubscribe in one click.</p>
          </div>
          <ul className="mt-9 divide-y divide-foreground/10 border-y border-foreground/10">
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
      </main>
      <SiteFooter />
    </div>
  )
}
