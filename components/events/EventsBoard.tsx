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
import { isEventAudience } from '@/lib/events/audience'

// ── Filter constants ──────────────────────────────────────────────

// Said the way a reader would ask (2026-10-22: "2w / 30d / 3m" read as code). `1w` is the API's seven days.
const WHEN_RANGES = [
  { label: 'This week', value: '1w' },
  { label: 'Next 2 weeks', value: '2w' },
  { label: 'Next 30 days', value: '30d' },
  { label: 'Next 3 months', value: '3m' },
  { label: 'Any time', value: '' },
] as const

const TOPIC_OPTIONS = Object.entries(EVENT_TOPIC_LABELS).map(([value, label]) => ({ value, label }))

// How many city pills to show — the facet drives which ones (top by count). The first few ride in the quick row.
const CITY_PILL_LIMIT = 12
const QUICK_CITIES = 6

const KIND_OPTIONS = Object.entries(EVENT_KIND_LABELS)
  .filter(([value]) => value !== 'other')
  .map(([value, { label }]) => ({ value, label }))

// "Free" filters on the free events whose registration page we checked (2026-10-15); "Paid" went with the
// "Paid" label, since nearly everything is paid and an unchecked "paid" is a guess. Access filters stay.
const COST_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'member_only', label: 'Members only' },
  { value: 'invite_only', label: 'Invite only' },
] as const

const PAGE_SIZE = 100

/** How long to wait for the list before saying so. Without it a stalled request left the skeleton up for minutes. */
const FETCH_TIMEOUT_MS = 12_000

