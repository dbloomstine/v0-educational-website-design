import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { firmHref } from '@/lib/news/league'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { Headline } from '@/components/story/Headline'
import { ShareBar } from '@/components/story/ShareBar'
import { HeadlineRow, SectionFlag } from '@/components/story/StoryBlocks'
import { LatestRail, SubscribePanel } from '@/components/home/Rail'
import { getStory } from '@/lib/news/front-page'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { pageSummary } from '@/lib/news/story-summary'
import { readLongSummary } from '@/lib/news/story-summary-store'
import { rankSection, type Story } from '@/lib/news/stories'
import { ASSET_LABEL, homeSectionFor, sectionHref, storyInSection } from '@/lib/news/sections'
import { kickerLabel, sizeLabel, stageLabel } from '@/lib/news/format'
import { entityKey, keysMatch } from '@/lib/newsletter/story-links'

export const revalidate = 1800

// Built on first request, then served from the edge until it is half an hour
// old. Without this a story page is rendered — and the database asked — on
// EVERY request, and the requests are mostly crawlers: 1,345 different story
// pages in one ten-minute stretch on 2026-10-02.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const found = await getStory(id)
  if (!found) return { title: 'Story not found' }
  const { story } = found
  const description = story.summary ?? `${story.headline} — reported by ${story.source ?? 'the original publisher'}.`
  const url = `https://fundopshq.com/story/${story.id}`
  return {
    title: story.headline,
    description,
    alternates: { canonical: url },
    openGraph: { title: story.headline, description, type: 'article', url, siteName: 'FundOpsHQ' },
    twitter: { card: 'summary_large_image', title: story.headline, description },
  }
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/70 py-2">
      <dt className="font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-news text-[16px] leading-snug text-foreground">{children}</dd>
    </div>
  )
}

