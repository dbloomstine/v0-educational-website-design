import type { FeedResponse, Story } from './types'

const INTEL_API_URL = process.env.INTEL_API_URL || 'https://intel.fundopshq.com'
const INTEL_API_KEY = process.env.INTEL_API_KEY || ''

export async function fetchNewsFeed(params: URLSearchParams): Promise<FeedResponse> {
  const res = await fetch(`${INTEL_API_URL}/api/news/feed?${params.toString()}`, {
    headers: { 'x-api-key': INTEL_API_KEY },
    next: { revalidate: 120 },
  })
  if (!res.ok) throw new Error('Failed to fetch news feed')
  const json = await res.json()
  return json.data
}

export async function fetchStory(id: string): Promise<Story> {
  const res = await fetch(`${INTEL_API_URL}/api/news/story?id=${id}`, {
    headers: { 'x-api-key': INTEL_API_KEY },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch story')
  const json = await res.json()
  return json.data
}
