import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Regulatory Filing Deadlines Guide | FundOpsHQ',
  description: 'Managing regulatory filing deadlines? Learn about Form PF, Form ADV, state filings, beneficial ownership reports, and what happens if you miss a deadline.',
  openGraph: {
    title: 'Regulatory Filing Deadlines Guide | FundOpsHQ',
    description: 'Stay on top of Form PF, Form ADV, and other critical regulatory deadlines.',
    type: 'website',
    url: 'https://fundops.com/help/regulatory-filings',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regulatory Filing Deadlines Guide | FundOpsHQ',
    description: 'Stay on top of Form PF, Form ADV, and other critical regulatory deadlines.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/regulatory-filings',
  },
}

// FAQ Schema for rich snippets
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'When is Form ADV due?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Form ADV annual amendment is due within 90 days of your fiscal year-end. For calendar-year advisers, this means March 31st. You must also update Form ADV "promptly" (generally within 30 days) when material information changes. The brochure (Part 2A) must be offered to clients annually.',
      },
    },
    {
      '@type': 'Question',
      name: 'When is Form PF due for private fund advisers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Form PF deadlines depend on adviser size and fund type. Large private equity advisers (>$2 billion PE AUM): annual filing within 120 days of fiscal year-end. Large hedge fund advisers (>$1.5 billion HF AUM): quarterly filing within 60 days of quarter-end. Smaller private fund advisers: annual filing within 120 days. Current event reporting for certain large hedge funds is due within 72 hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if I miss a regulatory filing deadline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Consequences vary by filing type. SEC filings: late Form ADV or Form PF can trigger deficiency letters, examination focus, and potential enforcement actions. State filings: late fees, registration suspension, or inability to operate in that state. Beneficial ownership: significant penalties under the Corporate Transparency Act. Always file late rather than not at all, and document the reason for the delay.',
      },
    },
    {
      '@type': 'Question',
      name: 'What regulatory filings do private fund managers need to track?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Key filings include: Form ADV (Parts 1, 2A, 2B), Form PF (if applicable), state notice filings, Form D (for new offerings), beneficial ownership reports (FinCEN), Form 13F (if >$100M in 13F securities), Schedule 13D/G (5%+ ownership), and various tax filings (K-1s, PFIC statements). Requirements depend on adviser size, fund types, and investor base.',
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
      name: 'Regulatory Filing Deadlines',
      item: 'https://fundops.com/help/regulatory-filings',
    },
  ],
}

// Author/Article Schema
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Regulatory Filing Deadlines Guide for Private Fund Managers',
  description: 'Comprehensive guide to managing regulatory filing deadlines, including Form PF, Form ADV, state filings, and beneficial ownership requirements.',
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
    '@id': 'https://fundops.com/help/regulatory-filings',
  },
}

const whatWeCanDiscuss = [
  'Building a comprehensive filing calendar for your firm',
  'Understanding which filings apply to your situation',
  'Form PF requirements and recent changes',
  'State notice filing requirements and blue sky compliance',
  'Beneficial ownership reporting under the Corporate Transparency Act',
  'What to do if you\'ve missed a deadline',
]

const keyFilings = [
  {
    filing: 'Form ADV',
    deadline: 'March 31 (calendar year-end)',
    description: '90 days after fiscal year-end. Material changes require prompt amendment.',
    consequence: 'Late filing noted in examination, potential deficiency letter.',
  },
  {
    filing: 'Form PF',
    deadline: 'Varies by size',
    description: 'Quarterly (60 days) for large HF advisers. Annual (120 days) for others.',
    consequence: 'SEC notice, potential enforcement focus, examiner attention.',
  },
  {
    filing: 'State Notice Filings',
    deadline: 'Varies by state',
    description: 'Required in states where you have investors or conduct business.',
    consequence: 'Late fees, registration issues, inability to take on investors in that state.',
  },
  {
    filing: 'Form D',
    deadline: '15 days after first sale',
    description: 'Required for Reg D offerings. Amendments due annually.',
    consequence: 'Loss of exemption eligibility, enforcement risk.',
  },
  {
    filing: 'Beneficial Ownership (BOI)',
    deadline: 'Varies',
    description: 'New entities: 90 days of formation. Existing: January 1, 2025 deadline.',
    consequence: 'Civil penalties up to $500/day, criminal penalties possible.',
  },
]

const calendarTips = [
  {
    tip: 'Start with your fiscal year-end',
    detail: 'Most filing deadlines key off this date. Build your calendar backwards from major deadlines.',
  },
  {
    tip: 'Add buffer time',
    detail: 'Build in 1-2 weeks of buffer before actual deadlines. Systems go down, data gets delayed.',
  },
  {
    tip: 'Assign clear ownership',
    detail: 'Every filing needs a responsible person. "The CCO handles compliance" isn\'t specific enough.',
  },
  {
    tip: 'Track state requirements separately',
    detail: 'State deadlines don\'t align with SEC deadlines. Create a state-specific calendar.',
  },
]

export default function RegulatoryFilingsPage() {
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
                  <Clock className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Compliance critical
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Tracking Regulatory Filing Deadlines?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Between Form ADV, Form PF, state notice filings, and beneficial ownership reports,
                it's easy for deadlines to slip through the cracks. Missing one creates problems;
                missing several creates a pattern that examiners notice.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">Why this matters more than it used to</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The regulatory filing landscape for private fund managers has gotten more complex.
                  Form PF requirements have expanded. Beneficial ownership reporting is new. State
                  requirements continue to evolve. And the SEC has made clear that timely, accurate
                  filings are a baseline expectation.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The challenge isn't just knowing what to file—it's building systems to ensure
                  nothing falls through the cracks as your firm grows. What works for a single-fund
                  manager breaks down when you have multiple funds, co-investment vehicles, and
                  GP entities, each with their own filing requirements.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The good news: this is a solvable problem. A well-designed compliance calendar,
                  clear ownership assignments, and proper lead time make the difference between
                  scrambling at deadline and filing with time to spare.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Filings Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">Key filings to track</h2>
              <p className="text-muted-foreground mb-8">
                These are the filings that most private fund managers need to monitor. Your specific requirements may vary.
              </p>
              <div className="space-y-4">
                {keyFilings.map((item, index) => (
                  <div key={index} className="p-5 rounded-lg border border-border/60 bg-card">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-foreground">{item.filing}</h3>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                        {item.deadline}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        <span className="font-medium">If missed:</span> {item.consequence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Calendar Tips Section */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">Building an effective filing calendar</h2>
              <p className="text-muted-foreground mb-8">
                The best compliance calendars share certain characteristics:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {calendarTips.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border/60 bg-card">
                    <h3 className="font-semibold text-foreground mb-2">{item.tip}</h3>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
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
                Whether you're building a compliance calendar from scratch or worried about a
                specific deadline, I'm happy to help you think through it. No pitch, just practical guidance.
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
                      Grab a time on my calendar. We can review your filing obligations and discuss how to stay on track.
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
                      If you'd like to outline your situation first, that works too. Include your fund structure and upcoming deadlines.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=Regulatory%20Filing%20Question">
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
                  href="/help/sec-exam-prep"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  SEC Exam Preparation
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/help/compliance-review"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Compliance Gut Check
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/private-equity/compliance"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE Compliance Guide
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
