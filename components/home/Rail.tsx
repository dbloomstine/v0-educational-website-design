import Link from 'next/link'
import type { Story } from '@/lib/news/stories'
import type { IndustryEvent } from '@/lib/events/types'
import { formatEventDates } from '@/lib/events/constants'
import { sizeLabel, stageLabel, totalLabel } from '@/lib/news/format'
import { Headline } from '@/components/story/Headline'
import { LatestRow, MoreLink, SectionFlag } from '@/components/story/StoryBlocks'

/** The newest stories on the site, newest first. Front page and story pages. */
export function LatestRail({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null
  return (
    <section aria-label="Latest">
      <SectionFlag label="Latest" href="/news" note="Updated hourly" live />
      <ol>
        {stories.map((s) => (
          <LatestRow key={s.id} story={s} />
        ))}
      </ol>
      <MoreLink href="/news">All news, with search and filters</MoreLink>
    </section>
  )
}

/** Stories carried by more than one outlet, most outlets first. */
export function mostCovered(stories: Story[], limit = 8): Story[] {
  return stories
    .filter((s) => !s.roundup && s.coverage.length > 0)
    .sort((a, b) => b.coverage.length - a.coverage.length || b.firstSeen.localeCompare(a.firstSeen))
    .slice(0, limit)
}

/**
 * A section's rail. The river beside it is already that section's newest
 * stories in order, so the rail ranks the same stories a different way: by
 * how many outlets ran them. `stories` should come from mostCovered().
 */
export function MostCovered({ stories, note }: { stories: Story[]; note?: string }) {
  if (stories.length < 3) return null
  return (
    <section aria-label="Most covered">
      <SectionFlag label="Most covered" note={note} />
      <ol>
        {stories.map((s) => (
          <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border/70 py-[7px] last:border-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.summary ?? undefined}
              className="group block font-news text-[14.5px] leading-[1.27] text-foreground"
            >
              <span className="hl"><Headline story={s} /></span>
            </a>
            <Link
              href={`/story/${s.id}`}
              title="Every outlet that covered it"
              className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-tight text-muted-foreground hover:text-foreground"
            >
              {s.coverage.length + 1} sources
            </Link>
          </li>
        ))}
      </ol>
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

/** Stories of one kind with a stated size, largest first. For the Deals and LPs rails. */
export function largestBySize(stories: Story[], limit = 6, withinDays = 7, nowMs = Date.now()): Story[] {
  return stories
    // The figure has to be the story's own: a headline with no number in it
    // usually means the size on file is someone's AUM ("New York Life boosts
    // private credit arm with Invictus stake" carried Invictus's $20B).
    .filter((s) => !s.roundup && !!s.sizeUsdM && /\d/.test(s.headline) && nowMs - new Date(s.firstSeen).getTime() < withinDays * 86_400_000)
    .sort((a, b) => (b.sizeUsdM ?? 0) - (a.sizeUsdM ?? 0))
    .slice(0, limit)
}

/**
 * The same league table as LargestCloses, for the sections whose number is
 * not a fund close: the week's largest deals, the week's largest LP commitments.
 */
export function LargestBySize({ label, stories, note = 'Past 7 days' }: { label: string; stories: Story[]; note?: string }) {
  if (stories.length < 3) return null
  return (
    <section aria-label={label}>
      <SectionFlag label={label} note={note} />
      <ol>
        {stories.map((s, i) => (
          <li key={s.id} className="border-b border-border/70 last:border-0">
            <Link
              href={`/story/${s.id}`}
              title={s.headline}
              className="group grid grid-cols-[18px_minmax(0,1fr)_auto] items-baseline gap-2 py-[7px]"
            >
              <span className="font-mono text-[10.5px] text-muted-foreground">{i + 1}</span>
              <span className="hl min-w-0 font-news text-[14.5px] leading-[1.27] text-foreground">
                <Headline story={s} />
              </span>
              <span className="font-mono text-[13px] font-bold tabular-nums text-foreground">{sizeLabel(s.sizeUsdM)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function EventsRail({
  events,
  label = 'Events',
  href = '/events',
  moreLabel = 'Full calendar, by city and topic',
}: {
  events: IndustryEvent[]
  label?: string
  href?: string
  moreLabel?: string
}) {
  if (events.length === 0) return null
  return (
    <section aria-label={label}>
      <SectionFlag label={label} href={href} note="Dates verified" />
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
      <MoreLink href={href}>{moreLabel}</MoreLink>
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
