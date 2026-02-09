"use client"

import { useState, useCallback, useRef, useMemo, memo } from "react"
import Link from "next/link"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FundExpandedDetail } from "@/components/fund-watch/fund-expanded-detail"
import { ColumnFilterPopover } from "@/components/fund-watch/column-filter-popover"
import { ResizeHandle } from "@/components/fund-watch/resize-handle"
import type { FundEntry } from "@/lib/content/fund-watch"
import {
  CATEGORY_BADGE_CLASSES,
  STAGE_BADGE_CLASSES,
  formatAum,
  formatDate,
  getColumnValue,
  getFirmSlug,
  getQuarter,
  titleCase,
} from "@/lib/content/fund-watch"
import type { SortField, SortDir } from "@/lib/hooks/use-fund-watch-filters"
import {
  COLUMN_ORDER,
  FILTERABLE_COLUMNS,
  getColumnDef,
} from "@/lib/content/fund-watch-columns"

interface FundTableProps {
  funds: FundEntry[]
  allFunds: FundEntry[]
  visibleColumns: Set<string>
  density: "comfortable" | "compact"
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  columnWidths: Record<string, number>
  onColumnResize: (key: string, width: number) => void
  columnFilters: Record<string, string[]>
  onColumnFilter: (col: string, vals: string[]) => void
  stickyHeaderTop?: number
}

