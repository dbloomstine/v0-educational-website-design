'use client'

import { useCallback, useRef, useState } from 'react'
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
  firmLabelFor,
} from '@/lib/news/constants'
import type { NewsArticle } from '@/lib/news/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF ', CNY: '¥', KRW: '₩', AUD: 'A$', CAD: 'C$',
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

  // Classification that used to occupy two dedicated columns, condensed to a
  // single trailing token: "CLOSE · PE · $865M". Empty when we know nothing.
  const metaTrail = [
    eventLabel?.short,
    article.fundCategories.slice(0, 1).map((c) => CATEGORY_LABELS[c]?.label || c).join(''),
    displaySize ?? undefined,
  ]
    .filter(Boolean)
    .join(' · ')

  // Most fund headlines already name the firm, so repeating it beside the
  // headline only steals width. firmLabelFor returns null in that case.
  const decodedTitle = decodeHtmlEntities(article.title)
  const showFirm = firmLabelFor(article.firmName, decodedTitle)

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
      {/* Headline-first (2026-08-30, Danny: "make it all more about the
          headlines"). The old Type and Size columns were reserving ~170px of
          every row for two mostly-empty cells — classification now trails the
          headline as quiet mono text, and the whole row is the hover-card
          trigger so the "Details" pill costs nothing either. */}
      <div
        onMouseEnter={handleRowEnter}
        onMouseMove={handleRowMove}
        onMouseLeave={handleRowLeave}
        className={cn(
          'hidden lg:grid group items-center gap-x-3 px-4 py-1.5 border-b border-border/40 hover:bg-accent/30 transition-colors grid-cols-[1fr_52px_128px]'
        )}
      >
        {/* Col 1: headline + trailing firm and classification */}
        <div className="flex items-baseline gap-2 min-w-0">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-semibold text-foreground leading-snug truncate hover:text-amber-400 transition-colors"
          >
            {decodedTitle}
          </a>
          {(showFirm || metaTrail) && (
            <span
              className="shrink-0 text-[10px] font-mono uppercase tracking-wide text-muted-foreground/50"
              title={sizeTooltip}
            >
              {showFirm && (
                <span className="font-semibold text-muted-foreground/70">{showFirm}</span>
              )}
              {showFirm && metaTrail ? ' · ' : ''}
              {metaTrail}
            </span>
          )}
        </div>

        {/* Col 2: Date */}
        <span className="text-[11px] text-muted-foreground/50 tabular-nums whitespace-nowrap">
          {article.publishedDate ? formatCompactTime(article.publishedDate, dateRange) : ''}
        </span>

        {/* Col 3: Source (+ cluster count as plain text, not a badge) */}
        <span className="text-[11px] text-muted-foreground/60 truncate">
          {article.sourceName || ''}
          {clusterSize && clusterSize > 1 && (
            <span className="text-muted-foreground/40"> +{clusterSize - 1}</span>
          )}
        </span>
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
          className="w-full text-left px-3 py-1.5 active:bg-accent/30 transition-colors"
        >
          {/* Row 1: headline — a thumb-scroll reads a column of titles, not a
              column of labels. */}
          <div className="flex items-start gap-1.5 min-w-0">
            <span className={cn(
              'min-w-0 flex-1 text-[13px] font-semibold text-foreground leading-snug',
              mobileExpanded ? 'line-clamp-none' : 'line-clamp-2'
            )}>
              {decodedTitle}
            </span>
            <ChevronDown className={cn('h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform mt-0.5', mobileExpanded && 'rotate-180')} />
          </div>

          {/* Row 2: firm + quiet classification + date. No logo indent to sit
              under any more, so this line starts at the row's left edge. */}
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[9.5px] font-mono uppercase tracking-wide text-muted-foreground/50 truncate">
              {showFirm && (
                <span className="font-semibold text-muted-foreground/80">{showFirm}</span>
              )}
              {showFirm && metaTrail ? ' · ' : ''}
              {metaTrail}
              {clusterSize && clusterSize > 1 ? ` · ${clusterSize} sources` : ''}
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground/50 tabular-nums whitespace-nowrap">
              {article.publishedDate ? formatCompactTime(article.publishedDate, dateRange) : ''}
            </span>
          </div>
        </button>

        {/* Expanded detail panel */}
        {mobileExpanded && (
          <div className="px-3 pb-3 space-y-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
            {/* Firm / Fund / Person details */}
            {(article.firmName || article.fundName || article.personName) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {article.firmName && (
                  <span><span className="text-muted-foreground/50">Firm:</span> <span className="font-medium text-foreground/80">{article.firmName}{article.coFirms.length > 0 ? ` · ${article.coFirms.join(' · ')}` : ''}</span></span>
                )}
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

            {/* Headline */}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-snug">
                {decodedTitle}
              </h3>
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
