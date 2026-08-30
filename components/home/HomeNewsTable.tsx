import {
  EVENT_LABELS,
  CATEGORY_LABELS,
  decodeHtmlEntities,
  formatFundSize,
  formatCompactTime,
  firmLabelFor,
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
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {groups.map(({ primaryArticle: a, clusterSize }) => {
        const size = formatFundSize(a.fundSizeUsd)
        const isConverted = a.originalCurrency
          ? a.originalCurrency !== 'USD'
          : !!(a.fundSizeUsd && /[€£¥]|EUR |GBP |CHF /i.test(a.title))
        const displaySize = size ? (isConverted ? `≈${size}` : size) : null

        // Most fund headlines already name the firm ("GenNx360 scores $865m
        // Fund IV close"), so repeating it in the meta just steals width from
        // the headline. firmLabelFor returns null in that case.
        const title = decodeHtmlEntities(a.title)
        const showFirm = firmLabelFor(a.firmName, title)

        // Source and cluster count live on /news; the hub keeps the trailing
        // meta to the classification a scanner actually sorts on.
        const meta = [
          a.eventType ? EVENT_LABELS[a.eventType]?.short : undefined,
          a.fundCategories.slice(0, 1).map((c) => CATEGORY_LABELS[c]?.label || c).join('') || undefined,
          displaySize ?? undefined,
        ]
          .filter(Boolean)
          .join(' · ')

        return (
          <a
            key={a.id}
            href={a.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 border-b border-border/40 px-3 py-1.5 transition-colors last:border-b-0 hover:bg-accent/30"
          >
            {/* Wide screens fit the headline on one line, so the meta trails
                it and the row costs a single line. Narrow screens stack, where
                a two-line headline plus its meta still beats truncation.
                No `block` on the clamped headline — Tailwind's line-clamp sets
                display to -webkit-box and `block` would override it. */}
            <span className="min-w-0 flex-1 lg:flex lg:items-baseline lg:gap-2">
              <span className="text-[13.5px] font-semibold leading-snug text-foreground line-clamp-2 lg:truncate lg:line-clamp-none group-hover:text-amber-400 transition-colors">
                {title}
              </span>
              {(showFirm || meta) && (
                <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground/50 lg:mt-0 lg:shrink-0">
                  {showFirm && (
                    <span className="font-semibold text-muted-foreground/80">{showFirm}</span>
                  )}
                  {showFirm && meta ? ' · ' : ''}
                  {meta}
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
