'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, Menu } from 'lucide-react'
import { WaterfallOutput, formatCurrency, formatPercent, formatMultiple } from './waterfallCalculations'

// Skip to main content link for keyboard navigation
export function SkipToContent() {
  return (
    <a
      href="#waterfall-main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  )
}

// Screen reader announcements for calculation changes
export function LiveRegion({ output, isCalculating }: { output: WaterfallOutput | null; isCalculating: boolean }) {
  const [announcement, setAnnouncement] = useState('')
  const prevOutputRef = useRef<WaterfallOutput | null>(null)

  useEffect(() => {
    if (isCalculating) {
      setAnnouncement('Calculating waterfall distribution...')
      return
    }

    if (!output) return

    // Only announce if output has changed
    if (prevOutputRef.current && output !== prevOutputRef.current) {
      const summary = `Waterfall calculated. LP receives ${formatCurrency(output.totalToLPs)} with a ${formatMultiple(output.lpMultiple)} multiple. GP receives ${formatCurrency(output.totalToGP)}. Effective carry rate is ${formatPercent(output.effectiveCarryRate)}.`
      setAnnouncement(summary)
    }

    prevOutputRef.current = output
  }, [output, isCalculating])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}

// Scroll to top button for long pages
export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 rounded-full h-12 w-12 p-0 shadow-lg"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}

// Mobile-friendly section navigation
export function MobileSectionNav({
  sections,
  currentSection
}: {
  sections: { id: string; label: string }[]
  currentSection: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      element.focus()
    }
    setIsOpen(false)
  }

  return (
    <div className="lg:hidden fixed bottom-20 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-48 bg-background border border-border rounded-lg shadow-lg p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                currentSection === section.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full h-12 w-12 p-0 shadow-lg"
        aria-label="Section navigation"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  )
}

// High contrast mode toggle (respects system preference)
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    // Check for prefers-contrast media query
    const mediaQuery = window.matchMedia('(prefers-contrast: more)')
    setIsHighContrast(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isHighContrast
}

// Focus management for modal-like components
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement.focus()

    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return containerRef
}

// Keyboard shortcut hints
export function KeyboardShortcuts({ show }: { show: boolean }) {
  if (!show) return null

  const shortcuts = [
    { key: 'Tab', description: 'Navigate between inputs' },
    { key: 'Enter', description: 'Submit/Calculate' },
    { key: 'Escape', description: 'Close modal/dialog' },
    { key: '?', description: 'Show keyboard shortcuts' }
  ]

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border">
      <h3 className="font-medium mb-3 text-sm">Keyboard Shortcuts</h3>
      <div className="grid gap-2">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center gap-3 text-sm">
            <kbd className="px-2 py-1 rounded bg-background border border-border font-mono text-xs">
              {shortcut.key}
            </kbd>
            <span className="text-muted-foreground">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Reduced motion preference hook
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

// ARIA labels for waterfall tiers
export function getTierAriaLabel(tier: {
  tier: number
  name: string
  toLPs: number
  toGP: number
  total: number
}): string {
  return `Tier ${tier.tier}: ${tier.name}. Total distribution: ${formatCurrency(tier.total)}. To LPs: ${formatCurrency(tier.toLPs)}. To GP: ${formatCurrency(tier.toGP)}.`
}

// Responsive container with proper landmark structure
export function AccessibleLayout({
  children,
  title,
  description
}: {
  children: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <>
      <SkipToContent />
      <main
        id="waterfall-main-content"
        aria-labelledby="waterfall-title"
        className="container mx-auto px-4 py-8"
        tabIndex={-1}
      >
        <header className="mb-8">
          <h1 id="waterfall-title" className="text-3xl font-bold">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </header>
        {children}
      </main>
    </>
  )
}

// Mobile-responsive result cards
export function MobileResultsGrid({
  output,
  className = ''
}: {
  output: WaterfallOutput
  className?: string
}) {
  return (
    <div
      className={`grid gap-3 grid-cols-2 sm:grid-cols-4 ${className}`}
      role="region"
      aria-label="Waterfall results summary"
    >
      <div className="p-3 rounded-lg bg-card border border-border" role="group" aria-label="LP Distributions">
        <p className="text-xs text-muted-foreground">LP Gets</p>
        <p className="text-lg font-bold">{formatCurrency(output.totalToLPs)}</p>
        <p className="text-xs text-muted-foreground">{formatMultiple(output.lpMultiple)}</p>
      </div>
      <div className="p-3 rounded-lg bg-card border border-border" role="group" aria-label="GP Distributions">
        <p className="text-xs text-muted-foreground">GP Gets</p>
        <p className="text-lg font-bold text-primary">{formatCurrency(output.totalToGP)}</p>
        <p className="text-xs text-muted-foreground">{formatMultiple(output.gpMultiple)}</p>
      </div>
      <div className="p-3 rounded-lg bg-card border border-border" role="group" aria-label="Effective Carry">
        <p className="text-xs text-muted-foreground">Eff. Carry</p>
        <p className="text-lg font-bold">{formatPercent(output.effectiveCarryRate)}</p>
        <p className="text-xs text-muted-foreground">of profits</p>
      </div>
      <div className="p-3 rounded-lg bg-card border border-border" role="group" aria-label="Total Profit">
        <p className="text-xs text-muted-foreground">Profit</p>
        <p className="text-lg font-bold">{formatCurrency(output.totalProfit)}</p>
        <p className="text-xs text-muted-foreground">total</p>
      </div>
    </div>
  )
}

// Auto-save indicator
export function AutoSaveIndicator({ lastSaved }: { lastSaved: Date | null }) {
  if (!lastSaved) return null

  const timeAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
  const timeLabel = timeAgo < 60
    ? 'Just saved'
    : timeAgo < 3600
    ? `Saved ${Math.floor(timeAgo / 60)}m ago`
    : `Saved ${Math.floor(timeAgo / 3600)}h ago`

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
      <span>{timeLabel}</span>
    </div>
  )
}
