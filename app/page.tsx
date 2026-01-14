import { Metadata } from 'next'
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { StaggeredGrid } from "@/components/staggered-grid"
import { AnimatedCounter } from "@/components/animated-counter"
import { BackToTop } from "@/components/back-to-top"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calculator, Building, DollarSign, Users, Shield } from "lucide-react"
import { getAllFundTypes } from "@/lib/content/fund-types"
import { getAllTools } from "@/lib/content/tools"
import { getAllRoles } from "@/lib/content/roles"

export const metadata: Metadata = {
  title: 'FundOpsHQ | Learn Fund Operations for PE, VC, Credit & More',
  description: 'Free educational resources for fund operations professionals. Articles, tools, and guides covering Private Equity, Venture Capital, Hedge Funds, Private Credit, Real Estate, and Infrastructure fund operations.',
  openGraph: {
    title: 'FundOpsHQ | Learn Fund Operations for PE, VC, Credit & More',
    description: 'Free educational resources for fund operations professionals. Articles, tools, and guides across all alternative asset classes.',
    type: 'website',
    url: 'https://fundops.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundOpsHQ | Learn Fund Operations',
    description: 'Free educational resources for fund operations professionals across all alternative asset classes.',
  },
  alternates: {
    canonical: 'https://fundops.com',
  },
}

const fundTypes = getAllFundTypes().map((fundType) => ({
  name: fundType.name,
  description: fundType.description,
  href: `/funds/${fundType.slug}`,
  color: fundType.color,
}))

const tools = getAllTools().filter(tool => tool.status === 'active').slice(0, 6)

const roles = getAllRoles()

const operationalPillars = [
  { name: "CFO & Finance", icon: DollarSign, description: "Budgeting, reporting, and financial oversight" },
  { name: "Compliance", icon: Shield, description: "Regulatory requirements and best practices" },
  { name: "Fund Administration", icon: Building, description: "NAV, capital accounts, and investor reporting" },
  { name: "Investor Relations", icon: Users, description: "LP communications and fundraising support" },
]

const featuredArticles = [
  {
    title: "CFO Responsibilities in Private Equity Funds",
    description: "Managing portfolio company oversight, value creation, and investor reporting",
    category: "Private Equity",
    href: "/funds/private-equity/cfo",
    color: "oklch(0.60 0.16 270)",  // Muted purple (matches PE fund type)
    readingTime: "9 min read",
  },
  {
    title: "Infrastructure Fund Banking & Treasury",
    description: "Project finance structures, lender relationships, and long-term debt management",
    category: "Infrastructure",
    href: "/funds/infrastructure/banking",
    color: "oklch(0.60 0.14 200)",  // Slate blue (matches Infrastructure fund type)
    readingTime: "12 min read",
  },
  {
    title: "Hedge Fund Compliance Frameworks",
    description: "Building robust compliance programs for multi-strategy funds",
    category: "Hedge Funds",
    href: "/funds/hedge-funds/compliance",
    color: "oklch(0.55 0.03 250)",  // Slate gray (monochrome)
    readingTime: "15 min read",
  },
]

