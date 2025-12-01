import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ChevronRight } from "lucide-react"

const pillars = [
  {
    title: "CFO",
    description: "Financial planning, budgeting, and strategic decision-making",
    articleCount: 12,
    href: "/funds/private-credit/cfo",
  },
  {
    title: "Compliance",
    description: "Regulatory requirements and best practices",
    articleCount: 18,
    href: "/funds/private-credit/compliance",
  },
  {
    title: "Fund Administration",
    description: "NAV calculations, investor reporting, and fund accounting",
    articleCount: 24,
    href: "/funds/private-credit/fund-administration",
  },
  {
    title: "Investor Relations",
    description: "Communication strategies and investor updates",
    articleCount: 15,
    href: "/funds/private-credit/investor-relations",
  },
  {
    title: "Tax",
    description: "Tax structuring, K-1s, and international tax considerations",
    articleCount: 10,
    href: "/funds/private-credit/tax",
  },
  {
    title: "Banking",
    description: "Banking relationships and cash management",
    articleCount: 8,
    href: "/funds/private-credit/banking",
  },
  {
    title: "Fundraising",
    description: "Capital raising and LP communications",
    articleCount: 16,
    href: "/funds/private-credit/fundraising",
  },
  {
    title: "Insurance",
    description: "D&O insurance and risk mitigation",
    articleCount: 6,
    href: "/funds/private-credit/insurance",
  },
  {
    title: "Audit",
    description: "Financial statement audits and internal controls",
    articleCount: 11,
    href: "/funds/private-credit/audit",
  },
  {
    title: "Cyber/IT",
    description: "Cybersecurity and technology infrastructure",
    articleCount: 9,
    href: "/funds/private-credit/cyber-it",
  },
  {
    title: "Loan Administration",
    description: "Loan servicing, documentation, and monitoring",
    articleCount: 20,
    href: "/funds/private-credit/loan-administration",
  },
]

export default function PrivateCreditPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section with accent treatment */}
        <section
          className="relative border-b border-border py-20"
          style={{
            background: `linear-gradient(135deg, oklch(0.165 0.01 250) 0%, oklch(0.19 0.08 150) 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, oklch(0.55 0.15 150) 10px, oklch(0.55 0.15 150) 11px)`,
            }}
          />

          <div className="container relative mx-auto px-4">
            {/* Breadcrumb */}
            <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Fund Types
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Private Credit</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-2 w-16 rounded-full" style={{ backgroundColor: "oklch(0.55 0.15 150)" }} />
              <h1 className="text-5xl font-bold tracking-tight">Private Credit</h1>
            </div>
            <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed">
              Comprehensive resources for private credit fund operations, from loan administration to compliance and
              reporting.
            </p>
          </div>
        </section>

        {/* Pillars Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="mb-4 text-3xl font-bold">Operational Pillars</h2>
              <p className="text-muted-foreground max-w-2xl">
                Explore articles and resources organized by functional area
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar) => (
                <Link key={pillar.title} href={pillar.href} className="group">
                  <Card className="h-full transition-all hover:border-[oklch(0.55_0.15_150)] hover:shadow-lg hover:shadow-[oklch(0.55_0.15_150)]/10">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between text-xl">
                        <span>{pillar.title}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[oklch(0.55_0.15_150)]" />
                      </CardTitle>
                      <CardDescription className="leading-relaxed">{pillar.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">{pillar.articleCount} articles</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Resources */}
        <section className="border-t border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-3xl font-bold">Featured Resources</h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-[oklch(0.55_0.15_150)]/50">
                <CardHeader>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[oklch(0.55_0.15_150)]">
                    Getting Started
                  </div>
                  <CardTitle className="text-2xl">CFO Responsibilities in Private Credit</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Financial oversight, reporting, and strategic decision-making for credit funds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/funds/private-credit/cfo"
                    className="inline-flex items-center text-sm font-medium text-[oklch(0.55_0.15_150)] hover:underline"
                  >
                    Read article <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-[oklch(0.55_0.15_150)]/50">
                <CardHeader>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[oklch(0.55_0.15_150)]">
                    Tool
                  </div>
                  <CardTitle className="text-2xl">Fund Expense Allocation Helper</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Interactive tool to classify expenses as fund or management company expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/tools/fund-expense-allocation"
                    className="inline-flex items-center text-sm font-medium text-[oklch(0.55_0.15_150)] hover:underline"
                  >
                    Use tool <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
