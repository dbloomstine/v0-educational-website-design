import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EVENT_KIND_LABELS,
  COST_LABELS,
  formatEventDates,
  formatEventLocation,
} from '@/lib/events/constants'
import { firmLabelFor, splitHeadlineByEntities } from '@/lib/news/constants'
import type { IndustryEvent } from '@/lib/events/types'

// Homepage "Section B · The Circuit" — a dense server-rendered strip of the
// next ~10 upcoming events. Same row idiom as the /events board, no client
// JS: the homepage is the hub's front page, the board is the full calendar.

export function HomeEventsStrip({ events, rail = false }: { events: IndustryEvent[]; rail?: boolean }) {
  if (events.length === 0) return null

  return (
    <div className={rail ? '' : 'rounded-lg border border-border bg-card overflow-hidden'}>
      {events.map((event) => {
        const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
        const cost = COST_LABELS[event.costType] ?? COST_LABELS.paid
        const costText = event.costType === 'free' ? 'Free' : cost.label

        // Rail mode (homepage right column): the same idiom as the news
        // stream, because a three-column table could not fit an event name in
        // a ~440px rail — "McGuireWoods Emerging Ma…" was the norm. The name
        // now takes the full width and wraps; date, city and organizer drop to
        // a quiet meta line underneath.
        if (rail) {
          // Most event names lead with their organizer ("McGuireWoods
          // Emerging Manager Conference"), so bold it inside the name and
          // only add it to the meta line when the name leaves it out — the
          // same rule the news rows use for firms.
          const nameSegments = splitHeadlineByEntities(event.name, [event.organizerName])
          const showOrganizer = firmLabelFor(event.organizerName, event.name)
          const meta = [
            formatEventDates(event.startDate, event.endDate),
            formatEventLocation(event),
            showOrganizer ?? undefined,
            event.costType === 'free' ? 'Free' : undefined,
          ]
            .filter(Boolean)
            .join(' · ')

          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group block rounded px-2 py-1 lg:py-[3px] transition-colors hover:bg-accent/40"
            >
              {/* No `block` on the clamped name — line-clamp sets display to
                  -webkit-box and `block` would override it. */}
              <span className="text-[13.5px] font-normal leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-amber-400">
                {nameSegments.map((seg, i) =>
                  seg.bold ? (
                    <strong key={i} className="font-semibold">{seg.text}</strong>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground/60">
                {meta}
              </span>
            </Link>
          )
        }
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
