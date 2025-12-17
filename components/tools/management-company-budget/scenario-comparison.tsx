"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  GitCompare,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Check
} from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { calculateBudget, formatCurrency, formatRunway } from './budget-calculator'

interface SavedScenario {
  id: string
  name: string
  data: BudgetData
  results: BudgetResults
  savedAt: Date
}

interface ScenarioComparisonProps {
  currentData: BudgetData
  currentResults: BudgetResults
}

export function ScenarioComparison({ currentData, currentResults }: ScenarioComparisonProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [newScenarioName, setNewScenarioName] = useState('')
  const [isNaming, setIsNaming] = useState(false)

  // Save current state as a scenario
  const handleSaveScenario = () => {
    if (!newScenarioName.trim()) return

    const newScenario: SavedScenario = {
      id: Math.random().toString(36).substr(2, 9),
      name: newScenarioName.trim(),
      data: JSON.parse(JSON.stringify(currentData)),
      results: currentResults,
      savedAt: new Date()
    }

    setScenarios(prev => [...prev, newScenario])
    setNewScenarioName('')
    setIsNaming(false)
  }

  // Delete a scenario
  const handleDeleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id))
  }

  // Comparison metrics to display
  const comparisonMetrics = useMemo(() => [
    {
      label: 'Monthly Burn',
      key: 'monthlyBurn' as const,
      format: (v: number) => formatCurrency(v, true),
      lowerIsBetter: true
    },
    {
      label: 'Annual Revenue',
      key: 'annualRevenue' as const,
      format: (v: number) => formatCurrency(v, true),
      lowerIsBetter: false
    },
    {
      label: 'Runway',
      key: 'runwayMonths' as const,
      format: (v: number | null) => formatRunway(v),
      lowerIsBetter: false
    },
    {
      label: 'Break-Even',
      key: 'breakEvenMonth' as const,
      format: (v: number | null) => v ? `Month ${v}` : 'N/A',
      lowerIsBetter: true,
      nullIsWorst: true
    },
    {
      label: 'Seed Capital Needed',
      key: 'seedCapitalNeeded' as const,
      format: (v: number) => formatCurrency(v, true),
      lowerIsBetter: true
    }
  ], [])

  // Get comparison indicator
  const getComparisonIndicator = (
    currentValue: number | null,
    savedValue: number | null,
    lowerIsBetter: boolean,
    nullIsWorst?: boolean
  ) => {
    // Handle null values
    if (currentValue === null && savedValue === null) return { icon: Minus, color: 'text-muted-foreground' }
    if (currentValue === null) return nullIsWorst
      ? { icon: ArrowDown, color: 'text-red-500' }
      : { icon: Minus, color: 'text-muted-foreground' }
    if (savedValue === null) return nullIsWorst
      ? { icon: ArrowUp, color: 'text-emerald-500' }
      : { icon: Minus, color: 'text-muted-foreground' }

    if (currentValue === savedValue) return { icon: Minus, color: 'text-muted-foreground' }

    const isBetter = lowerIsBetter
      ? currentValue < savedValue
      : currentValue > savedValue

    return {
      icon: isBetter ? ArrowUp : ArrowDown,
      color: isBetter ? 'text-emerald-500' : 'text-red-500'
    }
  }

  // Calculate percentage change
  const getPercentChange = (current: number | null, saved: number | null): string => {
    if (current === null || saved === null || saved === 0) return ''
    const change = ((current - saved) / saved) * 100
    if (Math.abs(change) < 0.1) return ''
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Scenario Comparison
          </CardTitle>
          {!isNaming && scenarios.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNaming(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Save Current
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save new scenario */}
        {isNaming && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Input
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              placeholder="Scenario name (e.g., 'Conservative')"
              className="flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()}
            />
            <Button size="sm" onClick={handleSaveScenario} disabled={!newScenarioName.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              setIsNaming(false)
              setNewScenarioName('')
            }}>
              Cancel
            </Button>
          </div>
        )}

        {scenarios.length === 0 && !isNaming ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitCompare className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Save scenarios to compare different budget configurations</p>
            <p className="text-xs mt-1">Make changes, then save to compare against your current view</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Metric</th>
                  <th className="text-right py-2 px-2 font-medium">
                    <span className="text-primary">Current</span>
                  </th>
                  {scenarios.map((scenario) => (
                    <th key={scenario.id} className="text-right py-2 px-2 font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <span className="truncate max-w-[100px]">{scenario.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                          onClick={() => handleDeleteScenario(scenario.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonMetrics.map((metric) => (
                  <tr key={metric.key} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{metric.label}</td>
                    <td className="py-3 px-2 text-right font-medium">
                      {metric.format(currentResults[metric.key] as any)}
                    </td>
                    {scenarios.map((scenario) => {
                      const currentVal = currentResults[metric.key]
                      const savedVal = scenario.results[metric.key]
                      const indicator = getComparisonIndicator(
                        currentVal as number | null,
                        savedVal as number | null,
                        metric.lowerIsBetter,
                        metric.nullIsWorst
                      )
                      const percentChange = getPercentChange(
                        currentVal as number | null,
                        savedVal as number | null
                      )

                      return (
                        <td key={scenario.id} className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>{metric.format(savedVal as any)}</span>
                            <indicator.icon className={cn("h-3.5 w-3.5", indicator.color)} />
                          </div>
                          {percentChange && (
                            <div className={cn("text-xs", indicator.color)}>
                              {percentChange}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        {scenarios.length > 0 && (
          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground border-t">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-emerald-500" />
              Better than saved
            </span>
            <span className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-red-500" />
              Worse than saved
            </span>
            <span className="flex items-center gap-1">
              <Minus className="h-3 w-3" />
              No change
            </span>
          </div>
        )}

        {/* Helpful note */}
        <div className="text-xs text-muted-foreground pt-2">
          <span className="font-medium">Tip:</span> Save up to 3 scenarios to compare different assumptions.
          Try varying team size, expense levels, or fund sizes to see the impact on runway and break-even.
        </div>
      </CardContent>
    </Card>
  )
}
