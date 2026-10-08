import Link from 'next/link'
import type { ArchiveEntry } from '@/lib/news/archive'

const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/**
 * A month's stories, newest first: date and firm over the headline, then the
 * first sentence of the fuller summary. Each links to our page for the story.
 */
export function ArchiveList({ entries }: { entries: ArchiveEntry[] }) {
  return (
    <ul>
      {entries.map((e) => (
        <li key={e.id} className="border-b border-border/70 py-3 last:border-0">
          <p className="font-mono text-[10.5px] uppercase tracking-tight text-muted-foreground">
            <time dateTime={e.date}>{shortDate(e.date)}</time>
            {e.firm && <span className="font-ui font-bold normal-case tracking-normal text-foreground/70"> · {e.firm}</span>}
          </p>
          <h3 className="mt-0.5 font-news text-[19px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
            <Link href={`/story/${e.id}`} prefetch={false} className="hl">{e.headline}</Link>
          </h3>
          <p className="mt-1 max-w-[70ch] font-news text-[15.5px] leading-[1.45] text-foreground/75">{e.blurb}</p>
        </li>
      ))}
    </ul>
  )
}
