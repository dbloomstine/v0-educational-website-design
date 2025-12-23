'use client'

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Clock,
  Target,
  Activity,
} from 'lucide-react'
import { SubscriptionLineOutput } from './subscriptionLineCalculations'
import {
  ResultsWalkthroughBase,
  WalkthroughStep,
  WalkthroughTipBox,
} from '../shared/results-walkthrough-base'

interface ResultsWalkthroughProps {
  output: SubscriptionLineOutput
  onComplete: () => void
  onSkip: () => void
}

export function ResultsWalkthrough({ output, onComplete, onSkip }: ResultsWalkthroughProps) {
  const { input, irrNoLine, irrWithLine, moicNoLine, moicWithLine, irrBoost, moicDrag, totalInterestPaid, avgDaysCapitalOutstanding } = output

  // Analyze results
  const isILPACompliant = input.facilitySize <= 0.25 && input.maxDaysOutstanding <= 180
  const significantIRRBoost = irrBoost > 200 // >200 bps
  const significantMOICDrag = moicDrag > 0.01 // >1% reduction
  const highInterest = totalInterestPaid > (input.fundSize * 0.01) // >1% of fund size

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`
  const formatBps = (value: number) => `${Math.round(value)} bps`
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const steps: WalkthroughStep[] = [
    {
      id: 'welcome',
      title: 'Impact Analysis Ready!',
      subtitle: "See how your subscription line affects fund performance",
      icon: Sparkles,
      iconColor: 'from-indigo-400 to-purple-500',
      content: (
        <div className="space-y-6">
          <p className="text-white/70 text-center">
            We've modeled a ${(input.fundSize / 1000000).toFixed(0)}M fund with a {formatPercent(input.facilitySize)} facility over {input.fundTermYears} years.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-white">{formatPercent(irrNoLine)}</p>
              <p className="text-sm text-white/60">IRR Without Line</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center">
              <p className="text-2xl font-bold text-indigo-400">{formatPercent(irrWithLine)}</p>
              <p className="text-sm text-white/60">IRR With Line</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-white/60">IRR Boost</span>
              <span className="text-2xl font-bold text-emerald-400">+{formatBps(irrBoost)}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'irr-explained',
      title: 'Why IRR Increases',
      subtitle: 'Understanding the mechanism',
      icon: TrendingUp,
      iconColor: 'from-emerald-400 to-green-500',
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-3xl font-bold text-emerald-400 mb-1">+{formatBps(irrBoost)}</p>
            <p className="text-white/60">IRR improvement</p>
          </div>

          <p className="text-white/70">
            By delaying capital calls, the subscription line reduces the <em>time</em> LPs have money
            at work. Since IRR is time-weighted, shorter exposure means higher IRR.
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Without Line</span>
                <span className="font-semibold text-white">{formatPercent(irrNoLine)} IRR</span>
              </div>
            </div>
            <div className="flex justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex justify-between items-center">
                <span className="text-white/60">With Line</span>
                <span className="font-semibold text-emerald-400">{formatPercent(irrWithLine)} IRR</span>
              </div>
            </div>
          </div>

          <WalkthroughTipBox icon={Lightbulb} title="Key Insight">
            This is why ILPA requires GPs to report both levered and unlevered returns. The IRR boost
            is real but doesn't reflect better investment performance.
          </WalkthroughTipBox>
        </div>
      )
    },
    {
      id: 'moic-impact',
      title: 'MOIC Trade-off',
      subtitle: 'The cost of the IRR boost',
      icon: TrendingDown,
      iconColor: significantMOICDrag ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-cyan-500',
      content: (
        <div className="space-y-6">
          <div className={`p-5 rounded-xl ${significantMOICDrag ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-blue-500/10 border border-blue-500/30'} text-center`}>
            <p className={`text-3xl font-bold ${significantMOICDrag ? 'text-amber-400' : 'text-blue-400'} mb-1`}>
              -{(moicDrag * 100).toFixed(2)}%
            </p>
            <p className="text-white/60">MOIC reduction</p>
          </div>

          <p className="text-white/70">
            Interest expense on the line reduces net proceeds, which slightly lowers the multiple.
            This is the cost of using the facility.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-bold text-white">{moicNoLine.toFixed(2)}x</p>
              <p className="text-xs text-white/60">MOIC Without Line</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-bold text-white">{moicWithLine.toFixed(2)}x</p>
              <p className="text-xs text-white/60">MOIC With Line</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Total Interest Paid</span>
              <span className="font-semibold text-white">{formatCurrency(totalInterestPaid)}</span>
            </div>
          </div>

          {significantMOICDrag ? (
            <WalkthroughTipBox icon={AlertTriangle} variant="warning" title="Consider">
              The MOIC drag is notable. Ensure LPs understand this trade-off.
            </WalkthroughTipBox>
          ) : (
            <WalkthroughTipBox icon={CheckCircle2} variant="success" title="Good News">
              The MOIC impact is minimal - a reasonable trade-off for operational flexibility.
            </WalkthroughTipBox>
          )}
        </div>
      )
    },
    {
      id: 'facility-usage',
      title: 'Facility Usage',
      subtitle: 'How the line is utilized',
      icon: CreditCard,
      iconColor: 'from-violet-400 to-purple-500',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
              <p className="text-xl font-bold text-violet-400">{formatPercent(input.facilitySize)}</p>
              <p className="text-xs text-white/60">Facility Size</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-bold text-white">{Math.round(avgDaysCapitalOutstanding)} days</p>
              <p className="text-xs text-white/60">Avg. Outstanding</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Facility Amount</span>
                <span className="font-semibold text-white">{formatCurrency(input.fundSize * input.facilitySize)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Interest Rate</span>
                <span className="font-semibold text-white">{formatPercent(input.interestRate)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Max Days Outstanding</span>
                <span className="font-semibold text-white">{input.maxDaysOutstanding} days</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ilpa-compliance',
      title: 'ILPA Guidelines',
      subtitle: 'Best practices assessment',
      icon: Target,
      iconColor: isILPACompliant ? 'from-emerald-400 to-green-500' : 'from-amber-400 to-orange-500',
      content: (
        <div className="space-y-6">
          <div className={`p-5 rounded-xl text-center ${
            isILPACompliant
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : 'bg-amber-500/10 border border-amber-500/30'
          }`}>
            {isILPACompliant ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-emerald-400">ILPA Compliant</p>
                <p className="text-sm text-white/60">Within recommended parameters</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-amber-400">Exceeds ILPA Guidelines</p>
                <p className="text-sm text-white/60">Review terms with LPs</p>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${
              input.facilitySize <= 0.25
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white">Facility Size</span>
                  <p className="text-xs text-white/40">ILPA max: 25%</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${input.facilitySize <= 0.25 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatPercent(input.facilitySize)}
                  </span>
                  {input.facilitySize <= 0.25 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              input.maxDaysOutstanding <= 180
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white">Days Outstanding</span>
                  <p className="text-xs text-white/40">ILPA max: 180 days</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${input.maxDaysOutstanding <= 180 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {input.maxDaysOutstanding} days
                  </span>
                  {input.maxDaysOutstanding <= 180 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <WalkthroughTipBox icon={Lightbulb}>
            ILPA (2017 & 2020) recommends 15-25% facility size and max 180 days outstanding.
            Also requires reporting both levered and unlevered returns.
          </WalkthroughTipBox>
        </div>
      )
    },
    {
      id: 'summary',
      title: 'Key Decisions',
      subtitle: 'What to consider',
      icon: Activity,
      iconColor: 'from-blue-400 to-cyan-500',
      content: (
        <div className="space-y-4">
          {significantIRRBoost && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <TrendingUp className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Strong IRR Boost</p>
                <p className="text-sm text-white/60">+{formatBps(irrBoost)} improvement is meaningful for LP reporting.</p>
              </div>
            </div>
          )}

          {highInterest && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <DollarSign className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Monitor Interest Costs</p>
                <p className="text-sm text-white/60">{formatCurrency(totalInterestPaid)} in interest is notable. Review facility terms.</p>
              </div>
            </div>
          )}

          {isILPACompliant ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">ILPA Aligned</p>
                <p className="text-sm text-white/60">Your terms align with industry best practices.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Disclose to LPs</p>
                <p className="text-sm text-white/60">Terms exceed ILPA guidelines. Ensure LP awareness and approval.</p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-6">
            <p className="font-medium text-white mb-2">Bottom Line</p>
            <p className="text-sm text-white/60">
              Subscription lines are a valuable tool when used appropriately. The IRR boost is real
              but should be disclosed alongside unlevered returns. Focus on operational benefits
              like execution speed and capital call smoothing.
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <ResultsWalkthroughBase
      steps={steps}
      onComplete={onComplete}
      onSkip={onSkip}
      badgeLabel="Line Impact Guide"
      completeButtonText="View Full Analysis"
      primaryColor="indigo"
    />
  )
}
