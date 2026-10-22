import { Search } from 'lucide-react'
import type { EventFacetCounts } from '@/lib/events/types'

/**
 * Find an event, at the top of /events (2026-10-22). The design critique found the board's search 1.4 screens down on a
 * desktop and 2.8 on a phone, under This week, Next week and the signup box, with "Submit an event" (for organizers) the
 * strongest control above the fold. This puts a search box and a few one-tap picks under the title. Each is a plain form
 * or link to /events?…#board: the board reads its filters from the address when the page loads (components/events/
 * EventsBoard.tsx), so this needs no script of its own, and the page lands on the list, already filtered.
 */
export function EventsFinder({ facets }: { facets: EventFacetCounts | null }) {
  const topCities = Object.entries(facets?.cities ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 2)
  const picks: { label: string; href: string; count?: number }[] = [
    { label: 'This week', href: '/events?when=1w#board' },
    { label: 'Ops-focused', href: '/events?ops=1#board', count: facets?.opsHighCount },
    { label: 'Free', href: '/events?cost=free#board', count: facets?.costs.free },
    ...topCities.map(([name, n]) => ({ label: name, href: `/events?city=${encodeURIComponent(name)}#board`, count: n })),
  ]
  return (
    <div className="mt-4 max-w-[760px]">
      <form action="/events#board" method="get" role="search" className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          aria-label="Search events"
          placeholder={facets?.totalUpcoming ? `Search ${facets.totalUpcoming} events by name, city or host` : 'Search events by name, city or host'}
          className="w-full rounded-[3px] border border-foreground/25 bg-background py-2.5 pl-10 pr-24 font-ui text-[15px] text-foreground placeholder:text-muted-foreground/80 focus:border-foreground/60 focus:outline-none"
        />
        <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[3px] bg-foreground px-3.5 py-1.5 font-ui text-[13px] font-semibold text-background hover:opacity-90">
          Search
        </button>
      </form>
      <div className="-mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
        {picks.map((p) => (
          <a
            key={p.label}
            href={p.href}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-foreground/20 bg-background px-3 py-1.5 font-ui text-[13px] font-medium text-foreground hover:border-foreground/50"
          >
            {p.label}
            {p.count ? <span className="tabular-nums text-[11.5px] text-muted-foreground">{p.count}</span> : null}
          </a>
        ))}
      </div>
    </div>
  )
}
