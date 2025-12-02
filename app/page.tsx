import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
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
    color: "oklch(0.55 0.15 250)",
  },
  {
    title: "Infrastructure Fund Banking & Treasury",
    description: "Project finance structures, lender relationships, and long-term debt management",
    category: "Infrastructure",
    href: "/funds/infrastructure/banking",
    color: "oklch(0.55 0.15 80)",
  },
  {
    title: "Hedge Fund Compliance Frameworks",
    description: "Building robust compliance programs for multi-strategy funds",
    category: "Hedge Funds",
    href: "/funds/hedge-funds/compliance",
    color: "oklch(0.55 0.15 180)",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section - Enhanced */}
        <section className="relative border-b border-border overflow-hidden">
          {/* Subtle gradient mesh background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/30" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, oklch(0.6 0.15 250) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, oklch(0.6 0.15 180) 0%, transparent 50%)`,
            }}
          />

          <div className="container relative mx-auto px-4 py-20 sm:py-28 lg:py-36">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground backdrop-blur-sm">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Free resources for fund operations professionals</span>
              </div>

              <h1 className="mb-6 sm:mb-8 text-4xl sm:text-5xl font-bold tracking-tight text-balance lg:text-6xl">
                The operations playbook for{" "}
                <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                  private fund professionals
                </span>
              </h1>

              <p className="mx-auto mb-8 sm:mb-12 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed text-balance">
                Practical guidance for CFOs, COOs, IR, compliance, and operations teams across PE, VC, credit, hedge funds, real estate, infrastructure, and beyond.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="text-base px-8">
                  <Link href="#fund-types">
                    Explore Resources
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg" className="text-base px-8">
                  <Link href="/tools">
                    Free Tools & Calculators
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative bottom border gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </section>

        {/* Operational Pillars - Quick Overview */}
        <section className="py-16 border-b border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        <section id="fund-types" className="py-20 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">Explore by Fund Type</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Find relevant resources tailored to your specific asset class and fund structure
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {fundTypes.map((fund) => (
                <Link key={fund.name} href={fund.href} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 border-border/60 hover:border-accent/60">
                    <CardHeader className="pb-3">
                      <div
                        className="mb-4 h-1 w-10 rounded-full transition-all duration-300 group-hover:w-16"
                        style={{ backgroundColor: fund.color }}
                      />
                      <CardTitle className="text-lg">{fund.name}</CardTitle>
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
        <section className="py-20 border-y border-border bg-gradient-to-b from-accent/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  <Calculator className="h-3 w-3" />
                  Free Tools
                </div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight">Interactive Tools & Calculators</h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Practical calculators and planning tools built for fund operations professionals
                </p>
              </div>
              <Button variant="outline" asChild className="sm:shrink-0">
                <Link href="/tools">
                  View All Tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 border-border/60 hover:border-accent/60">
                    <CardHeader>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent group-hover:bg-accent/80 transition-colors">
                        <Calculator className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg leading-snug">{tool.title}</CardTitle>
                      <CardDescription className="leading-relaxed">{tool.shortDescription}</CardDescription>
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
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight">Featured Resources</h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  In-depth guides on critical fund operations topics
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <Link key={article.title} href={article.href} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 border-border/60">
                    <CardHeader>
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: article.color }}
                        />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {article.category}
                        </span>
                      </div>
                      <CardTitle className="text-xl leading-snug group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="leading-relaxed text-base">
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
        <section className="py-16 border-y border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              <div>
                <div className="text-4xl font-bold text-foreground mb-2">80+</div>
                <div className="text-muted-foreground">In-depth articles</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground mb-2">8</div>
                <div className="text-muted-foreground">Fund types covered</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground mb-2">11</div>
                <div className="text-muted-foreground">Free interactive tools</div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section - Enhanced */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-accent/20 p-8 lg:p-12">
                <div className="text-center">
                  <h2 className="mb-4 text-3xl font-bold tracking-tight">Stay informed</h2>
                  <p className="mb-8 text-lg text-muted-foreground text-balance">
                    Get curated fund operations insights, regulatory updates, and practical guidance delivered to your inbox.
                  </p>

                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Button asChild size="lg" className="text-base">
                      <Link href="/newsletter/fundopshq-insights">
                        FundOpsHQ Insights
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild size="lg" className="text-base">
                      <Link href="/newsletter/fundwatch-briefing">
                        FundWatch Briefing
                      </Link>
                    </Button>
                  </div>

                  <p className="mt-6 text-sm text-muted-foreground">
                    <Link href="/newsletter" className="hover:text-foreground transition-colors underline">
                      View all newsletters
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About/CTA Section */}
        <section className="py-20 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">Built by fund ops professionals</h2>
              <p className="mb-8 text-lg text-muted-foreground text-balance leading-relaxed">
                FundOpsHQ was created to share practical knowledge from years of experience across private equity, venture capital, credit, and alternative asset fund operations. Have a question or want to talk through a challenge? I'm happy to help.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild size="lg">
                  <Link href="/about">
                    About FundOpsHQ
                  </Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/contact">
                    Contact
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
