"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BarChart3, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'

// Industry benchmarks by fund size tier
const BENCHMARKS = {
  // Fund size ranges in millions
  tiers: [
    { min: 0, max: 50, label: '$0-50M' },
    { min: 50, max: 100, label: '$50-100M' },
    { min: 100, max: 200, label: '$100-200M' },
    { min: 200, max: 500, label: '$200-500M' },
    { min: 500, max: Infinity, label: '$500M+' },
  ],

  // Expense allocation benchmarks (% of total budget)
  expenseAllocation: {
    team: { min: 55, max: 70, typical: 62, label: 'Team Costs' },
    operations: { min: 18, max: 30, typical: 24, label: 'Operations' },
    overhead: { min: 10, max: 18, typical: 14, label: 'Overhead' },
  },

  // Budget as % of fund size (AUM)
  budgetAsPercentOfAUM: [
    { tier: '$0-50M', min: 3.5, max: 5.5, typical: 4.5 },
    { tier: '$50-100M', min: 2.5, max: 4.0, typical: 3.2 },
    { tier: '$100-200M', min: 1.8, max: 3.0, typical: 2.4 },
    { tier: '$200-500M', min: 1.2, max: 2.2, typical: 1.7 },
    { tier: '$500M+', min: 0.8, max: 1.5, typical: 1.1 },
  ],

  // Team size benchmarks
  teamSize: [
    { tier: '$0-50M', min: 2, max: 4, typical: 3 },
    { tier: '$50-100M', min: 3, max: 6, typical: 4 },
    { tier: '$100-200M', min: 5, max: 9, typical: 7 },
    { tier: '$200-500M', min: 8, max: 14, typical: 11 },
    { tier: '$500M+', min: 12, max: 25, typical: 18 },
  ],

  // Typical runway expectations
  runway: {
    minimum: 12,
    recommended: 18,
    strong: 24,
  },

  // Typical monthly costs by category
  operationsCosts: {
    fundAdmin: { min: 4000, max: 15000, description: 'Fund Administration' },
    audit: { min: 2500, max: 8000, description: 'Audit (monthly equivalent)' },
    legal: { min: 2000, max: 8000, description: 'Legal (ongoing)' },
    compliance: { min: 1500, max: 6000, description: 'Compliance' },
    tax: { min: 2000, max: 6000, description: 'Tax Preparation' },
  },

  overheadCosts: {
    office: { min: 1000, max: 10000, description: 'Office/Coworking' },
    insurance: { min: 1500, max: 5000, description: 'D&O/E&O Insurance' },
    technology: { min: 500, max: 4000, description: 'Technology' },
    travel: { min: 1500, max: 6000, description: 'Travel & Entertainment' },
  },
}

interface BenchmarksProps {
  data: BudgetData
  results: BudgetResults
}

type BenchmarkStatus = 'good' | 'warning' | 'info'

interface BenchmarkItem {
  label: string
  value: string
  benchmark: string
  status: BenchmarkStatus
  note?: string
}

