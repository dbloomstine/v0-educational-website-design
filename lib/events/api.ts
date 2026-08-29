import { getSupabaseAdmin } from '@/lib/supabase/client'
import type { IndustryEvent, EventFacetCounts, EventFeedResponse } from './types'

export interface EventQueryParams {
  q?: string
  when?: string
  kind?: string
  format?: string
  cost?: string
  category?: string
  topic?: string
  city?: string
  region?: string
  ops?: string
  offset?: number
  limit?: number
}

const WHEN_TO_DAYS: Record<string, number> = {
  '2w': 14,
  '30d': 30,
  '3m': 92,
  '6m': 183, // legacy URLs — no longer offered in the UI
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export async function queryEventFeed(params: EventQueryParams): Promise<EventFeedResponse> {
  const limit = Math.min(params.limit ?? 100, 200)
  const offset = params.offset ?? 0
  const today = todayIso()

  let query = getSupabaseAdmin()
    .from('industry_events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .order('name', { ascending: true })
    .range(offset, offset + limit)

  // Forward-looking window (news looks back; events look ahead)
  const days = WHEN_TO_DAYS[params.when ?? '']
  if (days) {
    const horizon = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    query = query.lte('start_date', horizon)
  }

  if (params.kind) {
    query = query.in('event_kind', params.kind.split(','))
  }
  if (params.format) {
    query = query.in('event_format', params.format.split(','))
  }
  if (params.cost) {
    query = query.in('cost_type', params.cost.split(','))
  }
  if (params.region) {
    query = query.in('region', params.region.split(','))
  }
  if (params.category) {
    query = query.overlaps('fund_categories', params.category.split(','))
  }
  if (params.topic) {
    query = query.overlaps('topics', params.topic.split(','))
  }
  if (params.city) {
    query = query.in('city', params.city.split(','))
  }
  if (params.ops === '1') {
    query = query.eq('ops_relevance', 'high')
  }
  if (params.q) {
    // Strip PostgREST or-syntax metacharacters from user input
    const q = params.q.replace(/[,()]/g, ' ').trim()
    if (q) {
      query = query.or(`name.ilike.%${q}%,organizer_name.ilike.%${q}%,city.ilike.%${q}%`)
    }
  }

  const { data: rows, error } = await query

  if (error) {
    console.error('Supabase events query error:', error)
    throw new Error('Failed to query events')
  }

  const all = (rows ?? []).map(mapRowToEvent)
  const events = all.slice(0, limit)
  const hasMore = all.length > limit

  const facets = await queryEventFacets(today)

  return { events, facets, hasMore, offset, limit }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToEvent(row: any): IndustryEvent {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    eventUrl: row.event_url,
    registrationUrl: row.registration_url,
    organizerName: row.organizer_name,
    organizerType: row.organizer_type,
    startDate: row.start_date,
    endDate: row.end_date,
    timeNote: row.time_note,
    city: row.city,
    stateRegion: row.state_region,
    country: row.country,
    venue: row.venue,
    eventFormat: row.event_format,
    eventKind: row.event_kind,
    costType: row.cost_type,
    priceNote: row.price_note,
    fundCategories: row.fund_categories ?? [],
    topics: row.topics ?? [],
    opsRelevance: row.ops_relevance,
    region: row.region,
    isFeatured: row.is_featured ?? false,
  }
}

async function queryEventFacets(today: string): Promise<EventFacetCounts> {
  // Facets tally the full upcoming window (not the filtered view), matching
  // how the news feed computes its counts.
  const { data: rows } = await getSupabaseAdmin()
    .from('industry_events')
    .select('event_kind, event_format, cost_type, region, fund_categories, topics, city, ops_relevance')
    .eq('status', 'published')
    .gte('start_date', today)

  const kinds: Record<string, number> = {}
  const formats: Record<string, number> = {}
  const costs: Record<string, number> = {}
  const regions: Record<string, number> = {}
  const categories: Record<string, number> = {}
  const topics: Record<string, number> = {}
  const cities: Record<string, number> = {}
  let opsHighCount = 0

  for (const row of rows ?? []) {
    if (row.event_kind) kinds[row.event_kind] = (kinds[row.event_kind] ?? 0) + 1
    if (row.event_format) formats[row.event_format] = (formats[row.event_format] ?? 0) + 1
    if (row.cost_type) costs[row.cost_type] = (costs[row.cost_type] ?? 0) + 1
    if (row.region) regions[row.region] = (regions[row.region] ?? 0) + 1
    for (const cat of (row.fund_categories as string[]) ?? []) {
      categories[cat] = (categories[cat] ?? 0) + 1
    }
    for (const t of (row.topics as string[]) ?? []) {
      topics[t] = (topics[t] ?? 0) + 1
    }
    if (row.city) cities[row.city] = (cities[row.city] ?? 0) + 1
    if (row.ops_relevance === 'high') opsHighCount++
  }

  return {
    kinds,
    formats,
    costs,
    regions,
    categories,
    topics,
    cities,
    opsHighCount,
    totalUpcoming: rows?.length ?? 0,
  }
}
