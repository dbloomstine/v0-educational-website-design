'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { SlidersHorizontal, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  SubscriptionLineInput,
  SubscriptionLineOutput,
  calculateSubscriptionLineImpact,
  formatCurrency,
  formatBasisPoints,
  formatPercent
} from './subscriptionLineCalculations'
import { statusStyles } from '@/components/tools/shared'

interface WhatIfSlidersProps {
  input: SubscriptionLineInput
  output: SubscriptionLineOutput
  onInputChange: (input: SubscriptionLineInput) => void
  compact?: boolean
}

export function WhatIfSliders({ input, output, onInputChange, compact = false }: WhatIfSlidersProps) {
  const [baselineOutput, setBaselineOutput] = useState<SubscriptionLineOutput>(output)
  const [isModified, setIsModified] = useState(false)

  // Track if values have been modified from baseline
  useEffect(() => {
    const baseline = baselineOutput.input
    const modified =
      input.facilitySize !== baseline.facilitySize ||
      input.interestRate !== baseline.interestRate ||
      input.maxDaysOutstanding !== baseline.maxDaysOutstanding

    setIsModified(modified)
  }, [input, baselineOutput])

  const resetToBaseline = () => {
    onInputChange(baselineOutput.input)
  }

  const setNewBaseline = () => {
    setBaselineOutput(output)
    setIsModified(false)
  }

  // Calculate comparison metrics
  const irrBoostDiff = output.irrBoost - baselineOutput.irrBoost
  const moicDiff = output.moicWithLine - baselineOutput.moicWithLine
  const interestDiff = output.totalInterestPaid - baselineOutput.totalInterestPaid

  // Slider configurations
  const sliders = [
    {
      id: 'facilitySize',
      label: 'Facility Size',
      value: input.facilitySize * 100,
      min: 10,
      max: 50,
      step: 5,
      displayValue: `${(input.facilitySize * 100).toFixed(0)}% of commitments`,
      onChange: (value: number) => {
        onInputChange({
          ...input,
          facilitySize: value / 100
        })
      },
      description: 'Size of credit facility as % of commitments'
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      value: input.interestRate * 100,
      min: 3,
      max: 8,
      step: 0.25,
      displayValue: `${(input.interestRate * 100).toFixed(2)}% annual`,
      onChange: (value: number) => {
        onInputChange({
          ...input,
          interestRate: value / 100
        })
      },
      description: 'Annual interest rate on credit facility'
    },
    {
      id: 'maxDaysOutstanding',
      label: 'Days Outstanding',
      value: input.maxDaysOutstanding,
      min: 90,
      max: 365,
      step: 30,
      displayValue: `${input.maxDaysOutstanding} days`,
      onChange: (value: number) => {
        onInputChange({
          ...input,
          maxDaysOutstanding: value
        })
      },
      description: 'Maximum days line can be outstanding'
    }
  ]

  const ComparisonBadge = ({ diff, isCurrency = false, isBps = false }: { diff: number; isCurrency?: boolean; isBps?: boolean }) => {
    const threshold = isCurrency ? 1000 : (isBps ? 1 : 0.001)
    if (Math.abs(diff) < threshold) return <Minus className="h-4 w-4 text-muted-foreground" />

    const isPositive = diff > 0
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {isCurrency
          ? `${isPositive ? '+' : ''}${formatCurrency(diff)}`
          : isBps
          ? `${isPositive ? '+' : ''}${diff.toFixed(0)} bps`
          : `${isPositive ? '+' : ''}${(diff * 100).toFixed(2)}%`}
      </span>
    )
  }

  if (compact) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quick Sensitivity</CardTitle>
            </div>
            {isModified && (
              <Button variant="ghost" size="sm" onClick={resetToBaseline}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Just the facility size slider for compact mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Facility Size</span>
              <span className="text-sm font-semibold text-primary">
                {(input.facilitySize * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[input.facilitySize * 100]}
              min={10}
              max={50}
              step={5}
              onValueChange={([value]) => sliders[0].onChange(value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Quick results */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">IRR Boost</p>
              <p className="font-semibold text-primary">{formatBasisPoints(output.irrBoost)}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">MOIC Impact</p>
              <p className="font-semibold">{output.moicWithLine.toFixed(2)}x</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            <CardTitle>Sensitivity Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isModified && (
              <>
                <Button variant="outline" size="sm" onClick={resetToBaseline}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button variant="default" size="sm" onClick={setNewBaseline}>
                  Set as Baseline
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Adjust credit facility parameters to see real-time impact on IRR and MOIC
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sliders */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {sliders.map((slider) => (
            <div key={slider.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{slider.label}</span>
                  <p className="text-xs text-muted-foreground">{slider.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono w-full justify-center">
                {slider.displayValue}
              </Badge>
              <Slider
                value={[slider.value]}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                onValueChange={([value]) => slider.onChange(value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {slider.id === 'facilitySize'
                    ? `${slider.min}%`
                    : slider.id === 'interestRate'
                    ? `${slider.min}%`
                    : `${slider.min}d`}
                </span>
                <span>
                  {slider.id === 'facilitySize'
                    ? `${slider.max}%`
                    : slider.id === 'interestRate'
                    ? `${slider.max}%`
                    : `${slider.max}d`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Results Comparison */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-4">
            {isModified ? 'Impact vs Baseline' : 'Current Results'}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`p-4 rounded-lg border ${statusStyles.info.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.info.label}`}>IRR Boost</p>
                {isModified && <ComparisonBadge diff={irrBoostDiff} isBps />}
              </div>
              <p className={`text-xl font-bold ${statusStyles.info.value}`}>
                {formatBasisPoints(output.irrBoost)}
              </p>
              <p className={`text-xs ${statusStyles.info.label}`}>
                {output.irrWithLine > 0 ? `${formatPercent(output.irrWithLine)} IRR` : 'N/A'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${statusStyles.purple.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.purple.label}`}>Net MOIC</p>
                {isModified && <ComparisonBadge diff={moicDiff} />}
              </div>
              <p className={`text-xl font-bold ${statusStyles.purple.value}`}>
                {output.moicWithLine.toFixed(2)}x
              </p>
              <p className={`text-xs ${statusStyles.purple.label}`}>
                vs {output.moicNoLine.toFixed(2)}x baseline
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${statusStyles.error.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.error.label}`}>Interest Cost</p>
                {isModified && <ComparisonBadge diff={interestDiff} isCurrency />}
              </div>
              <p className={`text-xl font-bold ${statusStyles.error.value}`}>
                {formatCurrency(output.totalInterestPaid)}
              </p>
              <p className={`text-xs ${statusStyles.error.label}`}>
                {formatPercent(output.moicDrag)} MOIC drag
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${statusStyles.warning.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.warning.label}`}>Total Fees</p>
              </div>
              <p className={`text-xl font-bold ${statusStyles.warning.value}`}>
                {formatCurrency(output.totalManagementFees + output.totalInterestPaid)}
              </p>
              <p className={`text-xs ${statusStyles.warning.label}`}>
                {formatPercent(output.feeDrag / 100)} fee drag
              </p>
            </div>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-3">Quick Scenarios</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Conservative (15%, 4%, 90d)', facilitySize: 0.15, interestRate: 0.04, days: 90 },
              { label: 'ILPA Standard (20%, 4.5%, 180d)', facilitySize: 0.20, interestRate: 0.045, days: 180 },
              { label: 'Aggressive (25%, 5.5%, 360d)', facilitySize: 0.25, interestRate: 0.055, days: 360 },
              { label: 'No Line', facilitySize: 0, interestRate: 0, days: 0 }
            ].map((scenario) => {
              const isActive =
                Math.abs(input.facilitySize - scenario.facilitySize) < 0.01 &&
                Math.abs(input.interestRate - scenario.interestRate) < 0.001 &&
                input.maxDaysOutstanding === scenario.days

              return (
                <Button
                  key={scenario.label}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onInputChange({
                      ...input,
                      facilitySize: scenario.facilitySize,
                      interestRate: scenario.interestRate,
                      maxDaysOutstanding: scenario.days,
                      useLine: scenario.facilitySize > 0
                    })
                  }}
                >
                  {scenario.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Sensitivity Table */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-3">Facility Size Sensitivity</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium">Size</th>
                  <th className="text-right py-2 px-4 font-medium">IRR Boost</th>
                  <th className="text-right py-2 px-4 font-medium">Net MOIC</th>
                  <th className="text-right py-2 px-4 font-medium">Interest</th>
                  <th className="text-right py-2 pl-4 font-medium">MOIC Drag</th>
                </tr>
              </thead>
              <tbody>
                {[0.10, 0.15, 0.20, 0.25, 0.30].map((size) => {
                  const scenarioInput = {
                    ...input,
                    facilitySize: size,
                    useLine: size > 0
                  }
                  const scenarioOutput = calculateSubscriptionLineImpact(scenarioInput)
                  const isCurrentScenario = Math.abs(input.facilitySize - size) < 0.01

                  return (
                    <tr
                      key={size}
                      className={`border-b border-border/50 ${
                        isCurrentScenario ? 'bg-primary/5 font-medium' : ''
                      }`}
                    >
                      <td className="py-2 pr-4">{(size * 100).toFixed(0)}%</td>
                      <td className="py-2 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                        {formatBasisPoints(scenarioOutput.irrBoost)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {scenarioOutput.moicWithLine.toFixed(2)}x
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-red-600 dark:text-red-400">
                        {formatCurrency(scenarioOutput.totalInterestPaid)}
                      </td>
                      <td className="py-2 pl-4 text-right font-mono">
                        {formatPercent(scenarioOutput.moicDrag)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ILPA Guidance Note */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="text-sm font-medium mb-2">ILPA Guidance</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Recommended facility size: 15-25% of commitments</p>
            <p>• Maximum days outstanding: 180 days</p>
            <p>• Funds should report both levered and unlevered returns</p>
            <p>• Interest rates typically range from 3-6% annually</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
