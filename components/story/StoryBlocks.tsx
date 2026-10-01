import Link from 'next/link'
import type { Story } from '@/lib/news/stories'
import { homeSectionFor, sectionHref } from '@/lib/news/sections'
import { kickerLabel, sizeLabel, stageLabel, timeLabel } from '@/lib/news/format'
import { Headline } from './Headline'
import { Coverage } from './Coverage'

const kickerClass = 'font-ui text-[10.5px] font-bold uppercase tracking-[0.14em]'

function Kicker({ story, lead }: { story: Story; lead?: boolean }) {
  const section = homeSectionFor(story)
  const label = kickerLabel(story)
  return (
    <p className={`${kickerClass} flex flex-wrap items-center gap-x-2 text-amber-400`}>
      {lead && <span className="bg-foreground px-1.5 py-0.5 text-background">Top story</span>}
      {section ? (
        <Link href={sectionHref(section.slug)} className="hover:underline">{label}</Link>
      ) : (
        <span>{label}</span>
      )}
    </p>
  )
}

/** "$5.4B · Final close" — only what the story actually states. */
function Facts({ story, className = '' }: { story: Story; className?: string }) {
  // A size only where it is the story's own number: a fund, a deal, a commitment.
  const sized = story.kind === 'fundraising' || story.kind === 'deals' || story.kind === 'lps'
  const parts = [sized && story.leadEligible ? sizeLabel(story.sizeUsdM) : null, stageLabel(story)].filter(Boolean)
  if (parts.length === 0) return null
  return <span className={`font-mono text-[11px] font-semibold tracking-tight text-foreground/70 ${className}`}>{parts.join(' · ')}</span>
}

/** The one story the page leads with. */
export function LeadStory({ story, nowMs }: { story: Story; nowMs: number }) {
  return (
    <article>
      <Kicker story={story} lead />
      <a href={story.url} target="_blank" rel="noopener noreferrer" className="group mt-2 block">
        <h2 className="font-news text-[29px] font-medium leading-[1.07] tracking-[-0.018em] text-foreground sm:text-[36px] lg:text-[42px]">
          <span className="hl"><Headline story={story} /></span>
        </h2>
      </a>
      {story.summary && (
        <p className="mt-2.5 max-w-[68ch] font-news text-[17px] leading-[1.42] text-foreground/75 lg:text-[18px]">
          {story.summary}
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Facts story={story} className="text-[12px]" />
        <Coverage story={story} max={4} />
        <Permalink story={story} nowMs={nowMs} />
      </div>
    </article>
  )
}

/**
 * The timestamp is the permalink, as on any news site: it opens our page for
 * the story — summary, every outlet that covered it, and the share buttons.
 */
function Permalink({ story, nowMs }: { story: Story; nowMs: number }) {
  return (
    <Link
      href={`/story/${story.id}`}
      title="Summary, all coverage, and share"
      className="font-ui text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      {timeLabel(story.firstSeen, nowMs)}
      {story.coverage.length > 0 && ` · ${story.coverage.length + 1} sources`}
    </Link>
  )
}

/** Second tier: headline, one line of what happened, who reported it. */
export function TopStory({ story, nowMs }: { story: Story; nowMs: number }) {
  return (
    <article className="border-t border-border pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <Kicker story={story} />
        <Facts story={story} />
      </div>
      <a href={story.url} target="_blank" rel="noopener noreferrer" className="group mt-1 block">
        <h3 className="font-news text-[20px] leading-[1.18] tracking-[-0.008em] text-foreground lg:text-[21px]">
          <span className="hl"><Headline story={story} /></span>
        </h3>
      </a>
      {story.summary && (
        <p className="mt-1 line-clamp-2 font-news text-[14.5px] leading-[1.4] text-foreground/70">{story.summary}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5">
        <Coverage story={story} max={2} />
        <Permalink story={story} nowMs={nowMs} />
      </div>
    </article>
  )
}

/** One line in a list: the headline, and nothing above it. */
export function HeadlineRow({ story, showSource = false }: { story: Story; showSource?: boolean }) {
  const more = story.coverage.length
  return (
    <li className="border-b border-border/70 py-[7px] last:border-0">
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        title={story.summary ?? undefined}
        className="group block font-news text-[15.5px] leading-[1.28] text-foreground"
      >
        <span className="hl"><Headline story={story} /></span>
        {showSource && story.source && (
          <span className="ml-2 whitespace-nowrap font-ui text-[11.5px] text-muted-foreground">
            {story.source}
            {more > 0 && ` +${more}`}
          </span>
        )}
      </a>
    </li>
  )
}

/** The rail's running list: when, then what. */
export function LatestRow({ story, nowMs }: { story: Story; nowMs: number }) {
  return (
    <li className="grid grid-cols-[56px_minmax(0,1fr)] gap-2 border-b border-border/70 py-[7px] last:border-0">
      <span className="pt-[3px] font-mono text-[10.5px] uppercase tracking-tight text-muted-foreground">
        {timeLabel(story.firstSeen, nowMs).replace(' ago', '')}
      </span>
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        title={story.summary ?? undefined}
        className="group font-news text-[14.5px] leading-[1.27] text-foreground"
      >
        <span className="hl"><Headline story={story} /></span>
      </a>
    </li>
  )
}

/** Section flag: the bar-and-label that opens every block on the page. */
export function SectionFlag({ label, href, note, live }: { label: string; href?: string; note?: string; live?: boolean }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-1.5">
      <h2 className="flex items-center gap-2 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
        {live && (
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
        )}
        {href ? <Link href={href} className="hover:underline">{label}</Link> : label}
      </h2>
      {note && <span className="font-ui text-[11.5px] text-muted-foreground">{note}</span>}
    </div>
  )
}

export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-1.5 inline-block font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
    >
      {children} →
    </Link>
  )
}
