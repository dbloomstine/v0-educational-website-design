import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"
import { SECTIONS, sectionHref } from "@/lib/news/sections"

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Submit an event", href: "/events/submit" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]

const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"

const linkClass = "font-ui text-[13px] text-foreground/70 transition-colors hover:text-foreground"
const headClass = "mb-3 font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/45"

export function SiteFooter() {
  const typeSections = SECTIONS.filter((s) => s.group === "type")
  const assetSections = SECTIONS.filter((s) => s.group === "asset")

  return (
    <footer className="border-t-4 border-[#E6B045] bg-background text-foreground">
      <div className="mx-auto max-w-[1320px] px-4 py-10 lg:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Nameplate + newsletter */}
          <div className="max-w-sm">
            <Link href="/" aria-label="FundOpsHQ — Home" className="inline-block">
              <Logo height={24} className="text-foreground" />
            </Link>
            <p className="mt-3 font-news text-[15px] leading-snug text-foreground/75">
              Fund closes, launches, deals and moves across private markets — reported by 200+ sources, read in one
              place. Edited by Danny Bloomstine.
            </p>
            <Link
              href="/#subscribe"
              className="group mt-4 inline-flex h-9 items-center gap-2 rounded-sm bg-[#E6B045] px-4 font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-[#13233A] transition-colors hover:bg-white"
            >
              Get FundOps Daily
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <nav aria-label="News by story">
            <p className={headClass}>News</p>
            <ul className="space-y-1.5">
              <li><Link href="/" className={linkClass}>Top stories</Link></li>
              <li><Link href="/news" className={linkClass}>Latest</Link></li>
              {typeSections.map((s) => (
                <li key={s.slug}><Link href={sectionHref(s.slug)} className={linkClass}>{s.title}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="News by asset class">
            <p className={headClass}>Asset classes</p>
            <ul className="space-y-1.5">
              {assetSections.map((s) => (
                <li key={s.slug}><Link href={sectionHref(s.slug)} className={linkClass}>{s.title}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="FundOpsHQ">
            <p className={headClass}>FundOpsHQ</p>
            <ul className="space-y-1.5">
              <li><Link href="/events" className={linkClass}>Events calendar</Link></li>
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-foreground/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/50">
            © {new Date().getFullYear()} FundOpsHQ · Headlines link to their original publishers
          </p>
          <a
            href="https://www.linkedin.com/in/danny-bloomstine/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60 transition-colors hover:text-foreground"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={LINKEDIN_PATH} />
            </svg>
            Danny Bloomstine
          </a>
        </div>
      </div>
    </footer>
  )
}
