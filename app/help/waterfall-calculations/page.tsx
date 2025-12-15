import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Waterfall & Distribution Calculations Guide | FundOpsHQ',
  description: 'Struggling with waterfall calculations? Learn about European vs. American waterfalls, catch-up mechanics, common calculation errors, and validation approaches.',
  openGraph: {
    title: 'Waterfall & Distribution Calculations Guide | FundOpsHQ',
    description: 'Understand waterfall structures, catch-up mechanics, and how to avoid common calculation errors.',
    type: 'website',
    url: 'https://fundops.com/help/waterfall-calculations',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Waterfall & Distribution Calculations Guide | FundOpsHQ',
    description: 'Understand waterfall structures, catch-up mechanics, and how to avoid common calculation errors.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/waterfall-calculations',
  },
}

// FAQ Schema for rich snippets
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the difference between European and American waterfall structures?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'European (whole-fund) waterfalls calculate carried interest on the entire fund—LPs must receive back all contributed capital plus preferred return across all investments before the GP earns carry. American (deal-by-deal) waterfalls calculate carry on each investment separately, allowing GPs to earn carry earlier but requiring clawback provisions if later investments underperform. European waterfalls are more LP-friendly; American waterfalls align GP incentives with early wins.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the GP catch-up work in a waterfall?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'After LPs receive their preferred return, the GP catch-up allows the GP to receive distributions until they reach their carried interest percentage of profits. A 100% catch-up means the GP receives all distributions in this tier until caught up. An 80/20 catch-up splits distributions 80% GP / 20% LP. The catch-up ensures the GP reaches their target profit share (typically 20%) on cumulative profits, not just profits above the hurdle.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are common waterfall calculation errors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Common errors include: miscalculating the preferred return accrual method (simple vs. compound, IRR vs. fixed rate), incorrect treatment of recycled capital, failing to account for management fee offsets, ignoring side letter modifications to waterfall economics, and errors in the catch-up tier calculation. Many issues stem from ambiguous LPA language that allows multiple interpretations.',
      },
    },
    {
      '@type': 'Question',
      name: 'How should I validate waterfall calculations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Best practices include: building independent verification models, testing with extreme scenarios (early exits, total losses), having calculations reviewed by someone who didn\'t build the model, reconciling to audited capital accounts, and comparing results across multiple distribution scenarios. Document your LPA interpretation and get stakeholder sign-off before distributions.',
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
      name: 'Waterfall & Distribution Calculations',
      item: 'https://fundops.com/help/waterfall-calculations',
    },
  ],
}

// Author/Article Schema
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Waterfall & Distribution Calculations Guide for Private Fund Managers',
  description: 'Comprehensive guide to understanding waterfall structures, catch-up mechanics, common calculation errors, and validation best practices.',
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
    '@id': 'https://fundops.com/help/waterfall-calculations',
  },
}

const whatWeCanDiscuss = [
  'Understanding your specific waterfall structure and LPA language',
  'European vs. American waterfall mechanics and implications',
  'Catch-up calculations and common points of confusion',
  'Handling side letter modifications to standard economics',
  'Building validation frameworks and test scenarios',
  'Preparing for distribution calculations and LP communications',
]

const waterfallTiers = [
  {
    tier: 'Return of Capital',
    description: 'LPs receive back their contributed capital (and sometimes called capital).',
    consideration: 'Define what counts: drawn capital only, or include recycled amounts?',
  },
  {
    tier: 'Preferred Return',
    description: 'LPs receive their hurdle rate (typically 8%) before the GP earns carry.',
    consideration: 'Is it simple or compound? IRR-based or fixed rate? Accrued from commitment or contribution?',
  },
  {
    tier: 'GP Catch-up',
    description: 'GP receives distributions to reach their carry percentage on cumulative profits.',
    consideration: 'Is it 100% to GP or split? Does it bring GP to 20% of total profits or just this tier?',
  },
  {
    tier: 'Carried Interest Split',
    description: 'Remaining profits split (typically 80/20) between LPs and GP.',
    consideration: 'Are there tiered carry rates based on returns? How do side letters modify this?',
  },
]

