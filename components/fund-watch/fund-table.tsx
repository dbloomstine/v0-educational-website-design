"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import {
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Newspaper,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { FundEntry } from "@/lib/content/fund-watch"
import { CATEGORY_BADGE_CLASSES } from "@/lib/content/fund-watch"

interface FundTableProps {
  funds: FundEntry[]
  categories: string[]
  stages: string[]
}

type SortField = "amount" | "date" | "name" | "covered_date"
type SortDir = "asc" | "desc"

// Column definitions
interface ColumnDef {
  key: string
  label: string
  defaultVisible: boolean
  sortable: boolean
  sortField?: SortField
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: "fund", label: "Fund", defaultVisible: true, sortable: true, sortField: "name" },
  { key: "amount", label: "Amount", defaultVisible: true, sortable: true, sortField: "amount" },
  { key: "category", label: "Category", defaultVisible: true, sortable: false },
  { key: "stage", label: "Stage", defaultVisible: true, sortable: false },
  { key: "date", label: "Date", defaultVisible: true, sortable: true, sortField: "date" },
  { key: "status", label: "Status", defaultVisible: true, sortable: false },
  { key: "location", label: "Location", defaultVisible: false, sortable: false },
  { key: "source_name", label: "Source", defaultVisible: false, sortable: false },
  { key: "description", label: "Description", defaultVisible: false, sortable: false },
  { key: "covered_date", label: "Covered Date", defaultVisible: false, sortable: true, sortField: "covered_date" },
  { key: "source_link", label: "Source Link", defaultVisible: true, sortable: false },
]

const STORAGE_KEY = "fundwatch-columns"

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

function getDefaultColumns(): Set<string> {
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
}

function loadColumns(): Set<string> {
  if (typeof window === "undefined") return getDefaultColumns()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return new Set(parsed)
      }
    }
  } catch {
    // fall through
  }
  return getDefaultColumns()
}

function saveColumns(cols: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cols]))
  } catch {
    // ignore
  }
}

