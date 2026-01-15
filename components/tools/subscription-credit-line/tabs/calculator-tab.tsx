'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { InfoPopover } from '@/components/ui/info-popover'
import { useSubscriptionLineStore, useInput, useResults, PRESETS } from '../store'
import {
  formatCurrency,
  formatPercent,
  formatBasisPoints,
  formatMultiple,
  SubscriptionLineInput
} from '../subscriptionLineCalculations'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Fund inputs form
function FundInputsForm() {
  const input = useInput()
  const setInput = useSubscriptionLineStore((state) => state.setInput)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Fund Size</Label>
            <InfoPopover>
              Total committed capital to the fund. This is the maximum amount LPs have agreed to invest.
            </InfoPopover>
          </div>
          <Input
            type="number"
            value={input.fundSize}
            onChange={(e) => setInput({ fundSize: parseFloat(e.target.value) || 0 })}
            min={0}
          />
          <p className="text-xs text-muted-foreground">
            ${(input.fundSize / 1000000).toFixed(0)}M
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Gross MOIC (Multiple)</Label>
            <InfoPopover>
              Gross multiple on invested capital before fees. E.g., 2.5x means $100M invested returns $250M gross.
            </InfoPopover>
          </div>
          <Input
            type="number"
            step="0.1"
            value={input.grossMOIC}
            onChange={(e) => setInput({ grossMOIC: parseFloat(e.target.value) || 0 })}
            min={0}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Investment Period (Years)</Label>
            <InfoPopover>
              The period during which the fund makes new investments, typically 4-6 years for PE/VC funds.
            </InfoPopover>
          </div>
          <Input
            type="number"
            value={input.investmentPeriodYears}
            onChange={(e) => setInput({ investmentPeriodYears: parseInt(e.target.value) || 0 })}
            min={1}
            max={10}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Total Fund Term (Years)</Label>
            <InfoPopover>
              Total fund life including investment period and harvest period, typically 10-12 years for PE funds.
            </InfoPopover>
          </div>
          <Input
            type="number"
            value={input.fundTermYears}
            onChange={(e) => setInput({ fundTermYears: parseInt(e.target.value) || 0 })}
            min={5}
            max={15}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Management Fee (%)</Label>
            <InfoPopover>
              Annual management fee as a percentage, typically 1.5-2.0% for PE funds.
            </InfoPopover>
          </div>
          <Input
            type="number"
            step="0.1"
            value={input.managementFeeRate * 100}
            onChange={(e) => setInput({ managementFeeRate: (parseFloat(e.target.value) || 0) / 100 })}
            min={0}
            max={5}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Deployment Pace</Label>
            <InfoPopover>
              How capital is deployed over the investment period. Front-loaded is typical for PE (35% year 1, 30% year 2, etc.).
            </InfoPopover>
          </div>
          <Select
            value={input.deploymentPaceType}
            onValueChange={(v) => setInput({ deploymentPaceType: v as SubscriptionLineInput['deploymentPaceType'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear (Equal each year)</SelectItem>
              <SelectItem value="front-loaded">Front-Loaded (Typical PE)</SelectItem>
              <SelectItem value="back-loaded">Back-Loaded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Realization Schedule</Label>
            <InfoPopover>
              When investments are realized and distributions occur. J-curve is typical.
            </InfoPopover>
          </div>
          <Select
            value={input.realizationScheduleType}
            onValueChange={(v) => setInput({ realizationScheduleType: v as SubscriptionLineInput['realizationScheduleType'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="j-curve">J-Curve (Typical PE)</SelectItem>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="back-loaded">Back-Loaded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// Subscription line settings form
function SubscriptionLineSettings() {
  const input = useInput()
  const setInput = useSubscriptionLineStore((state) => state.setInput)

  const facilitySizePct = input.facilitySize * 100
  const isFacilitySizeCompliant = facilitySizePct >= 15 && facilitySizePct <= 25
  const isDaysCompliant = input.maxDaysOutstanding <= 180

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="useLine"
          checked={input.useLine}
          onCheckedChange={(checked) => setInput({ useLine: checked === true })}
        />
        <Label htmlFor="useLine" className="text-sm font-normal cursor-pointer">
          Use subscription line of credit
        </Label>
      </div>

      {input.useLine && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs">Facility Size (% of Commitments)</Label>
                <InfoPopover>
                  Size of credit facility as % of total commitments. ILPA recommends maximum 15-25%.
                </InfoPopover>
                <Badge
                  variant={isFacilitySizeCompliant ? "default" : "secondary"}
                  className={isFacilitySizeCompliant ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
                >
                  {isFacilitySizeCompliant ? "Within ILPA guidance" : "Outside ILPA guidance"}
                </Badge>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={input.facilitySize * 100}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const clamped = Math.max(0, Math.min(100, value))
                  setInput({ facilitySize: clamped / 100 })
                }}
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(input.fundSize * input.facilitySize)} facility
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Interest Rate (%)</Label>
                <InfoPopover>
                  Annual interest rate on the subscription line. Typical range is 3-6% (2024-2025).
                </InfoPopover>
              </div>
              <Input
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={input.interestRate * 100}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const clamped = Math.max(0, Math.min(20, value))
                  setInput({ interestRate: clamped / 100 })
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs">Maximum Days Outstanding</Label>
                <InfoPopover>
                  How long draws can remain outstanding before repayment. ILPA recommends maximum 180 days.
                </InfoPopover>
                <Badge
                  variant={isDaysCompliant ? "default" : "secondary"}
                  className={isDaysCompliant ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
                >
                  {isDaysCompliant ? "Within ILPA guidance" : "Exceeds ILPA guidance"}
                </Badge>
              </div>
              <Input
                type="number"
                min={0}
                max={365}
                value={input.maxDaysOutstanding}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  const clamped = Math.max(0, Math.min(365, value))
                  setInput({ maxDaysOutstanding: clamped })
                }}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Repayment Trigger</Label>
                <InfoPopover>
                  When the line is repaid. Automatic = repaid after max days via capital call. Distribution-funded = repaid from portfolio exits.
                </InfoPopover>
              </div>
              <Select
                value={input.repaymentTrigger}
                onValueChange={(v) => setInput({ repaymentTrigger: v as SubscriptionLineInput['repaymentTrigger'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic (Time-Based)</SelectItem>
                  <SelectItem value="distribution-funded">Distribution-Funded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// J-Curve chart component
function JCurveChart() {
  const results = useResults()
  const { jCurveDataNoLine, jCurveDataWithLine } = results

  const width = 800
  const height = 200
  const padding = 40

  const allValues = [...jCurveDataNoLine.map((d) => d.nav), ...jCurveDataWithLine.map((d) => d.nav)]
  const minValue = Math.min(...allValues, 0)
  const maxValue = Math.max(...allValues)
  const maxYear = Math.max(...jCurveDataNoLine.map((d) => d.year))

  const xScale = (year: number) => padding + (year / maxYear) * (width - 2 * padding)
  const yScale = (value: number) => {
    const range = maxValue - minValue
    const normalized = (value - minValue) / range
    return height - padding - normalized * (height - 2 * padding)
  }

  const pathNoLine = jCurveDataNoLine
    .map((d, i) => {
      const x = xScale(d.year)
      const y = yScale(d.nav)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')

  const pathWithLine = jCurveDataWithLine
    .map((d, i) => {
      const x = xScale(d.year)
      const y = yScale(d.nav)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')

  const zeroY = yScale(0)

  return (
    <div className="space-y-4">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="text-foreground">
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => {
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
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.5}>
                {formatCurrency(value / 1000000)}M
              </text>
            </g>
          )
        })}

        {/* Zero line */}
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
          stroke="rgb(34, 197, 94)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels */}
        {jCurveDataNoLine
          .filter((_, i) => i % 2 === 0)
          .map((d) => (
            <text
              key={d.year}
              x={xScale(d.year)}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >
              Yr {d.year}
            </text>
          ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Without Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">With Line</span>
        </div>
      </div>
    </div>
  )
}

// Results section
function ResultsSection() {
  const results = useResults()
  const input = useInput()

  const peakNegativeNoLine = Math.min(...results.jCurveDataNoLine.map((d) => d.nav))
  const peakNegativeWithLine = Math.min(...results.jCurveDataWithLine.map((d) => d.nav))
  const annualInterestCost = results.totalInterestPaid / input.fundTermYears
  const costAsPctOfFees = results.totalManagementFees > 0 ? (results.totalInterestPaid / results.totalManagementFees) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Impact Summary */}
      {input.useLine && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 bg-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">IRR Boost</p>
            <p className={`text-2xl font-bold ${results.irrBoost > 0 ? 'text-green-500' : results.irrBoost < 0 ? 'text-red-500' : ''}`}>
              {results.irrBoost >= 0 ? '+' : ''}
              {results.irrBoost.toFixed(0)} bps
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPercent(results.irrNoLine, 2)} to {formatPercent(results.irrWithLine, 2)}
            </p>
          </div>
          <div className="p-4 bg-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">MOIC Impact</p>
            <p className={`text-2xl font-bold ${results.moicDrag > 0 ? 'text-amber-500' : 'text-green-500'}`}>
              -{results.moicDrag.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMultiple(results.moicNoLine)} to {formatMultiple(results.moicWithLine)}
            </p>
          </div>
          <div className="p-4 bg-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Annual Interest Cost</p>
            <p className="text-2xl font-bold">${(annualInterestCost / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-muted-foreground">{costAsPctOfFees.toFixed(0)}% of mgmt fees</p>
          </div>
        </div>
      )}

      {/* Performance Comparison */}
      <div className="space-y-4">
        <h4 className="font-medium">Performance Comparison</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">NET IRR</span>
              <div className="flex items-center gap-2">
                {results.irrBoost > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : results.irrBoost < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={`text-sm font-medium ${results.irrBoost > 0 ? 'text-green-600' : results.irrBoost < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                >
                  {formatBasisPoints(results.irrBoost)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-1">Without Line</div>
                <div className="text-xl font-bold">{formatPercent(results.irrNoLine, 2)}</div>
              </div>
              <div className="rounded-lg border border-green-500/50 bg-green-500/5 p-3">
                <div className="text-xs text-muted-foreground mb-1">With Line</div>
                <div className="text-xl font-bold text-green-500">{formatPercent(results.irrWithLine, 2)}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">NET MOIC</span>
              <span className={`text-sm font-medium ${results.moicDrag > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {results.moicDrag > 0 ? '-' : '+'}
                {Math.abs(results.moicDrag).toFixed(2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-1">Without Line</div>
                <div className="text-xl font-bold">{formatMultiple(results.moicNoLine)}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-1">With Line</div>
                <div className="text-xl font-bold">{formatMultiple(results.moicWithLine)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* J-Curve */}
      <div className="space-y-4">
        <h4 className="font-medium">J-Curve Comparison</h4>
        <div className="h-52">
          <JCurveChart />
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Peak negative NAV <strong>without line:</strong> {formatCurrency(peakNegativeNoLine)}
            </p>
            <p>
              Peak negative NAV <strong>with line:</strong> {formatCurrency(peakNegativeWithLine)}
            </p>
            <p>
              The subscription line {peakNegativeWithLine > peakNegativeNoLine ? 'reduces' : 'increases'} the depth of the
              J-curve by {formatCurrency(Math.abs(peakNegativeWithLine - peakNegativeNoLine))}
            </p>
          </div>
        </div>
      </div>

      {/* Cash Flow Timeline */}
      <div className="space-y-4">
        <h4 className="font-medium">Cash Flow Timeline</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Year</th>
                <th className="text-right py-2 font-medium">Calls (No Line)</th>
                <th className="text-right py-2 font-medium">Calls (With Line)</th>
                <th className="text-right py-2 font-medium">Distributions</th>
                <th className="text-right py-2 font-medium">Interest</th>
              </tr>
            </thead>
            <tbody>
              {results.cashFlows.slice(0, 10).map((cf) => (
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
      </div>

      {/* Key Insights */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>IRR Impact:</strong> The subscription line {results.irrBoost > 0 ? 'boosts' : 'reduces'} IRR by{' '}
            {formatBasisPoints(results.irrBoost)}. This is because it delays capital calls from LPs, shortening the
            effective investment period.
          </p>
          <p>
            <strong>MOIC Impact:</strong> The net multiple is reduced by {results.moicDrag.toFixed(2)}% due to interest
            expense of {formatCurrency(results.totalInterestPaid)}.
          </p>
          <p>
            <strong>Transparency Note:</strong> Per ILPA guidance, funds should report both levered (with line) and
            unlevered (without line) IRR to allow LPs to assess true performance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function CalculatorTab() {
  const loadPreset = useSubscriptionLineStore((state) => state.loadPreset)
  const startComparison = useSubscriptionLineStore((state) => state.startComparison)

  return (
    <div className="space-y-6">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <Button key={key} variant="outline" size="sm" onClick={() => loadPreset(key as keyof typeof PRESETS)}>
            {preset.name}
          </Button>
        ))}
      </div>

      {/* Fund Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fund Configuration</CardTitle>
          <CardDescription>Basic fund parameters and assumptions</CardDescription>
        </CardHeader>
        <CardContent>
          <FundInputsForm />
        </CardContent>
      </Card>

      {/* Subscription Line Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription Line Settings</CardTitle>
          <CardDescription>Configure the credit facility terms</CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionLineSettings />
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Results</CardTitle>
          <CardDescription>Impact of subscription line on fund performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsSection />
        </CardContent>
      </Card>

      {/* Compare button */}
      <div className="flex justify-center">
        <Button onClick={startComparison} variant="outline">
          Compare Two Scenarios
        </Button>
      </div>
    </div>
  )
}
