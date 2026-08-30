import { FirmLogo } from '@/components/news/FirmLogo'
import {
  EVENT_LABELS,
  CATEGORY_LABELS,
  decodeHtmlEntities,
  formatFundSize,
  formatCompactTime,
} from '@/lib/news/constants'
import type { ArticleGroup } from '@/lib/news/types'

// Homepage news table — server-rendered, no filters, no hover cards, no
// client JS beyond the logo's fallback walk. The homepage's job is "what
// happened, at a glance"; /news is where search and filtering live.
//
// Each row is a direct link to the story. Headline first and bold, one small
// logo, and everything else (type, asset class, fund size, source) reduced to
// one quiet trailing line.

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

        const meta = [
          a.firmName,
          a.eventType ? EVENT_LABELS[a.eventType]?.short : undefined,
          a.fundCategories.slice(0, 1).map((c) => CATEGORY_LABELS[c]?.label || c).join('') || undefined,
          displaySize ?? undefined,
          a.sourceName || undefined,
          clusterSize > 1 ? `${clusterSize} sources` : undefined,
        ]
          .filter(Boolean)
          .join(' · ')

        return (
          <a
            key={a.id}
            href={a.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2 border-b border-border/40 px-3 py-1.5 transition-colors last:border-b-0 hover:bg-accent/30"
          >
            <span className="shrink-0 pt-0.5">
              <FirmLogo domain={a.firmDomain} firmName={a.firmName} sourceName={a.sourceName} size={16} />
            </span>

            <span className="min-w-0 flex-1">
              {/* No `block` here — Tailwind's line-clamp sets display to
                  -webkit-box, and `block` overrides it, unclamping the text. */}
              <span className="text-[13.5px] font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-amber-400 transition-colors">
                {decodeHtmlEntities(a.title)}
              </span>
              {meta && (
                <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-wide text-muted-foreground/50">
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
