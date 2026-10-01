import Link from 'next/link'
import type { Story } from '@/lib/news/stories'
import type { IndustryEvent } from '@/lib/events/types'
import { formatEventDates } from '@/lib/events/constants'
import { sizeLabel, stageLabel, totalLabel } from '@/lib/news/format'
import { Headline } from '@/components/story/Headline'
import { LatestRow, MoreLink, SectionFlag } from '@/components/story/StoryBlocks'

export function LatestRail({ stories, nowMs }: { stories: Story[]; nowMs: number }) {
  if (stories.length === 0) return null
  return (
    <section aria-label="Latest">
      <SectionFlag label="Latest" href="/news" note="Updated hourly" live />
      <ol>
        {stories.map((s) => (
          <LatestRow key={s.id} story={s} nowMs={nowMs} />
        ))}
      </ol>
      <MoreLink href="/news">All news, with search and filters</MoreLink>
    </section>
  )
}

/**
 * The week's league table. Fund size is the one number this audience
 * compares, so it gets a column of its own here rather than a tag on a row.
 */
export function LargestCloses({ stories, stats }: { stories: Story[]; stats: { funds: number; capitalUsdM: number } }) {
  if (stories.length === 0) return null
  return (
    <section aria-label="Largest closes this week">
      <SectionFlag label="Largest closes" href="/news/fundraising" note="Past 7 days" />
      <ol>
        {stories.map((s, i) => (
          <li key={s.id} className="border-b border-border/70 last:border-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.headline}
              className="group grid grid-cols-[18px_minmax(0,1fr)_auto] items-baseline gap-2 py-[7px]"
            >
              <span className="font-mono text-[10.5px] text-muted-foreground">{i + 1}</span>
              <span className="min-w-0">
                <span className="hl font-news text-[15px] font-bold leading-tight text-foreground">{s.firmName ?? s.headline}</span>
                <span className="block truncate font-ui text-[11.5px] text-muted-foreground">
                  {[s.fundName, stageLabel(s)].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="font-mono text-[13px] font-bold tabular-nums text-foreground">{sizeLabel(s.sizeUsdM)}</span>
            </a>
          </li>
        ))}
      </ol>
      {stats.funds > 0 && (
        <p className="mt-1.5 font-ui text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">{totalLabel(stats.capitalUsdM)}</span> across {stats.funds} fund closes this week
        </p>
      )}
    </section>
  )
}

export function EventsRail({ events }: { events: IndustryEvent[] }) {
  if (events.length === 0) return null
  return (
    <section aria-label="Events this week">
      <SectionFlag label="Events" href="/events" note="Dates verified" />
      <ol>
        {events.map((e) => (
          <li key={e.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-2 border-b border-border/70 py-[7px] last:border-0">
            <span className="pt-[3px] font-mono text-[10.5px] uppercase tracking-tight text-muted-foreground">
              {formatEventDates(e.startDate, e.endDate)}
            </span>
            <Link href={`/events/${e.slug}`} className="group min-w-0">
              <span className="hl font-news text-[14.5px] leading-[1.27] text-foreground">{e.name}</span>
              <span className="block truncate font-ui text-[11.5px] text-muted-foreground">
                {[e.city, e.organizerName].filter(Boolean).join(' · ')}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <MoreLink href="/events">Full calendar, by city and topic</MoreLink>
    </section>
  )
}

/** A section's top headlines on the front page. */
export function SectionBlock({ label, href, stories, moreLabel }: { label: string; href: string; stories: Story[]; moreLabel: string }) {
  if (stories.length === 0) return null
  return (
    <section aria-label={label}>
      <SectionFlag label={label} href={href} />
      <ul>
        {stories.map((s) => (
          <li key={s.id} className="border-b border-border/70 py-[7px] last:border-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.summary ?? undefined}
              className="group block font-news text-[15.5px] leading-[1.28] text-foreground"
            >
              <span className="hl"><Headline story={s} /></span>
            </a>
          </li>
        ))}
      </ul>
      <MoreLink href={href}>{moreLabel}</MoreLink>
    </section>
  )
}
