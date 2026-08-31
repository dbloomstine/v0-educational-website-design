'use client'

import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COST_LABELS,
  compactTimeNote,
  formatEventDates,
  formatEventLocation,
} from '@/lib/events/constants'
import { cleanEntityName } from '@/lib/news/constants'
import type { IndustryEvent } from '@/lib/events/types'

/**
 * Board row — the same shape as Section B of the daily email and the homepage
 * rail (2026-08-30): the time sits in a narrow left column so a day scans by
 * clock, the event name carries the row, and organizer / city / cost recede
 * beneath it. The board keeps the full cost label (it is a planning surface);
 * the email and rail only flag free events.
 */
export function EventRow({ event }: { event: IndustryEvent }) {
  const cost = COST_LABELS[event.costType] ?? COST_LABELS.paid
  const time = compactTimeNote(event.timeNote)
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
      href={`/events/${event.slug}`}
      className="group grid grid-cols-[76px_1fr] items-baseline gap-x-3 border-b border-border/30 px-2 py-1.5 transition-colors hover:bg-accent/40 last:border-b-0 sm:grid-cols-[92px_1fr_86px]"
    >
      <span className="whitespace-nowrap font-mono text-[10px] uppercase tabular-nums text-muted-foreground/70">
        {when}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          {event.isFeatured && (
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
          )}
          <span className="text-[13.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-amber-400">
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
        <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground/60">
          {under}
          <span className="sm:hidden">
            {event.costType === 'free' ? ' · Free' : ` · ${cost.label}`}
          </span>
        </span>
      </span>

      <span
        className={cn(
          'hidden text-right text-[11px] font-medium sm:block',
          event.costType === 'free' ? 'text-emerald-400' : cost.color,
        )}
        title={event.priceNote ?? undefined}
      >
        {event.costType === 'free' ? 'Free' : cost.label}
      </span>
    </Link>
  )
}
