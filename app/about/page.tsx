import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Target, TrendingUp, Linkedin, Calendar, Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

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

const values = [
  {
    icon: BookOpen,
    title: "Comprehensive Coverage",
    description: "All major fund types covered—PE, VC, Credit, Hedge Funds, Real Estate, Infrastructure, Secondaries, and GP-Stakes."
  },
  {
    icon: Target,
    title: "Practical Focus",
    description: "Actionable insights and real-world applications you can implement immediately, not just theory."
  },
  {
    icon: Users,
    title: "Built for Operators",
    description: "Created specifically for CFOs, COOs, fund administrators, compliance officers, and operations teams."
  },
  {
    icon: TrendingUp,
    title: "Industry Standards",
    description: "Synthesized best practices, regulatory requirements, and proven operational frameworks."
  },
]

const operationalAreas = [
  "CFO & Finance",
  "Compliance & Regulatory",
  "Fund Administration",
  "Investor Relations",
  "Tax & K-1 Preparation",
  "Banking & Treasury",
  "Fundraising",
  "Insurance & Risk",
  "Audit & Reporting",
  "Cybersecurity & IT",
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20" />

          <div className="container relative mx-auto px-4 py-24 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance lg:text-6xl">
                About FundOpsHQ
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                A comprehensive resource for fund operations professionals, providing practical insights
                and best practices across all investment fund types and operational functions.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground mb-6">
                  Our Mission
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-6 lg:text-4xl">
                  Making fund operations knowledge accessible
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  We believe fund operations knowledge should be accessible, comprehensive, and immediately useful.
                  Our focus is on the "how" as much as the "what"—providing practical guidance you can implement today.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {values.map((value) => (
                  <Card key={value.title} className="border-border/60">
                    <CardHeader>
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
                        <value.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">{value.title}</CardTitle>
                      <CardDescription className="leading-relaxed text-base">
                        {value.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What We Cover */}
        <section className="py-20 border-y border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-6">What We Cover</h2>
                  <div className="space-y-6 text-muted-foreground">
                    <p className="leading-relaxed">
                      Our content spans the full spectrum of fund operations, organized by operational function
                      and tailored to each fund type's unique requirements.
                    </p>
                    <p className="leading-relaxed">
                      Whether you're a seasoned CFO optimizing processes, a compliance officer navigating new regulations,
                      or an operations professional expanding into new fund types—we have resources for you.
                    </p>
                  </div>
                  <div className="mt-8">
                    <Button asChild>
                      <Link href="/#fund-types">
                        Explore by Fund Type
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                    Operational Areas
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {operationalAreas.map((area) => (
                      <div key={area} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Approach */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Our Approach</h2>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Each article on FundOpsHQ addresses specific operational challenges, offers actionable
                  recommendations, and highlights common pitfalls to avoid. We structure content to allow
                  quick reference while providing sufficient depth for detailed understanding.
                </p>
                <p>
                  Our goal is to be the resource you turn to when facing a new operational challenge,
                  evaluating process improvements, or onboarding team members to fund operations responsibilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Built This */}
        <section className="py-20 border-t border-border bg-gradient-to-b from-accent/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-12 lg:grid-cols-5 lg:gap-16 items-start">
                {/* Bio content */}
                <div className="lg:col-span-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground mb-6">
                    About the Creator
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight mb-6">Danny Bloomstine</h2>

                  <div className="space-y-5 text-muted-foreground leading-relaxed">
                    <p>
                      FundOpsHQ is maintained by Danny Bloomstine, Managing Director at IQ-EQ, where he provides
                      outsourced fund administration, compliance, tax, and CFO services to investment managers.
                    </p>
                    <p>
                      Over the past decade, Danny has worked at the intersection of capital markets, technology,
                      and fund operations—beginning at S&P Capital IQ, joining as an early employee at VTS,
                      growing business development at Juniper Square, and now leading client solutions at IQ-EQ.
                    </p>
                    <p>
                      This resource was created to bridge the gap between high-level theory and day-to-day
                      operational reality. Every article draws from hands-on experience managing the complexities
                      of fund operations across multiple asset classes.
                    </p>
                  </div>
                </div>

                {/* CTA Card */}
                <div className="lg:col-span-2">
                  <Card className="border-border/60 bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Want to chat?</CardTitle>
                      <CardDescription>
                        I'm happy to be a sounding board, answer questions, or just talk shop. No sales pitch.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button asChild className="w-full" size="lg">
                        <a
                          href="https://outlook.office.com/bookwithme/user/64e88c9063b2407fb03a67e5c3df844d@iqeq.com/meetingtype/2GfPzbwFuEiKymGSplU9ZQ2?anonymous&ismsaljsauthenabled&ep=mcard"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Book a Conversation
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="w-full" size="lg">
                        <a
                          href="https://www.linkedin.com/in/danny-bloomstine/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Linkedin className="mr-2 h-4 w-4" />
                          Connect on LinkedIn
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>Managing Director at IQ-EQ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Ready to dive in?</h2>
              <p className="text-muted-foreground mb-8">
                Explore our resources by fund type or check out our free tools and calculators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/#fund-types">
                    Explore Resources
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/tools">
                    Free Tools
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
