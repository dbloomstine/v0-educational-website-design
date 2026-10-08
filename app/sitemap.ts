import { MetadataRoute } from 'next'
import { queryAllEventSlugs } from '@/lib/events/api'
import { EVENT_COLLECTIONS } from '@/lib/events/collections'
import { SECTIONS, sectionHref, storyInSection } from '@/lib/news/sections'
import { loadArchive, loadStories } from '@/lib/news/front-page'
import { firmIndex } from '@/lib/news/firms'
import { loadLeague } from '@/lib/news/league-data'
import { archiveHref, loadArchiveSpan, loadSitemapStories, monthsBetween, type ArchiveSpan, type SitemapStory } from '@/lib/news/archive'

/**
 * The sitemap, with HONEST dates.
 *
 * Until 2026-10-02 every URL here said it was last modified "now", and the
 * sitemap is rebuilt every ten minutes: 1,300 firm and event pages, all
 * claiming to have changed in the last ten minutes, every time a crawler
 * looked. They believed it. Several times a night a crawler re-fetched six or
 * seven hundred firm pages in ten minutes; on the evening this was written,
 * four thousand in twenty-five. Each fetch of a page not already built is two
 * or three database queries.
 *
 * A page's date is now the date its content last changed: a firm's newest
 * story or close, an event's last edit, a section's newest story. Pages that
 * do not change (about, terms) carry no date at all.
 */
const at = (iso: string | null | undefined): Date | undefined => {
  if (!iso) return undefined
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://fundopshq.com'

  const stories = await loadStories()
  // Stories arrive newest first: the front page and Latest changed when the newest one did.
  const newest = at(stories[0]?.firstSeen)

  // Event detail pages — the sitemap must never break the site if the DB
  // hiccups, so failures degrade to just the static + collection URLs.
  let events: { slug: string; changedAt: string | null }[] = []
  try {
    events = await queryAllEventSlugs()
  } catch {
    // degrade gracefully
  }
  const newestEvent = at(events.map((e) => e.changedAt).filter(Boolean).sort().pop())

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: newest, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/news`, lastModified: newest, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/league-tables`, lastModified: newest, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/firms`, lastModified: newest, changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/events`, lastModified: newestEvent, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/events/submit`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/sponsor`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const sectionPages: MetadataRoute.Sitemap = SECTIONS.map((s) => ({
    url: `${baseUrl}${sectionHref(s.slug)}`,
    // A section changed when its newest story arrived.
    lastModified: at(stories.find((story) => storyInSection(story, s))?.firstSeen),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  const collectionPages: MetadataRoute.Sitemap = EVENT_COLLECTIONS.map((c) => ({
    url: `${baseUrl}/events/${c.slug}`,
    lastModified: newestEvent,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const eventPages: MetadataRoute.Sitemap = events.map(({ slug, changedAt }) => ({
    url: `${baseUrl}/events/${slug}`,
    lastModified: at(changedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Story pages: only stories more than one outlet reported. A single-source
  // story's page adds little to the publisher's own, so it is not offered up.
  const storyPages: MetadataRoute.Sitemap = stories
    .filter((s) => !s.roundup && s.coverage.length > 0)
    .map((s) => ({
      url: `${baseUrl}/story/${s.id}`,
      lastModified: at(s.firstSeen),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    }))

  // The archive and its stories (lib/news/archive.ts): every story with a
  // fuller summary, newest first and capped, however old. One bounded query, an
  // hour in the data cache. The sitemap must not break if it fails, so the
  // archive is simply left out until the next build.
  let written: SitemapStory[] = []
  let span: ArchiveSpan | null = null
  try {
    ;[written, span] = await Promise.all([loadSitemapStories(), loadArchiveSpan()])
  } catch (err) {
    console.error('[sitemap] the archive could not be read, leaving it out:', err)
  }
  const onPage = new Set(storyPages.map((p) => p.url))
  const writtenPages: MetadataRoute.Sitemap = written
    .filter((s) => !onPage.has(`${baseUrl}/story/${s.id}`))
    .map((s) => ({
      url: `${baseUrl}/story/${s.id}`,
      // When the fuller summary was written; otherwise the day it was published.
      lastModified: at(s.at ?? s.date),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  // A month page changed when its newest story arrived. A month older than the
  // cap reaches carries no date rather than a guessed one.
  const newestByMonth = new Map<string, string>()
  for (const s of written) if (s.date > (newestByMonth.get(s.date.slice(0, 7)) ?? '')) newestByMonth.set(s.date.slice(0, 7), s.date)
  const archivePages: MetadataRoute.Sitemap = span
    ? [
        { url: `${baseUrl}/archive`, lastModified: at(span.newestDay), changeFrequency: 'daily' as const, priority: 0.6 },
        ...monthsBetween(span.first, span.last).map((m) => ({
          url: `${baseUrl}${archiveHref(m)}`,
          lastModified: at(newestByMonth.get(m)),
          changeFrequency: m === span!.last ? ('daily' as const) : ('monthly' as const),
          priority: 0.5,
        })),
      ]
    : []

  // Firm pages: the managers in the league table, each of which has at least a
  // fund close to show, and the firms with more than one story this month.
  // Each is dated by its newest story or close.
  const lastChange = new Map<string, string>()
  const note = (slug: string, date: string | null | undefined) => {
    if (date && date > (lastChange.get(slug) ?? '')) lastChange.set(slug, date)
  }
  const active = firmIndex(await loadArchive()).filter((f) => f.stories >= 2)
  for (const f of active) note(f.slug, f.lastSeen)
  const league = await loadLeague()
  for (const c of league) note(c.firmSlug, c.date)
  const firmSlugs = Array.from(new Set([...league.map((c) => c.firmSlug), ...active.map((f) => f.slug)])).slice(0, 900)
  const firmPages: MetadataRoute.Sitemap = firmSlugs.map((slug) => ({
    url: `${baseUrl}/firm/${slug}`,
    lastModified: at(lastChange.get(slug)),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...sectionPages, ...storyPages, ...archivePages, ...writtenPages, ...firmPages, ...collectionPages, ...eventPages]
}
