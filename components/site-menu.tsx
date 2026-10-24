"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, ListOrdered, Search, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { SECTIONS, sectionHref } from "@/lib/news/sections"
import { DAILY_SOCIAL } from "@/lib/brand/social"
import { CATEGORIES, directoryEnabled } from "@/lib/directory/taxonomy"

/**
 * The phone's menu (2026-10-11). Danny: "the mobile responsive website...
 * should have like a menu burger icon... to navigate more easily on the
 * phone."
 *
 * On a phone the tab strip shows three or four sections at a time and the
 * rest of the site (league tables, firms, the archive, About) is only in the
 * footer, a long scroll away. This is everything on one screen, in two columns: search, the
 * way to subscribe, every section, every page. Opened by the button at the
 * left end of the pinned strip (components/site-header.tsx), so it is one tap
 * away however far down the page the reader is.
 *
 * A dialog: it takes the focus, keeps Tab inside itself, holds the page
 * still, and closes on the X, Esc, or any link.
 */

const linkClass =
  "flex min-h-11 items-center border-b border-foreground/10 py-1.5 font-ui text-[15px] font-medium leading-tight text-foreground/85 active:text-foreground"
const headClass = "mb-1 mt-6 font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/45"

/**
 * The site's two other products, first after the subscribe button (2026-10-22, Danny: league tables "hard to
 * find", events "a first citizen"). The same two the strip pins on a wider screen (site-products.tsx).
 */
const PRIMARY = [
  { label: "League tables", href: "/league-tables", note: "The year's largest fund closes, by market", icon: ListOrdered },
  { label: "Events", href: "/events", note: "Conferences and webinars, every date checked", icon: CalendarDays },
]

