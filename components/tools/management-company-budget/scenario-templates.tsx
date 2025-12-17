"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Layers,
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
  Shield,
  Check
} from 'lucide-react'
import { BudgetData } from './types'
import { formatCurrency } from './budget-calculator'

interface ScenarioTemplatesProps {
  currentData: BudgetData
  onApply: (data: BudgetData) => void
}

interface ScenarioTemplate {
  id: string
  name: string
  description: string
  icon: typeof TrendingDown
  color: string
  // Multipliers for expenses
  teamMultiplier: number
  opsMultiplier: number
  overheadMultiplier: number
  // Fund adjustments
  fundSizeMultiplier?: number
  feeRateAdjustment?: number
}

const SCENARIOS: ScenarioTemplate[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower revenue, higher expenses - plan for challenges',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/30',
    teamMultiplier: 1.1, // 10% higher
    opsMultiplier: 1.15, // 15% higher
    overheadMultiplier: 1.2, // 20% higher
    fundSizeMultiplier: 0.8, // 20% smaller fund
    feeRateAdjustment: -0.25, // 25bps lower fee
  },
  {
    id: 'base',
    name: 'Base Case',
    description: 'Your current configuration - no changes',
    icon: Minus,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
    teamMultiplier: 1.0,
    opsMultiplier: 1.0,
    overheadMultiplier: 1.0,
  },
  {
    id: 'optimistic',
    name: 'Optimistic',
    description: 'Better revenue, lean expenses - best case',
    icon: TrendingUp,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30',
    teamMultiplier: 0.9, // 10% lower
    opsMultiplier: 0.9, // 10% lower
    overheadMultiplier: 0.85, // 15% lower
    fundSizeMultiplier: 1.2, // 20% larger fund
    feeRateAdjustment: 0.25, // 25bps higher fee
  },
  {
    id: 'lean',
    name: 'Lean Startup',
    description: 'Minimum viable team and expenses',
    icon: Zap,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/30',
    teamMultiplier: 0.6, // 40% lower - bare bones
    opsMultiplier: 0.7, // 30% lower
    overheadMultiplier: 0.5, // 50% lower
  },
  {
    id: 'growth',
    name: 'Growth Mode',
    description: 'Invest in team and infrastructure for scale',
    icon: TrendingUp,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/30',
    teamMultiplier: 1.5, // 50% higher
    opsMultiplier: 1.3, // 30% higher
    overheadMultiplier: 1.4, // 40% higher
    fundSizeMultiplier: 1.5, // Much larger fund
  }
]

export function ScenarioTemplates({ currentData, onApply }: ScenarioTemplatesProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<BudgetData | null>(null)

  const applyScenario = (scenario: ScenarioTemplate) => {
    const newData: BudgetData = {
      ...currentData,
      funds: currentData.funds.map(fund => ({
        ...fund,
        size: Math.round((fund.size * (scenario.fundSizeMultiplier ?? 1)) * 10) / 10,
        feeRate: Math.max(0.5, Math.min(3, fund.feeRate + (scenario.feeRateAdjustment ?? 0)))
      })),
      expenses: {
        team: currentData.expenses.team.map(member => ({
          ...member,
          monthlyCost: Math.round(member.monthlyCost * scenario.teamMultiplier)
        })),
        operations: currentData.expenses.operations.map(item => ({
          ...item,
          monthlyCost: Math.round(item.monthlyCost * scenario.opsMultiplier)
        })),
        overhead: currentData.expenses.overhead.map(item => ({
          ...item,
          monthlyCost: Math.round(item.monthlyCost * scenario.overheadMultiplier)
        }))
      }
    }

    return newData
  }

  const handleScenarioSelect = (scenario: ScenarioTemplate) => {
    setSelectedScenario(scenario.id)
    if (scenario.id !== 'base') {
      setPreviewData(applyScenario(scenario))
    } else {
      setPreviewData(null)
    }
  }

  const handleApply = () => {
    if (selectedScenario && selectedScenario !== 'base' && previewData) {
      onApply(previewData)
      setSelectedScenario(null)
      setPreviewData(null)
    }
  }

  // Calculate preview metrics
  const getPreviewMetrics = (data: BudgetData) => {
    const teamCost = data.expenses.team.reduce((sum, m) => sum + m.monthlyCost, 0)
    const opsCost = data.expenses.operations.reduce((sum, o) => sum + o.monthlyCost, 0)
    const overheadCost = data.expenses.overhead.reduce((sum, o) => sum + o.monthlyCost, 0)
    const totalMonthly = teamCost + opsCost + overheadCost
    const fundSize = data.funds[0]?.size || 0
    const feeRate = data.funds[0]?.feeRate || 0
    const annualRevenue = fundSize * 1_000_000 * (feeRate / 100)

    return {
      monthlyBurn: totalMonthly,
      annualRevenue,
      fundSize,
      feeRate
    }
  }

  const currentMetrics = getPreviewMetrics(currentData)
  const previewMetrics = previewData ? getPreviewMetrics(previewData) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Scenario Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Quickly model different scenarios by applying preset adjustments to your budget.
        </p>

        {/* Scenario Options */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            const isSelected = selectedScenario === scenario.id

            return (
              <button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("p-1.5 rounded", scenario.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{scenario.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground">{scenario.description}</p>
              </button>
            )
          })}
        </div>

        {/* Preview */}
        {selectedScenario && selectedScenario !== 'base' && previewMetrics && (
          <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
            <div className="text-sm font-medium">Preview Changes</div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Monthly Burn</div>
                <div className="font-mono">
                  {formatCurrency(currentMetrics.monthlyBurn, true)}
                  <span className="mx-1">→</span>
                  <span className={previewMetrics.monthlyBurn < currentMetrics.monthlyBurn ? 'text-emerald-600' : 'text-red-600'}>
                    {formatCurrency(previewMetrics.monthlyBurn, true)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Annual Revenue</div>
                <div className="font-mono">
                  {formatCurrency(currentMetrics.annualRevenue, true)}
                  <span className="mx-1">→</span>
                  <span className={previewMetrics.annualRevenue > currentMetrics.annualRevenue ? 'text-emerald-600' : 'text-red-600'}>
                    {formatCurrency(previewMetrics.annualRevenue, true)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Fund Size</div>
                <div className="font-mono">
                  ${currentMetrics.fundSize}M
                  <span className="mx-1">→</span>
                  <span className={previewMetrics.fundSize > currentMetrics.fundSize ? 'text-emerald-600' : 'text-amber-600'}>
                    ${previewMetrics.fundSize}M
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Fee Rate</div>
                <div className="font-mono">
                  {currentMetrics.feeRate}%
                  <span className="mx-1">→</span>
                  <span className={previewMetrics.feeRate >= currentMetrics.feeRate ? 'text-emerald-600' : 'text-amber-600'}>
                    {previewMetrics.feeRate}%
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={handleApply} className="w-full">
              Apply {SCENARIOS.find(s => s.id === selectedScenario)?.name} Scenario
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground">
          Scenarios adjust your current budget proportionally. You can always undo or modify values after applying.
        </div>
      </CardContent>
    </Card>
  )
}
