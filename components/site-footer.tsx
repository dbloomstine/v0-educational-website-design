import Link from "next/link"
import { Logo } from "@/components/logo"
import { ExternalLink } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & About */}
          <div>
            <div className="mb-4">
              <Logo height={24} className="text-foreground" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Free guides, tools, and articles to help you learn fund operations.
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
                <Link href="/listen" className="text-muted-foreground hover:text-foreground transition-colors">
                  Listen (Audio)
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
                <a href="https://fundopshq-shop.myshopify.com/collections/all" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">
                  Shop
                  <ExternalLink className="h-3 w-3" />
                </a>
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
          <div className="lg:pt-8">
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
          <p className="flex items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">|</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </p>
          <p>
            Built by <a href="https://www.linkedin.com/in/danny-bloomstine/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary underline">Danny Bloomstine</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
