'use client'

import { openSignupCard } from './SubscribePrompt'

/**
 * A "Subscribe" link that opens the signup box where the reader is, so they
 * are asked what they follow like everyone else (Danny, 2026-10-09: "anywhere
 * that you go to subscribe" should ask). The href is the homepage's form, for
 * a new tab, a middle click, or a browser without scripts.
 */
export function SubscribeLink({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <a
      href="/#subscribe"
      className={className}
      style={style}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        openSignupCard()
      }}
    >
      {children}
    </a>
  )
}
