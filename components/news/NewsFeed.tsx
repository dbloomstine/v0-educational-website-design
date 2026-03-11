'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Loader2, TrendingUp, Zap, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StoryCard } from './StoryCard'
import { FirmLogo } from './FirmLogo'
import type { FeedResponse, Story, TrendingFirm, FacetCounts } from '@/lib/news/types'

// ── Filter constants ──────────────────────────────────────────────

const DATE_RANGES = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
] as const

const FUND_SIZE_OPTIONS = [
  { label: 'Any Size', value: '' },
  { label: '$100M+', value: '100000000' },
  { label: '$500M+', value: '500000000' },
  { label: '$1B+', value: '1000000000' },
  { label: '$5B+', value: '5000000000' },
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

const ARTICLE_TYPES = [
  { label: 'Launch', value: 'fund_launch' },
  { label: 'Close', value: 'fund_close' },
  { label: 'Raise', value: 'capital_raise' },
  { label: 'Hire', value: 'executive_hire' },
  { label: 'Exec Change', value: 'executive_change' },
  { label: 'M&A', value: 'acquisition' },
  { label: 'Regulatory', value: 'regulatory_action' },
  { label: 'Press', value: 'press_release' },
  { label: 'Market', value: 'market_commentary' },
] as const

const PAGE_SIZE = 20

// ── Component ─────────────────────────────────────────────────────

export function NewsFeed() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter state from URL
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [dateRange, setDateRange] = useState(searchParams.get('range') || '7d')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [eventType, setEventType] = useState(searchParams.get('type') || '')
  const [fundActivity, setFundActivity] = useState(searchParams.get('fundActivity') === 'true')
  const [fundSize, setFundSize] = useState(searchParams.get('fundSize') || '')
  const [trustedOnly, setTrustedOnly] = useState(searchParams.get('trusted') === 'true')
  const [trendingFirm, setTrendingFirm] = useState(searchParams.get('firm') || '')
  const [fundSizeOpen, setFundSizeOpen] = useState(false)

  // Data state
  const [stories, setStories] = useState<Story[]>([])
  const [trending, setTrending] = useState<TrendingFirm[]>([])
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
    fundActivity,
    fundSize,
    trustedOnly,
    trendingFirm,
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
      if (fundActivity) params.set('fundActivity', 'true')
      if (fundSize) params.set('fundSize', fundSize)
      if (trustedOnly) params.set('trusted', 'true')
      if (trendingFirm) params.set('firm', trendingFirm)
      return params
    },
    [query, dateRange, category, eventType, fundActivity, fundSize, trustedOnly, trendingFirm]
  )

  // Sync URL
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (dateRange && dateRange !== '7d') params.set('range', dateRange)
    if (category) params.set('category', category)
    if (eventType) params.set('type', eventType)
    if (fundActivity) params.set('fundActivity', 'true')
    if (fundSize) params.set('fundSize', fundSize)
    if (trustedOnly) params.set('trusted', 'true')
    if (trendingFirm) params.set('firm', trendingFirm)
    const qs = params.toString()
    router.replace(qs ? `/news?${qs}` : '/news', { scroll: false })
  }, [router, query, dateRange, category, eventType, fundActivity, fundSize, trustedOnly, trendingFirm])

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
        const data: FeedResponse = json.data

        if (append) {
          setStories((prev) => [...prev, ...data.stories])
        } else {
          setStories(data.stories)
          setTrending(data.trending)
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
  }, [query, dateRange, category, eventType, fundActivity, fundSize, trustedOnly, trendingFirm])

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
    setFundActivity(false)
    setFundSize('')
    setTrustedOnly(false)
    setTrendingFirm('')
  }

  // Load more
  const loadMore = () => {
    fetchFeed(offset, true)
  }

  return (
    <div className="space-y-6">
      {/* ── Search bar ─────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search fund news..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {searchInput && (
          <button
            onClick={() => {
              setSearchInput('')
              setQuery('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Filter row ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Fund Activity toggle */}
        <button
          onClick={() => setFundActivity(!fundActivity)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            fundActivity
              ? 'bg-blue-900/50 text-blue-300 border-blue-700'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          )}
        >
          <TrendingUp className="h-3 w-3" />
          Fund Activity
        </button>

        {/* Fund Size dropdown */}
        <div className="relative">
          <button
            onClick={() => setFundSizeOpen(!fundSizeOpen)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              fundSize
                ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            )}
          >
            {fundSize
              ? FUND_SIZE_OPTIONS.find((o) => o.value === fundSize)?.label || 'Fund Size'
              : 'Fund Size'}
            <ChevronDown className={cn('h-3 w-3 transition-transform', fundSizeOpen && 'rotate-180')} />
          </button>
          {fundSizeOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg">
              {FUND_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFundSize(opt.value)
                    setFundSizeOpen(false)
                  }}
                  className={cn(
                    'block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors',
                    fundSize === opt.value
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trusted Only toggle */}
        <button
          onClick={() => setTrustedOnly(!trustedOnly)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            trustedOnly
              ? 'bg-blue-900/50 text-blue-300 border-blue-700'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          )}
        >
          <Zap className="h-3 w-3" />
          Trusted Only
        </button>

        {/* Date range selector */}
        <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                dateRange === range.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-3 w-3" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* ── Category + type pills ────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Fund Type</span>
          <div className="flex flex-wrap gap-1.5">
            {FUND_CATEGORIES.map((cat) => {
              const count = facets?.categories[cat.value] ?? 0
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(category === cat.value ? '' : cat.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    category === cat.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {cat.label}
                  {count > 0 && (
                    <span className={cn('text-[10px]', category === cat.value ? 'text-blue-200' : 'text-muted-foreground/60')}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Event Type</span>
          <div className="flex flex-wrap gap-1.5">
            {ARTICLE_TYPES.map((type) => {
              const count = facets?.types[type.value] ?? 0
              return (
                <button
                  key={type.value}
                  onClick={() => setEventType(eventType === type.value ? '' : type.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    eventType === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {type.label}
                  {count > 0 && (
                    <span className={cn('text-[10px]', eventType === type.value ? 'text-blue-200' : 'text-muted-foreground/60')}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Trending firms ─────────────────────────────────── */}
      {trending.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trending Firms
          </h3>
          <div className="flex flex-wrap gap-2">
            {trending.map((firm) => (
              <button
                key={firm.firmId}
                onClick={() => setTrendingFirm(trendingFirm === firm.firmId ? '' : firm.firmId)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  trendingFirm === firm.firmId
                    ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                )}
              >
                <FirmLogo name={firm.name} logoUrl={firm.logoUrl} />
                {firm.name}
                <span className={cn('text-[10px]', trendingFirm === firm.firmId ? 'text-blue-200' : 'text-muted-foreground/60')}>
                  {firm.mentionCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stories ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">No stories found matching your filters.</p>
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
          {/* Section label */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Top Stories</span>
            <div className="flex-1 border-t border-border" />
            <span className="text-[11px] text-muted-foreground/60">{stories.length} results</span>
          </div>

          {/* Featured story — first result, full width */}
          <StoryCard story={stories[0]} featured />

          {/* Remaining stories in 2-col grid */}
          {stories.length > 1 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {stories.slice(1).map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show more stories'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
