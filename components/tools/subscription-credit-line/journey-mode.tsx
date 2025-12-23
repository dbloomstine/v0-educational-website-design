"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronLeft,
  Rocket,
  Check,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Clock,
  Building2,
  Target,
  Zap,
  AlertCircle,
  Info,
  SkipForward,
  Award,
  Activity,
  Percent,
  Calendar,
  CreditCard,
  CircleDollarSign,
  Sparkles,
  BookOpen,
  Settings,
  ClipboardCheck,
} from 'lucide-react'
import { SubscriptionLineInput } from './subscriptionLineCalculations'
import confetti from 'canvas-confetti'

// Define phases for display
const PHASES = [
  { id: 1, name: 'Learn', icon: BookOpen },
  { id: 2, name: 'Fund Setup', icon: Building2 },
  { id: 3, name: 'Facility', icon: Settings },
  { id: 4, name: 'Review', icon: ClipboardCheck },
]

// Journey step types
type StepType = 'welcome' | 'info' | 'input' | 'select' | 'review' | 'celebration'

interface JourneyStep {
  id: string
  type: StepType
  phase: number
  phaseName: string
  title: string
  subtitle?: string
  tip?: string
  educationalContent?: React.ReactNode
  isCelebration?: boolean
}

// Fund strategy options for context
const FUND_STRATEGIES = [
  {
    id: 'pe',
    name: 'Private Equity',
    icon: Building2,
    description: 'Buyout funds, typical users of sub lines',
    typicalSize: 200,
    typicalFacility: 0.20,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'vc',
    name: 'Venture Capital',
    icon: Rocket,
    description: 'Growth equity and VC funds',
    typicalSize: 100,
    typicalFacility: 0.15,
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'credit',
    name: 'Private Credit',
    icon: CircleDollarSign,
    description: 'Direct lending and credit funds',
    typicalSize: 150,
    typicalFacility: 0.15,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 're',
    name: 'Real Estate',
    icon: Building2,
    description: 'Real estate funds',
    typicalSize: 150,
    typicalFacility: 0.20,
    color: 'from-rose-500 to-pink-600'
  }
]

// Facility size options
const FACILITY_OPTIONS = [
  { value: 0.10, label: '10%', description: 'Very conservative', ilpa: false },
  { value: 0.15, label: '15%', description: 'ILPA lower bound', ilpa: true },
  { value: 0.20, label: '20%', description: 'Market standard', ilpa: true },
  { value: 0.25, label: '25%', description: 'ILPA upper bound', ilpa: true },
  { value: 0.30, label: '30%', description: 'Aggressive (exceeds ILPA)', ilpa: false }
]

// Days outstanding options
const DAYS_OPTIONS = [
  { value: 90, label: '90 days', description: 'Traditional/Conservative' },
  { value: 120, label: '120 days', description: 'Moderate' },
  { value: 180, label: '180 days', description: 'ILPA recommended max' },
  { value: 270, label: '270 days', description: 'Extended (exceeds ILPA)' },
  { value: 360, label: '360 days', description: 'Aggressive (exceeds ILPA)' }
]

// Interest rate options (current market 2024-2025)
const RATE_OPTIONS = [
  { value: 0.035, label: '3.5%', description: 'Lower end' },
  { value: 0.04, label: '4.0%', description: 'Common' },
  { value: 0.045, label: '4.5%', description: 'Market average' },
  { value: 0.05, label: '5.0%', description: 'Higher end' },
  { value: 0.055, label: '5.5%', description: 'Upper range' }
]

