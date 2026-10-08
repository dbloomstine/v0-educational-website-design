import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { FilterTabs } from '@/components/news/FilterTabs'
import { Panel } from '@/components/story/StoryBlocks'
import { SubscribePanel } from '@/components/home/Rail'
import { OUTBOUND } from '@/components/story/StoryLink'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { loadLeagueReport, LEAGUE_SINCE } from '@/lib/news/league-data'
import { capitalByAsset, leagueRows, LEAGUE_ASSET_LABEL as ASSET_LABEL, LEAGUE_PERIODS, STAGE_LABEL, type FundClose, type LeaguePeriod } from '@/lib/news/league'
import { sizeLabel, totalLabel } from '@/lib/news/format'
import { OG_IMAGES } from '@/lib/seo'

// League tables: the largest fund closes, ranked. The rules for what gets in
// are in lib/news/league.ts; `npx tsx scripts/league-audit.ts` checks them
// against the live data.

type Params = { searchParams: Promise<{ period?: string; asset?: string; stage?: string }> }

const ROWS_SHOWN = 100
const ASSETS = Object.keys(ASSET_LABEL)
const DESCRIPTION =
  'The largest private fund closes, ranked by size — private equity, venture, credit, real estate, infrastructure and secondaries. Every row links to the report it came from.'

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const sp = await searchParams
  const filtered = !!(sp.period || sp.asset || sp.stage)
  return {
    title: 'League tables: the largest fund closes',
    description: DESCRIPTION,
    alternates: { canonical: 'https://fundopshq.com/league-tables' },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: 'League tables: the largest fund closes | FundOpsHQ', description: DESCRIPTION, type: 'website', url: 'https://fundopshq.com/league-tables', images: OG_IMAGES },
    twitter: { card: 'summary_large_image', title: 'League tables | FundOpsHQ', description: DESCRIPTION, images: OG_IMAGES.map((i) => i.url) },
  }
}

