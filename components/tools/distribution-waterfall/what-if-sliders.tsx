'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { SlidersHorizontal, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { WaterfallInput, WaterfallOutput, calculateWaterfall, formatCurrency, formatPercent, formatMultiple } from './waterfallCalculations'
import { statusStyles } from '@/components/tools/shared'

interface WhatIfSlidersProps {
  input: WaterfallInput
  output: WaterfallOutput
  onInputChange: (input: WaterfallInput) => void
  compact?: boolean
}

export function WhatIfSliders({ input, output, onInputChange, compact = false }: WhatIfSlidersProps) {
  const [baselineOutput, setBaselineOutput] = useState<WaterfallOutput>(output)
  const [isModified, setIsModified] = useState(false)

  // Track if values have been modified from baseline
  useEffect(() => {
    const baseline = baselineOutput.input
    const modified =
      input.grossProceeds !== baseline.grossProceeds ||
      input.prefRate !== baseline.prefRate ||
      input.carryRate !== baseline.carryRate ||
      input.yearsToExit !== baseline.yearsToExit

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
  const lpDiff = output.totalToLPs - baselineOutput.totalToLPs
  const gpDiff = output.totalToGP - baselineOutput.totalToGP
  const lpMultipleDiff = output.lpMultiple - baselineOutput.lpMultiple
  const effectiveCarryDiff = output.effectiveCarryRate - baselineOutput.effectiveCarryRate

  // Return multiple based on proceeds slider
  const grossMultiple = input.grossProceeds / input.contributedCapital

  // Slider configurations
  const sliders = [
    {
      id: 'grossProceeds',
      label: 'Gross Proceeds',
      value: grossMultiple,
      min: 0.5,
      max: 5,
      step: 0.1,
      displayValue: `${grossMultiple.toFixed(1)}x (${formatCurrency(input.grossProceeds)})`,
      onChange: (value: number) => {
        onInputChange({
          ...input,
          grossProceeds: input.contributedCapital * value
        })
      }
    },
    {
      id: 'prefRate',
      label: 'Preferred Return',
      value: input.prefRate * 100,
      min: 0,
      max: 15,
      step: 0.5,
      displayValue: `${(input.prefRate * 100).toFixed(1)}%`,
      onChange: (value: number) => {
        onInputChange({
          ...input,
          prefRate: value / 100
        })
      }
    },
    {
      id: 'carryRate',
      label: 'Carried Interest',
      value: input.carryRate * 100,
      min: 10,
      max: 35,
      step: 1,
      displayValue: `${(input.carryRate * 100).toFixed(0)}%`,
      onChange: (value: number) => {
        onInputChange({
          ...input,
          carryRate: value / 100
        })
      }
    },
    {
      id: 'yearsToExit',
      label: 'Years to Exit',
      value: input.yearsToExit,
      min: 1,
      max: 12,
      step: 0.5,
      displayValue: `${input.yearsToExit} years`,
      onChange: (value: number) => {
        onInputChange({
          ...input,
          yearsToExit: value
        })
      }
    }
  ]

  const ComparisonBadge = ({ diff, isCurrency = true }: { diff: number; isCurrency?: boolean }) => {
    if (Math.abs(diff) < 0.001 && !isCurrency) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (Math.abs(diff) < 1 && isCurrency) return <Minus className="h-4 w-4 text-muted-foreground" />

    const isPositive = diff > 0
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {isCurrency
          ? `${isPositive ? '+' : ''}${formatCurrency(diff)}`
          : `${isPositive ? '+' : ''}${(diff * 100).toFixed(1)}%`}
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
              <Button variant="ghost" size="sm" onClick={resetToBaseline} title="Reset to original values">
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Just the proceeds slider for compact mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Return Multiple</span>
              <span className="text-sm font-semibold text-primary">{grossMultiple.toFixed(1)}x</span>
            </div>
            <Slider
              value={[grossMultiple]}
              min={0.5}
              max={5}
              step={0.1}
              onValueChange={([value]) => sliders[0].onChange(value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5x</span>
              <span>5.0x</span>
            </div>
          </div>

          {/* Quick results */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">LP Gets</p>
              <p className="font-semibold">{formatCurrency(output.totalToLPs)}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">GP Gets</p>
              <p className="font-semibold text-primary">{formatCurrency(output.totalToGP)}</p>
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
            <CardTitle>What-If Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isModified && (
              <>
                <Button variant="outline" size="sm" onClick={resetToBaseline} title="Reset to original values">
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                  Reset
                </Button>
                <Button variant="default" size="sm" onClick={setNewBaseline} title="Use current values as the new baseline">
                  Set as Baseline
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Adjust parameters to see real-time impact on LP and GP economics
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sliders */}
        <div className="grid gap-6 sm:grid-cols-2">
          {sliders.map((slider) => (
            <div key={slider.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{slider.label}</span>
                <Badge variant="secondary" className="font-mono">
                  {slider.displayValue}
                </Badge>
              </div>
              <Slider
                value={[slider.value]}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                onValueChange={([value]) => slider.onChange(value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {slider.id === 'grossProceeds'
                    ? `${slider.min}x`
                    : slider.id === 'yearsToExit'
                    ? `${slider.min}yr`
                    : `${slider.min}%`}
                </span>
                <span>
                  {slider.id === 'grossProceeds'
                    ? `${slider.max}x`
                    : slider.id === 'yearsToExit'
                    ? `${slider.max}yr`
                    : `${slider.max}%`}
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
            <div className={`p-4 rounded-lg border ${statusStyles.success.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.success.label}`}>LP Distributions</p>
                {isModified && <ComparisonBadge diff={lpDiff} />}
              </div>
              <p className={`text-xl font-bold ${statusStyles.success.value}`}>
                {formatCurrency(output.totalToLPs)}
              </p>
              <p className={`text-xs ${statusStyles.success.label}`}>
                {formatMultiple(output.lpMultiple)} multiple
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${statusStyles.purple.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.purple.label}`}>GP Distributions</p>
                {isModified && <ComparisonBadge diff={gpDiff} />}
              </div>
              <p className={`text-xl font-bold ${statusStyles.purple.value}`}>
                {formatCurrency(output.totalToGP)}
              </p>
              <p className={`text-xs ${statusStyles.purple.label}`}>
                {formatMultiple(output.gpMultiple)} multiple
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${statusStyles.info.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.info.label}`}>LP Multiple</p>
                {isModified && <ComparisonBadge diff={lpMultipleDiff} isCurrency={false} />}
              </div>
              <p className={`text-xl font-bold ${statusStyles.info.value}`}>
                {formatMultiple(output.lpMultiple)}
              </p>
              <p className={`text-xs ${statusStyles.info.label}`}>
                MOIC
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${statusStyles.warning.card}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm ${statusStyles.warning.label}`}>Effective Carry</p>
                {isModified && <ComparisonBadge diff={effectiveCarryDiff} isCurrency={false} />}
              </div>
              <p className={`text-xl font-bold ${statusStyles.warning.value}`}>
                {formatPercent(output.effectiveCarryRate)}
              </p>
              <p className={`text-xs ${statusStyles.warning.label}`}>
                of profits to GP
              </p>
            </div>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-3">Quick Scenarios</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Loss (0.5x)', multiple: 0.5 },
              { label: 'Breakeven (1.0x)', multiple: 1.0 },
              { label: 'Modest (1.5x)', multiple: 1.5 },
              { label: 'Good (2.0x)', multiple: 2.0 },
              { label: 'Strong (2.5x)', multiple: 2.5 },
              { label: 'Excellent (3.0x)', multiple: 3.0 },
              { label: 'Exceptional (4.0x)', multiple: 4.0 }
            ].map((scenario) => (
              <Button
                key={scenario.label}
                variant={Math.abs(grossMultiple - scenario.multiple) < 0.1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  onInputChange({
                    ...input,
                    grossProceeds: input.contributedCapital * scenario.multiple
                  })
                }}
              >
                {scenario.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Multi-Scenario Preview */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-3">Sensitivity Table</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium">Multiple</th>
                  <th className="text-right py-2 px-4 font-medium">Proceeds</th>
                  <th className="text-right py-2 px-4 font-medium">LP Gets</th>
                  <th className="text-right py-2 px-4 font-medium">GP Gets</th>
                  <th className="text-right py-2 pl-4 font-medium">Eff. Carry</th>
                </tr>
              </thead>
              <tbody>
                {[1.0, 1.5, 2.0, 2.5, 3.0, 4.0].map((multiple) => {
                  const scenarioInput = {
                    ...input,
                    grossProceeds: input.contributedCapital * multiple
                  }
                  const scenarioOutput = calculateWaterfall(scenarioInput)
                  const isCurrentScenario = Math.abs(grossMultiple - multiple) < 0.1

                  return (
                    <tr
                      key={multiple}
                      className={`border-b border-border/50 ${
                        isCurrentScenario ? 'bg-primary/5 font-medium' : ''
                      }`}
                    >
                      <td className="py-2 pr-4">{multiple.toFixed(1)}x</td>
                      <td className="py-2 px-4 text-right font-mono">
                        {formatCurrency(scenarioInput.grossProceeds)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-green-600 dark:text-green-400">
                        {formatCurrency(scenarioOutput.totalToLPs)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
                        {formatCurrency(scenarioOutput.totalToGP)}
                      </td>
                      <td className="py-2 pl-4 text-right font-mono">
                        {formatPercent(scenarioOutput.effectiveCarryRate)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