// Journey steps definition
const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'welcome',
    type: 'welcome',
    phase: 0,
    phaseName: 'Welcome',
    title: 'Subscription Credit Lines Explained',
    subtitle: 'Learn how subscription lines affect fund performance in just a few minutes'
  },
  {
    id: 'what-is',
    type: 'info',
    phase: 1,
    phaseName: 'Learn',
    title: 'What is a Subscription Credit Line?',
    subtitle: 'Also called capital call facilities or sub lines',
    educationalContent: (
      <div className="space-y-4 text-left">
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
            <Info className="h-5 w-5 text-indigo-400" />
            The Basics
          </h4>
          <p className="text-sm text-slate-300">
            A subscription line is a revolving credit facility secured by LP capital commitments.
            Instead of calling capital from LPs immediately when making investments, the fund can
            borrow from the line and delay the capital call.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-sm text-white">Benefits</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Boosts reported IRR by delaying capital calls</li>
              <li>• Provides operational flexibility</li>
              <li>• Smooths timing of capital calls</li>
              <li>• Enables quick execution</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-sm text-white">Trade-offs</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Interest expense reduces net returns</li>
              <li>• Can artificially inflate IRR</li>
              <li>• ILPA requires disclosure</li>
              <li>• Adds complexity and cost</li>
            </ul>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="font-medium text-sm text-white">ILPA Best Practices (2017 & 2020)</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Maximum facility size: 15-25% of commitments</li>
            <li>• Maximum days outstanding: 180 days</li>
            <li>• Must report both levered and unlevered returns</li>
            <li>• Disclose facility terms to LPs</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'fund-basics',
    type: 'select',
    phase: 2,
    phaseName: 'Fund Setup',
    title: 'What type of fund?',
    subtitle: 'This helps us set appropriate defaults for your analysis'
  },
  {
    id: 'fund-size',
    type: 'input',
    phase: 2,
    phaseName: 'Fund Setup',
    title: 'What is your fund size?',
    subtitle: 'Total committed capital in millions',
    tip: 'Typical PE funds: $100M-$500M. VC funds: $50M-$250M. This is the total amount LPs have committed to invest.'
  },
  {
    id: 'performance',
    type: 'input',
    phase: 2,
    phaseName: 'Fund Setup',
    title: 'Expected gross performance?',
    subtitle: 'Gross multiple on invested capital (MOIC)',
    tip: 'Industry benchmarks: Top quartile PE ~3.0x, median ~2.0x. VC can be higher. This is before fees and expenses.'
  },
  {
    id: 'celebration-1',
    type: 'celebration',
    phase: 2,
    phaseName: 'Fund Setup',
    title: 'Fund Configured!',
    subtitle: "Now let's set up the credit facility parameters",
    isCelebration: true
  },
  {
    id: 'facility-size',
    type: 'select',
    phase: 3,
    phaseName: 'Facility',
    title: 'How large should the facility be?',
    subtitle: 'As a percentage of total commitments',
    tip: 'ILPA recommends 15-25%. Market standard is 20%. Larger facilities provide more flexibility but higher costs.'
  },
  {
    id: 'interest-rate',
    type: 'select',
    phase: 3,
    phaseName: 'Facility',
    title: 'What interest rate?',
    subtitle: 'Annual rate on drawn amounts',
    tip: 'Current market (2024-2025): 3.5-5.5%. Rates vary based on fund size, track record, and market conditions.'
  },
  {
    id: 'days-outstanding',
    type: 'select',
    phase: 3,
    phaseName: 'Facility',
    title: 'Maximum days outstanding?',
    subtitle: 'How long can draws remain unpaid?',
    tip: 'Traditional: 90 days. ILPA maximum: 180 days. Some funds use 270-360 days to maximize IRR boost.'
  },
  {
    id: 'celebration-2',
    type: 'celebration',
    phase: 3,
    phaseName: 'Facility',
    title: 'Line Parameters Set!',
    subtitle: 'Ready to see the impact analysis',
    isCelebration: true
  },
  {
    id: 'review',
    type: 'review',
    phase: 4,
    phaseName: 'Review',
    title: 'Your Configuration',
    subtitle: 'Review before seeing the detailed analysis'
  }
]

interface JourneyModeProps {
  onComplete: (input: SubscriptionLineInput) => void
  onSkip: () => void
}

