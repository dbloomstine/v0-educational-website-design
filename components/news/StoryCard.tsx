'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, Newspaper, Zap, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Story } from '@/lib/news/types'

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  fund_launch: { label: 'Launch', color: 'bg-red-900/50 text-red-300 border-red-800' },
  fund_close: { label: 'Close', color: 'bg-red-900/50 text-red-300 border-red-800' },
  capital_raise: { label: 'Raise', color: 'bg-orange-900/50 text-orange-300 border-orange-800' },
  executive_hire: { label: 'Hire', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  executive_change: { label: 'Exec Change', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  acquisition: { label: 'M&A', color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  regulatory_action: { label: 'Regulatory', color: 'bg-amber-900/50 text-amber-300 border-amber-800' },
  market_commentary: { label: 'Market', color: 'bg-muted text-muted-foreground border-border' },
  press_release: { label: 'Press', color: 'bg-muted text-muted-foreground border-border' },
}

const CATEGORY_COLORS: Record<string, string> = {
  PE: 'bg-indigo-900/50 text-indigo-300',
  VC: 'bg-emerald-900/50 text-emerald-300',
  credit: 'bg-amber-900/50 text-amber-300',
  hedge: 'bg-purple-900/50 text-purple-300',
  real_estate: 'bg-orange-900/50 text-orange-300',
  infrastructure: 'bg-sky-900/50 text-sky-300',
  secondaries: 'bg-rose-900/50 text-rose-300',
  gp_stakes: 'bg-teal-900/50 text-teal-300',
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

function formatFundSize(usd: number | null): string | null {
  if (!usd) return null
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  return `$${usd.toLocaleString()}`
}

function formatRelativeDate(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

interface StoryCardProps {
  story: Story
  featured?: boolean
}

export function StoryCard({ story, featured = false }: StoryCardProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false)

  const eventLabel = story.eventType ? EVENT_LABELS[story.eventType] : null
  const fundSize = formatFundSize(story.maxFundSizeUsd)
  const hasMultipleSources = story.articleCount > 1

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card transition-colors',
        story.isHighSignal ? 'border-red-800/50' : 'border-border',
        'hover:border-accent/50'
      )}
    >
      <div className={cn('p-4', featured && 'p-5')}>
        {/* Badges row */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {story.isHighSignal && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-800 bg-red-900/50 px-2 py-0.5 text-xs font-medium text-red-300">
              <Zap className="h-3 w-3" />
              Signal
            </span>
          )}
          {eventLabel && (
            <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', eventLabel.color)}>
              {eventLabel.label}
            </span>
          )}
          {story.fundCategories.map((cat) => (
            <span
              key={cat}
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                CATEGORY_COLORS[cat] || 'bg-muted text-muted-foreground'
              )}
            >
              {cat.replace('_', ' ')}
            </span>
          ))}
          {fundSize && (
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {fundSize}
            </span>
          )}
        </div>

        {/* Headline — links to story detail */}
        <Link href={`/news/story/${story.id}`} className="block">
          <h3
            className={cn(
              'font-semibold text-foreground group-hover:text-blue-400 transition-colors leading-snug',
              featured ? 'text-xl' : 'text-base'
            )}
          >
            {decodeHtmlEntities(story.headline)}
          </h3>
        </Link>

        {/* Summary */}
        {story.summary && (
          <p className={cn('mt-2 text-muted-foreground leading-relaxed line-clamp-3', featured ? 'text-sm' : 'text-sm')}>
            {decodeHtmlEntities(story.summary)}
          </p>
        )}

        {/* Firm chips */}
        {story.firmChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {story.firmChips.map((firm) => (
              <span
                key={firm.slug}
                className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {firm.name}
              </span>
            ))}
          </div>
        )}

        {/* Source count + date row */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Newspaper className="h-3 w-3" />
              {story.articleCount} {story.articleCount === 1 ? 'source' : 'sources'}
            </span>
            {story.sourceNames.length > 0 && (
              <span className="truncate max-w-[200px]">
                {story.sourceNames.slice(0, 3).join(', ')}
                {story.sourceNames.length > 3 && ` +${story.sourceNames.length - 3}`}
              </span>
            )}
          </div>
          <span className="shrink-0">{formatRelativeDate(story.lastUpdated)}</span>
        </div>

        {/* Expandable source list for multi-source stories */}
        {hasMultipleSources && (
          <div className="mt-3 border-t border-border pt-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                setSourcesExpanded(!sourcesExpanded)
              }}
              className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{sourcesExpanded ? 'Hide sources' : `View ${story.articleCount} sources`}</span>
              {sourcesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {sourcesExpanded && (
              <ul className="mt-2 space-y-1.5">
                {story.articles.map((article) => (
                  <li key={article.id} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 font-medium text-muted-foreground">
                      {article.sourceName || 'Unknown'}
                    </span>
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-muted-foreground hover:text-foreground transition-colors truncate inline-flex items-center gap-1"
                    >
                      {decodeHtmlEntities(article.title)}
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
