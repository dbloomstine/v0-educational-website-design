"use client"

import { useState, useCallback, useRef, useMemo } from "react"
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A"
  // Handle both date-only (YYYY-MM-DD) and datetime (YYYY-MM-DDTHH:MM:SS) strings
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00")
  if (isNaN(d.getTime())) return "N/A"
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
  columnWidths: Record<string, number>
  onColumnResize: (key: string, width: number) => void
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
  date_added: "date_added",
  city: "city",
  state: "state",
  country: "country",
}

// Ordered list of all column keys (for building the header/cells in order)
const COLUMN_ORDER = [
  "chevron",
  "fund",
  "firm",
  "amount",
  "category",
  "stage",
  "quarter",
  "date",
  "date_added",
  "city",
  "state",
  "country",
  "source_name",
  "source_link",
]

// Tooltip text for each column header
const TOOLTIP_MAP: Record<string, string> = {
  fund: "Name of the fund vehicle",
  firm: "General partner or management firm",
  amount: "Total fund size or capital raised",
  category: "Fund strategy type (PE, VC, Credit, etc.)",
  stage: "Fundraising milestone: first close, interim close, final close, or launch",
  quarter: "Fiscal quarter of the announcement",
  date: "When the fund close/launch was publicly announced",
  date_added: "When this fund was added to FundWatch",
  city: "Firm headquarters city",
  state: "State or province (US/Canada)",
  country: "Country where the firm is headquartered",
  source_name: "Primary news source for the announcement",
}

function SortIcon({ field, currentSort, currentDir }: { field: SortField; currentSort: SortField; currentDir: SortDir }) {
  if (currentSort !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
  return currentDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
}

// --- Resize handle ---

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const startXRef = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      startXRef.current = e.clientX
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      const onMouseMove = (me: MouseEvent) => {
        const delta = me.clientX - startXRef.current
        startXRef.current = me.clientX
        onResize(delta)
      }

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [onResize]
  )

  return (
    <div
      onMouseDown={onMouseDown}
      className="hidden md:block absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-40 group/handle"
      style={{ touchAction: "none" }}
    >
      <div className="absolute right-[2px] top-2 bottom-2 w-[1px] bg-border opacity-0 group-hover/handle:opacity-100 transition-opacity" />
    </div>
  )
}

