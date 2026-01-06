'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  DollarSign,
  Clock,
  Percent,
  Calculator,
  ArrowRight,
  Check,
  Trophy
} from 'lucide-react'
import { FundInputs, FeePhase, FundType } from './types'
import confetti from 'canvas-confetti'

interface JourneyModeProps {
  onComplete: (inputs: FundInputs, phases: FeePhase[]) => void
  onSkip: () => void
  existingData?: { inputs: FundInputs; phases: FeePhase[] } | null
}

// Step types
type StepType = 'welcome' | 'config' | 'input' | 'slider' | 'info' | 'celebration' | 'review'

interface JourneyStep {
  id: string
  type: StepType
  phase?: number
  phaseName?: string
  title: string
  subtitle?: string
  celebration?: boolean
}

// Phase configuration
const PHASES = [
  { id: 1, name: 'Fund Basics', icon: Building2 },
  { id: 2, name: 'Fee Structure', icon: Percent },
  { id: 3, name: 'Review', icon: Calculator },
]

const fundTypeOptions: { type: FundType; description: string; typicalFee: string; icon: string }[] = [
  { type: 'Private Equity', description: 'Buyouts, growth equity, special situations', typicalFee: '2.0%', icon: '🏢' },
  { type: 'Venture Capital', description: 'Early to late stage startups', typicalFee: '2.0-2.5%', icon: '🚀' },
  { type: 'Private Credit', description: 'Direct lending, mezzanine, distressed', typicalFee: '1.0-1.5%', icon: '💳' },
  { type: 'Real Estate', description: 'Property acquisition and development', typicalFee: '1.0-1.5%', icon: '🏠' },
  { type: 'Hedge Fund', description: 'Long/short, macro, quant strategies', typicalFee: '1.5-2.0%', icon: '📈' },
  { type: 'Other', description: 'Infrastructure, secondaries, custom', typicalFee: 'Varies', icon: '⚡' },
]

const fundTypeDefaults: Record<FundType, { feeRate: number; term: number; ip: number }> = {
  'Private Equity': { feeRate: 2.0, term: 10, ip: 5 },
  'Venture Capital': { feeRate: 2.0, term: 10, ip: 4 },
  'Private Credit': { feeRate: 1.25, term: 7, ip: 3 },
  'Real Estate': { feeRate: 1.5, term: 8, ip: 3 },
  'Hedge Fund': { feeRate: 1.5, term: 10, ip: 10 },
  'Other': { feeRate: 2.0, term: 10, ip: 5 }
}

