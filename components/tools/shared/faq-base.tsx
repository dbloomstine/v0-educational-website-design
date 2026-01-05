'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Search,
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Base FAQ item interface
 */
export interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
}

/**
 * Category configuration
 */
export interface FAQCategoryConfig {
  label: string
  description?: string
}

/**
 * Props for the FAQ base component
 */
export interface FAQBaseProps {
  /** Array of FAQ items */
  items: FAQItem[]
  /** Title for the FAQ section */
  title?: string
  /** Subtitle/description */
  subtitle?: string
  /** Category configuration mapping */
  categoryLabels?: Record<string, FAQCategoryConfig>
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
  /** Show XP indicator when reading answers */
  showXpIndicator?: boolean
  /** XP amount to display */
  xpAmount?: number
  /** Callback when FAQ is read */
  onFaqRead?: (faqId: string) => void
  /** Callback to close (for modal usage) */
  onClose?: () => void
  /** Variant for expand/collapse icon style */
  iconVariant?: 'chevron' | 'plus-minus'
  /** Use accordion (single open) vs multi-expand */
  accordionMode?: boolean
  /** Number of items to show in compact mode */
  compactLimit?: number
  /** Additional class names */
  className?: string
}

/**
 * Reusable FAQ component that supports multiple display modes:
 * - Full mode with search and category filters
 * - Compact mode for sidebar/preview
 * - Collapsible wrapper mode
 * - Accordion (single open) or multi-expand modes
 */
export function FAQBase({
  items,
  title = 'Frequently Asked Questions',
  subtitle,
  categoryLabels,
  showSearch = false,
  showCategoryFilter = false,
  compact = false,
  collapsible = false,
  defaultCollapsed = true,
  showXpIndicator = false,
  xpAmount = 10,
  onFaqRead,
  onClose,
  iconVariant = 'chevron',
  accordionMode = false,
  compactLimit = 5,
  className
}: FAQBaseProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [accordionValue, setAccordionValue] = useState<string>('')

  // Get unique categories from items
  const categories = useMemo(() => {
    if (!categoryLabels) return []
    const cats = new Set(items.map(item => item.category).filter(Boolean))
    return Array.from(cats) as string[]
  }, [items, categoryLabels])

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let result = items

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        item =>
          item.question.toLowerCase().includes(term) ||
          item.answer.toLowerCase().includes(term)
      )
    }

    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory)
    }

    if (compact) {
      result = result.slice(0, compactLimit)
    }

    return result
  }, [items, searchTerm, selectedCategory, compact, compactLimit])

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        onFaqRead?.(id)
      }
      return next
    })
  }

  const handleAccordionChange = (value: string) => {
    setAccordionValue(value)
    if (value) {
      onFaqRead?.(value)
    }
  }

  // Render the expand/collapse icon
  const renderIcon = (isExpanded: boolean) => {
    if (iconVariant === 'plus-minus') {
      return isExpanded ? (
        <Minus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      ) : (
        <Plus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      )
    }
    return isExpanded ? (
      <ChevronDown className="h-5 w-5 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    )
  }

  // Render XP indicator
  const renderXpIndicator = () => {
    if (!showXpIndicator) return null
    return (
      <div className="flex items-center gap-1 mt-3 text-xs text-amber-600 dark:text-amber-400">
        <Sparkles className="h-3 w-3" />
        <span>+{xpAmount} XP for reading this answer!</span>
      </div>
    )
  }

  // Render FAQ list in accordion mode
  const renderAccordionList = () => (
    <Accordion
      type="single"
      collapsible
      value={accordionValue}
      onValueChange={handleAccordionChange}
      className="space-y-2"
    >
      {filteredItems.map(item => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="border rounded-lg px-4 bg-background"
        >
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex-1 pr-4">
              <p className="font-medium text-foreground">{item.question}</p>
              {categoryLabels && item.category && (
                <p className="text-xs text-muted-foreground mt-1">
                  {categoryLabels[item.category]?.label}
                </p>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
            {renderXpIndicator()}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )

  // Render FAQ list in multi-expand mode
  const renderExpandList = () => (
    <div className="space-y-2">
      {filteredItems.map(item => {
        const isExpanded = expandedItems.has(item.id)
        return (
          <motion.div
            key={item.id}
            layout
            className="border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-start justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="font-medium pr-4">{item.question}</span>
              </div>
              <div className="flex-shrink-0 ml-2">
                {renderIcon(isExpanded)}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="pl-8">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                    {renderXpIndicator()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )

  // Render the main content
  const renderContent = () => (
    <>
      {/* Search */}
      {showSearch && !compact && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Category filters */}
      {showCategoryFilter && categories.length > 0 && !compact && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryLabels?.[cat]?.label || cat}
            </Button>
          ))}
        </div>
      )}

      {/* FAQ List */}
      {filteredItems.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No questions found{searchTerm && ` matching "${searchTerm}"`}
        </p>
      ) : accordionMode ? (
        renderAccordionList()
      ) : (
        renderExpandList()
      )}

      {/* Stats */}
      {!compact && (
        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredItems.length} of {items.length} questions
          </p>
        </div>
      )}
    </>
  )

  // Compact mode rendering
  if (compact) {
    return (
      <Card className={cn('border-border', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Common Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {filteredItems.map(item => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
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
                  <HelpCircle className="h-5 w-5 text-primary" />
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
            <CardContent className="border-t pt-4">{renderContent()}</CardContent>
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
            <MessageCircle className="h-6 w-6 text-primary" />
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
