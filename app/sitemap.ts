import { MetadataRoute } from 'next'
import { queryAllEventSlugs } from '@/lib/events/api'
import { EVENT_COLLECTIONS } from '@/lib/events/collections'
import { SECTIONS, sectionHref } from '@/lib/news/sections'
import { getStoriesSafe } from '@/lib/news/front-page'
import { getLeagueSafe } from '@/lib/news/league-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://fundopshq.com'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/news`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/league-tables`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/events/submit`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/sponsor`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const sectionPages: MetadataRoute.Sitemap = SECTIONS.map((s) => ({
    url: `${baseUrl}${sectionHref(s.slug)}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  const collectionPages: MetadataRoute.Sitemap = EVENT_COLLECTIONS.map((c) => ({
    url: `${baseUrl}/events/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Event detail pages — the sitemap must never break the site if the DB
  // hiccups, so failures degrade to just the static + collection URLs.
  let eventPages: MetadataRoute.Sitemap = []
  try {
    const slugs = await queryAllEventSlugs()
    eventPages = slugs.map(({ slug }) => ({
      url: `${baseUrl}/events/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // degrade gracefully
  }

  // Story pages: only stories more than one outlet reported. A single-source
  // story's page adds little to the publisher's own, so it is not offered up.
  const stories = await getStoriesSafe()
  const storyPages: MetadataRoute.Sitemap = stories
    .filter((s) => !s.roundup && s.coverage.length > 0)
    .map((s) => ({
      url: `${baseUrl}/story/${s.id}`,
      lastModified: new Date(s.firstSeen),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    }))

  // Firm pages: the managers in the league table, each of which has at least a fund close to show.
  const firmSlugs = Array.from(new Set((await getLeagueSafe()).map((c) => c.firmSlug))).slice(0, 600)
  const firmPages: MetadataRoute.Sitemap = firmSlugs.map((slug) => ({
    url: `${baseUrl}/firm/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...sectionPages, ...storyPages, ...firmPages, ...collectionPages, ...eventPages]
}
