import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EVENT_KIND_LABELS,
  COST_LABELS,
  compactTimeNote,
  formatEventDates,
  formatEventDayHeading,
  formatEventLocation,
} from '@/lib/events/constants'
import { cleanEntityName } from '@/lib/news/constants'
import type { IndustryEvent } from '@/lib/events/types'

/**
 * One event, in the format Danny approved in the daily email: time in a
 * narrow left column, bold name, organizer and city beneath. Multi-day events
 * show their range in the time column; undated ones read "All day".
 */
export function EventLine({ event }: { event: IndustryEvent }) {
  const time = compactTimeNote(event.timeNote)
  const isRange = Boolean(event.endDate && event.endDate !== event.startDate)
  const when = time ?? (isRange ? formatEventDates(event.startDate, event.endDate) : 'All day')
  const under = [
    cleanEntityName(event.organizerName),
    formatEventLocation(event),
    event.costType === 'free' ? 'Free' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group grid grid-cols-[68px_1fr] items-baseline gap-x-3 border-b border-border/30 px-1 py-1.5 transition-colors hover:bg-accent/40 last:border-b-0"
    >
      <span className="whitespace-nowrap font-mono text-[10px] uppercase tabular-nums text-muted-foreground/70">
        {when}
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-amber-400">
          {event.name}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground/60">
          {under}
        </span>
      </span>
    </Link>
  )
}

// Homepage "Section B · Events" — a dense server-rendered strip of the
// next ~10 upcoming events. Same row idiom as the /events board, no client
// JS: the homepage is the hub's front page, the board is the full calendar.

export function HomeEventsStrip({ events, rail = false }: { events: IndustryEvent[]; rail?: boolean }) {
  if (events.length === 0) return null

  // Rail mode (homepage): the same shape as Section B of the daily email —
  // day headings, the time in a narrow left column so a day scans by clock,
  // bold title, organizer and city beneath.
  if (rail) {
    const days: { heading: string; events: IndustryEvent[] }[] = []
    for (const event of events) {
      const heading = formatEventDayHeading(event.startDate)
      const last = days[days.length - 1]
      if (last && last.heading === heading) last.events.push(event)
      else days.push({ heading, events: [event] })
    }

    return (
      <div>
        {days.map((day) => (
          <div key={day.heading}>
            <div className="mt-3 border-b-2 border-foreground/20 pb-1 pt-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/80 first:mt-0">
              {day.heading}
            </div>
            {day.events.map((event) => (
              <EventLine key={event.id} event={event} />
            ))}
          </div>
        ))}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <Link
            href="/events"
            className="group inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400 hover:text-amber-300 transition-colors"
          >
            Full calendar
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/events/submit"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Submit an event — free
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={rail ? '' : 'rounded-lg border border-border bg-card overflow-hidden'}>
      {events.map((event) => {
        const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
        const cost = COST_LABELS[event.costType] ?? COST_LABELS.paid
        const costText = event.costType === 'free' ? 'Free' : cost.label

        // Rail mode is handled by the day-grouped block below.
        if (rail) return null

        return (
          <Link
            key={event.id}
            href={`/events/${event.slug}`}
            className="group flex items-center gap-3 border-b border-border/40 px-4 py-2 transition-colors hover:bg-accent/40 last:border-b-0"
          >
            <span className="w-[92px] shrink-0 font-mono text-[12px] tabular-nums text-foreground/90 whitespace-nowrap">
              {formatEventDates(event.startDate, event.endDate)}
            </span>
            <span className={cn('hidden sm:inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', kind.color)}>
              {kind.label}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground group-hover:text-amber-400 transition-colors">
              {event.name}
            </span>
            <span className="hidden md:block w-[150px] shrink-0 truncate text-right text-[12px] text-muted-foreground">
              {formatEventLocation(event)}
            </span>
            <span className={cn('hidden sm:block w-[46px] shrink-0 text-right text-[12px] font-medium', event.costType === 'free' ? 'text-emerald-400' : 'text-muted-foreground')}>
              {costText}
            </span>
          </Link>
        )
      })}

      {/* CTA row */}
      <div className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        rail ? 'mt-2 px-2' : 'border-t border-border bg-muted/30 px-4 py-2.5',
      )}>
        <Link
          href="/events"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400 hover:text-amber-300 transition-colors"
        >
          Full calendar
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/events/submit"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          Submit an event — free
        </Link>
      </div>
    </div>
  )
}
