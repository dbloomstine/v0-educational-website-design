import { MetadataRoute } from 'next'
import { queryAllEventSlugs } from '@/lib/events/api'
import { EVENT_COLLECTIONS } from '@/lib/events/collections'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://fundopshq.com'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/events/submit`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

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

  return [...staticPages, ...collectionPages, ...eventPages]
}
