import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, FileCheck, CheckCircle2, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Annual Audit Preparation Guide | FundOpsHQ',
  description: 'Preparing for your fund\'s annual audit? Learn what auditors look for, how to organize your PBC list, common findings to avoid, and timeline management strategies.',
  openGraph: {
    title: 'Annual Audit Preparation Guide | FundOpsHQ',
    description: 'Learn what auditors look for and how to prepare for your fund\'s annual audit efficiently.',
    type: 'website',
    url: 'https://fundops.com/help/annual-audit-prep',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Annual Audit Preparation Guide | FundOpsHQ',
    description: 'Learn what auditors look for and how to prepare for your fund\'s annual audit efficiently.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/annual-audit-prep',
  },
}

// FAQ Schema for rich snippets
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What should I prepare for a private fund audit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Key items include: trial balance and general ledger, bank and custody statements, investment documentation (capital calls, distributions, trade confirmations), partnership agreement and side letters, management fee calculations, expense allocations, investor statements, and valuation support for illiquid investments. Organizing these by category before the audit starts significantly reduces back-and-forth.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are common audit findings for private funds?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Common findings include: management fee calculation errors, inconsistent expense allocation methodologies, inadequate valuation documentation for Level 3 assets, missing or incomplete side letter tracking, bank reconciliation timing differences, related party transaction disclosure gaps, and investor capital account discrepancies. Most can be avoided with proper year-end preparation.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does a private fund audit take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A typical private fund audit takes 4-8 weeks from fieldwork start to opinion delivery. Timeline depends on fund complexity, number of investments, investor count, and how prepared you are. Well-prepared funds with clean books can complete audits in 3-4 weeks. Funds with valuation challenges or documentation gaps may take 10+ weeks.',
      },
    },
    {
      '@type': 'Question',
      name: 'When should I start preparing for my fund audit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start at least 6-8 weeks before year-end for optimal results. Begin by reconciling all accounts monthly throughout the year. At year-end, focus on finalizing valuations, preparing the PBC list, and coordinating with your administrator. Early preparation prevents the scramble that leads to audit delays and K-1 extensions.',
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
      name: 'Annual Audit Preparation',
      item: 'https://fundops.com/help/annual-audit-prep',
    },
  ],
}

// Author/Article Schema
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Annual Audit Preparation Guide for Private Fund Managers',
  description: 'Comprehensive guide to preparing for your fund audit, including PBC list organization, common findings to avoid, and timeline management.',
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
    '@id': 'https://fundops.com/help/annual-audit-prep',
  },
}

const whatWeCanDiscuss = [
  'Organizing your PBC (Prepared By Client) list efficiently',
  'Understanding what auditors actually focus on',
  'Timeline management and setting realistic deadlines',
  'Common findings and how to avoid them',
  'Coordinating between your team, administrator, and auditors',
  'Valuation documentation for illiquid investments',
]

const commonFindings = [
  {
    finding: 'Management fee calculation errors',
    prevention: 'Document your fee methodology and reconcile quarterly. Auditors will recalculate—make sure your numbers match.',
  },
  {
    finding: 'Expense allocation inconsistencies',
    prevention: 'Maintain a written allocation policy and apply it consistently. Document any exceptions.',
  },
  {
    finding: 'Valuation support gaps',
    prevention: 'For Level 3 assets, prepare contemporaneous documentation supporting year-end values before auditors ask.',
  },
  {
    finding: 'Side letter tracking issues',
    prevention: 'Maintain a comprehensive side letter matrix and ensure all economic terms are properly reflected in allocations.',
  },
]

export default function AnnualAuditPrepPage() {
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
                  <FileCheck className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Year-end critical
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Preparing for Your Annual Audit?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Audit season can be stressful, especially if you're facing your first one or haven't
                been through it recently. The key is preparation—knowing what auditors will ask for
                and having it ready before they do.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">What makes audits go smoothly</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  I've seen hundreds of fund audits—some wrap up in three weeks, others drag on for
                  months. The difference usually isn't fund complexity; it's preparation. Funds that
                  have their documentation organized, their reconciliations complete, and their
                  valuation support ready finish faster and with fewer issues.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Auditors have a checklist of things they need to test. If you know what's on that
                  list and prepare accordingly, you control the timeline. If you're scrambling to find
                  documents while auditors are in the middle of fieldwork, expect delays—and potentially
                  findings that could have been avoided.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The stakes are real: a delayed audit means delayed K-1s, which means frustrated
                  investors and potential tax extension complications. A clean audit with no material
                  findings reflects well on your operations and builds investor confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Common Findings Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">Common findings and how to avoid them</h2>
              <p className="text-muted-foreground mb-8">
                Most audit findings aren't surprises—they're predictable issues that proper preparation can prevent.
              </p>
              <div className="grid gap-4">
                {commonFindings.map((item, index) => (
                  <div key={index} className="p-5 rounded-lg border border-border/60 bg-card">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="font-medium text-foreground">{item.finding}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-8">{item.prevention}</p>
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
                Whether you're starting to plan for year-end or already in the middle of audit
                fieldwork, I'm happy to help you think through it. No pitch, just practical advice.
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
                      Grab a time on my calendar. We can talk through where you are in the process and what to prioritize.
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
                      If you'd prefer to write out your situation first, that works too. Include your timeline and I'll get back to you.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=Annual%20Audit%20Preparation">
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
                While you're here, these articles might be helpful:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/funds/private-equity/audit"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE Audit Guide
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/hedge-funds/audit"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Hedge Fund Audits
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/help/k1-tax-season"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  K-1 Tax Season
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
