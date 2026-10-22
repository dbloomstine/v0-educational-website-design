import Link from 'next/link'
import { formatEventDates } from '@/lib/events/constants'
import type { IndustryEvent } from '@/lib/events/types'

const COLS: Record<number, string> = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' }

/**
 * "Events this week" (2026-10-22): a compact row near the top of the front
 * page. Single event pages now bring more search visitors than the front page
 * does, and the events were only in the rail, below the chart. The most
 * notable few of the week ahead (lib/events/highlights.ts pickNotableEvents),
 * in date order: a row across the page on a desk, a row that scrolls sideways
 * on a phone so the lead story still opens the page. No images.
 */
export function EventsWeekStrip({ events, className = '' }: { events: IndustryEvent[]; className?: string }) {
  if (events.length < 3) return null
  return (
    <section aria-label="Events this week" className={`border-y border-foreground/15 py-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em] text-foreground">
          <span className="h-[11px] w-[4px] shrink-0" style={{ background: 'var(--tab)' }} aria-hidden="true" />
          <Link href="/events" className="hover:underline">
            Events this week
          </Link>
        </h2>
        <Link href="/events" className="whitespace-nowrap font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
          All events, by city and topic →
        </Link>
      </div>
      <ol className={`tab-scroll -mx-4 mt-1.5 flex snap-x scroll-px-4 gap-0 overflow-x-auto px-4 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 ${COLS[events.length] ?? 'lg:grid-cols-5'}`}>
        {events.map((e) => (
          <li key={e.id} className="w-[230px] shrink-0 snap-start border-l border-border/70 px-3 first:border-l-0 first:pl-0 lg:w-auto">
            <Link href={`/events/${e.slug}`} prefetch={false} className="group block min-w-0">
              <span className="block font-mono text-[10.5px] uppercase tracking-tight text-muted-foreground">
                {formatEventDates(e.startDate, e.endDate)}
                {e.city && e.eventFormat !== 'virtual' ? ` · ${e.city}` : ''}
              </span>
              <span className="hl line-clamp-2 font-news text-[14.5px] leading-[1.25] text-foreground">{e.name}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
