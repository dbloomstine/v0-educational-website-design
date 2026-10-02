import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SubmitEventForm } from '@/components/events/SubmitEventForm'

export const metadata: Metadata = {
  title: 'Submit an Event',
  description:
    'Submit a private markets industry event — conference, forum, webinar, or networking — for the FundOpsHQ events calendar. Free listings, dates verified before publishing.',
  alternates: { canonical: 'https://fundopshq.com/events/submit' },
}

export default function SubmitEventPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <div className="mx-auto max-w-[760px] px-4 pb-5 pt-5 lg:px-6">
          <Link href="/events" className="mb-3 inline-flex items-center gap-1.5 font-ui text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> All events
          </Link>
          <h1 className="font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[42px]">Submit an event</h1>
          <p className="mt-2 max-w-[62ch] font-news text-[16px] leading-snug text-foreground/70">
            Hosting a conference, forum, webinar or networking event for GPs, LPs or fund service providers?
            Listings are free. We verify every date at the source before publishing — most submissions are on the board within a day.
          </p>
          </div>
        </div>
        <div className="mx-auto max-w-[760px] px-4 pb-12 pt-6 lg:px-6">
          <div className="panel panel-lead">
            <SubmitEventForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
