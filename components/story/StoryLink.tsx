import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Story } from '@/lib/news/stories'

/** How every link out to a publisher opens: a new tab, with no hold on ours. */
// `noopener` without `noreferrer`: the publisher's own figures then show that the reader came from us. An
// aggregator that sends readers to the source should be seen to.
export const OUTBOUND = { target: '_blank', rel: 'noopener' } as const

/**
 * A story's headline, wherever one is listed. It opens OUR page for the story
 * (/story/<id>): the summary, every outlet that reported it, then the way out.
 * Decided 2026-10-08, on the owner's ask: a page of ours per story is what a
 * search engine can index, and the reader still gets to the publisher in one
 * click (SourceLink).
 *
 * A roundup goes straight out, as it always did: a wire or a column is several
 * items under one headline, and a page of ours for it has nothing to land on.
 *
 * prefetch={false} everywhere: story pages are built on demand, and a list of
 * a hundred headlines must not ask for a hundred builds (links.test.ts).
 */
export function HeadlineLink({
  story,
  className,
  title,
  children,
}: {
  story: Pick<Story, 'id' | 'url' | 'roundup'>
  className?: string
  title?: string
  children: React.ReactNode
}) {
  if (story.roundup) {
    return (
      <a href={story.url} {...OUTBOUND} title={title} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={`/story/${story.id}`} prefetch={false} title={title} className={className}>
      {children}
    </Link>
  )
}

/**
 * The quiet way out: the outlet that reported the story first, with an arrow
 * that says it leaves the site. The other outlets are on the story's page.
 */
export function SourceLink({ story, className = '' }: { story: Pick<Story, 'url' | 'source'>; className?: string }) {
  return (
    <a href={story.url} {...OUTBOUND} title="Read it at the publisher" className={`inline-flex items-baseline gap-px hover:underline ${className}`}>
      <span className="min-w-0 truncate">{story.source ?? 'Source'}</span>
      <ArrowUpRight className="h-3 w-3 shrink-0 self-center" aria-hidden="true" />
    </a>
  )
}
