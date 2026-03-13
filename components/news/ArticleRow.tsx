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
      {/* Grid row: event | categories+size | headline | source | time */}
      <div
        onMouseEnter={handleRowEnter}
        onMouseMove={handleRowMove}
        onMouseLeave={handleRowLeave}
        className="grid items-center gap-x-2 px-4 py-2.5 border-b border-border/40 hover:bg-accent/30 transition-colors cursor-default grid-cols-[52px_140px_1fr_50px] lg:grid-cols-[52px_190px_1fr_180px_50px]"
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

        {/* Col 2: Category badges + fund size */}
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
          {fundSize && (
            <span className="inline-flex rounded bg-muted/60 px-1.5 py-0.5 text-[11px] font-mono font-medium leading-none text-muted-foreground whitespace-nowrap">
              {fundSize}
            </span>
          )}
        </div>

        {/* Col 3: Headline */}
        <span className="text-[14px] font-medium text-foreground leading-snug truncate">
          {decodeHtmlEntities(article.title)}
        </span>

        {/* Col 4: Source name — only visible on lg+ */}
        <span className="hidden lg:block text-[12px] text-muted-foreground/60 truncate text-right">
          {article.sourceName || ''}
        </span>

        {/* Col 5: Time */}
        <span className="text-[12px] text-muted-foreground/50 text-right tabular-nums whitespace-nowrap">
          {article.publishedDate ? formatCompactTime(article.publishedDate) : ''}
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

            {/* Headline */}
            <h3 className="text-sm font-semibold text-foreground leading-snug">
              {decodeHtmlEntities(article.title)}
            </h3>

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
