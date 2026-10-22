import type { ReactNode } from 'react'
import Link from 'next/link'
import { Panel } from '@/components/story/StoryBlocks'
import { pickNotableEvents } from '@/lib/events/highlights'
import { formatEventDates, formatEventLocation } from '@/lib/events/constants'
import type { IndustryEvent } from '@/lib/events/types'
import { CITY_SHORTCUTS, TOPIC_SHORTCUTS } from '@/lib/events/collections'

/** How many events each week's panel lists before pointing to the full board. */
const PER_WEEK = 8

/** One event in a half-width panel: the date, then the name over where and who. */
function WeekRow({ event }: { event: IndustryEvent }) {
  return (
    <li className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 border-b border-border/60 px-4 py-2 last:border-b-0">
      <span className="pt-[3px] font-mono text-[11px] tabular-nums text-muted-foreground">{formatEventDates(event.startDate, event.endDate)}</span>
      <Link href={`/events/${event.slug}`} prefetch={false} className="group min-w-0">
        <span className="hl font-news text-[15px] leading-[1.27] text-foreground">{event.name}</span>
        <span className="block truncate font-ui text-[11.5px] text-muted-foreground">
          {[formatEventLocation(event), event.organizerName].filter(Boolean).join(' · ')}
        </span>
      </Link>
    </li>
  )
}

function WeekPanel({ label, events }: { label: string; events: IndustryEvent[] }) {
  // The most notable of the week, at most two a day, in date order; the full list is the board below.
  const shown = events.length > PER_WEEK ? pickNotableEvents(events, PER_WEEK) : events
  return (
    <Panel label={label} note={events.length ? `${events.length} ${events.length === 1 ? 'event' : 'events'}` : undefined}>
      <div className="-mx-[14px] -mb-[10px] -mt-1">
        {events.length === 0 ? (
          <p className="px-4 py-4 font-ui text-[13px] text-muted-foreground">Nothing on the board yet.</p>
        ) : (
          <ol>
            {shown.map((e) => (
              <WeekRow key={e.id} event={e} />
            ))}
          </ol>
        )}
        {events.length > PER_WEEK && (
          <a href="#board" className="block border-t border-border/40 px-4 py-2 font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
            {events.length - shown.length} more in the full list below →
          </a>
        )}
      </div>
    </Panel>
  )
}

function Chips({ label, items }: { label: string; items: { label: string; slug: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {items.map((c) => (
        <Link
          key={c.slug}
          href={`/events/${c.slug}`}
          className="inline-flex h-8 items-center rounded-sm border border-foreground/25 px-3 font-ui text-[13px] font-semibold text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
        >
          {c.label}
        </Link>
      ))}
    </div>
  )
}

/**
 * The top of /events: this week and next week first, then the cities and topics, one tap each.
 *
 * `afterThisWeek` (2026-10-22): what a phone or tablet shows between the two weeks, under the one-column layout only.
 * The page passes its sponsor strip: on a phone it was the third block, above the first event.
 */
export function EventsUpFront({
  thisWeek,
  nextWeek,
  afterThisWeek,
}: {
  thisWeek: IndustryEvent[]
  nextWeek: IndustryEvent[]
  afterThisWeek?: ReactNode
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <WeekPanel label="This week" events={thisWeek} />
        {afterThisWeek && <div className="lg:hidden">{afterThisWeek}</div>}
        <WeekPanel label="Next week" events={nextWeek} />
      </div>
      <nav aria-label="Events by city and topic" className="flex flex-col gap-3 border-y border-border py-3 md:flex-row md:flex-wrap md:items-center md:gap-x-8">
        <Chips label="Cities" items={CITY_SHORTCUTS} />
        <Chips label="Topics" items={TOPIC_SHORTCUTS} />
      </nav>
    </div>
  )
}
