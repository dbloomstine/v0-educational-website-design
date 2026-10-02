'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2, SlidersHorizontal, CalendarPlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EventRow } from './EventRow'
import {
  EVENT_KIND_LABELS,
  EVENT_FORMAT_LABELS,
  EVENT_ASSET_CLASSES,
  EVENT_TOPIC_LABELS,
  formatEventDayHeading,
} from '@/lib/events/constants'
import type { EventFeedResponse, IndustryEvent, EventFacetCounts } from '@/lib/events/types'

// ── Filter constants ──────────────────────────────────────────────

const WHEN_RANGES = [
  { label: '2w', value: '2w' },
  { label: '30d', value: '30d' },
  { label: '3m', value: '3m' },
  { label: 'All', value: '' },
] as const

const TOPIC_OPTIONS = Object.entries(EVENT_TOPIC_LABELS).map(([value, label]) => ({ value, label }))

// How many city pills to show — the facet drives which ones (top by count)
const CITY_PILL_LIMIT = 12

const KIND_OPTIONS = Object.entries(EVENT_KIND_LABELS)
  .filter(([value]) => value !== 'other')
  .map(([value, { label }]) => ({ value, label }))

const FORMAT_OPTIONS = Object.entries(EVENT_FORMAT_LABELS).map(([value, label]) => ({ value, label }))

const COST_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'member_only', label: 'Members Only' },
  { value: 'invite_only', label: 'Invite Only' },
] as const

const PAGE_SIZE = 100

/** How long to wait for the list before saying so. Without it a stalled request left the skeleton up for minutes. */
const FETCH_TIMEOUT_MS = 12_000

const FILTER_KEYS = ['q', 'when', 'kind', 'format', 'cost', 'category', 'topic', 'city', 'ops'] as const

// useLayoutEffect warns when a client component renders on the server; there it has nothing to do.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Multi-select helpers for comma-separated filter strings (same idiom as NewsFeed)
function toggleFilter(current: string, value: string): string {
  const values = current ? current.split(',') : []
  const idx = values.indexOf(value)
  if (idx >= 0) {
    values.splice(idx, 1)
  } else {
    values.push(value)
  }
  return values.join(',')
}

function hasFilter(current: string, value: string): boolean {
  if (!current) return false
  return current.split(',').includes(value)
}

// ── Component ─────────────────────────────────────────────────────

/**
 * `initial` is the unfiltered board, fetched on the server with the page. With
 * it the page arrives with its events in it: nothing to wait for, and nothing
 * to go wrong, on the plain /events URL. A request is made only when a filter
 * is set — including one in the URL the page was opened with, which is read
 * after mount (reading it during render would keep the whole board out of the
 * server's HTML).
 */
