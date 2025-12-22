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
  X
} from 'lucide-react'
import { SubscriptionLineInput } from './subscriptionLineCalculations'
import confetti from 'canvas-confetti'

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
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            The Basics
          </h4>
          <p className="text-sm text-muted-foreground">
            A subscription line is a revolving credit facility secured by LP capital commitments.
            Instead of calling capital from LPs immediately when making investments, the fund can
            borrow from the line and delay the capital call.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm">Benefits</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Boosts reported IRR by delaying capital calls</li>
              <li>• Provides operational flexibility</li>
              <li>• Smooths timing of capital calls</li>
              <li>• Enables quick execution</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-sm">Trade-offs</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Interest expense reduces net returns</li>
              <li>• Can artificially inflate IRR</li>
              <li>• ILPA requires disclosure</li>
              <li>• Adds complexity and cost</li>
            </ul>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">ILPA Best Practices (2017 & 2020)</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
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
    title: 'Fund configured!',
    subtitle: 'Now let\'s set up the credit facility parameters'
  },
  {
    id: 'facility-size',
    type: 'select',
    phase: 3,
    phaseName: 'Line Parameters',
    title: 'How large should the facility be?',
    subtitle: 'As a percentage of total commitments',
    tip: 'ILPA recommends 15-25%. Market standard is 20%. Larger facilities provide more flexibility but higher costs.'
  },
  {
    id: 'interest-rate',
    type: 'select',
    phase: 3,
    phaseName: 'Line Parameters',
    title: 'What interest rate?',
    subtitle: 'Annual rate on drawn amounts',
    tip: 'Current market (2024-2025): 3.5-5.5%. Rates vary based on fund size, track record, and market conditions.'
  },
  {
    id: 'days-outstanding',
    type: 'select',
    phase: 3,
    phaseName: 'Line Parameters',
    title: 'Maximum days outstanding?',
    subtitle: 'How long can draws remain unpaid?',
    tip: 'Traditional: 90 days. ILPA maximum: 180 days. Some funds use 270-360 days to maximize IRR boost.'
  },
  {
    id: 'celebration-2',
    type: 'celebration',
    phase: 3,
    phaseName: 'Line Parameters',
    title: 'Line parameters set!',
    subtitle: 'Ready to see the impact analysis'
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

  // Current phase info
  const currentPhase = step?.phase
  const phaseName = step?.phaseName

  // Reset scroll on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [currentStepIndex])

  // Trigger celebration
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
    })
  }, [])

  useEffect(() => {
    if (step?.type === 'celebration') {
      triggerCelebration()
    }
  }, [step?.type, triggerCelebration])

  // Navigation
  const goNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }, [currentStepIndex, totalSteps])

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
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
      setTimeout(goNext, 300)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (step.type === 'welcome' || step.type === 'celebration' || step.type === 'info') {
            e.preventDefault()
            goNext()
          }
          break
        case 'ArrowLeft':
        case 'Backspace':
          if (currentStepIndex > 0) {
            e.preventDefault()
            goPrev()
          }
          break
        case 'Escape':
          e.preventDefault()
          onSkip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, currentStepIndex, goNext, goPrev, onSkip])

  // Animation
  const variants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  const selectedStrategyData = FUND_STRATEGIES.find(s => s.id === selectedStrategy)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-950">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Phase indicator */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {currentPhase > 0 && (
              <>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {currentPhase}
                </span>
                <span className="text-sm font-medium truncate">{phaseName}</span>
              </>
            )}
            {currentPhase === 0 && <span className="text-sm text-muted-foreground">Getting started</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="flex-shrink-0 text-muted-foreground"
          >
            Skip
            <SkipForward className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Phase dots */}
        {step.type !== 'welcome' && (
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {[1, 2, 3, 4].map((phase) => (
              <div
                key={phase}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentPhase > phase
                    ? "bg-emerald-500"
                    : phase === currentPhase
                    ? "bg-primary w-4"
                    : "bg-slate-700"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain bg-slate-950">
        <div className="pb-safe">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="px-4 py-6 pb-20 max-w-2xl mx-auto w-full"
            >
              {/* Welcome */}
              {step.type === 'welcome' && (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                    <motion.div
                      className="relative bg-gradient-to-br from-primary to-purple-600 p-5 rounded-2xl text-white"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <CreditCard className="h-12 w-12" />
                    </motion.div>
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold">{step.title}</h1>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        3-5 minutes
                      </span>
                      <span>•</span>
                      <span>4 phases</span>
                      <span>•</span>
                      <span>Interactive learning</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button size="lg" onClick={goNext} className="w-full group">
                      Start Learning
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
                      Skip to calculator
                    </Button>
                  </div>
                </div>
              )}

              {/* Info screens */}
              {step.type === 'info' && (
                <div className="min-h-[50vh] flex flex-col gap-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  {step.educationalContent}

                  <div className="flex justify-center pt-4">
                    <Button size="lg" onClick={goNext}>
                      Continue
                      <ChevronRight className="ml-1 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Strategy Selection */}
              {step.id === 'fund-basics' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {FUND_STRATEGIES.map((strategy) => {
                      const Icon = strategy.icon
                      const isSelected = selectedStrategy === strategy.id

                      return (
                        <button
                          key={strategy.id}
                          onClick={() => handleStrategySelect(strategy.id)}
                          className={cn(
                            "flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2.5 rounded-lg shrink-0 bg-gradient-to-br",
                              strategy.color
                            )}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">{strategy.name}</div>
                              <div className="text-xs text-muted-foreground">{strategy.description}</div>
                            </div>
                            {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Fund Size Input */}
              {step.id === 'fund-size' && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="max-w-md mx-auto space-y-6">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/60">$</span>
                      <Input
                        type="number"
                        value={fundSize}
                        onChange={(e) => setFundSize(parseFloat(e.target.value) || 0)}
                        className="pl-10 pr-16 h-16 text-3xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/30"
                        placeholder="200"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-white/60">M</span>
                    </div>

                    {/* Quick select */}
                    <div className="flex justify-center gap-2 flex-wrap">
                      {[50, 100, 150, 200, 300, 500].map((size) => (
                        <button
                          key={size}
                          onClick={() => setFundSize(size)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm transition-all",
                            fundSize === size
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-foreground hover:bg-accent/80"
                          )}
                        >
                          ${size}M
                        </button>
                      ))}
                    </div>

                    {step.tip && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
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
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="max-w-md mx-auto space-y-6">
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        value={grossMOIC}
                        onChange={(e) => setGrossMOIC(parseFloat(e.target.value) || 0)}
                        className="pr-10 h-16 text-3xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/30"
                        placeholder="2.5"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-white/60">x</span>
                    </div>

                    {/* Quick select */}
                    <div className="flex justify-center gap-2">
                      {[1.5, 2.0, 2.5, 3.0, 3.5].map((moic) => (
                        <button
                          key={moic}
                          onClick={() => setGrossMOIC(moic)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm transition-all",
                            grossMOIC === moic
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-foreground hover:bg-accent/80"
                          )}
                        >
                          {moic}x
                        </button>
                      ))}
                    </div>

                    {step.tip && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
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
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="space-y-2">
                    {FACILITY_OPTIONS.map((option) => {
                      const isSelected = facilitySize === option.value

                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFacilitySize(option.value)
                            setTimeout(goNext, 300)
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Percent className="h-5 w-5 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-semibold">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {option.ilpa && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                                ILPA
                              </span>
                            )}
                            {isSelected && <Check className="h-5 w-5 text-primary" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Interest Rate Selection */}
              {step.id === 'interest-rate' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="space-y-2">
                    {RATE_OPTIONS.map((option) => {
                      const isSelected = interestRate === option.value

                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setInterestRate(option.value)
                            setTimeout(goNext, 300)
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-semibold">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      )
                    })}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Days Outstanding Selection */}
              {step.id === 'days-outstanding' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="space-y-2">
                    {DAYS_OPTIONS.map((option) => {
                      const isSelected = maxDaysOutstanding === option.value
                      const isILPA = option.value <= 180

                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setMaxDaysOutstanding(option.value)
                            setTimeout(goNext, 300)
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-semibold">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isILPA && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                                ILPA
                              </span>
                            )}
                            {isSelected && <Check className="h-5 w-5 text-primary" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
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
                    transition={{ type: "spring", duration: 0.6 }}
                  >
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white">
                      <Award className="h-12 w-12" />
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-primary font-medium">{step.subtitle}</p>
                  </div>
                  <Button size="lg" onClick={goNext}>
                    Continue
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Review */}
              {step.type === 'review' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-accent/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-2">Fund Type</div>
                      <div className="font-semibold">{selectedStrategyData?.name || 'Not selected'}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-accent/50 border border-border">
                        <div className="text-xs text-muted-foreground mb-2">Fund Size</div>
                        <div className="font-semibold">${fundSize}M</div>
                      </div>
                      <div className="p-4 rounded-xl bg-accent/50 border border-border">
                        <div className="text-xs text-muted-foreground mb-2">Gross MOIC</div>
                        <div className="font-semibold">{grossMOIC}x</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="text-xs text-primary mb-3 font-medium">Credit Facility Parameters</div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Facility Size</div>
                          <div className="font-semibold">{(facilitySize * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Interest Rate</div>
                          <div className="font-semibold">{(interestRate * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Max Days</div>
                          <div className="font-semibold">{maxDaysOutstanding}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button size="lg" onClick={handleComplete} className="w-full">
                      <Zap className="mr-2 h-5 w-5" />
                      See Impact Analysis
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      You'll be able to adjust all parameters in the calculator
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      {currentStepIndex > 0 && step.type !== 'celebration' && (
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 p-4 safe-area-inset-bottom">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={goPrev}
              className="h-11 px-4 min-w-[80px] touch-manipulation"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentStepIndex + 1} / {totalSteps}
            </span>
            {(step.type === 'info') && (
              <Button
                variant="ghost"
                onClick={goNext}
                className="h-11 px-4 min-w-[80px] touch-manipulation"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            )}
            {step.type !== 'info' && (
              <div className="w-20" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
