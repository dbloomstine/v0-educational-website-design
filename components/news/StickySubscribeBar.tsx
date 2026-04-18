'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

/**
 * Mobile-only sticky CTA bar that appears after the user scrolls past
 * the hero subscribe card. Links to the in-page subscribe anchor so
 * tapping jumps the user back to the hero with the input focused (the
 * hash listener in hero-subscribe.tsx handles the focus).
 *
 * Dismissible for the session — once closed, we set a sessionStorage
 * flag so it doesn't re-appear on the same visit. Session-scoped (not
 * localStorage) so a return visitor tomorrow sees it again.
 *
 * Hidden on desktop (lg:hidden) because the hero + mid-feed CTA cover
 * desktop conversion. A fixed bar on desktop would just eat content.
 */
const DISMISS_KEY = 'fops_sticky_dismissed'
const SHOW_THRESHOLD_PX = 600

export function StickySubscribeBar() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true)
      return
    }

    const onScroll = () => {
      setVisible(window.scrollY > SHOW_THRESHOLD_PX)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (dismissed || !visible) return null

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-foreground/15 bg-background/95 backdrop-blur-md lg:hidden"
      role="complementary"
      aria-label="Subscribe to FundOps Daily"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            Get FundOps Daily in your inbox
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Every morning. Free.
          </p>
        </div>
        <a
          href="#subscribe"
          className="shrink-0 rounded-sm bg-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-background hover:bg-foreground/90 transition-colors"
        >
          Subscribe
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-sm p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
