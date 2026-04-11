'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EVENT_LABELS,
  CATEGORY_LABELS,
  decodeHtmlEntities,
  formatFundSize,
  formatCompactTime,
  formatRelativeDate,
} from '@/lib/news/constants'
import type { NewsArticle } from '@/lib/news/types'
import { getLogoCandidates, resolveLogoDomain } from '@/lib/news/firm-logo-url'

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF ', CNY: '¥', KRW: '₩', AUD: 'A$', CAD: 'C$',
}

// ─── Firm Logo ───────────────────────────────────────────────────────────────

const LOGO_COLORS = [
  'bg-blue-900/60 text-blue-300',
  'bg-emerald-900/60 text-emerald-300',
  'bg-violet-900/60 text-violet-300',
  'bg-amber-900/60 text-amber-300',
  'bg-rose-900/60 text-rose-300',
  'bg-cyan-900/60 text-cyan-300',
  'bg-indigo-900/60 text-indigo-300',
  'bg-orange-900/60 text-orange-300',
]

function getInitialColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length]
}

function FirmLogo({
  domain,
  firmName,
  sourceName,
  size = 20,
}: {
  domain: string | null
  firmName: string | null
  sourceName?: string | null
  size?: number
}) {
  const resolvedDomain = resolveLogoDomain(firmName, domain, sourceName ?? null)
  const candidates = useMemo(
    () => (resolvedDomain ? getLogoCandidates(resolvedDomain) : []),
    [resolvedDomain],
  )

  // Walk the candidate list on each img load failure. Reset when the
  // resolved domain changes so a re-render with different props starts
  // over from the primary source.
  const [candidateIdx, setCandidateIdx] = useState(0)
  useEffect(() => {
    setCandidateIdx(0)
  }, [resolvedDomain])

  const currentUrl = candidates[candidateIdx]

  if (currentUrl) {
    return (
      <img
        key={resolvedDomain ?? ''}
        src={currentUrl}
        alt={firmName || ''}
        loading="lazy"
        className="rounded-full object-contain bg-white shrink-0 ring-1 ring-black/5"
        style={{ width: size, height: size }}
        onError={() => setCandidateIdx((i) => i + 1)}
      />
    )
  }

  // Final fallback: letter initial from firmName, or sourceName if no firm.
  // Font size scales with the container so the initial looks right whether
  // the row renders at 20px, 24px, or 28px.
  const displayName = firmName || sourceName || '?'
  const initial = displayName[0].toUpperCase()
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold shrink-0 ring-1 ring-white/5',
        getInitialColor(displayName),
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.46)),
        lineHeight: 1,
      }}
      role="img"
      aria-label={displayName}
    >
      {initial}
    </div>
  )
}

// ─── Article Row ─────────────────────────────────────────────────────────────

interface ArticleRowProps {
  article: NewsArticle
  dateRange?: string
  clusterSize?: number
}