const commonErrors = [
  {
    error: 'Preferred return calculation method',
    detail: 'LPAs often don\'t specify simple vs. compound, or whether the rate applies to contributed or committed capital. Get clarity early.',
  },
  {
    error: 'Recycling treatment',
    detail: 'Does recycled capital reset the return of capital tier? Does it earn additional preferred return? LPAs vary significantly here.',
  },
  {
    error: 'Management fee offset timing',
    detail: 'When are offsets applied—at contribution, at distribution, or at waterfall calculation? Timing affects preferred return accrual.',
  },
  {
    error: 'Side letter economics',
    detail: 'Reduced carry rates, different hurdles, or co-invest rights all complicate the calculation. Track these meticulously.',
  },
]

export default function WaterfallCalculationsPage() {
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
                  <Calculator className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  High stakes
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Working Through Waterfall Calculations?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Waterfall calculations determine who gets paid what—and mistakes are expensive.
                Whether you're preparing for your first distribution or validating existing
                calculations, getting this right matters more than almost anything else in fund operations.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">Why waterfalls are so complicated</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The problem isn't usually the math—it's the interpretation. LPA language is often
                  ambiguous, drafted by lawyers who may not have anticipated every scenario. When you
                  add side letters with modified economics, recycling provisions, and management fee
                  offsets, even "simple" waterfalls become complex.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  I've seen funds discover mid-distribution that their understanding of the waterfall
                  differs from their administrator's—or their LP's. These conversations are much better
                  to have before money moves. The time to align on interpretation is when you're building
                  the model, not when checks are being cut.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The stakes are real: incorrect carry calculations can result in clawback situations,
                  LP disputes, and in extreme cases, litigation. Taking the time to document your
                  interpretation, validate your model, and get stakeholder alignment is one of the
                  highest-value activities in fund operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Waterfall Tiers Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">Standard waterfall tiers</h2>
              <p className="text-muted-foreground mb-8">
                Most private fund waterfalls follow this basic structure, but the details within each tier vary significantly.
              </p>
              <div className="space-y-4">
                {waterfallTiers.map((item, index) => (
                  <div key={index} className="p-5 rounded-lg border border-border/60 bg-card">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.tier}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    </div>
                    <div className="ml-11 mt-3 p-3 bg-accent/20 rounded text-sm">
                      <span className="font-medium">Key consideration:</span>{' '}
                      <span className="text-muted-foreground">{item.consideration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Common Errors Section */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">Common sources of error</h2>
              <p className="text-muted-foreground mb-8">
                Most waterfall calculation issues trace back to a few recurring problems:
              </p>
              <div className="grid gap-4">
                {commonErrors.map((item, index) => (
                  <div key={index} className="p-5 rounded-lg border border-border/60 bg-card">
                    <div className="flex items-start gap-3 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="font-medium text-foreground">{item.error}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-8">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What We Can Discuss */}
        <section className="py-16 border-t border-border bg-card/30">
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
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold text-center">Let's talk through it</h2>
              <p className="mb-8 text-center text-muted-foreground text-balance">
                Whether you're building a waterfall model from scratch or validating existing
                calculations, I'm happy to help you think through the mechanics. No pitch, just
                practical discussion.
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
                      Grab a time on my calendar. We can walk through your waterfall structure and identify areas to focus on.
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
                      If you'd like to outline your situation first, that works too. Share your waterfall structure and specific questions.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=Waterfall%20Calculation%20Question">
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
                  href="/tools/waterfall-visualizer"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Waterfall Visualizer Tool
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/private-equity/fund-administration"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE Fund Administration
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/help/fund-admin-selection"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Fund Admin Selection
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
