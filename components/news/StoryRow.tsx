'use client'

import { ExternalLink, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FirmLogo } from './FirmLogo'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import {
  EVENT_LABELS,
  CATEGORY_LABELS,
  decodeHtmlEntities,
  formatFundSize,
  formatCompactTime,
  formatRelativeDate,
} from '@/lib/news/constants'
import type { Story } from '@/lib/news/types'

interface StoryRowProps {
  story: Story
}

export function StoryRow({ story }: StoryRowProps) {
  const eventLabel = story.eventType ? EVENT_LABELS[story.eventType] : null
  const fundSize = formatFundSize(story.maxFundSizeUsd)

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 border-b border-border/40 hover:bg-accent/30 transition-colors group cursor-default'
          )}
        >
          {/* Event type badge */}
          {eventLabel ? (
            <span
              className={cn(
                'shrink-0 inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none',
                eventLabel.color
              )}
            >
              {eventLabel.short}
            </span>
          ) : (
            <span className="shrink-0 w-[42px]" />
          )}

          {/* Category badges (max 2) */}
          <div className="shrink-0 flex items-center gap-1">
            {story.fundCategories.slice(0, 2).map((cat) => {
              const catInfo = CATEGORY_LABELS[cat]
              return (
                <span
                  key={cat}
                  className={cn(
                    'inline-flex rounded px-1 py-0.5 text-[10px] font-medium leading-none',
                    catInfo?.color || 'bg-muted text-muted-foreground'
                  )}
                >
                  {catInfo?.label || cat}
                </span>
              )
            })}
          </div>

          {/* Fund size */}
          {fundSize && (
            <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
              {fundSize}
            </span>
          )}

          {/* Headline — plain text, no link */}
          <span className="flex-1 min-w-0 text-[13px] font-medium text-foreground truncate">
            {decodeHtmlEntities(story.headline)}
          </span>

          {/* Firm chips (max 2) */}
          {story.firmChips.length > 0 && (
            <div className="hidden md:flex shrink-0 items-center gap-1">
              {story.firmChips.slice(0, 2).map((firm) => (
                <span
                  key={firm.slug}
                  className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  <FirmLogo name={firm.name} logoUrl={firm.logoUrl} size={12} />
                  <span className="max-w-[80px] truncate">{firm.name}</span>
                </span>
              ))}
              {story.firmChips.length > 2 && (
                <span className="text-[10px] text-muted-foreground/50">
                  +{story.firmChips.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Source */}
          <span className="hidden lg:block shrink-0 w-[100px] text-[11px] text-muted-foreground/60 truncate text-right">
            {story.articleCount > 1
              ? `${story.articleCount} sources`
              : story.sourceNames[0] || ''}
          </span>

          {/* Time */}
          <span className="shrink-0 w-[36px] text-[11px] text-muted-foreground/50 text-right tabular-nums">
            {formatCompactTime(story.lastUpdated)}
          </span>
        </div>
      </HoverCardTrigger>

      {/* Hover preview card */}
      <HoverCardContent side="right" align="start" sideOffset={8} className="w-[420px] p-0">
        <div className="p-4 space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {eventLabel && (
              <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', eventLabel.color)}>
                {eventLabel.label}
              </span>
            )}
            {story.fundCategories.map((cat) => {
              const catInfo = CATEGORY_LABELS[cat]
              return (
                <span
                  key={cat}
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                    catInfo?.color || 'bg-muted text-muted-foreground'
                  )}
                >
                  {catInfo?.label || cat}
                </span>
              )
            })}
            {fundSize && (
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {fundSize}
              </span>
            )}
          </div>

          {/* Headline */}
          <h3 className="text-sm font-semibold text-foreground leading-snug">
            {decodeHtmlEntities(story.headline)}
          </h3>

          {/* Summary */}
          {story.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {decodeHtmlEntities(story.summary)}
            </p>
          )}

          {/* Firm chips */}
          {story.firmChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {story.firmChips.map((firm) => (
                <span
                  key={firm.slug}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  <FirmLogo name={firm.name} logoUrl={firm.logoUrl} size={12} />
                  {firm.name}
                </span>
              ))}
            </div>
          )}

          {/* Sources + time */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 border-t border-border/50 pt-2">
            <div className="flex items-center gap-1.5">
              <Newspaper className="h-3 w-3" />
              <span>
                {story.articleCount} {story.articleCount === 1 ? 'source' : 'sources'}
                {story.sourceNames.length > 0 && ` — ${story.sourceNames.slice(0, 3).join(', ')}`}
              </span>
            </div>
            <span>{formatRelativeDate(story.lastUpdated)}</span>
          </div>

          {/* Source links — show all, these are the primary click-through */}
          {story.articles.length > 0 && (
            <div className="space-y-1.5">
              {story.articles.map((article) => (
                <a
                  key={article.id}
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 text-[11px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="shrink-0 font-semibold">{article.sourceName || 'Source'}</span>
                  <span className="truncate opacity-60">{decodeHtmlEntities(article.title)}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
