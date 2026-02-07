"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { FundEntry, AmountBucketKey } from "@/lib/content/fund-watch"
import { getAmountBucket } from "@/lib/content/fund-watch"

export type SortField =
  | "name"
  | "firm"
  | "amount"
  | "category"
  | "stage"
  | "quarter"
  | "date"
  | "location"
export type SortDir = "asc" | "desc"

export interface FundWatchFilterState {
  q: string
  cat: string[]
  stage: string[]
  size: AmountBucketKey
  from: string
  to: string
  sort: SortField
  dir: SortDir
}

const DEFAULT_STATE: FundWatchFilterState = {
  q: "",
  cat: [],
  stage: [],
  size: "all",
  from: "",
  to: "",
  sort: "date",
  dir: "desc",
}

// --- URL param serialization ---

function stateToParams(state: FundWatchFilterState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.q) params.set("q", state.q)
  if (state.cat.length > 0) params.set("cat", state.cat.join(","))
  if (state.stage.length > 0) params.set("stage", state.stage.join(","))
  if (state.size !== "all") params.set("size", state.size)
  if (state.from) params.set("from", state.from)
  if (state.to) params.set("to", state.to)
  if (state.sort !== "date") params.set("sort", state.sort)
  if (state.dir !== "desc") params.set("dir", state.dir)
  return params
}

function paramsToState(params: URLSearchParams): Partial<FundWatchFilterState> {
  const partial: Partial<FundWatchFilterState> = {}
  const q = params.get("q")
  if (q) partial.q = q
  const cat = params.get("cat")
  if (cat) partial.cat = cat.split(",")
  const stage = params.get("stage")
  if (stage) partial.stage = stage.split(",")
  const size = params.get("size")
  if (size) partial.size = size as AmountBucketKey
  const from = params.get("from")
  if (from) partial.from = from
  const to = params.get("to")
  if (to) partial.to = to
  const sort = params.get("sort")
  if (sort) partial.sort = sort as SortField
  const dir = params.get("dir")
  if (dir) partial.dir = dir as SortDir
  return partial
}

// --- Pure filter/sort functions ---

export function applyFilters(funds: FundEntry[], state: FundWatchFilterState): FundEntry[] {
  let result = funds

  if (state.q) {
    const q = state.q.toLowerCase()
    result = result.filter(
      (f) =>
        f.fund_name.toLowerCase().includes(q) ||
        f.firm.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q)
    )
  }

  if (state.cat.length > 0) {
    result = result.filter((f) => state.cat.includes(f.category))
  }

  if (state.stage.length > 0) {
    result = result.filter((f) => state.stage.includes(f.stage))
  }

  if (state.size !== "all") {
    result = result.filter((f) => getAmountBucket(f.amount_usd_millions) === state.size)
  }

  if (state.from) {
    result = result.filter((f) => f.announcement_date && f.announcement_date >= state.from)
  }

  if (state.to) {
    result = result.filter((f) => f.announcement_date && f.announcement_date <= state.to)
  }

  return result
}

export function applySorting(funds: FundEntry[], sortField: SortField, sortDir: SortDir): FundEntry[] {
  const dir = sortDir === "asc" ? 1 : -1
  return [...funds].sort((a, b) => {
    switch (sortField) {
      case "name":
        return a.fund_name.localeCompare(b.fund_name) * dir
      case "firm":
        return a.firm.localeCompare(b.firm) * dir
      case "amount":
        return ((a.amount_usd_millions ?? 0) - (b.amount_usd_millions ?? 0)) * dir
      case "category":
        return a.category.localeCompare(b.category) * dir
      case "stage":
        return a.stage.localeCompare(b.stage) * dir
      case "quarter":
      case "date": {
        const da = a.announcement_date ?? ""
        const db = b.announcement_date ?? ""
        return da.localeCompare(db) * dir
      }
      case "location":
        return a.location.localeCompare(b.location) * dir
      default:
        return 0
    }
  })
}

// --- Hook ---

export function useFundWatchFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isInitialized = useRef(false)

  const [state, setStateRaw] = useState<FundWatchFilterState>(DEFAULT_STATE)

  // Parse URL on mount
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    const parsed = paramsToState(searchParams)
    if (Object.keys(parsed).length > 0) {
      setStateRaw((prev) => ({ ...prev, ...parsed }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced URL sync
  const syncUrl = useCallback(
    (newState: FundWatchFilterState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const params = stateToParams(newState)
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
        router.replace(newUrl, { scroll: false })
      }, 300)
    },
    [pathname, router]
  )

  const setState = useCallback(
    (updater: FundWatchFilterState | ((prev: FundWatchFilterState) => FundWatchFilterState)) => {
      setStateRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        syncUrl(next)
        return next
      })
    },
    [syncUrl]
  )

  // Convenience setters
  const setSearch = useCallback((q: string) => setState((s) => ({ ...s, q })), [setState])
  const setCategories = useCallback((cat: string[]) => setState((s) => ({ ...s, cat })), [setState])
  const setStages = useCallback((stage: string[]) => setState((s) => ({ ...s, stage })), [setState])
  const setSize = useCallback((size: AmountBucketKey) => setState((s) => ({ ...s, size })), [setState])
  const setDateRange = useCallback((from: string, to: string) => setState((s) => ({ ...s, from, to })), [setState])
  const setStatus = useCallback((_status: string) => { /* no-op: status hidden from public UI */ }, [])

  const setSort = useCallback(
    (field: SortField) => {
      setState((s) => {
        if (s.sort === field) {
          return { ...s, dir: s.dir === "asc" ? "desc" : "asc" }
        }
        return { ...s, sort: field, dir: field === "name" || field === "firm" ? "asc" : "desc" }
      })
    },
    [setState]
  )

  const clearAll = useCallback(() => setState(DEFAULT_STATE), [setState])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (state.q) count++
    if (state.cat.length > 0) count++
    if (state.stage.length > 0) count++
    if (state.size !== "all") count++
    if (state.from || state.to) count++
    return count
  }, [state])

  return {
    state,
    setSearch,
    setCategories,
    setStages,
    setSize,
    setDateRange,
    setStatus,
    setSort,
    clearAll,
    activeFilterCount,
  }
}
