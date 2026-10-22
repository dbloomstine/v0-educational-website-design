import { InlineSignup } from '@/components/newsletter/InlineSignup'
import { leagueLine } from '@/lib/newsletter/inline-copy'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SubscribePanel } from '@/components/home/Rail'
import { LeagueRow, LeagueTableHead } from '@/components/league/LeagueRow'
import { loadLeagueReport } from '@/lib/news/league-data'
import { leagueRows } from '@/lib/news/league'
import { totalLabel } from '@/lib/news/format'
import { storyPermalink } from '@/lib/news/story-jsonld'
import { LEAGUE_MARKETS, marketBySlug, marketQuestions, marketSummary, marketTitle } from '@/lib/news/league-markets'

// One market's largest final closes of the year (2026-10-22; lib/news/league-markets.ts says why). The same cached
// league report as /league-tables, so a page here costs no query of its own; the same rows, the same rules.

type Params = { params: Promise<{ market: string }> }

export const revalidate = 1800
export const dynamicParams = false

export function generateStaticParams() {
  return LEAGUE_MARKETS.map((m) => ({ market: m.slug }))
}

const ROWS_SHOWN = 50
const LEAGUE_OG = [{ url: 'https://fundopshq.com/league-tables/opengraph-image', width: 1200, height: 630, alt: 'FundOpsHQ league tables: the largest private fund closes of the year' }]
const yearNow = () => Number(new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).slice(0, 4))

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const m = marketBySlug((await params).market)
  if (!m) return {}
  const year = yearNow()
  const title = marketTitle(m, year)
  const description = `The largest ${m.name} fund closes reported in ${year}, ranked by size and updated through the day. Every row links to the report it came from.`
  const url = `https://fundopshq.com/league-tables/${m.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    // The league tables' own share card: the year's largest closes.
    openGraph: { title: `${title} | FundOpsHQ`, description, type: 'website', url, images: LEAGUE_OG },
    twitter: { card: 'summary_large_image', title: `${title} | FundOpsHQ`, description, images: LEAGUE_OG.map((i) => i.url) },
  }
}

export default async function LeagueMarketPage({ params }: Params) {
  const m = marketBySlug((await params).market)
  if (!m) notFound()
  const year = yearNow()
  const report = await loadLeagueReport()
  const rows = leagueRows(report.closes, { period: 'ytd', stage: 'final' }, Date.now()).filter((c) => c.assetClass === m.asset)
  const shown = rows.slice(0, ROWS_SHOWN)
  const capital = rows.reduce((s, c) => s + c.sizeUsdM, 0)
  const title = marketTitle(m, year)
  const answer = marketSummary(m, rows, year)
  const questions = marketQuestions(m, rows, year)
  const updated = report.asOf
    ? `${new Date(report.asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET`
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: answer,
    url: `https://fundopshq.com/league-tables/${m.slug}`,
    numberOfItems: rows.length,
    itemListElement: shown.slice(0, 25).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `${c.firm}${c.fund ? ` — ${c.fund}` : ''}`, url: storyPermalink(c) })),
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1080px] px-4 pb-5 pt-5 lg:px-6">
            <p className="font-ui text-[12px] text-muted-foreground">
              <Link href="/league-tables" className="underline underline-offset-2">League tables</Link>
            </p>
            <h1 className="mt-1 font-news text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[40px]">{title}</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[17px] leading-snug text-foreground/80">{answer}</p>
            {/* The ask under the answer (2026-10-22): one line, in the browser only, never to a subscriber. */}
            <InlineSignup form="inline-league" line={leagueLine(m.name)} className="mt-3 max-w-[820px]" />
          </header>
        </div>
        <div className="mx-auto grid max-w-[1080px] gap-6 px-4 pb-12 pt-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6">
          <section className="min-w-0">
            <div className="panel panel-lead overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 border-b border-border px-3.5 py-2.5">
                <h2 className="font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">Final closes · {year} to date</h2>
                <span className="note whitespace-nowrap font-ui text-[11px]">
                  {rows.length.toLocaleString('en-US')} {rows.length === 1 ? 'close' : 'closes'} · {totalLabel(capital)}
                </span>
              </div>
              {shown.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <LeagueTableHead />
                    <tbody className="river-rows">
                      {shown.map((c, i) => <LeagueRow key={c.id} c={c} rank={i + 1} showStage={false} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="mt-2 font-ui text-[12px] leading-snug text-muted-foreground">
              {rows.length > ROWS_SHOWN && <>Showing the largest {ROWS_SHOWN} of {rows.length.toLocaleString('en-US')}. </>}
              Final closes only, as reported; ≈ converted to dollars from another currency; † the reports also give a higher figure.
              What counts is set out on the <Link href="/league-tables" className="underline underline-offset-2">league tables</Link> page.
              {updated && <> Updated {updated}.</>}
            </p>
            {questions.length > 0 && (
              <section aria-labelledby="quick-answers" className="mt-7">
                <h2 id="quick-answers" className="font-news text-[20px] font-medium text-foreground">Quick answers</h2>
                <dl className="mt-2 divide-y divide-foreground/10 border-y border-foreground/10">
                  {questions.map((x) => (
                    <div key={x.q} className="py-2.5">
                      <dt className="font-ui text-[14px] font-semibold text-foreground">{x.q}</dt>
                      <dd className="mt-0.5 font-news text-[15.5px] leading-snug text-foreground/80">{x.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            <nav aria-label="Other markets" className="mt-6 font-ui text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground/80">Other markets, {year}:</span>{' '}
              {LEAGUE_MARKETS.filter((o) => o.slug !== m.slug).map((o, i) => (
                <span key={o.slug}>
                  {i > 0 && ' · '}
                  <Link href={`/league-tables/${o.slug}`} className="underline underline-offset-2 hover:text-foreground">{o.name}</Link>
                </span>
              ))}
            </nav>
          </section>
          <aside className="min-w-0">
            <SubscribePanel title="The closes, as they happen." body="FundOps Daily carries each morning’s fund closes, launches, deals and moves. Free, seven days a week." />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
