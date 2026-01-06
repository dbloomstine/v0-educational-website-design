"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { DollarSign, Users, TrendingUp, AlertCircle, CheckCircle2, Percent } from 'lucide-react'
import { BudgetData } from './types'
import { formatCurrency } from './budget-calculator'

interface GPCommitmentProps {
  data: BudgetData
  gpCommitmentPercent: number
  onGpCommitmentChange: (percent: number) => void
  fundedAmount: number
  onFundedAmountChange: (amount: number) => void
}

// Industry benchmarks for GP commitment
const GP_COMMITMENT_BENCHMARKS = {
  minimum: 1,      // 1% minimum expected
  typical: 2,      // 2% is most common
  strong: 3,       // 3% shows strong alignment
  exceptional: 5,  // 5%+ is exceptional
}

export function GPCommitment({
  data,
  gpCommitmentPercent,
  onGpCommitmentChange,
  fundedAmount,
  onFundedAmountChange
}: GPCommitmentProps) {
  // Calculate GP commitment metrics
  const metrics = useMemo(() => {
    const totalFundSize = data.funds.reduce((sum, f) => sum + f.size * 1_000_000, 0)
    const totalCommitment = totalFundSize * (gpCommitmentPercent / 100)
    const unfundedCommitment = Math.max(0, totalCommitment - fundedAmount)
    const fundedPercent = totalCommitment > 0 ? (fundedAmount / totalCommitment) * 100 : 0

    // Calculate commitment by fund
    const fundCommitments = data.funds.map(fund => ({
      name: fund.name,
      fundSize: fund.size * 1_000_000,
      commitment: fund.size * 1_000_000 * (gpCommitmentPercent / 100),
      // Proportional funded amount
      funded: totalCommitment > 0
        ? (fund.size * 1_000_000 * (gpCommitmentPercent / 100) / totalCommitment) * fundedAmount
        : 0
    }))

    // Estimate annual funding requirement (typically called over 3-5 years)
    const yearsToFullyFund = 4 // Typical investment period
    const annualFundingRequired = unfundedCommitment / yearsToFullyFund

    return {
      totalFundSize,
      totalCommitment,
      fundedAmount,
      unfundedCommitment,
      fundedPercent,
      fundCommitments,
      annualFundingRequired,
    }
  }, [data.funds, gpCommitmentPercent, fundedAmount])

  // Determine commitment status
  const getCommitmentStatus = () => {
    if (gpCommitmentPercent >= GP_COMMITMENT_BENCHMARKS.exceptional) {
      return { label: 'Exceptional', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/30' }
    }
    if (gpCommitmentPercent >= GP_COMMITMENT_BENCHMARKS.strong) {
      return { label: 'Strong', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/30' }
    }
    if (gpCommitmentPercent >= GP_COMMITMENT_BENCHMARKS.typical) {
      return { label: 'Market Standard', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/30' }
    }
    if (gpCommitmentPercent >= GP_COMMITMENT_BENCHMARKS.minimum) {
      return { label: 'Minimum', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30' }
    }
    return { label: 'Below Market', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30' }
  }

  const status = getCommitmentStatus()

  // Funding progress
  const getFundingStatus = () => {
    if (metrics.fundedPercent >= 100) return { label: 'Fully Funded', icon: CheckCircle2, color: 'text-emerald-600' }
    if (metrics.fundedPercent >= 50) return { label: 'On Track', icon: TrendingUp, color: 'text-blue-600' }
    if (metrics.fundedPercent >= 25) return { label: 'In Progress', icon: TrendingUp, color: 'text-amber-600' }
    return { label: 'Just Started', icon: AlertCircle, color: 'text-muted-foreground' }
  }

  const fundingStatus = getFundingStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          GP Commitment Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gp-percent" className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" />
              GP Commitment %
            </Label>
            <Input
              id="gp-percent"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={gpCommitmentPercent}
              onChange={(e) => onGpCommitmentChange(parseFloat(e.target.value) || 0)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Typical: 1-3% of fund size</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="funded-amount" className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Amount Funded
            </Label>
            <Input
              id="funded-amount"
              type="number"
              min={0}
              step={10000}
              value={fundedAmount}
              onChange={(e) => onFundedAmountChange(parseFloat(e.target.value) || 0)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Capital already contributed</p>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalCommitment, true)}</div>
            <div className="text-xs text-muted-foreground">Total Commitment</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(fundedAmount, true)}</div>
            <div className="text-xs text-muted-foreground">Funded</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(metrics.unfundedCommitment, true)}</div>
            <div className="text-xs text-muted-foreground">Unfunded</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className={cn("font-medium flex items-center gap-1", fundingStatus.color)}>
              <fundingStatus.icon className="h-4 w-4" />
              {metrics.fundedPercent.toFixed(0)}% - {fundingStatus.label}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.fundedPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Commitment Status Badge */}
        <div className={cn("p-3 rounded-lg border flex items-center justify-between", status.bg)}>
          <div>
            <div className={cn("font-medium", status.color)}>{status.label} GP Commitment</div>
            <div className="text-xs text-muted-foreground">
              {gpCommitmentPercent}% of {formatCurrency(metrics.totalFundSize, true)} fund size
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Industry Range</div>
            <div className="text-xs">1-5% typical</div>
          </div>
        </div>

        {/* Per-Fund Breakdown */}
        {data.funds.length > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Commitment by Fund</div>
            <div className="space-y-2">
              {metrics.fundCommitments.map((fc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                >
                  <span>{fc.name}</span>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(fc.commitment, true)}</span>
                    <span className="text-muted-foreground ml-2">
                      ({formatCurrency(fc.funded, true)} funded)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planning Note */}
        {metrics.unfundedCommitment > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm">
              <span className="font-medium text-blue-900 dark:text-blue-100">Planning Note: </span>
              <span className="text-blue-800 dark:text-blue-200">
                You&apos;ll need approximately {formatCurrency(metrics.annualFundingRequired, true)}/year
                over the next 4 years to fund your remaining commitment.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
