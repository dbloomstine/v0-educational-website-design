import Parser from 'rss-parser'
import { createSlugFromTitleAndDate } from '@/lib/utils/content-slug'
import { cleanBeehiivContent, extractBeehiivSummary } from '@/lib/utils/content-clean'

const BEEHIIV_RSS_FEED = 'https://rss.beehiiv.com/feeds/RhLuK6Ql9l.xml'

export interface BlogPost {
  slug: string
  title: string
  date: string
  summary: string
  category?: string
  content: string
  link: string
}

export interface BlogPostMetadata {
  slug: string
  title: string
  date: string
  summary: string
  category?: string
  link: string
}

export async function getAllBlogPosts(): Promise<BlogPostMetadata[]> {
  try {
    const parser = new Parser({
      customFields: {
        item: [['content:encoded', 'contentEncoded']]
      }
    })
    const feed = await parser.parseURL(BEEHIIV_RSS_FEED)

    const posts = feed.items.map((item: any) => {
      const date = item.isoDate || item.pubDate || new Date().toISOString()
      const slug = createSlugFromTitleAndDate(item.title || 'untitled', date)
      const summary = item.contentSnippet || extractBeehiivSummary(item.contentEncoded || item.content || '')

      return {
        slug,
        title: item.title || 'Untitled',
        date,
        summary,
        category: 'FundWatch Briefing',
        link: item.link || '',
      }
    })

    // Sort by date (newest first)
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error fetching RSS feed:', error)
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const parser = new Parser({
      customFields: {
        item: [['content:encoded', 'contentEncoded']]
      }
    })
    const feed = await parser.parseURL(BEEHIIV_RSS_FEED)

    const item = feed.items.find((item: any) => {
      const date = item.isoDate || item.pubDate || new Date().toISOString()
      const itemSlug = createSlugFromTitleAndDate(item.title || 'untitled', date)
      return itemSlug === slug
    })

    if (!item) {
      return null
    }

    const date = item.isoDate || item.pubDate || new Date().toISOString()
    const rawContent = item.contentEncoded || item.content || ''
    const summary = item.contentSnippet || extractBeehiivSummary(rawContent)

    return {
      slug,
      title: item.title || 'Untitled',
      date,
      summary,
      category: 'Fund Watch Briefing',
      content: cleanBeehiivContent(rawContent),
      link: item.link || '',
    }
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function getAllBlogSlugs(): Promise<string[]> {
  try {
    const posts = await getAllBlogPosts()
    return posts.map((post) => post.slug)
  } catch (error) {
    console.error('Error fetching blog slugs:', error)
    return []
  }
}
