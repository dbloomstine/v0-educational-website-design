import type { Story } from '@/lib/news/stories'
import { kickerLabel, sizeLabel, stageLabel } from '@/lib/news/format'
import { topStoryLine } from '@/lib/newsletter/email-template'
import { Headline } from '@/components/story/Headline'

/**
 * The top of the email, on /join (2026-10-22 design review). Morning Brew, Axios Pro and Exec Sum sign-up pages lead
 * with the email itself: "five minutes, and you know what moved" is a claim, the stories are the proof.
 *
 * Real stories, never typed: the front page's lead and top stories (lib/news/front-page.ts loadStories, the cache the
 * front page already reads; no query of its own), set the way the email sets its "This morning's top stories" block
 * (lib/newsletter/email-template.ts): the market or type in small capitals, the headline with the names bold, and the
 * one line under it the email prints (topStoryLine). The headlines are not links: this is a picture of the email,
 * and the reader came here to sign up.
 */
export function EditionExcerpt({ stories, date }: { stories: Story[]; date: string }) {
  if (stories.length === 0) return null
  return (
    <figure aria-labelledby="excerpt-head" className="m-0">
      <div className="border border-foreground/15 bg-card shadow-[0_18px_44px_-24px_rgba(8,16,30,0.45)]">
        <div className="flex items-baseline justify-between gap-3 bg-[var(--ink)] px-4 py-2 text-[var(--ink-foreground)]">
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.14em]">FundOps Daily</span>
          <span className="font-ui text-[11px] font-semibold tracking-[0.04em] text-[var(--tab)]">{date}</span>
        </div>
        <div className="px-4 pb-3 pt-4">
          <h2 id="excerpt-head" className="font-news text-[20px] font-bold leading-tight text-foreground">
            This morning’s <span className="italic" style={{ color: 'var(--display-accent)' }}>top stories.</span>
          </h2>
          <ol className="mt-2 border-t-2 border-foreground">
            {stories.map((s) => {
              const sized = s.kind === 'fundraising' || s.kind === 'deals' || s.kind === 'lps'
              const kicker = [kickerLabel(s), sized && s.leadEligible ? sizeLabel(s.sizeUsdM) : null, stageLabel(s)].filter(Boolean).join(' · ')
              const line = topStoryLine({ title: s.headline, tldr: s.summary })
              return (
                <li key={s.id} className="border-b border-border py-2.5 last:border-b-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400">{kicker}</p>
                  <p className="mt-0.5 font-news text-[17px] leading-[1.27] text-foreground">
                    <Headline story={s} />
                  </p>
                  {line && <p className="mt-1 line-clamp-2 font-ui text-[13px] leading-[1.45] text-foreground/70">{line}</p>}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
      <figcaption className="mt-2 font-ui text-[12.5px] leading-snug text-muted-foreground">
        Today’s top stories from fundopshq.com, set as the email opens. The full edition goes on through every section.
      </figcaption>
    </figure>
  )
}
