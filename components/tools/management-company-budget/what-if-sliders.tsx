"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  PiggyBank,
  RotateCcw,
  Check,
  LucideIcon
} from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { calculateBudget, formatCurrency, formatRunway } from './budget-calculator'

interface WhatIfSlidersProps {
  data: BudgetData
  results: BudgetResults
  onApply: (newData: BudgetData) => void
}

interface SliderConfig {
  id: string
  label: string
  icon: LucideIcon
  min: number
  max: number
  step: number
  format: (value: number) => string
  getValue: (data: BudgetData) => number
  setValue: (data: BudgetData, value: number) => BudgetData
}

export function WhatIfSliders({ data, results, onApply }: WhatIfSlidersProps) {
  // Track slider adjustments
  const [adjustments, setAdjustments] = useState({
    fundSize: 0, // percentage adjustment
    feeRate: 0,
    teamCosts: 0,
    opsCosts: 0,
    startingCash: 0
  })

  // Calculate adjusted data
  const adjustedData = useMemo((): BudgetData => {
    const fundSizeMultiplier = 1 + (adjustments.fundSize / 100)
    const feeRateAdjustment = adjustments.feeRate / 100 // Convert to percentage points
    const teamMultiplier = 1 + (adjustments.teamCosts / 100)
    const opsMultiplier = 1 + (adjustments.opsCosts / 100)
    const cashMultiplier = 1 + (adjustments.startingCash / 100)

    return {
      ...data,
      startingCash: Math.round(data.startingCash * cashMultiplier),
      funds: data.funds.map(fund => ({
        ...fund,
        size: Math.round(fund.size * fundSizeMultiplier * 10) / 10,
        feeRate: Math.max(0.5, Math.min(3, fund.feeRate + feeRateAdjustment))
      })),
      expenses: {
        team: data.expenses.team.map(member => ({
          ...member,
          monthlyCost: Math.round(member.monthlyCost * teamMultiplier)
        })),
        operations: data.expenses.operations.map(item => ({
          ...item,
          monthlyCost: Math.round(item.monthlyCost * opsMultiplier)
        })),
        overhead: data.expenses.overhead // Keep overhead unchanged for simplicity
      }
    }
  }, [data, adjustments])

  // Calculate adjusted results
  const adjustedResults = useMemo(() => calculateBudget(adjustedData), [adjustedData])

  // Check if any adjustments were made
  const hasAdjustments = Object.values(adjustments).some(v => v !== 0)

  // Reset all adjustments
  const handleReset = () => {
    setAdjustments({
      fundSize: 0,
      feeRate: 0,
      teamCosts: 0,
      opsCosts: 0,
      startingCash: 0
    })
  }

  // Apply adjustments to actual data
  const handleApply = () => {
    onApply(adjustedData)
    handleReset()
  }

  // Slider configurations
  const sliders: SliderConfig[] = [
    {
      id: 'fundSize',
      label: 'Fund Size',
      icon: TrendingUp,
      min: -50,
      max: 100,
      step: 5,
      format: (v) => v >= 0 ? `+${v}%` : `${v}%`,
      getValue: () => adjustments.fundSize,
      setValue: (_, value) => {
        setAdjustments(prev => ({ ...prev, fundSize: value }))
        return data
      }
    },
    {
      id: 'feeRate',
      label: 'Fee Rate',
      icon: DollarSign,
      min: -100,
      max: 100,
      step: 25,
      format: (v) => v >= 0 ? `+${v}bp` : `${v}bp`,
      getValue: () => adjustments.feeRate,
      setValue: (_, value) => {
        setAdjustments(prev => ({ ...prev, feeRate: value }))
        return data
      }
    },
    {
      id: 'teamCosts',
      label: 'Team Costs',
      icon: Users,
      min: -40,
      max: 50,
      step: 5,
      format: (v) => v >= 0 ? `+${v}%` : `${v}%`,
      getValue: () => adjustments.teamCosts,
      setValue: (_, value) => {
        setAdjustments(prev => ({ ...prev, teamCosts: value }))
        return data
      }
    },
    {
      id: 'opsCosts',
      label: 'Ops Costs',
      icon: TrendingDown,
      min: -30,
      max: 50,
      step: 5,
      format: (v) => v >= 0 ? `+${v}%` : `${v}%`,
      getValue: () => adjustments.opsCosts,
      setValue: (_, value) => {
        setAdjustments(prev => ({ ...prev, opsCosts: value }))
        return data
      }
    },
    {
      id: 'startingCash',
      label: 'Starting Cash',
      icon: PiggyBank,
      min: -50,
      max: 100,
      step: 10,
      format: (v) => v >= 0 ? `+${v}%` : `${v}%`,
      getValue: () => adjustments.startingCash,
      setValue: (_, value) => {
        setAdjustments(prev => ({ ...prev, startingCash: value }))
        return data
      }
    }
  ]

  // Calculate comparison metrics
  const comparison = {
    monthlyBurn: adjustedResults.monthlyBurn - results.monthlyBurn,
    annualRevenue: adjustedResults.annualRevenue - results.annualRevenue,
    runway: (adjustedResults.runwayMonths || 0) - (results.runwayMonths || 0)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            What-If Scenarios
          </CardTitle>
          {hasAdjustments && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
              title="Reset all sliders to original values"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Drag the sliders to see how changes impact your budget. Apply when ready.
        </p>

        {/* Sliders */}
        <div className="space-y-5">
          {sliders.map((slider) => {
            const value = slider.getValue(data)
            const Icon = slider.icon
            const isChanged = value !== 0

            return (
              <div key={slider.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      "h-4 w-4",
                      isChanged ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isChanged && "text-primary"
                    )}>
                      {slider.label}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-mono",
                    value > 0 && "text-emerald-600",
                    value < 0 && "text-red-600",
                    value === 0 && "text-muted-foreground"
                  )}>
                    {slider.format(value)}
                  </span>
                </div>
                <Slider
                  value={[value]}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  onValueChange={([v]) => slider.setValue(data, v)}
                  className={cn(
                    isChanged && "[&_[role=slider]]:border-primary"
                  )}
                />
              </div>
            )
          })}
        </div>

        {/* Impact Preview */}
        {hasAdjustments && (
          <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
            <div className="text-sm font-medium">Impact Preview</div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Monthly Burn</div>
                <div className={cn(
                  "font-mono font-medium",
                  comparison.monthlyBurn < 0 ? "text-emerald-600" : comparison.monthlyBurn > 0 ? "text-red-600" : ""
                )}>
                  {comparison.monthlyBurn > 0 ? '+' : ''}{formatCurrency(comparison.monthlyBurn, true)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Annual Revenue</div>
                <div className={cn(
                  "font-mono font-medium",
                  comparison.annualRevenue > 0 ? "text-emerald-600" : comparison.annualRevenue < 0 ? "text-red-600" : ""
                )}>
                  {comparison.annualRevenue > 0 ? '+' : ''}{formatCurrency(comparison.annualRevenue, true)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Runway</div>
                <div className={cn(
                  "font-mono font-medium",
                  comparison.runway > 0 ? "text-emerald-600" : comparison.runway < 0 ? "text-red-600" : ""
                )}>
                  {comparison.runway > 0 ? '+' : ''}{comparison.runway} mo
                </div>
              </div>
            </div>

            {/* New metrics */}
            <div className="pt-3 border-t grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">New Burn</div>
                <div className="font-medium">{formatCurrency(adjustedResults.monthlyBurn, true)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">New Revenue</div>
                <div className="font-medium">{formatCurrency(adjustedResults.annualRevenue, true)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">New Runway</div>
                <div className="font-medium">{formatRunway(adjustedResults.runwayMonths)}</div>
              </div>
            </div>

            <Button onClick={handleApply} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        )}

        {!hasAdjustments && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Adjust the sliders above to explore different scenarios
          </div>
        )}
      </CardContent>
    </Card>
  )
}