export function FundTable({ funds, categories, stages }: FundTableProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [coveredFilter, setCoveredFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(getDefaultColumns)

  // Load column prefs from localStorage on mount
  useEffect(() => {
    setVisibleColumns(loadColumns())
  }, [])

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      saveColumns(next)
      return next
    })
  }, [])

  const isVisible = useCallback(
    (key: string) => visibleColumns.has(key),
    [visibleColumns]
  )

  const filtered = useMemo(() => {
    let result = funds

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.fund_name.toLowerCase().includes(q) ||
          f.firm.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== "all") {
      result = result.filter((f) => f.category === categoryFilter)
    }

    if (stageFilter !== "all") {
      result = result.filter((f) => f.stage === stageFilter)
    }

    if (coveredFilter !== "all") {
      const wantCovered = coveredFilter === "covered"
      result = result.filter((f) => f.is_covered === wantCovered)
    }

    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      switch (sortField) {
        case "amount":
          return ((a.amount_usd_millions ?? 0) - (b.amount_usd_millions ?? 0)) * dir
        case "date": {
          const da = a.announcement_date ?? ""
          const db = b.announcement_date ?? ""
          return da.localeCompare(db) * dir
        }
        case "name":
          return a.fund_name.localeCompare(b.fund_name) * dir
        case "covered_date": {
          const ca = a.covered_date ?? ""
          const cb = b.covered_date ?? ""
          return ca.localeCompare(cb) * dir
        }
      }
    })

    return result
  }, [funds, search, categoryFilter, stageFilter, coveredFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir(field === "name" ? "asc" : "desc")
    }
  }

  function toggleRow(key: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  // Count visible data columns (excluding expand chevron)
  const visibleColCount = ALL_COLUMNS.filter((c) => isVisible(c.key)).length + 1 // +1 for expand chevron

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search funds, firms, or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={coveredFilter} onValueChange={setCoveredFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="covered">Covered</SelectItem>
            <SelectItem value="uncovered">Uncovered</SelectItem>
          </SelectContent>
        </Select>

        {/* Column visibility toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 h-10 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Toggle columns"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Columns</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56">
            <p className="text-sm font-medium mb-3">Visible columns</p>
            <div className="space-y-2">
              {ALL_COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`col-${col.key}`}
                    checked={isVisible(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  <Label
                    htmlFor={`col-${col.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {col.label}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {funds.length} funds
      </p>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="hover:bg-transparent">
                {/* Expand chevron column */}
                <TableHead className="w-8 px-2" />

                {isVisible("fund") && (
                  <TableHead>
                    <button
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                    >
                      Fund <SortIcon field="name" />
                    </button>
                  </TableHead>
                )}
                {isVisible("amount") && (
                  <TableHead className="text-right">
                    <button
                      onClick={() => toggleSort("amount")}
                      className="inline-flex items-center font-medium hover:text-foreground transition-colors ml-auto"
                    >
                      Amount <SortIcon field="amount" />
                    </button>
                  </TableHead>
                )}
                {isVisible("category") && (
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                )}
                {isVisible("stage") && (
                  <TableHead className="hidden md:table-cell">Stage</TableHead>
                )}
                {isVisible("date") && (
                  <TableHead className="hidden sm:table-cell">
                    <button
                      onClick={() => toggleSort("date")}
                      className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                    >
                      Date <SortIcon field="date" />
                    </button>
                  </TableHead>
                )}
                {isVisible("status") && (
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                )}
                {isVisible("location") && (
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                )}
                {isVisible("source_name") && (
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                )}
                {isVisible("description") && (
                  <TableHead className="hidden xl:table-cell max-w-[200px]">Description</TableHead>
                )}
                {isVisible("covered_date") && (
                  <TableHead className="hidden lg:table-cell">
                    <button
                      onClick={() => toggleSort("covered_date")}
                      className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                    >
                      Covered <SortIcon field="covered_date" />
                    </button>
                  </TableHead>
                )}
                {isVisible("source_link") && (
                  <TableHead className="w-10">
                    <span className="sr-only">Source</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColCount} className="text-center py-8 text-muted-foreground">
                    No funds match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((fund, i) => {
                  const rowKey = `${fund.fund_name}-${fund.firm}-${i}`
                  const isExpanded = expandedRows.has(rowKey)
                  const articles = fund.articles ?? []

                  return (
                    <>
                      <TableRow
                        key={rowKey}
                        className={`cursor-pointer ${i % 2 === 1 ? "bg-muted/20" : ""} ${isExpanded ? "border-b-0" : ""}`}
                        onClick={() => toggleRow(rowKey)}
                      >
                        {/* Expand chevron */}
                        <TableCell className="w-8 px-2 py-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>

                        {isVisible("fund") && (
                          <TableCell className="py-2 max-w-[200px] sm:max-w-none">
                            <div>
                              <span className="font-medium text-foreground line-clamp-1">{fund.fund_name}</span>
                              <span className="block text-xs text-muted-foreground">{fund.firm}</span>
                              {/* Show category & stage inline on mobile where those columns are hidden */}
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
                            </div>
                          </TableCell>
                        )}
                        {isVisible("amount") && (
                          <TableCell className="text-right font-mono text-sm whitespace-nowrap py-2">
                            {fund.amount === "Undisclosed" ? (
                              <span className="text-muted-foreground">Undisclosed</span>
                            ) : (
                              fund.amount
                            )}
                          </TableCell>
                        )}
                        {isVisible("category") && (
                          <TableCell className="hidden md:table-cell py-2">
                            <Badge
                              variant="outline"
                              className={CATEGORY_BADGE_CLASSES[fund.category] ?? ""}
                            >
                              {fund.category}
                            </Badge>
                          </TableCell>
                        )}
                        {isVisible("stage") && (
                          <TableCell className="hidden md:table-cell py-2">
                            <Badge
                              variant="outline"
                              className={STAGE_BADGE[fund.stage] ?? STAGE_BADGE.other}
                            >
                              {fund.stage}
                            </Badge>
                          </TableCell>
                        )}
                        {isVisible("date") && (
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap py-2">
                            {formatDate(fund.announcement_date)}
                          </TableCell>
                        )}
                        {isVisible("status") && (
                          <TableCell className="hidden sm:table-cell py-2">
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
                        {isVisible("location") && (
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground py-2">
                            {fund.location}
                          </TableCell>
                        )}
                        {isVisible("source_name") && (
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground py-2">
                            {fund.source_name}
                          </TableCell>
                        )}
                        {isVisible("description") && (
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground max-w-[200px] truncate py-2">
                            {fund.description_notes || "—"}
                          </TableCell>
                        )}
                        {isVisible("covered_date") && (
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap py-2">
                            {formatDate(fund.covered_date)}
                          </TableCell>
                        )}
                        {isVisible("source_link") && (
                          <TableCell className="py-2">
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
                        <TableRow key={`${rowKey}-detail`} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                          <TableCell colSpan={visibleColCount} className="px-4 sm:px-10 py-4 border-t-0">
                            <div className="space-y-3">
                              {/* Date on mobile (hidden in table column) */}
                              <p className="text-xs text-muted-foreground sm:hidden">
                                {formatDate(fund.announcement_date)}
                              </p>

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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
