import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { MostCovered, mostCovered } from '@/components/home/Rail'
import { RiverRow, SectionFlag } from '@/components/story/StoryBlocks'
import { SubscribePanel } from '@/components/home/Rail'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { searchFirms } from '@/lib/news/firm-data'
import { ARCHIVE_WINDOW_DAYS, loadArchive, searchStories } from '@/lib/news/front-page'
import type { Story, StoryKind } from '@/lib/news/stories'
import { ASSET_LABEL, KIND_LABEL } from '@/lib/news/sections'
import { OG_IMAGES } from '@/lib/seo'
import { FilterTabs } from '@/components/news/FilterTabs'

// Latest: every story, newest first, with search and two filters. Rendered on
// the server from the same stories as the fronts, so a story that is one line
// on the front page is one line here — the previous client-side feed listed
// each outlet's report separately and the same close could appear three times.

type Params = { searchParams: Promise<{ q?: string; type?: string; asset?: string; page?: string }> }

const PAGE_SIZE = 100
const KINDS = Object.keys(KIND_LABEL) as StoryKind[]
const ASSETS = Object.keys(ASSET_LABEL)

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { q, type, asset, page } = await searchParams
  const filtered = !!(q || type || asset || page)
  const description =
    'Every fund close, launch, deal, people move and regulatory action across private markets, newest first — gathered from 200+ publications, one line per story, with search.'
  return {
    title: q ? `“${q.slice(0, 60)}” — search` : 'Latest fund news',
    description,
    alternates: { canonical: 'https://fundopshq.com/news' },
    // Filtered and searched views are the same stories again; only the bare page is indexed.
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: 'Latest fund news | FundOpsHQ', description, type: 'website', url: 'https://fundopshq.com/news', images: OG_IMAGES },
    twitter: { card: 'summary_large_image', title: 'Latest fund news | FundOpsHQ', description, images: OG_IMAGES.map((i) => i.url) },
  }
}

function href(params: { q?: string; type?: string; asset?: string; page?: number }): string {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.type) sp.set('type', params.type)
  if (params.asset) sp.set('asset', params.asset)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `/news?${qs}` : '/news'
}

