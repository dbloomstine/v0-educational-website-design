"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  ListFilter,
  Newspaper,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { FundEntry } from "@/lib/content/fund-watch"
import { CATEGORY_BADGE_CLASSES, formatAum, getQuarter, slugify } from "@/lib/content/fund-watch"
import type { SortField, SortDir } from "@/lib/hooks/use-fund-watch-filters"

const STAGE_BADGE: Record<string, string> = {
  "final close": "bg-emerald-950/50 text-emerald-300 border-emerald-800",
  "first close": "bg-sky-950/50 text-sky-300 border-sky-800",
  "interim close": "bg-amber-950/50 text-amber-300 border-amber-800",
  launch: "bg-violet-950/50 text-violet-300 border-violet-800",
  other: "bg-zinc-800/50 text-zinc-300 border-zinc-700",
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A"
  // Handle both date-only (YYYY-MM-DD) and datetime (YYYY-MM-DDTHH:MM:SS) strings
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00")
  if (isNaN(d.getTime())) return "N/A"
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// Columns that support the column-level filter popover
const FILTERABLE_COLUMNS = new Set(["firm", "category", "stage", "city", "country", "source_name"])

function getFilterableValue(fund: FundEntry, col: string): string {
  switch (col) {
    case "firm": return fund.firm
    case "category": return fund.category
    case "stage": return fund.stage
    case "city": return fund.city || "N/A"
    case "country": return fund.country || "\u2014"
    case "source_name": return fund.source_name || "\u2014"
    default: return ""
  }
}

// --- Column filter popover ---

function ColumnFilterPopover({
  column,
  values,
  selected,
  onChange,
}: {
  column: string
  values: string[]
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const [search, setSearch] = useState("")
  const showSearch = values.length > 8
  const filtered = search
    ? values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : values

  const isActive = selected.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center ml-0.5 relative"
          onClick={(e) => e.stopPropagation()}
          title={`Filter by ${column}`}
        >
          <ListFilter className={`h-3 w-3 ${isActive ? "text-blue-400" : "opacity-30 hover:opacity-70"} transition-opacity`} />
          {isActive && (
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
        {showSearch && (
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        )}
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {filtered.map((val) => (
            <div key={val} className="flex items-center gap-2">
              <Checkbox
                id={`cf-${column}-${val}`}
                checked={selected.includes(val)}
                onCheckedChange={(checked) => {
                  if (checked) onChange([...selected, val])
                  else onChange(selected.filter((s) => s !== val))
                }}
              />
              <Label
                htmlFor={`cf-${column}-${val}`}
                className="text-xs font-normal cursor-pointer truncate"
              >
                {val}
              </Label>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">No matches</p>
          )}
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs mt-2"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

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
        const v = getFilterableValue(f, col)
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
    const sf = COLUMN_SORT[colKey]

    if (colKey === "chevron") {
      return (
        <TableHead key={colKey} className="px-2" style={{ width: w, minWidth: 40, position: "relative" }}>
          <ResizeHandle onResize={makeResizeHandler("chevron")} />
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

    const labelMap: Record<string, string> = {
      fund: "Fund Name",
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
        <TableHead key={colKey} className={`${responsiveClass} ${extraClass}`} style={style}>
          <div className="inline-flex items-center gap-0.5">
            <button
              onClick={() => onSort(sf)}
              className="inline-flex items-center font-medium hover:text-foreground transition-colors"
              title={tooltip}
            >
              {labelMap[colKey] ?? colKey}
              <SortIcon field={sf} currentSort={sortField} currentDir={sortDir} />
            </button>
            {filterPopover}
          </div>
          <ResizeHandle onResize={makeResizeHandler(colKey)} />
        </TableHead>
      )
    }

    return (
      <TableHead key={colKey} className={`${responsiveClass} ${extraClass}`} style={style}>
        <div className="inline-flex items-center gap-0.5">
          <span title={tooltip}>{labelMap[colKey] ?? colKey}</span>
          {filterPopover}
        </div>
        <ResizeHandle onResize={makeResizeHandler(colKey)} />
      </TableHead>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table className="w-full" style={{ tableLayout: "fixed" }}>
        <TableHeader className="sticky z-30 bg-background shadow-[0_1px_0_0_hsl(var(--border))]" style={{ top: stickyHeaderTop }}>
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
        <TableCell className={`px-2 ${py}`}>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>

        {isVisible("fund") && (
          <TableCell className={`${py} whitespace-nowrap overflow-hidden`}>
            <span className="font-medium text-foreground truncate block">{fund.fund_name}</span>
            {/* Show firm inline on mobile where firm column is hidden */}
            <Link
              href={`/fund-watch/managers/${fund.firm_slug || slugify(fund.firm)}`}
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
                className={`text-[10px] px-1.5 py-0 ${STAGE_BADGE[fund.stage] ?? STAGE_BADGE.other}`}
              >
                {titleCase(fund.stage)}
              </Badge>
            </div>
          </TableCell>
        )}
        {isVisible("firm") && (
          <TableCell className={`hidden md:table-cell text-sm whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
            <Link
              href={`/fund-watch/managers/${fund.firm_slug || slugify(fund.firm)}`}
              className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {fund.firm}
            </Link>
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
              {titleCase(fund.stage)}
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
          <TableCell className={`hidden lg:table-cell text-sm whitespace-nowrap overflow-hidden text-ellipsis ${py}`}>
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
          </TableCell>
        )}
      </TableRow>

      {/* Expanded detail row */}
      {isExpanded && (
        <TableRow className={index % 2 === 1 ? "bg-muted/20" : ""}>
          <TableCell colSpan={visibleColCount} className="p-0 border-t-0">
            <div className="px-4 sm:px-10 py-5">
            <div className="max-w-3xl space-y-4">
              {/* Description */}
              {fund.description_notes && (
                <p className="text-sm text-foreground/90 leading-relaxed capitalize">
                  {fund.description_notes}
                </p>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Fund Manager</p>
                  <Link
                    href={`/fund-watch/managers/${fund.firm_slug || slugify(fund.firm)}`}
                    className="text-sm text-foreground hover:underline underline-offset-2 transition-colors truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {fund.firm}
                  </Link>
                </div>
                <DetailItem label="Fund Size" value={fund.amount === "Undisclosed" ? "Undisclosed" : fund.amount} muted={fund.amount === "Undisclosed"} />
                <DetailItem label="Stage" value={titleCase(fund.stage)} />
                <DetailItem label="Category" value={fund.category} />
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

              {/* Sources */}
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
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function DetailItem({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm truncate ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</p>
    </div>
  )
}
