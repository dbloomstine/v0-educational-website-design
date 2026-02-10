"use client"

import { useMemo, useEffect, useCallback, useRef, useState } from "react"
import { useFundWatchFilters, applyFilters, applySorting } from "@/lib/hooks/use-fund-watch-filters"
import { FundFilterBar } from "@/components/fund-watch/fund-filter-bar"
import { getDefaultColumnWidths, getDefaultVisibleColumns } from "@/lib/content/fund-watch-columns"
import { FundTable } from "@/components/fund-watch/fund-table"
import { downloadCSV, createTableSection } from "@/lib/exports/csv-export"
import type { FundEntry } from "@/lib/content/fund-watch"
import { formatAum } from "@/lib/content/fund-watch"

// --- Generic localStorage hook ---

function useLocalSetting<T>(
  key: string,
  defaultValue: () => T,
  serialize: (v: T) => string = (v) => JSON.stringify(v),
  deserialize: (raw: string, defaults: T) => T | null = (raw) => {
    try { return JSON.parse(raw) as T } catch { return null }
  },
): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValueRaw] = useState<T>(defaultValue)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = deserialize(stored, defaultValue())
        if (parsed !== null) setValueRaw(parsed)
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setValue = useCallback((v: T | ((prev: T) => T)) => {
    setValueRaw((prev) => {
      const next = typeof v === "function" ? (v as (prev: T) => T)(prev) : v
      try { localStorage.setItem(key, serialize(next)) } catch { /* ignore */ }
      return next
    })
  }, [key, serialize])

  const reset = useCallback(() => {
    setValueRaw(defaultValue())
    try { localStorage.removeItem(key) } catch { /* ignore */ }
  }, [key, defaultValue])

  return [value, setValue, reset]
}

// Serializers for Set<string>
const serializeSet = (s: Set<string>) => JSON.stringify([...s])
const deserializeSet = (raw: string): Set<string> | null => {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return new Set(parsed)
  } catch { /* ignore */ }
  return null
}

// Serializers for column widths (merge with defaults)
const deserializeWidths = (raw: string, defaults: Record<string, number>): Record<string, number> | null => {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") return { ...defaults, ...parsed }
  } catch { /* ignore */ }
  return null
}

interface FundWatchClientProps {
  funds: FundEntry[]
  categories: string[]
  stages: string[]
  strategies?: string[]
  geographies?: string[]
}

export function FundWatchClient({ funds, categories, stages, strategies: propStrategies, geographies: propGeographies }: FundWatchClientProps) {
  // Derive strategies and geographies from fund data if not provided
  const strategies = useMemo(() => {
    if (propStrategies && propStrategies.length > 0) return propStrategies
    const unique = new Set<string>()
    for (const f of funds) {
      if (f.strategy) unique.add(f.strategy)
    }
    return [...unique].sort()
  }, [funds, propStrategies])

  const geographies = useMemo(() => {
    if (propGeographies && propGeographies.length > 0) return propGeographies
    const unique = new Set<string>()
    for (const f of funds) {
      if (f.target_geography) unique.add(f.target_geography)
    }
    return [...unique].sort()
  }, [funds, propGeographies])
  const filterHook = useFundWatchFilters()

  const [visibleColumns, setVisibleColumns] = useLocalSetting(
    "fundwatch-columns", getDefaultVisibleColumns, serializeSet, deserializeSet,
  )
  const [density, setDensity] = useLocalSetting(
    "fundwatch-density", () => "comfortable" as "comfortable" | "compact",
  )
  const [columnWidths, setColumnWidths, resetColumnWidths] = useLocalSetting(
    "fundwatch-col-widths", getDefaultColumnWidths, undefined, deserializeWidths,
  )
  const searchRef = useRef<HTMLInputElement>(null)

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [setVisibleColumns])

  const handleColumnResize = useCallback((key: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [key]: width }))
  }, [setColumnWidths])

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
          ["Fund Name", "Fund Manager", "Amount", "Category", "Stage", "Date", "City", "State", "Country", "Source"],
          sorted.map((f) => [
            f.fund_name,
            f.firm,
            f.amount,
            f.category,
            f.stage,
            f.announcement_date ?? "",
            f.city ?? "",
            f.state ?? "",
            f.country ?? "",
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

  const filterBarRef = useRef<HTMLDivElement>(null)
  const [filterBarH, setFilterBarH] = useState(0)

  useEffect(() => {
    if (!filterBarRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setFilterBarH(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
    })
    ro.observe(filterBarRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="space-y-3">
      <div ref={filterBarRef} className="sticky z-30 bg-background pb-2" style={{ top: 64 }}>
        <FundFilterBar
          state={filterHook.state}
          categories={categories}
          stages={stages}
          strategies={strategies}
          geographies={geographies}
          allFunds={funds}
          filteredCount={sorted.length}
          visibleColumns={visibleColumns}
          density={density}
          onSetSearch={filterHook.setSearch}
          onSetCategories={filterHook.setCategories}
          onSetStages={filterHook.setStages}
          onSetStrategies={filterHook.setStrategies}
          onSetGeographies={filterHook.setGeographies}
          onSetSize={filterHook.setSize}
          onSetDateRange={filterHook.setDateRange}
          onSetStatus={filterHook.setStatus}
          onClearAll={filterHook.clearAll}
          onToggleColumn={toggleColumn}
          onSetDensity={setDensity}
          onExportCSV={handleExportCSV}
          onResetColumnWidths={resetColumnWidths}
          onColumnFilter={filterHook.setColumnFilter}
          searchRef={searchRef}
        />
      </div>
      <FundTable
        funds={sorted}
        allFunds={funds}
        visibleColumns={visibleColumns}
        density={density}
        sortField={filterHook.state.sort}
        sortDir={filterHook.state.dir}
        onSort={filterHook.setSort}
        columnWidths={columnWidths}
        onColumnResize={handleColumnResize}
        columnFilters={filterHook.state.cf}
        onColumnFilter={filterHook.setColumnFilter}
        stickyHeaderTop={filterBarH + 64}
      />
    </div>
  )
}
