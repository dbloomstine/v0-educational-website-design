"use client"

import { useMemo, useEffect, useCallback, useRef, useState } from "react"
import { useFundWatchFilters, applyFilters, applySorting } from "@/lib/hooks/use-fund-watch-filters"
import { FundFilterBar, ALL_COLUMNS } from "@/components/fund-watch/fund-filter-bar"
import { FundTable } from "@/components/fund-watch/fund-table"
import { downloadCSV, createTableSection } from "@/lib/exports/csv-export"
import type { FundEntry } from "@/lib/content/fund-watch"
import { formatAum } from "@/lib/content/fund-watch"

const COLUMNS_STORAGE_KEY = "fundwatch-columns"
const DENSITY_STORAGE_KEY = "fundwatch-density"
const COL_WIDTHS_STORAGE_KEY = "fundwatch-col-widths"

function getDefaultColumns(): Set<string> {
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
}

function loadColumns(): Set<string> {
  if (typeof window === "undefined") return getDefaultColumns()
  try {
    const stored = localStorage.getItem(COLUMNS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return new Set(parsed)
    }
  } catch { /* ignore */ }
  return getDefaultColumns()
}

function saveColumns(cols: Set<string>) {
  try { localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...cols])) } catch { /* ignore */ }
}

function loadDensity(): "comfortable" | "compact" {
  if (typeof window === "undefined") return "comfortable"
  try {
    const stored = localStorage.getItem(DENSITY_STORAGE_KEY)
    if (stored === "compact") return "compact"
  } catch { /* ignore */ }
  return "comfortable"
}

function saveDensity(d: "comfortable" | "compact") {
  try { localStorage.setItem(DENSITY_STORAGE_KEY, d) } catch { /* ignore */ }
}

export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  chevron: 40,
  fund: 280,
  firm: 180,
  amount: 110,
  category: 150,
  stage: 130,
  quarter: 90,
  date: 120,
  location: 120,
  source_name: 120,
  description: 300,
  source_link: 50,
}

function loadColumnWidths(): Record<string, number> {
  if (typeof window === "undefined") return { ...DEFAULT_COLUMN_WIDTHS }
  try {
    const stored = localStorage.getItem(COL_WIDTHS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === "object") return { ...DEFAULT_COLUMN_WIDTHS, ...parsed }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_COLUMN_WIDTHS }
}

function saveColumnWidths(widths: Record<string, number>) {
  try { localStorage.setItem(COL_WIDTHS_STORAGE_KEY, JSON.stringify(widths)) } catch { /* ignore */ }
}

interface FundWatchClientProps {
  funds: FundEntry[]
  categories: string[]
  stages: string[]
}

export function FundWatchClient({ funds, categories, stages }: FundWatchClientProps) {
  const filterHook = useFundWatchFilters()

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(getDefaultColumns)
  const [density, setDensityState] = useState<"comfortable" | "compact">("comfortable")
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => ({ ...DEFAULT_COLUMN_WIDTHS }))
  const searchRef = useRef<HTMLInputElement>(null)

  // Load persisted settings on mount
  useEffect(() => {
    setVisibleColumns(loadColumns())
    setDensityState(loadDensity())
    setColumnWidths(loadColumnWidths())
  }, [])

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveColumns(next)
      return next
    })
  }, [])

  const setDensity = useCallback((d: "comfortable" | "compact") => {
    setDensityState(d)
    saveDensity(d)
  }, [])

  const handleColumnResize = useCallback((key: string, width: number) => {
    setColumnWidths((prev) => {
      const next = { ...prev, [key]: width }
      saveColumnWidths(next)
      return next
    })
  }, [])

  const resetColumnWidths = useCallback(() => {
    setColumnWidths({ ...DEFAULT_COLUMN_WIDTHS })
    try { localStorage.removeItem(COL_WIDTHS_STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  // Apply filters + sorting
  const filtered = useMemo(() => applyFilters(funds, filterHook.state), [funds, filterHook.state])
  const sorted = useMemo(() => applySorting(filtered, filterHook.state.sort, filterHook.state.dir), [filtered, filterHook.state.sort, filterHook.state.dir])

  // CSV export
  const handleExportCSV = useCallback(() => {
    const totalAum = sorted.reduce((sum, f) => sum + (f.amount_usd_millions ?? 0), 0)
    downloadCSV({
      filename: `fundwatch-tracker-${new Date().toISOString().slice(0, 10)}`,
      toolName: "FundWatch Tracker",
      sections: [
        createTableSection(
          `${sorted.length} funds | ${formatAum(totalAum)} total AUM`,
          ["Fund Name", "Fund Manager", "Amount", "Category", "Stage", "Date", "Location", "Source"],
          sorted.map((f) => [
            f.fund_name,
            f.firm,
            f.amount,
            f.category,
            f.stage,
            f.announcement_date ?? "",
            f.location,
            f.source_url,
          ])
        ),
      ],
      includeDisclaimer: false,
    })
  }, [sorted])

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // "/" focuses search (unless already in an input)
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      // Escape clears search if focused in search
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        filterHook.setSearch("")
        searchRef.current?.blur()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [filterHook])

  return (
    <div className="space-y-4">
      <FundFilterBar
        state={filterHook.state}
        categories={categories}
        stages={stages}
        allFunds={funds}
        filteredCount={sorted.length}
        visibleColumns={visibleColumns}
        density={density}
        onSetSearch={filterHook.setSearch}
        onSetCategories={filterHook.setCategories}
        onSetStages={filterHook.setStages}
        onSetSize={filterHook.setSize}
        onSetDateRange={filterHook.setDateRange}
        onSetStatus={filterHook.setStatus}
        onClearAll={filterHook.clearAll}
        onToggleColumn={toggleColumn}
        onSetDensity={setDensity}
        onExportCSV={handleExportCSV}
        onResetColumnWidths={resetColumnWidths}
        searchRef={searchRef}
      />
      <FundTable
        funds={sorted}
        visibleColumns={visibleColumns}
        density={density}
        sortField={filterHook.state.sort}
        sortDir={filterHook.state.dir}
        onSort={filterHook.setSort}
        columnWidths={columnWidths}
        onColumnResize={handleColumnResize}
      />
    </div>
  )
}
