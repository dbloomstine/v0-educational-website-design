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
  Sparkles,
  TrendingUp,
  Building2,
  Layers,
  Target,
  Percent,
  PieChart,
  Users,
  Clock,
  ArrowRight,
  Check,
  Calculator,
  Trophy,
  Zap,
  BarChart3
} from 'lucide-react'
import { WaterfallInput } from './waterfallCalculations'
import confetti from 'canvas-confetti'

interface JourneyModeProps {
  onComplete: (input: WaterfallInput) => void
  onSkip: () => void
  existingData?: WaterfallInput | null
}

// Step types
type StepType = 'welcome' | 'config' | 'slider' | 'input' | 'info' | 'celebration' | 'review'

interface JourneyStep {
  id: string
  type: StepType
  phase?: number
  phaseName?: string
  title: string
  subtitle?: string
  tip?: string
  celebration?: boolean
}

// Phase configuration
const PHASES = [
  { id: 1, name: 'Fund Setup', icon: Building2 },
  { id: 2, name: 'Waterfall Structure', icon: Layers },
  { id: 3, name: 'Fee Terms', icon: Percent },
  { id: 4, name: 'Review', icon: Calculator },
]

export function JourneyMode({ onComplete, onSkip, existingData }: JourneyModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showWelcomeBack, setShowWelcomeBack] = useState(!!existingData)

  // Form state
  const [fundSize, setFundSize] = useState(existingData?.fundSize || 100000000)
  const [contributedCapital, setContributedCapital] = useState(existingData?.contributedCapital || 100000000)
  const [grossProceeds, setGrossProceeds] = useState(existingData?.grossProceeds || 200000000)
  const [waterfallType, setWaterfallType] = useState<'european' | 'american'>(existingData?.waterfallType || 'european')
  const [prefRate, setPrefRate] = useState(existingData?.prefRate || 0.08)
  const [prefCompounding, setPrefCompounding] = useState<'simple' | 'compound'>(existingData?.prefCompounding || 'simple')
  const [catchUpRate, setCatchUpRate] = useState(existingData?.catchUpRate || 1.0)
  const [hasCatchUp, setHasCatchUp] = useState(existingData?.hasCatchUp ?? true)
  const [carryRate, setCarryRate] = useState(existingData?.carryRate || 0.20)
  const [gpCommitmentPercent, setGpCommitmentPercent] = useState(existingData?.gpCommitmentPercent || 0.02)
  const [yearsToExit, setYearsToExit] = useState(existingData?.yearsToExit || 5)

  // Build steps based on current state
  const steps: JourneyStep[] = useMemo(() => [
    // Welcome
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Distribution Waterfall',
      subtitle: 'Model how fund proceeds flow through preferred return, GP catch-up, and carried interest tiers.',
    },

    // ========== PHASE 1: FUND SETUP ==========
    {
      id: 'phase-1-intro',
      type: 'info',
      phase: 1,
      phaseName: 'Fund Setup',
      title: 'Phase 1: Fund Setup',
      subtitle: 'Define your fund size and basic parameters',
    },
    {
      id: 'fund-size',
      type: 'input',
      phase: 1,
      phaseName: 'Fund Setup',
      title: 'How much is your fund?',
      subtitle: 'Total committed capital from LPs',
    },
    {
      id: 'gross-proceeds',
      type: 'input',
      phase: 1,
      phaseName: 'Fund Setup',
      title: 'Expected gross proceeds?',
      subtitle: 'Total value at exit (typically 1.5-3x fund size)',
    },
    {
      id: 'years-to-exit',
      type: 'slider',
      phase: 1,
      phaseName: 'Fund Setup',
      title: 'Years to exit?',
      subtitle: 'Investment holding period',
    },
    {
      id: 'phase-1-complete',
      type: 'celebration',
      phase: 1,
      phaseName: 'Fund Setup',
      title: 'Fund Setup Complete!',
      subtitle: 'Phase 1 of 4 done',
      celebration: true,
    },

    // ========== PHASE 2: WATERFALL STRUCTURE ==========
    {
      id: 'phase-2-intro',
      type: 'info',
      phase: 2,
      phaseName: 'Waterfall Structure',
      title: 'Phase 2: Waterfall Structure',
      subtitle: 'Choose how profits flow to LPs and GP',
    },
    {
      id: 'waterfall-type',
      type: 'config',
      phase: 2,
      phaseName: 'Waterfall Structure',
      title: 'What waterfall structure?',
      subtitle: 'This determines when the GP can receive carry',
    },
    {
      id: 'preferred-return',
      type: 'slider',
      phase: 2,
      phaseName: 'Waterfall Structure',
      title: 'What is the preferred return?',
      subtitle: 'The annual hurdle LPs must receive before GP earns carry',
    },
    {
      id: 'pref-compounding',
      type: 'config',
      phase: 2,
      phaseName: 'Waterfall Structure',
      title: 'How is the pref calculated?',
      subtitle: 'Simple or compound interest on the hurdle',
    },
    {
      id: 'phase-2-complete',
      type: 'celebration',
      phase: 2,
      phaseName: 'Waterfall Structure',
      title: 'Structure Defined!',
      subtitle: 'Phase 2 of 4 done',
      celebration: true,
    },

    // ========== PHASE 3: FEE TERMS ==========
    {
      id: 'phase-3-intro',
      type: 'info',
      phase: 3,
      phaseName: 'Fee Terms',
      title: 'Phase 3: Fee Terms',
      subtitle: 'Configure GP economics and catch-up',
    },
    {
      id: 'catch-up',
      type: 'config',
      phase: 3,
      phaseName: 'Fee Terms',
      title: 'Enable GP catch-up?',
      subtitle: 'Allows GP to catch up to their target carry percentage',
    },
    ...(hasCatchUp ? [{
      id: 'catch-up-rate',
      type: 'slider' as StepType,
      phase: 3,
      phaseName: 'Fee Terms',
      title: 'Catch-up rate?',
      subtitle: 'Percentage of distributions to GP during catch-up',
    }] : []),
    {
      id: 'carried-interest',
      type: 'slider',
      phase: 3,
      phaseName: 'Fee Terms',
      title: 'What is the carry rate?',
      subtitle: "GP's share of profits after clearing the hurdle",
    },
    {
      id: 'gp-commitment',
      type: 'slider',
      phase: 3,
      phaseName: 'Fee Terms',
      title: 'GP commitment size?',
      subtitle: 'How much skin in the game does the GP have?',
    },
    {
      id: 'phase-3-complete',
      type: 'celebration',
      phase: 3,
      phaseName: 'Fee Terms',
      title: 'Fee Terms Set!',
      subtitle: 'Phase 3 of 4 done',
      celebration: true,
    },

    // ========== PHASE 4: REVIEW ==========
    {
      id: 'phase-4-intro',
      type: 'info',
      phase: 4,
      phaseName: 'Review',
      title: 'Phase 4: Review',
      subtitle: 'Confirm your waterfall parameters',
    },
    {
      id: 'review',
      type: 'review',
      phase: 4,
      phaseName: 'Review',
      title: 'Ready to visualize',
      subtitle: 'Review your waterfall parameters',
    },
  ], [hasCatchUp])

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
      colors: ['#a855f7', '#8b5cf6', '#6366f1', '#22c55e'],
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
      const input: WaterfallInput = {
        fundSize,
        contributedCapital,
        grossProceeds,
        waterfallType,
        prefRate,
        prefCompounding,
        carryRate,
        catchUpRate,
        hasCatchUp,
        yearsToExit,
        gpCommitmentPercent
      }
      onComplete(input)
    }
  }, [currentStepIndex, steps.length, fundSize, contributedCapital, grossProceeds, waterfallType, prefRate, prefCompounding, carryRate, catchUpRate, hasCatchUp, yearsToExit, gpCommitmentPercent, onComplete])

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
        case '1':
        case 'y':
        case 'Y':
          if (step.id === 'catch-up') {
            setHasCatchUp(true)
            autoAdvance()
          }
          break
        case '2':
        case 'n':
        case 'N':
          if (step.id === 'catch-up') {
            setHasCatchUp(false)
            autoAdvance()
          }
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, currentStepIndex, goNext, goBack, onSkip, autoAdvance])

  const handleContinueExisting = () => {
    if (existingData) {
      onComplete(existingData)
    }
  }

  const handleStartFresh = () => {
    setShowWelcomeBack(false)
    setCurrentStepIndex(0)
  }

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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">
              You have a previous waterfall model saved. Would you like to continue where you left off?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinueExisting}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium hover:from-purple-400 hover:to-violet-400 transition-all active:scale-[0.98]"
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

      {/* Header */}
      <div className="relative flex-shrink-0 border-b border-slate-800">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 pt-4">
          <div className="flex items-center gap-2 min-w-0">
            {currentPhase && (
              <>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
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
                    ? "bg-primary w-4"
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
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
                  >
                    <Sparkles className="h-10 w-10 text-white" />
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
                    <span>4 phases</span>
                    <span>•</span>
                    <span>Saved locally</span>
                  </div>

                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button
                      size="lg"
                      onClick={goNext}
                      className="w-full bg-gradient-to-r from-purple-400 to-violet-500 hover:from-purple-300 hover:to-violet-400 text-slate-900 font-semibold"
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
                    {step.phase === 1 && <Building2 className="h-10 w-10 text-purple-400" />}
                    {step.phase === 2 && <Layers className="h-10 w-10 text-purple-400" />}
                    {step.phase === 3 && <Percent className="h-10 w-10 text-purple-400" />}
                    {step.phase === 4 && <Calculator className="h-10 w-10 text-purple-400" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={goNext}
                    className="bg-gradient-to-r from-purple-400 to-violet-500 hover:from-purple-300 hover:to-violet-400 text-slate-900 font-semibold"
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

              {/* Fund Size Step */}
              {step.id === 'fund-size' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Building2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                      <Input
                        type="number"
                        value={fundSize / 1000000}
                        onChange={(e) => {
                          const sizeM = parseFloat(e.target.value) || 100
                          setFundSize(sizeM * 1000000)
                          setContributedCapital(sizeM * 1000000)
                        }}
                        className="pl-10 pr-16 h-16 text-3xl font-bold text-center bg-slate-800/50 border-slate-700 text-white focus:border-purple-400 focus:ring-purple-400/20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">million</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {[50, 100, 200, 500, 1000].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setFundSize(size * 1000000)
                            setContributedCapital(size * 1000000)
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.98]",
                            fundSize === size * 1000000
                              ? 'bg-purple-400 text-slate-900'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          )}
                        >
                          ${size}M
                        </button>
                      ))}
                    </div>

                    <p className="text-center text-sm text-slate-500 mt-6">
                      Typical ranges: Micro VC ($10-50M), Early-stage VC ($50-250M), Buyout PE ($500M-5B)
                    </p>
                  </div>
                </div>
              )}

              {/* Gross Proceeds Step */}
              {step.id === 'gross-proceeds' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <TrendingUp className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                      <Input
                        type="number"
                        value={grossProceeds / 1000000}
                        onChange={(e) => {
                          const proceedsM = parseFloat(e.target.value) || 200
                          setGrossProceeds(proceedsM * 1000000)
                        }}
                        className="pl-10 pr-16 h-16 text-3xl font-bold text-center bg-slate-800/50 border-slate-700 text-white focus:border-purple-400 focus:ring-purple-400/20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">million</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {[1.5, 2.0, 2.5, 3.0].map((multiple) => (
                        <button
                          key={multiple}
                          onClick={() => {
                            setGrossProceeds(fundSize * multiple)
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.98]",
                            grossProceeds === fundSize * multiple
                              ? 'bg-purple-400 text-slate-900'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          )}
                        >
                          {multiple}x
                        </button>
                      ))}
                    </div>

                    <div className="text-center p-4 rounded-xl bg-slate-800/30">
                      <p className="text-slate-400 text-sm">Fund multiple (TVPI)</p>
                      <p className="text-3xl font-bold text-purple-400 mt-1">
                        {(grossProceeds / fundSize).toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Years to Exit Step */}
              {step.id === 'years-to-exit' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Clock className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium">Holding Period</span>
                        <span className="text-2xl font-bold text-purple-400">{yearsToExit} years</span>
                      </div>
                      <Slider
                        value={[yearsToExit]}
                        onValueChange={([v]) => setYearsToExit(v)}
                        min={1}
                        max={10}
                        step={1}
                        className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>1 year</span>
                        <span>5 years (typical)</span>
                        <span>10 years</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waterfall Type Step */}
              {step.id === 'waterfall-type' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Layers className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="grid gap-4">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setWaterfallType('european')
                          autoAdvance()
                        }}
                        className={cn(
                          "p-6 rounded-xl text-left transition-all",
                          waterfallType === 'european'
                            ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                            : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">🇪🇺</div>
                          <h4 className="font-semibold text-white text-lg">European (Whole-Fund)</h4>
                          {waterfallType === 'european' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            >
                              <Check className="h-5 w-5 text-purple-400" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                          GP receives carry only after the entire fund returns capital + preferred return to all LPs
                        </p>
                        <ul className="text-xs text-slate-500 space-y-1">
                          <li>✓ More LP-friendly</li>
                          <li>✓ Standard in buyout PE</li>
                          <li>✓ No clawback needed</li>
                        </ul>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setWaterfallType('american')
                          autoAdvance()
                        }}
                        className={cn(
                          "p-6 rounded-xl text-left transition-all",
                          waterfallType === 'american'
                            ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                            : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">🇺🇸</div>
                          <h4 className="font-semibold text-white text-lg">American (Deal-by-Deal)</h4>
                          {waterfallType === 'american' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            >
                              <Check className="h-5 w-5 text-purple-400" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                          GP can receive carry on individual profitable deals before full fund is returned
                        </p>
                        <ul className="text-xs text-slate-500 space-y-1">
                          <li>✓ Earlier GP carry</li>
                          <li>✓ Common in VC</li>
                          <li>✓ Requires clawback provision</li>
                        </ul>
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferred Return Step */}
              {step.id === 'preferred-return' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Target className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium">Preferred Return Rate</span>
                        <span className="text-2xl font-bold text-purple-400">{(prefRate * 100).toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[prefRate * 100]}
                        onValueChange={([v]) => setPrefRate(v / 100)}
                        min={0}
                        max={12}
                        step={0.5}
                        className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>0% (No hurdle)</span>
                        <span>8% (Standard)</span>
                        <span>12%</span>
                      </div>
                    </div>

                    {prefRate > 0 && (
                      <div className="text-center p-4 rounded-xl bg-slate-800/30">
                        <p className="text-slate-400 text-sm">Over {yearsToExit} years, LPs get</p>
                        <p className="text-3xl font-bold text-white mt-1">
                          ${(prefCompounding === 'simple'
                            ? contributedCapital * prefRate * yearsToExit
                            : contributedCapital * (Math.pow(1 + prefRate, yearsToExit) - 1)
                          / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-slate-500 mt-1">in preferred return ({prefCompounding})</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pref Compounding Step */}
              {step.id === 'pref-compounding' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <BarChart3 className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setPrefCompounding('simple')
                          autoAdvance()
                        }}
                        className={cn(
                          "p-6 rounded-xl text-center transition-all",
                          prefCompounding === 'simple'
                            ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                            : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                        )}
                      >
                        <div className="font-semibold text-white mb-1">Simple</div>
                        <div className="text-xs text-slate-400">Linear calculation</div>
                        {prefCompounding === 'simple' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="mt-2"
                          >
                            <Check className="h-5 w-5 text-purple-400 mx-auto" />
                          </motion.div>
                        )}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setPrefCompounding('compound')
                          autoAdvance()
                        }}
                        className={cn(
                          "p-6 rounded-xl text-center transition-all",
                          prefCompounding === 'compound'
                            ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                            : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                        )}
                      >
                        <div className="font-semibold text-white mb-1">Compound</div>
                        <div className="text-xs text-slate-400">Compounds annually</div>
                        {prefCompounding === 'compound' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="mt-2"
                          >
                            <Check className="h-5 w-5 text-purple-400 mx-auto" />
                          </motion.div>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Catch-Up Step */}
              {step.id === 'catch-up' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <PieChart className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setHasCatchUp(true)
                          autoAdvance()
                        }}
                        className={cn(
                          "p-6 rounded-xl text-center transition-all",
                          hasCatchUp
                            ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-400/50'
                            : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                        )}
                      >
                        <div className="text-3xl mb-2">✓</div>
                        <div className="font-semibold text-white">Yes</div>
                        <div className="text-xs text-slate-400 mt-1">Enable catch-up</div>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setHasCatchUp(false)
                          autoAdvance()
                        }}
                        className={cn(
                          "p-6 rounded-xl text-center transition-all",
                          !hasCatchUp
                            ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                            : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                        )}
                      >
                        <div className="text-3xl mb-2">✗</div>
                        <div className="font-semibold text-white">No</div>
                        <div className="text-xs text-slate-400 mt-1">Skip catch-up</div>
                      </motion.button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/30">
                      <p className="text-sm text-slate-300">
                        {hasCatchUp
                          ? `After LPs receive their pref, GP gets 100% of distributions until they've received ${(carryRate * 100).toFixed(0)}% of total profits.`
                          : `Without catch-up, GP earns ${(carryRate * 100).toFixed(0)}% carry only on profits ABOVE the preferred return.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Catch-Up Rate Step */}
              {step.id === 'catch-up-rate' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Zap className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium">Catch-Up Rate</span>
                        <span className="text-2xl font-bold text-purple-400">{(catchUpRate * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[catchUpRate * 100]}
                        onValueChange={([v]) => setCatchUpRate(v / 100)}
                        min={50}
                        max={100}
                        step={10}
                        className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                      />
                      <p className="text-xs text-slate-500 mt-2">100% = GP gets all distributions during catch-up phase</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Carried Interest Step */}
              {step.id === 'carried-interest' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Percent className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium">Carried Interest Rate</span>
                        <span className="text-2xl font-bold text-purple-400">{(carryRate * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[carryRate * 100]}
                        onValueChange={([v]) => setCarryRate(v / 100)}
                        min={10}
                        max={30}
                        step={1}
                        className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>10%</span>
                        <span>20% (Standard)</span>
                        <span>30%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {[15, 20, 25, 30].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setCarryRate(rate / 100)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.98]",
                            carryRate === rate / 100
                              ? 'bg-purple-400 text-slate-900'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          )}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-400/20 text-center">
                      <p className="text-slate-300 text-sm mb-1">At a {(grossProceeds / fundSize).toFixed(1)}x return</p>
                      <p className="text-3xl font-bold text-white">
                        ${((grossProceeds - contributedCapital) * carryRate / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-purple-400 text-sm mt-1">potential GP carry</p>
                    </div>
                  </div>
                </div>
              )}

              {/* GP Commitment Step */}
              {step.id === 'gp-commitment' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                      <Users className="h-6 w-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-medium">GP Commitment</span>
                        <span className="text-2xl font-bold text-purple-400">{(gpCommitmentPercent * 100).toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[gpCommitmentPercent * 100]}
                        onValueChange={([v]) => setGpCommitmentPercent(v / 100)}
                        min={0.5}
                        max={5}
                        step={0.5}
                        className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>0.5%</span>
                        <span>2-3% (Typical)</span>
                        <span>5%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {[1, 2, 3, 5].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setGpCommitmentPercent(rate / 100)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.98]",
                            gpCommitmentPercent === rate / 100
                              ? 'bg-purple-400 text-slate-900'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          )}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>

                    <div className="text-center p-4 rounded-xl bg-slate-800/30">
                      <p className="text-slate-400 text-sm">GP commitment amount</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        ${((fundSize * gpCommitmentPercent) / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-slate-500 mt-1">of the ${(fundSize / 1000000).toFixed(0)}M fund</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {step.id === 'review' && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 mb-4">
                      <Calculator className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-slate-400">{step.subtitle}</p>
                  </div>

                  <div className="flex-1">
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Fund Size</span>
                        <span className="text-white font-semibold">${(fundSize / 1000000).toFixed(0)}M</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Gross Proceeds</span>
                        <span className="text-white font-semibold">${(grossProceeds / 1000000).toFixed(0)}M ({(grossProceeds / fundSize).toFixed(1)}x)</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Waterfall Type</span>
                        <span className="text-white font-semibold capitalize">{waterfallType}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Preferred Return</span>
                        <span className="text-white font-semibold">{(prefRate * 100).toFixed(1)}% ({prefCompounding})</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Carried Interest</span>
                        <span className="text-white font-semibold">{(carryRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">Catch-Up</span>
                        <span className="text-white font-semibold">{hasCatchUp ? `${(catchUpRate * 100).toFixed(0)}%` : 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                        <span className="text-slate-400">GP Commitment</span>
                        <span className="text-white font-semibold">{(gpCommitmentPercent * 100).toFixed(1)}%</span>
                      </div>
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
              className="bg-gradient-to-r from-purple-400 to-violet-500 hover:from-purple-300 hover:to-violet-400 text-slate-900 font-semibold"
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

          {(step.type !== 'input' && step.type !== 'slider' && step.type !== 'review' && step.type !== 'welcome' && step.type !== 'info' && step.type !== 'celebration') && (
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
