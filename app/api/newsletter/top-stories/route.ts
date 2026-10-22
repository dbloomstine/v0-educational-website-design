import { NextResponse } from 'next/server'
import { loadStories } from '@/lib/news/front-page'
import { composeFrontPage } from '@/lib/news/stories'
import { kickerLabel, sizeLabel, stageLabel } from '@/lib/news/format'
import { splitHeadlineByEntities, type HeadlineSegment } from '@/lib/news/constants'

// This morning's top stories, for the welcome screen (components/newsletter/SignupTakeover.tsx): the front page's
// lead and its first top stories, set as /join's excerpt sets them (components/join/EditionExcerpt.tsx), reduced
// to what the screen prints. Read from the front page's own story cache (lib/news/front-page.ts); no query of its
// own, and rebuilt on the front page's clock.
export const revalidate = 600

export interface TakeoverStory {
  id: string
  kicker: string
  segments: HeadlineSegment[]
}

export async function GET() {
  try {
    const front = composeFrontPage(await loadStories(), Date.now())
    const stories: TakeoverStory[] = [front.lead, ...front.top]
      .filter((s): s is NonNullable<typeof s> => s != null)
      .slice(0, 3)
      .map((s) => {
        const sized = s.kind === 'fundraising' || s.kind === 'deals' || s.kind === 'lps'
        return {
          id: String(s.id),
          kicker: [kickerLabel(s), sized && s.leadEligible ? sizeLabel(s.sizeUsdM) : null, stageLabel(s)].filter(Boolean).join(' · '),
          segments: splitHeadlineByEntities(s.headline, s.entities.length ? s.entities : [s.firmName, s.personName]),
        }
      })
    return NextResponse.json({ stories })
  } catch {
    return NextResponse.json({ stories: [] })
  }
}
