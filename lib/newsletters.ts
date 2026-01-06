import Parser from 'rss-parser'
import { createSlugFromTitleAndDate } from '@/lib/utils/content-slug'
import { cleanBeehiivContent, extractBeehiivSummary } from '@/lib/utils/content-clean'

// Type for RSS feed items with custom fields
interface RSSItem {
  title?: string
  link?: string
  pubDate?: string
  isoDate?: string
  contentSnippet?: string
  content?: string
  contentEncoded?: string
}

// Newsletter configurations
export const NEWSLETTERS = {
  'fundopshq-insights': {
    id: 'fundopshq-insights',
    name: 'FundOpsHQ Insights',
    author: 'Danny Bloomstine',
    description: 'Deep dives into fund operations strategy, best practices, and industry trends.',
    rssFeed: 'https://rss.beehiiv.com/feeds/4CoHL7mHHX.xml',
    subscribeUrl: 'https://dannybloomstine.beehiiv.com/',
    color: 'oklch(0.55 0.03 250)',  // Slate gray (monochrome)
  },
  'fundwatch-briefing': {
    id: 'fundwatch-briefing',
    name: 'FundWatch Briefing',
    author: 'Danny Bloomstine',
    description: 'Weekly fund operations intel. Curated industry news, regulatory updates, and actionable insights.',
    rssFeed: 'https://rss.beehiiv.com/feeds/RhLuK6Ql9l.xml',
    subscribeUrl: 'https://fundwatch-briefing.beehiiv.com/',
    color: 'oklch(0.55 0.03 250)',  // Slate gray (monochrome)
  },
} as const

export type NewsletterSlug = keyof typeof NEWSLETTERS

export interface NewsletterPost {
  slug: string
  title: string
  date: string
  summary: string
  content: string
  link: string
  newsletterSlug: NewsletterSlug
}

export interface NewsletterPostMetadata {
  slug: string
  title: string
  date: string
  summary: string
  link: string
  newsletterSlug: NewsletterSlug
}

export function getNewsletter(slug: string) {
  return NEWSLETTERS[slug as NewsletterSlug] || null
}

export function getAllNewsletters() {
  return Object.values(NEWSLETTERS)
}

export async function getNewsletterPosts(newsletterSlug: NewsletterSlug): Promise<NewsletterPostMetadata[]> {
  const newsletter = NEWSLETTERS[newsletterSlug]
  if (!newsletter) return []

  try {
    const parser = new Parser({
      customFields: {
        item: [['content:encoded', 'contentEncoded']]
      }
    })
    const feed = await parser.parseURL(newsletter.rssFeed)

    const posts = feed.items.map((item: RSSItem) => {
      const date = item.isoDate || item.pubDate || new Date().toISOString()
      const slug = createSlugFromTitleAndDate(item.title || 'untitled', date)
      const summary = item.contentSnippet || extractBeehiivSummary(item.contentEncoded || item.content || '')

      return {
        slug,
        title: item.title || 'Untitled',
        date,
        summary,
        link: item.link || '',
        newsletterSlug,
      }
    })

    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error(`Error fetching RSS feed for ${newsletterSlug}:`, error)
    return []
  }
}

export async function getNewsletterPost(newsletterSlug: NewsletterSlug, postSlug: string): Promise<NewsletterPost | null> {
  const newsletter = NEWSLETTERS[newsletterSlug]
  if (!newsletter) return null

  try {
    const parser = new Parser({
      customFields: {
        item: [['content:encoded', 'contentEncoded']]
      }
    })
    const feed = await parser.parseURL(newsletter.rssFeed)

    const item = feed.items.find((item: RSSItem) => {
      const date = item.isoDate || item.pubDate || new Date().toISOString()
      const itemSlug = createSlugFromTitleAndDate(item.title || 'untitled', date)
      return itemSlug === postSlug
    })

    if (!item) return null

    const date = item.isoDate || item.pubDate || new Date().toISOString()
    const rawContent = item.contentEncoded || item.content || ''
    const summary = item.contentSnippet || extractBeehiivSummary(rawContent)

    return {
      slug: postSlug,
      title: item.title || 'Untitled',
      date,
      summary,
      content: cleanBeehiivContent(rawContent),
      link: item.link || '',
      newsletterSlug,
    }
  } catch (error) {
    console.error(`Error fetching newsletter post:`, error)
    return null
  }
}

export async function getAllNewsletterPostSlugs(newsletterSlug: NewsletterSlug): Promise<string[]> {
  const posts = await getNewsletterPosts(newsletterSlug)
  return posts.map((post) => post.slug)
}
