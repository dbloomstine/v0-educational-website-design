'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Loader2, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ArticleRow } from './ArticleRow'
import type { ArticleFeedResponse, NewsArticle, FacetCounts } from '@/lib/news/types'

// ── Filter constants ──────────────────────────────────────────────

const DATE_RANGES = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
] as const

const FUND_SIZE_MIN_OPTIONS = [
  { label: 'No min', value: '' },
  { label: '$10M', value: '10000000' },
  { label: '$25M', value: '25000000' },
  { label: '$50M', value: '50000000' },
  { label: '$100M', value: '100000000' },
  { label: '$250M', value: '250000000' },
  { label: '$500M', value: '500000000' },
  { label: '$1B', value: '1000000000' },
  { label: '$2B', value: '2000000000' },
  { label: '$5B', value: '5000000000' },
  { label: '$10B', value: '10000000000' },
] as const

const FUND_SIZE_MAX_OPTIONS = [
  { label: 'No max', value: '' },
  { label: '$50M', value: '50000000' },
  { label: '$100M', value: '100000000' },
  { label: '$250M', value: '250000000' },
  { label: '$500M', value: '500000000' },
  { label: '$1B', value: '1000000000' },
  { label: '$2B', value: '2000000000' },
  { label: '$5B', value: '5000000000' },
  { label: '$10B', value: '10000000000' },
  { label: '$25B', value: '25000000000' },
  { label: '$50B+', value: '50000000000' },
] as const

