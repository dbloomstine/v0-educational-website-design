"use client"

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import {
  ChevronRight,
  ChevronLeft,
  X,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Users,
  Briefcase,
  Target,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  PiggyBank,
  AlertTriangle,
  ThumbsUp
} from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'

interface WalkthroughStep {
  id: string
  title: string
  subtitle: string
  icon: any
  iconColor: string
  highlightSection?: 'summary' | 'runway' | 'waterfall' | 'cashflow' | 'expenses'
  content: (data: BudgetData, results: BudgetResults) => React.ReactNode
}

interface ResultsWalkthroughProps {
  data: BudgetData
  results: BudgetResults
  onComplete: () => void
  onSkip: () => void
}

export function ResultsWalkthrough({ data, results, onComplete, onSkip }: ResultsWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const runwayStatus = results.runwayMonths !== null && results.runwayMonths >= 18 ? 'good' :
                       results.runwayMonths !== null && results.runwayMonths >= 12 ? 'warning' : 'critical'

  const cashFlowStatus = results.annualRevenue > results.annualBudget ? 'positive' : 'negative'

  const steps: WalkthroughStep[] = [
    {
      id: 'welcome',
      title: 'Your Budget is Ready!',
      subtitle: "Let's walk through what this means for your fund.",
      icon: Sparkles,
      iconColor: 'from-amber-400 to-orange-500',
      content: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-white">{formatCurrency(results.monthlyBurn, true)}</p>
              <p className="text-white/80">Monthly Burn</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(results.annualRevenue, true)}</p>
              <p className="text-white/80">Annual Revenue</p>
            </div>
          </div>
          <p className="text-white/90 text-center">
            We've created a comprehensive 5-year projection based on your inputs. Let's explore the key insights.
          </p>
        </div>
      )
    },
    {
      id: 'runway',
      title: 'Runway Analysis',
      subtitle: 'How long can you operate before fee revenue arrives?',
      icon: Clock,
      iconColor: runwayStatus === 'good' ? 'from-emerald-400 to-green-500' :
                 runwayStatus === 'warning' ? 'from-amber-400 to-orange-500' : 'from-red-400 to-red-500',
      highlightSection: 'runway',
      content: () => (
        <div className="space-y-6">
          <div className={cn(
            "p-6 rounded-xl border text-center",
            runwayStatus === 'good' && "bg-emerald-500/10 border-emerald-500/30",
            runwayStatus === 'warning' && "bg-amber-500/10 border-amber-500/30",
            runwayStatus === 'critical' && "bg-red-500/10 border-red-500/30"
          )}>
            <p className={cn(
              "text-4xl font-bold mb-2",
              runwayStatus === 'good' && "text-emerald-400",
              runwayStatus === 'warning' && "text-amber-400",
              runwayStatus === 'critical' && "text-red-400"
            )}>
              {results.runwayMonths ?? '24+'} months
            </p>
            <p className="text-white/80">estimated runway before management fees</p>
          </div>

          <div className="space-y-3">
            {runwayStatus === 'good' && (
              <div className="flex items-start gap-3 text-emerald-400">
                <ThumbsUp className="h-5 w-5 mt-0.5" />
                <p className="text-white/80">
                  Strong position! You have ample runway to reach first close without capital pressure.
                </p>
              </div>
            )}
            {runwayStatus === 'warning' && (
              <div className="flex items-start gap-3 text-amber-400">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <p className="text-white/80">
                  Moderate runway. Most managers target 18-24 months. Consider reducing costs or increasing starting capital.
                </p>
              </div>
            )}
            {runwayStatus === 'critical' && (
              <div className="flex items-start gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <p className="text-white/80">
                  Tight runway. Fundraising delays or higher costs could create cash pressure. Review your budget carefully.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-white">Pro Tip</span>
            </div>
            <p className="text-white/80">
              The "Cash Flow Projection" chart below shows your runway visually. Look for where your balance goes negative.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'cashflow',
      title: 'Cash Flow Balance',
      subtitle: 'Are your fees enough to cover operating costs?',
      icon: BarChart3,
      iconColor: cashFlowStatus === 'positive' ? 'from-emerald-400 to-green-500' : 'from-red-400 to-red-500',
      highlightSection: 'waterfall',
      content: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <TrendingUp className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(results.annualRevenue)}</p>
              <p className="text-xs text-white/80">Annual Fee Revenue</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
              <DollarSign className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-red-400">{formatCurrency(results.annualBudget)}</p>
              <p className="text-xs text-white/80">Annual Expenses</p>
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-xl border text-center",
            cashFlowStatus === 'positive' ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"
          )}>
            <p className={cn(
              "text-2xl font-bold",
              cashFlowStatus === 'positive' ? "text-emerald-400" : "text-red-400"
            )}>
              {cashFlowStatus === 'positive' ? '+' : ''}{formatCurrency(results.annualRevenue - results.annualBudget)}
            </p>
            <p className="text-white/80">Net Annual Cash Flow</p>
          </div>

          <p className="text-white/90 text-center">
            {cashFlowStatus === 'positive'
              ? "Your fee revenue exceeds expenses - a sustainable financial model."
              : "Expenses exceed fee revenue. You'll need to reduce costs or increase fund size/fees."}
          </p>
        </div>
      )
    },
    {
      id: 'expenses',
      title: 'Expense Breakdown',
      subtitle: 'Where does your budget go?',
      icon: PiggyBank,
      iconColor: 'from-violet-400 to-purple-500',
      highlightSection: 'expenses',
      content: () => {
        const teamPercent = Math.round((results.teamCost * 12 / results.annualBudget) * 100)
        const opsPercent = Math.round((results.opsCost * 12 / results.annualBudget) * 100)
        const overheadPercent = Math.round((results.overheadCost * 12 / results.annualBudget) * 100)

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Team */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    <span className="text-white">Team Compensation</span>
                  </div>
                  <span className="font-bold text-white">{formatCurrency(results.teamCost * 12)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                    style={{ width: `${teamPercent}%` }}
                  />
                </div>
                <p className="text-xs text-white/70">{teamPercent}% of total budget</p>
              </div>

              {/* Operations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-cyan-400" />
                    <span className="text-white">Operations</span>
                  </div>
                  <span className="font-bold text-white">{formatCurrency(results.opsCost * 12)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${opsPercent}%` }}
                  />
                </div>
                <p className="text-xs text-white/70">{opsPercent}% of total budget (admin, audit, legal, compliance, tax)</p>
              </div>

              {/* Overhead */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-400" />
                    <span className="text-white">Overhead</span>
                  </div>
                  <span className="font-bold text-white">{formatCurrency(results.overheadCost * 12)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${overheadPercent}%` }}
                  />
                </div>
                <p className="text-xs text-white/70">{overheadPercent}% of total budget (office, insurance, tech, travel)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-white">Industry Insight</span>
              </div>
              <p className="text-white/80">
                Team costs typically represent 60-70% of a management company budget. Operations and overhead split the remainder.
              </p>
            </div>
          </div>
        )
      }
    },
    {
      id: 'tools',
      title: 'Using This Tool',
      subtitle: 'How to get the most from your budget model',
      icon: Target,
      iconColor: 'from-cyan-400 to-blue-500',
      content: () => (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Adjust Team & Expenses</p>
                <p className="text-white/80">Click any expense item to modify. Add or remove team members as plans change.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Add Multiple Funds</p>
                <p className="text-white/80">Planning Fund II? Add it to see combined fee revenue projections.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Track Cash Flow</p>
                <p className="text-white/80">The monthly projection chart shows when you'll reach break-even.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Export & Share</p>
                <p className="text-white/80">Download your budget or bookmark to share with partners.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: "You're All Set!",
      subtitle: 'Your budget model is ready to explore',
      icon: CheckCircle2,
      iconColor: 'from-emerald-400 to-green-500',
      content: () => (
        <div className="space-y-6 text-center">
          <div className="space-y-3">
            <p className="text-lg text-white/80">
              Your management company budget is now set up and ready to use.
            </p>
            <p className="text-white/80">
              Feel free to adjust any values - all projections will update automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-sm text-emerald-400">
              Tip: Bookmark this page to save your budget and share with partners.
            </p>
          </div>
        </div>
      )
    }
  ]

  const step = steps[currentStep]
  const progress = Math.round(((currentStep + 1) / steps.length) * 100)

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      // Final step - trigger confetti and complete
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999
      })
      setTimeout(onComplete, 500)
    }
  }, [currentStep, steps.length, onComplete])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onSkip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, onSkip])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-slate-900/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Results Guide</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-white/80">{currentStep + 1}/{steps.length}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Skip</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="min-h-full flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg"
            >
              <div className="space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className={cn(
                    "w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center",
                    step.iconColor
                  )}
                >
                  <Icon className="h-8 w-8 text-white" />
                </motion.div>

                {/* Title */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-white/80">{step.subtitle}</p>
                </div>

                {/* Content */}
                <div className="pt-2">
                  {step.content(data, results)}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between bg-slate-900/95 backdrop-blur-sm border-t border-white/10">
        <div>
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={goPrev}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentStep ? "w-6 bg-emerald-400" :
                idx < currentStep ? "bg-emerald-400/40" : "bg-white/20"
              )}
            />
          ))}
        </div>

        <div>
          <Button
            onClick={goNext}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
          >
            {currentStep === steps.length - 1 ? 'Explore My Budget' : 'Continue'}
            {currentStep === steps.length - 1 ? <ArrowRight className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
