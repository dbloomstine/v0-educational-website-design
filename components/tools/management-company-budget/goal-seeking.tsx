"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Target, DollarSign, Building2, ArrowRight } from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { findFundSizeForRunway, findCashForRunway, formatCurrency } from './budget-calculator'

interface GoalSeekingProps {
  data: BudgetData
  results: BudgetResults
  onApply?: (field: 'fundSize' | 'startingCash', value: number) => void
}

type GoalType = 'runway' | 'breakeven' | 'custom'

export function GoalSeeking({ data, results, onApply }: GoalSeekingProps) {
  const [_goalType, _setGoalType] = useState<GoalType>('runway')
  const [targetMonths, setTargetMonths] = useState(24)
  const [_calculating, _setCalculating] = useState(false)

  // Quick goal presets
  const presets = [
    { label: '18 months', months: 18 },
    { label: '24 months', months: 24 },
    { label: '36 months', months: 36 },
    { label: '48 months', months: 48 },
  ]

  // Calculate solutions
  const solutions = useMemo(() => {
    const fundSizeNeeded = findFundSizeForRunway(data, targetMonths)
    const cashNeeded = findCashForRunway(data, targetMonths)

    return {
      fundSize: fundSizeNeeded,
      cash: cashNeeded,
      currentFundSize: data.funds[0]?.size || 0,
      currentCash: data.startingCash,
    }
  }, [data, targetMonths])

  const fundSizeDiff = solutions.fundSize !== null
    ? solutions.fundSize - solutions.currentFundSize
    : null

  const cashDiff = solutions.cash !== null
    ? solutions.cash - solutions.currentCash
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Goal Seeking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">What runway do you need?</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.months}
                variant={targetMonths === preset.months ? "default" : "outline"}
                size="sm"
                onClick={() => setTargetMonths(preset.months)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Or custom:</span>
            <Input
              type="number"
              value={targetMonths}
              onChange={(e) => setTargetMonths(parseInt(e.target.value) || 12)}
              className="w-20 h-8"
              min={6}
              max={120}
            />
            <span className="text-sm text-muted-foreground">months</span>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="text-xs text-muted-foreground mb-2">Current Status</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Runway</div>
              <div className={cn(
                "font-bold",
                results.runwayMonths !== null && results.runwayMonths < targetMonths
                  ? "text-red-600"
                  : "text-emerald-600"
              )}>
                {results.runwayMonths !== null ? `${results.runwayMonths} months` : '60+ months'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Target</div>
              <div className="font-bold">{targetMonths} months</div>
            </div>
          </div>
        </div>

        {/* Solutions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">To achieve {targetMonths} months runway:</Label>

          {/* Fund Size Solution */}
          {solutions.fundSize !== null && (
            <div className={cn(
              "p-4 rounded-lg border transition-colors",
              fundSizeDiff !== null && fundSizeDiff <= 0
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                : "bg-card hover:bg-accent/50"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Fund Size</div>
                    <div className="text-sm text-muted-foreground">
                      Need ${solutions.fundSize}M fund
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {fundSizeDiff !== null && fundSizeDiff > 0 ? (
                    <>
                      <div className="text-lg font-bold text-amber-600">+${fundSizeDiff}M</div>
                      <div className="text-xs text-muted-foreground">increase needed</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-emerald-600">Already met</div>
                      <div className="text-xs text-muted-foreground">Current: ${solutions.currentFundSize}M</div>
                    </>
                  )}
                </div>
              </div>
              {onApply && fundSizeDiff !== null && fundSizeDiff > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => onApply('fundSize', solutions.fundSize!)}
                >
                  Apply ${solutions.fundSize}M Fund Size
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* Cash Solution */}
          {solutions.cash !== null && (
            <div className={cn(
              "p-4 rounded-lg border transition-colors",
              cashDiff !== null && cashDiff <= 0
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                : "bg-card hover:bg-accent/50"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-medium">Starting Cash</div>
                    <div className="text-sm text-muted-foreground">
                      Need {formatCurrency(solutions.cash)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {cashDiff !== null && cashDiff > 0 ? (
                    <>
                      <div className="text-lg font-bold text-amber-600">+{formatCurrency(cashDiff, true)}</div>
                      <div className="text-xs text-muted-foreground">additional needed</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-emerald-600">Already met</div>
                      <div className="text-xs text-muted-foreground">Current: {formatCurrency(solutions.currentCash)}</div>
                    </>
                  )}
                </div>
              </div>
              {onApply && cashDiff !== null && cashDiff > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => onApply('startingCash', solutions.cash!)}
                >
                  Apply {formatCurrency(solutions.cash)} Starting Cash
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded">
          <strong>How it works:</strong> Goal seeking calculates the minimum fund size or starting cash needed to achieve your target runway, assuming current expense levels and fee structures.
        </div>
      </CardContent>
    </Card>
  )
}
