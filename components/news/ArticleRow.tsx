'use client'

import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink } from 'lucide-react'
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
  const [imgError, setImgError] = useState(false)

  // If we have a domain, fetch the favicon via Google's reliable service
  if (domain && !imgError) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
        alt=""
        className="rounded-full object-contain bg-white shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    )
  }

  // Fallback: letter initial from firmName, or sourceName if no firm
  const displayName = firmName || sourceName || '?'
  const initial = displayName[0].toUpperCase()
  return (
    <div
      className={cn('rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', getInitialColor(displayName))}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  )
}

// ─── Article Row ─────────────────────────────────────────────────────────────

interface ArticleRowProps {
  article: NewsArticle
}

export function ArticleRow({ article }: ArticleRowProps) {
  const eventLabel = article.eventType ? EVENT_LABELS[article.eventType] : null
  const fundSize = formatFundSize(article.fundSizeUsd)

  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

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
      {/* Grid row: type | category | size | headline | date | source */}
      <div
        onMouseEnter={handleRowEnter}
        onMouseMove={handleRowMove}
        onMouseLeave={handleRowLeave}
        className={cn(
          'grid items-center gap-x-2 px-4 py-2.5 border-b border-border/40 hover:bg-accent/30 transition-colors cursor-default grid-cols-[56px_140px_1fr_56px] lg:grid-cols-[56px_140px_72px_1fr_56px_150px]',
          article.isHighSignal && 'border-l-2 border-l-amber-500/70'
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

        {/* Col 3: Fund size — lg only */}
        <span className="hidden lg:block text-[11px] font-mono font-medium text-muted-foreground whitespace-nowrap">
          {fundSize || ''}
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

        {/* Col 5: Date */}
        <span className="text-[11px] text-muted-foreground/50 tabular-nums whitespace-nowrap">
          {article.publishedDate ? formatCompactTime(article.publishedDate) : ''}
        </span>

        {/* Col 6: Source name — lg only, left-aligned */}
        <span className="hidden lg:block text-[12px] text-muted-foreground/60 truncate">
          {article.sourceName || ''}
        </span>
      </div>

      {/* Hover preview card — portaled, positioned near cursor */}
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
              {fundSize && (
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {fundSize}
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
            <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 border-t border-border/50 pt-2">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                <span className="font-semibold">{article.sourceName || 'Source'}</span>
              </a>
              <span>{article.publishedDate ? formatRelativeDate(article.publishedDate) : ''}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
