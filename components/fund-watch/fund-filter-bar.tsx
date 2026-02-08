"use client"

import { useState, useMemo } from "react"
import {
  Search,
  X,
  Download,
  SlidersHorizontal,
  Filter,
  CalendarDays,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import type { FundEntry, AmountBucketKey } from "@/lib/content/fund-watch"
import { AMOUNT_BUCKETS } from "@/lib/content/fund-watch"
import type { FundWatchFilterState } from "@/lib/hooks/use-fund-watch-filters"
import { COLUMNS } from "@/lib/content/fund-watch-columns"

// --- Quarter helpers ---

function deriveQuarters(funds: FundEntry[]): { label: string; from: string; to: string }[] {
  const seen = new Set<string>()
  const quarters: { label: string; from: string; to: string }[] = []

  for (const f of funds) {
    if (!f.announcement_date) continue
    const d = new Date(f.announcement_date + "T00:00:00")
    if (isNaN(d.getTime())) continue
    const q = Math.ceil((d.getMonth() + 1) / 3)
    const year = d.getFullYear()
    const key = `Q${q} ${year}`
    if (seen.has(key)) continue
    seen.add(key)
    const startMonth = (q - 1) * 3
    const from = `${year}-${String(startMonth + 1).padStart(2, "0")}-01`
    const endMonth = startMonth + 2
    const lastDay = new Date(year, endMonth + 1, 0).getDate()
    const to = `${year}-${String(endMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    quarters.push({ label: key, from, to })
  }

  quarters.sort((a, b) => b.from.localeCompare(a.from))
  return quarters
}

// --- Props ---

// Column display names for filter chips
const COLUMN_LABEL_MAP: Record<string, string> = {
  firm: "Firm",
  category: "Category",
  stage: "Stage",
  city: "City",
  country: "Country",
  source_name: "Source",
}

interface FundFilterBarProps {
  state: FundWatchFilterState
  categories: string[]
  stages: string[]
  allFunds: FundEntry[]
  filteredCount: number
  visibleColumns: Set<string>
  density: "comfortable" | "compact"
  onSetSearch: (q: string) => void
  onSetCategories: (cat: string[]) => void
  onSetStages: (stage: string[]) => void
  onSetSize: (size: AmountBucketKey) => void
  onSetDateRange: (from: string, to: string) => void
  onSetStatus: (status: string) => void
  onClearAll: () => void
  onToggleColumn: (key: string) => void
  onSetDensity: (d: "comfortable" | "compact") => void
  onExportCSV: () => void
  onResetColumnWidths: () => void
  onColumnFilter: (col: string, vals: string[]) => void
  searchRef: React.RefObject<HTMLInputElement | null>
}

// --- Multi-select popover ---

function MultiSelectFilter({
  label,
  options,
  selected,
  onSelectionChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onSelectionChange: (v: string[]) => void
}) {
  const count = selected.length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 font-normal">
          {label}
          {count > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-semibold">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-3">
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox
                id={`ms-${label}-${opt}`}
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectionChange([...selected, opt])
                  } else {
                    onSelectionChange(selected.filter((s) => s !== opt))
                  }
                }}
              />
              <Label
                htmlFor={`ms-${label}-${opt}`}
                className="text-sm font-normal cursor-pointer"
              >
                {opt}
              </Label>
            </div>
          ))}
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs mt-1"
              onClick={() => onSelectionChange([])}
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// --- Date range popover ---

function DateRangeFilter({
  from,
  to,
  quarters,
  onSetDateRange,
}: {
  from: string
  to: string
  quarters: { label: string; from: string; to: string }[]
  onSetDateRange: (from: string, to: string) => void
}) {
  const active = from || to
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 font-normal">
          <CalendarDays className="h-3.5 w-3.5" />
          Date
          {active && (
            <Badge variant="secondary" className="ml-0.5 h-5 rounded-full px-1.5 text-[10px] font-semibold">
              1
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => onSetDateRange(e.target.value, to)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => onSetDateRange(from, e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>
          {quarters.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Quick select</Label>
              <div className="flex flex-wrap gap-1.5">
                {quarters.slice(0, 6).map((q) => (
                  <button
                    key={q.label}
                    onClick={() => onSetDateRange(q.from, q.to)}
                    className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                      from === q.from && to === q.to
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent border-border"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {active && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={() => onSetDateRange("", "")}
            >
              Clear dates
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// --- Main component ---

export function FundFilterBar({
  state,
  categories,
  stages,
  allFunds,
  filteredCount,
  visibleColumns,
  density,
  onSetSearch,
  onSetCategories,
  onSetStages,
  onSetSize,
  onSetDateRange,
  onSetStatus,
  onClearAll,
  onToggleColumn,
  onSetDensity,
  onExportCSV,
  onResetColumnWidths,
  onColumnFilter,
  searchRef,
}: FundFilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const quarters = useMemo(() => deriveQuarters(allFunds), [allFunds])

  const cfActive = Object.values(state.cf).some((v) => v.length > 0)
  const hasActiveFilters =
    state.q ||
    state.cat.length > 0 ||
    state.stage.length > 0 ||
    state.size !== "all" ||
    state.from ||
    state.to ||
    cfActive

  // Active filter chips
  const chips: { label: string; onRemove: () => void }[] = []
  if (state.q) {
    chips.push({ label: `Search: "${state.q}"`, onRemove: () => onSetSearch("") })
  }
  for (const c of state.cat) {
    chips.push({ label: c, onRemove: () => onSetCategories(state.cat.filter((x) => x !== c)) })
  }
  for (const s of state.stage) {
    chips.push({ label: s, onRemove: () => onSetStages(state.stage.filter((x) => x !== s)) })
  }
  if (state.size !== "all") {
    const bucket = AMOUNT_BUCKETS.find((b) => b.key === state.size)
    chips.push({ label: bucket?.label ?? state.size, onRemove: () => onSetSize("all") })
  }
  if (state.from || state.to) {
    const label = state.from && state.to ? `${state.from} \u2013 ${state.to}` : state.from || state.to
    chips.push({ label: `Date: ${label}`, onRemove: () => onSetDateRange("", "") })
  }
  // Column filter chips
  for (const [col, vals] of Object.entries(state.cf)) {
    for (const v of vals) {
      const colLabel = COLUMN_LABEL_MAP[col] ?? col
      chips.push({
        label: `${colLabel}: ${v}`,
        onRemove: () => onColumnFilter(col, vals.filter((x) => x !== v)),
      })
    }
  }
  // Shared filter controls (used in both desktop and mobile)
  const filterControls = (
    <>
      <MultiSelectFilter
        label="Category"
        options={categories}
        selected={state.cat}
        onSelectionChange={onSetCategories}
      />
      <MultiSelectFilter
        label="Stage"
        options={stages}
        selected={state.stage}
        onSelectionChange={onSetStages}
      />
      <Select value={state.size} onValueChange={(v) => onSetSize(v as AmountBucketKey)}>
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AMOUNT_BUCKETS.map((b) => (
            <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DateRangeFilter
        from={state.from}
        to={state.to}
        quarters={quarters}
        onSetDateRange={onSetDateRange}
      />
    </>
  )

  return (
    <div className="space-y-3">
      {/* Row 1: Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search — always visible */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search funds, firms, or locations..."
            value={state.q}
            onChange={(e) => onSetSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Desktop filters */}
        <div className="hidden md:flex items-center gap-2">
          {filterControls}
        </div>

        {/* Mobile filter button */}
        <div className="flex md:hidden items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filters
                {chips.length > 0 && (
                  <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-semibold">
                    {chips.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Filter the fund list</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* Category */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Category</Label>
                  <div className="space-y-2">
                    {categories.map((c) => (
                      <div key={c} className="flex items-center gap-2">
                        <Checkbox
                          id={`mob-cat-${c}`}
                          checked={state.cat.includes(c)}
                          onCheckedChange={(checked) => {
                            if (checked) onSetCategories([...state.cat, c])
                            else onSetCategories(state.cat.filter((x) => x !== c))
                          }}
                        />
                        <Label htmlFor={`mob-cat-${c}`} className="text-sm font-normal cursor-pointer">{c}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Stage */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Stage</Label>
                  <div className="space-y-2">
                    {stages.map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <Checkbox
                          id={`mob-stage-${s}`}
                          checked={state.stage.includes(s)}
                          onCheckedChange={(checked) => {
                            if (checked) onSetStages([...state.stage, s])
                            else onSetStages(state.stage.filter((x) => x !== s))
                          }}
                        />
                        <Label htmlFor={`mob-stage-${s}`} className="text-sm font-normal cursor-pointer">{s}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Amount */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Amount</Label>
                  <Select value={state.size} onValueChange={(v) => onSetSize(v as AmountBucketKey)}>
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AMOUNT_BUCKETS.map((b) => (
                        <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Date range */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={state.from}
                      onChange={(e) => onSetDateRange(e.target.value, state.to)}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="date"
                      value={state.to}
                      onChange={(e) => onSetDateRange(state.from, e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  {quarters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {quarters.slice(0, 4).map((q) => (
                        <button
                          key={q.label}
                          onClick={() => onSetDateRange(q.from, q.to)}
                          className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                            state.from === q.from && state.to === q.to
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-accent border-border"
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={onClearAll} className="mt-2">
                    Clear all filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Export + Columns — always visible */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onExportCSV}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <p className="text-sm font-medium mb-3">Visible columns</p>
              <div className="space-y-2">
                {COLUMNS.map((col) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`col-${col.key}`}
                      checked={visibleColumns.has(col.key)}
                      onCheckedChange={() => onToggleColumn(col.key)}
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
              <div className="border-t mt-3 pt-3">
                <p className="text-sm font-medium mb-2">Row density</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSetDensity("comfortable")}
                    className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                      density === "comfortable"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent border-border"
                    }`}
                  >
                    Comfortable
                  </button>
                  <button
                    onClick={() => onSetDensity("compact")}
                    className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                      density === "compact"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent border-border"
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>
              <div className="border-t mt-3 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={onResetColumnWidths}
                >
                  Reset column widths
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 2: Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal cursor-default"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
          <span className="ml-auto text-sm text-muted-foreground">
            Showing {filteredCount} of {allFunds.length} funds
          </span>
        </div>
      )}

      {/* Show count even without chips */}
      {chips.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {allFunds.length} funds
        </p>
      )}
    </div>
  )
}
