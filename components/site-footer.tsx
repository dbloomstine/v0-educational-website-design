import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-16">
        {/* CTA Section */}
        <div className="mb-16 rounded-lg border border-border bg-accent/30 p-8 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-balance">Looking for guidance? Let's talk</h2>
          <p className="mb-6 text-muted-foreground text-balance">
            Get tailored support for your fund operations challenges
          </p>
          <Button size="lg" asChild>
            <Link href="/contact">Schedule a Consultation</Link>
          </Button>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & About */}
          <div>
            <div className="mb-4 text-lg font-semibold">
              Fund<span className="text-muted-foreground">Ops</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A practical resource for fund operations professionals across all asset classes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tools
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Resources</h3>
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

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Newsletter</h3>
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
              Get weekly insights delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Your email" className="bg-background" />
              <Button size="sm">Subscribe</Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Powered by Beehiiv</p>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} FundOps. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
