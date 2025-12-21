'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Percent,
  TrendingUp,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Target,
  ArrowRight,
  X
} from 'lucide-react'
import { FeeCalculationResult, FundInputs, FeePhase } from './types'

interface ResultsWalkthroughProps {
  result: FeeCalculationResult
  fundInputs: FundInputs
  feePhases: FeePhase[]
  onClose: () => void
  onXPEarned?: (xp: number) => void
}

interface WalkthroughStep {
  id: string
  title: string
  icon: React.ReactNode
  content: (result: FeeCalculationResult, inputs: FundInputs, phases: FeePhase[]) => React.ReactNode
}

export function ResultsWalkthrough({
  result,
  fundInputs,
  feePhases,
  onClose,
  onXPEarned
}: ResultsWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps: WalkthroughStep[] = [
    {
      id: 'overview',
      title: 'Your Fee Summary',
      icon: <DollarSign className="h-6 w-6" />,
      content: (result, inputs) => (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Based on your ${inputs.fundSize}M {inputs.fundType} fund with a {inputs.fundTerm}-year term, here's what your fee structure generates:
          </p>

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-primary/10 border border-primary/20"
            >
              <p className="text-sm text-muted-foreground">Total Fees</p>
              <p className="text-2xl font-bold text-primary">${result.totalFees.toFixed(2)}M</p>
              <p className="text-xs text-muted-foreground">Over {inputs.fundTerm} years</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg bg-muted/50"
            >
              <p className="text-sm text-muted-foreground">% of Commitments</p>
              <p className="text-2xl font-bold">{result.feesAsPercentOfCommitments.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Total fee load</p>
            </motion.div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>What this means:</strong> For every $1 your LPs commit, approximately ${(result.feesAsPercentOfCommitments / 100).toFixed(2)} goes toward management fees over the life of the fund.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'annual-breakdown',
      title: 'Annual Fee Pattern',
      icon: <BarChart3 className="h-6 w-6" />,
      content: (result, inputs) => (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Here's how your fees are distributed over the {inputs.fundTerm}-year fund life:
          </p>

          {/* Mini chart */}
          <div className="h-32 flex items-end gap-1 p-4 bg-muted/30 rounded-lg">
            {result.yearlyData.map((year, i) => {
              const maxFee = Math.max(...result.yearlyData.map(y => y.feeAmount))
              const height = (year.feeAmount / maxFee) * 100
              return (
                <motion.div
                  key={year.year}
                  className="flex-1 bg-primary rounded-t min-h-[4px]"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.05 }}
                  title={`Year ${year.year}: $${year.feeAmount.toFixed(2)}M`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Year 1</span>
            <span>Year {inputs.fundTerm}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">First Half Fees</p>
              <p className="font-bold">${result.firstHalfFees.toFixed(2)}M</p>
              <p className="text-xs text-muted-foreground">Years 1-{Math.floor(inputs.fundTerm / 2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Second Half Fees</p>
              <p className="font-bold">${result.secondHalfFees.toFixed(2)}M</p>
              <p className="text-xs text-muted-foreground">Years {Math.floor(inputs.fundTerm / 2) + 1}-{inputs.fundTerm}</p>
            </div>
          </div>

          {result.firstHalfFees > result.secondHalfFees && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Good sign:</strong> Your fees decrease over time, which is LP-friendly and reflects the typical step-down structure.
                </p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'phase-analysis',
      title: 'Phase-by-Phase',
      icon: <Target className="h-6 w-6" />,
      content: (result, inputs, phases) => (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your fee structure has {phases.length} phase{phases.length > 1 ? 's' : ''}:
          </p>

          {phases.map((phase, index) => {
            const phaseFees = result.yearlyData
              .filter(y => y.year >= phase.startYear && y.year <= phase.endYear)
              .reduce((sum, y) => sum + y.feeAmount, 0)
            const phaseYears = phase.endYear - phase.startYear + 1

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 ${
                  index === 0
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-muted-foreground/20 bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={index === 0 ? 'bg-primary' : 'bg-muted-foreground'}>
                    Phase {index + 1}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Years {phase.startYear}-{phase.endYear}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="font-semibold">{phase.feeRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Basis</p>
                    <p className="font-semibold text-xs">{phase.feeBase}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">${phaseFees.toFixed(2)}M</p>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {phases.length >= 2 && phases[0].feeRate > phases[1].feeRate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Fee step-down: {((1 - phases[1].feeRate / phases[0].feeRate) * 100).toFixed(0)}% reduction in Phase 2
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'benchmark',
      title: 'Market Comparison',
      icon: <TrendingUp className="h-6 w-6" />,
      content: (result, inputs) => {
        // Market benchmarks (simplified)
        const benchmarks = {
          low: 12,  // LP-friendly
          mid: 17,  // Market standard
          high: 22  // GP-friendly
        }

        const feePercent = result.feesAsPercentOfCommitments
        let comparison: 'low' | 'mid' | 'high' = 'mid'
        if (feePercent < benchmarks.low + 2) comparison = 'low'
        else if (feePercent > benchmarks.high - 2) comparison = 'high'

        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              How does your {result.feesAsPercentOfCommitments.toFixed(1)}% total fee load compare to market standards?
            </p>

            {/* Benchmark visualization */}
            <div className="relative pt-8 pb-4">
              <div className="h-4 bg-gradient-to-r from-green-400 via-amber-400 to-red-400 rounded-full" />

              {/* Markers */}
              <div className="absolute top-0 left-[15%] transform -translate-x-1/2 text-center">
                <span className="text-xs text-muted-foreground">LP-Friendly</span>
                <div className="text-xs font-medium">&lt;{benchmarks.low}%</div>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center">
                <span className="text-xs text-muted-foreground">Standard</span>
                <div className="text-xs font-medium">{benchmarks.low}-{benchmarks.high}%</div>
              </div>
              <div className="absolute top-0 left-[85%] transform -translate-x-1/2 text-center">
                <span className="text-xs text-muted-foreground">GP-Friendly</span>
                <div className="text-xs font-medium">&gt;{benchmarks.high}%</div>
              </div>

              {/* Your position */}
              <motion.div
                className="absolute top-6"
                initial={{ left: '0%' }}
                animate={{
                  left: `${Math.min(Math.max((feePercent / 30) * 100, 5), 95)}%`
                }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <div className="transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-primary" />
                  <Badge className="mt-1">{feePercent.toFixed(1)}%</Badge>
                </div>
              </motion.div>
            </div>

            <div className={`p-4 rounded-lg ${
              comparison === 'low'
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                : comparison === 'high'
                ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
            }`}>
              {comparison === 'low' && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">Below Market Average</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your fee structure is competitive and LP-friendly. This can help with fundraising, especially from institutional investors who benchmark fees carefully.
                    </p>
                  </div>
                </div>
              )}
              {comparison === 'mid' && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">Within Market Range</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Your fees are in line with industry standards. This is acceptable for most LPs and provides adequate GP economics.
                    </p>
                  </div>
                </div>
              )}
              {comparison === 'high' && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-300">Above Market Average</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Your fees are on the higher end. Consider if this is justified by your strategy, or if step-downs would improve LP appeal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      id: 'takeaway',
      title: 'Key Takeaways',
      icon: <Calculator className="h-6 w-6" />,
      content: (result, inputs, phases) => {
        const takeaways = []

        // Annual fee coverage
        const avgAnnualFee = result.totalFees / inputs.fundTerm
        if (avgAnnualFee < 0.8) {
          takeaways.push({
            type: 'warning',
            text: `Average annual fees of $${(avgAnnualFee).toFixed(2)}M may be tight for operational costs. Consider if this covers salaries, office, legal, and compliance.`
          })
        } else if (avgAnnualFee > 2) {
          takeaways.push({
            type: 'success',
            text: `Strong annual fee income of $${(avgAnnualFee).toFixed(2)}M provides solid operational runway.`
          })
        }

        // Step-down
        if (phases.length >= 2 && phases[0].feeRate > phases[1].feeRate) {
          takeaways.push({
            type: 'success',
            text: 'Your fee step-down after the investment period is LP-friendly and industry-standard.'
          })
        } else if (phases.length === 1) {
          takeaways.push({
            type: 'info',
            text: 'Consider adding a post-investment period phase with lower fees to improve LP appeal.'
          })
        }

        // Fee basis
        const usesInvestedCost = phases.some(p => p.feeBase === 'Invested Cost')
        if (usesInvestedCost) {
          takeaways.push({
            type: 'success',
            text: 'Using invested cost as a fee base (at least partially) aligns your economics with actual deployment.'
          })
        }

        // Overall assessment
        if (result.feesAsPercentOfCommitments <= 18) {
          takeaways.push({
            type: 'success',
            text: `Total fee load of ${result.feesAsPercentOfCommitments.toFixed(1)}% is competitive and should be well-received by LPs.`
          })
        }

        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Based on your fee structure, here are the key points to remember:
            </p>

            <div className="space-y-3">
              {takeaways.map((takeaway, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    takeaway.type === 'success'
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : takeaway.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/30'
                      : 'bg-blue-50 dark:bg-blue-950/30'
                  }`}
                >
                  {takeaway.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                  {takeaway.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />}
                  {takeaway.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                  <p className="text-sm">{takeaway.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm">
                <strong>Remember:</strong> This is an educational model. Actual fee structures should be reviewed by legal counsel and discussed with potential LPs. Market conditions, your track record, and LP expectations all influence acceptable fee levels.
              </p>
            </div>
          </div>
        )
      }
    }
  ]

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      onXPEarned?.(10)
    } else {
      onXPEarned?.(25) // Bonus for completing
      onClose()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              {step.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Understanding your results
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-2 mt-4" />
        <p className="text-xs text-muted-foreground mt-1">
          Step {currentStep + 1} of {steps.length}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {step.content(result, fundInputs, feePhases)}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep === steps.length - 1 ? (
              'Done'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
