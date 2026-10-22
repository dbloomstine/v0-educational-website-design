import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import type { IndustryEvent, EventFacetCounts, EventFeedResponse } from './types'
import { SIMILAR_MAX, pickSimilarEvents } from './similar'
import { isEventAudience, lpAudienceFilter } from './audience'
import { LANE_FORMAT_SCOPE, formatScopeFor, fundAdminGuardFilter, inDefaultView, isHiddenFundAdminEvent, requestedFormats } from './webinars'

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
  /** Who the event is for: `lp` (lib/events/audience.ts). Unknown values are ignored. */
  audience?: string
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

// Formats (Danny, 2026-09-05; 2026-10-13; 2026-10-22). The board's default view and the daily email are in-person
// and hybrid (hybrid has a live room; that is what the rule was about), plus a virtual event its organizer submitted.
// Since 2026-10-22 a read that ASKS for virtual events (`?format=virtual`: the Virtual chip, /events/webinars, the
// calendar feed) lists every virtual event, scouted ones too: the webinars lane. The rule and its scopes live in
// ./webinars, with the fund-administrator guard every listing read carries (Danny, 2026-10-22: never list their
// webinars). Virtual rows were never deleted, so the lane needed no re-scout.
const FUND_ADMIN_GUARD = fundAdminGuardFilter()

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
    // `count`: how many match in all, so the board can say "42 events" (2026-10-22); the table is a few hundred rows.
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .or(BOARD_SCOPE)
    .or(formatScopeFor(params.format))
    .or(FUND_ADMIN_GUARD)
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
    // A caller narrows to the formats it names. If none of them is a format
    // (e.g. format=online) the result is EMPTY — an empty `in` list matches no
    // rows. Falling back to every format here would answer a format we do not
    // have with a full page of in-person events, which is worse than nothing.
    // `virtual` may be asked for since 2026-10-13; since 2026-10-22 asking for it opens the webinars lane (above).
    query = query.in('event_format', requestedFormats(params.format))
  }
  if (params.cost) {
    query = query.or(costFilter(params.cost))
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
  if (isEventAudience(params.audience)) {
    query = query.or(lpAudienceFilter())
  }
  if (params.q) {
    // Strip PostgREST or-syntax metacharacters from user input
    const q = params.q.replace(/[,()]/g, ' ').trim()
    if (q) {
      query = query.or(`name.ilike.%${q}%,organizer_name.ilike.%${q}%,city.ilike.%${q}%`)
    }
  }

  const { data: rows, error, count } = await query

  if (error) {
    console.error('Supabase events query error:', error)
    throw new Error('Failed to query events')
  }

  // The guard again in JavaScript, for safety: the read above already left these out, so this drops nothing
  // unless the two ever disagree (they are tested on the same names).
  const all = (rows ?? []).map(mapRowToEvent).filter((e) => !isHiddenFundAdminEvent(e))
  const events = all.slice(0, limit)
  const hasMore = all.length > limit

  const facets = await queryEventFacets(today)

  return { events, facets, hasMore, offset, limit, total: count ?? null }
}

const COST_TYPES = ['free', 'paid', 'member_only', 'invite_only', 'mixed']

/**
 * The PostgREST `or` filter for `?cost=` (2026-10-15). "free" means free AND checked on the registration page
 * (cost_verified): an unchecked "free" is not called free anywhere, so it must not answer the Free filter or
 * the /events/free page either. Unknown values are dropped; nothing known left means no rows, not every row.
 */
export function costFilter(cost: string): string {
  const asked = cost.split(',').filter((c) => COST_TYPES.includes(c))
  const parts = asked.map((c) => (c === 'free' ? 'and(cost_type.eq.free,cost_verified.is.true)' : `cost_type.eq.${c}`))
  // 'none' is not a cost_type (the column's check forbids it), so an empty ask matches nothing.
  return parts.length ? parts.join(',') : 'cost_type.eq.none'
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
    costVerified: row.cost_verified ?? false,
    fundCategories: row.fund_categories ?? [],
    topics: row.topics ?? [],
    opsRelevance: row.ops_relevance,
    region: row.region,
    isFeatured: row.is_featured ?? false,
    expectedAttendance: row.expected_attendance ?? null,
    isSubmitted: row.is_submitted ?? false,
    status: row.status ?? 'published',
  }
}

/**
 * Single event by slug — detail pages and the one-event .ics. Includes past events (archived pages stay up for
 * SEO). A fund administrator's webinar is null here, so its page is a 404 (Danny, 2026-10-22: never listed).
 */
export async function queryEventBySlug(slug: string): Promise<IndustryEvent | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('industry_events')
    .select('*')
    .eq('slug', slug)
    .neq('status', 'draft')
    .maybeSingle()

  if (error || !data) return null
  const event = mapRowToEvent(data)
  return isHiddenFundAdminEvent(event) ? null : event
}

