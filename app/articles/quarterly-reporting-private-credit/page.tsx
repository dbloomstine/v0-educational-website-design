import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

export default function ArticlePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Article Header */}
        <article className="py-12">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Article</span>
            </div>

            {/* Article Hero */}
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex items-center gap-3 text-sm">
                <span className="rounded-full bg-[oklch(0.58_0.14_160)] px-3 py-1 font-medium text-white">
                  Private Credit
                </span>
              </div>

              <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-balance">
                Streamlining Quarterly Reporting for Private Credit Funds
              </h1>

              <p className="mb-12 text-xl text-muted-foreground leading-relaxed text-balance">
                A step-by-step guide to reducing reporting time by 40% while maintaining accuracy and compliance
              </p>

              <div className="border-b border-border pb-12" />
            </div>

            {/* Article Body */}
            <div className="mx-auto mt-12 max-w-3xl">
              <div className="prose prose-invert prose-lg max-w-none">
                <h2 className="mb-4 mt-12 text-3xl font-bold">The Challenge</h2>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Quarterly reporting for private credit funds is one of the most time-consuming operational tasks.
                  Between gathering data from multiple sources, reconciling positions, and preparing investor
                  communications, operations teams often spend weeks on each reporting cycle.
                </p>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  The pressure is compounded by tight deadlines and the need for absolute accuracy. Yet many funds still
                  rely on manual processes and disconnected systems that slow everything down.
                </p>

                <h2 className="mb-4 mt-12 text-3xl font-bold">Five Key Strategies</h2>

                <h3 className="mb-3 mt-8 text-2xl font-semibold">1. Standardize Your Data Collection</h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Create templates for all data inputs and establish clear deadlines for portfolio companies and service
                  providers. This eliminates last-minute scrambles and ensures consistency across reporting periods.
                </p>

                <h3 className="mb-3 mt-8 text-2xl font-semibold">2. Automate Portfolio Monitoring</h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Implement automated dashboards that track key metrics in real-time. This reduces the month-end
                  scramble and allows you to spot issues before they become problems in your quarterly reports.
                </p>

                <h3 className="mb-3 mt-8 text-2xl font-semibold">3. Build Reusable Report Templates</h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Develop a library of report templates that can be quickly updated each quarter. Include sections for
                  commentary, metrics, and compliance disclosures that remain largely consistent period over period.
                </p>

                <h3 className="mb-3 mt-8 text-2xl font-semibold">4. Establish a Clear Review Process</h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Define who reviews what and when. A structured review process with clear handoffs prevents bottlenecks
                  and ensures nothing falls through the cracks.
                </p>

                <h3 className="mb-3 mt-8 text-2xl font-semibold">5. Document Everything</h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Maintain detailed process documentation and calculation methodologies. This not only helps with
                  consistency but also makes onboarding new team members much faster.
                </p>

                <h2 className="mb-4 mt-12 text-3xl font-bold">Implementation Timeline</h2>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  These changes don't need to happen all at once. Start with data standardization in your next reporting
                  cycle, then layer in automation and templates over the following quarters. Most teams see meaningful
                  time savings within 6 months.
                </p>

                <h2 className="mb-4 mt-12 text-3xl font-bold">Conclusion</h2>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Streamlining quarterly reporting isn't about cutting corners—it's about eliminating inefficiencies so
                  your team can focus on analysis and insights rather than data wrangling. The time savings compound
                  over each quarter, giving your operations team capacity for more strategic work.
                </p>
              </div>

              {/* CTA Callout */}
              <Card className="mt-16 border-accent bg-accent/30">
                <CardHeader>
                  <CardTitle className="text-2xl">Need tailored guidance?</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    We help fund operations teams implement these strategies and more. Let's discuss your specific
                    challenges.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="lg" asChild>
                    <Link href="/contact">We're here to help</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Related Articles */}
              <div className="mt-20 border-t border-border pt-12">
                <h2 className="mb-8 text-3xl font-bold">Related Articles</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <Link href="/funds/private-credit/fund-administration">
                    <Card className="h-full transition-all hover:border-accent hover:shadow-lg">
                      <CardHeader>
                        <div className="mb-2 text-xs text-muted-foreground">Fund Administration</div>
                        <CardTitle className="text-xl leading-snug text-balance">
                          Fund Administration for Private Credit
                        </CardTitle>
                        <CardDescription>
                          NAV calculations, investor reporting, and operational best practices
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="/funds/private-credit/cfo">
                    <Card className="h-full transition-all hover:border-accent hover:shadow-lg">
                      <CardHeader>
                        <div className="mb-2 text-xs text-muted-foreground">Private Credit</div>
                        <CardTitle className="text-xl leading-snug text-balance">
                          CFO Responsibilities in Private Credit
                        </CardTitle>
                        <CardDescription>
                          Financial oversight, reporting, and strategic decision-making for credit funds
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
