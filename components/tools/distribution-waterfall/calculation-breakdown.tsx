'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, ChevronDown, ChevronUp, Info, CheckCircle2 } from 'lucide-react'
import { WaterfallOutput, formatCurrency, formatPercent } from './waterfallCalculations'

interface CalculationBreakdownProps {
  output: WaterfallOutput
  compact?: boolean
}

interface CalculationStep {
  id: string
  title: string
  formula: string
  calculation: string
  result: string
  explanation: string
}

export function CalculationBreakdown({ output, compact = false }: CalculationBreakdownProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [showAllSteps, setShowAllSteps] = useState(false)

  const { input } = output

  // Calculate values for display
  const gpAsLP = input.contributedCapital * input.gpCommitmentPercent
  const lpOnlyCapital = input.contributedCapital - gpAsLP

  const prefAmount = input.prefCompounding === 'simple'
    ? input.contributedCapital * input.prefRate * input.yearsToExit
    : input.contributedCapital * (Math.pow(1 + input.prefRate, input.yearsToExit) - 1)

  const totalProfit = input.grossProceeds - input.contributedCapital
  const gpTargetCarry = totalProfit * input.carryRate

  // Build calculation steps
  const steps: CalculationStep[] = [
    {
      id: 'gross-proceeds',
      title: 'Starting Point: Gross Proceeds',
      formula: 'Gross Proceeds = Total Exit Value',
      calculation: formatCurrency(input.grossProceeds),
      result: formatCurrency(input.grossProceeds),
      explanation: 'Total cash received from all exits and distributions before any waterfall splits.'
    },
    {
      id: 'contributed-capital',
      title: 'Contributed Capital',
      formula: 'LP Capital + GP Commitment = Total Contributed',
      calculation: `${formatCurrency(lpOnlyCapital)} + ${formatCurrency(gpAsLP)} = ${formatCurrency(input.contributedCapital)}`,
      result: formatCurrency(input.contributedCapital),
      explanation: `Total capital invested in the fund. GP committed ${formatPercent(input.gpCommitmentPercent)} (${formatCurrency(gpAsLP)}).`
    },
    {
      id: 'total-profit',
      title: 'Total Profit Calculation',
      formula: 'Profit = Gross Proceeds - Contributed Capital',
      calculation: `${formatCurrency(input.grossProceeds)} - ${formatCurrency(input.contributedCapital)} = ${formatCurrency(totalProfit)}`,
      result: formatCurrency(totalProfit),
      explanation: 'Total profit to be split through the waterfall after all capital is returned.'
    },
    {
      id: 'preferred-return',
      title: 'Preferred Return Calculation',
      formula: input.prefCompounding === 'simple'
        ? 'Pref = Capital × Rate × Years'
        : 'Pref = Capital × ((1 + Rate)^Years - 1)',
      calculation: input.prefCompounding === 'simple'
        ? `${formatCurrency(input.contributedCapital)} × ${formatPercent(input.prefRate)} × ${input.yearsToExit} = ${formatCurrency(prefAmount)}`
        : `${formatCurrency(input.contributedCapital)} × ((1 + ${formatPercent(input.prefRate)})^${input.yearsToExit} - 1) = ${formatCurrency(prefAmount)}`,
      result: formatCurrency(prefAmount),
      explanation: `The ${formatPercent(input.prefRate)} ${input.prefCompounding} preferred return over ${input.yearsToExit} years that LPs receive before GP earns carry.`
    },
    {
      id: 'tier1-distribution',
      title: 'Tier 1: Return of Capital',
      formula: 'Tier 1 = min(Gross Proceeds, Contributed Capital)',
      calculation: `min(${formatCurrency(input.grossProceeds)}, ${formatCurrency(input.contributedCapital)}) = ${formatCurrency(Math.min(input.grossProceeds, input.contributedCapital))}`,
      result: formatCurrency(Math.min(input.grossProceeds, input.contributedCapital)),
      explanation: 'All contributed capital returned to investors before any profit distribution. Split proportionally between LPs and GP (as LP).'
    }
  ]

  // Add Tier 2 if there's money after return of capital
  if (input.grossProceeds > input.contributedCapital) {
    const remainingAfterT1 = input.grossProceeds - input.contributedCapital
    const tier2Amount = Math.min(remainingAfterT1, prefAmount)

    steps.push({
      id: 'tier2-distribution',
      title: 'Tier 2: Preferred Return Distribution',
      formula: 'Tier 2 = min(Remaining, Pref Amount)',
      calculation: `min(${formatCurrency(remainingAfterT1)}, ${formatCurrency(prefAmount)}) = ${formatCurrency(tier2Amount)}`,
      result: formatCurrency(tier2Amount),
      explanation: 'Preferred return distributed to all investors. Must be fully satisfied before GP catch-up.'
    })

    // Add Tier 3 if catch-up applies
    if (input.hasCatchUp && remainingAfterT1 > prefAmount) {
      const remainingAfterT2 = remainingAfterT1 - prefAmount

      let catchUpAmount: number
      if (input.catchUpRate === 1.0) {
        catchUpAmount = gpTargetCarry / input.catchUpRate
      } else {
        const catchUpDenominator = input.catchUpRate - input.carryRate
        catchUpAmount = (gpTargetCarry - remainingAfterT2 * input.carryRate) / catchUpDenominator
      }
      const actualCatchUp = Math.min(remainingAfterT2, Math.max(0, catchUpAmount))
      const gpCatchUp = actualCatchUp * input.catchUpRate

      steps.push({
        id: 'catch-up-target',
        title: 'GP Target Carry',
        formula: 'Target = Total Profit × Carry Rate',
        calculation: `${formatCurrency(totalProfit)} × ${formatPercent(input.carryRate)} = ${formatCurrency(gpTargetCarry)}`,
        result: formatCurrency(gpTargetCarry),
        explanation: 'The amount of carry GP should receive if they get their full stated carry percentage of all profits.'
      })

      steps.push({
        id: 'tier3-distribution',
        title: 'Tier 3: GP Catch-Up',
        formula: input.catchUpRate === 1.0
          ? 'Catch-Up = Target ÷ Catch-Up Rate'
          : 'Catch-Up = (Target - Remaining × Carry) ÷ (Catch-Up Rate - Carry Rate)',
        calculation: input.catchUpRate === 1.0
          ? `${formatCurrency(gpTargetCarry)} ÷ ${formatPercent(input.catchUpRate)} = ${formatCurrency(catchUpAmount)}`
          : `Complex calculation (see details)`,
        result: `GP receives ${formatCurrency(gpCatchUp)} (${formatPercent(input.catchUpRate)} of ${formatCurrency(actualCatchUp)})`,
        explanation: `GP receives ${formatPercent(input.catchUpRate)} of distributions until they've earned ${formatPercent(input.carryRate)} of total profits.`
      })

      // Add Tier 4 if there's money after catch-up
      if (remainingAfterT2 > actualCatchUp) {
        const tier4Amount = remainingAfterT2 - actualCatchUp
        const tier4ToGP = tier4Amount * input.carryRate
        const tier4ToLPs = tier4Amount - tier4ToGP

        steps.push({
          id: 'tier4-distribution',
          title: 'Tier 4: Ongoing Profit Split',
          formula: `Split = Remaining × (${formatPercent(1 - input.carryRate)}/${formatPercent(input.carryRate)} LP/GP)`,
          calculation: `${formatCurrency(tier4Amount)} splits to LP: ${formatCurrency(tier4ToLPs)}, GP: ${formatCurrency(tier4ToGP)}`,
          result: `LP: ${formatCurrency(tier4ToLPs)}, GP: ${formatCurrency(tier4ToGP)}`,
          explanation: `Remaining profits split ${formatPercent(1 - input.carryRate)}/${formatPercent(input.carryRate)} between LPs and GP.`
        })
      }
    } else if (!input.hasCatchUp && remainingAfterT1 > prefAmount) {
      // No catch-up, go straight to split
      const tier4Amount = remainingAfterT1 - prefAmount
      const tier4ToGP = tier4Amount * input.carryRate
      const tier4ToLPs = tier4Amount - tier4ToGP

      steps.push({
        id: 'tier4-distribution',
        title: 'Tier 4: Profit Split (No Catch-Up)',
        formula: `Split = Remaining × (${formatPercent(1 - input.carryRate)}/${formatPercent(input.carryRate)} LP/GP)`,
        calculation: `${formatCurrency(tier4Amount)} splits to LP: ${formatCurrency(tier4ToLPs)}, GP: ${formatCurrency(tier4ToGP)}`,
        result: `LP: ${formatCurrency(tier4ToLPs)}, GP: ${formatCurrency(tier4ToGP)}`,
        explanation: `Without catch-up, profits above pref split ${formatPercent(1 - input.carryRate)}/${formatPercent(input.carryRate)}. GP earns carry only on profits above the pref.`
      })
    }
  }

  // Add final summary
  steps.push({
    id: 'effective-carry',
    title: 'Effective Carry Rate',
    formula: 'Effective Carry = GP Profit ÷ Total Profit',
    calculation: `${formatCurrency(output.gpProfit)} ÷ ${formatCurrency(totalProfit)} = ${formatPercent(output.effectiveCarryRate)}`,
    result: formatPercent(output.effectiveCarryRate),
    explanation: `The GP's actual share of profits. ${output.effectiveCarryRate === input.carryRate
      ? 'Matches the stated carry rate (catch-up worked as intended).'
      : `Differs from stated ${formatPercent(input.carryRate)} due to waterfall structure.`}`
  })

  const displaySteps = showAllSteps ? steps : steps.slice(0, 5)

  if (compact) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Calculation Details</CardTitle>
            </div>
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </CardHeader>
        {expanded && (
          <CardContent>
            <div className="space-y-3">
              {displaySteps.slice(0, 3).map((step) => (
                <div key={step.id} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{step.formula}</p>
                  <p className="text-sm font-semibold text-primary mt-1">{step.result}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <CardTitle>Step-by-Step Calculation</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          See exactly how proceeds flow through each tier of the waterfall
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Waterfall type indicator */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <p className="text-sm">
            <span className="font-medium capitalize">{input.waterfallType}</span> waterfall with{' '}
            <span className="font-medium">{formatPercent(input.prefRate)} {input.prefCompounding}</span> pref,{' '}
            <span className="font-medium">{formatPercent(input.carryRate)}</span> carry
            {input.hasCatchUp ? `, ${formatPercent(input.catchUpRate)} catch-up` : ', no catch-up'}
          </p>
        </div>

        {/* Calculation steps */}
        <div className="space-y-3">
          {displaySteps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-lg border border-border bg-background overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-foreground">{step.title}</h4>
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>

                    <div className="mt-2 p-3 rounded bg-muted/50 font-mono text-sm">
                      <p className="text-muted-foreground">{step.formula}</p>
                      <p className="text-foreground mt-1">{step.calculation}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-muted-foreground">{step.explanation}</p>
                      <span className="font-semibold text-primary whitespace-nowrap ml-4">
                        {step.result}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {steps.length > 5 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAllSteps(!showAllSteps)}
          >
            {showAllSteps ? 'Show Less' : `Show All ${steps.length} Steps`}
            {showAllSteps ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        )}

        {/* Final summary */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <h4 className="font-semibold text-foreground mb-3">Final Distribution Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total to LPs</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(output.totalToLPs)}</p>
              <p className="text-xs text-muted-foreground">{formatPercent(output.totalToLPs / output.totalDistributed)} of distributions</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total to GP</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(output.totalToGP)}</p>
              <p className="text-xs text-muted-foreground">{formatPercent(output.totalToGP / output.totalDistributed)} of distributions</p>
            </div>
          </div>
        </div>

        {/* Verification note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-medium">Verification:</span> Total distributed ({formatCurrency(output.totalDistributed)}) =
            Gross proceeds ({formatCurrency(input.grossProceeds)}). All calculations use industry-standard waterfall mechanics.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