export function FundTable({
  funds,
  visibleColumns,
  density,
  sortField,
  sortDir,
  onSort,
  columnWidths,
  onColumnResize,
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

  // Build visible column list in order
  const visibleCols = useMemo(() => {
    return COLUMN_ORDER.filter((key) => key === "chevron" || visibleColumns.has(key))
  }, [visibleColumns])

  const visibleColCount = visibleCols.length

  // Compute total table width from visible column widths
  const totalTableWidth = useMemo(() => {
    return visibleCols.reduce((sum, key) => sum + (columnWidths[key] ?? 100), 0)
  }, [visibleCols, columnWidths])

  // Chevron width for sticky offset
  const chevronWidth = columnWidths.chevron ?? 40
  const fundWidth = columnWidths.fund ?? 220

  // Aggregate footer
  const totalAum = funds.reduce((sum, f) => sum + (f.amount_usd_millions ?? 0), 0)

  // Keep a ref to latest columnWidths so resize handlers don't go stale mid-drag
  const columnWidthsRef = useRef(columnWidths)
  columnWidthsRef.current = columnWidths

  // Resize handler factory — reads from ref to avoid stale closures during drag
  const makeResizeHandler = useCallback(
    (key: string) => (delta: number) => {
      const current = columnWidthsRef.current[key] ?? 100
      const newWidth = Math.max(50, current + delta)
      onColumnResize(key, newWidth)
    },
    [onColumnResize]
  )

  // Sticky styles
  const chevronStickyStyle: React.CSSProperties = {
    position: "sticky",
    left: 0,
    width: chevronWidth,
    minWidth: chevronWidth,
  }

  const fundStickyStyle: React.CSSProperties = {
    position: "sticky",
    left: chevronWidth,
    width: fundWidth,
    minWidth: fundWidth,
    boxShadow: "2px 0 4px -2px rgba(0,0,0,0.1)",
  }

  // Header cell renderer with sort + resize
  const renderHeaderCell = (colKey: string) => {
    const w = columnWidths[colKey] ?? 100
    const style: React.CSSProperties = { width: w, minWidth: w, position: "relative", overflow: "hidden" }
    const sf = COLUMN_SORT[colKey]

    // Sticky overrides for chevron and fund
    if (colKey === "chevron") {
      return (
        <TableHead
          key={colKey}
          className="px-2 bg-background z-30"
          style={{ ...chevronStickyStyle, position: "sticky", zIndex: 30 }}
        >
          <ResizeHandle onResize={makeResizeHandler("chevron")} />
        </TableHead>
      )
    }

    if (colKey === "fund") {
      return (
        <TableHead
          key={colKey}
          className="bg-background z-30"
          style={{ ...fundStickyStyle, position: "sticky", zIndex: 30 }}
        >
          <button
            onClick={() => onSort(COLUMN_SORT.fund)}
            className="inline-flex items-center font-medium hover:text-foreground transition-colors"
            title={TOOLTIP_MAP.fund}
          >
            Fund Name
            <SortIcon field={COLUMN_SORT.fund} currentSort={sortField} currentDir={sortDir} />
          </button>
          <ResizeHandle onResize={makeResizeHandler("fund")} />
        </TableHead>
      )
    }

    // Responsive classes for specific columns
    const responsiveClass =
      colKey === "firm" || colKey === "category" || colKey === "stage"
        ? "hidden md:table-cell"
        : colKey === "quarter" || colKey === "city" || colKey === "state" || colKey === "country" || colKey === "source_name" || colKey === "date_added"
        ? "hidden lg:table-cell"
        : colKey === "date"
        ? "hidden sm:table-cell"
        : ""

    const extraClass = colKey === "amount" ? "text-right" : ""

    if (colKey === "source_link") {
      return (
        <TableHead key={colKey} className={responsiveClass} style={{ ...style, position: "relative" }}>
          <span className="sr-only">Source</span>
          <ResizeHandle onResize={makeResizeHandler(colKey)} />
        </TableHead>
      )
    }

    const labelMap: Record<string, string> = {
      firm: "Fund Manager",
      amount: "Amount",
      category: "Category",
      stage: "Stage",
      quarter: "Quarter",
      date: "Date",
      date_added: "Date Added",
      city: "City",
      state: "State",
      country: "Country",
      source_name: "Source",
    }

    const tooltip = TOOLTIP_MAP[colKey]

    if (sf) {
      return (
        <TableHead key={colKey} className={`${responsiveClass} ${extraClass}`} style={{ ...style, position: "relative" }}>
          <button
            onClick={() => onSort(sf)}
            className="inline-flex items-center font-medium hover:text-foreground transition-colors"
            title={tooltip}
          >
            {labelMap[colKey] ?? colKey}
            <SortIcon field={sf} currentSort={sortField} currentDir={sortDir} />
          </button>
          <ResizeHandle onResize={makeResizeHandler(colKey)} />
        </TableHead>
      )
    }

    return (
      <TableHead key={colKey} className={`${responsiveClass} ${extraClass}`} style={{ ...style, position: "relative" }}>
        <span title={tooltip}>{labelMap[colKey] ?? colKey}</span>
        <ResizeHandle onResize={makeResizeHandler(colKey)} />
      </TableHead>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table
        className="w-auto"
        style={{ tableLayout: "fixed", width: totalTableWidth }}
      >
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="hover:bg-transparent">
            {visibleCols.map((colKey) => renderHeaderCell(colKey))}
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
                  chevronWidth={chevronWidth}
                  fundWidth={fundWidth}
                />
              )
            })
          )}

          {/* Aggregate footer */}
          {funds.length > 0 && (
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-t">
              <TableCell className={`px-2 ${py}`} />
              <TableCell colSpan={visibleColCount - 1} className={`${py} text-sm font-medium text-muted-foreground`}>
                {funds.length} fund{funds.length !== 1 ? "s" : ""}
                {totalAum > 0 && <> &middot; {formatAum(totalAum)} total AUM</>}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
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
  chevronWidth,
  fundWidth,
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
  chevronWidth: number
  fundWidth: number
}) {
  const rowBg = index % 2 === 1 ? "bg-muted/20" : "bg-background"

  return (
    <>
      <TableRow
        className={`cursor-pointer ${index % 2 === 1 ? "bg-muted/20" : ""} ${isExpanded ? "border-b-0" : ""}`}
        onClick={() => onToggle(rowKey)}
      >
        <TableCell
          className={`px-2 ${py} ${rowBg} z-20`}
          style={{ position: "sticky", left: 0 }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>

        {isVisible("fund") && (
          <TableCell
            className={`${py} whitespace-nowrap overflow-hidden ${rowBg} z-20`}
            style={{
              position: "sticky",
              left: chevronWidth,
              boxShadow: "2px 0 4px -2px rgba(0,0,0,0.1)",
            }}
          >
            <span className="font-medium text-foreground truncate block">{fund.fund_name}</span>
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
          <TableCell className={`hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.firm}
          </TableCell>
        )}
        {isVisible("amount") && (
          <TableCell className={`text-right font-mono text-sm whitespace-nowrap overflow-hidden ${py}`}>
            {fund.amount === "Undisclosed" ? (
              <span className="text-muted-foreground">Undisclosed</span>
            ) : (
              fund.amount
            )}
          </TableCell>
        )}
        {isVisible("category") && (
          <TableCell className={`hidden md:table-cell whitespace-nowrap overflow-hidden ${py}`}>
            <Badge
              variant="outline"
              className={CATEGORY_BADGE_CLASSES[fund.category] ?? ""}
            >
              {fund.category}
            </Badge>
          </TableCell>
        )}
        {isVisible("stage") && (
          <TableCell className={`hidden md:table-cell whitespace-nowrap overflow-hidden ${py}`}>
            <Badge
              variant="outline"
              className={STAGE_BADGE[fund.stage] ?? STAGE_BADGE.other}
            >
              {fund.stage}
            </Badge>
          </TableCell>
        )}
        {isVisible("quarter") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {getQuarter(fund.announcement_date) ?? "N/A"}
          </TableCell>
        )}
        {isVisible("date") && (
          <TableCell className={`hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {formatDate(fund.announcement_date)}
          </TableCell>
        )}
        {isVisible("date_added") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.date_added ? formatDate(fund.date_added) : "N/A"}
          </TableCell>
        )}
        {isVisible("city") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.city || "N/A"}
          </TableCell>
        )}
        {isVisible("state") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.state || "\u2014"}
          </TableCell>
        )}
        {isVisible("country") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.country || "\u2014"}
          </TableCell>
        )}
        {isVisible("source_name") && (
          <TableCell className={`hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.source_name}
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
                {fund.city && fund.city !== "N/A" && (
                  <p className="text-xs text-muted-foreground">
                    {fund.city}{fund.state ? `, ${fund.state}` : ""}{fund.country ? ` (${fund.country})` : ""}
                  </p>
                )}
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
