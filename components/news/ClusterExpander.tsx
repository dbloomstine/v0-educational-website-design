'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
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
  const sources = uniqueSources.slice(0, 4)
  const extraCount = uniqueSources.length - sources.length

  return (
    <div>
      {/* Collapsed indicator row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-1.5 px-4 py-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 transition-colors border-b border-border/50',
          expanded && 'bg-muted/20'
        )}
      >
        <ChevronRight
          className={cn('h-3 w-3 transition-transform shrink-0', expanded && 'rotate-90')}
        />
        <span>
          +{relatedArticles.length} more
          {sources.length > 0 && (
            <> from {sources.join(', ')}{extraCount > 0 && `, +${extraCount}`}</>
          )}
        </span>
      </button>

      {/* Expanded related articles */}
      {expanded && (
        <div className="border-l-2 border-muted-foreground/10 ml-3">
          {relatedArticles.map((article) => (
            <ArticleRow key={article.id} article={article} dateRange={dateRange} />
          ))}
        </div>
      )}
    </div>
  )
}
