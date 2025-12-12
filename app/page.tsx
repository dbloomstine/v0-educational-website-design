import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calculator, FileText, TrendingUp, Building, Calendar, DollarSign, Users, Shield, BookOpen } from "lucide-react"
import { getAllFundTypes } from "@/lib/content/fund-types"
import { getAllTools } from "@/lib/content/tools"

const fundTypes = getAllFundTypes().map((fundType) => ({
  name: fundType.name,
  description: fundType.description,
  href: `/funds/${fundType.slug}`,
  color: fundType.color,
}))

const tools = getAllTools().filter(tool => tool.status === 'active').slice(0, 6)

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
  },
  {
    title: "Infrastructure Fund Banking & Treasury",
    description: "Project finance structures, lender relationships, and long-term debt management",
    category: "Infrastructure",
    href: "/funds/infrastructure/banking",
    color: "oklch(0.60 0.14 200)",  // Slate blue (matches Infrastructure fund type)
  },
  {
    title: "Hedge Fund Compliance Frameworks",
    description: "Building robust compliance programs for multi-strategy funds",
    category: "Hedge Funds",
    href: "/funds/hedge-funds/compliance",
    color: "oklch(0.55 0.03 250)",  // Slate gray (monochrome)
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
                    Fund Operations Resources
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={100}>
                  <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{ letterSpacing: '-0.02em' }}>
                    Navigate fund operations with confidence
                  </h1>
                </AnimateOnScroll>

                <AnimateOnScroll delay={200}>
                  <p className="mb-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
                    Practical articles and tools for CFOs, COOs, and operations teams. Covering private equity, venture capital, credit, hedge funds, real estate, and infrastructure.
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

              {/* Right visual - 5 columns */}
              <AnimateOnScroll delay={200} direction="left" className="hidden lg:block lg:col-span-5">
                <div className="relative aspect-[4/3] rounded-sm bg-accent/40 border border-border/60 overflow-hidden">
                  {/* Placeholder for future imagery - subtle pattern */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `linear-gradient(135deg, transparent 25%, oklch(0.5 0.02 250 / 0.1) 25%, oklch(0.5 0.02 250 / 0.1) 50%, transparent 50%, transparent 75%, oklch(0.5 0.02 250 / 0.1) 75%)`,
                      backgroundSize: '20px 20px'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted-foreground/60">
                      <Building className="h-16 w-16 mx-auto mb-3 opacity-40" />
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {fundTypes.map((fund) => (
                <Link key={fund.name} href={fund.href} className="group">
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
            </div>
          </div>
        </section>

        {/* Tools Section - Featured */}
        <section className="py-16 border-y border-border bg-accent/5">
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group">
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
            </div>
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

            <div className="grid gap-4 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <Link key={article.title} href={article.href} className="group">
                  <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: article.color }}
                        />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {article.category}
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
            </div>
          </div>
        </section>

        {/* Stats/Trust Section */}
        <section className="py-10 border-y border-border bg-card/30">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="grid gap-8 sm:grid-cols-3 text-center">
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">80+</div>
                  <div className="text-sm text-muted-foreground">In-depth articles</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">8</div>
                  <div className="text-sm text-muted-foreground">Fund types covered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">11</div>
                  <div className="text-sm text-muted-foreground">Free interactive tools</div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <AnimateOnScroll className="mx-auto max-w-2xl">
              <div className="rounded-sm border border-border bg-card p-8 lg:p-10">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground text-center">
                  Newsletter
                </p>
                <h2 className="mb-3 text-2xl font-bold text-center" style={{ letterSpacing: '-0.01em' }}>Stay informed</h2>
                <p className="mb-6 text-muted-foreground text-balance text-center">
                  Fund operations insights, regulatory updates, and practical guidance delivered to your inbox.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link href="/newsletter/fundopshq-insights">
                      FundOpsHQ Insights
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/newsletter/fundwatch-briefing">
                      FundWatch Briefing
                    </Link>
                  </Button>
                </div>

                <p className="mt-5 text-sm text-muted-foreground text-center">
                  <Link href="/newsletter" className="hover:text-foreground transition-colors underline underline-offset-4">
                    View all newsletters
                  </Link>
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* About/CTA Section */}
        <section className="py-16 border-t border-border bg-accent/5">
          <div className="container mx-auto px-4">
            <AnimateOnScroll className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                About
              </p>
              <h2 className="mb-3 text-2xl font-bold" style={{ letterSpacing: '-0.01em' }}>Here to help you learn</h2>
              <p className="mb-6 text-muted-foreground text-balance leading-relaxed">
                FundOpsHQ is a free resource built to share what I've learned from years in fund operations. Whether you're new to the field or looking to brush up on a topic, I hope you find something useful here.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild>
                  <Link href="/about">
                    About FundOpsHQ
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">
                    Get in Touch
                  </Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
