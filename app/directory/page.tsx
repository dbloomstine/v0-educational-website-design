import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Crumbs } from '@/components/directory/parts'
import { loadDirectorySummary } from '@/lib/directory/data'
import type { CategorySummary, SummaryFirm, SummaryLink } from '@/lib/directory/summary'
import { FirmMark } from '@/components/directory/FirmMark'
import { FIRM_MIN, firmPath } from '@/lib/directory/firms'
import { logoFor, monogram } from '@/lib/directory/logos'
import { listJoin } from '@/lib/directory/people'
import { CATEGORIES, DIRECTORY_PATH, directoryEnabled, lowerNoun } from '@/lib/directory/taxonomy'
import { breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// /directory (2026-10-24 night): the five trades in one place, each with its
// count and its biggest city and practice pages. One small cached read
// (lib/directory/data.ts loadDirectorySummary), kept an hour.

// Rendered on request, never at build time (2026-10-24 night: a build that prerendered directory pages failed on
// database timeouts). The data is one cached read (lib/directory/data.ts); the edge keeps the page (next.config.mjs).
export const dynamic = 'force-dynamic'

const INTRO =
  'The outside professionals who work on private funds in the US: fund lawyers, auditors, tax advisors, placement agents and fund finance bankers. Every profile is drawn from the firm’s own public bio page and links to it. Free to search; nobody pays to be listed or to rank.'

const n = (x: number) => x.toLocaleString('en-US')

export async function generateMetadata(): Promise<Metadata> {
  if (!directoryEnabled()) return { title: 'Not found', robots: { index: false } }
  const s = await loadDirectorySummary()
  const total = s.categories.reduce((a, c) => a + c.count, 0)
  const description = metaDescription(INTRO)
  return {
    title: 'Directory of Fund Lawyers, Auditors and Placement Agents',
    description,
    alternates: { canonical: `https://fundopshq.com${DIRECTORY_PATH}` },
    // Nothing to offer a search engine until someone is listed.
    robots: total ? undefined : { index: false, follow: true },
    ...shareCard('The FundOpsHQ Directory', description, DIRECTORY_PATH),
  }
}

function Links({ title, items }: { title: string; items: SummaryLink[] }) {
  // Never a section of one link.
  if (items.length < 2) return null
  return (
    <div>
      <h3 className="font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/70">{title}</h3>
      <ul className="mt-1">
        {items.map((l) => (
          <li key={l.path}>
            <Link prefetch={false} href={l.path} className="flex items-baseline justify-between gap-3 py-[3px] font-news text-[15px] leading-snug text-foreground hover:underline">
              <span>{l.title}</span>
              <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-foreground/65">{n(l.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Trade({ s, firms }: { s: CategorySummary; firms: SummaryFirm[] }) {
  const c = CATEGORIES[s.id]
  const href = `/${c.slug}`
  // The firms with the most people listed, each linking to its page in the directory (two people or more).
  const top = firms.filter((f) => f.category === s.id && f.count >= FIRM_MIN).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en'))
  return (
    <section aria-labelledby={`dir-${c.slug}`} className="border-t-2 border-foreground pt-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id={`dir-${c.slug}`} className="font-news text-[24px] font-medium leading-tight tracking-[-0.01em] text-foreground">
          <Link href={href} className="hover:underline">
            {c.plural}
          </Link>
        </h2>
        <p className="font-ui text-[12.5px] font-semibold text-foreground/75">
          {s.count ? `${n(s.count)} ${lowerNoun(c, s.count)} at ${n(s.firms)} ${s.firms === 1 ? 'firm' : 'firms'}` : 'Being put together'}
        </p>
      </div>
      <p className="mt-1 max-w-[70ch] font-news text-[15.5px] leading-snug text-foreground/80">{c.intro}</p>
      {top.length >= 2 && (
        <ul aria-label={`Firms with the most ${c.plural.toLowerCase()} listed`} className="mt-3 flex flex-wrap gap-2">
          {top.slice(0, 10).map((f) => (
            <li key={f.domain} className="max-sm:[&:nth-child(n+7)]:hidden">
              <Link
                prefetch={false}
                href={firmPath(c, f.slug)}
                title={`${f.name}: ${n(f.count)} listed`}
                className="flex flex-col items-center gap-1 rounded-[3px] border border-border bg-card px-2 py-2 hover:border-foreground/40"
              >
                <FirmMark name={f.name} logo={logoFor(f.domain)} mono={monogram(f.name)} size="md" decorative />
                <span className="font-ui text-[12px] leading-tight text-foreground/75">
                  <span className="sr-only">{f.name}: </span>
                  {n(f.count)} listed
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(s.cities.length > 0 || s.topics.length > 0) && (
        <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Links title="By city" items={s.cities} />
          <Links title={c.sides ? 'By practice and client' : 'By practice and stage'} items={s.topics} />
        </div>
      )}
      <p className="mt-2.5">
        <Link href={href} className="font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
          Search all {c.plural.toLowerCase()}
        </Link>
      </p>
    </section>
  )
}

export default async function DirectoryIndex() {
  if (!directoryEnabled()) notFound()
  const s = await loadDirectorySummary()
  const total = s.categories.reduce((a, c) => a + c.count, 0)
  const coming = s.categories.filter((c) => c.count === 0)
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: 'Directory', path: DIRECTORY_PATH }])) }} />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1080px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={[{ name: 'Directory' }]} />
            <h1 className="mt-3 font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Directory</h1>
            <p className="mt-2 max-w-[75ch] font-news text-[16.5px] leading-snug text-foreground/80">{INTRO}</p>
            {total > 0 && <p className="mt-1.5 font-ui text-[13px] font-semibold text-foreground/80">{n(total)} people listed.</p>}
          </header>
        </div>
        <div className="mx-auto max-w-[1080px] space-y-8 px-4 pb-12 pt-6 lg:px-6">
          {s.categories
            .filter((c) => c.count > 0)
            .map((c) => (
              <Trade key={c.id} s={c} firms={s.firms} />
            ))}
          {coming.length > 0 && (
            <p className="border-t-2 border-foreground pt-2 font-news text-[16.5px] leading-snug text-foreground/85">
              <span className="font-semibold text-foreground">Being put together:</span> {listJoin(coming.map((c) => CATEGORIES[c.id].plural.toLowerCase()))}. Each opens
              here once its first profiles are checked.
            </p>
          )}
          <p className="max-w-[70ch] border-t border-border pt-4 font-ui text-[12.5px] leading-relaxed text-muted-foreground">
            Lists are in surname order, never ranked. Anyone listed can claim their profile with a work email at their firm, correct it or have
            it removed from the link on their page. See{' '}
            <Link href="/privacy#directory" className="underline underline-offset-2">
              how the directory works
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
