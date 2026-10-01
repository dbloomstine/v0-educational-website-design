import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { EventsRail, LargestCloses, MostCovered, mostCovered } from '@/components/home/Rail'
import { queryEventFeed } from '@/lib/events/api'
import type { IndustryEvent } from '@/lib/events/types'
import { LeadStory, SectionFlag, TopStory } from '@/components/story/StoryBlocks'
import { Headline } from '@/components/story/Headline'
import { getStoriesSafe, STORY_WINDOW_DAYS } from '@/lib/news/front-page'
import { composeFrontPage, rankSection, type Story } from '@/lib/news/stories'
import { ASSET_LABEL, KIND_LABEL, SECTIONS, SECTION_BY_SLUG, sectionHref, storyInSection } from '@/lib/news/sections'
import { kickerLabel, sizeLabel, stageLabel } from '@/lib/news/format'
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
  const title = `${section.title} news`
  return {
    title,
    description: section.description,
    alternates: { canonical: `https://fundopshq.com${sectionHref(slug)}` },
    openGraph: { title: `${title} | FundOpsHQ`, description: section.description, type: 'website', url: `https://fundopshq.com${sectionHref(slug)}` },
    twitter: { card: 'summary_large_image', title: `${title} | FundOpsHQ`, description: section.description },
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

  // An asset-class page also carries that market's next events.
  const [all, events] = await Promise.all([
    getStoriesSafe(),
    section.group === 'asset' && section.assetClasses?.length
      ? queryEventFeed({ category: section.assetClasses.join(','), when: '30d', limit: 5 })
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

  const closes = composeFrontPage(inSection, nowMs)
  const showCloses = (section.group === 'asset' || section.kind === 'fundraising') && closes.largestCloses.length > 0
  const covered = mostCovered(stories)
  const hasRail = showCloses || covered.length >= 3 || events.length > 0

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
        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          {/* Section front */}
          <header className="border-b border-border pb-3">
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">
              {section.title}
            </h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">{section.description}</p>

            {facets.length > 1 && (
              <nav aria-label={`Filter ${section.title}`} className="tab-scroll -mx-1 mt-3 flex items-center gap-1 overflow-x-auto px-1">
                <FacetLink href={sectionHref(slug)} active={!facet} label="All" count={inSection.length} />
                {facets.map((o) => (
                  <FacetLink key={o.key} href={`${sectionHref(slug)}?f=${o.key}`} active={facet?.key === o.key} label={o.label} count={o.count} />
                ))}
              </nav>
            )}
          </header>

          <div className={cn('mt-5 grid gap-x-9 gap-y-8', hasRail && 'lg:grid-cols-[minmax(0,1fr)_332px]')}>
            <div className="min-w-0">
              {lead ? (
                <LeadStory story={lead} />
              ) : (
                <p className="font-news text-lg text-muted-foreground">
                  Nothing in the last {STORY_WINDOW_DAYS} days. The archive is at <Link href="/news" className="underline">Latest</Link>.
                </p>
              )}

              {top.length > 0 && (
                <section aria-label="More top stories" className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {top.map((s) => (
                    <TopStory key={s.id} story={s} />
                  ))}
                </section>
              )}

              {/* The river: every story in the section, by day */}
              {stories.length > 0 && (
                <section aria-label={`All ${section.title} stories`} className="mt-9">
                  <SectionFlag
                    label={facet ? `${section.title} · ${facet.label}` : `All ${section.title.toLowerCase()} stories`}
                    note={`${stories.length} in the last ${STORY_WINDOW_DAYS} days`}
                  />
                  {/* One list, newest first, no day headings — Danny, 2026-10-01:
                      "the date of when it was posted is becoming less relevant…
                      they'll trust that it's recent". */}
                  <ul>
                    {stories.map((s) => (
                      <RiverRow key={s.id} story={s} section={section} />
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
              <aside className="min-w-0 space-y-7 lg:border-l lg:border-border lg:pl-8">
                {showCloses && <LargestCloses stories={closes.largestCloses} stats={closes.stats} />}
                <MostCovered stories={covered} note={`Past ${STORY_WINDOW_DAYS} days`} />
                <EventsRail
                  events={events}
                  label={`${section.title} events`}
                  href={`/events?category=${(section.assetClasses ?? []).join(',')}`}
                  moreLabel={`All ${section.title.toLowerCase()} events`}
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

function FacetLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 font-ui text-[12.5px] transition-colors',
        active
          ? 'border-foreground bg-foreground font-semibold text-background'
          : 'border-border bg-card text-foreground/75 hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {label}
      <span className={cn('font-mono text-[10.5px]', active ? 'text-background/70' : 'text-muted-foreground')}>{count}</span>
    </Link>
  )
}

/** One story in the river: headline, then the facts that distinguish it, then who reported it. */
function RiverRow({ story, section }: { story: Story; section: (typeof SECTIONS)[number] }) {
  // On an asset-class page the useful tag is the story type; on a type page, the asset class.
  const tag = section.group === 'asset' ? KIND_LABEL[story.kind] : story.assetClasses[0] ? ASSET_LABEL[story.assetClasses[0]] : null
  const sized = story.kind === 'fundraising' || story.kind === 'deals' || story.kind === 'lps'
  const facts = [tag ?? (section.group === 'type' ? null : kickerLabel(story)), sized && story.leadEligible ? sizeLabel(story.sizeUsdM) : null, stageLabel(story)].filter(Boolean)
  const more = story.coverage.length
  return (
    <li className="grid gap-x-4 border-b border-border/70 py-[7px] last:border-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-baseline">
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        title={story.summary ?? undefined}
        className="group font-news text-[16px] leading-[1.28] text-foreground"
      >
        <span className="hl"><Headline story={story} /></span>
      </a>
      {/* The trailing facts are the permalink: our page for the story. */}
      <Link
        href={`/story/${story.id}`}
        title="Summary, all coverage, and share"
        className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-ui text-[11.5px] text-muted-foreground hover:text-foreground lg:mt-0 lg:justify-end"
      >
        {facts.length > 0 && <span className="font-mono text-[10.5px] uppercase tracking-tight">{facts.join(' · ')}</span>}
        <span className="whitespace-nowrap text-foreground/65">
          {story.source}
          {more > 0 && ` +${more}`}
        </span>
      </Link>
    </li>
  )
}
