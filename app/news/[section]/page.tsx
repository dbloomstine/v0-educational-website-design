import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { LargestCloses, LatestRail } from '@/components/home/Rail'
import { LeadStory, SectionFlag, TopStory } from '@/components/story/StoryBlocks'
import { Headline } from '@/components/story/Headline'
import { getStoriesSafe, STORY_WINDOW_DAYS } from '@/lib/news/front-page'
import { composeFrontPage, rankSection, type Story } from '@/lib/news/stories'
import { ASSET_LABEL, KIND_LABEL, SECTIONS, SECTION_BY_SLUG, sectionHref, storyInSection } from '@/lib/news/sections'
import { dayHeading, dayKey, kickerLabel, sizeLabel, stageLabel } from '@/lib/news/format'
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

  const all = await getStoriesSafe()
  const nowMs = Date.now()
  const inSection = all.filter((s) => storyInSection(s, section))
  const facets = facetsFor(section, inSection)
  const facet = facets.find((o) => o.key === f)
  const stories = facet ? inSection.filter(facet.test) : inSection

  const ranked = rankSection(stories.filter((s) => !s.roundup), nowMs)
  const lead = ranked[0] ?? null
  const top = ranked.slice(1, 5)

  // Everything, newest first, under day headings.
  const days: { key: string; heading: string; stories: Story[] }[] = []
  for (const s of stories) {
    const key = dayKey(s.firstSeen)
    const last = days[days.length - 1]
    if (last?.key === key) last.stories.push(s)
    else days.push({ key, heading: dayHeading(s.firstSeen, nowMs), stories: [s] })
  }

  const front = composeFrontPage(all, nowMs)
  const closes = composeFrontPage(inSection, nowMs)
  const showCloses = section.group === 'asset' || section.kind === 'fundraising'

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

          <div className="mt-5 grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <div className="min-w-0">
              {lead ? (
                <LeadStory story={lead} nowMs={nowMs} />
              ) : (
                <p className="font-news text-lg text-muted-foreground">
                  Nothing in the last {STORY_WINDOW_DAYS} days. The archive is at <Link href="/news" className="underline">Latest</Link>.
                </p>
              )}

              {top.length > 0 && (
                <section aria-label="More top stories" className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {top.map((s) => (
                    <TopStory key={s.id} story={s} nowMs={nowMs} />
                  ))}
                </section>
              )}

              {/* The river: every story in the section, by day */}
              {days.length > 0 && (
                <section aria-label={`All ${section.title} stories`} className="mt-9">
                  <SectionFlag
                    label={facet ? `${section.title} · ${facet.label}` : `All ${section.title.toLowerCase()} stories`}
                    note={`${stories.length} in the last ${STORY_WINDOW_DAYS} days`}
                  />
                  {days.map((day) => (
                    <div key={day.key} className="mt-3 first:mt-1">
                      <h3 className="mb-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {day.heading}
                      </h3>
                      <ul>
                        {day.stories.map((s) => (
                          <RiverRow key={s.id} story={s} section={section} />
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="mt-4 font-ui text-[12.5px] text-muted-foreground">
                    Older stories, search and filters are in the{' '}
                    <Link href="/news" className="font-semibold text-foreground/80 underline underline-offset-2">full archive</Link>.
                  </p>
                </section>
              )}
            </div>

            <aside className="min-w-0 space-y-7 lg:sticky lg:top-14 lg:self-start lg:border-l lg:border-border lg:pl-8">
              {showCloses && <LargestCloses stories={closes.largestCloses} stats={closes.stats} />}
              <LatestRail stories={front.latest.slice(0, 10)} nowMs={nowMs} />
            </aside>
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
