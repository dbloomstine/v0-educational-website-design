import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Target, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About FundOpsHQ - Our Mission and Vision',
  description: 'Learn about FundOpsHQ mission to provide comprehensive, practical fund operations resources for investment professionals across all asset classes.',
  openGraph: {
    title: 'About FundOpsHQ - Our Mission and Vision',
    description: 'Comprehensive fund operations resources for investment professionals across all asset classes.',
    type: 'website',
    url: 'https://fundops.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About FundOpsHQ',
    description: 'Comprehensive fund operations resources for investment professionals across all asset classes.',
  },
  alternates: {
    canonical: 'https://fundops.com/about',
  },
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance">
                About FundOpsHQ
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                FundOpsHQ is a comprehensive resource for fund operations professionals, providing practical insights
                and best practices across all investment fund types and operational functions.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-bold">Our Mission</h2>
                <p className="text-xl text-muted-foreground leading-relaxed mx-auto max-w-2xl">
                  To provide fund operations professionals with accessible, high-quality educational content
                  that helps them navigate the complexities of modern fund management.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <CardTitle>Comprehensive Coverage</CardTitle>
                    <CardDescription className="leading-relaxed">
                      We cover all major fund types—Private Equity, Private Credit, Venture Capital, Hedge Funds,
                      Real Estate, Infrastructure, Secondaries, and GP-Stakes—ensuring relevant resources for every
                      professional.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <Target className="h-6 w-6" />
                    </div>
                    <CardTitle>Practical Focus</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Our content emphasizes actionable insights and real-world applications rather than theoretical
                      concepts, helping you implement best practices immediately.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <Users className="h-6 w-6" />
                    </div>
                    <CardTitle>For Operations Professionals</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Built specifically for CFOs, COOs, fund administrators, compliance officers, and operations
                      teams managing the day-to-day complexities of investment funds.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <CardTitle>Industry Best Practices</CardTitle>
                    <CardDescription className="leading-relaxed">
                      We synthesize industry standards, regulatory requirements, and proven approaches to help you
                      establish robust operational frameworks.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* What We Cover Section */}
        <section className="border-y border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-12 text-center text-3xl font-bold">What We Cover</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 text-xl font-semibold">Operational Pillars</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our content is organized across key operational functions including CFO responsibilities,
                    compliance and regulatory requirements, fund administration and accounting, investor relations
                    and communications, tax planning and K-1 preparation, banking and treasury management,
                    fundraising and capital raising, insurance and risk mitigation, audit and financial reporting,
                    and cybersecurity and IT infrastructure.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 text-xl font-semibold">Asset Classes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We provide specialized content for each major fund type, recognizing that Private Equity funds
                    have different operational needs than Hedge Funds, and that Real Estate funds face unique
                    challenges compared to Venture Capital. Our fund-specific resources ensure you get relevant
                    guidance for your asset class.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 text-xl font-semibold">Career Stages</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Whether you're a seasoned CFO looking to optimize existing processes, a compliance officer
                    navigating new regulations, or an operations professional expanding into new fund types, our
                    content serves professionals at all career stages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Approach Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-3xl font-bold">Our Approach</h2>

              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  FundOpsHQ content is built on the principle that fund operations knowledge should be accessible,
                  comprehensive, and immediately useful. We focus on the "how" as much as the "what"—not just
                  explaining what needs to be done, but providing practical guidance on implementation.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Each article addresses specific operational challenges, offers actionable recommendations, and
                  highlights common pitfalls to avoid. We structure content to allow quick reference while
                  providing sufficient depth for detailed understanding.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Our goal is to be the resource you turn to when facing a new operational challenge, evaluating
                  process improvements, or onboarding team members to fund operations responsibilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Built This Section */}
        <section className="border-t border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-3xl font-bold">Who Built This</h2>

              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  FundOpsHQ is maintained by <a href="https://www.linkedin.com/in/danny-bloomstine/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary underline">Danny Bloomstine</a>, Managing Director at IQ-EQ, where he provides outsourced fund administration, compliance, tax, and CFO services to investment managers.
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Over the past decade, Danny has worked at the intersection of capital markets, technology, and fund operations—beginning at S&P Capital IQ, joining as an early employee at VTS, growing business development at Juniper Square, and now leading client solutions at IQ-EQ.
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  This resource was created to bridge the gap between high-level theory and day-to-day operational reality. Every article draws from hands-on experience managing the complexities of fund operations across multiple asset classes.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <a href="https://www.linkedin.com/in/danny-bloomstine/" target="_blank" rel="noopener noreferrer">
                      Connect on LinkedIn
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href="https://outlook.office.com/bookwithme/user/64e88c9063b2407fb03a67e5c3df844d@iqeq.com/meetingtype/2GfPzbwFuEiKymGSplU9ZQ2?anonymous&ismsaljsauthenabled&ep=mcard" target="_blank" rel="noopener noreferrer">
                      Book a Conversation
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
