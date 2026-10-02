import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { Panel, RiverRow, SectionFlag } from '@/components/story/StoryBlocks'
import { SubscribePanel } from '@/components/home/Rail'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { FIRM_WINDOW_DAYS, getFirm } from '@/lib/news/firm-data'
import type { Story } from '@/lib/news/stories'
import { LEAGUE_ASSET_LABEL as ASSET_LABEL, STAGE_LABEL } from '@/lib/news/league'
import { KIND_LABEL } from '@/lib/news/sections'
import { sizeLabel, totalLabel } from '@/lib/news/format'
import { OG_IMAGES } from '@/lib/seo'

// A firm's page: every story we have carried about it in the past year, and
// the fund closes among them. Reached from the league tables, the lead
// story's facts and a story's own page.

export const revalidate = 1800

type Params = { params: Promise<{ slug: string }> }

const day = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : null)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const firm = await getFirm(slug)
  if (!firm) return { title: 'Firm not found', robots: { index: false } }
  const total = firm.stories.length + firm.mentions.length
  const description = `${firm.name} in the news: ${total} ${total === 1 ? 'story' : 'stories'} from the past year${firm.closes.length ? `, including ${firm.closes.length} fund ${firm.closes.length === 1 ? 'close' : 'closes'}` : ''} — fund closes, deals and people moves, each linked to its publisher.`
  const url = `https://fundopshq.com/firm/${slug}`
  return {
    title: `${firm.name}: fund closes, deals and news`,
    description,
    alternates: { canonical: url },
    // A page with one or two stories adds nothing to the publishers' own.
    robots: total >= 3 ? undefined : { index: false, follow: true },
    openGraph: { title: `${firm.name} | FundOpsHQ`, description, type: 'website', url, images: OG_IMAGES },
    twitter: { card: 'summary_large_image', title: `${firm.name} | FundOpsHQ`, description, images: OG_IMAGES.map((i) => i.url) },
  }
}

