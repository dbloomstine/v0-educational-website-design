'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useBudgetStore } from '../store'
import { calculateBudget, formatCurrency, formatRunway } from '../budget-calculator'
import { BudgetData } from '../types'
import { Activity, Save, Trash2, ArrowRight, AlertTriangle } from 'lucide-react'

function SensitivityAnalysis() {
  const data = useBudgetStore(state => state.data)
  const baseResults = useBudgetStore(state => state.results)

  const [adjustments, setAdjustments] = useState({
    fundSize: 0, // -30 to +30 percent
    feeRate: 0, // -1 to +1 percentage points
    burnRate: 0 // -30 to +30 percent
  })

  const adjustedResults = useMemo(() => {
    // Apply adjustments to data
    const adjustedData: BudgetData = {
      ...data,
      funds: data.funds.map(f => ({
        ...f,
        size: f.size * (1 + adjustments.fundSize / 100),
        feeRate: Math.max(0.5, Math.min(5, f.feeRate + adjustments.feeRate))
      })),
      expenses: {
        team: data.expenses.team.map(t => ({
          ...t,
          monthlyCost: t.monthlyCost * (1 + adjustments.burnRate / 100)
        })),
        operations: data.expenses.operations.map(o => ({
          ...o,
          monthlyCost: o.monthlyCost * (1 + adjustments.burnRate / 100)
        })),
        overhead: data.expenses.overhead.map(o => ({
          ...o,
          monthlyCost: o.monthlyCost * (1 + adjustments.burnRate / 100)
        }))
      }
    }
    return calculateBudget(adjustedData)
  }, [data, adjustments])

  const runwayDelta = useMemo(() => {
    if (!baseResults || !adjustedResults) return null
    const base = baseResults.runwayMonths ?? 60
    const adjusted = adjustedResults.runwayMonths ?? 60
    return adjusted - base
  }, [baseResults, adjustedResults])

  const isWarning = adjustedResults?.runwayMonths !== null && adjustedResults.runwayMonths < 12

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Sensitivity Analysis
        </CardTitle>
        <CardDescription>
          See how changes affect your runway
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Fund Size</Label>
              <span className="text-sm text-muted-foreground">
                {adjustments.fundSize > 0 ? '+' : ''}{adjustments.fundSize}%
              </span>
            </div>
            <Slider
              value={[adjustments.fundSize]}
              onValueChange={([v]) => setAdjustments(a => ({ ...a, fundSize: v }))}
              min={-30}
              max={30}
              step={5}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Fee Rate</Label>
              <span className="text-sm text-muted-foreground">
                {adjustments.feeRate > 0 ? '+' : ''}{adjustments.feeRate.toFixed(2)}%
              </span>
            </div>
            <Slider
              value={[adjustments.feeRate]}
              onValueChange={([v]) => setAdjustments(a => ({ ...a, feeRate: v }))}
              min={-0.5}
              max={0.5}
              step={0.1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Burn Rate</Label>
              <span className="text-sm text-muted-foreground">
                {adjustments.burnRate > 0 ? '+' : ''}{adjustments.burnRate}%
              </span>
            </div>
            <Slider
              value={[adjustments.burnRate]}
              onValueChange={([v]) => setAdjustments(a => ({ ...a, burnRate: v }))}
              min={-30}
              max={30}
              step={5}
            />
          </div>
        </div>

        {/* Results */}
        <div className={`p-4 rounded-lg ${isWarning ? 'bg-red-500/10 border border-red-500/30' : 'bg-accent/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Adjusted Runway</p>
              <p className={`text-2xl font-bold ${isWarning ? 'text-red-500' : ''}`}>
                {formatRunway(adjustedResults?.runwayMonths ?? null)}
              </p>
            </div>
            {runwayDelta !== null && runwayDelta !== 0 && (
              <div className={`text-right ${runwayDelta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <p className="text-sm">Change</p>
                <p className="text-lg font-semibold">
                  {runwayDelta > 0 ? '+' : ''}{runwayDelta} months
                </p>
              </div>
            )}
          </div>
          {isWarning && (
            <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Runway below 12 months - consider adjustments
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setAdjustments({ fundSize: 0, feeRate: 0, burnRate: 0 })}
        >
          Reset to Base Case
        </Button>
      </CardContent>
    </Card>
  )
}

function ScenarioComparison() {
  const savedScenarios = useBudgetStore(state => state.savedScenarios)
  const saveScenario = useBudgetStore(state => state.saveScenario)
  const loadScenario = useBudgetStore(state => state.loadScenario)
  const deleteScenario = useBudgetStore(state => state.deleteScenario)
  const results = useBudgetStore(state => state.results)

  const [scenarioName, setScenarioName] = useState('')

  const handleSave = () => {
    if (!scenarioName.trim()) return
    saveScenario(scenarioName.trim())
    setScenarioName('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Saved Scenarios</CardTitle>
        <CardDescription>
          Save and compare different budget configurations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current state summary */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium">Current Scenario</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Burn:</span>{' '}
              {formatCurrency(results?.monthlyBurn ?? 0, true)}/mo
            </div>
            <div>
              <span className="text-muted-foreground">Runway:</span>{' '}
              {formatRunway(results?.runwayMonths ?? null)}
            </div>
          </div>
        </div>

        {/* Save new scenario */}
        <div className="flex gap-2">
          <Input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Scenario name"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button onClick={handleSave} disabled={!scenarioName.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        {/* Saved scenarios list */}
        {savedScenarios.length > 0 ? (
          <div className="space-y-2">
            {savedScenarios.map((scenario) => {
              const scenarioResults = calculateBudget(scenario.data)
              return (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(scenarioResults.monthlyBurn, true)}/mo •{' '}
                      {formatRunway(scenarioResults.runwayMonths)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadScenario(scenario.id)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScenario(scenario.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved scenarios yet. Save your first scenario above.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function BenchmarkComparison() {
  const results = useBudgetStore(state => state.results)
  const data = useBudgetStore(state => state.data)

  const totalFundSize = data.funds.reduce((sum, f) => sum + f.size, 0)

  // Industry benchmarks by fund size tier
  const getBenchmarks = (): {
    tier: string
    burnPerMillion: { median: number; range: readonly [number, number] }
    teamPercent: { median: number; range: readonly [number, number] }
    runway: { median: number; range: readonly [number, number] }
  } => {
    if (totalFundSize < 100) {
      return {
        tier: 'Small (<$100M)',
        burnPerMillion: { median: 1200, range: [800, 1600] as const },
        teamPercent: { median: 55, range: [45, 65] as const },
        runway: { median: 24, range: [18, 36] as const }
      }
    } else if (totalFundSize < 500) {
      return {
        tier: 'Medium ($100M-$500M)',
        burnPerMillion: { median: 800, range: [500, 1100] as const },
        teamPercent: { median: 50, range: [40, 60] as const },
        runway: { median: 30, range: [24, 48] as const }
      }
    } else {
      return {
        tier: 'Large (>$500M)',
        burnPerMillion: { median: 500, range: [300, 700] as const },
        teamPercent: { median: 45, range: [35, 55] as const },
        runway: { median: 36, range: [30, 60] as const }
      }
    }
  }

  const benchmarks = getBenchmarks()
  const userBurnPerMillion = totalFundSize > 0 ? results?.monthlyBurn ?? 0 / totalFundSize : 0
  const userTeamPercent = results ? (results.teamCost / results.monthlyBurn) * 100 : 0
  const userRunway = results?.runwayMonths ?? 60

  const getStatusColor = (value: number, benchmark: { median: number; range: readonly [number, number] }) => {
    if (value >= benchmark.range[0] && value <= benchmark.range[1]) return 'text-emerald-500'
    return 'text-amber-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Industry Benchmarks</CardTitle>
        <CardDescription>
          How you compare to peers ({benchmarks.tier})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Burn / $M AUM</p>
              <p className="font-medium">{formatCurrency(userBurnPerMillion, true)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Peer Median</p>
              <p className={getStatusColor(userBurnPerMillion, benchmarks.burnPerMillion)}>
                {formatCurrency(benchmarks.burnPerMillion.median, true)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Team % of Budget</p>
              <p className="font-medium">{userTeamPercent.toFixed(0)}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Peer Median</p>
              <p className={getStatusColor(userTeamPercent, benchmarks.teamPercent)}>
                {benchmarks.teamPercent.median}%
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Runway</p>
              <p className="font-medium">{formatRunway(userRunway)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Peer Median</p>
              <p className={getStatusColor(userRunway, benchmarks.runway)}>
                {benchmarks.runway.median} months
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Benchmarks based on industry surveys. Your results may vary based on strategy and geography.
        </p>
      </CardContent>
    </Card>
  )
}

export function AnalysisTab() {
  return (
    <div className="space-y-6">
      <SensitivityAnalysis />
      <div className="grid gap-6 lg:grid-cols-2">
        <ScenarioComparison />
        <BenchmarkComparison />
      </div>
    </div>
  )
}