export function EventsBoard({ initial }: { initial?: EventFeedResponse | null }) {
  const pathname = usePathname()

  // Filter state. Starts empty and takes the URL's filters on mount.
  const [query, setQuery] = useState('')
  const [when, setWhen] = useState('')
  const [kind, setKind] = useState('')
  const [format, setFormat] = useState('')
  const [cost, setCost] = useState('')
  const [category, setCategory] = useState('')
  const [topic, setTopic] = useState('')
  const [city, setCity] = useState('')
  const [opsOnly, setOpsOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Data state
  const [events, setEvents] = useState<IndustryEvent[]>(initial?.events ?? [])
  const [facets, setFacets] = useState<EventFacetCounts | null>(initial?.facets ?? null)
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? false)
  const [offset, setOffset] = useState(initial ? initial.offset + initial.limit : 0)
  const [loading, setLoading] = useState(!initial)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  // Search debounce
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  /** False until the URL's filters have been read: the first fetch waits for them. */
  const [ready, setReady] = useState(false)
  /** The server's copy answers the first, unfiltered view. */
  const useInitial = useRef(Boolean(initial))
  const latestRequest = useRef(0)

  // The URL the page was opened with may carry filters (/events?city=Boston).
  useBeforePaint(() => {
    const params = new URLSearchParams(window.location.search)
    if (FILTER_KEYS.some((k) => params.get(k))) {
      // Not the unfiltered board: show the skeleton, not the server's copy, while the right list loads.
      useInitial.current = false
      setLoading(true)
      setQuery(params.get('q') || '')
      setSearchInput(params.get('q') || '')
      setWhen(params.get('when') || '')
      setKind(params.get('kind') || '')
      setFormat(params.get('format') || '')
      setCost(params.get('cost') || '')
      setCategory(params.get('category') || '')
      setTopic(params.get('topic') || '')
      setCity(params.get('city') || '')
      setOpsOnly(params.get('ops') === '1')
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeFilterCount = [query, kind, format, cost, category, topic, city, opsOnly, when !== ''].filter(Boolean).length
  const pillFilterCount = [kind, format, cost, category, topic, city, opsOnly].filter(Boolean).length

  const buildParams = useCallback(
    (newOffset = 0) => {
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(newOffset))
      if (query) params.set('q', query)
      if (when) params.set('when', when)
      if (kind) params.set('kind', kind)
      if (format) params.set('format', format)
      if (cost) params.set('cost', cost)
      if (category) params.set('category', category)
      if (topic) params.set('topic', topic)
      if (city) params.set('city', city)
      if (opsOnly) params.set('ops', '1')
      return params
    },
    [query, when, kind, format, cost, category, topic, city, opsOnly]
  )

  // Sync URL — default values are omitted so the bare /events URL stays clean
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (when) params.set('when', when)
    if (kind) params.set('kind', kind)
    if (format) params.set('format', format)
    if (cost) params.set('cost', cost)
    if (category) params.set('category', category)
    if (topic) params.set('topic', topic)
    if (city) params.set('city', city)
    if (opsOnly) params.set('ops', '1')
    const qs = params.toString()
    const base = pathname || '/events'
    // The address bar only: router.replace would ask the server for the page
    // again — and the page now carries a hundred events — on every filter click.
    window.history.replaceState(null, '', qs ? `${base}?${qs}` : base)
  }, [pathname, query, when, kind, format, cost, category, topic, city, opsOnly])

  const fetchFeed = useCallback(
    async (newOffset = 0, append = false) => {
      const request = ++latestRequest.current
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      try {
        const params = buildParams(newOffset)
        const res = await fetch(`/api/events/feed?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`feed responded ${res.status}`)
        const json = await res.json()
        const data: EventFeedResponse = json.data
        // A slower, older request must not overwrite a newer one's list.
        if (request !== latestRequest.current) return

        if (append) {
          setEvents((prev) => [...prev, ...data.events])
        } else {
          setEvents(data.events)
          setFacets(data.facets)
        }
        setHasMore(data.hasMore)
        setOffset(data.offset + data.limit)
        setFailed(false)
      } catch (err) {
        if (request !== latestRequest.current) return
        console.error('Failed to fetch events feed:', err)
        setFailed(true)
      } finally {
        clearTimeout(timer)
        if (request === latestRequest.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [buildParams]
  )

  useEffect(() => {
    if (!ready) return
    // The unfiltered first view is already here, from the server.
    if (useInitial.current) {
      useInitial.current = false
      return
    }
    fetchFeed(0, false)
    syncUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, query, when, kind, format, cost, category, topic, city, opsOnly])


  const clearFilters = () => {
    setSearchInput('')
    setQuery('')
    setWhen('')
    setKind('')
    setFormat('')
    setCost('')
    setCategory('')
    setTopic('')
    setCity('')
    setOpsOnly(false)
  }

  // Top cities by upcoming-event count, from the live facets. A selected city
  // always stays visible even if it drops out of the top N.
  const cityOptions = (() => {
    const entries = Object.entries(facets?.cities ?? {}).sort((a, b) => b[1] - a[1])
    const top = entries.slice(0, CITY_PILL_LIMIT)
    for (const selected of city ? city.split(',') : []) {
      if (!top.some(([name]) => name === selected)) {
        top.push([selected, facets?.cities[selected] ?? 0])
      }
    }
    return top
  })()

  const loadMore = () => {
    fetchFeed(offset, true)
  }

  // Grouped by DAY, matching the daily email and the homepage rail. Day
  // headings supersede the old month/week split: they are finer than the trip
  // view's week grouping, so "what can I hit in one trip" still reads off
  // consecutive headings.
  const monthGroups: { header: string; events: IndustryEvent[] }[] = []
  for (const event of events) {
    const header = formatEventDayHeading(event.startDate)
    const last = monthGroups[monthGroups.length - 1]
    if (last && last.header === header) {
      last.events.push(event)
    } else {
      monthGroups.push({ header, events: [event] })
    }
  }

  // Subscribable calendar feed for the current filter view
  const [feedCopied, setFeedCopied] = useState(false)
  const copyCalendarFeed = () => {
    const params = new URLSearchParams()
    if (kind) params.set('kind', kind)
    if (format) params.set('format', format)
    if (cost) params.set('cost', cost)
    if (category) params.set('category', category)
    if (topic) params.set('topic', topic)
    if (city) params.set('city', city)
    if (opsOnly) params.set('ops', '1')
    const qs = params.toString()
    const url = `webcal://${window.location.host}/api/events/calendar${qs ? `?${qs}` : ''}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setFeedCopied(true)
        setTimeout(() => setFeedCopied(false), 2500)
      })
      .catch(() => {})
  }

  const whenControl = (
    <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
      {WHEN_RANGES.map((range) => (
        <button
          key={range.label}
          onClick={() => setWhen(range.value)}
          className={cn(
            'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            when === range.value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-2">
      {/* ── Compact toolbar ──────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events, organizers, cities..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setQuery('') }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Time horizon — hidden on mobile, shown inline on desktop */}
          <div className="hidden sm:block">{whenControl}</div>

          {/* Ops-focused toggle */}
          <button
            onClick={() => setOpsOnly(!opsOnly)}
            title="Only events squarely aimed at fund operations, finance, compliance, and legal teams"
            className={cn(
              'hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors shrink-0',
              opsOnly
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/50'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            )}
          >
            Ops-Focused
          </button>

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors shrink-0',
              filtersOpen || pillFilterCount > 0
                ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span className="hidden sm:inline">Filters</span>
            {pillFilterCount > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 text-[9px] text-white">{pillFilterCount}</span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Row 2: time horizon + ops toggle on mobile only */}
        <div className="flex sm:hidden items-center gap-2">
          {whenControl}
          <button
            onClick={() => setOpsOnly(!opsOnly)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
              opsOnly
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/50'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            )}
          >
            Ops-Focused
          </button>
        </div>
      </div>

      {/* ── Collapsible filter panel ─────────────────────────── */}
      {filtersOpen && (
        <div className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
          {/* Event type pills */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Event Type</span>
            <div className="flex flex-wrap gap-1">
              {KIND_OPTIONS.map((opt) => {
                const count = facets?.kinds[opt.value] ?? 0
                return (
                  <button
                    key={opt.value}
                    onClick={() => setKind(toggleFilter(kind, opt.value))}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                      hasFilter(kind, opt.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cost + format pills */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Cost</span>
              <div className="flex flex-wrap gap-1">
                {COST_OPTIONS.map((opt) => {
                  const count = facets?.costs[opt.value] ?? 0
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setCost(toggleFilter(cost, opt.value))}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                        hasFilter(cost, opt.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Format</span>
              <div className="flex flex-wrap gap-1">
                {FORMAT_OPTIONS.map((opt) => {
                  const count = facets?.formats[opt.value] ?? 0
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFormat(toggleFilter(format, opt.value))}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                        hasFilter(format, opt.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* City pills — dynamic, driven by upcoming-event counts */}
          {cityOptions.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">City</span>
              <div className="flex flex-wrap gap-1">
                {cityOptions.map(([name, count]) => (
                  <button
                    key={name}
                    onClick={() => setCity(toggleFilter(city, name))}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                      hasFilter(city, name)
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topic pills — functional area, orthogonal to asset class */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Topic</span>
            <div className="flex flex-wrap gap-1">
              {TOPIC_OPTIONS.map((opt) => {
                const count = facets?.topics[opt.value] ?? 0
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTopic(toggleFilter(topic, opt.value))}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                      hasFilter(topic, opt.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Asset class pills */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Asset Class</span>
            <div className="flex flex-wrap gap-1">
              {EVENT_ASSET_CLASSES.map((cat) => {
                const count = facets?.categories[cat.value] ?? 0
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(toggleFilter(category, cat.value))}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                      hasFilter(category, cat.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Region pills removed 2026-08-29 — the board is North America-only
              for now (enforced in lib/events/api.ts BOARD_REGION) */}
        </div>
      )}

      {/* ── Utility row: calendar feed + submit ──────────────── */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={copyCalendarFeed}
          title="Copies a webcal:// URL for this filtered view — paste it into Google/Outlook/Apple Calendar under 'subscribe from URL' and new events appear automatically"
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {feedCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <CalendarPlus className="h-3 w-3" />}
          {feedCopied ? 'Feed URL copied' : 'Subscribe to this view'}
        </button>
        <Link href="/events/submit" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          Submit an event
        </Link>
      </div>

      {/* ── Events list ──────────────────────────────────────── */}
      {failed && !loading && (
        <div role="status" className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 border border-border bg-card px-3 py-2 font-ui text-[13px] text-foreground">
          <span>{events.length > 0 ? 'Couldn’t refresh the list just now — showing what loaded last.' : 'Couldn’t load the events just now.'}</span>
          <button onClick={() => fetchFeed(0, false)} className="font-bold underline underline-offset-4 hover:no-underline">
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : events.length === 0 && failed ? null : events.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No events found matching your filters.</p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* No card, no column rules (2026-08-30) — the board reads as
              the same stream as the hub; month labels do the grouping. */}
          <div>
            {monthGroups.map((group) => (
              <div key={group.header}>
                {/* Month divider */}
                <div className="day-head">
                  {group.header}
                </div>
                {group.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show more events'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
