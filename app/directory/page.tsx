import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Crumbs } from '@/components/directory/parts'
import { loadDirectorySummary } from '@/lib/directory/data'
import type { CategorySummary, SummaryLink } from '@/lib/directory/summary'
import { CATEGORIES, DIRECTORY_PATH, directoryEnabled, lowerNoun } from '@/lib/directory/taxonomy'
import { breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// /directory (2026-10-24 night): the five trades in one place, each with its
// count and its biggest city and practice pages. One small cached read
// (lib/directory/data.ts loadDirectorySummary), kept an hour.

export const revalidate = 3600

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
  if (!items.length) return null
  return (
    <div>
      <h3 className="font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/60">{title}</h3>
      <ul className="mt-1">
        {items.map((l) => (
          <li key={l.path}>
            <Link prefetch={false} href={l.path} className="flex items-baseline justify-between gap-3 py-[3px] font-news text-[15px] leading-snug text-foreground hover:underline">
              <span>{l.title}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{n(l.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Trade({ s }: { s: CategorySummary }) {
  const c = CATEGORIES[s.id]
  const href = `/${c.slug}`
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
      <p className="mt-1 max-w-[70ch] font-news text-[15.5px] leading-snug text-foreground/75">{c.intro}</p>
      {(s.cities.length > 0 || s.topics.length > 0) && (
        <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Links title="By city" items={s.cities} />
          <Links title={c.sides ? 'By practice and client' : 'By practice and stage'} items={s.topics} />
        </div>
      )}
      <p className="mt-2.5">
        <Link href={href} className="font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
          {s.count ? `Search all ${c.plural.toLowerCase()}` : `About the ${c.plural.toLowerCase()} directory`}
        </Link>
      </p>
    </section>
  )
}

export default async function DirectoryIndex() {
  if (!directoryEnabled()) notFound()
  const s = await loadDirectorySummary()
  const total = s.categories.reduce((a, c) => a + c.count, 0)
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: 'Directory', path: DIRECTORY_PATH }])) }} />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1080px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={[{ name: 'Directory' }]} />
            <h1 className="mt-3 font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Directory</h1>
            <p className="mt-2 max-w-[75ch] font-news text-[16.5px] leading-snug text-foreground/75">{INTRO}</p>
            {total > 0 && <p className="mt-1.5 font-ui text-[13px] font-semibold text-foreground/80">{n(total)} people listed.</p>}
          </header>
        </div>
        <div className="mx-auto max-w-[1080px] space-y-8 px-4 pb-12 pt-6 lg:px-6">
          {s.categories.map((c) => (
            <Trade key={c.id} s={c} />
          ))}
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
