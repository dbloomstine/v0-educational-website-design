import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"
import { SECTIONS, sectionHref } from "@/lib/news/sections"
import { SubscribeLink } from "@/components/newsletter/SubscribeLink"
import { DAILY_SOCIAL } from "@/lib/brand/social"
import { GotNews } from "@/components/news/GotNews"
import { DIRECTORY_ABOUT_PATH, DIRECTORY_PATH, directoryEnabled } from "@/lib/directory/taxonomy"

const COMPANY_LINKS = [
  { label: "Get FundOps Daily", href: "/join" },
  { label: "About", href: "/about" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Submit an event", href: "/events/submit" },
  { label: "RSS feed", href: "/feed.xml" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]


const linkClass = "inline-block py-1 font-ui text-[13px] text-foreground/70 transition-colors hover:text-foreground"
const headClass = "mb-3 font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground"

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
              place.
            </p>
            <SubscribeLink className="group mt-4 inline-flex h-9 items-center gap-2 rounded-sm bg-[#E6B045] px-4 font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-[#13233A] transition-colors hover:bg-white">
              Get FundOps Daily
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </SubscribeLink>
            {/* The same stories go out each day as posts: a quiet line, for the reader who would rather follow there. */}
            <p className="mt-4 font-ui text-[12px] text-foreground/70">
              Also daily on{" "}
              {DAILY_SOCIAL.map((x, i, all) => (
                <span key={x.href}>
                  {i === 0 ? "" : i === all.length - 1 ? " and " : ", "}
                  <a href={x.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground/80 underline decoration-foreground/25 underline-offset-2 transition-colors hover:text-foreground">
                    {x.name}
                  </a>
                </span>
              ))}
              .
            </p>
            {/* News sent in by firms (/submit, 2026-10-22): leads for the desk, checked before anything runs. */}
            <GotNews className="mt-2 text-[12px] text-foreground/70" />
          </div>

          <nav aria-label="News by story">
            <p className={headClass}>News</p>
            <ul className="space-y-0.5">
              <li><Link href="/" className={linkClass}>Top stories</Link></li>
              <li><Link href="/news" className={linkClass}>Latest</Link></li>
              {typeSections.map((s) => (
                <li key={s.slug}><Link href={sectionHref(s.slug)} className={linkClass}>{s.title}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="News by asset class">
            <p className={headClass}>Asset classes</p>
            <ul className="space-y-0.5">
              {assetSections.map((s) => (
                <li key={s.slug}><Link href={sectionHref(s.slug)} className={linkClass}>{s.title}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="FundOpsHQ">
            <p className={headClass}>FundOpsHQ</p>
            <ul className="space-y-0.5">
              <li><Link href="/league-tables" className={linkClass}>League tables</Link></li>
              <li><Link href="/firms" className={linkClass}>Firms</Link></li>
              {directoryEnabled() && (
                <>
                  <li><Link href={DIRECTORY_PATH} className={linkClass}>Directory</Link></li>
                  <li><Link href={DIRECTORY_ABOUT_PATH} prefetch={false} className={linkClass}>How the directory works</Link></li>
                </>
              )}
              {/* Not prefetched: the archive is built on request, and this link is on every page. */}
              <li><Link href="/archive" prefetch={false} className={linkClass}>Archive</Link></li>
              <li><Link href="/events" className={linkClass}>Events calendar</Link></li>
              <li><Link href="/glossary" className={linkClass}>Glossary</Link></li>
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-foreground/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/70">
            © {new Date().getFullYear()} FundOpsHQ · Headlines link to their original publishers
          </p>
          {/* Danny, 2026-10-24: his name pulled back from every page; the About page still says who runs it. */}
          <Link
            href="/about"
            className="inline-flex items-center gap-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/70 transition-colors hover:text-foreground"
          >
            About FundOpsHQ
          </Link>
        </div>
      </div>
    </footer>
  )
}
