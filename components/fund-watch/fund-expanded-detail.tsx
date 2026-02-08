import Link from "next/link"
import { Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { FundEntry } from "@/lib/content/fund-watch"
import { formatDate, getFirmSlug, titleCase } from "@/lib/content/fund-watch"

function DetailItem({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm truncate ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</p>
    </div>
  )
}

interface FundExpandedDetailProps {
  fund: FundEntry
  articles: FundEntry["articles"]
  showFirmLink?: boolean
  gridCols?: string
}

export function FundExpandedDetail({
  fund,
  articles,
  showFirmLink = true,
  gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: FundExpandedDetailProps) {
  return (
    <div className="px-4 sm:px-10 py-5">
      <div className="max-w-3xl space-y-4">
        {fund.description_notes && (
          <p className="text-sm text-foreground/90 leading-relaxed capitalize">
            {fund.description_notes}
          </p>
        )}

        <div className={`grid ${gridCols} gap-x-6 gap-y-3`}>
          {showFirmLink ? (
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Fund Manager</p>
              <Link
                href={`/fund-watch/managers/${getFirmSlug(fund)}`}
                className="text-sm text-foreground hover:underline underline-offset-2 transition-colors truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {fund.firm}
              </Link>
            </div>
          ) : (
            <DetailItem label="Category" value={fund.category} />
          )}
          {showFirmLink && (
            <>
              <DetailItem label="Fund Size" value={fund.amount === "Undisclosed" ? "Undisclosed" : fund.amount} muted={fund.amount === "Undisclosed"} />
              <DetailItem label="Stage" value={titleCase(fund.stage)} />
              <DetailItem label="Category" value={fund.category} />
            </>
          )}
          {!showFirmLink && (
            <>
              {/* Manager page shows fewer detail items since they're already in context */}
            </>
          )}
          {(fund.city && fund.city !== "N/A") ? (
            <DetailItem
              label="Headquarters"
              value={[fund.city, fund.state, fund.country].filter(Boolean).join(", ")}
            />
          ) : fund.location && fund.location !== "N/A" ? (
            <DetailItem label="Headquarters" value={fund.location} />
          ) : null}
          <DetailItem label="Announced" value={formatDate(fund.announcement_date)} muted={!fund.announcement_date} />
        </div>

        {(fund.source_url || articles.length > 0) && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Newspaper className="h-3 w-3" />
              Sources
            </p>
            <div className="space-y-1.5">
              {fund.source_url && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <a
                    href={fund.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline underline-offset-2 line-clamp-1 min-w-0 break-all sm:break-normal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {fund.source_name || "View source"}
                  </a>
                  {fund.announcement_date && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(fund.announcement_date)}
                    </span>
                  )}
                </div>
              )}
              {articles
                .filter((article) => article.url !== fund.source_url)
                .map((article, ai) => (
                  <div key={ai} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline underline-offset-2 line-clamp-1 min-w-0 break-all sm:break-normal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {article.title}
                    </a>
                    {article.source_name && (
                      <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0">
                        {article.source_name}
                      </Badge>
                    )}
                    {article.published_date && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(article.published_date)}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