export default async function StoryPage({ params }: Params) {
  const { id } = await params
  const found = await getStory(id)
  if (!found) notFound()
  const { story, all } = found
  const nowMs = Date.now()
  // The fuller summary, when the job has written one for any row of the story.
  // The meta description and the JSON-LD below keep the short one.
  const summary = pageSummary(story.summary, await readLongSummary(getSupabaseAdmin(), story))

  const section = homeSectionFor(story)
  const firmKey = entityKey(story.firmName)
  // The other firms in the story, each with a page of its own.
  const alsoNamed = (story.firms ?? [])
    .filter((name) => !keysMatch(entityKey(name), firmKey || '\u0000'))
    .map((name) => ({ name, href: firmHref(name) }))
    .filter((f): f is { name: string; href: string } => !!f.href)
  const sameFirm: Story[] = firmKey
    ? all.filter((s) => s.id !== story.id && keysMatch(entityKey(s.firmName), firmKey)).slice(0, 5)
    : []
  const taken = new Set([story.id, ...sameFirm.map((s) => s.id)])
  const moreInSection = section
    ? rankSection(all.filter((s) => storyInSection(s, section) && !taken.has(s.id) && !s.roundup), nowMs).slice(0, 6)
    : []

  const sized = story.kind === 'fundraising' || story.kind === 'deals' || story.kind === 'lps'
  const size = sized && story.leadEligible ? sizeLabel(story.sizeUsdM) : null
  const stage = stageLabel(story)
  const permalink = `https://fundopshq.com/story/${story.id}`
  const published = new Date(story.firstSeen).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.headline,
    description: story.summary ?? undefined,
    datePublished: story.firstSeen,
    url: permalink,
    isBasedOn: story.url,
    publisher: { '@type': 'Organization', name: 'FundOpsHQ', url: 'https://fundopshq.com' },
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-6 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-10 lg:grid-cols-[minmax(0,1fr)_332px]">
            <article className="min-w-0 max-w-[820px]">
              <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">
                {section ? (
                  <Link href={sectionHref(section.slug)} className="hover:underline">{kickerLabel(story)}</Link>
                ) : (
                  kickerLabel(story)
                )}
              </p>

              <h1 className="mt-2 font-news text-[30px] font-medium leading-[1.08] tracking-[-0.018em] text-foreground sm:text-[40px]">
                <Headline story={story} />
              </h1>

              <p className="mt-2 font-ui text-[13px] text-muted-foreground">
                {published} · first reported by{' '}
                <span className="font-semibold text-foreground/80">{story.source ?? 'the original publisher'}</span>
                {story.coverage.length > 0 && ` and ${story.coverage.length} other${story.coverage.length === 1 ? '' : 's'}`}
              </p>

              {summary?.kind === 'long' && (
                <div className="mt-5 space-y-4 font-news text-[18px] leading-[1.6] text-foreground/90 sm:text-[19px]">
                  {summary.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )}
              {summary?.kind === 'short' && (
                <p className="mt-5 border-l-2 border-foreground pl-4 font-news text-[19px] leading-[1.45] text-foreground/85 sm:text-[20px]">
                  {summary.text}
                </p>
              )}

              {/* The story itself lives with its publisher. */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-5 font-ui text-[13px] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-foreground/85"
                >
                  Read the full story at {story.source ?? 'the source'}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
                <ShareBar url={permalink} title={story.headline} />
              </div>

              {/* What we know, as fields */}
              <dl className="mt-8 grid gap-x-8 border-t-2 border-foreground sm:grid-cols-2">
                {story.firmName && (
                  <Fact label={story.kind === 'lps' ? 'Investor' : 'Firm'}>
                    {firmHref(story.firmName) ? (
                      <Link prefetch={false} href={firmHref(story.firmName) as string} className="underline decoration-foreground/25 underline-offset-[3px] hover:decoration-foreground">{story.firmName}</Link>
                    ) : story.firmName}
                  </Fact>
                )}
                {alsoNamed.length > 0 && (
                  <Fact label="Also named">
                    {alsoNamed.map((f, i) => (
                      <span key={f.href}>
                        {i > 0 && ', '}
                        <Link prefetch={false} href={f.href} className="underline decoration-foreground/25 underline-offset-[3px] hover:decoration-foreground">{f.name}</Link>
                      </span>
                    ))}
                  </Fact>
                )}
                {story.fundName && <Fact label="Fund">{story.fundName}</Fact>}
                {size && <Fact label={story.kind === 'deals' ? 'Deal value' : story.kind === 'lps' ? 'Commitment' : 'Size'}><span className="font-mono text-[15px] font-bold">{size}</span></Fact>}
                {stage && <Fact label="Stage">{stage}</Fact>}
                {story.personName && <Fact label="People">{story.personName}</Fact>}
                {story.assetClasses.length > 0 && (
                  <Fact label="Asset class">{story.assetClasses.map((c) => ASSET_LABEL[c] ?? c).join(', ')}</Fact>
                )}
                {story.geography.length > 0 && <Fact label="Geography">{story.geography.join(', ')}</Fact>}
              </dl>
              <p className="mt-2 font-ui text-[11.5px] leading-snug text-muted-foreground">
                The summary and fields above are extracted from the published reports and can contain errors. The linked
                articles are the source of record.
              </p>

              {/* Everyone who reported it */}
              <section aria-label="Coverage" className="mt-9">
                <SectionFlag label="Coverage" note={`${story.coverage.length + 1} source${story.coverage.length === 0 ? '' : 's'}`} />
                <ul>
                  {[{ source: story.source ?? 'Source', url: story.url, headline: story.headline }, ...story.coverage].map((c) => (
                    <li key={c.url} className="border-b border-border/70 py-2 last:border-0">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="group grid gap-x-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-baseline">
                        <span className="font-ui text-[12.5px] font-bold text-foreground/85">{c.source}</span>
                        <span className="font-news text-[15.5px] leading-snug text-foreground">
                          <span className="hl">{c.headline}</span>
                          <ArrowUpRight className="ml-1 inline h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              {sameFirm.length > 0 && (
                <section aria-label={`More on ${story.firmName}`} className="mt-9">
                  <SectionFlag label={`More on ${story.firmName}`} href={firmHref(story.firmName) ?? undefined} note={firmHref(story.firmName) ? 'Everything on this firm →' : undefined} />
                  <ul>
                    {sameFirm.map((s) => (
                      <HeadlineRow key={s.id} story={s} showSource />
                    ))}
                  </ul>
                </section>
              )}

              {section && moreInSection.length > 0 && (
                <section aria-label={`More in ${section.title}`} className="mt-9">
                  <SectionFlag label={`More in ${section.title}`} href={sectionHref(section.slug)} />
                  <ul>
                    {moreInSection.map((s) => (
                      <HeadlineRow key={s.id} story={s} showSource />
                    ))}
                  </ul>
                </section>
              )}
            </article>

            <aside className="min-w-0 space-y-5">
              <LatestRail stories={all.slice(0, 10)} />
              <SponsorCard />
              <SubscribePanel title="Stories like this, every morning." body="FundOps Daily is the brief on fund closes, launches, deals and moves. Free, before the open." />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
