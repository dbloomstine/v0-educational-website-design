'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { adSlotId, adsAllowedOn, adsClient, type AdPlacement } from '@/lib/ads/config'
import { whenAdsClear } from '@/lib/ads/hold'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/**
 * One Google ad unit (2026-10-23), in house style: a hairline, a small
 * "Advertisement" label, and a box of reserved height so nothing below it
 * moves when the ad arrives.
 *
 * Renders nothing unless the mode is live and the placement has its slot ID
 * (lib/ads/config.ts), and never on a page in the no-ads list. The sponsor
 * slot is a different thing and is never replaced by this: Google's units sit
 * in places of their own.
 *
 * The ad is requested once per page, after the page has painted, and not
 * while the signup takeover covers the page (lib/ads/hold.ts). If Google has
 * no ad to show it marks the unit unfilled and CSS folds the box away
 * (globals.css, `.ad-slot`).
 */
const SHAPE: Record<AdPlacement, { format: string; minHeight: string }> = {
  // The story rail is 332px wide: a rectangle.
  story: { format: 'rectangle', minHeight: 'min-h-[250px]' },
  // Between sections and under "This week": a band across the column.
  front: { format: 'horizontal', minHeight: 'min-h-[100px]' },
  events: { format: 'horizontal', minHeight: 'min-h-[100px]' },
}

export function AdSlot({ placement, className = '' }: { placement: AdPlacement; className?: string }) {
  // Off, verify, or no ID for this placement: nothing at all, not even a hook (both are fixed at build).
  const slot = adSlotId(placement)
  const client = adsClient()
  if (!slot || !client) return null
  return <AdUnit placement={placement} slot={slot} client={client} className={className} />
}

function AdUnit({ placement, slot, client, className }: { placement: AdPlacement; slot: string; client: string; className: string }) {
  const pathname = usePathname()
  const insRef = useRef<HTMLModElement>(null)
  const show = adsAllowedOn(pathname)

  useEffect(() => {
    if (!show) return
    let cancelHold = () => {}
    // A tick later, so the takeover (mounted after the page) has had its say for this page view.
    const t = window.setTimeout(() => {
      cancelHold = whenAdsClear(() => {
        const ins = insRef.current
        if (!ins || ins.getAttribute('data-adsbygoogle-status')) return
        try {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        } catch {
          // a blocked or failed script: the box folds away as unfilled, or stays a quiet blank
        }
      })
    }, 0)
    return () => {
      window.clearTimeout(t)
      cancelHold()
    }
  }, [show, pathname])

  if (!show) return null

  const shape = SHAPE[placement]
  return (
    <aside aria-label="Advertisement" className={`ad-slot border-t border-border pt-1.5 ${className}`} data-placement={placement}>
      <p className="mb-1.5 font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Advertisement</p>
      <div className={`${shape.minHeight} w-full overflow-hidden`}>
        <ins
          key={pathname}
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={shape.format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  )
}
