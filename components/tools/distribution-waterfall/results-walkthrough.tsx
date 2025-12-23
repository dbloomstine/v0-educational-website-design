'use client'

import {
  TrendingUp,
  DollarSign,
  PieChart,
  Target,
  Lightbulb,
  AlertTriangle,
  ThumbsUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { WaterfallOutput, formatCurrency, formatPercent, formatMultiple } from './waterfallCalculations'
import {
  ResultsWalkthroughBase,
  WalkthroughStep,
  WalkthroughTipBox,
  WalkthroughStatCard,
} from '../shared/results-walkthrough-base'

interface ResultsWalkthroughProps {
  output: WaterfallOutput
  onComplete: () => void
  onSkip: () => void
}

export function ResultsWalkthrough({ output, onComplete, onSkip }: ResultsWalkthroughProps) {
  // Find tiers in output
  const tier1 = output.tiers.find(t => t.tier === 1)
  const tier2 = output.tiers.find(t => t.tier === 2)
  const tier3 = output.tiers.find(t => t.tier === 3)
  const tier4 = output.tiers.find(t => t.tier === 4)

  const isGoodOutcome = output.lpMultiple >= 1.5
  const effectiveMatchesStated = Math.abs(output.effectiveCarryRate - output.input.carryRate) < 0.005

  const steps: WalkthroughStep[] = [
    {
      id: 'welcome',
      title: 'Your Waterfall is Ready!',
      subtitle: "Let's walk through how proceeds are distributed",
      icon: Sparkles,
      iconColor: 'from-violet-400 to-purple-500',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-white">{formatMultiple(output.input.grossProceeds / output.input.contributedCapital)}</p>
              <p className="text-sm text-white/60">Gross Multiple</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(output.totalProfit)}</p>
              <p className="text-sm text-white/60">Total Profit</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(output.totalToLPs)}</p>
              <p className="text-sm text-white/60">LP Distributions</p>
              <p className="text-xs text-emerald-400 mt-1">{formatMultiple(output.lpMultiple)} net</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
              <p className="text-xl font-bold text-violet-400">{formatCurrency(output.totalToGP)}</p>
              <p className="text-sm text-white/60">GP Distributions</p>
              <p className="text-xs text-violet-400 mt-1">{formatPercent(output.effectiveCarryRate)} carry</p>
            </div>
          </div>

          <p className="text-white/70 text-center">
            From {formatCurrency(output.input.contributedCapital)} invested, your fund generated {formatCurrency(output.totalProfit)} in profit.
          </p>
        </div>
      )
    },
    {
      id: 'tier1',
      title: 'Tier 1: Return of Capital',
      subtitle: 'First, investors get their money back',
      icon: DollarSign,
      iconColor: 'from-blue-400 to-cyan-500',
      content: tier1 ? (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-3xl font-bold text-blue-400 text-center mb-2">
              {formatCurrency(tier1.total)}
            </p>
            <p className="text-white/60 text-center text-sm">
              {formatPercent(tier1.total / output.totalDistributed)} of total distributions
            </p>
          </div>

          <p className="text-white/70">
            Before any profits are distributed, all contributed capital must be returned to investors.
            This tier protects LP principal.
          </p>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Remaining After Tier 1</span>
              <span className="font-semibold text-white">
                {formatCurrency(output.input.grossProceeds - tier1.total)}
              </span>
            </div>
          </div>

          <WalkthroughTipBox icon={Lightbulb}>
            The GP's {formatPercent(output.input.gpCommitmentPercent)} co-investment ({formatCurrency(output.input.contributedCapital * output.input.gpCommitmentPercent)})
            is treated as LP capital and receives its share here.
          </WalkthroughTipBox>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <p className="text-white/80">No return of capital distributed (insufficient proceeds).</p>
        </div>
      )
    },
    {
      id: 'tier2',
      title: 'Tier 2: Preferred Return',
      subtitle: 'LPs receive their hurdle return',
      icon: Target,
      iconColor: 'from-emerald-400 to-green-500',
      content: tier2 ? (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-3xl font-bold text-emerald-400 text-center mb-2">
              {formatCurrency(tier2.total)}
            </p>
            <p className="text-white/60 text-center text-sm">
              {formatPercent(output.input.prefRate)} annual ({output.input.prefCompounding}) over {output.input.yearsToExit} years
            </p>
          </div>

          <p className="text-white/70">
            After capital is returned, LPs receive their preferred return. This hurdle must be
            cleared before the GP receives any carry.
          </p>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-medium text-white">Hurdle Cleared</p>
              <p className="text-sm text-white/60">
                LPs received {formatCurrency((tier1?.total ?? 0) + tier2.total)} (capital + pref).
                GP can now earn carry.
              </p>
            </div>
          </div>
        </div>
      ) : output.input.prefRate === 0 ? (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-xl font-bold text-amber-400 mb-2">No Preferred Return</p>
            <p className="text-white/60">0% hurdle - profits go directly to split</p>
          </div>
          <WalkthroughTipBox icon={AlertTriangle} variant="warning" title="Note">
            No pref is common in VC but unusual in PE/credit. GP earns carry on all profits.
          </WalkthroughTipBox>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <p className="text-white/80">Preferred return not fully paid (insufficient proceeds).</p>
        </div>
      )
    },
    {
      id: 'tier3',
      title: 'Tier 3: GP Catch-Up',
      subtitle: 'GP catches up to their target carry',
      icon: TrendingUp,
      iconColor: 'from-purple-400 to-violet-500',
      content: tier3 && output.input.hasCatchUp ? (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <p className="text-3xl font-bold text-violet-400 text-center mb-2">
              {formatCurrency(tier3.total)}
            </p>
            <p className="text-white/60 text-center text-sm">
              {formatPercent(output.input.catchUpRate)} catch-up rate
            </p>
          </div>

          <p className="text-white/70">
            During catch-up, GP receives {formatPercent(output.input.catchUpRate)} of distributions
            until they've earned {formatPercent(output.input.carryRate)} of <em>all</em> profits.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-bold text-white">{formatCurrency(tier3.toLPs)}</p>
              <p className="text-xs text-white/60">To LPs</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
              <p className="text-xl font-bold text-violet-400">{formatCurrency(tier3.toGP)}</p>
              <p className="text-xs text-white/60">To GP</p>
            </div>
          </div>

          <WalkthroughTipBox icon={Lightbulb}>
            Without catch-up, GP would only earn {formatPercent(output.input.carryRate)} on profits
            above the pref, resulting in less than {formatPercent(output.input.carryRate)} total.
          </WalkthroughTipBox>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-500/10 border border-slate-500/30 text-center">
            <p className="text-xl font-bold text-slate-400 mb-2">No Catch-Up</p>
            <p className="text-white/60">
              {!output.input.hasCatchUp
                ? 'Not included - proceeds go directly to 80/20 split'
                : 'Not reached (insufficient proceeds after pref)'}
            </p>
          </div>
          {!output.input.hasCatchUp && (
            <WalkthroughTipBox icon={AlertTriangle} variant="warning" title="Impact">
              Without catch-up, GP's effective carry rate will be lower than {formatPercent(output.input.carryRate)}.
            </WalkthroughTipBox>
          )}
        </div>
      )
    },
    {
      id: 'tier4',
      title: 'Tier 4: Profit Split',
      subtitle: 'Remaining profits shared LP/GP',
      icon: PieChart,
      iconColor: 'from-amber-400 to-orange-500',
      content: tier4 ? (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-3xl font-bold text-amber-400 text-center mb-2">
              {formatCurrency(tier4.total)}
            </p>
            <p className="text-white/60 text-center text-sm">
              {formatPercent(1 - output.input.carryRate)} LP / {formatPercent(output.input.carryRate)} GP
            </p>
          </div>

          <p className="text-white/70">
            After catch-up (if any), remaining profits split between LPs and GP.
            This is the "steady state" profit sharing.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(tier4.toLPs)}</p>
              <p className="text-xs text-white/60">To LPs ({formatPercent(1 - output.input.carryRate)})</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
              <p className="text-xl font-bold text-violet-400">{formatCurrency(tier4.toGP)}</p>
              <p className="text-xs text-white/60">To GP ({formatPercent(output.input.carryRate)})</p>
            </div>
          </div>

          {/* Visual split bar */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Split Visualization</p>
            <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
              <div
                className="bg-emerald-500 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${(1 - output.input.carryRate) * 100}%` }}
              >
                LP
              </div>
              <div
                className="bg-violet-500 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${output.input.carryRate * 100}%` }}
              >
                GP
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-500/10 border border-slate-500/30 text-center">
          <p className="text-white/80">Profit split not reached (all proceeds consumed by earlier tiers).</p>
        </div>
      )
    },
    {
      id: 'summary',
      title: isGoodOutcome ? 'Strong Results!' : 'Key Takeaways',
      subtitle: 'Understanding your waterfall outcomes',
      icon: isGoodOutcome ? ThumbsUp : Lightbulb,
      iconColor: isGoodOutcome ? 'from-emerald-400 to-green-500' : 'from-amber-400 to-orange-500',
      content: (
        <div className="space-y-6">
          {/* LP Outcome */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-white">LP Outcome</p>
                <p className="text-sm text-white/60 mt-1">
                  {formatCurrency(output.input.contributedCapital - output.input.contributedCapital * output.input.gpCommitmentPercent)} invested
                  {' '}{'\u2192'}{' '}
                  {formatCurrency(output.totalToLPs)} returned
                </p>
              </div>
              <span className={`text-2xl font-bold ${
                output.lpMultiple >= 2 ? 'text-emerald-400' :
                output.lpMultiple >= 1.5 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {formatMultiple(output.lpMultiple)}
              </span>
            </div>
          </div>

          {/* GP Outcome */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-white">GP Carry Earned</p>
                <p className="text-sm text-white/60 mt-1">
                  {formatPercent(output.effectiveCarryRate)} of {formatCurrency(output.totalProfit)} profit
                </p>
              </div>
              <span className="text-2xl font-bold text-violet-400">
                {formatCurrency(output.gpProfit)}
              </span>
            </div>
          </div>

          {/* Effective vs Stated Carry warning */}
          {!effectiveMatchesStated && (
            <WalkthroughTipBox icon={AlertTriangle} variant="warning" title="Carry Rate Difference">
              Effective carry ({formatPercent(output.effectiveCarryRate)}) differs from stated ({formatPercent(output.input.carryRate)}).
              {!output.input.hasCatchUp && ' This is because there is no catch-up provision.'}
            </WalkthroughTipBox>
          )}

          {/* Structure Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="font-medium text-white mb-2">Waterfall Structure</p>
            <ul className="text-sm text-white/60 space-y-1">
              <li>• {output.input.waterfallType.charAt(0).toUpperCase() + output.input.waterfallType.slice(1)} waterfall</li>
              <li>• {formatPercent(output.input.prefRate)} pref ({output.input.prefCompounding})</li>
              <li>• {formatPercent(output.input.carryRate)} carry {output.input.hasCatchUp ? `with ${formatPercent(output.input.catchUpRate)} catch-up` : '(no catch-up)'}</li>
              <li>• {formatPercent(output.input.gpCommitmentPercent)} GP commitment</li>
            </ul>
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
      badgeLabel="Waterfall Guide"
      completeButtonText="View Full Results"
      primaryColor="violet"
    />
  )
}