// Organization structured data for homepage
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FundOpsHQ',
  url: 'https://fundops.com',
  logo: 'https://fundops.com/icon.svg',
  description: 'Free articles and tools to help you learn fund operations across Private Equity, Venture Capital, Hedge Funds, Private Credit, Real Estate, and Infrastructure.',
  founder: {
    '@type': 'Person',
    name: 'Danny Bloomstine',
    url: 'https://www.linkedin.com/in/danny-bloomstine/',
    jobTitle: 'Managing Director',
    worksFor: {
      '@type': 'Organization',
      name: 'IQ-EQ',
    },
  },
  sameAs: [
    'https://www.linkedin.com/in/danny-bloomstine/',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    url: 'https://fundops.com/contact',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FundOpsHQ',
  url: 'https://fundops.com',
  description: 'Free resources to help you learn fund operations',
  publisher: {
    '@type': 'Organization',
    name: 'FundOpsHQ',
  },
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section - Institutional */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left content - 7 columns */}
              <div className="lg:col-span-7">
                <AnimateOnScroll delay={0}>
                  <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    Free Resources
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={100}>
                  <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{ letterSpacing: '-0.02em' }}>
                    Learn fund operations, one topic at a time
                  </h1>
                </AnimateOnScroll>

                <AnimateOnScroll delay={200}>
                  <p className="mb-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
                    Free articles and tools to help you understand fund ops—whether you&apos;re new to the field or diving deeper into a specific topic. Covering PE, VC, credit, hedge funds, real estate, infrastructure, and more.
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={300}>
                  <Button asChild size="lg" className="px-8">
                    <Link href="#fund-types">
                      Explore Resources
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </AnimateOnScroll>
              </div>

              {/* Right visual - 5 columns - Abstract gradient fade */}
              <div className="hidden md:block lg:col-span-5 relative min-h-[200px] lg:min-h-0">
                {/* Floating gradient orbs that fade to the right */}
                <div className="absolute inset-0 overflow-hidden">
                  {/* Large primary orb */}
                  <div
                    className="absolute -right-20 top-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full opacity-30"
                    style={{
                      background: 'radial-gradient(circle, hsla(210, 60%, 50%, 0.4) 0%, hsla(210, 50%, 40%, 0.1) 40%, transparent 70%)',
                      filter: 'blur(40px)',
                    }}
                  />
                  {/* Secondary accent orb */}
                  <div
                    className="absolute right-10 bottom-1/4 w-48 lg:w-72 h-48 lg:h-72 rounded-full opacity-25"
                    style={{
                      background: 'radial-gradient(circle, hsla(230, 50%, 45%, 0.35) 0%, hsla(225, 40%, 35%, 0.1) 50%, transparent 70%)',
                      filter: 'blur(50px)',
                    }}
                  />
                  {/* Subtle teal accent */}
                  <div
                    className="absolute right-1/3 top-1/3 w-32 lg:w-48 h-32 lg:h-48 rounded-full opacity-20"
                    style={{
                      background: 'radial-gradient(circle, hsla(195, 60%, 45%, 0.3) 0%, transparent 60%)',
                      filter: 'blur(30px)',
                    }}
                  />
                </div>

                {/* Subtle dot grid pattern that fades out */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, hsla(215, 40%, 60%, 0.15) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 60%, transparent 100%)',
                  }}
                />

                {/* Diagonal lines accent */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, hsla(215, 40%, 70%, 1) 0px, hsla(215, 40%, 70%, 1) 1px, transparent 1px, transparent 20px)',
                    maskImage: 'linear-gradient(to right, transparent 10%, black 40%, black 70%, transparent 95%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 10%, black 40%, black 70%, transparent 95%)',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Operational Pillars - Quick Overview */}
        <section className="py-10 border-b border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {operationalPillars.map((pillar, index) => (
                <div
                  key={pillar.name}
                  className="flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-accent/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <pillar.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{pillar.name}</h3>
                    <p className="text-sm text-muted-foreground">{pillar.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fund Types Grid */}
        <section id="fund-types" className="py-16 scroll-mt-16">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mb-10">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  By Asset Class
                </p>
                <h2 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>Explore by Fund Type</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Find relevant resources tailored to your specific asset class and fund structure
                </p>
              </div>
            </AnimateOnScroll>

            <StaggeredGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={75} duration={700}>
              {fundTypes.map((fund) => (
                <Link key={fund.name} href={fund.href} className="group h-full">
                  <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                    <CardHeader className="pb-2">
                      <div
                        className="mb-3 h-1 w-10 rounded-full"
                        style={{ backgroundColor: fund.color }}
                      />
                      <CardTitle className="text-base font-semibold">{fund.name}</CardTitle>
                      <CardDescription className="leading-relaxed text-sm">{fund.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        Explore
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </StaggeredGrid>
          </div>
        </section>

        {/* Roles Grid */}
        <section className="py-16 border-t border-border bg-accent/5">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mb-10">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  By Role
                </p>
                <h2 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>Explore by Role</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Find resources relevant to your function
                </p>
              </div>
            </AnimateOnScroll>

            <StaggeredGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={100} duration={700}>
              {roles.map((role) => (
                <Link key={role.slug} href={`/roles/${role.slug}`} className="group h-full">
                  <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">{role.title}</CardTitle>
                      <CardDescription className="leading-relaxed text-sm">{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        View Resources
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </StaggeredGrid>
          </div>
        </section>

        {/* Tools Section - Featured */}
        <section className="py-16 border-y border-border">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    Resources
                  </p>
                  <h2 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>Tools & Calculators</h2>
                  <p className="text-muted-foreground max-w-2xl">
                    Practical calculators and planning tools for fund operations
                  </p>
                </div>
                <Button variant="outline" asChild className="sm:shrink-0">
                  <Link href="/tools">
                    View All Tools
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </AnimateOnScroll>

            <StaggeredGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={100} duration={700}>
              {tools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group h-full">
                  <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                    <CardHeader>
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-sm bg-accent/60">
                        <Calculator className="h-4 w-4 text-foreground" />
                      </div>
                      <CardTitle className="text-base font-semibold leading-snug">{tool.title}</CardTitle>
                      <CardDescription className="leading-relaxed text-sm">{tool.shortDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        Use Tool
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </StaggeredGrid>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mb-10">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Insights
                </p>
                <h2 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>Featured Resources</h2>
                <p className="text-muted-foreground max-w-2xl">
                  In-depth guides on critical fund operations topics
                </p>
              </div>
            </AnimateOnScroll>

            <StaggeredGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={100} duration={700}>
              {featuredArticles.map((article) => (
                <Link key={article.title} href={article.href} className="group h-full">
                  <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                    <CardHeader>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: article.color }}
                          />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {article.category}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {article.readingTime}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-semibold leading-snug group-hover:text-foreground transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="leading-relaxed text-sm">
                        {article.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        Read Article
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </StaggeredGrid>
          </div>
        </section>

        {/* Stats/Trust Section */}
        <section className="py-10 border-y border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={80} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">In-depth articles</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={8} duration={1500} />
                </div>
                <div className="text-sm text-muted-foreground">Fund types covered</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={6} duration={1500} />
                </div>
                <div className="text-sm text-muted-foreground">Free interactive tools</div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mb-10 text-center">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Newsletters
                </p>
                <h2 className="mb-3 text-2xl font-bold" style={{ letterSpacing: '-0.01em' }}>Stay in the loop</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Two newsletters, two different focuses. Pick what works for you.
                </p>
              </div>
            </AnimateOnScroll>

            <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              <Link href="/newsletter/fundopshq-insights" className="group">
                <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">FundOpsHQ Insights</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Deep dives on fund operations topics, frameworks, and practical guidance. Published when there&apos;s something worth sharing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/newsletter/fundwatch-briefing" className="group">
                <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">FundWatch Briefing</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Weekly roundup of fund launches, closes, and industry news. Quick reads to stay current on what&apos;s happening in the market.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* About/CTA Section */}
        <section className="py-16 border-t border-border bg-accent/5">
          <div className="container mx-auto px-4">
            <AnimateOnScroll className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                About
              </p>
              <h2 className="mb-3 text-2xl font-bold" style={{ letterSpacing: '-0.01em' }}>Built by someone who does this work</h2>
              <p className="mb-4 text-muted-foreground text-balance leading-relaxed">
                Hi, I&apos;m Danny. I&apos;ve spent over a decade in fund operations across PE, VC, credit, and infrastructure funds. I built FundOpsHQ to share what I&apos;ve learned along the way.
              </p>
              <p className="mb-6 text-muted-foreground text-balance leading-relaxed">
                Whether you&apos;re just getting started or brushing up on a specific topic, I hope you find something useful here. No sales pitch, just practical knowledge.
              </p>
              <Button variant="outline" asChild>
                <Link href="/about">
                  More about FundOpsHQ
                </Link>
              </Button>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
