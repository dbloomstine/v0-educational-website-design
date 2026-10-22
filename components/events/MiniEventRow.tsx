import Link from 'next/link'
import { EVENT_KIND_LABELS, costLabel, formatEventDates, formatEventLocation, isVerifiedFree } from '@/lib/events/constants'
import { cn } from '@/lib/utils'
import type { IndustryEvent } from '@/lib/events/types'

/** One event on a line: dates, kind, name, place, cost. The city and topic pages, "Similar events", and /events' first two weeks. */
export function MiniEventRow({ event }: { event: IndustryEvent }) {
  const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
  return (
    <Link
      prefetch={false}
      href={`/events/${event.slug}`}
      className="group flex items-center gap-3 border-b border-border/40 px-4 py-2.5 transition-colors hover:bg-accent/40 last:border-b-0"
    >
      <span className="w-[110px] shrink-0 font-mono text-[12px] tabular-nums text-foreground/90">
        {formatEventDates(event.startDate, event.endDate)}
      </span>
      <span className={cn('hidden sm:inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', kind.color)}>
        {kind.label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground group-hover:text-amber-400 transition-colors">
        {event.name}
      </span>
      <span className="hidden md:block w-[160px] shrink-0 truncate text-right text-[12px] text-muted-foreground">
        {formatEventLocation(event)}
      </span>
      <span className={cn('w-[84px] shrink-0 whitespace-nowrap text-right text-[12px] font-medium', isVerifiedFree(event) ? 'text-emerald-400' : 'text-muted-foreground')}>
        {costLabel(event)}
      </span>
    </Link>
  )
}
