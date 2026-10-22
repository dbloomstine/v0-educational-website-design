import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SubmitNewsForm } from '@/components/submit/SubmitNewsForm'
import { shareCard } from '@/lib/seo'

// "Submit your news" (2026-10-22), modelled on /events/submit. A firm sends a
// fund close, launch, hire or deal; it reaches the news desk as a lead
// (news_submissions, pending) and is never published as it stands.

const DESCRIPTION =
  'Send FundOpsHQ your fund close, fund launch, hire or deal. Free. Every item is checked against the announcement before it runs on the site and in FundOps Daily.'

export const metadata: Metadata = {
  title: 'Submit your news',
  description: DESCRIPTION,
  alternates: { canonical: 'https://fundopshq.com/submit' },
  ...shareCard('Submit your news | FundOpsHQ', DESCRIPTION, '/submit'),
}

export default function SubmitNewsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <div className="mx-auto max-w-[760px] px-4 pb-5 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[42px]">Submit your news</h1>
            <p className="mt-2 max-w-[62ch] font-news text-[16px] leading-snug text-foreground/70">
              Closed a fund, launched one, made a hire or done a deal? Send it to the news desk. It&apos;s free. We read
              everything, check it against the announcement, and run what checks out on the site and in FundOps Daily,
              read each morning by GPs, LPs and fund service providers.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[760px] px-4 pb-12 pt-6 lg:px-6">
          <div className="panel panel-lead">
            <SubmitNewsForm />
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
