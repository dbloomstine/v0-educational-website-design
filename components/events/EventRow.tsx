'use client'

import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EVENT_KIND_LABELS,
  COST_LABELS,
  compactTimeNote,
  formatEventDates,
  formatEventLocation,
} from '@/lib/events/constants'
import { firmLabelFor, splitHeadlineByEntities } from '@/lib/news/constants'
import type { IndustryEvent } from '@/lib/events/types'

export function EventRow({ event }: { event: IndustryEvent }) {
  const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
  const cost = COST_LABELS[event.costType] ?? COST_LABELS.paid
  const location = formatEventLocation(event)
  const dates = formatEventDates(event.startDate, event.endDate)
  const time = compactTimeNote(event.timeNote)

  // Free events show "Free" in green; paid ones show the cost-type label.
  // Price notes live on the detail page — the row carries main info only.
  const costText = event.costType === 'free' ? 'Free' : cost.label

  // Same treatment the news rows give firms: the organizer is bolded inside
  // the event name where it leads, and only named separately when it isn't.
  const nameSegments = splitHeadlineByEntities(event.name, [event.organizerName])
  const showOrganizer = firmLabelFor(event.organizerName, event.name)
  const nameNodes = nameSegments.map((seg, i) =>
    seg.bold ? <strong key={i} className="font-semibold">{seg.text}</strong> : <span key={i}>{seg.text}</span>,
  )

  // Row click → our detail page; the external icon jumps straight to the
  // organizer (with a count-only click beacon).
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
      className="group block rounded transition-colors hover:bg-accent/40"
    >
      {/* ── Desktop: single line ────────────────────────────── */}
      <div className="hidden lg:grid items-center gap-x-3 px-2 py-[3px] grid-cols-[148px_64px_1fr_160px_76px]">
        {/* Date · time */}
        <div className="font-mono text-[12px] tabular-nums text-foreground/90 truncate">
          {dates}
          {time && <span className="text-[10px] text-muted-foreground/70"> · {time}</span>}
        </div>

        {/* Kind — quiet mono text, no pill */}
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60 truncate">
          {kind.label}
        </div>

        {/* Name — organizer */}
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          {event.isFeatured && (
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
          )}
          <span className="truncate text-[13px] font-normal leading-snug text-foreground group-hover:text-amber-400 transition-colors">
            {nameNodes}
          </span>
          {showOrganizer && (
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wide text-muted-foreground/50">
              {showOrganizer}
            </span>
          )}
          {/* button, not <a> — anchors can't nest inside the row's Link */}
          <button
            type="button"
            aria-label={`${event.name} — organizer site`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              beacon()
              window.open(event.eventUrl, '_blank', 'noopener,noreferrer')
            }}
            className="shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-amber-400 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        {/* Location */}
        <div className="truncate text-[12px] text-muted-foreground">
          {location}
          {event.eventFormat === 'hybrid' && (
            <span className="ml-1.5 text-[10px] text-muted-foreground/60">· Hybrid</span>
          )}
        </div>

        {/* Cost */}
        <div className={cn('truncate text-[12px] font-medium', event.costType === 'free' ? 'text-emerald-400' : cost.color)} title={event.priceNote ?? undefined}>
          {costText}
        </div>
      </div>

      {/* ── Mobile: two lines ───────────────────────────────── */}
      <div className="lg:hidden px-2 py-1">
        <span className="text-[13.5px] font-normal leading-snug text-foreground line-clamp-2">
          {event.isFeatured && (
            <Star className="mr-1 inline h-3 w-3 fill-amber-400 text-amber-400" aria-label="Featured" />
          )}
          {nameNodes}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground/60">
          {[dates + (time ? ` · ${time}` : ''), location, showOrganizer ?? undefined, kind.label, costText]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
    </Link>
  )
}
