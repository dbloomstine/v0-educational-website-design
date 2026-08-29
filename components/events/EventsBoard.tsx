'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2, SlidersHorizontal, CalendarPlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EventRow } from './EventRow'
import {
  EVENT_KIND_LABELS,
  EVENT_FORMAT_LABELS,
  EVENT_ASSET_CLASSES,
  EVENT_TOPIC_LABELS,
  formatMonthHeader,
  formatWeekHeader,
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

export function EventsBoard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Filter state from URL
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [when, setWhen] = useState(searchParams.get('when') || '')
  const [kind, setKind] = useState(searchParams.get('kind') || '')
  const [format, setFormat] = useState(searchParams.get('format') || '')
  const [cost, setCost] = useState(searchParams.get('cost') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [topic, setTopic] = useState(searchParams.get('topic') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [opsOnly, setOpsOnly] = useState(searchParams.get('ops') === '1')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Data state
  const [events, setEvents] = useState<IndustryEvent[]>([])
  const [facets, setFacets] = useState<EventFacetCounts | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

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
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
  }, [router, pathname, query, when, kind, format, cost, category, topic, city, opsOnly])

  const fetchFeed = useCallback(
    async (newOffset = 0, append = false) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      try {
        const params = buildParams(newOffset)
        const res = await fetch(`/api/events/feed?${params.toString()}`)
        const json = await res.json()
        const data: EventFeedResponse = json.data

        if (append) {
          setEvents((prev) => [...prev, ...data.events])
        } else {
          setEvents(data.events)
          setFacets(data.facets)
        }
        setHasMore(data.hasMore)
        setOffset(data.offset + data.limit)
      } catch (err) {
        console.error('Failed to fetch events feed:', err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [buildParams]
  )

  useEffect(() => {
    fetchFeed(0, false)
    syncUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, when, kind, format, cost, category, topic, city, opsOnly])

  // Search debounce
  const [searchInput, setSearchInput] = useState(query)
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

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

  // Group the date-sorted list under month headers (Gary's Guide-style).
  // Trip view: with a city filter active, switch to WEEK headers — the
  // traveler's question is "what can I hit in one trip", not "what's in
  // October".
  const tripView = Boolean(city)
  const monthGroups: { header: string; events: IndustryEvent[] }[] = []
  for (const event of events) {
    const header = tripView ? formatWeekHeader(event.startDate) : formatMonthHeader(event.startDate)
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
    <div className="space-y-3">
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
            {facets && facets.opsHighCount > 0 && (
              <span className={cn('text-[9px]', opsOnly ? 'text-amber-300/70' : 'text-muted-foreground/50')}>
                {facets.opsHighCount}
              </span>
            )}
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
                    {count > 0 && (
                      <span className={cn('text-[9px]', hasFilter(kind, opt.value) ? 'text-blue-200' : 'text-muted-foreground/50')}>
                        {count}
                      </span>
                    )}
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
                      {count > 0 && (
                        <span className={cn('text-[9px]', hasFilter(cost, opt.value) ? 'text-blue-200' : 'text-muted-foreground/50')}>
                          {count}
                        </span>
                      )}
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
                      {count > 0 && (
                        <span className={cn('text-[9px]', hasFilter(format, opt.value) ? 'text-blue-200' : 'text-muted-foreground/50')}>
                          {count}
                        </span>
                      )}
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
                    {count > 0 && (
                      <span className={cn('text-[9px]', hasFilter(city, name) ? 'text-blue-200' : 'text-muted-foreground/50')}>
                        {count}
                      </span>
                    )}
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
                    {count > 0 && (
                      <span className={cn('text-[9px]', hasFilter(topic, opt.value) ? 'text-blue-200' : 'text-muted-foreground/50')}>
                        {count}
                      </span>
                    )}
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
                    {count > 0 && (
                      <span className={cn('text-[9px]', hasFilter(category, cat.value) ? 'text-blue-200' : 'text-muted-foreground/50')}>
                        {count}
                      </span>
                    )}
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
      {loading ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
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
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Column headers — desktop only */}
            <div className="hidden lg:grid items-center gap-x-2 px-4 py-1.5 border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 grid-cols-[130px_96px_1fr_200px_120px]">
              <span>Date</span>
              <span>Type</span>
              <span>Event</span>
              <span>Location</span>
              <span>Cost</span>
            </div>

            {monthGroups.map((group) => (
              <div key={group.header}>
                {/* Month divider */}
                <div className="border-b border-border/60 bg-muted/30 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
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
