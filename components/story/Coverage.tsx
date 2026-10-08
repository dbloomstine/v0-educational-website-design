import type { Story } from '@/lib/news/stories'
import { OUTBOUND, SourceLink } from './StoryLink'

/**
 * Who reported it. The primary outlet, then the others that carried the same
 * story — each a link to that outlet's own article, so a reader blocked by
 * one paywall has somewhere else to go. Under a headline that opens our page
 * for the story, this line is the way out to the publisher: the first outlet
 * wears the outward arrow, and "also … +N" says how many others there are.
 */
export function Coverage({ story, max = 3, className = '' }: { story: Story; max?: number; className?: string }) {
  const shown = story.coverage.slice(0, max)
  const more = story.coverage.length - shown.length
  return (
    <p className={`font-ui text-[12px] leading-snug text-muted-foreground ${className}`}>
      <SourceLink story={story} className="font-semibold text-foreground/80" />
      {shown.length > 0 && (
        <>
          <span className="text-foreground/35"> · also </span>
          {shown.map((c, i) => (
            <span key={c.url}>
              {i > 0 && ', '}
              <a href={c.url} {...OUTBOUND} title={c.headline} className="hover:text-foreground hover:underline">
                {c.source}
              </a>
            </span>
          ))}
          {more > 0 && <span> +{more}</span>}
        </>
      )}
    </p>
  )
}
