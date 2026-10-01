import { splitHeadlineByEntities } from '@/lib/news/constants'
import type { Story } from '@/lib/news/stories'

/**
 * A headline with the names in it set bold and everything else at regular
 * weight — the site's signature device: the eye lands on who did the thing.
 */
export function Headline({ story }: { story: Pick<Story, 'headline' | 'entities' | 'firmName' | 'personName'> }) {
  const segments = splitHeadlineByEntities(
    story.headline,
    story.entities.length ? story.entities : [story.firmName, story.personName],
  )
  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-bold">{seg.text}</strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}