export function JourneyMode({ onComplete, onSkip, existingData }: JourneyModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showWelcomeBack, setShowWelcomeBack] = useState(!!existingData)

  // Form state
  const [fundType, setFundType] = useState<FundType>(existingData?.inputs.fundType || 'Venture Capital')
  const [fundSize, setFundSize] = useState(existingData?.inputs.fundSize || 50)
  const [fundTerm, setFundTerm] = useState(existingData?.inputs.fundTerm || 10)
  const [investmentPeriod, setInvestmentPeriod] = useState(existingData?.inputs.investmentPeriod || 4)
  const [phase1Rate, setPhase1Rate] = useState(existingData?.phases?.[0]?.feeRate || 2.0)
  const [phase2Rate, setPhase2Rate] = useState(existingData?.phases?.[1]?.feeRate || 1.5)

  // Build steps
  const steps: JourneyStep[] = useMemo(() => [
    // Welcome
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Management Fee Calculator',
      subtitle: 'Model your fund\'s management fee structure and understand how it impacts GP economics over the fund lifecycle.',
    },

    // ========== PHASE 1: FUND BASICS ==========
    {
      id: 'phase-1-intro',
      type: 'info',
      phase: 1,
      phaseName: 'Fund Basics',
      title: 'Phase 1: Fund Basics',
      subtitle: 'Define your fund type and size',
    },
    {
      id: 'fund-type',
      type: 'config',
      phase: 1,
      phaseName: 'Fund Basics',
      title: 'What type of fund?',
      subtitle: 'Different fund types have different fee conventions',
    },
    {
      id: 'fund-size',
      type: 'input',
      phase: 1,
      phaseName: 'Fund Basics',
      title: 'Target fund size?',
      subtitle: 'Total capital commitments you\'re targeting',
    },
    {
      id: 'timeline',
      type: 'slider',
      phase: 1,
      phaseName: 'Fund Basics',
      title: 'Fund timeline',
      subtitle: 'How long is the fund term and investment period?',
    },
    {
      id: 'phase-1-complete',
      type: 'celebration',
      phase: 1,
      phaseName: 'Fund Basics',
      title: 'Fund Basics Set!',
      subtitle: 'Phase 1 of 3 done',
      celebration: true,
    },

    // ========== PHASE 2: FEE STRUCTURE ==========
    {
      id: 'phase-2-intro',
      type: 'info',
      phase: 2,
      phaseName: 'Fee Structure',
      title: 'Phase 2: Fee Structure',
      subtitle: 'Configure your management fee rates',
    },
    {
      id: 'fee-structure',
      type: 'slider',
      phase: 2,
      phaseName: 'Fee Structure',
      title: 'Fee rates',
      subtitle: 'Set your management fee rates for each period',
    },
    {
      id: 'phase-2-complete',
      type: 'celebration',
      phase: 2,
      phaseName: 'Fee Structure',
      title: 'Fee Structure Complete!',
      subtitle: 'Phase 2 of 3 done',
      celebration: true,
    },

    // ========== PHASE 3: REVIEW ==========
    {
      id: 'phase-3-intro',
      type: 'info',
      phase: 3,
      phaseName: 'Review',
      title: 'Phase 3: Review',
      subtitle: 'Confirm your fee model',
    },
    {
      id: 'review',
      type: 'review',
      phase: 3,
      phaseName: 'Review',
      title: 'Ready to calculate',
      subtitle: 'Review your inputs and see the full analysis',
    },
  ], [])

  const step = steps[currentStepIndex]
  const totalSteps = steps.length
  const progress = ((currentStepIndex + 1) / totalSteps) * 100

  // Current phase info
  const currentPhase = step?.phase
  const phaseName = step?.phaseName

  // Calculate completed phases
  const getCompletedPhases = useCallback(() => {
    const phases = new Set<number>()
    for (let i = 0; i < currentStepIndex; i++) {
      const s = steps[i]
      if (s?.celebration && s?.phase) {
        phases.add(s.phase)
      }
    }
    return phases
  }, [currentStepIndex, steps])
  const completedPhases = getCompletedPhases()

  // Trigger celebration
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#f97316', '#eab308', '#22c55e'],
    })
  }, [])

  useEffect(() => {
    if (step?.celebration) {
      triggerCelebration()
    }
  }, [step?.celebration, triggerCelebration])

  // Navigation
  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setDirection(1)
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // Complete the journey
      const inputs: FundInputs = {
        fundType,
        fundSize,
        fundTerm,
        investmentPeriod,
        gpCommitment: 2,
        navGrowthRate: 0
      }

      const phases: FeePhase[] = [
        {
          id: 'phase-1',
          startYear: 1,
          endYear: investmentPeriod,
          feeBase: 'Committed Capital',
          feeRate: phase1Rate
        },
        {
          id: 'phase-2',
          startYear: investmentPeriod + 1,
          endYear: fundTerm,
          feeBase: 'Invested Cost',
          feeRate: phase2Rate
        }
      ]

      onComplete(inputs, phases)
    }
  }, [currentStepIndex, steps.length, fundType, fundSize, fundTerm, investmentPeriod, phase1Rate, phase2Rate, onComplete])

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1)
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  // Auto-advance helper (250ms delay for selections)
  const autoAdvance = useCallback(() => {
    setTimeout(goNext, 250)
  }, [goNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (step.type === 'info' || step.type === 'celebration' || step.type === 'welcome') {
            e.preventDefault()
            goNext()
          }
          break
        case 'ArrowLeft':
        case 'Backspace':
          if (currentStepIndex > 0) {
            e.preventDefault()
            goBack()
          }
          break
        case 'Escape':
          onSkip()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, currentStepIndex, goNext, goBack, onSkip])

  const handleFundTypeSelect = (type: FundType) => {
    setFundType(type)
    const defaults = fundTypeDefaults[type]
    setFundTerm(defaults.term)
    setInvestmentPeriod(defaults.ip)
    setPhase1Rate(defaults.feeRate)
    setPhase2Rate(Math.max(defaults.feeRate - 0.5, 0.75))
    autoAdvance()
  }

  const handleContinueExisting = () => {
    if (existingData) {
      onComplete(existingData.inputs, existingData.phases)
    }
  }

  const handleStartFresh = () => {
    setShowWelcomeBack(false)
    setCurrentStepIndex(0)
  }

  // Calculate preview values
  const totalFees = (fundSize * phase1Rate / 100 * investmentPeriod) +
                    (fundSize * 0.7 * phase2Rate / 100 * (fundTerm - investmentPeriod))

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      y: direction > 0 ? -40 : 40,
      opacity: 0,
    }),
  }

  // Welcome back modal for returning users
  if (showWelcomeBack) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg mx-4 p-8 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">
              You have a previous fee model saved. Would you like to continue where you left off?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinueExisting}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-400 hover:to-orange-400 transition-all active:scale-[0.98]"
            >
              Continue with saved model
            </button>
            <button
              onClick={handleStartFresh}
              className="w-full p-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all border border-slate-700 active:scale-[0.98]"
            >
              Start fresh
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />

      {/* Header */}
      <div className="relative flex-shrink-0 border-b border-slate-800">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 pt-4">
          <div className="flex items-center gap-2 min-w-0">
            {currentPhase && (
              <>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-slate-900 text-xs font-bold flex items-center justify-center">
                  {currentPhase}
                </span>
                <span className="text-sm font-medium truncate text-white">{phaseName}</span>
              </>
            )}
            {!currentPhase && <span className="text-sm text-slate-400">Getting started</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="flex-shrink-0 text-slate-400 hover:text-white"
          >
            Skip
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Phase dots */}
        {step.type !== 'welcome' && (
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {PHASES.map((phase) => (
              <div
                key={phase.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  completedPhases.has(phase.id)
                    ? "bg-emerald-500"
                    : phase.id === currentPhase
                    ? "bg-amber-400 w-4"
                    : "bg-slate-700"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="relative flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-6 pb-24 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="min-h-[60vh] flex flex-col"
            >
              {/* Welcome Step */}
              {step.type === 'welcome' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20"
                  >
                    <DollarSign className="h-10 w-10 text-white" />
                  </motion.div>

                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{step.title}</h1>
                    <p className="text-slate-400 max-w-md">{step.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~2 min
                    </span>
                    <span>•</span>
                    <span>3 phases</span>
                    <span>•</span>
                    <span>Saved locally</span>
                  </div>

                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button
                      size="lg"
                      onClick={goNext}
                      className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-semibold"
                    >
                      Start Journey
                      <ChevronRight className="ml-1 h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onSkip}
                      className="text-slate-400 hover:text-white"
                    >
                      Skip to calculator
                    </Button>
                  </div>
                </div>
              )}

              {/* Info/Phase Intro Steps */}
              {step.type === 'info' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                  <div className="bg-slate-800/50 p-4 rounded-2xl">
                    {step.phase === 1 && <Building2 className="h-10 w-10 text-amber-400" />}
                    {step.phase === 2 && <Percent className="h-10 w-10 text-amber-400" />}
                    {step.phase === 3 && <Calculator className="h-10 w-10 text-amber-400" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={goNext}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-semibold"
                  >
                    Continue
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Celebration Steps */}
              {step.type === 'celebration' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                  >
                    <Trophy className="h-10 w-10 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={goNext}
                    className="bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-900 font-semibold"
                  >
                    Continue
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Fund Type Step */}
              {step.id === 'fund-type' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Building2 className="h-6 w-6 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {fundTypeOptions.map((option) => (
                        <motion.button
                          key={option.type}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleFundTypeSelect(option.type)}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all",
                            fundType === option.type
                              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-400/50'
                              : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                          )}
                        >
                          <div className="text-2xl mb-2">{option.icon}</div>
                          <div className="font-semibold text-white text-sm mb-1">{option.type}</div>
                          <div className="text-xs text-slate-500 mb-2 line-clamp-2">{option.description}</div>
                          <div className="text-xs font-medium text-amber-400">{option.typicalFee} typical</div>
                          {fundType === option.type && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              className="absolute top-2 right-2"
                            >
                              <Check className="h-4 w-4 text-amber-400" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fund Size Step */}
              {step.id === 'fund-size' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <DollarSign className="h-6 w-6 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                      <Input
                        type="number"
                        value={fundSize}
                        onChange={(e) => setFundSize(parseFloat(e.target.value) || 50)}
                        className="pl-10 pr-16 h-16 text-3xl font-bold text-center bg-slate-800/50 border-slate-700 text-white focus:border-amber-400 focus:ring-amber-400/20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">million</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {[25, 50, 100, 150, 200, 500].map((size) => (
                        <button
                          key={size}
                          onClick={() => setFundSize(size)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.98]",
                            fundSize === size
                              ? 'bg-amber-400 text-slate-900'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          )}
                        >
                          ${size}M
                        </button>
                      ))}
                    </div>

                    <p className="text-center text-sm text-slate-500 mt-6">
                      At ${fundSize}M, your annual management fee income would be approximately ${(fundSize * phase1Rate / 100).toFixed(1)}M
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline Step */}
              {step.id === 'timeline' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Clock className="h-6 w-6 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium">Fund Term</span>
                        <span className="text-2xl font-bold text-amber-400">{fundTerm} years</span>
                      </div>
                      <Slider
                        value={[fundTerm]}
                        onValueChange={([v]) => {
                          setFundTerm(v)
                          if (investmentPeriod > v - 2) setInvestmentPeriod(Math.max(2, v - 2))
                        }}
                        min={5}
                        max={15}
                        step={1}
                        className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-400 [&_.bg-primary]:bg-amber-400"
                      />
                      <p className="text-xs text-slate-500 mt-2">Total lifecycle of the fund</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium">Investment Period</span>
                        <span className="text-2xl font-bold text-amber-400">{investmentPeriod} years</span>
                      </div>
                      <Slider
                        value={[investmentPeriod]}
                        onValueChange={([v]) => setInvestmentPeriod(v)}
                        min={2}
                        max={fundTerm - 2}
                        step={1}
                        className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-400 [&_.bg-primary]:bg-amber-400"
                      />
                      <p className="text-xs text-slate-500 mt-2">Period when new investments can be made</p>
                    </div>

                    {/* Visual timeline */}
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${(investmentPeriod / fundTerm) * 100}%` }} />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-slate-600" />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Year 1</span>
                        <span>Investment Period (Yr 1-{investmentPeriod})</span>
                        <span>Harvest (Yr {investmentPeriod + 1}-{fundTerm})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fee Structure Step */}
              {step.id === 'fee-structure' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Percent className="h-6 w-6 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="text-white font-medium">Investment Period Fee</span>
                          <p className="text-xs text-slate-400">Years 1-{investmentPeriod} on committed capital</p>
                        </div>
                        <span className="text-3xl font-bold text-amber-400">{phase1Rate.toFixed(2)}%</span>
                      </div>
                      <Slider
                        value={[phase1Rate]}
                        onValueChange={([v]) => setPhase1Rate(v)}
                        min={0.5}
                        max={3.0}
                        step={0.1}
                        className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-400 [&_.bg-primary]:bg-amber-400"
                      />
                    </div>

                    <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="text-white font-medium">Harvest Period Fee</span>
                          <p className="text-xs text-slate-400">Years {investmentPeriod + 1}-{fundTerm} on invested capital</p>
                        </div>
                        <span className="text-3xl font-bold text-slate-300">{phase2Rate.toFixed(2)}%</span>
                      </div>
                      <Slider
                        value={[phase2Rate]}
                        onValueChange={([v]) => setPhase2Rate(v)}
                        min={0.5}
                        max={2.5}
                        step={0.1}
                        className="[&_[role=slider]]:bg-slate-400 [&_[role=slider]]:border-slate-400"
                      />
                    </div>

                    <div className="text-center p-4 rounded-xl bg-slate-800/30">
                      <p className="text-slate-400 text-sm">Estimated total fees over fund life</p>
                      <p className="text-3xl font-bold text-white mt-1">${totalFees.toFixed(1)}M</p>
                      <p className="text-xs text-slate-500 mt-1">{((totalFees / fundSize) * 100).toFixed(1)}% of commitments</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {step.id === 'review' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
                      <Calculator className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1">
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Fund Type</span>
                        <span className="text-white font-semibold">{fundType}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Fund Size</span>
                        <span className="text-white font-semibold">${fundSize}M</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Timeline</span>
                        <span className="text-white font-semibold">{fundTerm} years ({investmentPeriod}yr IP)</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Fee Rates</span>
                        <span className="text-white font-semibold">{phase1Rate}% → {phase2Rate}%</span>
                      </div>
                    </div>

                    <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-center">
                      <p className="text-slate-300 text-sm mb-1">Estimated Total Management Fees</p>
                      <p className="text-4xl font-bold text-white">${totalFees.toFixed(1)}M</p>
                      <p className="text-amber-400 text-sm mt-1">over {fundTerm} years</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="relative flex-shrink-0 border-t border-slate-800 p-4 pb-safe bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>

          <div className="text-xs text-slate-500">
            {currentStepIndex + 1} / {totalSteps}
          </div>

          {(step.type === 'input' || step.type === 'slider' || step.type === 'review') && (
            <Button
              onClick={goNext}
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-semibold"
            >
              {isLastStep ? (
                <>
                  See Analysis
                  <Check className="ml-1 h-5 w-5" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-1 h-5 w-5" />
                </>
              )}
            </Button>
          )}

          {(step.type !== 'input' && step.type !== 'slider' && step.type !== 'review' && step.type !== 'welcome' && step.type !== 'info' && step.type !== 'celebration' && step.type !== 'config') && (
            <div className="w-24" /> // Spacer for layout balance
          )}
        </div>

        {/* Keyboard hints */}
        <div className="text-center text-xs text-slate-600 mt-2">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-0.5">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-0.5">→</kbd>
          navigate
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-0.5">Esc</kbd>
          skip
        </div>
      </div>
    </div>
  )
}
