import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, BarChart3, CheckCircle2, FileText, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Investor Reporting Setup Guide | FundOpsHQ',
  description: 'Setting up investor reporting? Learn about report types, delivery frequency, portal vs. email decisions, and what LPs actually want to see from their fund managers.',
  openGraph: {
    title: 'Investor Reporting Setup Guide | FundOpsHQ',
    description: 'Learn what LPs actually want to see and how to set up effective investor reporting.',
    type: 'website',
    url: 'https://fundops.com/help/investor-reporting',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Investor Reporting Setup Guide | FundOpsHQ',
    description: 'Learn what LPs actually want to see and how to set up effective investor reporting.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/investor-reporting',
  },
}

// FAQ Schema for rich snippets
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What reports should a private fund provide to investors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Core reports include: quarterly capital account statements, quarterly/semi-annual portfolio updates, annual audited financial statements, K-1s, and capital call/distribution notices. Additional reports may include monthly NAV estimates (for hedge funds), ESG reporting, and detailed portfolio company updates. Report content should align with your LPA requirements and investor expectations.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should a fund report to investors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Quarterly reporting is standard for most private funds. Hedge funds often provide monthly performance updates. Annual audited financials are universal. The key is consistency—set a schedule in your LPA and stick to it. Some institutional investors negotiate for more frequent or detailed reporting via side letters.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should I use an investor portal or email for reporting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Investor portals offer benefits like secure document storage, investor self-service access, and audit trails. However, they require ongoing maintenance and many investors still prefer email delivery. Most funds use a hybrid approach: portal for document archive and access, with email notifications for new reports. Consider your investor count and sophistication when deciding.',
      },
    },
    {
      '@type': 'Question',
      name: 'What do institutional LPs look for in fund reporting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Institutional LPs prioritize: timely and consistent delivery, ILPA-compliant capital account statements, detailed fee and expense breakdowns, portfolio performance attribution, ESG metrics, and transparent valuation methodology disclosure. They also value standardized formats that facilitate comparison across their fund portfolio.',
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
      name: 'Investor Reporting Setup',
      item: 'https://fundops.com/help/investor-reporting',
    },
  ],
}

// Author/Article Schema
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Investor Reporting Setup Guide for Private Fund Managers',
  description: 'Comprehensive guide to setting up investor reporting, including report types, delivery methods, and what LPs actually want to see.',
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
    '@id': 'https://fundops.com/help/investor-reporting',
  },
}

const whatWeCanDiscuss = [
  'Designing a reporting package that meets investor expectations',
  'Setting realistic delivery schedules you can actually maintain',
  'Portal vs. email vs. hybrid delivery approaches',
  'ILPA reporting standards and how to implement them',
  'Handling side letter reporting requirements',
  'ESG reporting and emerging LP requirements',
]

const reportTypes = [
  {
    icon: BarChart3,
    name: 'Capital Account Statements',
    frequency: 'Quarterly',
    description: 'Opening balance, contributions, distributions, allocations, ending balance. Should reconcile to audited financials.',
  },
  {
    icon: FileText,
    name: 'Portfolio Updates',
    frequency: 'Quarterly/Semi-annual',
    description: 'Investment summaries, performance metrics, significant events. Depth varies by fund type and LP expectations.',
  },
  {
    icon: Users,
    name: 'Annual Reports',
    frequency: 'Annual',
    description: 'Audited financials, manager letter, year in review. Often the most comprehensive communication with LPs.',
  },
]

const lpPriorities = [
  {
    priority: 'Timeliness',
    detail: 'Reports delivered when promised. Institutional LPs track delivery dates across their portfolio.',
  },
  {
    priority: 'Consistency',
    detail: 'Same format every period. Changes in presentation raise questions and create work for LP teams.',
  },
  {
    priority: 'Transparency',
    detail: 'Clear fee breakdowns, valuation methodology, and portfolio attribution. No surprises.',
  },
  {
    priority: 'Completeness',
    detail: 'All information needed to update their systems without follow-up questions.',
  },
]

export default function InvestorReportingPage() {
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
                  <BarChart3 className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Ongoing operations
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Setting Up Investor Reporting?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Good investor reporting builds trust and reduces the back-and-forth that eats up
                your time. Whether you're launching a new fund or improving an existing process,
                getting the fundamentals right matters more than fancy presentations.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">What makes reporting effective</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  I've seen reporting packages that look impressive but create more questions than
                  they answer. And I've seen simple, clean reports that give LPs exactly what they
                  need. The difference isn't design—it's understanding what investors actually do
                  with your reports.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Institutional LPs have systems they need to update, boards they report to, and
                  portfolios they need to compare. They're looking for consistent data they can
                  extract and use. Family offices and high-net-worth investors often want more
                  context and narrative. Understanding your LP base shapes what you deliver.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The most common mistake? Over-promising on timing. Better to commit to delivering
                  quarterly reports 45 days after quarter-end and hit it every time than promise
                  30 days and miss it regularly. Consistency builds confidence; missed deadlines
                  erode it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Report Types Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">Core report types</h2>
              <p className="text-muted-foreground mb-8">
                Most private funds need these three report categories. Content and detail level vary by fund type and investor base.
              </p>
              <div className="grid gap-4">
                {reportTypes.map((report, index) => (
                  <div key={index} className="p-5 rounded-lg border border-border/60 bg-card">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                        <report.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{report.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {report.frequency}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* LP Priorities Section */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold">What LPs actually prioritize</h2>
              <p className="text-muted-foreground mb-8">
                Based on conversations with institutional and family office investors, here's what moves the needle:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {lpPriorities.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border/60 bg-card">
                    <h3 className="font-semibold text-foreground mb-2">{item.priority}</h3>
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
                Whether you're designing reporting for a new fund or trying to improve what you
                have, I'm happy to share what works. No pitch, just practical advice.
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
                      Grab a time on my calendar. We can talk through your investor base and what would work for them.
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
                      If you'd like to share some context first, that works too. Tell me about your fund and investor mix.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=Investor%20Reporting%20Setup">
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
                  href="/funds/private-equity/investor-relations"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE Investor Relations
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/venture-capital/investor-relations"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  VC Investor Relations
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
