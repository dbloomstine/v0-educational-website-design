'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWaterfallStore, useOutput, useComparison, PRESETS } from '../store'
import { formatCurrency, formatPercent, formatMultiple, WaterfallOutput, TierResult } from '../waterfallCalculations'
import { GitCompare, X } from 'lucide-react'

// Format large numbers as millions
function formatMillions(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  return `$${(value / 1_000_000).toFixed(0)}M`
}

// Waterfall bar chart component
function WaterfallChart({ output }: { output: WaterfallOutput }) {
  const maxValue = output.totalDistributed

  return (
    <div className="space-y-2">
      {output.tiers.map((tier) => {
        const lpWidth = (tier.toLPs / maxValue) * 100
        const gpWidth = (tier.toGP / maxValue) * 100

        return (
          <div key={tier.tier} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium">{tier.name}</span>
              <span className="text-muted-foreground">{formatCurrency(tier.total)}</span>
            </div>
            <div className="h-6 bg-muted rounded-full overflow-hidden flex">
              {tier.toLPs > 0 && (
                <div
                  className="bg-blue-500 h-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${lpWidth}%` }}
                >
                  {lpWidth > 10 && 'LP'}
                </div>
              )}
              {tier.toGP > 0 && (
                <div
                  className="bg-emerald-500 h-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${gpWidth}%` }}
                >
                  {gpWidth > 10 && 'GP'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Tier breakdown table
function TierBreakdown({ tiers }: { tiers: TierResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-medium">Tier</th>
            <th className="text-right py-2 font-medium">To LPs</th>
            <th className="text-right py-2 font-medium">To GP</th>
            <th className="text-right py-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.tier} className="border-b border-border/50">
              <td className="py-2">
                <div className="font-medium">{tier.name}</div>
                <div className="text-xs text-muted-foreground">{tier.description}</div>
              </td>
              <td className="text-right py-2 text-blue-500">{formatCurrency(tier.toLPs)}</td>
              <td className="text-right py-2 text-emerald-500">{formatCurrency(tier.toGP)}</td>
              <td className="text-right py-2 font-medium">{formatCurrency(tier.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="py-2">Total</td>
            <td className="text-right py-2 text-blue-500">{formatCurrency(tiers.reduce((s, t) => s + t.toLPs, 0))}</td>
            <td className="text-right py-2 text-emerald-500">{formatCurrency(tiers.reduce((s, t) => s + t.toGP, 0))}</td>
            <td className="text-right py-2">{formatCurrency(tiers.reduce((s, t) => s + t.total, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// Input form component
function InputForm({
  isCompare = false
}: {
  isCompare?: boolean
}) {
  const input = useWaterfallStore(state => isCompare ? state.compareInput : state.input)
  const setInput = useWaterfallStore(state => isCompare ? state.setCompareInput : state.setInput)

  if (!input) return null

  return (
    <div className="space-y-4">
      {/* Fund Basics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Fund Size ($M)</Label>
          <Input
            type="number"
            value={input.fundSize / 1_000_000}
            onChange={(e) => setInput({ fundSize: Number(e.target.value) * 1_000_000 || 0 })}
            min={0}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Contributed ($M)</Label>
          <Input
            type="number"
            value={input.contributedCapital / 1_000_000}
            onChange={(e) => setInput({ contributedCapital: Number(e.target.value) * 1_000_000 || 0 })}
            min={0}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Proceeds ($M)</Label>
          <Input
            type="number"
            value={input.grossProceeds / 1_000_000}
            onChange={(e) => setInput({ grossProceeds: Number(e.target.value) * 1_000_000 || 0 })}
            min={0}
          />
        </div>
      </div>

      {/* Waterfall Structure */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Waterfall Type</Label>
          <Select
            value={input.waterfallType}
            onValueChange={(v) => setInput({ waterfallType: v as 'european' | 'american' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="european">European (Whole Fund)</SelectItem>
              <SelectItem value="american">American (Deal-by-Deal)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Pref Compounding</Label>
          <Select
            value={input.prefCompounding}
            onValueChange={(v) => setInput({ prefCompounding: v as 'simple' | 'compound' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="compound">Compound</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Economic Terms */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Pref Rate (%)</Label>
          <Input
            type="number"
            value={(input.prefRate * 100).toFixed(1)}
            onChange={(e) => setInput({ prefRate: Number(e.target.value) / 100 || 0 })}
            min={0}
            max={20}
            step={0.5}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Carry Rate (%)</Label>
          <Input
            type="number"
            value={(input.carryRate * 100).toFixed(0)}
            onChange={(e) => setInput({ carryRate: Number(e.target.value) / 100 || 0 })}
            min={0}
            max={50}
            step={1}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Years to Exit</Label>
          <Input
            type="number"
            value={input.yearsToExit}
            onChange={(e) => setInput({ yearsToExit: Number(e.target.value) || 0 })}
            min={1}
            max={15}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">GP Commit (%)</Label>
          <Input
            type="number"
            value={(input.gpCommitmentPercent * 100).toFixed(0)}
            onChange={(e) => setInput({ gpCommitmentPercent: Number(e.target.value) / 100 || 0 })}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
      </div>

      {/* Catch-up */}
      <div className="flex items-center gap-4 p-3 bg-accent/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            checked={input.hasCatchUp}
            onCheckedChange={(checked) => setInput({ hasCatchUp: checked })}
          />
          <Label className="text-sm">GP Catch-Up</Label>
        </div>
        {input.hasCatchUp && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Rate:</Label>
            <Input
              type="number"
              value={(input.catchUpRate * 100).toFixed(0)}
              onChange={(e) => setInput({ catchUpRate: Number(e.target.value) / 100 || 0 })}
              className="w-20"
              min={0}
              max={100}
              step={10}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Results summary component
function ResultsSummary({ output, compact = false }: { output: WaterfallOutput; compact?: boolean }) {
  return (
    <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 sm:grid-cols-4 gap-4"}>
      <div className={compact ? "p-2 bg-accent/30 rounded" : "p-3 bg-accent/30 rounded-lg"}>
        <p className="text-xs text-muted-foreground">LP MOIC</p>
        <p className={`font-bold ${compact ? 'text-lg' : 'text-2xl'} text-blue-500`}>
          {formatMultiple(output.lpMultiple)}
        </p>
      </div>
      <div className={compact ? "p-2 bg-accent/30 rounded" : "p-3 bg-accent/30 rounded-lg"}>
        <p className="text-xs text-muted-foreground">GP Carry</p>
        <p className={`font-bold ${compact ? 'text-lg' : 'text-2xl'} text-emerald-500`}>
          {formatMillions(output.gpProfit)}
        </p>
      </div>
      <div className={compact ? "p-2 bg-accent/30 rounded" : "p-3 bg-accent/30 rounded-lg"}>
        <p className="text-xs text-muted-foreground">Total to LPs</p>
        <p className={`font-bold ${compact ? 'text-lg' : 'text-2xl'}`}>
          {formatMillions(output.totalToLPs)}
        </p>
      </div>
      <div className={compact ? "p-2 bg-accent/30 rounded" : "p-3 bg-accent/30 rounded-lg"}>
        <p className="text-xs text-muted-foreground">Effective Carry</p>
        <p className={`font-bold ${compact ? 'text-lg' : 'text-2xl'}`}>
          {formatPercent(output.effectiveCarryRate)}
        </p>
      </div>
    </div>
  )
}

// Comparison panel
function ComparisonPanel() {
  const { compareOutput } = useComparison()
  const output = useOutput()
  const toggleComparison = useWaterfallStore(state => state.toggleComparison)

  if (!compareOutput) return null

  const delta = {
    lpMultiple: compareOutput.lpMultiple - output.lpMultiple,
    gpCarry: compareOutput.gpProfit - output.gpProfit,
    effectiveCarry: compareOutput.effectiveCarryRate - output.effectiveCarryRate
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Comparison Scenario</CardTitle>
        <Button variant="ghost" size="sm" onClick={toggleComparison}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <InputForm isCompare />

        <ResultsSummary output={compareOutput} compact />

        {/* Delta display */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">LP MOIC Change</p>
            <p className={`font-semibold ${delta.lpMultiple >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {delta.lpMultiple >= 0 ? '+' : ''}{delta.lpMultiple.toFixed(2)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">GP Carry Change</p>
            <p className={`font-semibold ${delta.gpCarry >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {delta.gpCarry >= 0 ? '+' : ''}{formatMillions(delta.gpCarry)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Eff. Carry Change</p>
            <p className={`font-semibold ${delta.effectiveCarry >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {delta.effectiveCarry >= 0 ? '+' : ''}{(delta.effectiveCarry * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CalculatorTab() {
  const output = useOutput()
  const loadPreset = useWaterfallStore(state => state.loadPreset)
  const toggleComparison = useWaterfallStore(state => state.toggleComparison)
  const { showComparison } = useComparison()

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
        <Button
          variant={showComparison ? "default" : "outline"}
          size="sm"
          onClick={toggleComparison}
          className="ml-auto"
        >
          <GitCompare className="h-4 w-4 mr-2" />
          Compare
        </Button>
      </div>

      {/* Main layout */}
      <div className={showComparison ? "grid gap-6 lg:grid-cols-2" : ""}>
        {/* Base scenario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waterfall Parameters</CardTitle>
            <CardDescription>Configure fund economics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <InputForm />
          </CardContent>
        </Card>

        {/* Comparison scenario (if enabled) */}
        {showComparison && <ComparisonPanel />}
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResultsSummary output={output} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Distribution Flow</h4>
              <WaterfallChart output={output} />
            </div>
            <div>
              <h4 className="font-medium mb-3">Tier Breakdown</h4>
              <TierBreakdown tiers={output.tiers} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
