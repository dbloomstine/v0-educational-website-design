import Link from 'next/link'
import { FirmMark } from '@/components/directory/FirmMark'
import { firmPath } from '@/lib/directory/firms'
import type { RankedFirm } from '@/lib/directory/firm-lists'
import type { Faq } from '@/lib/directory/faq'
import { logoFor, monogram } from '@/lib/directory/logos'
import { DIRECTORY_ABOUT_PATH, type Category } from '@/lib/directory/taxonomy'

/**
 * The search-intent pages' building blocks (2026-10-24): a landing page (/fund-lawyers/hedge-funds) and a firm list
 * (/fund-lawyers/hedge-funds/firms) are made of these.
 *
 * Real pages they learn from, each for one thing:
 *   - Zocdoc's search results: the answer and the search box above the fold, the list straight under them;
 *   - Chambers and Partners' practice-area tables: firms in rank order, the rank in a narrow column, one line each,
 *     the basis of the ranking said in plain words over the table (ours is a count, theirs is judgment);
 *   - Zillow's agent finder: a small row of numbers about the place before the people ("quick facts");
 *   - Super Lawyers' practice/city pages: related practices and nearby cities as plain links at the end.
 * House style on top: cream paper, Newsreader heads, Franklin facts, the section rule (a 2px ink line with a small
 * capitals label), no cards with shadows, no gradients, no icons for decoration.
 */

const n = (x: number) => x.toLocaleString('en-US')

/** The rule-and-label head every section on these pages shares (the hub's and the profile's too). */
export function SectionHead({ id, title, aside }: { id?: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-1.5">
      <h2 id={id} className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
        {title}
      </h2>
      {aside ? <div className="font-ui text-[12.5px] text-foreground/70">{aside}</div> : null}
    </div>
  )
}

export interface Fact {
  label: string
  value: string
  /** A line under the value: "24 partners". */
  note?: string
  href?: string
}

/** Four numbers about the list, computed from it: partners, firms, the biggest firm, the biggest city. */
export function QuickFacts({ facts }: { facts: Fact[] }) {
  if (facts.length < 2) return null
  return (
    <dl className="mt-4 grid grid-cols-2 border-y border-foreground/20 sm:grid-cols-4">
      {facts.map((f, i) => (
        <div key={f.label} className={`min-w-0 px-0 py-2.5 sm:px-4 ${i % 2 === 1 ? 'pl-4 max-sm:border-l max-sm:border-foreground/15' : ''} ${i >= 2 ? 'max-sm:border-t max-sm:border-foreground/15' : ''} ${i > 0 ? 'sm:border-l sm:border-foreground/15' : 'sm:pl-0'}`}>
          <dt className="font-ui text-[11.5px] font-semibold text-foreground/60">{f.label}</dt>
          <dd className="mt-0.5 truncate font-news text-[22px] font-medium leading-tight tabular-nums text-foreground">
            {f.href ? (
              <Link prefetch={false} href={f.href} className="hover:underline">
                {f.value}
              </Link>
            ) : (
              f.value
            )}
          </dd>
          {f.note ? <dd className="font-ui text-[12px] leading-snug text-foreground/65">{f.note}</dd> : null}
        </div>
      ))}
    </dl>
  )
}

/**
 * Firms in rank order: rank, mark, name (to its directory page), where these partners sit, and the count (to the
 * filtered list of them). An ordered list, not a table: it reads on a phone without sideways scrolling.
 */
