"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CalendarDays, ChevronDown, ListOrdered, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { LEAGUE_MARKETS } from "@/lib/news/league-markets"
import { LEAGUE_ASSET_LABEL } from "@/lib/news/league"
import { CITY_SHORTCUTS, TOPIC_SHORTCUTS } from "@/lib/events/collections"
import { CATEGORIES, directoryEnabled } from "@/lib/directory/taxonomy"

/**
 * The site's two other products, pinned at the right end of the section strip (2026-10-22). Danny: "the league
 * tables are hard to find… and the events should be treated as a first citizen… a more prioritized tab in the
 * top ribbon." The news sections scroll; these two never do, so neither can be pushed out of sight, and they sit
 * on their own tinted ground behind a rule, each with an icon, so they read as destinations rather than sections.
 *
 * On a laptop or wider each has a small menu of its own pages. The tab itself stays a plain link; the menu opens
 * on hover (a mouse) or from the chevron beside it (keyboard, touch): a disclosure, not an ARIA menu, so Tab and
 * the screen reader treat its entries as the links they are. Esc closes it and hands focus back to the chevron.
 * Phones get no menus here: the strip is too narrow and the phone menu (site-menu.tsx) lists both first.
 */

interface MenuGroup {
  heading?: string
  links: { label: string; href: string }[]
}

export interface Product {
  key: string
  label: string
  /** Phones: fewer letters, so the scrolling sections keep room. Must be a part of `label` (WCAG 2.5.3). */
  short?: string
  href: string
  icon: LucideIcon
  match: (path: string) => boolean
  menu: MenuGroup[]
  /** Lay the headed groups side by side. */
  wide?: boolean
}

export const PRODUCTS: Product[] = [
  {
    key: "league",
    label: "League tables",
    short: "League",
    href: "/league-tables",
    icon: ListOrdered,
    // A firm's page is the league table's own drill-down: the tab stays lit there.
    match: (p) => p.startsWith("/league-tables") || p.startsWith("/firm/") || p === "/firms",
    menu: [
      {
        heading: "Largest fund closes",
        links: [
          { label: "All markets", href: "/league-tables" },
          ...LEAGUE_MARKETS.map((m) => ({ label: m.asset === "credit" ? "Private credit" : (LEAGUE_ASSET_LABEL[m.asset] ?? m.name), href: `/league-tables/${m.slug}` })),
        ],
      },
      { links: [{ label: "Firms A–Z", href: "/firms" }] },
      // The directory (2026-10-24) sits here rather than as a third pinned tab: the strip stays as Danny set it.
      ...(directoryEnabled() ? [{ heading: "Directory", links: [{ label: CATEGORIES.fund_lawyer.plural, href: `/${CATEGORIES.fund_lawyer.slug}` }] }] : []),
    ],
  },
  {
    key: "events",
    label: "Events",
    href: "/events",
    icon: CalendarDays,
    match: (p) => p.startsWith("/events"),
    wide: true,
    menu: [
      {
        heading: "Calendar",
        links: [
          { label: "This week and next", href: "/events" },
          { label: "Webinars", href: "/events/webinars" },
          ...TOPIC_SHORTCUTS.map((t) => ({ label: t.label, href: `/events/${t.slug}` })),
        ],
      },
      { heading: "By city", links: CITY_SHORTCUTS.map((c) => ({ label: c.label, href: `/events/${c.slug}` })) },
      { links: [{ label: "Submit an event", href: "/events/submit" }] },
    ],
  },
]

const CLOSE_DELAY = 160

