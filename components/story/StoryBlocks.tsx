import Link from 'next/link'
import type { Story } from '@/lib/news/stories'
import { homeSectionFor, sectionHref } from '@/lib/news/sections'
import { kickerLabel, sizeLabel, stageLabel } from '@/lib/news/format'
import { firmHref, fundLabel } from '@/lib/news/league'
import { ASSET_LABEL } from '@/lib/news/sections'
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

/**
 * The lead's facts, set beside it: who, which fund, how much, what stage, how
 * widely reported. It gives the lead the weight of a feature without a
 * picture, and it is where a reader first meets a link to the firm's page.
 */
function LeadFacts({ story }: { story: Story }) {
  const sized = story.kind === 'fundraising' || story.kind === 'deals' || story.kind === 'lps'
  const size = sized && story.leadEligible ? sizeLabel(story.sizeUsdM) : null
  const href = firmHref(story.firmName)
  const facts: { label: string; value: React.ReactNode; big?: boolean }[] = []
  if (size) facts.push({ label: story.kind === 'deals' ? 'Deal value' : story.kind === 'lps' ? 'Commitment' : 'Size', value: size, big: true })
  if (story.firmName) {
    facts.push({
      label: story.kind === 'lps' ? 'Investor' : 'Firm',
      value: href ? <Link href={href} className="underline decoration-foreground/25 underline-offset-[3px] hover:decoration-foreground">{story.firmName}</Link> : story.firmName,
    })
  }
  const fund = fundLabel(story.fundName)
  if (fund) facts.push({ label: 'Fund', value: fund })
  const stage = stageLabel(story)
  if (stage) facts.push({ label: 'Stage', value: stage })
  if (story.assetClasses[0] && ASSET_LABEL[story.assetClasses[0]]) facts.push({ label: 'Market', value: ASSET_LABEL[story.assetClasses[0]] })
  facts.push({
    label: 'Coverage',
    value: (
      <Link href={`/story/${story.id}`} className="underline decoration-foreground/25 underline-offset-[3px] hover:decoration-foreground">
        {story.coverage.length > 0 ? `${story.coverage.length + 1} publications` : story.source ?? 'One publication'}
      </Link>
    ),
  })
  // Two facts are a caption, not a box.
  if (facts.length < 3) return null
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-5 border-t border-border pt-1 sm:grid-cols-3 lg:mt-0 lg:block lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
      {facts.slice(0, 6).map((f) => (
        <div key={f.label} className="border-b border-border/70 py-[7px] last:border-0 lg:first:pt-0">
          <dt className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{f.label}</dt>
          <dd className={f.big ? 'font-mono text-[22px] font-bold leading-tight tracking-tight text-foreground' : 'font-news text-[15px] leading-snug text-foreground'}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** The one story the page leads with. */
export function LeadStory({ story }: { story: Story }) {
  const facts = <LeadFacts story={story} />
  return (
    <article className="panel panel-lead">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_224px] lg:gap-x-6">
        <div className="min-w-0">
          <Kicker story={story} lead />
          <a href={story.url} target="_blank" rel="noopener noreferrer" className="group mt-2 block">
            <h2 className="font-news text-[29px] font-medium leading-[1.07] tracking-[-0.018em] text-foreground sm:text-[36px] lg:text-[40px]">
              <span className="hl"><Headline story={story} /></span>
            </h2>
          </a>
          {story.summary && (
            <p className="mt-2.5 max-w-[68ch] font-news text-[17px] leading-[1.42] text-foreground/75 lg:text-[18px]">
              {story.summary}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Coverage story={story} max={4} />
            <Permalink story={story} />
          </div>
        </div>
        {facts}
      </div>
    </article>
  )
}

/**
 * Our page for the story — summary, every outlet that covered it, share
 * buttons. Labelled by what is behind it rather than by a clock: when a story
 * was posted matters less to this reader than who else reported it.
 */
function Permalink({ story }: { story: Story }) {
  return (
    <Link
      href={`/story/${story.id}`}
      title="Summary, all coverage, and share"
      className="font-ui text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      {story.coverage.length > 0 ? `${story.coverage.length + 1} sources` : 'Details'}
    </Link>
  )
}

/** Second tier: headline, one line of what happened, who reported it. */
export function TopStory({ story }: { story: Story }) {
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
        <Permalink story={story} />
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

/**
 * The rail's running list. No timestamp: Danny, 2026-10-01 — "no one cares
 * about the exact time on that column"; the order says newest-first and the
 * width goes to the headline instead.
 */
export function LatestRow({ story }: { story: Story }) {
  return (
    <li className="border-b border-border/70 py-[7px] last:border-0">
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        title={story.summary ?? undefined}
        className="group block font-news text-[14.5px] leading-[1.27] text-foreground"
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
        <span className="h-[11px] w-[4px] shrink-0" style={{ background: 'var(--tab)' }} aria-hidden="true" />
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

/**
 * A self-contained module on brighter stock with a navy head — every box in
 * the rail. The head is the email's section head: navy bar, amber tab.
 */
export function Panel({
  label, href, note, live, children, ariaLabel,
}: {
  label: string; href?: string; note?: string; live?: boolean; children: React.ReactNode; ariaLabel?: string
}) {
  return (
    <section aria-label={ariaLabel ?? label} className="panel">
      <div className="panel-head">
        <h2 className="flex items-center gap-2 font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em]">
          {live && (
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: '#34D399' }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#34D399' }} />
            </span>
          )}
          {href ? <Link href={href} className="hover:underline">{label}</Link> : label}
        </h2>
        {note && <span className="note whitespace-nowrap font-ui text-[11px]">{note}</span>}
      </div>
      <div className="panel-body">{children}</div>
    </section>
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

/**
 * One story in a long list: headline, then the facts that distinguish it, then
 * who reported it. The trailing facts are the permalink — our page for the story.
 * `tags` is whatever the surrounding page does not already say (on a venture
 * page, the story type; on the fundraising page, the asset class).
 */
export function RiverRow({ story, tags = [], date }: { story: Story; tags?: (string | null | undefined)[]; date?: string | null }) {
  const sized = story.kind === 'fundraising' || story.kind === 'deals' || story.kind === 'lps'
  const facts = [...tags, sized && story.leadEligible ? sizeLabel(story.sizeUsdM) : null, stageLabel(story)].filter(Boolean)
  const more = story.coverage.length
  return (
    <li className="grid gap-x-4 border-b border-border/70 py-[7px] last:border-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-baseline">
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        title={story.summary ?? undefined}
        className="group font-news text-[16px] leading-[1.28] text-foreground"
      >
        <span className="hl"><Headline story={story} /></span>
      </a>
      <Link
        href={`/story/${story.id}`}
        title="Summary, all coverage, and share"
        className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-ui text-[11.5px] text-muted-foreground hover:text-foreground lg:mt-0 lg:justify-end"
      >
        {facts.length > 0 && <span className="font-mono text-[10.5px] uppercase tracking-tight">{facts.join(' · ')}</span>}
        <span className="whitespace-nowrap text-foreground/65">
          {story.source}
          {more > 0 && ` +${more}`}
        </span>
        {date && <span className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-tight">{date}</span>}
      </Link>
    </li>
  )
}
