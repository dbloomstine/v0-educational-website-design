'use client'

import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EVENT_KIND_LABELS,
  COST_LABELS,
  EVENT_FORMAT_LABELS,
  formatEventDates,
  formatEventLocation,
} from '@/lib/events/constants'
import { CATEGORY_LABELS } from '@/lib/news/constants'
import type { IndustryEvent } from '@/lib/events/types'

export function EventRow({ event }: { event: IndustryEvent }) {
  const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
  const cost = COST_LABELS[event.costType] ?? COST_LABELS.paid
  const location = formatEventLocation(event)
  const dates = formatEventDates(event.startDate, event.endDate)

  // Free events show "Free" in green; paid ones show the price note when we
  // have one (truncated), else the cost-type label.
  const costText = event.costType === 'free' ? 'Free' : event.priceNote || cost.label

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
      className="group block border-b border-border/40 transition-colors hover:bg-accent/40 last:border-b-0"
    >
      {/* ── Desktop row ─────────────────────────────────────── */}
      <div className="hidden lg:grid items-center gap-x-2 px-4 py-2.5 grid-cols-[130px_96px_1fr_200px_120px]">
        {/* Date */}
        <div className="font-mono text-[12px] tabular-nums text-foreground/90 whitespace-nowrap">
          {dates}
          {event.timeNote && (
            <div className="text-[10px] text-muted-foreground/70">{event.timeNote}</div>
          )}
        </div>

        {/* Kind pill */}
        <div>
          <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap', kind.color)}>
            {kind.label}
          </span>
        </div>

        {/* Name + organizer */}
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {event.isFeatured && (
              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
            )}
            <span className="truncate text-[13px] font-medium text-foreground group-hover:text-amber-400 transition-colors">
              {event.name}
            </span>
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
          <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <span className="truncate">{event.organizerName}</span>
            {event.fundCategories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className={cn('rounded px-1 py-px text-[9px] font-medium shrink-0', CATEGORY_LABELS[cat]?.color ?? 'bg-muted text-muted-foreground')}
              >
                {CATEGORY_LABELS[cat]?.label ?? cat}
              </span>
            ))}
          </div>
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

      {/* ── Mobile card ─────────────────────────────────────── */}
      <div className="lg:hidden px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] tabular-nums text-foreground/90">
            {dates}
            {event.timeNote ? ` · ${event.timeNote}` : ''}
          </span>
          <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', kind.color)}>
            {kind.label}
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          {event.isFeatured && (
            <Star className="mt-0.5 h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
          )}
          <span className="text-[14px] font-medium leading-snug text-foreground">{event.name}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">{event.organizerName}</div>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate text-muted-foreground">
            {location}
            {event.eventFormat === 'hybrid' && ` · ${EVENT_FORMAT_LABELS[event.eventFormat]}`}
          </span>
          <span className={cn('font-medium shrink-0', event.costType === 'free' ? 'text-emerald-400' : cost.color)}>
            {costText}
          </span>
        </div>
      </div>
    </Link>
  )
}
