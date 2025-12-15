import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, FileText, CheckCircle2, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'K-1 Tax Season Guide for Fund Managers | FundOpsHQ',
  description: 'Navigating K-1 delivery deadlines? Learn about K-1 timelines, extension strategies, investor communication best practices, and common delays to avoid.',
  openGraph: {
    title: 'K-1 Tax Season Guide for Fund Managers | FundOpsHQ',
    description: 'Navigate K-1 delivery deadlines with confidence. Timelines, extension strategies, and investor communication.',
    type: 'website',
    url: 'https://fundops.com/help/k1-tax-season',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'K-1 Tax Season Guide for Fund Managers | FundOpsHQ',
    description: 'Navigate K-1 delivery deadlines with confidence. Timelines, extension strategies, and investor communication.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/k1-tax-season',
  },
}

// FAQ Schema for rich snippets
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'When are K-1s due for private funds?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Partnership K-1s (Schedule K-1 of Form 1065) are due on March 15th for calendar-year funds, or the 15th day of the third month after the tax year ends. Extensions push this to September 15th. However, many investors expect K-1s before the original deadline to file their own returns on time.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I communicate K-1 delays to investors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Be proactive: communicate expected delivery dates in January, provide updates if delays occur, and explain the reason (audit timing, complex allocations, underlying K-1 delays). Send investor tax estimates if final K-1s will be late. Most investors appreciate transparency over silence.',
      },
    },
    {
      '@type': 'Question',
      name: 'What causes K-1 delivery delays for private funds?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Common causes include: delayed audits, waiting for K-1s from underlying investments (fund-of-funds), complex waterfall calculations, side letter provisions requiring special allocations, late partnership agreement amendments, and state tax filing complications. Planning for these early helps avoid last-minute scrambles.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should my fund provide tax estimates to investors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, especially if K-1s will be delayed past March 15th. Provide investors with estimated taxable income, capital gains, and state-source income by early March. This allows them to file extensions with reasonable estimates and avoid penalties. Update estimates if significant changes occur.',
      },
    },
  ],
}

// Breadcrumb Schema
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://fundops.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'How I Can Help',
      item: 'https://fundops.com/help',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'K-1 Tax Season',
      item: 'https://fundops.com/help/k1-tax-season',
    },
  ],
}

// Author/Article Schema
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'K-1 Tax Season Guide for Private Fund Managers',
  description: 'Comprehensive guide to navigating K-1 delivery deadlines, investor communication strategies, and common tax season challenges for private fund managers.',
  author: {
    '@type': 'Person',
    name: 'Danny Bloomstine',
    url: 'https://www.linkedin.com/in/danny-bloomstine/',
    jobTitle: 'Managing Director',
    worksFor: {
      '@type': 'Organization',
      name: 'IQ-EQ',
    },
  },
  publisher: {
    '@type': 'Organization',
    name: 'FundOpsHQ',
    url: 'https://fundops.com',
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://fundops.com/help/k1-tax-season',
  },
}

const whatWeCanDiscuss = [
  'Setting realistic K-1 delivery timelines for your fund',
  'Investor communication strategies and templates',
  'When and how to provide tax estimates',
  'Coordinating with auditors and tax preparers',
  'Handling underlying investment K-1 delays',
  'State tax filing complications and multi-state issues',
]

const keyTimelines = [
  {
    date: 'January',
    action: 'Communicate expected K-1 delivery timeline to investors',
    detail: 'Set expectations early. If you know audit or underlying K-1s will cause delays, say so now.',
  },
  {
    date: 'February',
    action: 'Finalize year-end audit and begin tax preparation',
    detail: 'Most funds need audited financials before preparing K-1s. Late audits are the #1 cause of K-1 delays.',
  },
  {
    date: 'Early March',
    action: 'Provide tax estimates if final K-1s will be late',
    detail: 'Investors filing by April 15th need estimates by March 1st to prepare their extensions.',
  },
  {
    date: 'March 15',
    action: 'Original partnership return deadline',
    detail: 'Most funds file extensions, but some investors expect K-1s by this date regardless.',
  },
  {
    date: 'September 15',
    action: 'Extended partnership return deadline',
    detail: 'Final K-1s must be delivered by this date. Plan backwards from here to set your schedule.',
  },
]

export default function K1TaxSeasonPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20" />

          <div className="container relative mx-auto px-4 py-24 lg:py-32">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/help"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to How I Can Help
              </Link>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent">
                  <FileText className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Tax deadline
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Navigating K-1 Tax Season?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                K-1 season is one of the most stressful times for fund operations teams. Investors
                are waiting, deadlines are firm, and everything depends on pieces coming together
                in the right order. I've been through enough of these to know what works.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">Why K-1 season is so challenging</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The K-1 process has multiple dependencies that all need to line up. Your audit needs
                  to be complete. Your tax preparer needs the final numbers. If you invest in other
                  funds, you're waiting on their K-1s before you can finalize yours. Meanwhile,
                  investors—especially institutional ones—are pressing for delivery dates they can plan around.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The challenge isn't just delivering K-1s; it's managing expectations and communication
                  throughout the process. A fund that delivers K-1s on April 30th with good communication
                  is often better received than one that promises March 15th and misses it with no update.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The best approach is working backwards from deadlines and building in buffer time for
                  the things that inevitably slip. And when they do slip, communicating proactively
                  rather than waiting for investors to ask.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">Key dates and milestones</h2>
              <p className="text-muted-foreground mb-8">
                Here's a typical K-1 calendar for calendar-year funds. Adjust dates if your fund has a different fiscal year.
              </p>
              <div className="space-y-4">
                {keyTimelines.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg border border-border/60 bg-card">
                    <div className="shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <Clock className="h-5 w-5 text-foreground" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{item.date}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-foreground">{item.action}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What We Can Discuss */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-2xl font-bold">What we can talk through</h2>
              <div className="grid gap-3">
                {whatWeCanDiscuss.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-border/60 bg-card">
                    <CheckCircle2 className="h-5 w-5 text-accent-foreground mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold text-center">Let's talk through it</h2>
              <p className="mb-8 text-center text-muted-foreground text-balance">
                Whether you're planning ahead or already in the thick of tax season, I'm happy
                to share what's worked for other funds. No pitch, just practical guidance.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Book a Conversation */}
                <Card className="border-border/60">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                      <Calendar className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Book a conversation</h3>
                    <p className="mb-6 text-muted-foreground text-sm">
                      Grab a time on my calendar. We can talk through your timeline and where you might run into issues.
                    </p>
                    <Button asChild size="lg" className="w-full">
                      <a
                        href="https://outlook.office.com/bookwithme/user/64e88c9063b2407fb03a67e5c3df844d@iqeq.com/meetingtype/2GfPzbwFuEiKymGSplU9ZQ2?anonymous&ismsaljsauthenabled&ep=mcard"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pick a Time
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Send an Email */}
                <Card className="border-border/60">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                      <Mail className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Send me an email</h3>
                    <p className="mb-6 text-muted-foreground text-sm">
                      If you'd like to outline your situation first, that works too. Include your fund structure and timeline.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=K-1%20Tax%20Season%20Question">
                        Send Email
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Related Resources */}
        <section className="py-12 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="mb-4 text-lg font-semibold">Related Resources</h3>
              <p className="text-sm text-muted-foreground mb-4">
                While you're here, these resources might be helpful:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/help/annual-audit-prep"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Annual Audit Prep
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/private-equity/tax"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE Tax Guide
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/help/investor-reporting"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Investor Reporting
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
