import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { EventsRail, LargestBySize, LargestCloses, MostCovered, largestBySize, mostCovered } from '@/components/home/Rail'
import { queryEventFeed } from '@/lib/events/api'
import type { IndustryEvent } from '@/lib/events/types'
import { LeadStory, RiverRow, SectionFlag, TopStory } from '@/components/story/StoryBlocks'
import { getStoriesSafe, STORY_WINDOW_DAYS } from '@/lib/news/front-page'
import { rankSection, type Story } from '@/lib/news/stories'
import { ASSET_LABEL, KIND_LABEL, SECTIONS, SECTION_BY_SLUG, sectionHref, sectionNoun, storyInSection } from '@/lib/news/sections'
import { OG_IMAGES } from '@/lib/seo'
import { FilterTabs } from '@/components/news/FilterTabs'
import { FundraisingChart } from '@/components/charts/FundraisingChart'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { getLeagueReportSafe } from '@/lib/news/league-data'
import { weekCloses } from '@/lib/news/league'
import { chartData } from '@/lib/news/chart-views'
import { kickerLabel } from '@/lib/news/format'
import { cn } from '@/lib/utils'

export const revalidate = 600
export const dynamicParams = false

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.slug }))
}

type Params = { params: Promise<{ section: string }>; searchParams: Promise<{ f?: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section: slug } = await params
  const section = SECTION_BY_SLUG.get(slug)
  if (!section) return {}
  const title = `${sectionNoun(section).replace(/^./, (c) => c.toUpperCase())} news`
  const url = `https://fundopshq.com${sectionHref(slug)}`
  return {
    title,
    description: section.description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | FundOpsHQ`, description: section.description, type: 'website', url, images: OG_IMAGES },
    twitter: { card: 'summary_large_image', title: `${title} | FundOpsHQ`, description: section.description, images: OG_IMAGES.map((i) => i.url) },
  }
}

/** The cut within a section: an asset-class page splits by story type, a type page by asset class. */
function facetsFor(section: (typeof SECTIONS)[number], stories: Story[]) {
  const options: { key: string; label: string; test: (s: Story) => boolean }[] =
    section.group === 'asset'
      ? (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => ({ key: k, label: KIND_LABEL[k], test: (s: Story) => s.kind === k }))
      : Object.keys(ASSET_LABEL).map((a) => ({ key: a.toLowerCase(), label: ASSET_LABEL[a], test: (s: Story) => s.assetClasses.includes(a) }))
  return options
    .map((o) => ({ ...o, count: stories.filter(o.test).length }))
    .filter((o) => o.count > 0)
}

export default async function SectionPage({ params, searchParams }: Params) {
  const [{ section: slug }, { f }] = await Promise.all([params, searchParams])
  const section = SECTION_BY_SLUG.get(slug)
  if (!section) notFound()

  // The rail carries the section's own events: an asset-class page by asset
  // class, a story-type page by the board topics that go with it.
  const eventQuery: { category?: string; topic?: string } | null =
    section.group === 'asset' && section.assetClasses?.length
      ? { category: section.assetClasses.join(',') }
      : section.eventTopics?.length
        ? { topic: section.eventTopics.join(',') }
        : null
  // Fundraising and the asset-class pages carry the chart, cut to the section.
  const charted = section.kind === 'fundraising' || section.group === 'asset'
  const [all, league, events] = await Promise.all([
    getStoriesSafe(),
    charted ? getLeagueReportSafe() : Promise.resolve(null),
    eventQuery
      ? queryEventFeed({ ...eventQuery, when: '30d', limit: 5 })
          .then((feed) => feed.events)
          .catch<IndustryEvent[]>(() => [])
      : Promise.resolve<IndustryEvent[]>([]),
  ])
  const nowMs = Date.now()
  const inSection = all.filter((s) => storyInSection(s, section))
  const facets = facetsFor(section, inSection)
  const facet = facets.find((o) => o.key === f)
  const stories = facet ? inSection.filter(facet.test) : inSection

  const ranked = rankSection(stories.filter((s) => !s.roundup), nowMs)
  const lead = ranked[0] ?? null
  const top = ranked.slice(1, 5)

  // The section's closes and its chart are cut from the league table, so the
  // two panels and the league page agree on what a close is.
  const scope = section.group === 'asset' ? { assetClasses: section.assetClasses } : {}
  const week = league ? weekCloses(league.closes, nowMs, scope) : null
  const showCloses = !!week && week.rows.length > 0
  const covered = mostCovered(stories)
  // Deals and LPs have a number of their own: the week's largest.
  const largest = section.kind === 'deals' || section.kind === 'lps' ? largestBySize(inSection, 6, 7, nowMs) : []
  const largestLabel = section.kind === 'lps' ? 'Largest commitments' : 'Largest deals'
  const noun = sectionNoun(section)
  const eventsHref = eventQuery
    ? `/events?${eventQuery.category ? `category=${eventQuery.category.split(',')[0]}` : `topic=${(eventQuery.topic ?? '').split(',')[0]}`}`
    : '/events'
  const chart = league ? chartData(league, nowMs, scope) : null
  const showChart = !!chart && chart.closes.length > 0
  const leagueHref = section.group === 'asset' && section.assetClasses?.[0] ? `/league-tables?asset=${section.assetClasses[0]}` : '/league-tables'
  const hasRail = showChart || showCloses || largest.length >= 3 || covered.length >= 3 || events.length > 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${section.title} news`,
    description: section.description,
    url: `https://fundopshq.com${sectionHref(slug)}`,
    isPartOf: { '@type': 'WebSite', name: 'FundOpsHQ', url: 'https://fundopshq.com' },
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        {/* Section front, on the band: the page's own masthead */}
        <div className="band">
          <header className={cn('mx-auto max-w-[1320px] px-4 pt-5 lg:px-6', facets.length > 1 ? 'pb-0' : 'pb-4')}>
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">
              {section.title}
            </h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">{section.description}</p>

            {facets.length > 1 && (
              <FilterTabs
                ariaLabel={`Filter ${section.title}`}
                className="mt-2"
                items={[
                  { href: sectionHref(slug), label: 'All', active: !facet },
                  ...facets.map((o) => ({ href: `${sectionHref(slug)}?f=${o.key}`, label: o.label, active: facet?.key === o.key })),
                ]}
              />
            )}
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className={cn('grid gap-x-9 gap-y-8', hasRail && 'lg:grid-cols-[minmax(0,1fr)_332px]')}>
            <div className="min-w-0">
              {lead ? (
                <LeadStory story={lead} />
              ) : (
                <p className="font-news text-lg text-muted-foreground">
                  Nothing in the last {STORY_WINDOW_DAYS} days. The archive is at <Link href="/news" className="underline">Latest</Link>.
                </p>
              )}

              {top.length > 0 && (
                <section aria-label="More top stories" className="col-rule mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                  {top.map((s) => (
                    <TopStory key={s.id} story={s} />
                  ))}
                </section>
              )}

              {/* The river: every story in the section, by day */}
              {stories.length > 0 && (
                <section aria-label={`All ${section.title} stories`} className="mt-9">
                  <SectionFlag
                    label={facet ? `${section.title} · ${facet.label}` : `All ${noun} stories`}
                    note={`${stories.length} in the last ${STORY_WINDOW_DAYS} days`}
                  />
                  {/* One list, newest first, no day headings — Danny, 2026-10-01:
                      "the date of when it was posted is becoming less relevant…
                      they'll trust that it's recent". */}
                  <ul className="river">
                    {stories.map((s) => (
                      <RiverRow key={s.id} story={s} tags={[riverTag(s, section)]} />
                    ))}
                  </ul>
                  <p className="mt-4 font-ui text-[12.5px] text-muted-foreground">
                    Older stories, search and filters are in the{' '}
                    <Link href="/news" className="font-semibold text-foreground/80 underline underline-offset-2">full archive</Link>.
                  </p>
                </section>
              )}
            </div>

            {/* The rail belongs to the section — Danny, 2026-10-01: "the latest
                doesn't seem to be venture specific stuff". Its closes, its
                most-covered stories, its events; never the site-wide feed, and
                never a copy of the river beside it. It scrolls with the page:
                pinned, a rail taller than the window can't be read to its end. */}
            {hasRail && (
              <aside className="min-w-0 space-y-5">
                {showChart && chart && (
                  <FundraisingChart
                    {...chart}
                    href={leagueHref}
                    title={section.group === 'asset' ? `${section.label}, charted` : 'Fundraising, charted'}
                    moreLabel={section.group === 'asset' ? `${section.title} league table` : 'Full league tables'}
                  />
                )}
                <SponsorCard />
                {showCloses && week && <LargestCloses week={week} />}
                <LargestBySize label={largestLabel} stories={largest} />
                <MostCovered stories={covered} note={`Past ${STORY_WINDOW_DAYS} days`} />
                <EventsRail
                  events={events}
                  label={section.group === 'asset' ? `${section.title} events` : 'Related events'}
                  href={eventsHref}
                  moreLabel={section.group === 'asset' ? `All ${noun} events` : 'More on the events calendar'}
                />
              </aside>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}

/** What a river row says that the page does not: the story type on an asset-class page, the asset class on a type page. */
function riverTag(story: Story, section: (typeof SECTIONS)[number]): string | null {
  if (section.group === 'asset') return KIND_LABEL[story.kind] ?? kickerLabel(story)
  return story.assetClasses[0] ? ASSET_LABEL[story.assetClasses[0]] : null
}
