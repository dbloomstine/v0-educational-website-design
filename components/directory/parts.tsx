import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { type PersonCard } from '@/lib/directory/people'
import { DIRECTORY_ABOUT_PATH, practiceLabel } from '@/lib/directory/taxonomy'
import { pageHref, type Landing } from '@/lib/directory/landing'
import { dedupePeople } from '@/lib/directory/quality'
import { rowFirms, toRow } from '@/lib/directory/rows'
import { firmPath, type FirmSummary } from '@/lib/directory/firms'
import { logoFor, monogram } from '@/lib/directory/logos'
import type { Category } from '@/lib/directory/taxonomy'
import { FirmMark } from '@/components/directory/FirmMark'
import { PersonRow as BrowserRow } from '@/components/directory/DirectoryBrowser'

/**
 * The directory's building blocks, in the house style: names set like
 * headlines (Newsreader, bold), the facts under them in Franklin, practice
 * areas as quiet tags. No photos in a list, no adjectives, no ranks: a list is
 * in surname order and says so.
 */

export function PracticeTags({ areas, className = '' }: { areas: string[]; className?: string }) {
  const shown = areas.filter((a) => a !== 'other')
  if (!shown.length) return null
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`} aria-label="Practice areas">
      {shown.map((a) => (
        <li key={a} className="rounded-sm border border-foreground/15 bg-foreground/[0.035] px-1.5 py-[1px] font-ui text-[11.5px] leading-[1.5] text-foreground/75">
          {practiceLabel(a)}
        </li>
      ))}
    </ul>
  )
}

export function ClaimedMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-[#1d6b43] ${className}`}>
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Claimed
    </span>
  )
}

/** A server-rendered list (landing pages, firm pages): the same rows as the hub's browser, logos and all. */
export function PersonList({ people, label, firms, path, hideFirm = false }: { people: PersonCard[]; label: string; firms: FirmSummary[]; path: string; hideFirm?: boolean }) {
  const marks = rowFirms(people, firms)
  return (
    <ul aria-label={label} className="divide-y divide-border/80">
      {dedupePeople(people).map((p, i) => (
        <BrowserRow key={p.id} r={toRow(p)} firm={marks[p.firm_domain.toLowerCase()]} path={path} eager={i < 8} hideFirm={hideFirm} />
      ))}
    </ul>
  )
}

/** Previous / page n of m / next. Plain links, so every page is a real address a crawler can follow. */
export function Pager({ path, page, pages, query = '' }: { path: string; page: number; pages: number; query?: string }) {
  if (pages <= 1) return null
  const href = (n: number) => (query ? `${path}?${query}${n > 1 ? `&page=${n}` : ''}` : pageHref(path, n))
  const linkClass = 'inline-flex h-9 items-center rounded-sm border border-foreground/25 px-3 font-ui text-[13px] font-semibold text-foreground hover:border-foreground'
  return (
    <nav aria-label="Pages" className="mt-5 flex flex-wrap items-center gap-3">
      {page > 1 ? (
        <Link prefetch={false} rel="prev" href={href(page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : null}
      <span className="font-ui text-[13px] text-muted-foreground">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link prefetch={false} rel="next" href={href(page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : null}
    </nav>
  )
}

/** A short list of other directory pages, with how many people each holds. */
export function LandingLinks({ title, items }: { title: string; items: Landing[] }) {
  // Never a section of one: a list of one link is not a list (2026-10-24 night).
  if (items.length < 2) return null
  return (
    <section aria-label={title}>
      <h2 className="mb-1.5 border-t-2 border-foreground pt-1.5 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">{title}</h2>
      <ul>
        {items.map((l) => (
          <li key={l.path} className="border-b border-border/60 last:border-0">
            <Link prefetch={false} href={l.path} className="flex items-baseline justify-between gap-3 py-[6px] font-news text-[15.5px] leading-snug text-foreground hover:underline">
              <span>{l.title}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{l.count.toLocaleString('en-US')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The visible breadcrumb; the JSON-LD one is built from the same list. */
export function Crumbs({ crumbs }: { crumbs: { name: string; path?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-ui text-[12px] text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        <li>
          <Link href="/" className="hover:text-foreground hover:underline">
            FundOpsHQ
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={i} className="flex items-center gap-x-1.5">
            <span aria-hidden="true">›</span>
            {c.path ? (
              <Link href={c.path} className="hover:text-foreground hover:underline">
                {c.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground/80">
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Before any profile is published: say what is coming, plainly. */
export function EmptyDirectory({ noun }: { noun: string }) {
  return (
    <div className="panel panel-lead">
      <p className="font-news text-[17px] leading-snug text-foreground">The {noun} directory is being put together.</p>
      <p className="mt-2 font-ui text-[13.5px] leading-relaxed text-foreground/70">
        Each profile is drawn from the firm&rsquo;s own public bio page and checked before it appears. Check back soon, or{' '}
        <Link href="/join" className="font-semibold text-foreground underline underline-offset-2">
          get FundOps Daily
        </Link>{' '}
        and we will say when it opens.
      </p>
    </div>
  )
}

/**
 * The firms on a list, each with its mark and how many people it has here, linking to its page in the directory.
 * Sales Navigator's account list, set as a newspaper's index. Never a section of one.
 */
export function FirmsRail({ category, firms, title = 'Firms', max = 12, allHref }: { category: Category; firms: FirmSummary[]; title?: string; max?: number; allHref?: string }) {
  // The caller passes only firms with a page of their own (lib/directory/firms.ts firmsWithPages).
  const withPages = firms
  if (withPages.length < 2) return null
  return (
    <section aria-label={title}>
      <h2 className="mb-1 border-t-2 border-foreground pt-1.5 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">{title}</h2>
      <ul>
        {withPages.slice(0, max).map((f) => (
          <li key={f.domain} className="border-b border-border/60 last:border-0">
            <Link prefetch={false} href={firmPath(category, f.slug)} className="group flex items-center gap-3 py-[7px]">
              <FirmMark name={f.name} logo={logoFor(f.domain)} mono={monogram(f.name)} size="sm" decorative />
              <span className="min-w-0 flex-1 font-news text-[15.5px] leading-snug text-foreground group-hover:underline">{f.name}</span>
              <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-foreground/65">{f.count.toLocaleString('en-US')}</span>
            </Link>
          </li>
        ))}
      </ul>
      {allHref && withPages.length > max && (
        <Link prefetch={false} href={allHref} className="mt-1.5 inline-block font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
          All {withPages.length} firms
        </Link>
      )}
    </section>
  )
}

/** "Last verified Oct 21–24, 2026 against the firms' own sites": when this list's facts were last read. */
export function Verified({ span, against = 'the firms’ own sites', className = '' }: { span: string | null; against?: string; className?: string }) {
  if (!span) return null
  return (
    <p className={`font-ui text-[12.5px] text-foreground/70 ${className}`}>
      Last verified {span} against {against}.{' '}
      <Link href={DIRECTORY_ABOUT_PATH} className="underline underline-offset-2 hover:text-foreground">
        How we check
      </Link>
    </p>
  )
}

/** The link to the methodology page, for the foot of every directory page. */
export function AboutLine() {
  return (
    <Link href={DIRECTORY_ABOUT_PATH} className="font-semibold text-foreground/85 underline underline-offset-2 hover:text-foreground">
      How the directory works
    </Link>
  )
}
