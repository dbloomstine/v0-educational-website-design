import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SubmitNewsForm } from '@/components/submit/SubmitNewsForm'
import { LIMITS } from '@/lib/submit/fields'
import { shareCard } from '@/lib/seo'

// "Send us your news" (2026-10-22), modelled on /events/submit. A firm sends a
// fund close, fundraise launch, deal, hire or other news; the sender confirms
// their work email, and it reaches the news desk as a lead (news_submissions,
// pending). Nothing is published as it stands. /news/submit and /submit-news
// redirect here (next.config.mjs). ?firm= fills in the firm's name: the
// "Is this your firm?" line on /firm/<slug> links here that way.

const DESCRIPTION =
  'Send FundOpsHQ your fund close, fundraise launch, deal or hire. Free. We review and verify every submission before anything runs on the site or in FundOps Daily.'

export const metadata: Metadata = {
  title: 'Send us your news',
  description: DESCRIPTION,
  alternates: { canonical: 'https://fundopshq.com/submit' },
  ...shareCard('Send us your news | FundOpsHQ', DESCRIPTION, '/submit'),
}

type Params = { searchParams: Promise<{ firm?: string | string[] }> }

export default async function SubmitNewsPage({ searchParams }: Params) {
  const { firm } = await searchParams
  const defaultFirm = (typeof firm === 'string' ? firm : '').trim().slice(0, LIMITS.firm)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <div className="mx-auto max-w-[760px] px-4 pb-5 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[42px]">Send us your news</h1>
            <p className="mt-2 max-w-[62ch] font-news text-[16px] leading-snug text-foreground/70">
              Closed a fund, launched one, done a deal or made a hire that nobody has covered? Tell the news desk. FundOpsHQ
              covers GPs, LPs and fund service providers, and FundOps Daily goes to people at all three every morning. It&apos;s free.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[760px] px-4 pb-12 pt-6 lg:px-6">
          <ul className="mb-5 space-y-1 font-ui text-[13px] leading-relaxed text-foreground/75">
            <li>We review every submission and verify it, usually with you or your firm, before anything runs.</li>
            <li>We may edit it for length and style, and we publish facts only.</li>
            <li>News about your own firm only: no rumours, and no bad news about other firms.</li>
          </ul>
          <div className="panel panel-lead">
            <SubmitNewsForm defaultFirm={defaultFirm} />
          </div>
          <p className="mt-4 font-ui text-[12.5px] leading-relaxed text-muted-foreground">
            Sending news doesn&apos;t guarantee a story, and coverage is never traded for sponsorship. Hosting an event?{' '}
            <Link href="/events/submit" className="font-semibold text-foreground/80 underline underline-offset-2">Submit it to the events calendar</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
