'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Minus, Info, CheckCircle2, AlertTriangle } from 'lucide-react'
import { WaterfallInput, formatPercent } from './waterfallCalculations'

interface PeerComparisonProps {
  input: WaterfallInput
  compact?: boolean
}

interface Benchmark {
  metric: string
  label: string
  marketLow: number
  marketMedian: number
  marketHigh: number
  userValue: number
  isPercentage: boolean
  lpFriendlyDirection: 'higher' | 'lower'
  description: string
}

export function PeerComparison({ input, compact = false }: PeerComparisonProps) {
  // Calculate where user's terms fall relative to market
  const benchmarks: Benchmark[] = [
    {
      metric: 'prefRate',
      label: 'Preferred Return',
      marketLow: 0.06,
      marketMedian: 0.08,
      marketHigh: 0.10,
      userValue: input.prefRate,
      isPercentage: true,
      lpFriendlyDirection: 'higher',
      description: 'Higher pref = more LP protection'
    },
    {
      metric: 'carryRate',
      label: 'Carried Interest',
      marketLow: 0.15,
      marketMedian: 0.20,
      marketHigh: 0.30,
      userValue: input.carryRate,
      isPercentage: true,
      lpFriendlyDirection: 'lower',
      description: 'Lower carry = more to LPs'
    },
    {
      metric: 'gpCommitmentPercent',
      label: 'GP Commitment',
      marketLow: 0.01,
      marketMedian: 0.02,
      marketHigh: 0.05,
      userValue: input.gpCommitmentPercent,
      isPercentage: true,
      lpFriendlyDirection: 'higher',
      description: 'Higher GP commit = more alignment'
    },
    {
      metric: 'catchUpRate',
      label: 'Catch-Up Rate',
      marketLow: 0.50,
      marketMedian: 1.00,
      marketHigh: 1.00,
      userValue: input.hasCatchUp ? input.catchUpRate : 0,
      isPercentage: true,
      lpFriendlyDirection: 'lower',
      description: 'Lower catch-up = LP-friendly'
    }
  ]

  const getPositionPercent = (b: Benchmark): number => {
    const range = b.marketHigh - b.marketLow
    if (range === 0) return 50
    const position = ((b.userValue - b.marketLow) / range) * 100
    return Math.max(0, Math.min(100, position))
  }

  const getComparison = (b: Benchmark): { status: 'favorable' | 'neutral' | 'unfavorable'; icon: React.ReactNode } => {

    // For LP-friendly = higher metrics
    if (b.lpFriendlyDirection === 'higher') {
      if (b.userValue >= b.marketMedian) {
        return { status: 'favorable', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> }
      } else if (b.userValue >= b.marketLow) {
        return { status: 'neutral', icon: <Minus className="h-4 w-4 text-amber-500" /> }
      } else {
        return { status: 'unfavorable', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> }
      }
    } else {
      // LP-friendly = lower metrics
      if (b.userValue <= b.marketMedian) {
        return { status: 'favorable', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> }
      } else if (b.userValue <= b.marketHigh) {
        return { status: 'neutral', icon: <Minus className="h-4 w-4 text-amber-500" /> }
      } else {
        return { status: 'unfavorable', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> }
      }
    }
  }

  // Calculate overall LP-friendliness score
  const lpFriendlyCount = benchmarks.filter(b => getComparison(b).status === 'favorable').length
  const overallAssessment = lpFriendlyCount >= 3 ? 'LP-Friendly' : lpFriendlyCount >= 2 ? 'Market Standard' : 'GP-Friendly'

  // Strategy-specific benchmarks
  const strategyBenchmarks = {
    buyout: {
      name: 'Buyout PE',
      pref: '8%',
      carry: '20%',
      catchUp: '100%',
      gpCommit: '1-2%',
      waterfall: 'European'
    },
    vc: {
      name: 'Venture Capital',
      pref: '0-8%',
      carry: '20-30%',
      catchUp: 'None or 100%',
      gpCommit: '1-2%',
      waterfall: 'American'
    },
    growth: {
      name: 'Growth Equity',
      pref: '6-8%',
      carry: '20%',
      catchUp: '100%',
      gpCommit: '2-3%',
      waterfall: 'European'
    },
    realEstate: {
      name: 'Real Estate',
      pref: '6-8%',
      carry: '15-20%',
      catchUp: '50-100%',
      gpCommit: '2-5%',
      waterfall: 'European'
    },
    credit: {
      name: 'Private Credit',
      pref: '6-8%',
      carry: '10-15%',
      catchUp: '100%',
      gpCommit: '1-3%',
      waterfall: 'European'
    }
  }

  if (compact) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Market Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Overall Assessment:</span>
            <Badge
              variant={overallAssessment === 'LP-Friendly' ? 'default' : 'secondary'}
              className={
                overallAssessment === 'LP-Friendly'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : overallAssessment === 'GP-Friendly'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  : ''
              }
            >
              {overallAssessment}
            </Badge>
          </div>
          <div className="grid gap-2">
            {benchmarks.slice(0, 3).map((b) => {
              const comparison = getComparison(b)
              return (
                <div key={b.metric} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    {comparison.icon}
                    <span className="text-sm">{b.label}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {b.isPercentage ? formatPercent(b.userValue) : b.userValue}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <CardTitle>Market Comparison</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          See how your terms compare to market standards
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Assessment */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium text-foreground">Overall Assessment</p>
            <p className="text-sm text-muted-foreground">
              {lpFriendlyCount} of {benchmarks.length} metrics are LP-favorable
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`text-base px-4 py-1 ${
              overallAssessment === 'LP-Friendly'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : overallAssessment === 'GP-Friendly'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                : ''
            }`}
          >
            {overallAssessment}
          </Badge>
        </div>

        {/* Individual Benchmarks */}
        <div className="space-y-4">
          {benchmarks.map((b) => {
            const comparison = getComparison(b)
            const positionPercent = getPositionPercent(b)

            return (
              <div key={b.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {comparison.icon}
                    <span className="font-medium">{b.label}</span>
                  </div>
                  <span className="font-semibold text-primary">
                    {b.isPercentage ? formatPercent(b.userValue) : b.userValue}
                  </span>
                </div>

                {/* Range visualization */}
                <div className="relative pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{b.isPercentage ? formatPercent(b.marketLow) : b.marketLow}</span>
                    <span className="text-primary font-medium">
                      Median: {b.isPercentage ? formatPercent(b.marketMedian) : b.marketMedian}
                    </span>
                    <span>{b.isPercentage ? formatPercent(b.marketHigh) : b.marketHigh}</span>
                  </div>
                  <div className="relative h-3 bg-gradient-to-r from-green-200 via-gray-200 to-amber-200 dark:from-green-900 dark:via-gray-700 dark:to-amber-900 rounded-full">
                    {/* Median marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary"
                      style={{ left: '50%' }}
                    />
                    {/* User value marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-white dark:border-gray-900 shadow-md"
                      style={{ left: `calc(${positionPercent}% - 8px)` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{b.description}</p>
              </div>
            )
          })}
        </div>

        {/* Strategy Benchmarks */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-3">Typical Terms by Strategy</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(strategyBenchmarks).map(([key, strat]) => (
              <div
                key={key}
                className="p-3 rounded-lg border border-border bg-background text-sm"
              >
                <p className="font-medium mb-2">{strat.name}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Pref: {strat.pref}</p>
                  <p>Carry: {strat.carry}</p>
                  <p>Catch-Up: {strat.catchUp}</p>
                  <p>GP Commit: {strat.gpCommit}</p>
                  <p>Structure: {strat.waterfall}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-medium">Note:</span> Benchmarks are based on 2023-2024 industry data from
            Preqin, Pitchbook, and ILPA surveys. Actual terms vary by fund size, manager track record,
            and negotiating leverage.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
