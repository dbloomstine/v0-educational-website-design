'use client'

import { useState } from 'react'
import { ChevronRight, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ArticleRow } from './ArticleRow'
import type { NewsArticle } from '@/lib/news/types'

interface ClusterExpanderProps {
  relatedArticles: NewsArticle[]
  clusterSize: number
  dateRange?: string
}

export function ClusterExpander({ relatedArticles, clusterSize, dateRange }: ClusterExpanderProps) {
  const [expanded, setExpanded] = useState(false)

  if (relatedArticles.length === 0) return null

  // Build deduplicated source list for the collapsed summary
  const uniqueSources = [...new Set(relatedArticles.map((a) => a.sourceName).filter(Boolean))]
  const sources = uniqueSources.slice(0, 3)
  const extraCount = uniqueSources.length - sources.length

  return (
    <div>
      {/* Collapsed indicator row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-1.5 text-[11px] hover:bg-muted/30 transition-colors border-b border-border/50',
          expanded ? 'bg-muted/20 text-muted-foreground' : 'text-muted-foreground/50'
        )}
      >
        <ChevronRight
          className={cn('h-3 w-3 transition-transform shrink-0', expanded && 'rotate-90')}
        />
        <Newspaper className="h-3 w-3 shrink-0 opacity-50" />
        <span>
          <span className="font-medium">{relatedArticles.length} more {relatedArticles.length === 1 ? 'source' : 'sources'}</span>
          {sources.length > 0 && (
            <span className="opacity-60">
              {' '}— {sources.join(', ')}{extraCount > 0 ? `, +${extraCount}` : ''}
            </span>
          )}
        </span>
      </button>

      {/* Expanded related articles */}
      {expanded && (
        <div className="bg-muted/10 border-l-2 border-muted-foreground/20 ml-4">
          <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-muted-foreground/40 font-medium">
            Also covering this story
          </div>
          {relatedArticles.map((article) => (
            <ArticleRow key={article.id} article={article} dateRange={dateRange} />
          ))}
        </div>
      )}
    </div>
  )
}