export default async function FirmPage({ params }: Params) {
  const { slug } = await params
  const firm = await getFirm(slug)
  if (!firm) notFound()

  const finals = firm.closes.filter((c) => c.stage === 'final')
  const capital = finals.reduce((s, c) => s + c.sizeUsdM, 0)
  const kinds = new Map<Story['kind'], number>()
  for (const s of firm.stories) kinds.set(s.kind, (kinds.get(s.kind) ?? 0) + 1)
  const summary = [
    `${firm.stories.length} ${firm.stories.length === 1 ? 'story' : 'stories'} in the past ${FIRM_WINDOW_DAYS === 365 ? 'year' : `${FIRM_WINDOW_DAYS} days`}`,
    finals.length > 0 ? `${finals.length} final ${finals.length === 1 ? 'close' : 'closes'} totalling ${totalLabel(capital)}` : null,
    firm.mentions.length > 0 ? `named in ${firm.mentions.length} more` : null,
  ].filter(Boolean)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-4 pt-5 lg:px-6">
            <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">
              <Link href="/firms" className="hover:underline">Firms</Link>
            </p>
            <h1 className="mt-1.5 font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">{firm.name}</h1>
            <p className="mt-2 font-news text-[16px] leading-snug text-foreground/70">{summary.join(' · ')}</p>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <div className="min-w-0 space-y-8">
              {firm.closes.length > 0 && (
                <Panel label="Fund closes" note="As reported">
                  <div className="-mx-[14px] -mb-[10px] overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-border font-ui text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          <th scope="col" className="py-2 pl-3.5 pr-2 font-bold">Fund</th>
                          <th scope="col" className="px-2 py-2 text-right font-bold">Size</th>
                          <th scope="col" className="px-2 py-2 font-bold">Stage</th>
                          <th scope="col" className="hidden px-2 py-2 font-bold sm:table-cell">Reported</th>
                          <th scope="col" className="py-2 pl-2 pr-3.5 font-bold">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {firm.closes.map((c) => (
                          <tr key={c.id} className="border-b border-border/70 align-baseline last:border-0">
                            <td className="py-2 pl-3.5 pr-2 font-news text-[15.5px] leading-tight text-foreground">
                              {c.fund ?? <span className="text-muted-foreground">Not named in the reports</span>}
                              {c.assetClass && <span className="block font-ui text-[11.5px] text-muted-foreground">{ASSET_LABEL[c.assetClass]}</span>}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-[13.5px] font-bold tabular-nums text-foreground">
                              {c.converted && <span className="font-normal text-muted-foreground" title="Reported in another currency; converted to dollars">≈</span>}
                              {sizeLabel(c.sizeUsdM)}
                              {c.altSizeUsdM && <span className="font-normal text-muted-foreground" title={`Reports also give ${sizeLabel(c.altSizeUsdM)}; the lower figure is used`}>†</span>}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 font-ui text-[12.5px] text-foreground/80">{STAGE_LABEL[c.stage]}</td>
                            <td className="hidden whitespace-nowrap px-2 py-2 font-mono text-[11px] uppercase tracking-tight text-muted-foreground sm:table-cell">{day(c.date)}</td>
                            <td className="py-2 pl-2 pr-3.5 font-ui text-[12.5px]">
                              <a href={c.url} target="_blank" rel="noopener noreferrer" title={c.headline} className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-2 hover:decoration-foreground">
                                {c.source ?? 'Report'}
                              </a>
                              {c.sources > 1 && <Link href={`/story/${c.id}`} className="ml-1.5 whitespace-nowrap text-[11.5px] text-muted-foreground hover:underline">+{c.sources - 1}</Link>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}

              {firm.stories.length > 0 && (
                <section aria-label={`Stories about ${firm.name}`}>
                  <SectionFlag label={`${firm.name} in the news`} note={`${firm.stories.length} in the past year`} />
                  <ul className="river">
                    {firm.stories.map((s) => (
                      <RiverRow key={s.id} story={s} tags={[KIND_LABEL[s.kind]]} date={day(s.publishedDate ?? s.firstSeen)} />
                    ))}
                  </ul>
                </section>
              )}

              {firm.mentions.length > 0 && (
                <section aria-label={`Stories that mention ${firm.name}`}>
                  <SectionFlag label="Also named in" note="The other side of a deal, a hire’s former firm" />
                  <ul className="river">
                    {firm.mentions.map((s) => (
                      <RiverRow key={s.id} story={s} tags={[KIND_LABEL[s.kind]]} date={day(s.publishedDate ?? s.firstSeen)} />
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="min-w-0 space-y-5">
              {kinds.size > 0 && (
                <Panel label="Coverage" note="Past year">
                  <dl className="pt-1">
                    {Array.from(kinds.entries()).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                      <div key={k} className="flex items-baseline justify-between border-b border-border/70 py-[7px] last:border-0">
                        <dt className="font-news text-[15px] text-foreground">{KIND_LABEL[k]}</dt>
                        <dd className="font-mono text-[13px] font-bold tabular-nums text-foreground">{n}</dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              )}
              <SponsorCard />
              <Panel label="About this page">
                <p className="pt-2 font-news text-[14.5px] leading-[1.4] text-foreground/85">
                  Every story FundOpsHQ has carried about {firm.name} in the past year, gathered from the publications that
                  reported them. Fund sizes and stages are extracted from those reports by software and can be wrong;
                  the linked article is the source of record.
                </p>
                <Link href="/firms" className="mt-2 block font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
                  All firms, A to Z →
                </Link>
                <Link href="/league-tables" className="mt-1 block font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
                  League tables: the largest fund closes →
                </Link>
              </Panel>
              <SubscribePanel title="Follow the firms you care about." body="FundOps Daily is the morning’s closes, launches, deals and moves in one email. Free." />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
