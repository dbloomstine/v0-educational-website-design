export interface YouTubeVideoGuest {
  name: string
  title: string
  company: string
}

export interface YouTubeVideo {
  videoId: string
  title: string
  thumbnail: string
  publishedAt: string
  guest?: YouTubeVideoGuest
}

// Manually maintained list of videos (YouTube RSS feeds are unreliable for playlists)
// Add new videos here when you publish them
const VIDEOS: YouTubeVideo[] = [
  {
    videoId: "ZZeBWwR2NOY",
    title: "How Fund Valuations Actually Work",
    thumbnail: "https://img.youtube.com/vi/ZZeBWwR2NOY/hqdefault.jpg",
    publishedAt: "2025-02-02",
    guest: {
      name: "Monica Blocker",
      title: "Managing Director",
      company: "Houlihan Capital",
    },
  },
  {
    videoId: "aYOmTExZm4w",
    title: "Inside Fund Auditing, LP Transparency & ILPA Templates",
    thumbnail: "https://img.youtube.com/vi/aYOmTExZm4w/hqdefault.jpg",
    publishedAt: "2025-02-03",
    guest: {
      name: "Nick Maroules",
      title: "Partner",
      company: "BDO",
    },
  },
  {
    videoId: "pD45W2Zcd2M",
    title: "Navigating Real Estate Challenges with AI",
    thumbnail: "https://img.youtube.com/vi/pD45W2Zcd2M/hqdefault.jpg",
    publishedAt: "2026-01-27",
    guest: {
      name: "Marcel Kanngiesser",
      title: "Partner",
      company: "PwC",
    },
  },
]

export async function fetchPlaylistVideos(): Promise<YouTubeVideo[]> {
  // Return manually maintained list (most reliable)
  // Videos are ordered newest first
  return VIDEOS
}

// Keep RSS fetching as backup/reference (YouTube RSS is unreliable for playlists)
const PLAYLIST_ID = "PLZG9Q54lvPcZ-HOuVG61UzjoAtA8ZuewC"
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`

export async function fetchPlaylistVideosFromRSS(): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(RSS_URL, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`)
    }

    const xml = await response.text()
    return parseRSSFeed(xml)
  } catch (error) {
    console.error("Error fetching YouTube playlist:", error)
    return []
  }
}

function parseRSSFeed(xml: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = []

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entry = entryMatch[1]

    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
    const videoId = videoIdMatch?.[1]

    const titleMatch = entry.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch?.[1] || "Untitled"

    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/)
    const publishedAt = publishedMatch?.[1] || ""

    if (videoId) {
      videos.push({
        videoId,
        title: decodeHTMLEntities(title),
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        publishedAt,
      })
    }
  }

  return videos
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}
