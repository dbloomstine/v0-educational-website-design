"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { ArrowRight, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SECTIONS, sectionHref } from "@/lib/news/sections"

/**
 * Masthead + section tabs (2026-10 redesign).
 *
 * Two parts with two jobs. The masthead says where you are — the name, the
 * date, the way to subscribe — and scrolls away. The tab strip is how you
 * move, so it stays pinned: every section is one click from anywhere on the
 * site, the way a newspaper's section front is one page-turn from any other.
 */

interface Tab {
  label: string
  href: string
  /** Path prefixes that light this tab. */
  match: (path: string) => boolean
  /** Thin divider before this tab: the strip has three groups. */
  gap?: boolean
}

const TABS: Tab[] = [
  { label: "Top", href: "/", match: (p) => p === "/" },
  { label: "Latest", href: "/news", match: (p) => p === "/news" },
  ...SECTIONS.map((s, i) => ({
    label: s.label,
    href: sectionHref(s.slug),
    match: (p: string) => p === sectionHref(s.slug),
    gap: i === 0 || s.slug === "private-equity" || s.slug === "lps",
  })),
  { label: "Events", href: "/events", match: (p) => p.startsWith("/events"), gap: true },
]

export function SiteHeader() {
  const pathname = usePathname() || "/"
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Keep the active tab in view on narrow screens, where the strip scrolls.
  useEffect(() => {
    const strip = stripRef.current
    const active = activeRef.current
    if (!strip || !active) return
    const left = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2
    strip.scrollTo({ left: Math.max(0, left) })
  }, [pathname])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // On the homepage the subscribe form is on the page: scroll to it and focus
  // the field rather than navigating to where we already are.
  const handleSubscribeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return
    e.preventDefault()
    document.getElementById("subscribe")?.scrollIntoView({ behavior: "smooth", block: "center" })
    window.setTimeout(() => {
      document.getElementById("newsletter-email")?.focus({ preventScroll: true })
    }, 450)
    if (window.location.hash !== "#subscribe") {
      window.history.pushState(null, "", "/#subscribe")
    }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <>
      <header className="w-full bg-background text-foreground">
        <div className="mx-auto grid h-[58px] max-w-[1320px] grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_auto_1fr] lg:px-6">
          {/* Dateline */}
          <div className="hidden min-w-0 md:block">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/55" suppressHydrationWarning>
              {today}
            </p>
            <p className="font-ui text-[11px] text-foreground/45">News for GPs, LPs and fund service providers</p>
          </div>

          {/* Nameplate */}
          <Link href="/" className="flex items-center md:justify-self-center" aria-label="FundOpsHQ — Home">
            <Logo height={25} className="text-foreground" />
          </Link>

          {/* Search + subscribe */}
          <div className="flex items-center justify-end gap-2">
            {searchOpen ? (
              <form action="/news" method="get" className="flex items-center gap-1" role="search">
                <input
                  ref={searchRef}
                  type="search"
                  name="q"
                  placeholder="Search fund news"
                  aria-label="Search fund news"
                  className="h-8 w-40 rounded-sm border border-foreground/25 bg-foreground/5 px-2.5 font-ui text-[13px] text-foreground placeholder:text-foreground/40 focus:border-foreground/60 focus:outline-none sm:w-56"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="flex h-8 w-8 items-center justify-center text-foreground/60 hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search fund news"
                className="flex h-8 w-8 items-center justify-center rounded-sm text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <Link
              href="/#subscribe"
              onClick={handleSubscribeClick}
              className={cn(
                "group h-8 items-center gap-1.5 rounded-sm bg-[#E6B045] px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-[#13233A] transition-colors hover:bg-white",
                searchOpen ? "hidden sm:inline-flex" : "inline-flex",
              )}
            >
              Subscribe
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Section tabs — pinned */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-50 w-full border-y border-foreground/15 bg-background/97 text-foreground shadow-[0_1px_0_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-background/90"
      >
        <div className="relative mx-auto max-w-[1320px]">
          <div ref={stripRef} className="tab-scroll flex items-stretch overflow-x-auto px-2 lg:px-4">
            {TABS.map((tab) => {
              const active = tab.match(pathname)
              return (
                <span key={tab.href} className="flex shrink-0 items-stretch">
                  {tab.gap && <span aria-hidden="true" className="mx-1.5 my-2.5 w-px bg-foreground/15" />}
                  <Link
                    ref={active ? activeRef : undefined}
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center whitespace-nowrap px-2.5 font-ui text-[13px] transition-colors",
                      active ? "font-bold text-foreground" : "font-medium text-foreground/65 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    {active && <span aria-hidden="true" className="absolute inset-x-2.5 bottom-0 h-[3px] bg-[#E6B045]" />}
                  </Link>
                </span>
              )
            })}
          </div>
          {/* Edge fade: more tabs lie to the right on a narrow screen. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent xl:hidden" />
        </div>
      </nav>
    </>
  )
}
