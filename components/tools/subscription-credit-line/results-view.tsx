'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ExportToolbar, DisclaimerBlock } from '@/components/tools/shared'
import { exportSubscriptionLineCSV, exportSubscriptionLinePDF } from './export'
import {
  SubscriptionLineOutput,
  formatCurrency,
  formatPercent,
  formatBasisPoints,
  formatMultiple
} from './subscriptionLineCalculations'

interface ResultsViewProps {
  output: SubscriptionLineOutput
}

export function ResultsView({ output }: ResultsViewProps) {
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Find peak negative NAV for J-curve
  const peakNegativeNoLine = Math.min(...output.jCurveDataNoLine.map(d => d.nav))
  const peakNegativeWithLine = Math.min(...output.jCurveDataWithLine.map(d => d.nav))

  const handleExportCSV = () => {
    setCsvLoading(true)
    setTimeout(() => {
      exportSubscriptionLineCSV(output)
      setCsvLoading(false)
    }, 100)
  }

  const handleExportPDF = () => {
    setPdfLoading(true)
    setTimeout(() => {
      exportSubscriptionLinePDF(output)
      setPdfLoading(false)
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>
            How the subscription line affects fund returns (ILPA guidance: report both levered and unlevered)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IRR Comparison */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground">NET IRR</h4>
              <div className="flex items-center gap-2">
                {output.irrBoost > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : output.irrBoost < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-sm font-medium ${output.irrBoost > 0 ? 'text-green-600' : output.irrBoost < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {formatBasisPoints(output.irrBoost)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground mb-1">Without Line (Unlevered)</div>
                <div className="text-2xl font-bold">{formatPercent(output.irrNoLine, 2)}</div>
              </div>
              <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
                <div className="text-xs text-muted-foreground mb-1">With Line (Levered)</div>
                <div className="text-2xl font-bold text-primary">{formatPercent(output.irrWithLine, 2)}</div>
              </div>
            </div>
          </div>

          {/* MOIC Comparison */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground">NET MOIC</h4>
              <span className={`text-sm font-medium ${output.moicDrag > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {output.moicDrag > 0 ? '-' : '+'}{Math.abs(output.moicDrag).toFixed(2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground mb-1">Without Line</div>
                <div className="text-2xl font-bold">{formatMultiple(output.moicNoLine)}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground mb-1">With Line</div>
                <div className="text-2xl font-bold">{formatMultiple(output.moicWithLine)}</div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-semibold mb-3">Cost Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Interest Paid:</span>
                <span className="font-medium">{formatCurrency(output.totalInterestPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Management Fees:</span>
                <span className="font-medium">{formatCurrency(output.totalManagementFees)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Combined Fee Drag:</span>
                <span className="font-medium">{output.feeDrag.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* J-Curve Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>J-Curve Comparison</CardTitle>
          <CardDescription>
            Cumulative net cash flows over fund life (shows how subscription lines flatten the J-curve)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chart */}
            <div className="relative h-64 w-full">
              <JCurveChart
                dataNoLine={output.jCurveDataNoLine}
                dataWithLine={output.jCurveDataWithLine}
              />
            </div>

            {/* Legend and Key Metrics */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Without Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">With Line</span>
                </div>
              </div>
            </div>

            {/* J-Curve Insights */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="text-sm font-semibold mb-2">J-Curve Impact</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Peak negative NAV <strong>without line:</strong> {formatCurrency(peakNegativeNoLine)}
                </p>
                <p>
                  Peak negative NAV <strong>with line:</strong> {formatCurrency(peakNegativeWithLine)}
                </p>
                <p>
                  The subscription line {peakNegativeWithLine > peakNegativeNoLine ? 'reduces' : 'increases'} the depth of the J-curve by{' '}
                  {formatCurrency(Math.abs(peakNegativeWithLine - peakNegativeNoLine))}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Capital Call and Distribution Timeline</CardTitle>
          <CardDescription>
            Year-by-year cash flows showing when LPs are called vs. when distributions occur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline visualization */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Year</th>
                    <th className="text-right py-2 font-medium">Capital Calls (No Line)</th>
                    <th className="text-right py-2 font-medium">Capital Calls (With Line)</th>
                    <th className="text-right py-2 font-medium">Distributions</th>
                    <th className="text-right py-2 font-medium">Interest Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {output.cashFlows.slice(0, 10).map((cf) => (
                    <tr key={cf.year} className="border-b border-border/50">
                      <td className="py-2">{cf.year}</td>
                      <td className="text-right text-red-600">
                        {cf.capitalCallsNoLine > 0 ? `(${formatCurrency(cf.capitalCallsNoLine)})` : '-'}
                      </td>
                      <td className="text-right text-red-600">
                        {cf.capitalCallsWithLine > 0 ? `(${formatCurrency(cf.capitalCallsWithLine)})` : '-'}
                      </td>
                      <td className="text-right text-green-600">
                        {cf.distributionsWithLine > 0 ? formatCurrency(cf.distributionsWithLine) : '-'}
                      </td>
                      <td className="text-right text-orange-600">
                        {cf.interestPaid > 0 ? `(${formatCurrency(cf.interestPaid)})` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-1">Total Capital Called (No Line)</div>
                <div className="text-lg font-bold">{formatCurrency(output.cashFlows[output.cashFlows.length - 1]?.cumulativeCalledNoLine || 0)}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-1">Total Capital Called (With Line)</div>
                <div className="text-lg font-bold">{formatCurrency(output.cashFlows[output.cashFlows.length - 1]?.cumulativeCalledWithLine || 0)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>IRR Impact:</strong> The subscription line {output.irrBoost > 0 ? 'boosts' : 'reduces'} IRR by{' '}
            {formatBasisPoints(output.irrBoost)}. This is because it delays capital calls from LPs, shortening the
            effective investment period. Per ILPA guidance, this impact is greatest early in fund life and
            diminishes over time.
          </div>
          <div>
            <strong>MOIC Impact:</strong> The net multiple is reduced by {output.moicDrag.toFixed(2)}% due to
            interest expense of {formatCurrency(output.totalInterestPaid)}. The short-term IRR boost comes at the
            expense of long-term TVPI.
          </div>
          <div>
            <strong>J-Curve Effect:</strong> The subscription line {peakNegativeWithLine > peakNegativeNoLine ? 'flattens' : 'deepens'} the
            J-curve, reducing the maximum negative NAV from {formatCurrency(peakNegativeNoLine)} to{' '}
            {formatCurrency(peakNegativeWithLine)}.
          </div>
          <div className="pt-2 border-t border-primary/20">
            <strong>Transparency Note:</strong> Per ILPA guidance, funds should report both levered (with line) and
            unlevered (without line) IRR to allow LPs to assess true performance and compare across funds with
            different credit facility usage.
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="font-medium mb-1">Export Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Download a comprehensive report with all metrics and explanations
              </p>
            </div>
            <ExportToolbar
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              csvLoading={csvLoading}
              pdfLoading={pdfLoading}
              compact
            />
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Actual fund economics depend on specific investment timing, performance, fee structures, facility terms, and many other factors. Per ILPA guidance, funds should report both levered and unlevered returns. Consult legal and financial advisors for fund structuring and analysis."
      />
    </div>
  )
}

/**
 * Simple J-Curve chart component using SVG
 */
function JCurveChart({
  dataNoLine,
  dataWithLine
}: {
  dataNoLine: { year: number; nav: number }[]
  dataWithLine: { year: number; nav: number }[]
}) {
  const width = 800
  const height = 256
  const padding = 40

  // Find min and max values for scaling
  const allValues = [...dataNoLine.map(d => d.nav), ...dataWithLine.map(d => d.nav)]
  const minValue = Math.min(...allValues, 0)
  const maxValue = Math.max(...allValues)

  const maxYear = Math.max(...dataNoLine.map(d => d.year))

  // Scaling functions
  const xScale = (year: number) => padding + ((year / maxYear) * (width - 2 * padding))
  const yScale = (value: number) => {
    const range = maxValue - minValue
    const normalized = (value - minValue) / range
    return height - padding - (normalized * (height - 2 * padding))
  }

  // Generate path strings
  const pathNoLine = dataNoLine.map((d, i) => {
    const x = xScale(d.year)
    const y = yScale(d.nav)
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  }).join(' ')

  const pathWithLine = dataWithLine.map((d, i) => {
    const x = xScale(d.year)
    const y = yScale(d.nav)
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  }).join(' ')

  // Zero line
  const zeroY = yScale(0)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="text-foreground">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding + ratio * (height - 2 * padding)
        const value = maxValue - ratio * (maxValue - minValue)
        return (
          <g key={ratio}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <text
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >
              {formatCurrency(value / 1000000)}M
            </text>
          </g>
        )
      })}

      {/* Zero line (emphasized) */}
      <line
        x1={padding}
        y1={zeroY}
        x2={width - padding}
        y2={zeroY}
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      {/* Paths */}
      <path
        d={pathNoLine}
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathWithLine}
        fill="none"
        stroke="rgb(var(--primary))"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* X-axis labels */}
      {dataNoLine.filter((_, i) => i % 2 === 0).map((d) => (
        <text
          key={d.year}
          x={xScale(d.year)}
          y={height - padding + 20}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
          opacity={0.5}
        >
          Year {d.year}
        </text>
      ))}
    </svg>
  )
}
