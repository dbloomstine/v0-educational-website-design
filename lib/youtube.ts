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
    videoId: "hf0gv5Qc3ig",
    title: "Neil O'Donnell & Mehak Rashid, Legal Scale: Simplicity Can Save Emerging Managers Costly Mistakes",
    thumbnail: "https://img.youtube.com/vi/hf0gv5Qc3ig/hqdefault.jpg",
    publishedAt: "2026-02-11",
    guest: {
      name: "Neil O'Donnell & Mehak Rashid",
      title: "Managing Partners",
      company: "Legal Scale",
    },
  },
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
