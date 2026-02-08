"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, ChevronDown, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FundExpandedDetail } from "@/components/fund-watch/fund-expanded-detail"
import type { FundEntry } from "@/lib/content/fund-watch"
import {
  CATEGORY_BADGE_CLASSES,
  STAGE_BADGE_CLASSES,
  formatAum,
  formatDate,
  titleCase,
} from "@/lib/content/fund-watch"

interface ManagerProfileProps {
  firmName: string
  city: string
  country: string
  categories: string[]
  totalAumMillions: number
  funds: FundEntry[]
}

export function ManagerProfile({
  firmName,
  city,
  country,
  categories,
  totalAumMillions,
  funds,
}: ManagerProfileProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const location = [city, country].filter(Boolean).join(", ")

  // Sort funds by amount (largest first), undisclosed at bottom
  const sorted = [...funds].sort((a, b) => (b.amount_usd_millions ?? 0) - (a.amount_usd_millions ?? 0))

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/fund-watch"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to FundWatch Tracker
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{firmName}</h1>
          {location && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground shrink-0">
              <MapPin className="h-3 w-3" />
              {location}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {totalAumMillions > 0 ? (
            <>
              Total AUM: <span className="text-foreground font-medium">{formatAum(totalAumMillions)}</span> across{" "}
              <span className="text-foreground font-medium">{funds.length} fund{funds.length !== 1 ? "s" : ""}</span>
            </>
          ) : (
            <>{funds.length} fund{funds.length !== 1 ? "s" : ""} tracked</>
          )}
        </p>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className={CATEGORY_BADGE_CLASSES[cat] ?? ""}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Fund table */}
      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 px-2" />
              <TableHead>Fund Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Stage</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((fund, i) => {
              const isExpanded = expandedRows.has(i)
              const articles = fund.articles ?? []

              return (
                <ManagerFundRow
                  key={`${fund.fund_name}-${i}`}
                  fund={fund}
                  index={i}
                  isExpanded={isExpanded}
                  articles={articles}
                  onToggle={toggleRow}
                />
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ManagerFundRow({
  fund,
  index,
  isExpanded,
  articles,
  onToggle,
}: {
  fund: FundEntry
  index: number
  isExpanded: boolean
  articles: FundEntry["articles"]
  onToggle: (i: number) => void
}) {
  return (
    <>
      <TableRow
        className={`cursor-pointer ${index % 2 === 1 ? "bg-muted/20" : ""} ${isExpanded ? "border-b-0" : ""}`}
        onClick={() => onToggle(index)}
      >
        <TableCell className="px-2 py-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="py-2">
          <span className="font-medium text-foreground">{fund.fund_name}</span>
          <div className="flex items-center gap-1.5 mt-1 sm:hidden">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${STAGE_BADGE_CLASSES[fund.stage] ?? STAGE_BADGE_CLASSES.other}`}
            >
              {titleCase(fund.stage)}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-right font-mono text-sm whitespace-nowrap py-2">
          {fund.amount === "Undisclosed" ? (
            <span className="text-muted-foreground">Undisclosed</span>
          ) : (
            fund.amount
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell py-2">
          <Badge
            variant="outline"
            className={STAGE_BADGE_CLASSES[fund.stage] ?? STAGE_BADGE_CLASSES.other}
          >
            {titleCase(fund.stage)}
          </Badge>
        </TableCell>
        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap py-2">
          {formatDate(fund.announcement_date)}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className={index % 2 === 1 ? "bg-muted/20" : ""}>
          <TableCell colSpan={5} className="p-0 border-t-0">
            <FundExpandedDetail
              fund={fund}
              articles={articles}
              showFirmLink={false}
              gridCols="grid-cols-2 sm:grid-cols-3"
            />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
