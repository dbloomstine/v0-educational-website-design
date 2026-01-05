'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Base glossary term interface
 */
export interface GlossaryTerm {
  id?: string
  term: string
  definition: string
  example?: string
  related?: string[]
  category?: string
}

/**
 * Category configuration with optional color
 */
export interface GlossaryCategoryConfig {
  label: string
  color?: string
}

/**
 * Props for the Glossary base component
 */
export interface GlossaryBaseProps {
  /** Array of glossary terms */
  terms: GlossaryTerm[]
  /** Title for the glossary section */
  title?: string
  /** Subtitle/description */
  subtitle?: string
  /** Category configuration mapping */
  categoryLabels?: Record<string, GlossaryCategoryConfig>
  /** Show search input */
  showSearch?: boolean
  /** Show category filter buttons */
  showCategoryFilter?: boolean
  /** Compact mode - shows fewer items, minimal UI */
  compact?: boolean
  /** Collapsible mode - wraps entire section in a collapsible */
  collapsible?: boolean
  /** Default collapsed state (only applies when collapsible=true) */
  defaultCollapsed?: boolean
  /** Show XP indicator when reading terms */
  showXpIndicator?: boolean
  /** XP amount to display */
  xpAmount?: number
  /** Callback when term is read */
  onTermRead?: (termId: string) => void
  /** Callback to close (for modal usage) */
  onClose?: () => void
  /** Enable clicking related terms to navigate */
  enableRelatedLinks?: boolean
  /** Number of items to show in compact mode */
  compactLimit?: number
  /** Sort terms alphabetically */
  sortAlphabetically?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Reusable Glossary component that supports multiple display modes:
 * - Full mode with search and category filters
 * - Compact mode for sidebar/preview
 * - Collapsible wrapper mode
 * - Related term navigation
 */
export function GlossaryBase({
  terms,
  title = 'Glossary',
  subtitle,
  categoryLabels,
  showSearch = true,
  showCategoryFilter = false,
  compact = false,
  collapsible = false,
  defaultCollapsed = true,
  showXpIndicator = false,
  xpAmount = 5,
  onTermRead,
  onClose,
  enableRelatedLinks = true,
  compactLimit = 8,
  sortAlphabetically = false,
  className
}: GlossaryBaseProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set())

  // Process terms with IDs
  const processedTerms = useMemo(() => {
    let result = terms.map(t => ({
      ...t,
      id: t.id || t.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }))

    if (sortAlphabetically) {
      result = result.sort((a, b) => a.term.localeCompare(b.term))
    }

    return result
  }, [terms, sortAlphabetically])

  // Get unique categories from terms
  const categories = useMemo(() => {
    if (!categoryLabels) return []
    const cats = new Set(processedTerms.map(t => t.category).filter(Boolean))
    return Array.from(cats) as string[]
  }, [processedTerms, categoryLabels])

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    let result = processedTerms

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        t =>
          t.term.toLowerCase().includes(term) ||
          t.definition.toLowerCase().includes(term)
      )
    }

    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory)
    }

    if (compact) {
      result = result.slice(0, compactLimit)
    }

    return result
  }, [processedTerms, searchTerm, selectedCategory, compact, compactLimit])

  const toggleTerm = (id: string) => {
    setExpandedTerms(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        onTermRead?.(id)
      }
      return next
    })
  }

  const handleRelatedClick = (relatedTerm: string) => {
    setSearchTerm(relatedTerm)
    const found = processedTerms.find(
      t => t.term.toLowerCase() === relatedTerm.toLowerCase()
    )
    if (found) {
      setExpandedTerms(new Set([found.id!]))
    }
  }

  // Get category badge color
  const getCategoryColor = (category: string): string => {
    return categoryLabels?.[category]?.color || 'bg-muted text-muted-foreground'
  }

  // Render XP indicator
  const renderXpIndicator = () => {
    if (!showXpIndicator) return null
    return (
      <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
        <Sparkles className="h-3 w-3" />
        <span>+{xpAmount} XP for learning this term!</span>
      </div>
    )
  }

  // Render the main content
  const renderContent = () => (
    <>
      {/* Search */}
      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Category filters */}
      {showCategoryFilter && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({processedTerms.length})
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryLabels?.[cat]?.label || cat} (
              {processedTerms.filter(t => t.category === cat).length})
            </Button>
          ))}
        </div>
      )}

      {/* Terms list */}
      {filteredTerms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No terms found{searchTerm && ` matching "${searchTerm}"`}</p>
        </div>
      ) : compact && !showSearch ? (
        // Simple list for compact collapsible mode
        <div className="space-y-4">
          {filteredTerms.map(item => (
            <div
              key={item.id}
              className="pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <dt className="font-semibold text-sm text-foreground mb-1">
                {item.term}
              </dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">
                {item.definition}
              </dd>
            </div>
          ))}
        </div>
      ) : (
        // Expandable list
        <div className={cn('space-y-3', compact && 'max-h-[300px] overflow-y-auto')}>
          {filteredTerms.map(item => {
            const isExpanded = expandedTerms.has(item.id!)
            return (
              <motion.div
                key={item.id}
                layout
                className="rounded-lg border border-border bg-background overflow-hidden"
              >
                <button
                  onClick={() => toggleTerm(item.id!)}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-foreground">
                          {item.term}
                        </h4>
                        {categoryLabels && item.category && (
                          <Badge
                            variant="secondary"
                            className={getCategoryColor(item.category)}
                          >
                            {categoryLabels[item.category]?.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.definition}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 space-y-3 border-t border-border pt-3"
                    >
                      <p className="text-sm text-foreground">{item.definition}</p>

                      {item.example && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Example:
                          </p>
                          <p className="text-sm text-foreground">{item.example}</p>
                        </div>
                      )}

                      {enableRelatedLinks && item.related && item.related.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Related terms:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.related.map(related => (
                              <button
                                key={related}
                                onClick={e => {
                                  e.stopPropagation()
                                  handleRelatedClick(related)
                                }}
                                className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              >
                                {related}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {renderXpIndicator()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Stats */}
      {!compact && (
        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredTerms.length} of {processedTerms.length} terms
          </p>
        </div>
      )}
    </>
  )

  // Compact mode rendering
  if (compact && showSearch) {
    return (
      <Card className={cn('border-border', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Quick Reference</CardTitle>
          </div>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    )
  }

  // Collapsible mode rendering
  if (collapsible) {
    return (
      <Card className={cn('border-muted', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              {subtitle && (
                <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
              )}
              {renderContent()}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  // Full mode rendering
  return (
    <Card className={cn('border-border', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className={cn(onClose && 'max-h-[500px] overflow-y-auto')}>
        {renderContent()}
      </CardContent>
    </Card>
  )
}

/**
 * Helper function to look up a term by name
 */
export function findGlossaryTerm(
  terms: GlossaryTerm[],
  termName: string
): GlossaryTerm | undefined {
  return terms.find(
    t =>
      t.term.toLowerCase() === termName.toLowerCase() ||
      t.term.toLowerCase().includes(termName.toLowerCase())
  )
}
