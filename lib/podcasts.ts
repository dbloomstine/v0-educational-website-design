import Parser from 'rss-parser'

// Podcast platform configurations
export const PODCAST_PLATFORMS = {
  apple: {
    name: 'Apple Podcasts',
    url: 'https://podcasts.apple.com/gb/podcast/danny-bloomstine-read-by-voice-ai/id1832559968',
    icon: 'apple',
    color: '#A855F7', // Purple
  },
  spotify: {
    name: 'Spotify',
    url: 'https://open.spotify.com/show/6npAofBIOwvsPYhx0Iz0pZ',
    icon: 'spotify',
    color: '#22C55E', // Green
  },
  youtube: {
    name: 'YouTube',
    url: 'https://www.youtube.com/@dbloomstine',
    icon: 'youtube',
    color: '#EF4444', // Red
  },
} as const

export type PodcastPlatform = keyof typeof PODCAST_PLATFORMS

// RSS feed for fetching episode data (Apple Podcasts RSS)
// Note: This is the Beehiiv-generated podcast feed
const PODCAST_RSS_FEED = 'https://rss.beehiiv.com/feeds/4CoHL7mHHX.xml'

export interface PodcastEpisode {
  title: string
  date: string
  duration?: string
  description?: string
  audioUrl?: string
  link?: string
}

export interface AudioLinks {
  apple?: string
  spotify?: string
  youtube?: string
}

// Normalize title for matching (removes special chars, lowercase, trim)
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Cache for podcast episodes
let episodeCache: PodcastEpisode[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

/**
 * Fetch all podcast episodes from the RSS feed
 */
export async function getPodcastEpisodes(): Promise<PodcastEpisode[]> {
  // Return cached data if still valid
  if (episodeCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return episodeCache
  }

  try {
    const parser = new Parser({
      customFields: {
        item: [
          ['itunes:duration', 'duration'],
          ['enclosure', 'enclosure'],
        ]
      }
    })

    const feed = await parser.parseURL(PODCAST_RSS_FEED)

    const episodes = feed.items.map((item: any) => ({
      title: item.title || 'Untitled',
      date: item.isoDate || item.pubDate || new Date().toISOString(),
      duration: item.duration || undefined,
      description: item.contentSnippet || item.description || undefined,
      audioUrl: item.enclosure?.url || undefined,
      link: item.link || undefined,
    }))

    // Update cache
    episodeCache = episodes
    cacheTimestamp = Date.now()

    return episodes
  } catch (error) {
    console.error('Error fetching podcast RSS feed:', error)
    return episodeCache || []
  }
}

/**
 * Find audio links for a specific article by title
 * Returns platform links if a matching episode is found
 */
export async function getAudioForArticle(articleTitle: string): Promise<AudioLinks | null> {
  const episodes = await getPodcastEpisodes()
  const normalizedArticleTitle = normalizeTitle(articleTitle)

  // Find episode with matching title
  const matchingEpisode = episodes.find(episode => {
    const normalizedEpisodeTitle = normalizeTitle(episode.title)
    return normalizedEpisodeTitle === normalizedArticleTitle ||
           normalizedEpisodeTitle.includes(normalizedArticleTitle) ||
           normalizedArticleTitle.includes(normalizedEpisodeTitle)
  })

  if (!matchingEpisode) {
    return null
  }

  // Return links to all platforms
  // Note: These are show-level links since Beehiiv doesn't provide per-episode deep links
  return {
    apple: PODCAST_PLATFORMS.apple.url,
    spotify: PODCAST_PLATFORMS.spotify.url,
    youtube: PODCAST_PLATFORMS.youtube.url,
  }
}

/**
 * Check if an article has an audio version available
 */
export async function hasAudioVersion(articleTitle: string): Promise<boolean> {
  const audioLinks = await getAudioForArticle(articleTitle)
  return audioLinks !== null
}

/**
 * Get all podcast platform info for display
 */
export function getAllPlatforms() {
  return Object.entries(PODCAST_PLATFORMS).map(([key, platform]) => ({
    id: key as PodcastPlatform,
    ...platform,
  }))
}