export function ArticleRow({ article, dateRange, clusterSize }: ArticleRowProps) {
  const eventLabel = article.eventType ? EVENT_LABELS[article.eventType] : null
  const fundSize = formatFundSize(article.fundSizeUsd)

  // Detect converted currency (from classification data or headline heuristic)
  const isConverted = article.originalCurrency
    ? article.originalCurrency !== 'USD'
    : !!(article.fundSizeUsd && /[€£¥]|EUR |GBP |CHF /i.test(article.title))
  const displaySize = fundSize ? (isConverted ? `≈${fundSize}` : fundSize) : null
  const sizeTooltip = isConverted && article.originalAmountMillions && article.originalCurrency
    ? `Converted from ${CURRENCY_SYMBOLS[article.originalCurrency] ?? article.originalCurrency}${article.originalAmountMillions >= 1000 ? `${(article.originalAmountMillions / 1000).toFixed(1)}B` : `${article.originalAmountMillions.toFixed(0)}M`}`
    : isConverted ? 'Converted to USD' : undefined

  // Desktop hover card state
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Mobile expand state
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const clearTimers = useCallback(() => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null }
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }, [])

  const handleRowEnter = useCallback((e: React.MouseEvent) => {
    clearTimers()
    setCoords({ x: e.clientX, y: e.clientY })
    openTimer.current = setTimeout(() => setVisible(true), 200)
  }, [clearTimers])

  const handleRowMove = useCallback((e: React.MouseEvent) => {
    if (!visible) {
      setCoords({ x: e.clientX, y: e.clientY })
    }
  }, [visible])

  const handleRowLeave = useCallback(() => {
    clearTimers()
    closeTimer.current = setTimeout(() => setVisible(false), 150)
  }, [clearTimers])

  const handleCardEnter = useCallback(() => {
    clearTimers()
  }, [clearTimers])

  const handleCardLeave = useCallback(() => {
    clearTimers()
    closeTimer.current = setTimeout(() => setVisible(false), 150)
  }, [clearTimers])

  // Position the card: to the right of cursor, clamped to viewport
  const cardWidth = 420
  const cardPad = 12
  let left = coords.x + cardPad
  let top = coords.y

  if (typeof window !== 'undefined') {
    if (left + cardWidth > window.innerWidth - 16) {
      left = coords.x - cardWidth - cardPad
    }
    if (top + 300 > window.innerHeight) {
      top = Math.max(16, window.innerHeight - 400)
    }
  }

  return (
    <>
      {/* ─── Desktop: Grid row (lg and up) ─── */}
      <div
        className={cn(
          'hidden lg:grid group items-center gap-x-2 px-4 py-2.5 border-b border-border/40 hover:bg-accent/30 transition-colors cursor-default grid-cols-[56px_140px_72px_1fr_auto_56px_150px]'
        )}
      >
        {/* Col 1: Event type badge */}
        <div className="flex items-center">
          {eventLabel ? (
            <span
              className={cn(
                'inline-flex rounded border px-1.5 py-0.5 text-[11px] font-semibold leading-none whitespace-nowrap',
                eventLabel.color
              )}
            >
              {eventLabel.short}
            </span>
          ) : null}
        </div>

        {/* Col 2: Category badges */}
        <div className="flex items-center gap-1 overflow-hidden">
          {article.fundCategories.slice(0, 2).map((cat) => {
            const catInfo = CATEGORY_LABELS[cat]
            return (
              <span
                key={cat}
                className={cn(
                  'inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none whitespace-nowrap',
                  catInfo?.color || 'bg-muted text-muted-foreground'
                )}
              >
                {catInfo?.label || cat}
              </span>
            )
          })}
        </div>

        {/* Col 3: Fund size */}
        <span className="text-[11px] font-mono font-medium text-muted-foreground whitespace-nowrap" title={sizeTooltip}>
          {displaySize || ''}
        </span>

        {/* Col 4: Logo + Firm pill + Headline */}
        <div className="flex items-center gap-1.5 min-w-0">
          <FirmLogo domain={article.firmDomain} firmName={article.firmName} sourceName={article.sourceName} />
          {article.firmName && (
            <span className="inline-flex shrink-0 max-w-[100px] rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground truncate leading-none">
              {article.firmName}
            </span>
          )}
          <span className="text-[14px] font-medium text-foreground leading-snug truncate">
            {decodeHtmlEntities(article.title)}
          </span>
        </div>

        {/* Col 5: Details pill — hover trigger for detail card */}
        <div
          onMouseEnter={handleRowEnter}
          onMouseMove={handleRowMove}
          onMouseLeave={handleRowLeave}
          className="flex items-center"
        >
          <span className="inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:border-foreground/30 hover:bg-accent transition-all cursor-pointer whitespace-nowrap select-none">
            Details
          </span>
        </div>

        {/* Col 6: Date */}
        <span className="text-[11px] text-muted-foreground/50 tabular-nums whitespace-nowrap">
          {article.publishedDate ? formatCompactTime(article.publishedDate, dateRange) : ''}
        </span>

        {/* Col 7: Source name + cluster badge */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] text-muted-foreground/60 truncate">
            {article.sourceName || ''}
          </span>
          {clusterSize && clusterSize > 1 && (
            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-muted/60 border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70 leading-none">
              {clusterSize} sources
            </span>
          )}
        </div>
      </div>

      {/* ─── Mobile: Card layout (below lg) ─── */}
      <div
        className={cn(
          'lg:hidden border-b border-border/40 transition-colors'
        )}
      >
        {/* Tappable main area */}
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full text-left px-3 py-2.5 active:bg-accent/30 transition-colors"
        >
          {/* Row 1: Badges + Date */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {eventLabel && (
              <span
                className={cn(
                  'inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap',
                  eventLabel.color
                )}
              >
                {eventLabel.short}
              </span>
            )}
            {article.fundCategories.slice(0, 2).map((cat) => {
              const catInfo = CATEGORY_LABELS[cat]
              return (
                <span
                  key={cat}
                  className={cn(
                    'inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap',
                    catInfo?.color || 'bg-muted text-muted-foreground'
                  )}
                >
                  {catInfo?.label || cat}
                </span>
              )
            })}
            {displaySize && (
              <span className="text-[10px] font-mono font-medium text-muted-foreground/60" title={sizeTooltip}>
                {displaySize}
              </span>
            )}
            {clusterSize && clusterSize > 1 && (
              <span className="inline-flex items-center rounded-full bg-muted/60 border border-border/50 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/70 leading-none">
                {clusterSize} sources
              </span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground/50 tabular-nums whitespace-nowrap">
              {article.publishedDate ? formatCompactTime(article.publishedDate, dateRange) : ''}
            </span>
            <ChevronDown className={cn('h-3 w-3 text-muted-foreground/40 shrink-0 transition-transform', mobileExpanded && 'rotate-180')} />
          </div>

          {/* Row 2: Logo + Firm + Headline */}
          <div className="flex items-start gap-2 min-w-0">
            <FirmLogo domain={article.firmDomain} firmName={article.firmName} sourceName={article.sourceName} size={24} />
            <div className="min-w-0 flex-1">
              {article.firmName && (
                <span className="text-[10px] font-medium text-muted-foreground/60 block leading-tight mb-0.5">
                  {article.firmName}
                </span>
              )}
              <span className={cn(
                'text-[13px] font-medium text-foreground leading-snug',
                mobileExpanded ? 'line-clamp-none' : 'line-clamp-2'
              )}>
                {decodeHtmlEntities(article.title)}
              </span>
            </div>
          </div>
        </button>

        {/* Expanded detail panel */}
        {mobileExpanded && (
          <div className="px-3 pb-3 space-y-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
            {/* Firm / Fund / Person details */}
            {(article.firmName || article.fundName || article.personName) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {article.fundName && (
                  <span><span className="text-muted-foreground/50">Fund:</span> <span className="font-medium text-foreground/80">{article.fundName}</span></span>
                )}
                {article.personName && (
                  <span><span className="text-muted-foreground/50">{article.personTitle || 'Person'}:</span> <span className="font-medium text-foreground/80">{article.personName}</span></span>
                )}
                {article.fundStrategy && (
                  <span><span className="text-muted-foreground/50">Strategy:</span> <span className="font-medium text-foreground/80 capitalize">{article.fundStrategy}</span></span>
                )}
                {article.geography.length > 0 && (
                  <span><span className="text-muted-foreground/50">Geo:</span> <span className="font-medium text-foreground/80">{article.geography.join(', ')}</span></span>
                )}
              </div>
            )}

            {/* TLDR */}
            {article.tldr && (
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {article.tldr}
              </p>
            )}

            {/* Source link + meta */}
            <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-foreground/80 active:bg-accent transition-colors"
              >
                Read article
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              <span className="text-[10px] text-muted-foreground/50">
                {article.sourceName}{article.publishedDate ? ` · ${formatRelativeDate(article.publishedDate)}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Desktop hover preview card — portaled ─── */}
      {visible && typeof document !== 'undefined' && createPortal(
        <div
          ref={cardRef}
          onMouseEnter={handleCardEnter}
          onMouseLeave={handleCardLeave}
          style={{ position: 'fixed', left, top, zIndex: 50, width: cardWidth }}
          className="rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="p-4 space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {eventLabel && (
                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', eventLabel.color)}>
                  {eventLabel.label}
                </span>
              )}
              {article.fundCategories.map((cat) => {
                const catInfo = CATEGORY_LABELS[cat]
                return (
                  <span
                    key={cat}
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                      catInfo?.color || 'bg-muted text-muted-foreground'
                    )}
                  >
                    {catInfo?.label || cat}
                  </span>
                )
              })}
              {displaySize && (
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground" title={sizeTooltip}>
                  {displaySize}
                </span>
              )}
            </div>

            {/* Headline with logo */}
            <div className="flex items-start gap-2.5">
              <FirmLogo domain={article.firmDomain} firmName={article.firmName} sourceName={article.sourceName} size={28} />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground leading-snug">
                  {decodeHtmlEntities(article.title)}
                </h3>
                {article.firmName && (
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{article.firmName}</p>
                )}
              </div>
            </div>

            {/* Firm / Fund / Person details */}
            {(article.firmName || article.fundName || article.personName) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {article.firmName && (
                  <span><span className="text-muted-foreground/50">Firm:</span> <span className="font-medium text-foreground/80">{article.firmName}</span></span>
                )}
                {article.fundName && (
                  <span><span className="text-muted-foreground/50">Fund:</span> <span className="font-medium text-foreground/80">{article.fundName}</span></span>
                )}
                {article.personName && (
                  <span><span className="text-muted-foreground/50">{article.personTitle ? article.personTitle : 'Person'}:</span> <span className="font-medium text-foreground/80">{article.personName}</span></span>
                )}
                {article.fundStrategy && (
                  <span><span className="text-muted-foreground/50">Strategy:</span> <span className="font-medium text-foreground/80 capitalize">{article.fundStrategy}</span></span>
                )}
                {article.geography.length > 0 && (
                  <span><span className="text-muted-foreground/50">Geo:</span> <span className="font-medium text-foreground/80">{article.geography.join(', ')}</span></span>
                )}
              </div>
            )}

            {/* TLDR */}
            {article.tldr && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {article.tldr}
              </p>
            )}

            {/* Source link + time */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-foreground/80 hover:text-foreground hover:bg-accent hover:border-foreground/20 transition-colors"
              >
                Read full article
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              <span className="text-[11px] text-muted-foreground/50">{article.sourceName}{article.publishedDate ? ` · ${formatRelativeDate(article.publishedDate)}` : ''}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
