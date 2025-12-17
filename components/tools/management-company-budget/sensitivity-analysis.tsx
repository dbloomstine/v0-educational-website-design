"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, TrendingDown, TrendingUp, Target } from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { calculateBudget, formatCurrency, formatRunway } from './budget-calculator'

interface SensitivityAnalysisProps {
  baseData: BudgetData
  baseResults: BudgetResults
}

export function SensitivityAnalysis({ baseData, baseResults }: SensitivityAnalysisProps) {
  // Calculate sensitivity scenarios
  const scenarios = useMemo(() => {
    const results: Array<{
      label: string
      description: string
      fundSizeChange: number
      burnChange: number
      runway: number | null
      runwayDelta: number | null
      breakEven: number | null
      cashNeeded: number
      type: 'base' | 'better' | 'worse' | 'critical'
    }> = []

    const baseFundSize = baseData.funds.reduce((s, f) => s + f.size, 0)
    const baseMonthlyBurn = baseResults.monthlyBurn

    // Scenarios to test
    const testCases = [
      { fundDelta: 0.2, burnDelta: -0.1, label: 'Optimistic', description: 'Fund 20% larger, costs 10% lower' },
      { fundDelta: 0, burnDelta: 0, label: 'Base Case', description: 'Current projections' },
      { fundDelta: -0.15, burnDelta: 0.1, label: 'Conservative', description: 'Fund 15% smaller, costs 10% higher' },
      { fundDelta: -0.3, burnDelta: 0.2, label: 'Downside', description: 'Fund 30% smaller, costs 20% higher' },
    ]

    for (const tc of testCases) {
      // Create modified data
      const modifiedData: BudgetData = {
        ...baseData,
        funds: baseData.funds.map(f => ({
          ...f,
          size: f.size * (1 + tc.fundDelta)
        })),
        expenses: {
          ...baseData.expenses,
          team: baseData.expenses.team.map(t => ({
            ...t,
            monthlyCost: t.monthlyCost * (1 + tc.burnDelta)
          })),
          operations: baseData.expenses.operations.map(o => ({
            ...o,
            monthlyCost: o.monthlyCost * (1 + tc.burnDelta)
          })),
          overhead: baseData.expenses.overhead.map(o => ({
            ...o,
            monthlyCost: o.monthlyCost * (1 + tc.burnDelta)
          }))
        }
      }

      const scenarioResults = calculateBudget(modifiedData)

      const runwayDelta = baseResults.runwayMonths !== null && scenarioResults.runwayMonths !== null
        ? scenarioResults.runwayMonths - baseResults.runwayMonths
        : null

      let type: 'base' | 'better' | 'worse' | 'critical' = 'base'
      if (tc.fundDelta === 0 && tc.burnDelta === 0) {
        type = 'base'
      } else if (runwayDelta !== null && runwayDelta > 0) {
        type = 'better'
      } else if (scenarioResults.runwayMonths !== null && scenarioResults.runwayMonths < 12) {
        type = 'critical'
      } else {
        type = 'worse'
      }

      results.push({
        label: tc.label,
        description: tc.description,
        fundSizeChange: tc.fundDelta * 100,
        burnChange: tc.burnDelta * 100,
        runway: scenarioResults.runwayMonths,
        runwayDelta,
        breakEven: scenarioResults.breakEvenMonth,
        cashNeeded: scenarioResults.seedCapitalNeeded,
        type
      })
    }

    return results
  }, [baseData, baseResults])

  // Find critical thresholds
  const criticalThresholds = useMemo(() => {
    const thresholds: Array<{ metric: string; value: string; warning: string }> = []

    // Test fund size threshold where runway drops below 12 months
    if (baseResults.runwayMonths !== null && baseResults.runwayMonths > 12) {
      for (let pctDecrease = 5; pctDecrease <= 50; pctDecrease += 5) {
        const testData: BudgetData = {
          ...baseData,
          funds: baseData.funds.map(f => ({
            ...f,
            size: f.size * (1 - pctDecrease / 100)
          }))
        }
        const testResults = calculateBudget(testData)
        if (testResults.runwayMonths !== null && testResults.runwayMonths < 12) {
          const threshold = baseData.funds.reduce((s, f) => s + f.size, 0) * (1 - pctDecrease / 100)
          thresholds.push({
            metric: 'Fund Size',
            value: `$${threshold.toFixed(0)}M`,
            warning: `At ${pctDecrease}% smaller fund, runway drops below 12 months`
          })
          break
        }
      }
    }

    // Test burn rate threshold
    if (baseResults.runwayMonths !== null && baseResults.runwayMonths > 12) {
      for (let pctIncrease = 10; pctIncrease <= 100; pctIncrease += 10) {
        const testData: BudgetData = {
          ...baseData,
          expenses: {
            ...baseData.expenses,
            team: baseData.expenses.team.map(t => ({
              ...t,
              monthlyCost: t.monthlyCost * (1 + pctIncrease / 100)
            })),
            operations: baseData.expenses.operations.map(o => ({
              ...o,
              monthlyCost: o.monthlyCost * (1 + pctIncrease / 100)
            })),
            overhead: baseData.expenses.overhead.map(o => ({
              ...o,
              monthlyCost: o.monthlyCost * (1 + pctIncrease / 100)
            }))
          }
        }
        const testResults = calculateBudget(testData)
        if (testResults.runwayMonths !== null && testResults.runwayMonths < 12) {
          thresholds.push({
            metric: 'Monthly Burn',
            value: formatCurrency(baseResults.monthlyBurn * (1 + pctIncrease / 100)),
            warning: `At ${pctIncrease}% higher burn, runway drops below 12 months`
          })
          break
        }
      }
    }

    return thresholds
  }, [baseData, baseResults])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Sensitivity Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.label}
              className={cn(
                "p-4 rounded-lg border",
                scenario.type === 'base' && "bg-accent border-border",
                scenario.type === 'better' && "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
                scenario.type === 'worse' && "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
                scenario.type === 'critical' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {scenario.type === 'better' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                {scenario.type === 'worse' && <TrendingDown className="h-4 w-4 text-amber-600" />}
                {scenario.type === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                <span className="font-medium text-sm">{scenario.label}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">{scenario.description}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Runway</span>
                  <span className={cn(
                    "font-medium",
                    scenario.type === 'critical' && "text-red-600 dark:text-red-400"
                  )}>
                    {formatRunway(scenario.runway)}
                    {scenario.runwayDelta !== null && scenario.runwayDelta !== 0 && (
                      <span className={cn(
                        "ml-1 text-xs",
                        scenario.runwayDelta > 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        ({scenario.runwayDelta > 0 ? '+' : ''}{scenario.runwayDelta}mo)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Break-even</span>
                  <span className="font-medium">
                    {scenario.breakEven ? `Mo ${scenario.breakEven}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash needed</span>
                  <span className="font-medium">{formatCurrency(scenario.cashNeeded, true)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Critical Thresholds */}
        {criticalThresholds.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-900 dark:text-amber-100">Critical Thresholds</span>
            </div>
            <div className="space-y-2">
              {criticalThresholds.map((threshold, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-amber-900 dark:text-amber-100">{threshold.metric}:</span>{' '}
                  <span className="text-amber-800 dark:text-amber-200">{threshold.warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Insight */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Key insight:</span> Your budget has{' '}
          {baseResults.runwayMonths !== null && baseResults.runwayMonths >= 24 ? (
            <span className="text-emerald-600 dark:text-emerald-400">good cushion</span>
          ) : baseResults.runwayMonths !== null && baseResults.runwayMonths >= 18 ? (
            <span className="text-amber-600 dark:text-amber-400">moderate cushion</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">limited cushion</span>
          )}{' '}
          for unexpected scenarios. Most managers target 18-24 months of runway with flexibility for 20-30% variance in either direction.
        </div>
      </CardContent>
    </Card>
  )
}