export function JourneyMode({ onComplete, onSkip }: JourneyModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Journey state
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [fundSize, setFundSize] = useState<number>(200)
  const [grossMOIC, setGrossMOIC] = useState<number>(2.5)
  const [facilitySize, setFacilitySize] = useState<number>(0.20)
  const [interestRate, setInterestRate] = useState<number>(0.045)
  const [maxDaysOutstanding, setMaxDaysOutstanding] = useState<number>(180)

  const step = JOURNEY_STEPS[currentStepIndex]
  const totalSteps = JOURNEY_STEPS.length
  const progress = ((currentStepIndex + 1) / totalSteps) * 100
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1

  // Current phase info
  const currentPhase = PHASES.find(p => p.id === step?.phase) || PHASES[0]

  // Reset scroll on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [currentStepIndex])

  // Trigger celebration
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
    })
  }, [])

  // Auto-advance helper (250ms delay for selections)
  const autoAdvance = useCallback(() => {
    setTimeout(() => {
      if (currentStepIndex < totalSteps - 1) {
        setDirection(1)
        setCurrentStepIndex(prev => prev + 1)
      }
    }, 250)
  }, [currentStepIndex, totalSteps])

  // Trigger celebration on celebration steps and auto-advance
  useEffect(() => {
    if (step?.type === 'celebration') {
      triggerCelebration()
      const timer = setTimeout(() => {
        setDirection(1)
        setCurrentStepIndex(prev => prev + 1)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentStepIndex, step?.type, triggerCelebration])

  // Navigation
  const goNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setDirection(1)
      setCurrentStepIndex(prev => prev + 1)
    }
  }, [currentStepIndex, totalSteps])

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1)
      // Skip celebration steps when going back
      let prevStep = currentStepIndex - 1
      while (prevStep > 0 && JOURNEY_STEPS[prevStep].isCelebration) {
        prevStep--
      }
      setCurrentStepIndex(prevStep)
    }
  }, [currentStepIndex])

  const handleComplete = () => {
    const input: SubscriptionLineInput = {
      fundSize: fundSize * 1_000_000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded',
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments',
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: true,
      facilitySize,
      interestRate,
      maxDaysOutstanding,
      repaymentTrigger: 'automatic',
      grossMOIC,
      realizationScheduleType: 'j-curve'
    }

    triggerCelebration()
    setTimeout(() => onComplete(input), 500)
  }

  // Handlers
  const handleStrategySelect = (strategyId: string) => {
    const strategy = FUND_STRATEGIES.find(s => s.id === strategyId)
    if (strategy) {
      setSelectedStrategy(strategyId)
      setFundSize(strategy.typicalSize)
      setFacilitySize(strategy.typicalFacility)
      autoAdvance()
    }
  }

  const handleFacilitySelect = (value: number) => {
    setFacilitySize(value)
    autoAdvance()
  }

  const handleRateSelect = (value: number) => {
    setInterestRate(value)
    autoAdvance()
  }

  const handleDaysSelect = (value: number) => {
    setMaxDaysOutstanding(value)
    autoAdvance()
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (step.type === 'welcome' || step.type === 'info') {
            e.preventDefault()
            goNext()
          }
          break
        case 'ArrowLeft':
        case 'Escape':
          if (currentStepIndex > 0) {
            e.preventDefault()
            goBack()
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault()
          const index = parseInt(e.key) - 1
          if (step.id === 'fund-basics' && index < FUND_STRATEGIES.length) {
            handleStrategySelect(FUND_STRATEGIES[index].id)
          } else if (step.id === 'facility-size' && index < FACILITY_OPTIONS.length) {
            handleFacilitySelect(FACILITY_OPTIONS[index].value)
          } else if (step.id === 'interest-rate' && index < RATE_OPTIONS.length) {
            handleRateSelect(RATE_OPTIONS[index].value)
          } else if (step.id === 'days-outstanding' && index < DAYS_OPTIONS.length) {
            handleDaysSelect(DAYS_OPTIONS[index].value)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, currentStepIndex, goNext, goBack])

  // Animation
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

  const selectedStrategyData = FUND_STRATEGIES.find(s => s.id === selectedStrategy)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B1220] pb-safe">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B1220] to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent" />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Navigation header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Back button */}
          {currentStepIndex > 0 && !step.isCelebration ? (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goBack}
              className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </motion.button>
          ) : (
            <div className="w-16" />
          )}

          {/* Phase dots indicator */}
          {step.phase > 0 && (
            <div className="flex items-center gap-3">
              {PHASES.map((phase, i) => {
                const isActive = phase.id === currentPhase.id
                const isCompleted = phase.id < (step.phase || 1)
                return (
                  <div key={phase.id} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full transition-all duration-300",
                          isActive
                            ? "bg-indigo-400 ring-4 ring-indigo-400/20"
                            : isCompleted
                            ? "bg-indigo-400"
                            : "bg-slate-700"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-medium transition-colors hidden sm:block",
                          isActive ? "text-indigo-400" : isCompleted ? "text-slate-400" : "text-slate-600"
                        )}
                      >
                        {phase.name}
                      </span>
                    </div>
                    {i < PHASES.length - 1 && (
                      <div
                        className={cn(
                          "w-8 sm:w-12 h-0.5 sm:-mt-4 -mt-0",
                          isCompleted ? "bg-indigo-400" : "bg-slate-700"
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Skip button */}
          {currentStepIndex > 0 && !step.isCelebration ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onSkip}
              className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">Skip</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-4 sm:px-6 py-6 pb-24 max-w-2xl mx-auto w-full"
          >
            {/* Welcome */}
            {step.type === 'welcome' && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative w-20 h-20"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <CreditCard className="h-10 w-10 text-white" />
                  </div>
                  {/* Floating icons */}
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute -top-4 -right-4 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"
                  >
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="absolute -bottom-3 -left-4 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"
                  >
                    <DollarSign className="h-4 w-4 text-amber-400" />
                  </motion.div>
                </motion.div>

                <div className="space-y-3">
                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl sm:text-4xl font-bold text-white"
                  >
                    {step.title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-400"
                  >
                    {step.subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-4 text-xs text-slate-500"
                  >
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      3-5 minutes
                    </span>
                    <span>•</span>
                    <span>4 phases</span>
                    <span>•</span>
                    <span>Interactive</span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3 w-full max-w-xs"
                >
                  <Button
                    size="lg"
                    onClick={goNext}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-full shadow-lg shadow-indigo-500/25"
                  >
                    Start Learning
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="w-full text-slate-500 hover:text-slate-300"
                  >
                    Skip to calculator
                  </Button>
                </motion.div>
              </div>
            )}

            {/* Info screens */}
            {step.type === 'info' && (
              <div className="min-h-[50vh] flex flex-col gap-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <BookOpen className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                {step.educationalContent}
              </div>
            )}

            {/* Strategy Selection */}
            {step.id === 'fund-basics' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Building2 className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {FUND_STRATEGIES.map((strategy, index) => {
                    const Icon = strategy.icon
                    const isSelected = selectedStrategy === strategy.id

                    return (
                      <motion.button
                        key={strategy.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStrategySelect(strategy.id)}
                        className={cn(
                          "relative flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all active:scale-[0.98]",
                          isSelected
                            ? "border-indigo-400/50 bg-indigo-500/10"
                            : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-slate-900" />
                          </motion.div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2.5 rounded-lg shrink-0 bg-gradient-to-br",
                            strategy.color
                          )}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{strategy.name}</div>
                            <div className="text-xs text-slate-400">{strategy.description}</div>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 text-[10px] text-slate-600">
                          Press {index + 1}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Fund Size Input */}
            {step.id === 'fund-size' && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <DollarSign className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">$</span>
                    <Input
                      type="number"
                      value={fundSize}
                      onChange={(e) => setFundSize(parseFloat(e.target.value) || 0)}
                      className="pl-10 pr-16 h-16 text-3xl text-center bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-400/20"
                      placeholder="200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">M</span>
                  </div>

                  {/* Quick select */}
                  <div className="flex justify-center gap-2 flex-wrap">
                    {[50, 100, 150, 200, 300, 500].map((size) => (
                      <button
                        key={size}
                        onClick={() => setFundSize(size)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          fundSize === size
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        ${size}M
                      </button>
                    ))}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-slate-400 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gross MOIC Input */}
            {step.id === 'performance' && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <TrendingUp className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={grossMOIC}
                      onChange={(e) => setGrossMOIC(parseFloat(e.target.value) || 0)}
                      className="pr-10 h-16 text-3xl text-center bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-400/20"
                      placeholder="2.5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">x</span>
                  </div>

                  {/* Quick select */}
                  <div className="flex justify-center gap-2">
                    {[1.5, 2.0, 2.5, 3.0, 3.5].map((moic) => (
                      <button
                        key={moic}
                        onClick={() => setGrossMOIC(moic)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          grossMOIC === moic
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        {moic}x
                      </button>
                    ))}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-slate-400 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Facility Size Selection */}
            {step.id === 'facility-size' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Percent className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                <div className="space-y-2">
                  {FACILITY_OPTIONS.map((option, index) => {
                    const isSelected = facilitySize === option.value

                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleFacilitySelect(option.value)}
                        className={cn(
                          "relative w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                          isSelected
                            ? "border-indigo-400/50 bg-indigo-500/10"
                            : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Percent className="h-5 w-5 text-slate-500" />
                          <div className="text-left">
                            <div className="font-semibold text-white">{option.label}</div>
                            <div className="text-xs text-slate-400">{option.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {option.ilpa && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              ILPA
                            </span>
                          )}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center"
                            >
                              <Check className="h-3 w-3 text-slate-900" />
                            </motion.div>
                          )}
                        </div>
                        <div className="absolute bottom-1 left-2 text-[10px] text-slate-600">
                          Press {index + 1}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {step.tip && (
                  <div className="flex items-start gap-2 text-sm text-slate-400 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            )}

            {/* Interest Rate Selection */}
            {step.id === 'interest-rate' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <DollarSign className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                <div className="space-y-2">
                  {RATE_OPTIONS.map((option, index) => {
                    const isSelected = interestRate === option.value

                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleRateSelect(option.value)}
                        className={cn(
                          "relative w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                          isSelected
                            ? "border-indigo-400/50 bg-indigo-500/10"
                            : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-slate-500" />
                          <div className="text-left">
                            <div className="font-semibold text-white">{option.label}</div>
                            <div className="text-xs text-slate-400">{option.description}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-slate-900" />
                          </motion.div>
                        )}
                        <div className="absolute bottom-1 left-2 text-[10px] text-slate-600">
                          Press {index + 1}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {step.tip && (
                  <div className="flex items-start gap-2 text-sm text-slate-400 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            )}

            {/* Days Outstanding Selection */}
            {step.id === 'days-outstanding' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Calendar className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                <div className="space-y-2">
                  {DAYS_OPTIONS.map((option, index) => {
                    const isSelected = maxDaysOutstanding === option.value
                    const isILPA = option.value <= 180

                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleDaysSelect(option.value)}
                        className={cn(
                          "relative w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                          isSelected
                            ? "border-indigo-400/50 bg-indigo-500/10"
                            : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-slate-500" />
                          <div className="text-left">
                            <div className="font-semibold text-white">{option.label}</div>
                            <div className="text-xs text-slate-400">{option.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isILPA && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              ILPA
                            </span>
                          )}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center"
                            >
                              <Check className="h-3 w-3 text-slate-900" />
                            </motion.div>
                          )}
                        </div>
                        <div className="absolute bottom-1 left-2 text-[10px] text-slate-600">
                          Press {index + 1}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {step.tip && (
                  <div className="flex items-start gap-2 text-sm text-slate-400 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            )}

            {/* Celebration */}
            {step.type === 'celebration' && (
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold text-white"
                >
                  {step.title}
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-indigo-400 font-medium"
                >
                  {step.subtitle}
                </motion.p>
              </div>
            )}

            {/* Review */}
            {step.type === 'review' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400">{step.subtitle}</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500 mb-2">Fund Type</div>
                    <div className="font-semibold text-white">{selectedStrategyData?.name || 'Not selected'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-2">Fund Size</div>
                      <div className="font-semibold text-white">${fundSize}M</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-2">Gross MOIC</div>
                      <div className="font-semibold text-white">{grossMOIC}x</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-400/20">
                    <div className="text-xs text-indigo-400 mb-3 font-medium">Credit Facility Parameters</div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Facility Size</div>
                        <div className="font-semibold text-white">{(facilitySize * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Interest Rate</div>
                        <div className="font-semibold text-white">{(interestRate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Max Days</div>
                        <div className="font-semibold text-white">{maxDaysOutstanding}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-full shadow-lg shadow-indigo-500/25"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    See Impact Analysis
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    You'll be able to adjust all parameters in the calculator
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation - only show on non-celebration, non-review steps */}
      {currentStepIndex > 0 && !step.isCelebration && step.type !== 'review' && (
        <div className="relative z-10 flex-shrink-0 border-t border-slate-800 bg-[#0B1220] p-4">
          <div className="flex flex-col items-center gap-3 max-w-2xl mx-auto">
            {(step.type === 'info' || step.type === 'input') && (
              <Button
                onClick={goNext}
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-full shadow-lg shadow-indigo-500/25"
              >
                Continue
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            )}

            {/* Keyboard hint */}
            <div className="text-xs text-slate-600 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">Enter</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">→</kbd> to continue
              • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">←</kbd> to go back
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