/** "Sep 28" for anything older than yesterday; nothing for the last two days. */
function dateTag(story: Story, nowMs: number): string | null {
  const day = story.publishedDate ?? story.firstSeen.slice(0, 10)
  const et = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  if (day >= et(nowMs - 86_400_000)) return null
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default async function NewsPage({ searchParams }: Params) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const type = KINDS.includes(sp.type as StoryKind) ? (sp.type as StoryKind) : undefined
  const asset = ASSETS.find((a) => a.toLowerCase() === (sp.asset ?? '').toLowerCase())
  const page = Math.max(1, Math.min(50, parseInt(sp.page ?? '1', 10) || 1))
  const nowMs = Date.now()

  const archive = await loadArchive()
  // The firm line above the results is an extra: if its lookup fails, the story search still answers.
  const [pool, firmHits] = q ? await Promise.all([searchStories(q), searchFirms(q, 6).catch(() => [])]) : [archive, []]
  const base = [...pool].sort((a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? '') || b.firstSeen.localeCompare(a.firstSeen))

  const byType = type ? base.filter((s) => s.kind === type) : base
  const stories = asset ? byType.filter((s) => s.assetClasses.includes(asset)) : byType
  const typeCounts = KINDS.map((k) => ({ key: k, label: KIND_LABEL[k], count: (asset ? base.filter((s) => s.assetClasses.includes(asset)) : base).filter((s) => s.kind === k).length })).filter((o) => o.count > 0)
  const assetCounts = ASSETS.map((a) => ({ key: a, label: ASSET_LABEL[a], count: byType.filter((s) => s.assetClasses.includes(a)).length })).filter((o) => o.count > 0)

  const pages = Math.max(1, Math.ceil(stories.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = stories.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const covered = mostCovered(archive.filter((s) => nowMs - new Date(s.firstSeen).getTime() < 7 * 86_400_000), 8)

  const noun = stories.length === 1 ? 'story' : 'stories'
  const note = q
    ? `${stories.length.toLocaleString('en-US')} ${noun} in the past year`
    : `${stories.length.toLocaleString('en-US')} ${noun} in the last ${ARCHIVE_WINDOW_DAYS} days`

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-0 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Latest</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
              Every story, newest first — fund closes, launches, deals, moves and regulation. One line per story, however
              many outlets reported it.
            </p>

            <form action="/news" method="get" role="search" className="mt-3 flex max-w-[640px] items-center gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Search fund news</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search a firm, a fund or a person"
                  className="h-10 w-full rounded-sm border border-foreground/25 bg-card pl-9 pr-3 font-ui text-[14px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
              </label>
              {type && <input type="hidden" name="type" value={type} />}
              {asset && <input type="hidden" name="asset" value={asset} />}
              <button type="submit" className="h-10 rounded-sm bg-foreground px-4 font-ui text-[12.5px] font-bold uppercase tracking-[0.06em] text-background hover:bg-foreground/85">
                Search
              </button>
              {q && (
                <Link href={href({ type, asset })} className="inline-flex h-10 items-center gap-1 px-2 font-ui text-[12.5px] text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </Link>
              )}
            </form>

            <FilterTabs
              ariaLabel="Filter by story type"
              label="Type"
              className="mt-3 border-b border-border/70"
              items={[
                { href: href({ q, asset }), label: 'All', active: !type },
                ...typeCounts.map((o) => ({ href: href({ q, asset, type: o.key }), label: o.label, active: type === o.key })),
              ]}
            />
            <FilterTabs
              ariaLabel="Filter by asset class"
              label="Market"
              items={[
                { href: href({ q, type }), label: 'All', active: !asset },
                ...assetCounts.map((o) => ({ href: href({ q, type, asset: o.key }), label: o.label, active: asset === o.key })),
              ]}
            />
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <section aria-label="Stories" className="min-w-0">
              {firmHits.length > 0 && (
                <p className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border pb-3">
                  <span className="font-ui text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-foreground">Firm pages</span>
                  {firmHits.map((f) => (
                    <Link key={f.slug} href={`/firm/${f.slug}`} className="font-news text-[16px] font-bold text-foreground underline decoration-foreground/25 underline-offset-[3px] hover:decoration-foreground">
                      {f.name}
                    </Link>
                  ))}
                </p>
              )}
              <SectionFlag
                label={q ? `Results for “${q}”` : [type ? KIND_LABEL[type] : null, asset ? ASSET_LABEL[asset] : null].filter(Boolean).join(' · ') || 'All stories'}
                note={note}
              />
              {shown.length === 0 ? (
                <p className="py-8 font-news text-[17px] text-muted-foreground">
                  {q ? 'Nothing matched. Try a firm name on its own — “Ares”, not “Ares fund close”.' : 'Nothing here yet.'}{' '}
                  <Link href="/news" className="underline underline-offset-2">Show everything</Link>.
                </p>
              ) : (
                <ul className="river">
                  {shown.map((s) => (
                    <RiverRow
                      key={s.id}
                      story={s}
                      tags={[type ? null : KIND_LABEL[s.kind], asset ? null : s.assetClasses[0] ? ASSET_LABEL[s.assetClasses[0]] : null]}
                      date={dateTag(s, nowMs)}
                    />
                  ))}
                </ul>
              )}

              {pages > 1 && (
                <nav aria-label="Pages" className="mt-5 flex items-center justify-between border-t border-border pt-3 font-ui text-[13px]">
                  {current > 1 ? (
                    <Link href={href({ q, type, asset, page: current - 1 })} className="font-semibold text-foreground underline-offset-4 hover:underline">← Newer</Link>
                  ) : <span />}
                  <span className="text-muted-foreground">Page {current} of {pages}</span>
                  {current < pages ? (
                    <Link href={href({ q, type, asset, page: current + 1 })} className="font-semibold text-foreground underline-offset-4 hover:underline">Older →</Link>
                  ) : <span />}
                </nav>
              )}
            </section>

            <aside className="min-w-0 space-y-5">
              <MostCovered stories={covered} note="Past 7 days" />
              <SponsorCard />
              <SubscribePanel title="All of this, once a morning." body="FundOps Daily is the day’s closes, launches, deals and moves in one email. Free, seven days a week." />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
