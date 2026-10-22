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
  // with a count-only beacon.
  //
  // 2026-10-22: the row used to be one big link with the organizer button inside it. A control inside a link is
  // invalid HTML, and a screen reader announced a link that held a button. Now the row is a plain box: the event
  // name is the link, stretched over the whole row by its ::after (so a click anywhere still opens the event, as
  // before), and the organizer link sits beside it, lifted above the stretch so it takes its own clicks. The look
  // is unchanged; the row draws the focus ring when its link has the keyboard.
  const beacon = () => {
    try {
      navigator.sendBeacon(`/api/events/click?id=${event.id}`)
    } catch {
      // never let analytics break navigation
    }
  }

  return (
    <div className="group relative grid grid-cols-[76px_1fr] items-baseline gap-x-3 border-b border-border/30 px-2 py-1.5 transition-colors hover:bg-accent/40 last:border-b-0 has-[a[data-row-link]:focus-visible]:outline has-[a[data-row-link]:focus-visible]:outline-2 has-[a[data-row-link]:focus-visible]:-outline-offset-2 has-[a[data-row-link]:focus-visible]:outline-foreground sm:grid-cols-[92px_1fr_86px]">
      {/* A time range may take two lines ("8:30AM–" over "4:30PM CT"): kept to one, it ran under the name (2026-10-22). */}
      <span className="break-words font-mono text-[11.5px] uppercase leading-snug tabular-nums text-muted-foreground">
        {when.replace(/\s*[-–]\s*/, '–\u200b')}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          {event.isFeatured && (
            <Star className="h-3 w-3 shrink-0 fill-[#D4A63A] text-[#D4A63A]" aria-label="Featured" />
          )}
          <Link
            prefetch={false}
            href={`/events/${event.slug}`}
            data-row-link=""
            className="text-[15px] font-semibold leading-normal text-foreground decoration-[#D4A63A] decoration-2 underline-offset-[3px] outline-none after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:outline-none"
          >
            {event.name}
          </Link>
          <a
            href={event.eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={beacon}
            aria-label={`${event.name} — organizer site`}
            className="relative z-10 -my-1.5 shrink-0 rounded-sm p-1.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 hover:!text-foreground focus-visible:!text-foreground [@media(hover:none)]:hidden"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </span>
        <span className="mt-0.5 block truncate font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {under}
          {cost && <span className="sm:hidden"> · {cost}</span>}
        </span>
      </span>

      <span
        className={cn('hidden whitespace-nowrap text-right text-[12px] font-medium sm:block', free ? 'text-emerald-700' : 'text-muted-foreground')}
        title={verifiedPriceNote(event) ?? undefined}
      >
        {cost}
      </span>
    </div>
  )
}