export function SiteProducts({ pathname }: { pathname: string }) {
  // Which menu is open, remembered with the page it was opened on: following one of its links shuts it.
  const [open, setOpen] = useState<{ key: string; at: string } | null>(null)
  const openKey = open?.at === pathname ? open.key : null
  const closeTimer = useRef<number | null>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const show = (key: string) => {
    cancelClose()
    setOpen({ key, at: pathname })
  }
  const hide = (delay = 0) => {
    cancelClose()
    if (delay === 0) return setOpen(null)
    closeTimer.current = window.setTimeout(() => setOpen(null), delay)
  }

  useEffect(() => cancelClose, [])

  // Esc, or a click anywhere else, shuts an open menu.
  useEffect(() => {
    if (!openKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      const button = groupRef.current?.querySelector<HTMLButtonElement>(`[data-menu-button="${openKey}"]`)
      setOpen(null)
      button?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (!groupRef.current?.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onDown)
    }
  }, [openKey])

  // Hover opens a menu only where there is a mouse to hover with; a tap goes straight to the link.
  const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches

  return (
    <div ref={groupRef} className="flex shrink-0 items-stretch border-l border-foreground/20 bg-foreground/[0.045] lg:mr-2">
      {PRODUCTS.map((p, i) => {
        const active = p.match(pathname)
        const expanded = openKey === p.key
        const Icon = p.icon
        const panelId = `nav-menu-${p.key}`
        return (
          <div
            key={p.key}
            className={cn("relative flex items-stretch", i > 0 && "border-l border-foreground/10")}
            onMouseEnter={() => canHover() && show(p.key)}
            onMouseLeave={() => canHover() && hide(CLOSE_DELAY)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null) && expanded) hide()
            }}
          >
            <Link
              href={p.href}
              aria-current={active ? "page" : undefined}
              aria-label={p.short ? p.label : undefined}
              className={cn(
                "relative flex h-10 items-center gap-1.5 whitespace-nowrap px-2 sm:px-2.5 font-ui text-[13px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground sm:pl-3 md:pr-1",
                active ? "font-bold text-foreground" : "font-semibold text-foreground/85 hover:text-foreground",
              )}
            >
              <Icon className={cn("hidden h-3.5 w-3.5 shrink-0 sm:block", active ? "text-foreground" : "text-foreground/60")} aria-hidden="true" />
              {p.short ? (
                <>
                  <span className="sm:hidden">{p.short}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </>
              ) : (
                p.label
              )}
              {active && <span aria-hidden="true" className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#E6B045] sm:left-3 sm:right-2.5 md:right-1" />}
            </Link>
            <button
              type="button"
              data-menu-button={p.key}
              onClick={() => (expanded ? hide() : show(p.key))}
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={`${p.label} pages`}
              className="hidden h-10 w-6 items-center justify-center text-foreground/55 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground md:flex"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
            </button>

            <div
              id={panelId}
              hidden={!expanded}
              className={cn(
                "absolute right-0 top-full z-[60] mt-px min-w-[220px] border border-foreground/20 bg-background py-2 text-foreground shadow-[0_6px_18px_rgba(19,35,58,0.14)]",
                p.wide && "w-max grid-cols-2 [&:not([hidden])]:grid",
              )}
            >
              {p.menu.map((g, gi) => (
                <div
                  key={gi}
                  className={cn(
                    p.wide
                      ? g.heading
                        ? gi > 0 && "border-l border-foreground/10"
                        : "col-span-2 mt-1.5 border-t border-foreground/10 pt-1.5"
                      : gi > 0 && "mt-1.5 border-t border-foreground/10 pt-1.5",
                  )}
                >
                  {g.heading && (
                    <p className="px-4 pb-1 pt-1 font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-foreground/60">{g.heading}</p>
                  )}
                  <ul>
                    {g.links.map((l) => {
                      const here = l.href === pathname
                      return (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            aria-current={here ? "page" : undefined}
                            className={cn(
                              "flex min-h-8 items-center whitespace-nowrap px-4 font-ui text-[13.5px] text-foreground/85 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground",
                              here && "font-bold text-foreground",
                            )}
                          >
                            {here && <span aria-hidden="true" className="-ml-2 mr-[5px] h-3.5 w-[3px] shrink-0 bg-[#E6B045]" />}
                            {l.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
