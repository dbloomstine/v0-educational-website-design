import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const fundTypes = [
  {
    name: "Private Equity",
    description: "Operational excellence for PE funds and portfolio companies",
    href: "/funds/private-equity",
    color: "oklch(0.65 0.19 275)",
  },
  {
    name: "Private Credit",
    description: "Best practices for credit fund operations and monitoring",
    href: "/funds/private-credit",
    color: "oklch(0.55 0.15 150)",
  },
  {
    name: "Venture Capital",
    description: "Scaling operations for high-growth VC portfolios",
    href: "/funds/venture-capital",
    color: "oklch(0.65 0.22 30)",
  },
  {
    name: "Hedge Funds",
    description: "Compliance and operations for complex trading strategies",
    href: "/funds/hedge-funds",
    color: "oklch(0.62 0.18 220)",
  },
  {
    name: "Real Estate",
    description: "Property management and investment operations",
    href: "/funds/real-estate",
    color: "oklch(0.58 0.14 90)",
  },
  {
    name: "Infrastructure",
    description: "Long-term asset management and reporting",
    href: "/funds/infrastructure",
    color: "oklch(0.6 0.16 180)",
  },
  {
    name: "Secondaries",
    description: "Transfer processes and valuation operations",
    href: "/funds/secondaries",
    color: "oklch(0.64 0.20 320)",
  },
  {
    name: "GP-Stakes",
    description: "Governance and operations for GP investments",
    href: "/funds/gp-stakes",
    color: "oklch(0.66 0.18 50)",
  },
]

const recentInsights = [
  {
    title: "CFO Responsibilities in Private Equity Funds",
    description: "Managing portfolio company oversight, value creation, and investor reporting",
    category: "Private Equity",
    date: "Dec 18, 2024",
    href: "/funds/private-equity/cfo",
  },
  {
    title: "Infrastructure Fund Banking & Treasury Management",
    description: "Project finance structures, lender relationships, and long-term debt management",
    category: "Infrastructure",
    date: "Dec 18, 2024",
    href: "/funds/infrastructure/banking",
  },
  {
    title: "Secondaries Fundraising: Deal Sourcing and Track Record",
    description: "Demonstrating competitive advantages through relationships and performance attribution",
    category: "Secondaries",
    date: "Dec 18, 2024",
    href: "/funds/secondaries/fundraising",
  },
]

const toolsResources = [
  {
    title: "Compliance Resources for Hedge Funds",
    description: "Comprehensive compliance frameworks and regulatory requirements",
    href: "/funds/hedge-funds/compliance",
  },
  {
    title: "Fund Administration Best Practices",
    description: "NAV calculations, capital accounts, and investor reporting",
    href: "/funds/private-equity/fund-administration",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance">
                A practical resource for fund operations
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Educational content and tools for CFOs, COOs, and operations professionals managing investment funds
                across all asset classes.
              </p>
            </div>
          </div>
        </section>

        {/* Fund Types Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-balance">Explore by Fund Type</h2>
              <p className="text-muted-foreground text-balance">
                Find relevant resources for your specific asset class
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {fundTypes.map((fund) => (
                <Link key={fund.name} href={fund.href} className="group">
                  <Card className="h-full transition-all hover:border-accent hover:shadow-lg">
                    <CardHeader>
                      <div
                        className="mb-3 h-1 w-12 rounded-full transition-all group-hover:w-full"
                        style={{ backgroundColor: fund.color }}
                      />
                      <CardTitle className="text-xl">{fund.name}</CardTitle>
                      <CardDescription className="leading-relaxed">{fund.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        Explore <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Insights */}
        <section className="border-y border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="mb-4 text-3xl font-bold">Recent Insights</h2>
                <p className="text-muted-foreground">Latest articles and best practices from the field</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/">
                  View All Fund Types <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {recentInsights.map((article) => (
                <Link key={article.title} href={article.href}>
                  <Card className="h-full transition-all hover:border-accent hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{article.category}</span>
                        <span>•</span>
                        <span>{article.date}</span>
                      </div>
                      <CardTitle className="text-xl leading-snug text-balance">{article.title}</CardTitle>
                      <CardDescription className="leading-relaxed">{article.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Tools & Resources Teaser */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="mb-4 text-3xl font-bold">Tools & Resources</h2>
                <p className="text-muted-foreground">Practical templates and checklists for your operations</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/">
                  Explore Resources <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {toolsResources.map((tool) => (
                <Link key={tool.title} href={tool.href}>
                  <Card className="transition-all hover:border-accent hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                      <CardDescription className="leading-relaxed">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm font-medium text-muted-foreground">
                        Download <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="border-t border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold">Stay Informed</h2>
              <p className="mb-8 text-lg text-muted-foreground text-balance">
                Get weekly insights on fund operations delivered to your inbox. Practical content, no fluff.
              </p>
              <div className="rounded-lg border border-border bg-card p-8">
                <p className="mb-4 text-sm text-muted-foreground">Newsletter signup coming soon - powered by Beehiiv</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    disabled
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button size="lg" className="sm:w-auto" disabled>
                    Coming Soon
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
