"use client"

import { useState, useMemo } from "react"
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

type SortField = "amount" | "date" | "name"
type SortDir = "asc" | "desc"

const STAGE_BADGE: Record<string, string> = {
  "final close": "bg-emerald-950/50 text-emerald-300 border-emerald-800",
  "first close": "bg-sky-950/50 text-sky-300 border-sky-800",
  "interim close": "bg-amber-950/50 text-amber-300 border-amber-800",
  launch: "bg-violet-950/50 text-violet-300 border-violet-800",
  other: "bg-zinc-800/50 text-zinc-300 border-zinc-700",
}

export function FundTable({ funds, categories, stages }: FundTableProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [coveredFilter, setCoveredFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

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

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

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
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {funds.length} funds
      </p>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => toggleSort("name")}
                  className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                >
                  Fund <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => toggleSort("amount")}
                  className="inline-flex items-center font-medium hover:text-foreground transition-colors ml-auto"
                >
                  Amount <SortIcon field="amount" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">Stage</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("date")}
                  className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                >
                  Date <SortIcon field="date" />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Source</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No funds match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((fund, i) => (
                <TableRow key={`${fund.fund_name}-${fund.firm}-${i}`}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground">{fund.fund_name}</span>
                      <span className="block text-xs text-muted-foreground">{fund.firm}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                    {fund.amount === "Undisclosed" ? (
                      <span className="text-muted-foreground">Undisclosed</span>
                    ) : (
                      fund.amount
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={CATEGORY_BADGE_CLASSES[fund.category] ?? ""}
                    >
                      {fund.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {fund.location}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={STAGE_BADGE[fund.stage] ?? STAGE_BADGE.other}
                    >
                      {fund.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {fund.announcement_date ?? "N/A"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        fund.is_covered ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                      title={fund.is_covered ? "Covered" : "Uncovered"}
                    />
                  </TableCell>
                  <TableCell>
                    {fund.source_url && (
                      <a
                        href={fund.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={fund.source_name || "Source"}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