export function Benchmarks({ data, results }: BenchmarksProps) {
  const benchmarkItems = useMemo(() => {
    const items: BenchmarkItem[] = []

    const totalFundSize = data.funds.reduce((s, f) => s + f.size, 0)
    const teamCost = data.expenses.team.reduce((s, t) => s + t.monthlyCost, 0)
    const opsCost = data.expenses.operations.reduce((s, o) => s + o.monthlyCost, 0)
    const overheadCost = data.expenses.overhead.reduce((s, o) => s + o.monthlyCost, 0)
    const totalMonthly = results.monthlyBurn
    const annualBudget = totalMonthly * 12

    // Find appropriate tier
    const tier = BENCHMARKS.tiers.find(t => totalFundSize >= t.min && totalFundSize < t.max)
    const tierLabel = tier?.label || '$0-50M'
    const tierIndex = BENCHMARKS.tiers.findIndex(t => t === tier)

    // 1. Team cost as % of budget
    const teamPercent = totalMonthly > 0 ? (teamCost / totalMonthly) * 100 : 0
    const teamBenchmark = BENCHMARKS.expenseAllocation.team
    items.push({
      label: 'Team Costs',
      value: `${teamPercent.toFixed(0)}% of budget`,
      benchmark: `Typical: ${teamBenchmark.min}-${teamBenchmark.max}%`,
      status: teamPercent >= teamBenchmark.min && teamPercent <= teamBenchmark.max ? 'good' :
              teamPercent > teamBenchmark.max ? 'warning' : 'info',
      note: teamPercent > teamBenchmark.max
        ? 'Team costs are above typical range - ensure revenue supports this'
        : teamPercent < teamBenchmark.min
        ? 'Team costs are lean - common for emerging managers'
        : undefined
    })

    // 2. Operations as % of budget
    const opsPercent = totalMonthly > 0 ? (opsCost / totalMonthly) * 100 : 0
    const opsBenchmark = BENCHMARKS.expenseAllocation.operations
    items.push({
      label: 'Operations',
      value: `${opsPercent.toFixed(0)}% of budget`,
      benchmark: `Typical: ${opsBenchmark.min}-${opsBenchmark.max}%`,
      status: opsPercent >= opsBenchmark.min && opsPercent <= opsBenchmark.max ? 'good' :
              opsPercent > opsBenchmark.max ? 'warning' : 'info',
    })

    // 3. Overhead as % of budget
    const overheadPercent = totalMonthly > 0 ? (overheadCost / totalMonthly) * 100 : 0
    const overheadBenchmark = BENCHMARKS.expenseAllocation.overhead
    items.push({
      label: 'Overhead',
      value: `${overheadPercent.toFixed(0)}% of budget`,
      benchmark: `Typical: ${overheadBenchmark.min}-${overheadBenchmark.max}%`,
      status: overheadPercent >= overheadBenchmark.min && overheadPercent <= overheadBenchmark.max ? 'good' :
              overheadPercent > overheadBenchmark.max ? 'warning' : 'info',
    })

    // 4. Budget as % of AUM
    const budgetPctBenchmark = BENCHMARKS.budgetAsPercentOfAUM[tierIndex] || BENCHMARKS.budgetAsPercentOfAUM[0]
    const budgetPct = totalFundSize > 0 ? (annualBudget / (totalFundSize * 1_000_000)) * 100 : 0
    items.push({
      label: 'Budget / AUM',
      value: `${budgetPct.toFixed(1)}%`,
      benchmark: `Typical for ${tierLabel}: ${budgetPctBenchmark.min}-${budgetPctBenchmark.max}%`,
      status: budgetPct >= budgetPctBenchmark.min && budgetPct <= budgetPctBenchmark.max ? 'good' :
              budgetPct > budgetPctBenchmark.max ? 'warning' : 'info',
      note: budgetPct > budgetPctBenchmark.max
        ? 'Budget is high relative to fund size - ensure fee revenue covers costs'
        : budgetPct < budgetPctBenchmark.min
        ? 'Budget is lean - you may be understaffed or underinvesting'
        : undefined
    })

    // 5. Team size
    const teamSizeBenchmark = BENCHMARKS.teamSize[tierIndex] || BENCHMARKS.teamSize[0]
    const teamCount = data.expenses.team.length
    items.push({
      label: 'Team Size',
      value: `${teamCount} people`,
      benchmark: `Typical for ${tierLabel}: ${teamSizeBenchmark.min}-${teamSizeBenchmark.max}`,
      status: teamCount >= teamSizeBenchmark.min && teamCount <= teamSizeBenchmark.max ? 'good' :
              teamCount > teamSizeBenchmark.max ? 'info' : 'info',
    })

    // 6. Runway
    const runwayMonths = results.runwayMonths ?? 60
    items.push({
      label: 'Runway',
      value: runwayMonths >= 60 ? '60+ months' : `${runwayMonths} months`,
      benchmark: `Target: ${BENCHMARKS.runway.recommended}+ months`,
      status: runwayMonths >= BENCHMARKS.runway.strong ? 'good' :
              runwayMonths >= BENCHMARKS.runway.recommended ? 'good' :
              runwayMonths >= BENCHMARKS.runway.minimum ? 'warning' : 'warning',
      note: runwayMonths < BENCHMARKS.runway.minimum
        ? 'Runway is critically low - consider reducing costs or raising more capital'
        : runwayMonths < BENCHMARKS.runway.recommended
        ? 'Runway is below recommended level - build more cushion if possible'
        : undefined
    })

    return items
  }, [data, results])

  const getStatusIcon = (status: BenchmarkStatus) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    }
  }

  const getStatusBg = (status: BenchmarkStatus) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
    }
  }

  // Count statuses
  const statusCounts = benchmarkItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<BenchmarkStatus, number>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Industry Benchmarks
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            {statusCounts.good > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {statusCounts.good} on track
              </span>
            )}
            {statusCounts.warning > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                {statusCounts.warning} to review
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {benchmarkItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                getStatusBg(item.status)
              )}
            >
              <div className="mt-0.5">{getStatusIcon(item.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-medium text-sm">{item.label}</span>
                  <span className="font-semibold text-sm">{item.value}</span>
                </div>
                <div className="text-xs text-muted-foreground">{item.benchmark}</div>
                {item.note && (
                  <div className={cn(
                    "text-xs mt-1",
                    item.status === 'warning' ? "text-amber-700 dark:text-amber-300" :
                    item.status === 'info' ? "text-blue-700 dark:text-blue-300" :
                    "text-emerald-700 dark:text-emerald-300"
                  )}>
                    {item.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span className="font-medium">Note:</span> Benchmarks are based on industry surveys of US-based fund managers.
          Your specific situation may warrant deviation from these ranges.
        </div>
      </CardContent>
    </Card>
  )
}
