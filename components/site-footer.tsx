import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"
import { CHROME_EXTENSION_URL } from "@/lib/chrome-extension"

type NavLink = { label: string; href: string; external: boolean }

const NAV_LINKS: NavLink[] = [
  { label: "News", href: "/#news", external: false },
  { label: "About", href: "/about", external: false },
  { label: "Privacy", href: "/privacy", external: false },
  { label: "Terms", href: "/terms", external: false },
  { label: "Chrome extension", href: CHROME_EXTENSION_URL, external: true },
]

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/danny-bloomstine/",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-foreground/15 bg-background">
      <div className="container mx-auto max-w-[1400px] px-4 py-14">
        {/* Editorial section masthead */}
        <div className="mb-10 flex items-center justify-between gap-3 border-b border-foreground/10 pb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
          <span className="flex items-center gap-3">
            <span className="text-foreground/80">Colophon</span>
            <span aria-hidden="true" className="text-foreground/20">·</span>
            <span>FundOpsHQ</span>
          </span>
          <span className="hidden sm:inline">Est. 2025 · New York</span>
        </div>

        {/* Top row: brand mark + subscribe CTA */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-lg">
            <Link href="/" aria-label="FundOpsHQ — Home" className="inline-block">
              <Logo height={28} className="text-foreground" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Real-time fund news and the FundOps Daily morning newsletter.
              Written and edited by Danny Bloomstine.
            </p>
          </div>

          <Link
            href="/#subscribe"
            className="group inline-flex h-11 items-center gap-2 self-start rounded-sm bg-foreground px-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-all hover:bg-amber-400 md:self-auto"
          >
            Subscribe to FundOps Daily
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-foreground/10" />

        {/* Bottom row: nav + socials */}
        <div className="flex flex-col-reverse gap-8 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {NAV_LINKS.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-foreground/15 bg-background text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Copyright bar */}
        <div className="mt-10 flex flex-col gap-2 border-t border-foreground/10 pt-6 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} FundOpsHQ — All rights reserved</p>
          <p>
            Built by{" "}
            <a
              href="https://www.linkedin.com/in/danny-bloomstine/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-amber-400"
            >
              Danny Bloomstine
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
