import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { officeLabel } from '@/lib/directory/places'
import { practiceAreas, primaryOffice, profilePath, type PersonCard } from '@/lib/directory/people'
import { practiceLabel } from '@/lib/directory/taxonomy'
import { pageHref, type Landing } from '@/lib/directory/landing'

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

export function PersonRow({ p }: { p: PersonCard }) {
  const office = primaryOffice(p)
  const facts = [p.title, p.firm_name, office ? officeLabel(office) : null].filter(Boolean)
  return (
    <li className="border-b border-border/70 py-[9px] last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Link prefetch={false} href={profilePath(p)} className="hl font-news text-[17.5px] font-bold leading-snug text-foreground">
          {p.full_name}
        </Link>
        {p.claimed_at && <ClaimedMark />}
      </div>
      <p className="mt-0.5 font-ui text-[13px] leading-snug text-foreground/70">{facts.join(' · ')}</p>
      <PracticeTags areas={practiceAreas(p)} className="mt-1.5" />
    </li>
  )
}

export function PersonList({ people, label }: { people: PersonCard[]; label: string }) {
  return (
    <ul aria-label={label} className="river">
      {people.map((p) => (
        <PersonRow key={p.id} p={p} />
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
  if (!items.length) return null
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
