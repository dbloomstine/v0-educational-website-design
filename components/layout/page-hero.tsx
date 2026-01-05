import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

/**
 * Props for the PageHero component
 */
export interface PageHeroProps {
  /** Main title (H1) */
  title: string
  /** Subtitle/description text */
  subtitle?: string
  /** Optional badge with icon and text */
  badge?: {
    icon?: LucideIcon
    text: string
  }
  /** Title size variant */
  titleSize?: 'default' | 'large'
  /** Text alignment */
  align?: 'center' | 'left'
  /** Background variant */
  background?: 'gradient-br' | 'gradient-b' | 'none'
  /** Additional children (e.g., buttons) after subtitle */
  children?: ReactNode
  /** Additional class names for the section */
  className?: string
}

/**
 * Reusable page hero section component
 *
 * Provides consistent hero sections across pages with:
 * - Gradient backgrounds
 * - Optional badge with icon
 * - Responsive typography
 * - Support for additional content (buttons, etc.)
 */
export function PageHero({
  title,
  subtitle,
  badge,
  titleSize = 'default',
  align = 'center',
  background = 'gradient-br',
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative border-b border-border overflow-hidden',
        className
      )}
    >
      {/* Background gradient */}
      {background !== 'none' && (
        <div
          className={cn(
            'absolute inset-0',
            background === 'gradient-br' && 'bg-gradient-to-br from-background via-background to-accent/20',
            background === 'gradient-b' && 'bg-gradient-to-b from-background to-accent/20'
          )}
        />
      )}

      <div className="container relative mx-auto px-4 py-24 lg:py-32">
        <div
          className={cn(
            'mx-auto max-w-3xl',
            align === 'center' && 'text-center'
          )}
        >
          {/* Badge */}
          {badge && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              {badge.icon && <badge.icon className="h-4 w-4" />}
              {badge.text}
            </div>
          )}

          {/* Title */}
          <h1
            className={cn(
              'mb-6 font-bold tracking-tight text-balance',
              titleSize === 'large' ? 'text-5xl lg:text-6xl' : 'text-5xl'
            )}
          >
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xl text-muted-foreground leading-relaxed text-balance">
              {subtitle}
            </p>
          )}

          {/* Additional content */}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  )
}