function href(p: { period: LeaguePeriod; asset?: string; stage: 'final' | 'all' }): string {
  const sp = new URLSearchParams()
  if (p.period !== '30d') sp.set('period', p.period)
  if (p.asset) sp.set('asset', p.asset)
  if (p.stage !== 'final') sp.set('stage', p.stage)
  const qs = sp.toString()
  return qs ? `/league-tables?${qs}` : '/league-tables'
}

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export default async function LeagueTablesPage({ searchParams }: Params) {
  const sp = await searchParams
  const period = (LEAGUE_PERIODS.find((p) => p.key === sp.period)?.key ?? '30d') as LeaguePeriod
  const asset = ASSETS.find((a) => a.toLowerCase() === (sp.asset ?? '').toLowerCase())
  const stage: 'final' | 'all' = sp.stage === 'all' ? 'all' : 'final'
  const nowMs = Date.now()

  const report = await loadLeagueReport()
  const league = report.closes
  const inPeriodAndStage = leagueRows(league, { period, stage }, nowMs)
  const rows = asset ? inPeriodAndStage.filter((c) => c.assetClass === asset) : inPeriodAndStage
  const shown = rows.slice(0, ROWS_SHOWN)
  const capital = rows.reduce((s, c) => s + c.sizeUsdM, 0)
  const byAsset = capitalByAsset(league, nowMs, ASSET_LABEL, period)
  const assetsPresent = ASSETS.filter((a) => inPeriodAndStage.some((c) => c.assetClass === a))
  const periodLabel = LEAGUE_PERIODS.find((p) => p.key === period)!.label
  const since = new Date(`${LEAGUE_SINCE}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const maxAsset = Math.max(...byAsset.map((b) => b.value), 1)
  // Closes in this view that no report put a size on: counted, not ranked.
  const today = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const periodStart =
    period === 'ytd'
      ? `${today.slice(0, 4)}-01-01`
      : new Date(new Date(`${today}T12:00:00Z`).getTime() - (period === '90d' ? 90 : 30) * 86_400_000).toISOString().slice(0, 10)
  const noSize = report.unsized.filter(
    (u) => u.date >= periodStart && u.date <= today && (stage === 'all' || u.stage === 'final') && (!asset || u.assetClass === asset),
  ).length
  const disputed = shown.some((c) => c.altSizeUsdM)
  const updated = report.asOf
    ? `${new Date(report.asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET`
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Largest private fund closes',
    url: 'https://fundopshq.com/league-tables',
    itemListElement: shown.slice(0, 25).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `${c.firm}${c.fund ? ` — ${c.fund}` : ''} (${sizeLabel(c.sizeUsdM)})`, url: `https://fundopshq.com/story/${c.id}` })),
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-0 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">League tables</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
              The largest fund closes across private markets, ranked by size. Every row is a close a publication
              reported, and links to that report.
            </p>
            <FilterTabs
              ariaLabel="Period"
              label="Period"
              className="mt-3 border-b border-border/70"
              items={LEAGUE_PERIODS.map((p) => ({ href: href({ period: p.key, asset, stage }), label: p.label, active: p.key === period }))}
            />
            <FilterTabs
              ariaLabel="Asset class"
              label="Market"
              className="border-b border-border/70"
              items={[
                { href: href({ period, stage }), label: 'All', active: !asset },
                ...assetsPresent.map((a) => ({ href: href({ period, asset: a, stage }), label: ASSET_LABEL[a], active: asset === a })),
              ]}
            />
            <FilterTabs
              ariaLabel="Close stage"
              label="Stage"
              items={[
                { href: href({ period, asset, stage: 'final' }), label: 'Final closes', active: stage === 'final' },
                { href: href({ period, asset, stage: 'all' }), label: 'All closes, including first and interim', active: stage === 'all' },
              ]}
            />
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <section aria-label="League table" className="min-w-0">
              <div className="panel">
                <div className="panel-head">
                  <h2 className="font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em]">
                    {asset ? `${ASSET_LABEL[asset]} · ` : ''}{stage === 'final' ? 'Largest final closes' : 'Largest closes'} · {periodLabel}
                  </h2>
                  <span className="note whitespace-nowrap font-ui text-[11px]">
                    {rows.length.toLocaleString('en-US')} {rows.length === 1 ? 'close' : 'closes'} · {totalLabel(capital)}
                  </span>
                </div>
                {shown.length === 0 ? (
                  <p className="px-4 py-10 text-center font-news text-[17px] text-muted-foreground">
                    No closes reported for this view. <Link href="/league-tables" className="underline underline-offset-2">Reset the filters</Link>.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-border font-ui text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          <th scope="col" className="w-9 py-2 pl-3.5 pr-1 font-bold">#</th>
                          <th scope="col" className="px-2 py-2 font-bold">Manager and fund</th>
                          <th scope="col" className="px-2 py-2 text-right font-bold">Size</th>
                          <th scope="col" className="hidden px-2 py-2 font-bold md:table-cell">Market</th>
                          <th scope="col" className="hidden px-2 py-2 font-bold sm:table-cell">Reported</th>
                          <th scope="col" className="py-2 pl-2 pr-3.5 font-bold">Source</th>
                        </tr>
                      </thead>
                      <tbody className="river-rows">
                        {shown.map((c, i) => (
                          <Row key={c.id} c={c} rank={i + 1} showStage={stage === 'all'} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="mt-2 font-ui text-[12px] leading-snug text-muted-foreground">
                {rows.length > ROWS_SHOWN && <>Showing the largest {ROWS_SHOWN} of {rows.length.toLocaleString('en-US')}; narrow by market to see further down. </>}
                {noSize > 0 && <>{noSize} more {noSize === 1 ? 'close was' : 'closes were'} reported in this period without a size and {noSize === 1 ? 'is' : 'are'} not ranked. </>}
                ≈ converted to dollars from another currency.
                {disputed && <> † the reports also give a higher figure (usually a total that adds leverage or sister vehicles); the lower one is ranked.</>}
                {updated && <> Updated {updated}.</>}
              </p>
            </section>

            <aside className="min-w-0 space-y-5">
              {byAsset.length > 0 && (
                <Panel label="Capital by market" note={`Final closes · ${periodLabel.toLowerCase()}`}>
                  <ol className="space-y-[7px] pt-2">
                    {byAsset.map((b) => (
                      <li key={b.label} className="bar-row grid grid-cols-[108px_minmax(0,1fr)_46px] items-center gap-x-2" title={`${b.label}: ${totalLabel(b.value)} across ${b.count} ${b.count === 1 ? 'close' : 'closes'}`}>
                        <span className="bar-label truncate font-ui text-[12px] text-foreground/80">{b.label}</span>
                        <span className="h-[10px]">
                          <span className="bar-fill block h-full rounded-r-[4px] transition-colors" style={{ width: `${Math.max((b.value / maxAsset) * 100, 1.5)}%`, background: 'var(--ink)' }} />
                        </span>
                        <span className="text-right font-mono text-[11.5px] font-semibold tabular-nums text-foreground">{totalLabel(b.value)}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              )}

              <SponsorCard />

              <Panel label="How this table is made">
                <ul className="space-y-2 pt-2 font-news text-[14.5px] leading-[1.4] text-foreground/85">
                  <li><strong className="font-bold text-foreground">What counts.</strong> A fund close that a publication reported, with a named manager and a stated size. Rumoured and expected closes are left out until they happen.</li>
                  <li><strong className="font-bold text-foreground">What does not.</strong> Hedge funds, continuation vehicles, CLOs and other structured issues, single-investor mandates, evergreen funds, and a manager’s total assets or yearly fundraising. A figure the headline calls a target is not a close.</li>
                  <li><strong className="font-bold text-foreground">One fund, one row.</strong> Several outlets’ reports of the same close are joined — under whatever name or number each gave the fund — and dated to the first.</li>
                  <li><strong className="font-bold text-foreground">Sizes.</strong> As reported. A figure marked ≈ was reported in another currency and converted to dollars at the time.</li>
                  <li><strong className="font-bold text-foreground">When reports disagree.</strong> If outlets give different figures for one fund, the lower is ranked and the row is marked †. The higher is usually a total that adds leverage or single-investor vehicles to the fund itself.</li>
                  <li><strong className="font-bold text-foreground">Markets.</strong> Growth equity is counted with venture, which is how the reports are filed.</li>
                  <li><strong className="font-bold text-foreground">Coverage.</strong> From {since}. It ranks the closes in the stories we carried; it is not a census of every fund.</li>
                  <li>
                    <strong className="font-bold text-foreground">Corrections.</strong> The fields are extracted from the reports by software and can be wrong.{' '}
                    <a href="mailto:dbloomstine@gmail.com?subject=League%20table%20correction" className="underline underline-offset-2">Tell us</a> and we will fix the row.
                  </li>
                </ul>
              </Panel>

              <SubscribePanel title="The closes, as they happen." body="FundOps Daily carries each morning’s fund closes, launches, deals and moves. Free, seven days a week." />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function Row({ c, rank, showStage }: { c: FundClose; rank: number; showStage: boolean }) {
  return (
    <tr className="border-b border-border/70 align-baseline last:border-0 hover:bg-background">
      <td className="py-2 pl-3.5 pr-1 font-mono text-[11px] tabular-nums text-muted-foreground">{rank}</td>
      <td className="px-2 py-2">
        <Link prefetch={false} href={`/firm/${c.firmSlug}`} className="hl font-news text-[16px] font-bold leading-tight text-foreground">
          {c.firm}
        </Link>
        <span className="block font-ui text-[12px] leading-snug text-muted-foreground">
          {/* The fund's name opens our page for the close; the source cell is the citation and stays out. */}
          {c.fund && <Link prefetch={false} href={`/story/${c.id}`} className="hl text-foreground/80">{c.fund}</Link>}
          {c.fund && showStage && ' · '}
          {showStage && STAGE_LABEL[c.stage]}
          {!c.fund && !showStage && 'Fund not named in the reports'}
        </span>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-[14px] font-bold tabular-nums text-foreground">
        {c.converted && <span className="font-normal text-muted-foreground" title="Reported in another currency; converted to dollars">≈</span>}
        {sizeLabel(c.sizeUsdM)}
        {c.altSizeUsdM && <span className="font-normal text-muted-foreground" title={`Reports also give ${sizeLabel(c.altSizeUsdM)}`}>†</span>}
      </td>
      <td className="hidden whitespace-nowrap px-2 py-2 font-ui text-[12.5px] text-foreground/80 md:table-cell">{c.assetClass ? ASSET_LABEL[c.assetClass] ?? '—' : '—'}</td>
      <td className="hidden whitespace-nowrap px-2 py-2 font-mono text-[11px] uppercase tracking-tight text-muted-foreground sm:table-cell">{day(c.date)}</td>
      <td className="py-2 pl-2 pr-3.5 font-ui text-[12.5px]">
        <a href={c.url} {...OUTBOUND} title={c.headline} className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-2 hover:decoration-foreground">
          {c.source ?? 'Report'}
        </a>
        {c.sources > 1 && (
          <Link prefetch={false} href={`/story/${c.id}`} className="block whitespace-nowrap text-[11.5px] text-muted-foreground hover:text-foreground hover:underline">
            {c.sources} sources
          </Link>
        )}
      </td>
    </tr>
  )
}
