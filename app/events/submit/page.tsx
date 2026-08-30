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
      <main id="main-content" className="flex-1 border-t-2 border-foreground/15 bg-background">
        <div className="border-b border-foreground/10">
          <div className="container mx-auto max-w-[760px] px-4">
            <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              <span className="flex items-center gap-3">
                <span className="text-foreground/80">Section B</span>
                <span aria-hidden="true" className="text-foreground/20">·</span>
                <span>The Circuit</span>
              </span>
              <span className="text-amber-400/90">Free Listings</span>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-[760px] px-4 py-10 sm:py-14">
          <Link href="/events" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> All Events
          </Link>
          <h1
            className="font-display text-foreground"
            style={{ fontSize: 'clamp(30px, 4vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 500, fontVariationSettings: '"opsz" 144' }}
          >
            Submit an event.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Hosting a conference, forum, webinar, or networking event for GPs, LPs, or fund service providers?
            Listings are free. We verify every date at the source before publishing — most submissions appear
            on the board within a week.
          </p>
          <div className="mt-8">
            <SubmitEventForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
