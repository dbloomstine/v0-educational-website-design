"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Info
} from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PeerComparisonProps {
  data: BudgetData
  results: BudgetResults
  className?: string
}

interface BenchmarkData {
  metric: string
  yourValue: number
  peerMedian: number
  peerRange: { min: number; max: number }
  unit: string
  format: (v: number) => string
  lowerIsBetter?: boolean
  source: string
}

// Industry benchmarks based on fund size tiers
const BENCHMARKS = {
  small: { // <$100M
    feeRate: { median: 2.0, min: 1.75, max: 2.5 },
    monthlyBurnPerMillion: { median: 2500, min: 1500, max: 4000 },
    teamCount: { median: 2, min: 1, max: 4 },
    runwayMonths: { median: 18, min: 12, max: 36 },
    teamCostRatio: { median: 65, min: 50, max: 80 },
    opsCostRatio: { median: 25, min: 15, max: 35 }
  },
  medium: { // $100M-$500M
    feeRate: { median: 1.75, min: 1.5, max: 2.0 },
    monthlyBurnPerMillion: { median: 1800, min: 1000, max: 2500 },
    teamCount: { median: 5, min: 3, max: 8 },
    runwayMonths: { median: 24, min: 18, max: 36 },
    teamCostRatio: { median: 60, min: 50, max: 75 },
    opsCostRatio: { median: 28, min: 18, max: 38 }
  },
  large: { // >$500M
    feeRate: { median: 1.5, min: 1.25, max: 1.75 },
    monthlyBurnPerMillion: { median: 1200, min: 800, max: 1800 },
    teamCount: { median: 10, min: 6, max: 20 },
    runwayMonths: { median: 24, min: 18, max: 48 },
    teamCostRatio: { median: 55, min: 45, max: 70 },
    opsCostRatio: { median: 30, min: 20, max: 40 }
  }
}

