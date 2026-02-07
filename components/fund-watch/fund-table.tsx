"use client"

import { useState, useCallback } from "react"
import {
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Newspaper,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { FundEntry } from "@/lib/content/fund-watch"
import { CATEGORY_BADGE_CLASSES, formatAum, getQuarter } from "@/lib/content/fund-watch"
import type { SortField, SortDir } from "@/lib/hooks/use-fund-watch-filters"

const STAGE_BADGE: Record<string, string> = {
  "final close": "bg-emerald-950/50 text-emerald-300 border-emerald-800",
  "first close": "bg-sky-950/50 text-sky-300 border-sky-800",
  "interim close": "bg-amber-950/50 text-amber-300 border-amber-800",
  launch: "bg-violet-950/50 text-violet-300 border-violet-800",
  other: "bg-zinc-800/50 text-zinc-300 border-zinc-700",
}

function formatDate(iso: string | null): string {
  if (!iso) return "N/A"
  const d = new Date(iso + "T00:00:00")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

interface FundTableProps {
  funds: FundEntry[]
  visibleColumns: Set<string>
  density: "comfortable" | "compact"
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
}

// Column sort field mapping
const COLUMN_SORT: Record<string, SortField> = {
  fund: "name",
  firm: "firm",
  amount: "amount",
  category: "category",
  stage: "stage",
  quarter: "quarter",
  date: "date",
  location: "location",
  covered_date: "covered_date",
}

function SortIcon({ field, currentSort, currentDir }: { field: SortField; currentSort: SortField; currentDir: SortDir }) {
  if (currentSort !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
  return currentDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
}

export function FundTable({
  funds,
  visibleColumns,
  density,
  sortField,
  sortDir,
  onSort,
}: FundTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const isVisible = useCallback((key: string) => visibleColumns.has(key), [visibleColumns])

  const toggleRow = useCallback((key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const py = density === "compact" ? "py-1" : "py-2"

  // Count visible columns + expand chevron
  const visibleColCount =
    1 + // chevron
    (isVisible("fund") ? 1 : 0) +
    (isVisible("firm") ? 1 : 0) +
    (isVisible("amount") ? 1 : 0) +
    (isVisible("category") ? 1 : 0) +
    (isVisible("stage") ? 1 : 0) +
    (isVisible("quarter") ? 1 : 0) +
    (isVisible("date") ? 1 : 0) +
    (isVisible("location") ? 1 : 0) +
    (isVisible("status") ? 1 : 0) +
    (isVisible("covered_date") ? 1 : 0) +
    (isVisible("source_name") ? 1 : 0) +
    (isVisible("description") ? 1 : 0) +
    (isVisible("source_link") ? 1 : 0)

  // Aggregate footer
  const totalAum = funds.reduce((sum, f) => sum + (f.amount_usd_millions ?? 0), 0)

  // Sortable header helper
  const SortableHead = ({ colKey, children, className }: { colKey: string; children: React.ReactNode; className?: string }) => {
    const sf = COLUMN_SORT[colKey]
    if (!sf) return <TableHead className={className}>{children}</TableHead>
    return (
      <TableHead className={className}>
        <button
          onClick={() => onSort(sf)}
          className="inline-flex items-center font-medium hover:text-foreground transition-colors"
        >
          {children}
          <SortIcon field={sf} currentSort={sortField} currentDir={sortDir} />
        </button>
      </TableHead>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 px-2" />

              {isVisible("fund") && (
                <SortableHead colKey="fund">Fund Name</SortableHead>
              )}
              {isVisible("firm") && (
                <SortableHead colKey="firm" className="hidden md:table-cell">
                  Fund Manager
                </SortableHead>
              )}
              {isVisible("amount") && (
                <SortableHead colKey="amount" className="text-right">
                  Amount
                </SortableHead>
              )}
              {isVisible("category") && (
                <SortableHead colKey="category" className="hidden md:table-cell">
                  Category
                </SortableHead>
              )}
              {isVisible("stage") && (
                <SortableHead colKey="stage" className="hidden md:table-cell">
                  Stage
                </SortableHead>
              )}
              {isVisible("quarter") && (
                <SortableHead colKey="quarter" className="hidden lg:table-cell">
                  Quarter
                </SortableHead>
              )}
              {isVisible("date") && (
                <SortableHead colKey="date" className="hidden sm:table-cell">
                  Date
                </SortableHead>
              )}
              {isVisible("location") && (
                <SortableHead colKey="location" className="hidden lg:table-cell">
                  Location
                </SortableHead>
              )}
              {isVisible("status") && (
                <TableHead className="hidden sm:table-cell">Status</TableHead>
              )}
              {isVisible("covered_date") && (
                <SortableHead colKey="covered_date" className="hidden lg:table-cell">
                  Covered
                </SortableHead>
              )}
              {isVisible("source_name") && (
                <TableHead className="hidden lg:table-cell">Source</TableHead>
              )}
              {isVisible("description") && (
                <TableHead className="hidden xl:table-cell">Description</TableHead>
              )}
              {isVisible("source_link") && (
                <TableHead className="w-10">
                  <span className="sr-only">Source</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {funds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColCount} className="text-center py-8 text-muted-foreground">
                  No funds match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              funds.map((fund, i) => {
                const rowKey = `${fund.fund_name}-${fund.firm}-${i}`
                const isExpanded = expandedRows.has(rowKey)
                const articles = fund.articles ?? []

                return (
                  <FundRow
                    key={rowKey}
                    fund={fund}
                    rowKey={rowKey}
                    index={i}
                    isExpanded={isExpanded}
                    articles={articles}
                    isVisible={isVisible}
                    py={py}
                    visibleColCount={visibleColCount}
                    onToggle={toggleRow}
                  />
                )
              })
            )}

            {/* Aggregate footer */}
            {funds.length > 0 && (
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-t">
                <TableCell className={`w-8 px-2 ${py}`} />
                <TableCell colSpan={visibleColCount - 1} className={`${py} text-sm font-medium text-muted-foreground`}>
                  {funds.length} fund{funds.length !== 1 ? "s" : ""}
                  {totalAum > 0 && <> &middot; {formatAum(totalAum)} total AUM</>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// --- Extracted row component to avoid re-renders ---

function FundRow({
  fund,
  rowKey,
  index,
  isExpanded,
  articles,
  isVisible,
  py,
  visibleColCount,
  onToggle,
}: {
  fund: FundEntry
  rowKey: string
  index: number
  isExpanded: boolean
  articles: FundEntry["articles"]
  isVisible: (key: string) => boolean
  py: string
  visibleColCount: number
  onToggle: (key: string) => void
}) {
  return (
    <>
      <TableRow
        className={`cursor-pointer ${index % 2 === 1 ? "bg-muted/20" : ""} ${isExpanded ? "border-b-0" : ""}`}
        onClick={() => onToggle(rowKey)}
      >
        <TableCell className={`w-8 px-2 ${py}`}>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>

        {isVisible("fund") && (
          <TableCell className={`${py} whitespace-nowrap`}>
            <span className="font-medium text-foreground">{fund.fund_name}</span>
            {/* Show firm inline on mobile where firm column is hidden */}
            <span className="block text-xs text-muted-foreground md:hidden">{fund.firm}</span>
            {/* Show category & stage inline on mobile */}
            <div className="flex items-center gap-1.5 mt-1 md:hidden">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${CATEGORY_BADGE_CLASSES[fund.category] ?? ""}`}
              >
                {fund.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${STAGE_BADGE[fund.stage] ?? STAGE_BADGE.other}`}
              >
                {fund.stage}
              </Badge>
            </div>
          </TableCell>
        )}
        {isVisible("firm") && (
          <TableCell className={`hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap ${py}`}>
            {fund.firm}
          </TableCell>
        )}
        {isVisible("amount") && (
          <TableCell className={`text-right font-mono text-sm whitespace-nowrap ${py}`}>
            {fund.amount === "Undisclosed" ? (
              <span className="text-muted-foreground">Undisclosed</span>
            ) : (
              fund.amount
            )}
          </TableCell>
        )}
        {isVisible("category") && (
          <TableCell className={`hidden md:table-cell whitespace-nowrap ${py}`}>
            <Badge
              variant="outline"
              className={CATEGORY_BADGE_CLASSES[fund.category] ?? ""}
            >
              {fund.category}
            </Badge>
          </TableCell>
        )}
        {isVisible("stage") && (
          <TableCell className={`hidden md:table-cell whitespace-nowrap ${py}`}>
            <Badge
              variant="outline"
              className={STAGE_BADGE[fund.stage] ?? STAGE_BADGE.other}
            >
              {fund.stage}
            </Badge>
          </TableCell>
        )}
        {isVisible("quarter") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap ${py}`}>
            {getQuarter(fund.announcement_date) ?? "N/A"}
          </TableCell>
        )}
        {isVisible("date") && (
          <TableCell className={`hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap ${py}`}>
            {formatDate(fund.announcement_date)}
          </TableCell>
        )}
        {isVisible("location") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap ${py}`}>
            {fund.location}
          </TableCell>
        )}
        {isVisible("status") && (
          <TableCell className={`hidden sm:table-cell whitespace-nowrap ${py}`}>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  fund.is_covered ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {fund.is_covered ? "Covered" : "Pending"}
              </span>
            </span>
          </TableCell>
        )}
        {isVisible("covered_date") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap ${py}`}>
            {formatDate(fund.covered_date)}
          </TableCell>
        )}
        {isVisible("source_name") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap ${py}`}>
            {fund.source_name}
          </TableCell>
        )}
        {isVisible("description") && (
          <TableCell className={`hidden xl:table-cell text-sm text-muted-foreground ${py}`}>
            <span className="block max-w-[400px]">{fund.description_notes || "\u2014"}</span>
          </TableCell>
        )}
        {isVisible("source_link") && (
          <TableCell className={py}>
            {fund.source_url && (
              <a
                href={fund.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={fund.source_name || "Source"}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </TableCell>
        )}
      </TableRow>

      {/* Expanded detail row */}
      {isExpanded && (
        <TableRow className={index % 2 === 1 ? "bg-muted/20" : ""}>
          <TableCell colSpan={visibleColCount} className="px-4 sm:px-10 py-4 border-t-0">
            <div className="space-y-3">
              {/* Mobile-only details */}
              <div className="sm:hidden space-y-1">
                <p className="text-xs text-muted-foreground">
                  {formatDate(fund.announcement_date)}
                </p>
                {fund.location && fund.location !== "N/A" && (
                  <p className="text-xs text-muted-foreground">Location: {fund.location}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {fund.is_covered ? "Covered" : "Pending"}
                  {fund.covered_date && ` on ${formatDate(fund.covered_date)}`}
                </p>
              </div>

              {/* Description */}
              {fund.description_notes && (
                <p className="text-sm text-muted-foreground">
                  {fund.description_notes}
                </p>
              )}

              {/* Sources */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Newspaper className="h-3 w-3" />
                  Sources
                </p>
                {!fund.source_url && articles.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">No sources available</p>
                ) : (
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
                          {fund.source_name || "Source"}
                        </a>
                        {fund.source_name && (
                          <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0">
                            {fund.source_name}
                          </Badge>
                        )}
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
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
