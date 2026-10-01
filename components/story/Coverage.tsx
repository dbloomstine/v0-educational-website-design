import type { Story } from '@/lib/news/stories'

/**
 * Who reported it. The primary outlet, then the others that carried the same
 * story — each a link to that outlet's own article, so a reader blocked by
 * one paywall has somewhere else to go.
 */
export function Coverage({ story, max = 3, className = '' }: { story: Story; max?: number; className?: string }) {
  const shown = story.coverage.slice(0, max)
  const more = story.coverage.length - shown.length
  return (
    <p className={`font-ui text-[12px] leading-snug text-muted-foreground ${className}`}>
      <a href={story.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground/80 hover:underline">
        {story.source ?? 'Source'}
      </a>
      {shown.length > 0 && (
        <>
          <span className="text-foreground/35"> · also </span>
          {shown.map((c, i) => (
            <span key={c.url}>
              {i > 0 && ', '}
              <a href={c.url} target="_blank" rel="noopener noreferrer" title={c.headline} className="hover:text-foreground hover:underline">
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
