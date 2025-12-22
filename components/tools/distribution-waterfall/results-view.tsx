'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Info, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { WaterfallOutput, formatCurrency, formatPercent, formatMultiple } from './waterfallCalculations'
import { ExportToolbar, MobileExportBar, DisclaimerBlock, MethodologyBlock, RelatedToolsSection } from '@/components/tools/shared'
import { exportWaterfallCSV, exportWaterfallPDF } from './export'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface ResultsViewProps {
  output: WaterfallOutput
  onExport: () => void
  onCopyScenario?: () => void
}

export function ResultsView({ output, onExport, onCopyScenario }: ResultsViewProps) {
  const [showTierDetails, setShowTierDetails] = useState(true)
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleExportCSV = async () => {
    setCsvLoading(true)
    try {
      exportWaterfallCSV(output)
    } finally {
      setCsvLoading(false)
    }
  }

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      exportWaterfallPDF(output)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleCopyScenario = () => {
    if (onCopyScenario) {
      onCopyScenario()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Calculate carry amount
  const gpCarry = output.totalToGP - (output.input.contributedCapital * output.input.gpCommitmentPercent)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Distribution Summary Card - Prominent at top */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Distribution Summary</CardTitle>
              {onCopyScenario && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyScenario}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Scenario
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">LP Receives</div>
                <div className="text-4xl font-bold text-foreground">
                  {formatCurrency(output.totalToLPs / 1000000)}M
                </div>
                <div className="text-lg font-semibold text-primary">
                  {((output.totalToLPs / output.totalDistributed) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatMultiple(output.lpMultiple)} multiple
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">GP Receives</div>
                <div className="text-4xl font-bold text-foreground">
                  {formatCurrency(output.totalToGP / 1000000)}M
                </div>
                <div className="text-lg font-semibold text-primary">
                  {((output.totalToGP / output.totalDistributed) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatMultiple(output.gpMultiple)} multiple
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-muted-foreground">GP Carry</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Actual carry received may differ from stated rate due to preferred return and catch-up mechanics.
                        This represents the GP's profit share beyond their LP commitment.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-4xl font-bold text-primary">
                  {formatCurrency(gpCarry / 1000000)}M
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {formatPercent(output.effectiveCarryRate, 1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Effective carry rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

      {/* Methodology */}
      <MethodologyBlock
        sources={[
          { text: "Based on ILPA Principles 3.0 waterfall guidance" },
          { text: "Industry standard PE/VC distribution mechanics" },
          { text: "Per typical LPA distribution provisions" }
        ]}
      >
        <p className="font-medium text-foreground mb-2">Our Calculation Approach:</p>
        <ul className="space-y-1.5 ml-4 list-disc">
          <li>
            <strong>Tier 1 - Return of Capital:</strong> 100% of contributions returned to LPs (and GP as LP) until all capital is repaid.
          </li>
          <li>
            <strong>Tier 2 - Preferred Return:</strong> Additional distributions to LPs until they achieve the specified
            preferred rate of return (typically 8%), calculated using {output.input.prefCompounding} compounding over {output.input.yearsToExit} years.
          </li>
          <li>
            <strong>Tier 3 - GP Catch-Up:</strong> {output.input.hasCatchUp ? `Distributions flow to GP at ${(output.input.catchUpRate * 100).toFixed(0)}% until GP's overall
            share reaches their carried interest percentage (${(output.input.carryRate * 100).toFixed(0)}%).` : 'No catch-up provision applies.'}
          </li>
          <li>
            <strong>Tier 4 - Carried Interest:</strong> Remaining profits split {(100 - output.input.carryRate * 100).toFixed(0)}% to LPs
            and {(output.input.carryRate * 100).toFixed(0)}% to GP as ongoing carried interest.
          </li>
          <li>
            <strong>European vs American:</strong> {output.input.waterfallType === 'european' ?
              'European (whole-fund) waterfall calculates distributions across the entire fund portfolio.' :
              'American (deal-by-deal) waterfall would calculate distributions on each investment separately (not modeled here).'}
          </li>
        </ul>
      </MethodologyBlock>

      {/* Related Tools */}
      <RelatedToolsSection
        currentToolSlug="distribution-waterfall"
        relatedTools={[
          {
            slug: 'management-fee-calculator',
            title: 'Management Fee Calculator',
            description: 'Model management fee schedules across fund life, commitment period, and step-downs.',
            reason: 'Understand how management fees impact your fund economics alongside the waterfall'
          },
          {
            slug: 'subscription-credit-line',
            title: 'Subscription Credit Line Impact Visualizer',
            description: 'Show how a subscription line of credit affects IRR, MOIC, and fee drag.',
            reason: 'See how credit lines interact with your waterfall structure to boost returns'
          }
        ]}
        learningPath="Master fund economics: Fee Calculator → Waterfall → Credit Line"
      />

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Actual fund economics depend on specific LPA terms, timing of capital calls and distributions, fees, expenses, and other factors. Consult with legal and financial advisors for fund structuring."
      />

      {/* Mobile Export Bar */}
      <MobileExportBar
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        csvLoading={csvLoading}
        pdfLoading={pdfLoading}
      />
      </div>
    </TooltipProvider>
  )
}