const MORE = [
  { label: "Firms", href: "/firms" },
  // The directory (2026-10-24), behind DIRECTORY_ENABLED until it launches.
  ...(directoryEnabled() ? [{ label: "Directory", href: `/${CATEGORIES.fund_lawyer.slug}` }] : []),
  { label: "Archive", href: "/archive" },
  { label: "Glossary", href: "/glossary" },
  { label: "About", href: "/about" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Submit an event", href: "/events/submit" },
  { label: "Submit news", href: "/submit" },
]

interface Props {
  pathname: string
  onClose: () => void
  onSubscribe: () => void
}

export function SiteMenu({ pathname, onClose, onSubscribe }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = "hidden"
    closeRef.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose()
      if (e.key !== "Tab" || !boxRef.current) return
      const stops = [...boxRef.current.querySelectorAll<HTMLElement>("button, input, a[href]")]
      const first = stops[0]
      const last = stops[stops.length - 1]
      const at = document.activeElement
      if (e.shiftKey && at === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && at === last) {
        e.preventDefault()
        first.focus()
      }
    }
    // Turned on its side or dragged wide, the phone layout is gone and so is the button that opened this.
    const wide = window.matchMedia("(min-width: 768px)")
    const onWide = () => wide.matches && onClose()
    window.addEventListener("keydown", onKey)
    wide.addEventListener("change", onWide)
    return () => {
      window.removeEventListener("keydown", onKey)
      wide.removeEventListener("change", onWide)
      root.style.overflow = overflow
      before?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  // The one entry for the page the reader is on: its own address, or failing that the page it sits under
  // (an event's page under Events). The front page and Latest are never a parent: every section is under /news.
  const pages = [...PRIMARY, ...MORE].map((x) => x.href)
  const all = ["/", "/news", ...SECTIONS.map((x) => sectionHref(x.slug)), ...pages]
  const current =
    all.find((h) => h === pathname) ??
    pages
      .filter((h) => pathname.startsWith(`${h}/`))
      .sort((a, b) => b.length - a.length)[0]

  const item = (label: string, href: string, prefetch?: boolean) => {
    const here = href === current
    return (
      <li key={href}>
        <Link
          href={href}
          prefetch={prefetch}
          onClick={onClose}
          aria-current={here ? "page" : undefined}
          className={cn(linkClass, here && "font-bold text-foreground")}
        >
          {here && <span aria-hidden="true" className="mr-2 h-4 w-[3px] shrink-0 bg-[#E6B045]" />}
          {label}
        </Link>
      </li>
    )
  }

  return (
    <div
      ref={boxRef}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="site-menu fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-background text-foreground md:hidden"
    >
      <div className="sticky top-0 z-10 flex h-[58px] items-center justify-between border-b border-foreground/15 bg-background px-4">
        <Link href="/" onClick={onClose} aria-label="FundOpsHQ — Home" className="flex items-center">
          <Logo height={25} className="text-foreground" />
        </Link>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-sm text-foreground/75 active:text-foreground"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="px-4 pb-10 pt-4">
        <form action="/news" method="get" role="search" className="flex items-stretch gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" aria-hidden="true" />
            {/* 16px: anything smaller and an iPhone zooms the page when the field is tapped. */}
            <input
              type="search"
              name="q"
              placeholder="Search fund news"
              aria-label="Search fund news"
              className="h-11 w-full rounded-sm border border-foreground/25 bg-foreground/5 pl-9 pr-3 font-ui text-[16px] text-foreground placeholder:text-foreground/40 focus:border-foreground/60 focus:outline-none"
            />
          </div>
          <button type="submit" className="h-11 shrink-0 rounded-sm border border-foreground/30 px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-foreground/85">
            Search
          </button>
        </form>

        <button
          type="button"
          onClick={onSubscribe}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#E6B045] font-ui text-[13px] font-bold uppercase tracking-[0.08em] text-[#13233A]"
        >
          Get FundOps Daily, free
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <nav aria-label="League tables and events" className="mt-4">
          <ul className="grid grid-cols-2 gap-2">
            {PRIMARY.map((x) => {
              const here = x.href === current
              const Icon = x.icon
              return (
                <li key={x.href}>
                  <Link
                    href={x.href}
                    onClick={onClose}
                    aria-current={here ? "page" : undefined}
                    className={cn(
                      "flex h-full min-h-[76px] flex-col rounded-sm border border-foreground/20 bg-foreground/[0.045] px-3 py-2.5 active:bg-foreground/10",
                      here && "border-foreground/50",
                    )}
                  >
                    <span className="flex items-center gap-1.5 font-ui text-[15px] font-bold leading-tight text-foreground">
                      <Icon className="h-4 w-4 shrink-0 text-foreground/65" aria-hidden="true" />
                      {x.label}
                    </span>
                    <span className="mt-1 font-ui text-[12.5px] leading-snug text-foreground/70">{x.note}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Two columns, so the whole site fits a phone's screen without a scroll. */}
        <div className="grid grid-cols-2 gap-x-5">
          <nav aria-label="News">
            <p className={headClass}>News</p>
            <ul>
              {item("Top stories", "/")}
              {item("Latest", "/news")}
              {SECTIONS.filter((s) => s.group === "type").map((s) => item(s.title, sectionHref(s.slug)))}
            </ul>
          </nav>

          <nav aria-label="Asset classes">
            <p className={headClass}>Asset classes</p>
            <ul>{SECTIONS.filter((s) => s.group === "asset").map((s) => item(s.title, sectionHref(s.slug)))}</ul>
          </nav>
        </div>

        <nav aria-label="FundOpsHQ">
          <p className={headClass}>FundOpsHQ</p>
          {/* The archive is not prefetched: it is built on request. */}
          <ul className="grid grid-cols-2 gap-x-5">{MORE.map((l) => item(l.label, l.href, l.href === "/archive" ? false : undefined))}</ul>
        </nav>

        <p className="mt-6 font-ui text-[13px] text-foreground/70">
          Also daily on{" "}
          {DAILY_SOCIAL.map((x, i, all) => (
            <span key={x.href}>
              {i === 0 ? "" : i === all.length - 1 ? " and " : ", "}
              <a href={x.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground/85 underline decoration-foreground/30 underline-offset-2">
                {x.name}
              </a>
            </span>
          ))}
          .
        </p>
      </div>
    </div>
  )
}
