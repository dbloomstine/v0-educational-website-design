import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-16">
        {/* CTA Section */}
        <div className="mb-16 rounded-lg border border-border bg-accent/30 p-8 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-balance">Have a Question?</h2>
          <p className="mb-6 text-muted-foreground text-balance">
            I'm happy to be a sounding board, talk through a challenge, or point you in the right direction. No sales pitch.
          </p>
          <Button size="lg" asChild>
            <Link href="/contact">Need Help?</Link>
          </Button>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo & About */}
          <div>
            <div className="mb-4 text-lg font-semibold">
              Fund<span className="text-muted-foreground">OpsHQ</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A practical resource for fund operations professionals across all asset classes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/newsletter" className="text-muted-foreground hover:text-foreground transition-colors">
                  Newsletters
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tools & Templates
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a href="https://fundopshq-shop.myshopify.com/collections/all" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
                  Shop
                </a>
              </li>
            </ul>
          </div>

          {/* How I Can Help */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">How I Can Help</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help/sec-exam-prep" className="text-muted-foreground hover:text-foreground transition-colors">
                  SEC Exam Prep
                </Link>
              </li>
              <li>
                <Link href="/help/fund-admin-selection" className="text-muted-foreground hover:text-foreground transition-colors">
                  Fund Admin Selection
                </Link>
              </li>
              <li>
                <Link href="/help/launching-a-fund" className="text-muted-foreground hover:text-foreground transition-colors">
                  Launching a Fund
                </Link>
              </li>
              <li>
                <Link href="/help/compliance-review" className="text-muted-foreground hover:text-foreground transition-colors">
                  Compliance Review
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  View All
                </Link>
              </li>
            </ul>
          </div>

          {/* Fund Types - Column 1 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Fund Types</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/funds/private-equity"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Private Equity
                </Link>
              </li>
              <li>
                <Link
                  href="/funds/private-credit"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Private Credit
                </Link>
              </li>
              <li>
                <Link
                  href="/funds/venture-capital"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Venture Capital
                </Link>
              </li>
              <li>
                <Link
                  href="/funds/hedge-funds"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Hedge Funds
                </Link>
              </li>
            </ul>
          </div>

          {/* Fund Types - Column 2 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider opacity-0">Fund Types</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/funds/real-estate"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Real Estate
                </Link>
              </li>
              <li>
                <Link
                  href="/funds/infrastructure"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Infrastructure
                </Link>
              </li>
              <li>
                <Link
                  href="/funds/secondaries"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Secondaries
                </Link>
              </li>
              <li>
                <Link
                  href="/funds/gp-stakes"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GP-Stakes
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} FundOpsHQ. All rights reserved.</p>
          <p>
            Built by <a href="https://www.linkedin.com/in/danny-bloomstine/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary underline">Danny Bloomstine</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
