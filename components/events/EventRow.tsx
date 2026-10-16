'use client'

import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  eventTimeLabel,
  costLabel,
  formatEventDates,
  formatEventLocation,
  isVerifiedFree,
  verifiedPriceNote,
} from '@/lib/events/constants'
import { cleanEntityName } from '@/lib/news/constants'
import type { IndustryEvent } from '@/lib/events/types'

/**
 * Board row — the same shape as Section B of the daily email and the homepage
 * rail (2026-08-30): the time sits in a narrow left column so a day scans by
 * clock, the event name carries the row, and organizer / city / cost recede
 * beneath it. Cost is said only where we saw it (2026-10-15): "Free" when the
 * registration page was checked, "Invite only" / "Members only" for access,
 * and nothing otherwise. The email and rail only flag free events.
 */
export function EventRow({ event }: { event: IndustryEvent }) {
  const cost = costLabel(event)
  const free = isVerifiedFree(event)
  const time = eventTimeLabel(event)
  const isRange = Boolean(event.endDate && event.endDate !== event.startDate)
  const when = time ?? (isRange ? formatEventDates(event.startDate, event.endDate) : 'All day')

  const under = [cleanEntityName(event.organizerName), formatEventLocation(event)]
    .filter(Boolean)
    .join(' · ')

  // The row links to our detail page; the icon jumps straight to the organizer
  // with a count-only beacon. A button, not an anchor — anchors cannot nest.
  const beacon = () => {
    try {
      navigator.sendBeacon(`/api/events/click?id=${event.id}`)
    } catch {
      // never let analytics break navigation
    }
  }

  return (
    <Link
      prefetch={false}
      href={`/events/${event.slug}`}
      className="group grid grid-cols-[76px_1fr] items-baseline gap-x-3 border-b border-border/30 px-2 py-1.5 transition-colors hover:bg-accent/40 last:border-b-0 sm:grid-cols-[92px_1fr_86px]"
    >
      <span className="whitespace-nowrap font-mono text-[11.5px] uppercase tabular-nums text-muted-foreground">
        {when}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          {event.isFeatured && (
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
          )}
          <span className="text-[15px] font-semibold leading-normal text-foreground transition-colors group-hover:text-amber-400">
            {event.name}
          </span>
          <button
            type="button"
            aria-label={`${event.name} — organizer site`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              beacon()
              window.open(event.eventUrl, '_blank', 'noopener,noreferrer')
            }}
            className="shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 hover:!text-amber-400"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </span>
        <span className="mt-0.5 block truncate font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {under}
          {cost && <span className="sm:hidden"> · {cost}</span>}
        </span>
      </span>

      <span
        className={cn('hidden whitespace-nowrap text-right text-[12px] font-medium sm:block', free ? 'text-emerald-400' : 'text-muted-foreground')}
        title={verifiedPriceNote(event) ?? undefined}
      >
        {cost}
      </span>
    </Link>
  )
}
