"use client"

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Skip to main content link
interface SkipLinkProps {
  targetId: string
  className?: string
}

export function SkipLink({ targetId, className }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        className
      )}
    >
      Skip to main content
    </a>
  )
}

// Visually hidden text for screen readers
interface VisuallyHiddenProps {
  children: React.ReactNode
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

// Live region for announcing changes to screen readers
interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  className?: string
}

export function LiveRegion({ message, priority = 'polite', className }: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  )
}

// Hook for announcing messages to screen readers
export function useAnnounce() {
  const [message, setMessage] = useState('')

  const announce = useCallback((text: string) => {
    setMessage('')
    // Small delay to ensure the change is detected
    requestAnimationFrame(() => {
      setMessage(text)
    })
  }, [])

  return { message, announce }
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  items: string[],
  onSelect: (item: string) => void,
  options?: { vertical?: boolean; loop?: boolean }
) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const { vertical = true, loop = true } = options || {}

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const upKey = vertical ? 'ArrowUp' : 'ArrowLeft'
    const downKey = vertical ? 'ArrowDown' : 'ArrowRight'

    switch (e.key) {
      case upKey:
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev === 0) return loop ? items.length - 1 : 0
          return prev - 1
        })
        break
      case downKey:
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev === items.length - 1) return loop ? 0 : items.length - 1
          return prev + 1
        })
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(items[focusedIndex])
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(items.length - 1)
        break
    }
  }, [items, focusedIndex, onSelect, vertical, loop])

  return { focusedIndex, setFocusedIndex, handleKeyDown }
}

// Focus trap for modals and dialogs
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTab)
    firstFocusable?.focus()

    return () => {
      container.removeEventListener('keydown', handleTab)
    }
  }, [isActive, containerRef])
}

// Reduced motion preference
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return reducedMotion
}

// High contrast mode detection
export function useHighContrast() {
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)')
    setHighContrast(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return highContrast
}

// Accessible loading state
interface LoadingStateProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingState({ isLoading, loadingText = 'Loading...', children }: LoadingStateProps) {
  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">{loadingText}</span>
        {/* Visual loading indicator */}
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Accessible form field wrapper
interface AccessibleFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function AccessibleField({
  id,
  label,
  error,
  hint,
  required,
  children,
  className
}: AccessibleFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      <div aria-describedby={describedBy}>
        {children}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible data table
interface AccessibleTableProps {
  caption: string
  headers: string[]
  rows: (string | number)[][]
  className?: string
}

export function AccessibleTable({ caption, headers, rows, className }: AccessibleTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)} role="region" aria-label={caption}>
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b">
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-sm"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Color contrast checker utility
export function checkContrast(foreground: string, background: string): { ratio: number; passes: { aa: boolean; aaa: boolean } } {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  // Calculate relative luminance
  const luminance = (rgb: { r: number; g: number; b: number }) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = luminance(hexToRgb(foreground))
  const l2 = luminance(hexToRgb(background))
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

  return {
    ratio,
    passes: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7
    }
  }
}

// Focus indicator component
interface FocusRingProps {
  children: React.ReactNode
  className?: string
}

export function FocusRing({ children, className }: FocusRingProps) {
  return (
    <div
      className={cn(
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 rounded-md",
        className
      )}
    >
      {children}
    </div>
  )
}

// Progress announcement for screen readers
interface ProgressAnnouncerProps {
  current: number
  total: number
  label: string
}

export function ProgressAnnouncer({ current, total, label }: ProgressAnnouncerProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      <div className="sr-only">
        {label}: {percentage}% complete, step {current} of {total}
      </div>
      {/* Visual progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
