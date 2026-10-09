"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SECTIONS, sectionHref } from "@/lib/news/sections"
import { openSignupCard } from "@/components/newsletter/SubscribePrompt"

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
]

/**
 * Events is pinned at the right end of the strip instead of living in the
 * scrolling list. On a laptop-width window the list is longer than the
 * window, and the last tab — Events, half of what the site is — was simply
 * out of sight (Danny, 2026-10-01: "it's hard to know that you can scroll
 * right and left… to see the events on the far right").
 */
const EVENTS_TAB = { label: "Events", href: "/events", match: (p: string) => p.startsWith("/events") }

export function SiteHeader() {
  const pathname = usePathname() || "/"
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Which way the strip can still scroll — drives the arrow buttons.
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  // Keep the active tab in view on narrow screens, where the strip scrolls.
  useEffect(() => {
    const strip = stripRef.current
    const active = activeRef.current
    if (!strip || !active) return
    const left = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2
    strip.scrollTo({ left: Math.max(0, left) })
  }, [pathname])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth
      setCanScroll({ left: strip.scrollLeft > 4, right: strip.scrollLeft < max - 4 })
    }
    update()
    strip.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(strip)
    return () => {
      strip.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [pathname])

  const nudge = (dir: 1 | -1) => {
    const strip = stripRef.current
    if (!strip) return
    strip.scrollBy({ left: dir * Math.max(160, strip.clientWidth * 0.6), behavior: "smooth" })
  }

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // On the homepage the subscribe form is on the page: scroll to it and focus
  // the field rather than navigating to where we already are.
  // Anywhere else the signup card opens over the page the reader is on, with
  // the cursor in its field: they do not have to leave a story to subscribe.
  const handleSubscribeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (pathname !== "/") {
      openSignupCard()
      return
    }
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
    // The newsroom's day, not the server's: without this the masthead read
    // "Friday" from 8pm ET on Thursday, because the server keeps UTC.
    timeZone: "America/New_York",
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
        <div className="mx-auto flex max-w-[1320px] items-stretch">
          <div className="relative min-w-0 flex-1">
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

            {/* More sections lie off-screen: say so with a button, not just a fade. */}
            {canScroll.left && (
              <button
                type="button"
                onClick={() => nudge(-1)}
                aria-label="Earlier sections"
                className="absolute inset-y-0 left-0 flex w-9 items-center justify-start bg-gradient-to-r from-background from-55% to-transparent pl-1 text-foreground/80 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {canScroll.right && (
              <button
                type="button"
                onClick={() => nudge(1)}
                aria-label="More sections"
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-background from-55% to-transparent pr-1 text-foreground/80 hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Pinned: always visible, whatever the window width. */}
          <Link
            href={EVENTS_TAB.href}
            aria-current={EVENTS_TAB.match(pathname) ? "page" : undefined}
            className={cn(
              "relative flex h-10 shrink-0 items-center border-l border-foreground/15 px-3.5 font-ui text-[13px] transition-colors lg:mr-2",
              EVENTS_TAB.match(pathname) ? "font-bold text-foreground" : "font-semibold text-foreground/80 hover:text-foreground",
            )}
          >
            {EVENTS_TAB.label}
            {EVENTS_TAB.match(pathname) && <span aria-hidden="true" className="absolute inset-x-3.5 bottom-0 h-[3px] bg-[#E6B045]" />}
          </Link>
        </div>
      </nav>
    </>
  )
}
