export interface YouTubeVideo {
  videoId: string
  title: string
  thumbnail: string
  publishedAt: string
}

// Manually maintained list of videos (YouTube RSS feeds are unreliable for playlists)
// Add new videos here when you publish them
const VIDEOS: YouTubeVideo[] = [
  {
    videoId: "ZZeBWwR2NOY",
    title: "How Fund Valuations Actually Work w. Monica Blocker, Houlihan Capital",
    thumbnail: "https://img.youtube.com/vi/ZZeBWwR2NOY/mqdefault.jpg",
    publishedAt: "2025-02-02",
  },
  {
    videoId: "aYOmTExZm4w",
    title: "Nick Maroules, BDO: Inside Fund Auditing, LP Transparency & ILPA Templates",
    thumbnail: "https://img.youtube.com/vi/aYOmTExZm4w/mqdefault.jpg",
    publishedAt: "2025-02-03",
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