const FUND_CATEGORIES = [
  { label: 'PE', value: 'PE' },
  { label: 'VC', value: 'VC' },
  { label: 'Credit', value: 'credit' },
  { label: 'Hedge', value: 'hedge' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Infra', value: 'infrastructure' },
  { label: 'Secondaries', value: 'secondaries' },
  { label: 'GP-Stakes', value: 'gp_stakes' },
] as const

const EVENT_TYPE_GROUPS = [
  {
    label: 'Fund Activity',
    tip: 'Fund lifecycle events — launches, closes, and fundraising updates',
    types: [
      { label: 'Launch', value: 'fund_launch', tip: 'New fund vehicle announced or in market' },
      { label: 'Close', value: 'fund_close', tip: 'First close, final close, or hard cap reached' },
      { label: 'Raise', value: 'capital_raise', tip: 'Fundraising updates, LP commitments, target sizes' },
    ],
  },
  {
    label: 'People',
    tip: 'Executive hires, departures, and role changes at fund managers',
    types: [
      { label: 'Hire', value: 'executive_hire', tip: 'New executive joins a fund manager or service provider' },
      { label: 'Move', value: 'executive_change', tip: 'Internal promotion, title change, or role shift' },
      { label: 'Departure', value: 'executive_departure', tip: 'Executive leaves a firm' },
    ],
  },
  {
    label: 'Deals',
    tip: 'Mergers, acquisitions, and strategic transactions between firms',
    types: [
      { label: 'M&A', value: 'acquisition', tip: 'Acquisition or merger between fund managers or service providers' },
    ],
  },
  {
    label: 'Regulatory',
    tip: 'Government actions, compliance alerts, and legal developments',
    types: [
      { label: 'Reg Action', value: 'regulatory_action', tip: 'SEC enforcement, new rules, CFTC actions' },
      { label: 'Legal', value: 'legal_alert', tip: 'Lawsuits, legal opinions, compliance alerts' },
    ],
  },
  {
    label: 'Commentary',
    tip: 'Market analysis, industry reports, and press releases',
    types: [
      { label: 'Analysis', value: 'market_commentary', tip: 'Market trends, opinion pieces, thought leadership' },
      { label: 'Industry', value: 'industry_analysis', tip: 'Deep-dive industry reports and research' },
      { label: 'Press', value: 'press_release', tip: 'Official announcements from firms' },
    ],
  },
] as const

const PAGE_SIZE = 60

// Multi-select helpers for comma-separated filter strings
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

function toggleGroupFilter(current: string, values: readonly string[]): string {
  const selected = current ? current.split(',') : []
  const allSelected = values.every((v) => selected.includes(v))
  if (allSelected) {
    // Deselect all in this group
    return selected.filter((v) => !values.includes(v)).join(',')
  }
  // Select all in this group (add missing ones)
  const combined = new Set([...selected, ...values])
  return [...combined].join(',')
}

function groupHasAny(current: string, values: readonly string[]): boolean {
  if (!current) return false
  const selected = current.split(',')
  return values.some((v) => selected.includes(v))
}

function groupHasAll(current: string, values: readonly string[]): boolean {
  if (!current) return false
  const selected = current.split(',')
  return values.every((v) => selected.includes(v))
}

// ── Component ─────────────────────────────────────────────────────

export function NewsFeed() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter state from URL
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [dateRange, setDateRange] = useState(searchParams.get('range') || '7d')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [eventType, setEventType] = useState(searchParams.get('type') || '')
  const [fundSizeMin, setFundSizeMin] = useState(searchParams.get('fundSizeMin') || '')
  const [fundSizeMax, setFundSizeMax] = useState(searchParams.get('fundSizeMax') || '')
  const [fundSizeOpen, setFundSizeOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Data state
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [facets, setFacets] = useState<FacetCounts | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Count active filters
  const activeFilterCount = [
    query,
    category,
    eventType,
    fundSizeMin,
    fundSizeMax,
    dateRange !== '7d',
  ].filter(Boolean).length

  // Build params
  const buildParams = useCallback(
    (newOffset = 0) => {
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(newOffset))
      if (query) params.set('q', query)
      if (dateRange) params.set('range', dateRange)
      if (category) params.set('category', category)
      if (eventType) params.set('type', eventType)
      if (fundSizeMin) params.set('fundSizeMin', fundSizeMin)
      if (fundSizeMax) params.set('fundSizeMax', fundSizeMax)
      return params
    },
    [query, dateRange, category, eventType, fundSizeMin, fundSizeMax]
  )

  // Sync URL
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (dateRange && dateRange !== '7d') params.set('range', dateRange)
    if (category) params.set('category', category)
    if (eventType) params.set('type', eventType)
    if (fundSizeMin) params.set('fundSizeMin', fundSizeMin)
    if (fundSizeMax) params.set('fundSizeMax', fundSizeMax)
    const qs = params.toString()
    router.replace(qs ? `/news?${qs}` : '/news', { scroll: false })
  }, [router, query, dateRange, category, eventType, fundSizeMin, fundSizeMax])

  // Fetch feed
  const fetchFeed = useCallback(
    async (newOffset = 0, append = false) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      try {
        const params = buildParams(newOffset)
        const res = await fetch(`/api/news/feed?${params.toString()}`)
        const json = await res.json()
        const data: ArticleFeedResponse = json.data

        if (append) {
          setArticles((prev) => [...prev, ...data.articles])
        } else {
          setArticles(data.articles)
          setFacets(data.facets)
        }
        setHasMore(data.hasMore)
        setOffset(data.offset + data.limit)
      } catch (err) {
        console.error('Failed to fetch news feed:', err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [buildParams]
  )

  // Fetch on filter change
  useEffect(() => {
    fetchFeed(0, false)
    syncUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dateRange, category, eventType, fundSizeMin, fundSizeMax])

  // Search debounce
  const [searchInput, setSearchInput] = useState(query)
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Clear all filters
  const clearFilters = () => {
    setSearchInput('')
    setQuery('')
    setDateRange('7d')
    setCategory('')
    setEventType('')
    setFundSizeMin('')
    setFundSizeMax('')
  }

  // Load more
  const loadMore = () => {
    fetchFeed(offset, true)
  }

  // Pill filter count (category/type filters only, not search/date)
  const pillFilterCount = [category, eventType].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* ── Compact toolbar ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search fund news..."
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

        {/* Date range */}
        <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                dateRange === range.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
            filtersOpen || pillFilterCount > 0
              ? 'bg-blue-900/50 text-blue-300 border-blue-700'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
          {pillFilterCount > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 text-[9px] text-white">{pillFilterCount}</span>
          )}
        </button>

        {/* Clear */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* ── Collapsible filter panel ─────────────────────────── */}
      {filtersOpen && (
        <div className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
          {/* Fund size range */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFundSizeOpen(!fundSizeOpen)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                fundSizeMin || fundSizeMax
                  ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              )}
            >
              {fundSizeMin || fundSizeMax
                ? `${FUND_SIZE_MIN_OPTIONS.find((o) => o.value === fundSizeMin)?.label || 'Any'} – ${FUND_SIZE_MAX_OPTIONS.find((o) => o.value === fundSizeMax)?.label || 'Any'}`
                : 'Fund Size'}
              <ChevronDown className={cn('h-3 w-3 transition-transform', fundSizeOpen && 'rotate-180')} />
            </button>

            {fundSizeOpen && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">Min</span>
                  <select
                    value={fundSizeMin}
                    onChange={(e) => setFundSizeMin(e.target.value)}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {FUND_SIZE_MIN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-muted-foreground/40">–</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">Max</span>
                  <select
                    value={fundSizeMax}
                    onChange={(e) => setFundSizeMax(e.target.value)}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {FUND_SIZE_MAX_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {(fundSizeMin || fundSizeMax) && (
                  <button
                    onClick={() => { setFundSizeMin(''); setFundSizeMax('') }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Fund Type pills */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Fund Type</span>
            <div className="flex flex-wrap gap-1">
              {FUND_CATEGORIES.map((cat) => {
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

          {/* Event Type groups — compact horizontal flow */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Event Type</span>
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
              {EVENT_TYPE_GROUPS.map((group, gi) => {
                const groupValues = group.types.map((t) => t.value)
                const allSelected = groupHasAll(eventType, groupValues)
                const someSelected = groupHasAny(eventType, groupValues)
                return (
                  <div key={group.label} className="flex items-center gap-1">
                    {/* Divider between groups */}
                    {gi > 0 && <div className="w-px h-4 bg-border/60 mx-1.5" />}
                    {/* Group label — clickable */}
                    <button
                      onClick={() => setEventType(toggleGroupFilter(eventType, groupValues))}
                      title={group.tip}
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors mr-0.5',
                        allSelected
                          ? 'text-blue-300'
                          : someSelected
                            ? 'text-blue-400/70'
                            : 'text-muted-foreground/40 hover:text-muted-foreground/70'
                      )}
                    >
                      {group.label}
                    </button>
                    {/* Sub-type pills */}
                    {group.types.map((type) => {
                      const count = facets?.types[type.value] ?? 0
                      return (
                        <button
                          key={type.value}
                          onClick={() => setEventType(toggleFilter(eventType, type.value))}
                          title={type.tip}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                            hasFilter(eventType, type.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          {type.label}
                          {count > 0 && (
                            <span className={cn('text-[9px]', hasFilter(eventType, type.value) ? 'text-blue-200' : 'text-muted-foreground/50')}>
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Articles ─────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
              <div className="h-4 w-10 rounded bg-muted animate-pulse" />
              <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">No articles found matching your filters.</p>
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
          {/* Dense article list */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Column headers */}
            <div className="grid items-center gap-x-2 px-4 py-1.5 border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 grid-cols-[56px_140px_1fr_56px_24px] lg:grid-cols-[56px_140px_72px_1fr_56px_150px_24px]">
              <span>Type</span>
              <span>Category</span>
              <span className="hidden lg:block">Size</span>
              <span className="pl-7">Headline</span>
              <span>Date</span>
              <span className="hidden lg:block">Source</span>
              <span />
            </div>
            {articles.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more articles'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
