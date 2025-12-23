'use client'

import {
  DollarSign,
  Percent,
  TrendingUp,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Target,
  Sparkles,
} from 'lucide-react'
import { FeeCalculationResult, FundInputs, FeePhase } from './types'
import {
  ResultsWalkthroughBase,
  WalkthroughStep,
  WalkthroughTipBox,
} from '../shared/results-walkthrough-base'

interface ResultsWalkthroughProps {
  result: FeeCalculationResult
  fundInputs: FundInputs
  feePhases: FeePhase[]
  onClose: () => void
  onXPEarned?: (xp: number) => void
}

export function ResultsWalkthrough({
  result,
  fundInputs,
  feePhases,
  onClose,
  onXPEarned
}: ResultsWalkthroughProps) {
  // Calculate derived values
  const avgAnnualFee = result.totalFees / fundInputs.fundTerm
  const hasStepDown = feePhases.length >= 2 && feePhases[0].feeRate > feePhases[1].feeRate
  const usesInvestedCost = feePhases.some(p => p.feeBase === 'Invested Cost')

  // Market benchmarks
  const benchmarks = { low: 12, mid: 17, high: 22 }
  const feePercent = result.feesAsPercentOfCommitments
  let comparison: 'low' | 'mid' | 'high' = 'mid'
  if (feePercent < benchmarks.low + 2) comparison = 'low'
  else if (feePercent > benchmarks.high - 2) comparison = 'high'

  // Takeaways
  const takeaways: { type: 'success' | 'warning' | 'info'; text: string }[] = []
  if (avgAnnualFee < 0.8) {
    takeaways.push({
      type: 'warning',
      text: `Average annual fees of $${avgAnnualFee.toFixed(2)}M may be tight for operational costs.`
    })
  } else if (avgAnnualFee > 2) {
    takeaways.push({
      type: 'success',
      text: `Strong annual fee income of $${avgAnnualFee.toFixed(2)}M provides solid operational runway.`
    })
  }
  if (hasStepDown) {
    takeaways.push({
      type: 'success',
      text: 'Your fee step-down after the investment period is LP-friendly and industry-standard.'
    })
  } else if (feePhases.length === 1) {
    takeaways.push({
      type: 'info',
      text: 'Consider adding a post-investment period phase with lower fees to improve LP appeal.'
    })
  }
  if (usesInvestedCost) {
    takeaways.push({
      type: 'success',
      text: 'Using invested cost as a fee base aligns your economics with actual deployment.'
    })
  }
  if (result.feesAsPercentOfCommitments <= 18) {
    takeaways.push({
      type: 'success',
      text: `Total fee load of ${result.feesAsPercentOfCommitments.toFixed(1)}% is competitive.`
    })
  }

  const handleComplete = () => {
    onXPEarned?.(25)
    onClose()
  }

  const steps: WalkthroughStep[] = [
    {
      id: 'overview',
      title: 'Your Fee Summary',
      subtitle: `${fundInputs.fundType} fund - ${fundInputs.fundTerm} year term`,
      icon: Sparkles,
      iconColor: 'from-amber-400 to-orange-500',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-2xl font-bold text-amber-400">${result.totalFees.toFixed(2)}M</p>
              <p className="text-white/80">Total Fees</p>
              <p className="text-xs text-white/70">Over {fundInputs.fundTerm} years</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-white">{result.feesAsPercentOfCommitments.toFixed(1)}%</p>
              <p className="text-white/80">% of Commitments</p>
              <p className="text-xs text-white/70">Total fee load</p>
            </div>
          </div>

          <WalkthroughTipBox icon={Lightbulb} title="What this means">
            For every $1 your LPs commit, approximately ${(result.feesAsPercentOfCommitments / 100).toFixed(2)} goes toward management fees over the life of the fund.
          </WalkthroughTipBox>
        </div>
      )
    },
    {
      id: 'annual-breakdown',
      title: 'Annual Fee Pattern',
      subtitle: `Distribution over ${fundInputs.fundTerm} years`,
      icon: BarChart3,
      iconColor: 'from-blue-400 to-cyan-500',
      content: (
        <div className="space-y-6">
          {/* Mini chart */}
          <div className="h-32 flex items-end gap-1 p-4 bg-white/5 rounded-xl border border-white/10">
            {result.yearlyData.map((year, i) => {
              const maxFee = Math.max(...result.yearlyData.map(y => y.feeAmount))
              const height = (year.feeAmount / maxFee) * 100
              return (
                <div
                  key={year.year}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t min-h-[4px] transition-all"
                  style={{ height: `${height}%` }}
                  title={`Year ${year.year}: $${year.feeAmount.toFixed(2)}M`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-white/70">
            <span>Year 1</span>
            <span>Year {fundInputs.fundTerm}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-bold text-white">${result.firstHalfFees.toFixed(2)}M</p>
              <p className="text-white/80">First Half Fees</p>
              <p className="text-xs text-white/70">Years 1-{Math.floor(fundInputs.fundTerm / 2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-bold text-white">${result.secondHalfFees.toFixed(2)}M</p>
              <p className="text-white/80">Second Half Fees</p>
              <p className="text-xs text-white/70">Years {Math.floor(fundInputs.fundTerm / 2) + 1}-{fundInputs.fundTerm}</p>
            </div>
          </div>

          {result.firstHalfFees > result.secondHalfFees && (
            <WalkthroughTipBox icon={CheckCircle2} variant="success" title="Good sign">
              Your fees decrease over time, which is LP-friendly and reflects the typical step-down structure.
            </WalkthroughTipBox>
          )}
        </div>
      )
    },
    {
      id: 'phase-analysis',
      title: 'Phase-by-Phase Breakdown',
      subtitle: `${feePhases.length} fee phase${feePhases.length > 1 ? 's' : ''} configured`,
      icon: Target,
      iconColor: 'from-violet-400 to-purple-500',
      content: (
        <div className="space-y-4">
          {feePhases.map((phase, index) => {
            const phaseFees = result.yearlyData
              .filter(y => y.year >= phase.startYear && y.year <= phase.endYear)
              .reduce((sum, y) => sum + y.feeAmount, 0)

            return (
              <div
                key={phase.id}
                className={`p-4 rounded-xl border-2 ${
                  index === 0
                    ? 'border-violet-400/50 bg-violet-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    index === 0 ? 'bg-violet-400 text-slate-900' : 'bg-white/20 text-white'
                  }`}>
                    Phase {index + 1}
                  </span>
                  <span className="text-white/80">
                    Years {phase.startYear}-{phase.endYear}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-white/70">Rate</p>
                    <p className="font-semibold text-white">{phase.feeRate}%</p>
                  </div>
                  <div>
                    <p className="text-white/70">Basis</p>
                    <p className="font-semibold text-white text-xs">{phase.feeBase}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Total</p>
                    <p className="font-semibold text-violet-400">${phaseFees.toFixed(2)}M</p>
                  </div>
                </div>
              </div>
            )
          })}

          {hasStepDown && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              <p className="text-white/80">
                Fee step-down: {((1 - feePhases[1].feeRate / feePhases[0].feeRate) * 100).toFixed(0)}% reduction in Phase 2
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'benchmark',
      title: 'Market Comparison',
      subtitle: 'How do your fees compare?',
      icon: TrendingUp,
      iconColor: comparison === 'low' ? 'from-emerald-400 to-green-500' :
                 comparison === 'high' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-cyan-500',
      content: (
        <div className="space-y-6">
          {/* Benchmark visualization */}
          <div className="relative pt-12 pb-6">
            <div className="h-4 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full" />

            {/* Markers */}
            <div className="absolute top-0 left-[15%] transform -translate-x-1/2 text-center">
              <span className="text-xs text-white/70">LP-Friendly</span>
              <div className="text-xs font-medium text-white/80">&lt;{benchmarks.low}%</div>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center">
              <span className="text-xs text-white/70">Standard</span>
              <div className="text-xs font-medium text-white/80">{benchmarks.low}-{benchmarks.high}%</div>
            </div>
            <div className="absolute top-0 left-[85%] transform -translate-x-1/2 text-center">
              <span className="text-xs text-white/70">GP-Friendly</span>
              <div className="text-xs font-medium text-white/80">&gt;{benchmarks.high}%</div>
            </div>

            {/* Your position */}
            <div
              className="absolute top-8 transform -translate-x-1/2"
              style={{ left: `${Math.min(Math.max((feePercent / 30) * 100, 5), 95)}%` }}
            >
              <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white" />
              <div className="mt-1 px-2 py-1 rounded-full bg-white text-slate-900 text-xs font-bold">
                {feePercent.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${
            comparison === 'low'
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : comparison === 'high'
              ? 'bg-amber-500/10 border border-amber-500/30'
              : 'bg-blue-500/10 border border-blue-500/30'
          }`}>
            {comparison === 'low' && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Below Market Average</p>
                  <p className="text-white/80">
                    Competitive and LP-friendly. Great for fundraising from institutional investors.
                  </p>
                </div>
              </div>
            )}
            {comparison === 'mid' && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Within Market Range</p>
                  <p className="text-white/80">
                    In line with industry standards. Acceptable for most LPs with adequate GP economics.
                  </p>
                </div>
              </div>
            )}
            {comparison === 'high' && (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Above Market Average</p>
                  <p className="text-white/80">
                    On the higher end. Consider if justified by strategy, or add step-downs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'takeaway',
      title: 'Key Takeaways',
      subtitle: 'Summary of your fee structure',
      icon: Calculator,
      iconColor: 'from-emerald-400 to-teal-500',
      content: (
        <div className="space-y-4">
          {takeaways.map((takeaway, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                takeaway.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : takeaway.type === 'warning'
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-blue-500/10 border border-blue-500/30'
              }`}
            >
              {takeaway.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />}
              {takeaway.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />}
              {takeaway.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />}
              <p className="text-white/80">{takeaway.text}</p>
            </div>
          ))}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-6">
            <p className="text-white/80">
              <strong className="text-white">Remember:</strong> This is an educational model. Actual fee structures should be reviewed by legal counsel and discussed with potential LPs.
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <ResultsWalkthroughBase
      steps={steps}
      onComplete={handleComplete}
      onSkip={onClose}
      badgeLabel="Fee Guide"
      completeButtonText="View Full Results"
      primaryColor="amber"
    />
  )
}