/**
 * "Similar events" for a detail page (2026-10-22): a few upcoming events from the same city, the same topics
 * and the same asset classes, fetched side by side (each a small, index-ordered read of the board scope), then
 * ranked by pickSimilarEvents (lib/events/similar.ts). Was three sequential reads taking the first five found.
 * A webinar's page reads the webinars lane (2026-10-22), so other webinars can be its similar events; every other
 * page keeps the board's scope.
 */
export async function queryRelatedEvents(event: IndustryEvent, limit = SIMILAR_MAX): Promise<IndustryEvent[]> {
  const today = todayIso()
  const upcoming = () =>
    getSupabaseAdmin()
      .from('industry_events')
      .select('*')
      .eq('status', 'published')
      .or(BOARD_SCOPE)
      .or(formatScopeFor(event.eventFormat))
      .or(FUND_ADMIN_GUARD)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(15)

  const reads = [
    event.city ? upcoming().eq('city', event.city) : null,
    event.topics.length > 0 ? upcoming().overlaps('topics', event.topics) : null,
    upcoming().overlaps('fund_categories', event.fundCategories.length ? event.fundCategories : ['PE']),
  ].filter((q): q is NonNullable<typeof q> => q !== null)

  const results = await Promise.all(reads)
  const candidates = results.flatMap((r) => (r.data ?? []).map(mapRowToEvent))
  return pickSimilarEvents(event, candidates, today, limit)
}

/** The organizer's upcoming events, for a past event's "next edition" link. Board scope; a handful, soonest first. */
export async function queryOrganizerUpcoming(event: IndustryEvent): Promise<IndustryEvent[]> {
  const { data } = await getSupabaseAdmin()
    .from('industry_events')
    .select('*')
    .eq('status', 'published')
    .eq('organizer_name', event.organizerName)
    .or(BOARD_SCOPE)
    .or(formatScopeFor(event.eventFormat))
    .or(FUND_ADMIN_GUARD)
    .gte('start_date', todayIso())
    .order('start_date', { ascending: true })
    .limit(25)
  return (data ?? []).map(mapRowToEvent)
}

/**
 * Every listed event's page, with when its row last changed: the sitemap's honest "last modified". Board region
 * only (non-NA pages stay unlisted unless flagged board_exception). Webinars are in it since 2026-10-22 (each is a
 * page people search), except past ones, whose pages are noindex (isPastVirtualEvent), and never a fund
 * administrator's.
 */
export async function queryAllEventSlugs(): Promise<{ slug: string; startDate: string; changedAt: string | null }[]> {
  const today = todayIso()
  const { data } = await getSupabaseAdmin()
    .from('industry_events')
    .select('slug, start_date, created_at, updated_at, verified_at')
    .neq('status', 'draft')
    .or(BOARD_SCOPE)
    .or(LANE_FORMAT_SCOPE)
    .or(FUND_ADMIN_GUARD)
    .or(`event_format.neq.virtual,start_date.gte.${today},end_date.gte.${today}`)
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
  // how the news feed computes its counts. Read across the webinars lane
  // (2026-10-22) so the Virtual chip counts every webinar it would list; every
  // other count, and the total, stays the board's default view.
  const { data: rows } = await getSupabaseAdmin()
    .from('industry_events')
    .select('event_kind, event_format, cost_type, cost_verified, region, fund_categories, topics, city, ops_relevance, is_submitted')
    .eq('status', 'published')
    .or(BOARD_SCOPE)
    .or(LANE_FORMAT_SCOPE)
    .or(FUND_ADMIN_GUARD)
    .gte('start_date', today)

  const kinds: Record<string, number> = {}
  const formats: Record<string, number> = {}
  const costs: Record<string, number> = {}
  const regions: Record<string, number> = {}
  const categories: Record<string, number> = {}
  const topics: Record<string, number> = {}
  const cities: Record<string, number> = {}
  let opsHighCount = 0
  let totalUpcoming = 0

  for (const row of rows ?? []) {
    if (row.event_format) formats[row.event_format] = (formats[row.event_format] ?? 0) + 1
    // A scouted webinar is in the lane, not the default view: it counts toward the Virtual chip only.
    if (!inDefaultView(row)) continue
    totalUpcoming++
    if (row.event_kind) kinds[row.event_kind] = (kinds[row.event_kind] ?? 0) + 1
    // "Free" counts only the free events we checked, as the filter and the labels do.
    if (row.cost_type && (row.cost_type !== 'free' || row.cost_verified)) costs[row.cost_type] = (costs[row.cost_type] ?? 0) + 1
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
    totalUpcoming,
  }
}

