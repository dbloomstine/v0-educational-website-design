'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  PieChart,
  Target,
  Lightbulb,
  AlertTriangle,
  ThumbsUp
} from 'lucide-react'
import { WaterfallOutput, formatCurrency, formatPercent, formatMultiple } from './waterfallCalculations'

interface ResultsWalkthroughProps {
  output: WaterfallOutput
  onComplete: () => void
  onSkip: () => void
}

interface WalkthroughStep {
  id: string
  title: string
  icon: React.ReactNode
}

const walkthroughSteps: WalkthroughStep[] = [
  { id: 'overview', title: 'Overview', icon: <PieChart className="h-5 w-5" /> },
  { id: 'tier1', title: 'Return of Capital', icon: <DollarSign className="h-5 w-5" /> },
  { id: 'tier2', title: 'Preferred Return', icon: <Target className="h-5 w-5" /> },
  { id: 'tier3', title: 'GP Catch-Up', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'tier4', title: 'Profit Split', icon: <PieChart className="h-5 w-5" /> },
  { id: 'summary', title: 'Key Takeaways', icon: <Lightbulb className="h-5 w-5" /> }
]

export function ResultsWalkthrough({ output, onComplete, onSkip }: ResultsWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = walkthroughSteps[currentStep]
  const progress = ((currentStep + 1) / walkthroughSteps.length) * 100

  // Find tiers in output
  const tier1 = output.tiers.find(t => t.tier === 1)
  const tier2 = output.tiers.find(t => t.tier === 2)
  const tier3 = output.tiers.find(t => t.tier === 3)
  const tier4 = output.tiers.find(t => t.tier === 4)

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const renderStepContent = () => {
    switch (step.id) {
      case 'overview':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Your fund generated <span className="font-semibold text-foreground">{formatCurrency(output.input.grossProceeds)}</span> in
              gross proceeds from <span className="font-semibold text-foreground">{formatCurrency(output.input.contributedCapital)}</span> of
              contributed capital — a <span className="font-semibold text-primary">{formatMultiple(output.input.grossProceeds / output.input.contributedCapital)}</span> gross multiple.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(output.totalProfit)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">LP Distributions</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(output.totalToLPs)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {formatMultiple(output.lpMultiple)} multiple
                </p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">GP Distributions</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatCurrency(output.totalToGP)}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {formatPercent(output.effectiveCarryRate)} of profits
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">What this means</p>
                <p className="text-sm text-muted-foreground">
                  Of the {formatCurrency(output.totalProfit)} in profit, LPs receive {formatCurrency(output.lpProfit)} ({formatPercent(1 - output.effectiveCarryRate)}) and
                  the GP receives {formatCurrency(output.gpProfit)} ({formatPercent(output.effectiveCarryRate)}) in carried interest.
                </p>
              </div>
            </div>
          </div>
        )

      case 'tier1':
        return tier1 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Return of Capital</h3>
                <p className="text-sm text-muted-foreground">First, investors get their money back</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              Before any profits are distributed, all contributed capital must be returned to investors.
              This tier protects LP principal and ensures they recover their investment before any profit sharing.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Distributed in Tier 1</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(tier1.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(tier1.total / output.totalDistributed)} of total distributions
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Remaining After Tier 1</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(output.input.grossProceeds - tier1.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available for pref & profit sharing
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm">
                <span className="font-medium">Note:</span> The GP commitment of {formatPercent(output.input.gpCommitmentPercent)} (
                {formatCurrency(output.input.contributedCapital * output.input.gpCommitmentPercent)}) is treated as LP capital
                in this tier and receives its share of return of capital.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No return of capital was distributed (insufficient proceeds).</p>
        )

      case 'tier2':
        return tier2 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Preferred Return</h3>
                <p className="text-sm text-muted-foreground">LPs receive their hurdle return</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              After capital is returned, LPs receive their preferred return — a {formatPercent(output.input.prefRate)} annual
              return ({output.input.prefCompounding}) over {output.input.yearsToExit} years. This hurdle must be cleared
              before the GP receives any carry.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Preferred Return Paid</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(tier2.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(tier2.total / output.input.contributedCapital)} of contributed capital
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">After Capital + Pref</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(output.input.grossProceeds - (tier1?.total ?? 0) - tier2.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available for catch-up & split
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Hurdle Cleared</p>
                <p className="text-sm text-muted-foreground">
                  LPs have now received {formatCurrency((tier1?.total ?? 0) + tier2.total)} (capital + pref).
                  The GP can now start earning carry on the remaining {formatCurrency(output.input.grossProceeds - (tier1?.total ?? 0) - tier2.total)}.
                </p>
              </div>
            </div>
          </div>
        ) : output.input.prefRate === 0 ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This waterfall has no preferred return (0% hurdle). After return of capital,
              profits go directly to the profit split tier.
            </p>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                No preferred return is common in VC funds but unusual in PE/credit.
                This means GP earns carry on all profits, not just above-hurdle profits.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Preferred return was not fully paid (insufficient proceeds after return of capital).</p>
        )

      case 'tier3':
        return tier3 && output.input.hasCatchUp ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">GP Catch-Up</h3>
                <p className="text-sm text-muted-foreground">GP catches up to target carry</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              During catch-up, GP receives {formatPercent(output.input.catchUpRate)} of distributions
              until they've earned {formatPercent(output.input.carryRate)} of <em>all</em> profits (not just profits above pref).
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Catch-Up Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(tier3.total)}</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">GP Received</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(tier3.toGP)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(tier3.toGP / tier3.total)} of catch-up tier
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Why catch-up matters:</p>
              <p className="text-sm text-muted-foreground">
                Without catch-up, GP would only earn {formatPercent(output.input.carryRate)} on profits <em>above</em> the pref,
                resulting in less than {formatPercent(output.input.carryRate)} of total profits. With {formatPercent(output.input.catchUpRate)} catch-up,
                GP's effective carry rate approaches their stated {formatPercent(output.input.carryRate)} rate.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {!output.input.hasCatchUp
                ? 'This waterfall does not include a GP catch-up provision. After preferred return, proceeds go directly to the 80/20 profit split.'
                : 'Catch-up tier was not reached (insufficient proceeds after pref).'}
            </p>
            {!output.input.hasCatchUp && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Without catch-up, the GP's effective carry rate will be lower than {formatPercent(output.input.carryRate)} because
                  they don't participate in profits used to pay the preferred return.
                </p>
              </div>
            )}
          </div>
        )

      case 'tier4':
        return tier4 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-3">
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ongoing Profit Split</h3>
                <p className="text-sm text-muted-foreground">Remaining profits shared LP/GP</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              After catch-up (if any), remaining profits split {formatPercent(1 - output.input.carryRate)}/{formatPercent(output.input.carryRate)} between
              LPs and GP. This is the "steady state" profit sharing for the fund.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Tier 4 Total</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(tier4.total)}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-green-50 dark:bg-green-950/30">
                <p className="text-sm text-muted-foreground mb-1">To LPs ({formatPercent(1 - output.input.carryRate)})</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(tier4.toLPs)}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-purple-50 dark:bg-purple-950/30">
                <p className="text-sm text-muted-foreground mb-1">To GP ({formatPercent(output.input.carryRate)})</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(tier4.toGP)}</p>
              </div>
            </div>

            {/* Visual split bar */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Tier 4 Split</p>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                <div
                  className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${(1 - output.input.carryRate) * 100}%` }}
                >
                  LP {formatPercent(1 - output.input.carryRate)}
                </div>
                <div
                  className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${output.input.carryRate * 100}%` }}
                >
                  GP {formatPercent(output.input.carryRate)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Ongoing profit split was not reached (all proceeds consumed by earlier tiers).
          </p>
        )

      case 'summary':
        const isGoodOutcome = output.lpMultiple >= 1.5
        const effectiveMatchesStated = Math.abs(output.effectiveCarryRate - output.input.carryRate) < 0.005

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`rounded-full ${isGoodOutcome ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'} p-3`}>
                {isGoodOutcome ? (
                  <ThumbsUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Key Takeaways</h3>
                <p className="text-sm text-muted-foreground">Understanding your waterfall results</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* LP Outcome */}
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">LP Outcome</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      LPs invested {formatCurrency(output.input.contributedCapital - output.input.contributedCapital * output.input.gpCommitmentPercent)} and
                      received {formatCurrency(output.totalToLPs)}.
                    </p>
                  </div>
                  <span className={`text-2xl font-bold ${output.lpMultiple >= 2 ? 'text-green-600' : output.lpMultiple >= 1.5 ? 'text-amber-600' : 'text-red-600'}`}>
                    {formatMultiple(output.lpMultiple)}
                  </span>
                </div>
              </div>

              {/* GP Outcome */}
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">GP Carry Earned</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(output.gpProfit)} in carried interest
                      ({formatPercent(output.effectiveCarryRate)} of {formatCurrency(output.totalProfit)} profit).
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(output.gpProfit)}
                  </span>
                </div>
              </div>

              {/* Effective vs Stated Carry */}
              {!effectiveMatchesStated && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Effective Carry ≠ Stated Carry
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your effective carry rate ({formatPercent(output.effectiveCarryRate)}) differs from the stated rate ({formatPercent(output.input.carryRate)}).
                    {!output.input.hasCatchUp && ' This is because there is no catch-up provision.'}
                    {output.effectiveCarryRate < output.input.carryRate && ' A lower effective rate means GP economics are less favorable at this return level.'}
                  </p>
                </div>
              )}

              {/* Structure Summary */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium text-foreground mb-2">Waterfall Structure Summary</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <span className="capitalize">{output.input.waterfallType}</span> waterfall structure</li>
                  <li>• {formatPercent(output.input.prefRate)} preferred return ({output.input.prefCompounding})</li>
                  <li>• {formatPercent(output.input.carryRate)} carried interest {output.input.hasCatchUp ? `with ${formatPercent(output.input.catchUpRate)} catch-up` : '(no catch-up)'}</li>
                  <li>• {formatPercent(output.input.gpCommitmentPercent)} GP commitment</li>
                  <li>• {output.input.yearsToExit}-year hold period</li>
                </ul>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              {step.icon}
            </div>
            <CardTitle>{step.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip Walkthrough
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1">
          {walkthroughSteps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-primary'
                  : i < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Step {currentStep + 1} of {walkthroughSteps.length}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
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
            {currentStep === walkthroughSteps.length - 1 ? 'View Full Results' : 'Continue'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
