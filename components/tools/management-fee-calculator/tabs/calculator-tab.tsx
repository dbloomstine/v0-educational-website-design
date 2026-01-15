'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFeeCalcStore, useResults, useFundInputs, useFeePhases, PRESETS } from '../store'
import { FeeBase, FundType } from '../types'
import { Plus, Trash2 } from 'lucide-react'

// Format currency
function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}M`
}

// Fee schedule timeline visualization
function FeeTimeline() {
  const feePhases = useFeePhases()
  const fundInputs = useFundInputs()

  const totalYears = fundInputs.fundTerm

  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded overflow-hidden">
        {feePhases.map((phase, index) => {
          const width = ((phase.endYear - phase.startYear + 1) / totalYears) * 100
          const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500']
          return (
            <div
              key={phase.id}
              className={`${colors[index % colors.length]} flex items-center justify-center text-xs text-white font-medium`}
              style={{ width: `${width}%` }}
            >
              {phase.feeRate}%
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Year 1</span>
        <span>Year {Math.ceil(totalYears / 2)}</span>
        <span>Year {totalYears}</span>
      </div>
    </div>
  )
}

// Cumulative fees chart
function CumulativeFeesChart() {
  const results = useResults()

  const maxFees = results.totalFees
  const data = results.yearlyData

  return (
    <div className="h-48">
      <div className="flex h-full items-end gap-1">
        {data.map((year) => {
          const height = maxFees > 0 ? (year.cumulativeFees / maxFees) * 100 : 0
          return (
            <div
              key={year.year}
              className="flex-1 bg-blue-500/80 hover:bg-blue-500 transition-colors rounded-t"
              style={{ height: `${height}%` }}
              title={`Year ${year.year}: ${formatCurrency(year.cumulativeFees)} cumulative`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Year 1</span>
        <span>Year {data.length}</span>
      </div>
    </div>
  )
}

// Fund inputs form
function FundInputsForm() {
  const fundInputs = useFundInputs()
  const setFundInputs = useFeeCalcStore(state => state.setFundInputs)

  const fundTypes: FundType[] = ['Private Equity', 'Venture Capital', 'Private Credit', 'Real Estate', 'Hedge Fund', 'Other']

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Fund Type</Label>
          <Select
            value={fundInputs.fundType}
            onValueChange={(v) => setFundInputs({ fundType: v as FundType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fundTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Fund Size ($M)</Label>
          <Input
            type="number"
            value={fundInputs.fundSize}
            onChange={(e) => setFundInputs({ fundSize: Number(e.target.value) || 0 })}
            min={0}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Fund Term (years)</Label>
          <Input
            type="number"
            value={fundInputs.fundTerm}
            onChange={(e) => setFundInputs({ fundTerm: Number(e.target.value) || 0 })}
            min={1}
            max={20}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Investment Period (years)</Label>
          <Input
            type="number"
            value={fundInputs.investmentPeriod}
            onChange={(e) => setFundInputs({ investmentPeriod: Number(e.target.value) || 0 })}
            min={1}
            max={fundInputs.fundTerm}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">NAV Growth Rate (%)</Label>
          <Input
            type="number"
            value={fundInputs.navGrowthRate || 0}
            onChange={(e) => setFundInputs({ navGrowthRate: Number(e.target.value) || 0 })}
            min={-20}
            max={50}
          />
        </div>
      </div>
    </div>
  )
}

// Fee phases editor
function FeePhasesEditor() {
  const feePhases = useFeePhases()
  const fundInputs = useFundInputs()
  const addPhase = useFeeCalcStore(state => state.addPhase)
  const updatePhase = useFeeCalcStore(state => state.updatePhase)
  const removePhase = useFeeCalcStore(state => state.removePhase)

  const feeBases: FeeBase[] = ['Committed Capital', 'Invested Cost', 'Net Asset Value (NAV)', 'Lower of Cost or Fair Value']

  return (
    <div className="space-y-3">
      {feePhases.map((phase, index) => (
        <div key={phase.id} className="flex items-end gap-2 p-3 bg-accent/30 rounded-lg">
          <div className="flex-1 grid gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Start Year</Label>
              <Input
                type="number"
                value={phase.startYear}
                onChange={(e) => updatePhase(phase.id, { startYear: Number(e.target.value) || 1 })}
                min={1}
                max={fundInputs.fundTerm}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Year</Label>
              <Input
                type="number"
                value={phase.endYear}
                onChange={(e) => updatePhase(phase.id, { endYear: Number(e.target.value) || 1 })}
                min={phase.startYear}
                max={fundInputs.fundTerm}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fee Base</Label>
              <Select
                value={phase.feeBase}
                onValueChange={(v) => updatePhase(phase.id, { feeBase: v as FeeBase })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {feeBases.map(base => (
                    <SelectItem key={base} value={base}>{base}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fee Rate (%)</Label>
              <Input
                type="number"
                value={phase.feeRate}
                onChange={(e) => updatePhase(phase.id, { feeRate: Number(e.target.value) || 0 })}
                min={0}
                max={5}
                step={0.25}
              />
            </div>
          </div>
          {feePhases.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removePhase(phase.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addPhase}>
        <Plus className="h-4 w-4 mr-2" />
        Add Phase
      </Button>
    </div>
  )
}

// Results table
function ResultsTable() {
  const results = useResults()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-medium">Year</th>
            <th className="text-left py-2 font-medium">Fee Base</th>
            <th className="text-right py-2 font-medium">Base Amount</th>
            <th className="text-right py-2 font-medium">Rate</th>
            <th className="text-right py-2 font-medium">Fee</th>
            <th className="text-right py-2 font-medium">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {results.yearlyData.map((year) => (
            <tr key={year.year} className="border-b border-border/50">
              <td className="py-2">{year.year}</td>
              <td className="py-2 text-muted-foreground">{year.feeBase}</td>
              <td className="text-right py-2">{formatCurrency(year.baseAmount)}</td>
              <td className="text-right py-2">{year.feeRate.toFixed(2)}%</td>
              <td className="text-right py-2 text-blue-500">{formatCurrency(year.feeAmount)}</td>
              <td className="text-right py-2 font-medium">{formatCurrency(year.cumulativeFees)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CalculatorTab() {
  const loadPreset = useFeeCalcStore(state => state.loadPreset)
  const results = useResults()

  return (
    <div className="space-y-6">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            onClick={() => loadPreset(key as keyof typeof PRESETS)}
          >
            {preset.name}
          </Button>
        ))}
      </div>

      {/* Fund Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fund Configuration</CardTitle>
          <CardDescription>Basic fund parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <FundInputsForm />
        </CardContent>
      </Card>

      {/* Fee Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fee Schedule</CardTitle>
          <CardDescription>Define fee phases across fund life</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeeTimeline />
          <FeePhasesEditor />
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-accent/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Fees</p>
              <p className="text-2xl font-bold text-blue-500">{formatCurrency(results.totalFees)}</p>
            </div>
            <div className="p-3 bg-accent/30 rounded-lg">
              <p className="text-xs text-muted-foreground">% of Commitments</p>
              <p className="text-2xl font-bold">{results.feesAsPercentOfCommitments.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-accent/30 rounded-lg">
              <p className="text-xs text-muted-foreground">First Half</p>
              <p className="text-2xl font-bold">{formatCurrency(results.firstHalfFees)}</p>
            </div>
            <div className="p-3 bg-accent/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Second Half</p>
              <p className="text-2xl font-bold">{formatCurrency(results.secondHalfFees)}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Cumulative Fees Over Time</h4>
              <CumulativeFeesChart />
            </div>
            <div>
              <h4 className="font-medium mb-3">Yearly Breakdown</h4>
              <div className="max-h-64 overflow-y-auto">
                <ResultsTable />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
