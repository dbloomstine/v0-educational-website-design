import { ImageResponse } from 'next/og'
import { getStory } from '@/lib/news/front-page'
import { kickerLabel, sizeLabel, stageLabel } from '@/lib/news/format'

export const alt = 'FundOpsHQ story'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CREAM = '#F8F5EC'
const INK = '#13233A'
const NAVY = '#1E3A5F'
const AMBER = '#E6B045'
const OCHRE = '#9C6410'
const MUTED = '#55647A'

/** The card a shared story shows on LinkedIn: the headline, set like the site. */
export default async function StoryOG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await getStory(id)
  const story = found?.story
  const headline = story?.headline ?? 'Fund news for private markets'
  const facts = story
    ? [story.leadEligible ? sizeLabel(story.sizeUsdM) : null, stageLabel(story)].filter(Boolean).join(' · ')
    : ''
  const fontSize = headline.length > 110 ? 46 : headline.length > 70 ? 56 : 66

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: CREAM, color: INK, fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: NAVY, color: CREAM, padding: '26px 60px', borderBottom: `8px solid ${AMBER}` }}>
          <span style={{ fontSize: 34, fontWeight: 700, fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>FundOpsHQ</span>
          <span style={{ fontSize: 18, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 700, color: 'rgba(248,245,236,0.7)' }}>
            News for private markets
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px' }}>
          {story && (
            <div style={{ display: 'flex', fontSize: 22, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 800, color: OCHRE, marginBottom: 22 }}>
              {kickerLabel(story)}
            </div>
          )}
          <div style={{ display: 'flex', fontSize, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 500 }}>{headline}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 60px', borderTop: '2px solid #DDD5C3', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 22, color: MUTED }}>
          <span style={{ display: 'flex', fontWeight: 700, color: INK }}>{facts}</span>
          <span style={{ display: 'flex' }}>{story?.source ? `Reported by ${story.source}` : 'fundopshq.com'}</span>
        </div>
      </div>
    ),
    size,
  )
}
