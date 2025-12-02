'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { WaterfallOutput, formatCurrency, formatPercent, formatMultiple } from './waterfallCalculations'
import { ExportToolbar, DisclaimerBlock } from '@/components/tools/shared'
import { exportWaterfallCSV, exportWaterfallPDF } from './export'

interface ResultsViewProps {
  output: WaterfallOutput
  onExport: () => void
}

export function ResultsView({ output, onExport }: ResultsViewProps) {
  const [showTierDetails, setShowTierDetails] = useState(true)
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleExportCSV = () => {
    setCsvLoading(true)
    setTimeout(() => {
      exportWaterfallCSV(output)
      setCsvLoading(false)
    }, 100)
  }

  const handleExportPDF = () => {
    setPdfLoading(true)
    setTimeout(() => {
      exportWaterfallPDF(output)
      setPdfLoading(false)
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Total to LPs</div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(output.totalToLPs)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatMultiple(output.lpMultiple)} multiple
          </div>
        </Card>
        <Card className="border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Total to GP</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(output.totalToGP)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatMultiple(output.gpMultiple)} multiple
          </div>
        </Card>
        <Card className="border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Effective Carry</div>
          <div className="text-2xl font-bold text-foreground">{formatPercent(output.effectiveCarryRate, 1)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            GP share of profits
          </div>
        </Card>
      </div>

      {/* Waterfall Visualization */}
      <Card className="border-border bg-card p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Distribution Waterfall</h3>
          <p className="text-sm text-muted-foreground">
            How {formatCurrency(output.input.grossProceeds)} in proceeds flows through the waterfall
          </p>
        </div>

        {/* Stacked Bar Visualization */}
        <div className="mb-6">
          <div className="relative h-24 w-full rounded-lg bg-muted/30 overflow-hidden">
            {output.tiers.map((tier, index) => {
              const percentage = (tier.total / output.totalDistributed) * 100
              const leftOffset = output.tiers
                .slice(0, index)
                .reduce((sum, t) => sum + (t.total / output.totalDistributed) * 100, 0)

              const colors = [
                'bg-blue-400',
                'bg-green-400',
                'bg-purple-400',
                'bg-amber-400'
              ]

              return (
                <div
                  key={tier.tier}
                  className={`absolute top-0 h-full ${colors[index % colors.length]} flex items-center justify-center text-xs font-medium text-white`}
                  style={{
                    left: `${leftOffset}%`,
                    width: `${percentage}%`
                  }}
                  title={`${tier.name}: ${formatCurrency(tier.total)} (${percentage.toFixed(1)}%)`}
                >
                  {percentage > 5 && (
                    <span className="truncate px-2">{tier.name.split(' ')[0]}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {output.tiers.map((tier, index) => {
              const colors = [
                'bg-blue-400',
                'bg-green-400',
                'bg-purple-400',
                'bg-amber-400'
              ]
              return (
                <div key={tier.tier} className="flex items-center gap-2 text-xs">
                  <div className={`h-3 w-3 rounded ${colors[index % colors.length]}`} />
                  <span className="text-muted-foreground">{tier.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* LP vs GP Bar Chart */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">LP vs GP Split</div>
          <div className="flex gap-2 h-8">
            <div
              className="bg-blue-500 rounded-l flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(output.totalToLPs / output.totalDistributed) * 100}%` }}
            >
              {((output.totalToLPs / output.totalDistributed) * 100).toFixed(1)}% LP
            </div>
            <div
              className="bg-primary rounded-r flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${(output.totalToGP / output.totalDistributed) * 100}%` }}
            >
              {((output.totalToGP / output.totalDistributed) * 100).toFixed(1)}% GP
            </div>
          </div>
        </div>
      </Card>

      {/* Tier-by-Tier Breakdown */}
      <Card className="border-border bg-card p-6">
        <button
          onClick={() => setShowTierDetails(!showTierDetails)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-foreground">Tier-by-Tier Breakdown</h3>
          {showTierDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showTierDetails && (
          <div className="mt-4 space-y-3">
            {output.tiers.map((tier) => (
              <div key={tier.tier} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Tier {tier.tier}: {tier.name}</div>
                    <div className="text-sm text-muted-foreground">{tier.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{formatCurrency(tier.total)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercent(tier.total / output.totalDistributed, 1)} of total
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">To LPs</div>
                    <div className="font-medium">{formatCurrency(tier.toLPs)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">To GP</div>
                    <div className="font-medium">{formatCurrency(tier.toGP)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cumulative Total</div>
                    <div className="font-medium">{formatCurrency(tier.cumulativeTotal)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Summary Table */}
      <Card className="border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Summary Metrics</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
            <div className="text-sm text-muted-foreground">Gross Proceeds</div>
            <div className="text-sm font-medium text-foreground text-right">{formatCurrency(output.input.grossProceeds)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
            <div className="text-sm text-muted-foreground">Contributed Capital</div>
            <div className="text-sm font-medium text-foreground text-right">{formatCurrency(output.input.contributedCapital)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
            <div className="text-sm text-muted-foreground">Total Profit</div>
            <div className="text-sm font-medium text-foreground text-right">{formatCurrency(output.totalProfit)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
            <div className="text-sm text-muted-foreground">LP Distributions</div>
            <div className="text-sm font-medium text-foreground text-right">{formatCurrency(output.totalToLPs)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
            <div className="text-sm text-muted-foreground">GP Distributions</div>
            <div className="text-sm font-medium text-primary text-right">{formatCurrency(output.totalToGP)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
            <div className="text-sm text-muted-foreground">LP Multiple (MOIC)</div>
            <div className="text-sm font-medium text-foreground text-right">{formatMultiple(output.lpMultiple)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
            <div className="text-sm text-muted-foreground">GP Multiple (MOIC)</div>
            <div className="text-sm font-medium text-foreground text-right">{formatMultiple(output.gpMultiple)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div className="text-sm text-muted-foreground">Effective Carry Rate</div>
            <div className="text-sm font-medium text-primary text-right">{formatPercent(output.effectiveCarryRate, 2)}</div>
          </div>
        </div>
      </Card>

      {/* Export Section */}
      <Card className="border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Export Results</h3>
        <ExportToolbar
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          csvLoading={csvLoading}
          pdfLoading={pdfLoading}
        />
      </Card>

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Actual fund economics depend on specific LPA terms, timing of capital calls and distributions, fees, expenses, and other factors. Consult with legal and financial advisors for fund structuring."
      />
    </div>
  )
}