export function FirmRanking({
  category,
  firms,
  peopleHref,
  max,
  compact = false,
  label,
}: {
  category: Category
  firms: RankedFirm[]
  /** Where a firm's count goes: the hub, filtered to the firm (and the page's practice and city). */
  peopleHref: (f: RankedFirm) => string
  max?: number
  compact?: boolean
  label: string
}) {
  const shown = max ? firms.slice(0, max) : firms
  return (
    <ol aria-label={label} className="divide-y divide-border/80">
      {shown.map((f, i) => (
        <li key={f.domain} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5 sm:grid-cols-[2.5rem_80px_minmax(0,1fr)_auto] sm:gap-x-4">
          <span className="font-news text-[19px] font-medium tabular-nums text-foreground/70" aria-label={`Rank ${f.rank}`}>
            {i > 0 && shown[i - 1].rank === f.rank ? <span className="text-foreground/40">=</span> : null}
            {f.rank}
          </span>
          <span className="hidden sm:block">
            <FirmMark name={f.name} logo={logoFor(f.domain)} mono={monogram(f.name)} size="sm" decorative eager={i < 6} />
          </span>
          <span className="min-w-0">
            {f.page ? (
              <Link prefetch={false} href={firmPath(category, f.slug)} className="hl font-news text-[17px] font-bold leading-snug text-foreground">
                {f.name}
              </Link>
            ) : (
              <span className="font-news text-[17px] font-bold leading-snug text-foreground">{f.name}</span>
            )}
            {!compact && f.cities.length > 0 && (
              <span className="block font-ui text-[12.5px] leading-snug text-foreground/65">
                {f.cities
                  .slice(0, 3)
                  .map((c) => c.label)
                  .join(' · ')}
                {f.cities.length > 3 ? ` + ${f.cities.length - 3} more` : ''}
              </span>
            )}
          </span>
          <Link prefetch={false} href={peopleHref(f)} className="text-right font-ui text-[12.5px] leading-tight text-foreground/75 hover:text-foreground hover:underline">
            <span className="block font-news text-[19px] font-medium tabular-nums text-foreground">{n(f.count)}</span>
            {f.count === 1 ? 'partner' : 'partners'}
          </Link>
        </li>
      ))}
    </ol>
  )
}

/** Questions and their computed answers, as plain headings and paragraphs (lib/directory/faq.ts: no FAQ markup). */
export function FaqList({ items, title }: { items: Faq[]; title: string }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="faq">
      <SectionHead id="faq" title={title} />
      <div className="divide-y divide-border/70">
        {items.map((f) => (
          <div key={f.q} className="py-3">
            <h3 className="font-news text-[18px] font-semibold leading-snug text-foreground">{f.q}</h3>
            <p className="mt-1 max-w-[70ch] font-ui text-[14px] leading-relaxed text-foreground/80">
              {f.a}
              {f.link ? (
                <>
                  {' '}
                  <Link prefetch={false} href={f.link.href} className="font-semibold text-foreground underline underline-offset-2">
                    {f.link.text}
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Links to other pages, in two plain columns: the related practices and places (Super Lawyers' foot). */
export function RelatedLinks({ groups, stack = false }: { groups: { title: string; items: { href: string; title: string; count?: number }[] }[]; stack?: boolean }) {
  const shown = groups.filter((g) => g.items.length >= 2)
  if (!shown.length) return null
  return (
    <section aria-label="Related pages" className={`grid gap-x-10 gap-y-6 ${stack ? '' : 'sm:grid-cols-2'}`}>
      {shown.map((g) => (
        <div key={g.title}>
          <SectionHead title={g.title} />
          <ul>
            {g.items.map((l) => (
              <li key={l.href} className="border-b border-border/60 last:border-0">
                <Link prefetch={false} href={l.href} className="flex min-h-[32px] items-baseline justify-between gap-3 py-[6px] font-news text-[15.5px] leading-snug text-foreground hover:underline">
                  <span>{l.title}</span>
                  {l.count !== undefined ? <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{n(l.count)}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

/** The two asks at the foot: the daily email, and claiming a profile. Plain, no box art. */
export function DirectoryCta() {
  return (
    <section aria-label="Stay current" className="grid gap-4 border-t-2 border-foreground pt-4 sm:grid-cols-2">
      <div>
        <p className="font-news text-[18px] font-semibold leading-snug text-foreground">Fund news, every weekday morning</p>
        <p className="mt-1 font-ui text-[13.5px] leading-relaxed text-foreground/75">FundOps Daily: the biggest fund closes, deals and hires in private markets, in your inbox every morning by 7:30am ET. Free.</p>
        <Link href="/join" className="mt-2 inline-flex h-10 items-center rounded-sm bg-foreground px-4 font-ui text-[13.5px] font-semibold text-background hover:bg-foreground/85">
          Get FundOps Daily
        </Link>
      </div>
      <div>
        <p className="font-news text-[18px] font-semibold leading-snug text-foreground">Listed here?</p>
        <p className="mt-1 font-ui text-[13.5px] leading-relaxed text-foreground/75">
          Claim your profile from its page to add to it, or ask for a correction or removal. It is free; the claim link goes to your work email at your firm&rsquo;s domain.
        </p>
        <Link href={`${DIRECTORY_ABOUT_PATH}#claim`} className="mt-2 inline-flex h-10 items-center rounded-sm border border-foreground/30 px-4 font-ui text-[13.5px] font-semibold text-foreground hover:border-foreground">
          How claiming works
        </Link>
      </div>
    </section>
  )
}
