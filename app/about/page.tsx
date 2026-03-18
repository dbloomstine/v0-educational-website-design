import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic2, Users, Newspaper, TrendingUp, Linkedin, Building2, ArrowRight, CheckCircle2, Play, Calendar } from 'lucide-react'
import { PageHero, SectionCTA } from '@/components/layout'
import { SubscribePlatforms } from '@/components/subscribe-platforms'

export const metadata: Metadata = {
  title: 'About FundOpsHQ',
  description: 'FundOpsHQ is a weekly show and newsletter by Danny Bloomstine featuring conversations with professionals across the investment funds industry.',
  openGraph: {
    title: 'About FundOpsHQ',
    description: 'Weekly conversations with fund operations professionals. Watch, listen, and stay informed.',
    type: 'website',
    url: 'https://fundops.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About FundOpsHQ',
    description: 'Weekly conversations with fund operations professionals.',
  },
  alternates: {
    canonical: 'https://fundops.com/about',
  },
}

const values = [
  {
    icon: Mic2,
    title: "Weekly Conversations",
    description: "New episodes every week featuring professionals from across the investment funds industry."
  },
  {
    icon: Users,
    title: "Real Perspectives",
    description: "Guests share what they've actually learned—not theory, but hard-won experience from the field."
  },
  {
    icon: Newspaper,
    title: "Industry News & Newsletters",
    description: "Stay current with fund launches, market moves, and operational insights delivered to your inbox."
  },
  {
    icon: TrendingUp,
    title: "Always Free",
    description: "Every episode, newsletter, and news update is free and accessible—no paywalls or sign-ups required."
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

      <main id="main-content" className="flex-1">
        <PageHero
          title="About FundOpsHQ"
          subtitle="A weekly show, newsletters, and news covering fund operations across PE, VC, hedge funds, private credit, real estate, and more."
          titleSize="large"
        />

        {/* Mission Statement */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground mb-6">
                  What This Is
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-6 lg:text-4xl">
                  Conversations, news, and insights
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Fund operations can be complex, and good resources are hard to find. FundOpsHQ is my way of
                  bringing together the people and stories behind the work—through conversations, newsletters, and industry news.
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

        {/* The Show Section */}
        <section className="py-20 border-t border-border bg-accent/5">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground mb-6">
                    The Show
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight mb-6">
                    Conversations with fund ops professionals
                  </h2>
                  <div className="space-y-5 text-muted-foreground leading-relaxed">
                    <p>
                      FundOpsHQ is a weekly video series featuring conversations with professionals across the investment funds industry
                      who share what they've learned from the front lines of fund operations.
                    </p>
                    <p>
                      Each episode dives into real challenges, practical solutions, and career insights across
                      private equity, venture capital, credit, and other alternative asset classes.
                    </p>
                  </div>
                  <div className="mt-8">
                    <Button asChild>
                      <Link href="/interviews">
                        Watch Episodes
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                      Format
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                          <Play className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Video Interviews</div>
                          <div className="text-sm text-muted-foreground">Full episodes on YouTube</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                          <Mic2 className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Podcast</div>
                          <div className="text-sm text-muted-foreground">Audio on Spotify & Apple</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                          <Calendar className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Weekly</div>
                          <div className="text-sm text-muted-foreground">New episodes every week</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <SubscribePlatforms variant="hub" />
                  </div>
                </div>
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
                  <h2 className="text-3xl font-bold tracking-tight mb-6">Topics We Cover</h2>
                  <div className="space-y-6 text-muted-foreground">
                    <p className="leading-relaxed">
                      Our conversations and newsletters span the full spectrum of fund operations—across
                      every fund type and operational function.
                    </p>
                    <p className="leading-relaxed">
                      Whether you&apos;re a seasoned CFO, a compliance officer navigating new regulations,
                      or just getting started in fund ops—there&apos;s something here for you.
                    </p>
                  </div>
                  <div className="mt-8">
                    <Button asChild>
                      <Link href="/interviews">
                        Watch Episodes
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

        {/* Why It Exists */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Why FundOpsHQ Exists</h2>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  There&apos;s no shortage of content about investing, but very little about the operational
                  side—the people, processes, and decisions that keep funds running. That&apos;s the gap
                  FundOpsHQ is here to fill.
                </p>
                <p>
                  Every episode is a chance to hear directly from the people doing the work—what they&apos;ve
                  learned, what they&apos;d do differently, and what they wish they&apos;d known earlier.
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
                      FundOpsHQ is maintained by Danny Bloomstine, Managing Director at IQ-EQ, where he helps
                      investment managers evaluate and implement fund administration, compliance, tax, and CFO solutions.
                    </p>
                    <p>
                      Over the past decade, Danny has worked at the intersection of capital markets, technology,
                      and fund operations—beginning at S&P Capital IQ, joining as an early employee at VTS,
                      growing business development at Juniper Square, and now at IQ-EQ helping firms navigate operational decisions.
                    </p>
                    <p>
                      He started FundOpsHQ to bring more visibility to the operational side of the industry—through
                      conversations with the people doing the work, and by sharing the news and insights that matter
                      to fund ops teams.
                    </p>
                  </div>
                </div>

                {/* Connect */}
                <div className="lg:col-span-2">
                  <div className="rounded-lg border border-border/60 bg-card p-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>Managing Director at IQ-EQ</span>
                    </div>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionCTA
          title="Ready to dive in?"
          description="Watch the latest episodes or subscribe to the newsletters to stay in the loop."
        >
          <Button asChild size="lg">
            <Link href="/interviews">
              Watch Episodes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/newsletter">
              Newsletters
            </Link>
          </Button>
        </SectionCTA>
      </main>

      <SiteFooter />
    </div>
  )
}
