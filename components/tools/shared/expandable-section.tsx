'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExpandableSectionProps {
  /** Unique identifier for the section */
  id: string
  /** Section title */
  title: string
  /** Description shown when collapsed */
  description?: string
  /** Description shown when expanded (defaults to "Click here to collapse") */
  expandedDescription?: string
  /** Icon component to display */
  icon?: LucideIcon
  /** Whether the section is expanded */
  isExpanded: boolean
  /** Callback when section is toggled */
  onToggle: () => void
  /** Content to render inside the expandable area */
  children: ReactNode
  /** Additional class names for the container */
  className?: string
  /** Whether to make header sticky when expanded */
  stickyHeader?: boolean
  /** Custom icon color class (default: text-primary) */
  iconClassName?: string
}

/**
 * Reusable expandable/collapsible section component
 * Used across tools for FAQ, Glossary, What-If Analysis, etc.
 *
 * Features:
 * - Full accessibility support (aria-expanded, aria-controls, aria-label)
 * - Smooth expand/collapse animation
 * - Consistent styling across all tools
 * - Optional sticky header when expanded
 */
export function ExpandableSection({
  id,
  title,
  description,
  expandedDescription = 'Click here to collapse',
  icon: Icon,
  isExpanded,
  onToggle,
  children,
  className,
  stickyHeader = true,
  iconClassName = 'text-primary'
}: ExpandableSectionProps) {
  const contentId = `${id}-content`
  const currentDescription = isExpanded ? expandedDescription : description

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-label={`Toggle ${title.toLowerCase()} section`}
        className={cn(
          'flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isExpanded && stickyHeader && 'sticky top-0 z-10 shadow-sm'
        )}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon className={cn('h-5 w-5', iconClassName)} aria-hidden="true" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {currentDescription && (
              <p className="text-sm text-muted-foreground">{currentDescription}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="region"
            aria-label={title}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Simplified wrapper that works with useExpandableSections hook
 */
export interface ExpandableSectionGroupProps {
  sections: {
    id: string
    title: string
    description?: string
    expandedDescription?: string
    icon?: LucideIcon
    content: ReactNode
    iconClassName?: string
  }[]
  expandedSections: Record<string, boolean>
  onToggle: (id: string) => void
  className?: string
  stickyHeaders?: boolean
}

export function ExpandableSectionGroup({
  sections,
  expandedSections,
  onToggle,
  className,
  stickyHeaders = true
}: ExpandableSectionGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {sections.map((section) => (
        <ExpandableSection
          key={section.id}
          id={section.id}
          title={section.title}
          description={section.description}
          expandedDescription={section.expandedDescription}
          icon={section.icon}
          isExpanded={!!expandedSections[section.id]}
          onToggle={() => onToggle(section.id)}
          stickyHeader={stickyHeaders}
          iconClassName={section.iconClassName}
        >
          {section.content}
        </ExpandableSection>
      ))}
    </div>
  )
}