const FILTER_KEYS = ['q', 'when', 'kind', 'format', 'cost', 'category', 'topic', 'city', 'ops', 'audience'] as const

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
  // Who the events are for (`?audience=lp`, the /events/lps list). No pill of its own: it arrives in a link and shows as a chip to clear.
  const [audience, setAudience] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Data state
  const [events, setEvents] = useState<IndustryEvent[]>(initial?.events ?? [])
  const [facets, setFacets] = useState<EventFacetCounts | null>(initial?.facets ?? null)
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? false)
  const [total, setTotal] = useState<number | null>(initial?.total ?? null)
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
      const asked = params.get('audience')
      setAudience(isEventAudience(asked) ? asked : '')
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeFilterCount = [query, kind, format, cost, category, topic, city, opsOnly, audience, when !== ''].filter(Boolean).length

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
      if (audience) params.set('audience', audience)
      return params
    },
    [query, when, kind, format, cost, category, topic, city, opsOnly, audience]
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
    if (audience) params.set('audience', audience)
    const qs = params.toString()
    const base = pathname || '/events'
    // The address bar only: router.replace would ask the server for the page
    // again — and the page now carries a hundred events — on every filter click.
    window.history.replaceState(null, '', qs ? `${base}?${qs}` : base)
  }, [pathname, query, when, kind, format, cost, category, topic, city, opsOnly, audience])

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
          setTotal(data.total ?? null)
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
  }, [ready, query, when, kind, format, cost, category, topic, city, opsOnly, audience])


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
    setAudience('')
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
    if (audience) params.set('audience', audience)
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

  // ── The controls (2026-10-22, Danny: make the board "more approachable and engaging… click around… play with it").
  // One house chip: cream with a hairline, navy when chosen, with the count beside the label so a tap's worth is visible.
  const chip = (on: boolean) =>
    cn(
      'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-ui text-[13px] font-medium transition-colors',
      on ? 'border-foreground bg-foreground text-background' : 'border-foreground/20 bg-background text-foreground hover:border-foreground/50',
    )
  const countOf = (n: number | undefined, on: boolean) =>
    n ? <span className={cn('tabular-nums text-[11.5px]', on ? 'text-background/70' : 'text-muted-foreground')}>{n}</span> : null

  const quickCities = cityOptions.slice(0, QUICK_CITIES)
  const moreCities = cityOptions.slice(QUICK_CITIES)
  const free = hasFilter(cost, 'free')
  const virtual = hasFilter(format, 'virtual')

  // What is chosen, as chips the reader can take off one by one.
  const chosen: { key: string; label: string; off: () => void }[] = [
    ...(query ? [{ key: 'q', label: `“${query}”`, off: () => { setSearchInput(''); setQuery('') } }] : []),
    ...(when ? [{ key: 'when', label: WHEN_RANGES.find((r) => r.value === when)?.label ?? when, off: () => setWhen('') }] : []),
    ...(opsOnly ? [{ key: 'ops', label: 'Ops-focused', off: () => setOpsOnly(false) }] : []),
    ...(audience === 'lp' ? [{ key: 'aud', label: 'For LPs', off: () => setAudience('') }] : []),
    ...(city ? city.split(',').map((c) => ({ key: `city:${c}`, label: c, off: () => setCity(toggleFilter(city, c)) })) : []),
    ...(topic ? topic.split(',').map((t) => ({ key: `topic:${t}`, label: EVENT_TOPIC_LABELS[t] ?? t, off: () => setTopic(toggleFilter(topic, t)) })) : []),
    ...(kind ? kind.split(',').map((k) => ({ key: `kind:${k}`, label: KIND_OPTIONS.find((o) => o.value === k)?.label ?? k, off: () => setKind(toggleFilter(kind, k)) })) : []),
    ...(category ? category.split(',').map((c) => ({ key: `cat:${c}`, label: EVENT_ASSET_CLASSES.find((o) => o.value === c)?.label ?? c, off: () => setCategory(toggleFilter(category, c)) })) : []),
    ...(format ? format.split(',').map((f) => ({ key: `fmt:${f}`, label: EVENT_FORMAT_LABELS[f] ?? f, off: () => setFormat(toggleFilter(format, f)) })) : []),
    ...(cost ? cost.split(',').map((c) => ({ key: `cost:${c}`, label: COST_OPTIONS.find((o) => o.value === c)?.label ?? c, off: () => setCost(toggleFilter(cost, c)) })) : []),
  ]
  const morePicked = [kind, category, topic].filter(Boolean).length + (cost && !(cost === 'free') ? 1 : 0) + moreCities.filter(([n]) => hasFilter(city, n)).length
  const shownCount = total ?? (hasMore ? null : events.length)

  const group = (label: string, body: React.ReactNode) => (
    <div>
      <span className="mb-2 block font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{body}</div>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          aria-label="Search events"
          placeholder={facets?.totalUpcoming ? `Search ${facets.totalUpcoming} events by name, city or host` : 'Search events by name, city or host'}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-[3px] border border-foreground/25 bg-background py-2.5 pl-10 pr-9 font-ui text-[15px] text-foreground placeholder:text-muted-foreground/80 focus:border-foreground/60 focus:outline-none"
        />
        {searchInput && (
          <button
            aria-label="Clear the search"
            onClick={() => { setSearchInput(''); setQuery('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── When ─────────────────────────────────────────────── */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="group" aria-label="When">
        {WHEN_RANGES.map((range) => (
          <button key={range.label} onClick={() => setWhen(range.value)} aria-pressed={when === range.value} className={chip(when === range.value)}>
            {range.label}
          </button>
        ))}
      </div>

      {/* ── Quick picks: one tap each, with what each holds ──── */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="group" aria-label="Quick filters">
        <button
          onClick={() => setOpsOnly(!opsOnly)}
          aria-pressed={opsOnly}
          title="Events squarely for fund operations, finance, compliance and legal teams"
          className={chip(opsOnly)}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', opsOnly ? 'bg-background' : 'bg-[#D4A63A]')} aria-hidden />
          Ops-focused {countOf(facets?.opsHighCount, opsOnly)}
        </button>
        <button onClick={() => setCost(toggleFilter(cost, 'free'))} aria-pressed={free} className={chip(free)}>
          Free {countOf(facets?.costs.free, free)}
        </button>
        {/* Only once there are a few: a chip that finds one event is not worth a place in the row. */}
        {((facets?.formats.virtual ?? 0) >= 3 || virtual) && (
          <button onClick={() => setFormat(toggleFilter(format, 'virtual'))} aria-pressed={virtual} className={chip(virtual)}>
            Virtual {countOf(facets?.formats.virtual, virtual)}
          </button>
        )}
        <span className="mx-0.5 w-px shrink-0 self-stretch bg-foreground/15" aria-hidden />
        {quickCities.map(([name, n]) => {
          const on = hasFilter(city, name)
          return (
            <button key={name} onClick={() => setCity(toggleFilter(city, name))} aria-pressed={on} className={chip(on)}>
              {name} {countOf(n, on)}
            </button>
          )
        })}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          className={cn(chip(filtersOpen), 'gap-1.5')}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {filtersOpen ? 'Fewer filters' : 'More filters'}
          {morePicked > 0 && !filtersOpen && <span className="rounded-full bg-foreground px-1.5 text-[11px] text-background">{morePicked}</span>}
        </button>
      </div>

      {/* ── More filters ─────────────────────────────────────── */}
      {filtersOpen && (
        <div className="space-y-4 border border-foreground/15 bg-background p-4">
          {group('Topic', TOPIC_OPTIONS.map((opt) => {
            const on = hasFilter(topic, opt.value)
            return <button key={opt.value} onClick={() => setTopic(toggleFilter(topic, opt.value))} aria-pressed={on} className={chip(on)}>{opt.label} {countOf(facets?.topics[opt.value], on)}</button>
          }))}
          {group('Type of event', KIND_OPTIONS.filter((opt) => (facets?.kinds[opt.value] ?? 0) > 0 || hasFilter(kind, opt.value)).map((opt) => {
            const on = hasFilter(kind, opt.value)
            return <button key={opt.value} onClick={() => setKind(toggleFilter(kind, opt.value))} aria-pressed={on} className={chip(on)}>{opt.label} {countOf(facets?.kinds[opt.value], on)}</button>
          }))}
          {group('Market', EVENT_ASSET_CLASSES.filter((opt) => (facets?.categories[opt.value] ?? 0) > 0 || hasFilter(category, opt.value)).map((opt) => {
            const on = hasFilter(category, opt.value)
            return <button key={opt.value} onClick={() => setCategory(toggleFilter(category, opt.value))} aria-pressed={on} className={chip(on)}>{opt.label} {countOf(facets?.categories[opt.value], on)}</button>
          }))}
          {moreCities.length > 0 && group('More cities', moreCities.map(([name, n]) => {
            const on = hasFilter(city, name)
            return <button key={name} onClick={() => setCity(toggleFilter(city, name))} aria-pressed={on} className={chip(on)}>{name} {countOf(n, on)}</button>
          }))}
          {group('Access', COST_OPTIONS.filter((opt) => opt.value !== 'free').map((opt) => {
            const on = hasFilter(cost, opt.value)
            return <button key={opt.value} onClick={() => setCost(toggleFilter(cost, opt.value))} aria-pressed={on} className={chip(on)}>{opt.label} {countOf(facets?.costs[opt.value], on)}</button>
          }))}
          <div className="flex justify-end">
            <button onClick={() => setFiltersOpen(false)} className="rounded-[3px] bg-foreground px-4 py-2 font-ui text-[13px] font-semibold text-background hover:opacity-90">
              {loading ? 'Showing…' : shownCount != null ? `Show ${shownCount} event${shownCount === 1 ? '' : 's'}` : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* ── The result: how many, what is chosen, and the two tools ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-foreground/15 pt-3">
        <span className="font-news text-[19px] font-medium text-foreground" aria-live="polite">
          {loading ? 'Finding events…' : shownCount != null ? `${shownCount.toLocaleString('en-US')} event${shownCount === 1 ? '' : 's'}` : `${events.length}+ events`}
        </span>
        {chosen.map((c) => (
          <button key={c.key} onClick={c.off} aria-label={`Remove ${c.label}`} className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.07] px-2.5 py-1 font-ui text-[12.5px] text-foreground hover:bg-foreground/15">
            {c.label} <X className="h-3 w-3" />
          </button>
        ))}
        {chosen.length > 1 && (
          <button onClick={clearFilters} className="font-ui text-[12.5px] font-semibold text-foreground underline underline-offset-2 hover:no-underline">
            Clear all
          </button>
        )}
        <span className="flex w-full items-center gap-4 whitespace-nowrap sm:ml-auto sm:w-auto">
          <button
            onClick={copyCalendarFeed}
            title="Copies a webcal:// address for this view: paste it into Google, Outlook or Apple Calendar under 'subscribe from URL' and new events appear on their own"
            className="inline-flex items-center gap-1.5 font-ui text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            {feedCopied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <CalendarPlus className="h-3.5 w-3.5" />}
            {feedCopied ? 'Calendar address copied' : 'Add to your calendar'}
          </button>
          <Link href="/events/submit" className="font-ui text-[12.5px] text-muted-foreground hover:text-foreground">
            Submit an event
          </Link>
        </span>
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
        <div className="py-14 text-center">
          <p className="font-news text-[19px] text-foreground">Nothing matches all of that.</p>
          <p className="mt-1 font-ui text-[13.5px] text-muted-foreground">Fewer filters, or a longer window, usually finds something.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {when && <button onClick={() => setWhen('')} className={chip(false)}>Any time</button>}
            {activeFilterCount > 0 && <button onClick={clearFilters} className={chip(true)}>Clear all filters</button>}
          </div>
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
