import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Props for the SectionCTA component
 */
export interface SectionCTAProps {
  /** Section title (H2) */
  title: string
  /** Description text */
  description?: string
  /** Small note text (appears after children) */
  note?: string
  /** Background variant */
  background?: 'default' | 'accent' | 'gradient'
  /** Show top border */
  showBorder?: boolean
  /** Max width for content */
  maxWidth?: 'sm' | 'md' | 'lg'
  /** Children (typically buttons) */
  children?: ReactNode
  /** Additional class names */
  className?: string
}

/**
 * Reusable call-to-action section component
 *
 * Provides consistent CTA sections at the bottom of pages with:
 * - Centered text layout
 * - Multiple background variants
 * - Optional description
 * - Flexible content area for buttons
 */
export function SectionCTA({
  title,
  description,
  note,
  background = 'default',
  showBorder = true,
  maxWidth = 'md',
  children,
  className,
}: SectionCTAProps) {
  return (
    <section
      className={cn(
        'py-16',
        showBorder && 'border-t border-border',
        background === 'accent' && 'bg-accent/10',
        background === 'gradient' && 'bg-gradient-to-b from-accent/10 to-background',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'mx-auto text-center',
            maxWidth === 'sm' && 'max-w-xl',
            maxWidth === 'md' && 'max-w-2xl',
            maxWidth === 'lg' && 'max-w-3xl'
          )}
        >
          <h2 className="text-2xl font-bold tracking-tight mb-4">{title}</h2>
          {description && (
            <p className="text-muted-foreground mb-8">{description}</p>
          )}
          {children && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {children}
            </div>
          )}
          {note && (
            <p className="mt-4 text-sm text-muted-foreground">{note}</p>
          )}
        </div>
      </div>
    </section>
  )
}
