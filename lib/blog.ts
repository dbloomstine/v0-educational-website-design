import Parser from 'rss-parser'

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

// Helper function to create slug from title and date
function createSlug(title: string, date: string): string {
  const dateStr = new Date(date).toISOString().split('T')[0] // YYYY-MM-DD
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${titleSlug}-${dateStr}`
}

// Helper function to clean Beehiiv content
function cleanContent(content: string): string {
  // Remove style tags and their content
  let cleaned = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  // Remove Beehiiv wrapper div
  cleaned = cleaned.replace(/<div class=['"]beehiiv['"]>/gi, '')
  cleaned = cleaned.replace(/<\/div>\s*$/gi, '')
  // Clean up extra whitespace
  cleaned = cleaned.trim()
  return cleaned
}

// Helper function to extract summary from content
function extractSummary(content: string): string {
  // Clean content first
  const cleaned = cleanContent(content)
  // Remove HTML tags
  const textContent = cleaned.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  // Get first 200 characters
  const summary = textContent.substring(0, 200)
  // Find last complete sentence
  const lastPeriod = summary.lastIndexOf('.')
  if (lastPeriod > 100) {
    return summary.substring(0, lastPeriod + 1)
  }
  return summary + '...'
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
      const slug = createSlug(item.title || 'untitled', date)
      const summary = item.contentSnippet || extractSummary(item.contentEncoded || item.content || '')

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
      const itemSlug = createSlug(item.title || 'untitled', date)
      return itemSlug === slug
    })

    if (!item) {
      return null
    }

    const date = item.isoDate || item.pubDate || new Date().toISOString()
    const rawContent = item.contentEncoded || item.content || ''
    const summary = item.contentSnippet || extractSummary(rawContent)

    return {
      slug,
      title: item.title || 'Untitled',
      date,
      summary,
      category: 'Fund Watch Briefing',
      content: cleanContent(rawContent),
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
