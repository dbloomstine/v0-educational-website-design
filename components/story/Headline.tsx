import Link from 'next/link'
import { splitHeadlineByEntities } from '@/lib/news/constants'
import { headlineRuns } from '@/lib/news/firms'
import type { Story } from '@/lib/news/stories'

/**
 * A headline with the names in it set bold and everything else at regular
 * weight — the site's signature device: the eye lands on who did the thing.
 *
 * `firmHref` (2026-10-22) links each bold FIRM name to its page — only where
 * the headline is not itself a link (the story page's own headline). It is
 * never passed in a list, where the whole headline opens the story. The link
 * looks like the name until it is pointed at: the headline stays a headline.
 */
export function Headline({
  story,
  firmHref,
}: {
  story: Pick<Story, 'headline' | 'entities' | 'firmName' | 'personName'> & Partial<Pick<Story, 'firms'>>
  firmHref?: (name: string) => string | null
}) {
  const segments = firmHref
    ? headlineRuns({ ...story, firms: story.firms ?? [] }, firmHref)
    : splitHeadlineByEntities(story.headline, story.entities.length ? story.entities : [story.firmName, story.personName])
  return (
    <>
      {segments.map((seg, i) =>
        'href' in seg && seg.href ? (
          <Link key={i} prefetch={false} href={seg.href} className="decoration-1 underline-offset-[5px] hover:underline">
            <strong className="font-bold">{seg.text}</strong>
          </Link>
        ) : seg.bold ? (
          <strong key={i} className="font-bold">{seg.text}</strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}
