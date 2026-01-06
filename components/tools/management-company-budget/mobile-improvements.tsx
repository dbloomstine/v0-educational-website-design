"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Menu,
  ChevronUp,
  Maximize2,
  Minimize2,
  Home
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Hook to detect mobile viewport
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

// Scroll to top button for mobile
interface ScrollToTopProps {
  className?: string
}

export function ScrollToTop({ className }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-20 right-4 z-40 rounded-full shadow-lg",
        "bg-primary/90 hover:bg-primary",
        className
      )}
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  )
}

// Mobile navigation tabs
interface MobileNavTab {
  id: string
  label: string
  icon: typeof Home
}

interface MobileNavProps {
  tabs: MobileNavTab[]
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

export function MobileNav({ tabs, activeTab, onTabChange, className }: MobileNavProps) {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t",
        "safe-area-bottom",
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Collapsible section for mobile
interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function CollapsibleSection({ title, children, defaultOpen = false, className }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "bg-muted/50 hover:bg-muted/70 transition-colors",
          "text-left font-medium"
        )}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronUp
          className={cn(
            "h-4 w-4 transition-transform",
            !isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="p-4 border-t">
          {children}
        </div>
      )}
    </div>
  )
}

// Full-screen mode for charts on mobile
interface FullscreenWrapperProps {
  children: React.ReactNode
  title: string
  className?: string
}

export function FullscreenWrapper({ children, title, className }: FullscreenWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isMobile = useIsMobile()

  if (!isMobile) {
    return <>{children}</>
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            aria-label="Exit fullscreen"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8"
        onClick={() => setIsFullscreen(true)}
        aria-label="View fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      {children}
    </div>
  )
}

// Responsive grid wrapper
interface ResponsiveGridProps {
  children: React.ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className
}: ResponsiveGridProps) {
  const gridClasses = cn(
    "grid",
    columns.mobile === 1 && "grid-cols-1",
    columns.mobile === 2 && "grid-cols-2",
    columns.tablet === 2 && "md:grid-cols-2",
    columns.tablet === 3 && "md:grid-cols-3",
    columns.desktop === 2 && "lg:grid-cols-2",
    columns.desktop === 3 && "lg:grid-cols-3",
    columns.desktop === 4 && "lg:grid-cols-4",
    `gap-${gap}`,
    className
  )

  return <div className={gridClasses}>{children}</div>
}

// Touch-friendly number input
interface TouchNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  prefix?: string
  suffix?: string
  className?: string
}

export function TouchNumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  label,
  prefix,
  suffix,
  className
}: TouchNumberInputProps) {
  const increment = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={value <= min}
          className="h-12 w-12 flex-shrink-0"
          aria-label={`Decrease ${label}`}
        >
          -
        </Button>
        <div className="flex-1 text-center py-3 px-4 bg-muted rounded-lg font-mono text-lg">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={value >= max}
          className="h-12 w-12 flex-shrink-0"
          aria-label={`Increase ${label}`}
        >
          +
        </Button>
      </div>
    </div>
  )
}

// Swipeable tabs for mobile
interface SwipeableTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[]
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

export function SwipeableTabs({ tabs, activeTab, onTabChange, className }: SwipeableTabsProps) {
  const activeIndex = tabs.findIndex(t => t.id === activeTab)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tab headers */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors",
              tab.id === activeTab
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {tabs[activeIndex]?.content}
      </div>
    </div>
  )
}

// Mobile-friendly action menu
interface ActionMenuItem {
  id: string
  label: string
  icon: typeof Home
  onClick: () => void
  variant?: 'default' | 'destructive'
}

interface MobileActionsMenuProps {
  items: ActionMenuItem[]
  trigger?: React.ReactNode
}

export function MobileActionsMenu({ items, trigger }: MobileActionsMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Actions</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={item.variant === 'destructive' ? 'destructive' : 'ghost'}
                className="w-full justify-start h-12"
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Safe area padding for mobile devices
export function SafeAreaWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("pb-safe", className)}>
      {children}
    </div>
  )
}