export function PeerComparison({ data, results, className }: PeerComparisonProps) {
  const benchmarks = useMemo((): BenchmarkData[] => {
    const fund = data.funds[0]
    if (!fund) return []

    // Determine fund size tier
    const tier = fund.size < 100 ? 'small' : fund.size < 500 ? 'medium' : 'large'
    const tierBenchmarks = BENCHMARKS[tier]

    const teamCost = data.expenses.team.reduce((s, t) => s + t.monthlyCost, 0)
    const opsCost = data.expenses.operations.reduce((s, o) => s + o.monthlyCost, 0)
    const totalCost = results.monthlyBurn
    const teamCostRatio = totalCost > 0 ? (teamCost / totalCost) * 100 : 0
    const opsCostRatio = totalCost > 0 ? (opsCost / totalCost) * 100 : 0
    const burnPerMillion = fund.size > 0 ? (results.monthlyBurn / fund.size) * 1000 : 0

    return [
      {
        metric: 'Management Fee Rate',
        yourValue: fund.feeRate,
        peerMedian: tierBenchmarks.feeRate.median,
        peerRange: { min: tierBenchmarks.feeRate.min, max: tierBenchmarks.feeRate.max },
        unit: '%',
        format: (v) => `${v.toFixed(2)}%`,
        source: 'ILPA Fee Reporting Template'
      },
      {
        metric: 'Monthly Burn per $1M AUM',
        yourValue: burnPerMillion,
        peerMedian: tierBenchmarks.monthlyBurnPerMillion.median,
        peerRange: { min: tierBenchmarks.monthlyBurnPerMillion.min, max: tierBenchmarks.monthlyBurnPerMillion.max },
        unit: '$',
        format: (v) => formatCurrency(v, true),
        lowerIsBetter: true,
        source: 'Cambridge Associates'
      },
      {
        metric: 'Team Size',
        yourValue: data.expenses.team.length,
        peerMedian: tierBenchmarks.teamCount.median,
        peerRange: { min: tierBenchmarks.teamCount.min, max: tierBenchmarks.teamCount.max },
        unit: 'people',
        format: (v) => `${Math.round(v)} people`,
        source: 'NVCA Industry Survey'
      },
      {
        metric: 'Pre-Fee Runway',
        yourValue: results.runwayMonths || 0,
        peerMedian: tierBenchmarks.runwayMonths.median,
        peerRange: { min: tierBenchmarks.runwayMonths.min, max: tierBenchmarks.runwayMonths.max },
        unit: 'months',
        format: (v) => `${Math.round(v)} months`,
        source: 'First-time fund manager surveys'
      },
      {
        metric: 'Team Cost Ratio',
        yourValue: teamCostRatio,
        peerMedian: tierBenchmarks.teamCostRatio.median,
        peerRange: { min: tierBenchmarks.teamCostRatio.min, max: tierBenchmarks.teamCostRatio.max },
        unit: '%',
        format: (v) => `${v.toFixed(0)}%`,
        source: 'Industry operating data'
      },
      {
        metric: 'Operations Cost Ratio',
        yourValue: opsCostRatio,
        peerMedian: tierBenchmarks.opsCostRatio.median,
        peerRange: { min: tierBenchmarks.opsCostRatio.min, max: tierBenchmarks.opsCostRatio.max },
        unit: '%',
        format: (v) => `${v.toFixed(0)}%`,
        lowerIsBetter: true,
        source: 'Industry operating data'
      }
    ]
  }, [data, results])

  const fund = data.funds[0]
  const tierLabel = fund ? (fund.size < 100 ? 'Small (<$100M)' : fund.size < 500 ? 'Mid-sized ($100M-$500M)' : 'Large (>$500M)') : ''

  // Calculate percentile position
  const getPercentile = (value: number, min: number, max: number): number => {
    if (value <= min) return 0
    if (value >= max) return 100
    return ((value - min) / (max - min)) * 100
  }

  // Get comparison indicator
  const getComparison = (value: number, median: number, range: { min: number; max: number }, lowerIsBetter?: boolean) => {
    const diff = value - median
    const diffPercent = (diff / median) * 100

    if (Math.abs(diffPercent) < 10) {
      return { icon: Minus, color: 'text-muted-foreground', label: 'At median' }
    }

    const isPositive = lowerIsBetter ? diff < 0 : diff > 0
    const isNegative = lowerIsBetter ? diff > 0 : diff < 0

    if (isPositive) {
      return { icon: TrendingUp, color: 'text-emerald-600', label: 'Above median' }
    } else if (isNegative) {
      return { icon: TrendingDown, color: 'text-amber-600', label: 'Below median' }
    }
    return { icon: Minus, color: 'text-muted-foreground', label: 'At median' }
  }

  if (benchmarks.length === 0) return null

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Peer Comparison
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Info className="h-3.5 w-3.5" />
                  {tierLabel} funds
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  Benchmarks based on industry data for {tierLabel.toLowerCase()} venture funds.
                  Sources include ILPA, Cambridge Associates, and NVCA surveys.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          See how your budget compares to peer funds in your size category.
        </p>

        <div className="space-y-4">
          {benchmarks.map((benchmark) => {
            const comparison = getComparison(
              benchmark.yourValue,
              benchmark.peerMedian,
              benchmark.peerRange,
              benchmark.lowerIsBetter
            )
            const Icon = comparison.icon
            const percentile = getPercentile(
              benchmark.yourValue,
              benchmark.peerRange.min,
              benchmark.peerRange.max
            )

            return (
              <div key={benchmark.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{benchmark.metric}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Source: {benchmark.source}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{benchmark.format(benchmark.yourValue)}</span>
                    <Icon className={cn("h-4 w-4", comparison.color)} />
                  </div>
                </div>

                {/* Visual range bar */}
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  {/* Peer range */}
                  <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30" />

                  {/* Median marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                    style={{ left: '50%' }}
                  />

                  {/* Your position */}
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm",
                      comparison.color === 'text-emerald-600' && "bg-emerald-500",
                      comparison.color === 'text-amber-600' && "bg-amber-500",
                      comparison.color === 'text-muted-foreground' && "bg-blue-500"
                    )}
                    style={{
                      left: `${Math.min(100, Math.max(0, percentile))}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </div>

                {/* Range labels */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{benchmark.format(benchmark.peerRange.min)}</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    Median: {benchmark.format(benchmark.peerMedian)}
                  </span>
                  <span>{benchmark.format(benchmark.peerRange.max)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            Note: Benchmarks are based on industry surveys and may vary by strategy, geography, and vintage year.
            Use as directional guidance, not absolute targets.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
