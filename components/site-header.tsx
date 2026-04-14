"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { Menu, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "News", href: "/#news", match: ["/"] },
  { label: "Show", href: "/#show", match: [] },
  { label: "About", href: "/about", match: ["/about"] },
] as const

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname() || "/"

  const isActive = (matches: readonly string[]) =>
    matches.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)))

  // Clicking Subscribe in the header scrolls to the hero signup card AND
  // focuses the email input (otherwise a repeat click from /#subscribe is a
  // no-op and users think the button is broken). On non-home pages we let
  // the Link navigate normally — hero-subscribe.tsx's mount effect picks up
  // the #subscribe hash and focuses the input on landing.
  const handleSubscribeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return
    e.preventDefault()
    setMobileMenuOpen(false)
    document.getElementById("subscribe")?.scrollIntoView({ behavior: "smooth", block: "start" })
    // Delay slightly so smooth-scroll doesn't yank focus mid-animation.
    window.setTimeout(() => {
      document.getElementById("newsletter-email")?.focus({ preventScroll: true })
    }, 450)
    if (window.location.hash !== "#subscribe") {
      window.history.pushState(null, "", "/#subscribe")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-foreground/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Brand mark */}
        <Link href="/" className="flex items-center" aria-label="FundOpsHQ — Home">
          <Logo height={26} className="text-foreground" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative inline-flex h-9 items-center justify-center px-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-colors",
                isActive(item.match)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
              {isActive(item.match) && (
                <span className="absolute -bottom-[1px] left-3 right-3 h-px bg-amber-400/80" aria-hidden="true" />
              )}
            </Link>
          ))}

          {/* Live show indicator link */}
          <a
            href="https://www.youtube.com/@dbloomstine/streams"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex h-9 items-center gap-2 rounded-sm border border-red-700/50 bg-red-950/30 px-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-red-300 transition-colors hover:border-red-500/70 hover:bg-red-950/60 hover:text-red-200"
            aria-label="Watch FundOpsHQ Live on YouTube"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Live
          </a>
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
          {/* Primary subscribe CTA */}
          <Link
            href="/#subscribe"
            onClick={handleSubscribeClick}
            className="group hidden sm:inline-flex h-9 items-center gap-2 rounded-sm bg-foreground px-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-all hover:bg-amber-400 hover:text-background"
          >
            Subscribe
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-sm border border-foreground/20 text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-foreground/10 bg-background"
        >
          <div className="container mx-auto px-4 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-sm px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground hover:bg-accent/60"
              >
                {item.label}
              </Link>
            ))}

            <a
              href="https://www.youtube.com/@dbloomstine/streams"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-sm border border-red-700/50 bg-red-950/30 px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-red-300"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              Watch Live on YouTube
            </a>

            <Link
              href="/#subscribe"
              onClick={handleSubscribeClick}
              className="mt-3 flex items-center justify-center gap-2 rounded-sm bg-foreground px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background"
            >
              Subscribe to FundOps Daily
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