function SortIcon({ field, currentSort, currentDir }: { field: SortField; currentSort: SortField; currentDir: SortDir }) {
  if (currentSort !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
  return currentDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
}

export function FundTable({
  funds,
  allFunds,
  visibleColumns,
  density,
  sortField,
  sortDir,
  onSort,
  columnWidths,
  onColumnResize,
  columnFilters,
  onColumnFilter,
  stickyHeaderTop = 0,
}: FundTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Compute unique values per filterable column from allFunds (so options don't disappear when filtered)
  const uniqueColumnValues = useMemo(() => {
    const result: Record<string, string[]> = {}
    for (const col of FILTERABLE_COLUMNS) {
      const counts = new Map<string, number>()
      for (const f of allFunds) {
        const v = getColumnValue(f, col)
        counts.set(v, (counts.get(v) ?? 0) + 1)
      }
      result[col] = [...counts.keys()].sort((a, b) => a.localeCompare(b))
    }
    return result
  }, [allFunds])

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

  // Header cell renderer with sort + resize
  const renderHeaderCell = (colKey: string) => {
    const w = columnWidths[colKey] ?? 100
    const style: React.CSSProperties = { width: w, minWidth: 40, position: "relative", overflow: "hidden" }
    const baseClass = "h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50"

    if (colKey === "chevron") {
      return (
        <th key={colKey} className={`${baseClass} px-2`} style={{ width: w, minWidth: 40, position: "relative" }}>
          <ResizeHandle onResize={makeResizeHandler("chevron")} />
        </th>
      )
    }

    const def = getColumnDef(colKey)
    const sf = def?.sortKey
    const tooltip = def?.tooltip
    const label = def?.label ?? colKey

    // Responsive classes for specific columns
    const responsiveClass =
      colKey === "firm" || colKey === "category" || colKey === "stage"
        ? "hidden md:table-cell"
        : colKey === "quarter" || colKey === "city" || colKey === "state" || colKey === "country" || colKey === "source_name" || colKey === "date_added" || colKey === "website"
        ? "hidden lg:table-cell"
        : colKey === "date"
        ? "hidden sm:table-cell"
        : ""

    const extraClass = colKey === "amount" ? "text-right" : ""

    const filterPopover = FILTERABLE_COLUMNS.has(colKey) ? (
      <ColumnFilterPopover
        column={colKey}
        values={uniqueColumnValues[colKey] ?? []}
        selected={columnFilters[colKey] ?? []}
        onChange={(vals) => onColumnFilter(colKey, vals)}
      />
    ) : null

    if (sf) {
      return (
        <th key={colKey} className={`${baseClass} ${responsiveClass} ${extraClass}`} style={style}>
          <div className="inline-flex items-center gap-0.5">
            <button
              onClick={() => onSort(sf)}
              className="inline-flex items-center font-medium hover:text-foreground transition-colors"
              title={tooltip}
            >
              {label}
              <SortIcon field={sf} currentSort={sortField} currentDir={sortDir} />
            </button>
            {filterPopover}
          </div>
          <ResizeHandle onResize={makeResizeHandler(colKey)} />
        </th>
      )
    }

    return (
      <th key={colKey} className={`${baseClass} ${responsiveClass} ${extraClass}`} style={style}>
        <div className="inline-flex items-center gap-0.5">
          <span title={tooltip}>{label}</span>
          {filterPopover}
        </div>
        <ResizeHandle onResize={makeResizeHandler(colKey)} />
      </th>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="border-b">
              {visibleCols.map((colKey) => renderHeaderCell(colKey))}
            </tr>
          </thead>
          <tbody>
            {funds.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="text-center py-8 text-muted-foreground">
                  No funds match the current filters.
                </td>
              </tr>
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
              <tr className="bg-muted/30 border-t">
                <td className={`px-2 ${py}`} />
                <td colSpan={visibleColCount - 1} className={`${py} text-sm font-medium text-muted-foreground p-4`}>
                  {funds.length} fund{funds.length !== 1 ? "s" : ""}
                  {totalAum > 0 && <> &middot; {formatAum(totalAum)} total AUM</>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Memoized row component ---

interface FundRowProps {
  fund: FundEntry
  rowKey: string
  index: number
  isExpanded: boolean
  articles: FundEntry["articles"]
  isVisible: (key: string) => boolean
  py: string
  visibleColCount: number
  onToggle: (key: string) => void
}

const FundRow = memo(function FundRow({
  fund,
  rowKey,
  index,
  isExpanded,
  articles,
  isVisible,
  py,
  visibleColCount,
  onToggle,
}: FundRowProps) {
  const cellClass = "p-4 align-middle [&:has([role=checkbox])]:pr-0"

  return (
    <>
      <tr
        className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/20" : ""} ${isExpanded ? "border-b-0" : ""}`}
        onClick={() => onToggle(rowKey)}
      >
        <td className={`${cellClass} px-2 ${py}`}>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </td>

        {isVisible("fund") && (
          <td className={`${cellClass} ${py} whitespace-nowrap overflow-hidden`}>
            <span className="font-medium text-foreground truncate block">{fund.fund_name}</span>
            {/* Show firm inline on mobile where firm column is hidden */}
            <Link
              href={`/fund-watch/managers/${getFirmSlug(fund)}`}
              className="block text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {fund.firm}
            </Link>
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
                className={`text-[10px] px-1.5 py-0 ${STAGE_BADGE_CLASSES[fund.stage] ?? STAGE_BADGE_CLASSES.other}`}
              >
                {titleCase(fund.stage)}
              </Badge>
            </div>
          </td>
        )}
        {isVisible("firm") && (
          <td className={`${cellClass} hidden md:table-cell text-sm whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            <Link
              href={`/fund-watch/managers/${getFirmSlug(fund)}`}
              className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {fund.firm}
            </Link>
          </td>
        )}
        {isVisible("website") && (
          <td className={`${cellClass} hidden lg:table-cell text-sm whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.firm_website ? (
              <a
                href={`https://${fund.firm_website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {fund.firm_website}
              </a>
            ) : (
              <span className="text-muted-foreground">{"\u2014"}</span>
            )}
          </td>
        )}
        {isVisible("amount") && (
          <td className={`${cellClass} text-right font-mono text-sm whitespace-nowrap overflow-hidden ${py}`}>
            {fund.amount === "Undisclosed" ? (
              <span className="text-muted-foreground">Undisclosed</span>
            ) : (
              fund.amount
            )}
          </td>
        )}
        {isVisible("category") && (
          <td className={`${cellClass} hidden md:table-cell whitespace-nowrap overflow-hidden ${py}`}>
            <Badge
              variant="outline"
              className={CATEGORY_BADGE_CLASSES[fund.category] ?? ""}
            >
              {fund.category}
            </Badge>
          </td>
        )}
        {isVisible("stage") && (
          <td className={`${cellClass} hidden md:table-cell whitespace-nowrap overflow-hidden ${py}`}>
            <Badge
              variant="outline"
              className={STAGE_BADGE_CLASSES[fund.stage] ?? STAGE_BADGE_CLASSES.other}
            >
              {titleCase(fund.stage)}
            </Badge>
          </td>
        )}
        {isVisible("quarter") && (
          <td className={`${cellClass} hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {getQuarter(fund.announcement_date) ?? "N/A"}
          </td>
        )}
        {isVisible("date") && (
          <td className={`${cellClass} hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {formatDate(fund.announcement_date)}
          </td>
        )}
        {isVisible("date_added") && (
          <td className={`${cellClass} hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.date_added ? formatDate(fund.date_added) : "N/A"}
          </td>
        )}
        {isVisible("city") && (
          <td className={`${cellClass} hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.city || "N/A"}
          </td>
        )}
        {isVisible("state") && (
          <td className={`${cellClass} hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.state || "\u2014"}
          </td>
        )}
        {isVisible("country") && (
          <td className={`${cellClass} hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.country || "\u2014"}
          </td>
        )}
        {isVisible("source_name") && (
          <td className={`${cellClass} hidden lg:table-cell text-sm whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            {fund.source_url ? (
              <a
                href={fund.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
                title={fund.source_name || "Source"}
                onClick={(e) => e.stopPropagation()}
              >
                {fund.source_name || "Source"}
              </a>
            ) : (
              <span className="text-muted-foreground">{fund.source_name || "\u2014"}</span>
            )}
          </td>
        )}
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr className={index % 2 === 1 ? "bg-muted/20" : ""}>
          <td colSpan={visibleColCount} className="p-0 border-t-0">
            <FundExpandedDetail fund={fund} articles={articles} />
          </td>
        </tr>
      )}
    </>
  )
})
