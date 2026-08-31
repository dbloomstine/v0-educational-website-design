import {
  decodeHtmlEntities,
  formatCompactTime,
  firmLabelFor,
  splitHeadlineByEntities,
} from '@/lib/news/constants'
import type { ArticleGroup } from '@/lib/news/types'

// Homepage news table — server-rendered, zero client JS. The homepage's job
// is "what happened, at a glance"; /news is where search and filtering live.
//
// Each row is a direct link to the story: headline first and bold, with
// everything else (firm, type, asset class, fund size, source) reduced to one
// quiet line beneath. Firm favicons were removed site-wide on 2026-08-30 —
// the firm's NAME leads the meta line now, which is what actually identifies
// it in a scan.

export function HomeNewsTable({ groups }: { groups: ArticleGroup[] }) {
  if (groups.length === 0) return null

  return (
    <div>
      {groups.map(({ primaryArticle: a }) => {
        // Most fund headlines already name the firm ("GenNx360 scores $865m
        // Fund IV close"), so repeating it in the meta just steals width from
        // the headline. firmLabelFor returns null in that case.
        const title = decodeHtmlEntities(a.title)
        const showFirm = firmLabelFor(a.firmName, title)

        // Only the actor is bold — the headline's remaining words sit at
        // regular weight so the eye lands on who did the thing.
        const headline = splitHeadlineByEntities(title, [
          a.firmName,
          ...a.coFirms,
          a.personName,
        ])

        return (
          <a
            key={a.id}
            href={a.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={a.tldr ?? undefined}
            className="group flex items-start gap-3 rounded px-2 py-1 lg:py-[3px] transition-colors hover:bg-accent/30"
          >
            {/* Wide screens fit the headline on one line, so the meta trails
                it and the row costs a single line. Narrow screens stack, where
                a two-line headline plus its meta still beats truncation.
                No `block` on the clamped headline — Tailwind's line-clamp sets
                display to -webkit-box and `block` would override it. */}
            <span className="min-w-0 flex-1 lg:flex lg:items-baseline lg:gap-2">
              <span className="text-[13.5px] font-normal leading-snug text-foreground line-clamp-2 lg:truncate lg:line-clamp-none group-hover:text-amber-400 transition-colors">
                {headline.map((seg, i) =>
                  seg.bold ? (
                    <strong key={i} className="font-semibold">{seg.text}</strong>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}
              </span>
              {showFirm && (
                <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground/60 lg:mt-0 lg:shrink-0">
                  {showFirm}
                </span>
              )}
            </span>

            <span className="shrink-0 pt-0.5 text-[10px] tabular-nums text-muted-foreground/50">
              {a.publishedDate ? formatCompactTime(a.publishedDate, '7d') : ''}
            </span>
          </a>
        )
      })}
    </div>
  )
}
