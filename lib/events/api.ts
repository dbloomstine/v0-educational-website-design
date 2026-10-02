import { unstable_cache } from 'next/cache'
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
  '1w': 7, // the daily email's events section (Danny, 2026-10-01: two weeks ran too long)
  '2w': 14,
  '30d': 30,
  '3m': 92,
  '6m': 183, // legacy URLs — no longer offered in the UI
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

// Per Danny (2026-08-29): the PUBLIC board is North America-only for now.
// Non-NA rows stay in the table (unlisted — direct detail URLs still work)
// so widening later is a one-line change here, not a re-scout.
const BOARD_REGION = 'north_america'

// Per-event exception to the NA scope (Danny, 2026-10-01): a row with
// `board_exception = true` is listed on the board and in the daily email even
// though its region is elsewhere. Hand-set in the database, on his say-so only
// — first use was a friend's London event. The region itself stays honest.
const BOARD_SCOPE = `region.eq.${BOARD_REGION},board_exception.eq.true`

// Per Danny (2026-09-05): the board and the daily email are IN-PERSON ONLY.
// Virtual-only events are excluded everywhere the board is read. `hybrid` is
// kept deliberately — those events DO have a live in-person component, which is
// what the rule is about; they are in-person events that happen to also stream.
// Virtual rows stay in the table (unlisted) so this is a one-line widen later,
// not a re-scout — same approach as BOARD_REGION above.
const BOARD_FORMATS = ['in_person', 'hybrid'] as const

/**
 * The feed, kept for five minutes — what pages and the board's API read.
 *
 * The board changes when the weekly scout loads events, not minute to minute,
 * but every section page asked the database for its events on every request,
 * and the board asked on every visit: 23,000 identical queries, and a page
 * that hung whenever the database was slow. Kept per set of filters; a text
 * search is not kept (there is no end to what people type) and nor is the
 * newsletter's read, which wants the table as it is at send time.
 */
export const getEventFeed = unstable_cache((params: EventQueryParams) => queryEventFeed(params), ['event-feed-v1'], {
  revalidate: 300,
  tags: ['events'],
})

export async function queryEventFeed(params: EventQueryParams): Promise<EventFeedResponse> {
  const limit = Math.min(params.limit ?? 100, 200)
  const offset = params.offset ?? 0
  const today = todayIso()

  let query = getSupabaseAdmin()
    .from('industry_events')
    .select('*')
    .eq('status', 'published')
    .or(BOARD_SCOPE)
    .in('event_format', BOARD_FORMATS)
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
    // A caller may narrow within the board scope but never widen past it.
    // If nothing they asked for is in scope (e.g. format=virtual) the result
    // is EMPTY — an empty `in` list matches no rows. Falling back to
    // BOARD_FORMATS here would answer "show me virtual events" with a full
    // page of in-person ones, which is worse than returning nothing.
    const requested = params.format.split(',').filter((f) => BOARD_FORMATS.includes(f as never))
    query = query.in('event_format', requested)
  }
  if (params.cost) {
    query = query.in('cost_type', params.cost.split(','))
  }
  // params.region is accepted but cannot widen past the NA board scope
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
    slug: row.slug,
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
    expectedAttendance: row.expected_attendance ?? null,
  }
}

/** Single event by slug — detail pages. Includes past events (archived pages stay up for SEO). */
export async function queryEventBySlug(slug: string): Promise<IndustryEvent | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('industry_events')
    .select('*')
    .eq('slug', slug)
    .neq('status', 'draft')
    .maybeSingle()

  if (error || !data) return null
  return mapRowToEvent(data)
}

/** Related events for a detail page: same city, then same topic, upcoming only. */
export async function queryRelatedEvents(event: IndustryEvent, limit = 5): Promise<IndustryEvent[]> {
  const today = todayIso()
  const related: IndustryEvent[] = []
  const seen = new Set([event.id])

  const pull = async (filter: (q: any) => any) => {
    let q = getSupabaseAdmin()
      .from('industry_events')
      .select('*')
      .eq('status', 'published')
      .or(BOARD_SCOPE)
      .in('event_format', BOARD_FORMATS)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit + 1)
    q = filter(q)
    const { data } = await q
    for (const row of data ?? []) {
      if (related.length >= limit || seen.has(row.id)) continue
      seen.add(row.id)
      related.push(mapRowToEvent(row))
    }
  }

  if (event.city) {
    await pull((q) => q.eq('city', event.city))
  }
  if (related.length < limit && event.topics.length > 0) {
    await pull((q) => q.overlaps('topics', event.topics))
  }
  if (related.length < limit) {
    await pull((q) => q.overlaps('fund_categories', event.fundCategories.length ? event.fundCategories : ['PE']))
  }
  return related
}

/** Slugs for the sitemap — board scope only (non-NA pages stay unlisted unless flagged board_exception). */
/** Every listed event's page, with when its row last changed: the sitemap's honest "last modified". */
export async function queryAllEventSlugs(): Promise<{ slug: string; startDate: string; changedAt: string | null }[]> {
  const { data } = await getSupabaseAdmin()
    .from('industry_events')
    .select('slug, start_date, created_at, updated_at, verified_at')
    .neq('status', 'draft')
    .or(BOARD_SCOPE)
    .in('event_format', BOARD_FORMATS)
    .order('start_date', { ascending: true })
    .limit(1000)
  return (data ?? []).map((r) => ({
    slug: r.slug,
    startDate: r.start_date,
    changedAt: [r.updated_at, r.verified_at, r.created_at].filter(Boolean).sort().pop() ?? null,
  }))
}

async function queryEventFacets(today: string): Promise<EventFacetCounts> {
  // Facets tally the full upcoming window (not the filtered view), matching
  // how the news feed computes its counts.
  const { data: rows } = await getSupabaseAdmin()
    .from('industry_events')
    .select('event_kind, event_format, cost_type, region, fund_categories, topics, city, ops_relevance')
    .eq('status', 'published')
    .or(BOARD_SCOPE)
    .in('event_format', BOARD_FORMATS)
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
