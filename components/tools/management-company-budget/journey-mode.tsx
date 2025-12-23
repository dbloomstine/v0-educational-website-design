'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Calculator,
  ArrowRight,
  Check,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react'
import { BudgetData, Fund, TeamMember, ExpenseItem } from './types'
import confetti from 'canvas-confetti'

interface JourneyModeProps {
  onComplete: (data: BudgetData) => void
  onSkip: () => void
  existingData?: BudgetData | null
}

// Define phases for the journey
const PHASES = [
  { id: 1, name: 'Fund Setup', icon: Briefcase },
  { id: 2, name: 'Team & Office', icon: Users },
  { id: 3, name: 'Budget', icon: Calculator },
]

const STEPS = [
  { id: 'welcome', title: 'Welcome', phase: 1 },
  { id: 'fund-strategy', title: 'Fund Strategy', phase: 1 },
  { id: 'fund-size', title: 'Fund Size', phase: 1 },
  { id: 'celebration-1', title: 'Phase Complete', phase: 1, isCelebration: true },
  { id: 'team-size', title: 'Team Size', phase: 2 },
  { id: 'office-location', title: 'Office Location', phase: 2 },
  { id: 'celebration-2', title: 'Phase Complete', phase: 2, isCelebration: true },
  { id: 'expenses-overview', title: 'Expense Categories', phase: 3 },
  { id: 'review', title: 'Review', phase: 3 },
] as const

type StepId = typeof STEPS[number]['id']

// Fund strategy options
const fundStrategies = [
  { id: 'vc', name: 'Venture Capital', icon: '🚀', description: 'Early to growth stage investments', typicalSize: 75, feeRate: 2.0, color: 'from-violet-500 to-purple-600' },
  { id: 'pe', name: 'Private Equity', icon: '🏢', description: 'Buyouts and control investments', typicalSize: 150, feeRate: 2.0, color: 'from-blue-500 to-indigo-600' },
  { id: 'credit', name: 'Private Credit', icon: '💳', description: 'Direct lending strategies', typicalSize: 200, feeRate: 1.5, color: 'from-emerald-500 to-teal-600' },
  { id: 're', name: 'Real Estate', icon: '🏠', description: 'Property investments', typicalSize: 100, feeRate: 1.5, color: 'from-amber-500 to-orange-600' },
  { id: 'hedge', name: 'Hedge Fund', icon: '📈', description: 'Liquid strategies', typicalSize: 100, feeRate: 1.5, color: 'from-rose-500 to-pink-600' },
  { id: 'infra', name: 'Infrastructure', icon: '⚡', description: 'Essential services', typicalSize: 300, feeRate: 1.5, color: 'from-cyan-500 to-sky-600' },
]

// Team size presets
const teamSizeOptions = [
  { id: 'solo', name: 'Solo GP', count: 1, description: 'Just you running the show', monthlyCost: 15000 },
  { id: 'small', name: 'Small Team', count: 3, description: '2-3 person team', monthlyCost: 40000 },
  { id: 'mid', name: 'Mid-Size', count: 5, description: '4-6 person team', monthlyCost: 75000 },
  { id: 'large', name: 'Large Team', count: 8, description: '7+ person team', monthlyCost: 120000 },
]

// Office location options
const officeLocations = [
  { id: 'tier1', name: 'Tier 1 City', description: 'NYC, SF, London', monthlyCost: 8000, emoji: '🌆' },
  { id: 'tier2', name: 'Tier 2 City', description: 'Austin, Miami, Boston', monthlyCost: 4000, emoji: '🏙️' },
  { id: 'remote', name: 'Remote/Coworking', description: 'Distributed team', monthlyCost: 1500, emoji: '💻' },
]

export function JourneyMode({ onComplete, onSkip, existingData }: JourneyModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showWelcomeBack, setShowWelcomeBack] = useState(!!existingData)

  // Form state
  const [fundStrategy, setFundStrategy] = useState<string>(existingData?.funds[0]?.name.includes('VC') ? 'vc' : 'pe')
  const [fundSize, setFundSize] = useState(existingData?.funds[0]?.size || 75)
  const [feeRate, setFeeRate] = useState(existingData?.funds[0]?.feeRate || 2.0)
  const [teamSize, setTeamSize] = useState('small')
  const [teamCost, setTeamCost] = useState(40000)
  const [officeLocation, setOfficeLocation] = useState('tier2')
  const [officeCost, setOfficeCost] = useState(4000)
  const [startingCash, setStartingCash] = useState(existingData?.startingCash || 500000)

  const step = STEPS[currentStep]
  const progress = ((currentStep) / (STEPS.length - 1)) * 100
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1
  const currentPhase = PHASES.find(p => p.id === step.phase) || PHASES[0]

  // Trigger celebration confetti
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#22d3ee', '#6366f1', '#22c55e'],
    })
  }, [])

  // Auto-advance helper (250ms delay for selections)
  const autoAdvance = useCallback(() => {
    setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setDirection(1)
        setCurrentStep(prev => prev + 1)
      }
    }, 250)
  }, [currentStep])

  // Handle going to next step
  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      // Complete the journey
      completeJourney()
    }
  }, [currentStep])

  // Handle going to previous step
  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      // Skip celebration steps when going back
      let prevStep = currentStep - 1
      while (prevStep > 0 && STEPS[prevStep].isCelebration) {
        prevStep--
      }
      setCurrentStep(prevStep)
    }
  }, [currentStep])

  // Complete the journey and generate budget data
  const completeJourney = useCallback(() => {
    const genId = () => Math.random().toString(36).substr(2, 9)

    // Create team members based on team size
    const teamMembers: TeamMember[] = []
    const teamConfig = teamSizeOptions.find(t => t.id === teamSize)

    if (teamConfig) {
      if (teamConfig.count >= 1) {
        teamMembers.push({ id: genId(), role: 'Managing Partner', monthlyCost: teamConfig.count === 1 ? 15000 : 25000 })
      }
      if (teamConfig.count >= 2) {
        teamMembers.push({ id: genId(), role: 'Partner', monthlyCost: 20000 })
      }
      if (teamConfig.count >= 3) {
        teamMembers.push({ id: genId(), role: 'Associate', monthlyCost: 10000 })
      }
      if (teamConfig.count >= 4) {
        teamMembers.push({ id: genId(), role: 'Analyst', monthlyCost: 7000 })
      }
      if (teamConfig.count >= 5) {
        teamMembers.push({ id: genId(), role: 'CFO', monthlyCost: 18000 })
      }
      if (teamConfig.count >= 6) {
        teamMembers.push({ id: genId(), role: 'VP', monthlyCost: 15000 })
      }
      if (teamConfig.count >= 7) {
        teamMembers.push({ id: genId(), role: 'Principal', monthlyCost: 18000 })
      }
      if (teamConfig.count >= 8) {
        teamMembers.push({ id: genId(), role: 'Senior Associate', monthlyCost: 12000 })
      }
    }

    // Create operations expenses based on fund size
    const operations: ExpenseItem[] = [
      { id: genId(), name: 'Fund Administration', monthlyCost: fundSize < 100 ? 5000 : fundSize < 300 ? 7500 : 12000 },
      { id: genId(), name: 'Audit', monthlyCost: fundSize < 100 ? 3500 : fundSize < 300 ? 5000 : 7000 },
      { id: genId(), name: 'Legal (ongoing)', monthlyCost: fundSize < 100 ? 2500 : fundSize < 300 ? 4000 : 6500 },
      { id: genId(), name: 'Compliance', monthlyCost: fundSize < 100 ? 2000 : fundSize < 300 ? 3500 : 5000 },
      { id: genId(), name: 'Tax Preparation', monthlyCost: fundSize < 100 ? 2500 : fundSize < 300 ? 4000 : 5500 },
    ]

    // Create overhead expenses
    const overhead: ExpenseItem[] = [
      { id: genId(), name: 'Office / Coworking', monthlyCost: officeCost },
      { id: genId(), name: 'D&O / E&O Insurance', monthlyCost: fundSize < 100 ? 2000 : fundSize < 300 ? 3000 : 4500 },
      { id: genId(), name: 'Technology / Software', monthlyCost: fundSize < 100 ? 1000 : fundSize < 300 ? 2000 : 3500 },
      { id: genId(), name: 'Travel & Entertainment', monthlyCost: fundSize < 100 ? 2000 : fundSize < 300 ? 3500 : 5000 },
    ]

    const budgetData: BudgetData = {
      startingCash,
      funds: [
        {
          id: genId(),
          name: 'Fund I',
          size: fundSize,
          feeRate,
          firstCloseYear: new Date().getFullYear()
        }
      ],
      expenses: {
        team: teamMembers,
        operations,
        overhead
      }
    }

    onComplete(budgetData)
  }, [fundStrategy, fundSize, feeRate, teamSize, officeCost, startingCash, onComplete])

  // Trigger celebration on celebration steps
  useEffect(() => {
    if (step.isCelebration) {
      triggerCelebration()
      // Auto-advance after celebration
      const timer = setTimeout(goNext, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, step.isCelebration, triggerCelebration, goNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement) return

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (!step.isCelebration && !isLastStep) {
          goNext()
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        e.preventDefault()
        if (!isFirstStep) {
          goBack()
        }
      } else if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        // Number keys for quick selection
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (step.id === 'fund-strategy' && index < fundStrategies.length) {
          handleStrategySelect(fundStrategies[index].id)
        } else if (step.id === 'team-size' && index < teamSizeOptions.length) {
          handleTeamSizeSelect(teamSizeOptions[index].id)
        } else if (step.id === 'office-location' && index < officeLocations.length) {
          handleOfficeLocationSelect(officeLocations[index].id)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, isFirstStep, isLastStep, step])

  const handleStrategySelect = (strategyId: string) => {
    const strategy = fundStrategies.find(s => s.id === strategyId)
    if (strategy) {
      setFundStrategy(strategyId)
      setFundSize(strategy.typicalSize)
      setFeeRate(strategy.feeRate)
      autoAdvance()
    }
  }

  const handleTeamSizeSelect = (sizeId: string) => {
    const size = teamSizeOptions.find(s => s.id === sizeId)
    if (size) {
      setTeamSize(sizeId)
      setTeamCost(size.monthlyCost)
      autoAdvance()
    }
  }

  const handleOfficeLocationSelect = (locationId: string) => {
    const location = officeLocations.find(l => l.id === locationId)
    if (location) {
      setOfficeLocation(locationId)
      setOfficeCost(location.monthlyCost)
      autoAdvance()
    }
  }

  const handleContinueExisting = () => {
    if (existingData) {
      onComplete(existingData)
    }
  }

  const handleStartFresh = () => {
    setShowWelcomeBack(false)
    setCurrentStep(0)
  }

  // Calculate preview values
  const annualRevenue = fundSize * 1_000_000 * (feeRate / 100)
  const monthlyRevenue = annualRevenue / 12
  const operationsCost = fundSize < 100 ? 15500 : fundSize < 300 ? 24000 : 36000
  const overheadCost = officeCost + (fundSize < 100 ? 5000 : fundSize < 300 ? 8500 : 13000)
  const monthlyBurn = teamCost + operationsCost + overheadCost
  const runwayMonths = monthlyBurn > 0 ? Math.floor(startingCash / monthlyBurn) : 0

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1220]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg mx-4 p-8 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">
              You have a previous budget saved. Would you like to continue where you left off?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinueExisting}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-400 hover:to-cyan-400 transition-all"
            >
              Continue with saved budget
            </button>
            <button
              onClick={handleStartFresh}
              className="w-full p-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            >
              Start fresh
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B1220] overflow-hidden pb-safe">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B1220] to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Navigation header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Back button */}
          {currentStep > 0 && !step.isCelebration ? (
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
          <div className="flex items-center gap-3">
            {PHASES.map((phase, i) => {
              const isActive = phase.id === currentPhase.id
              const isCompleted = phase.id < currentPhase.id
              return (
                <div key={phase.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-cyan-400 ring-4 ring-cyan-400/20'
                          : isCompleted
                          ? 'bg-cyan-400'
                          : 'bg-slate-700'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium transition-colors ${
                        isActive ? 'text-cyan-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {phase.name}
                    </span>
                  </div>
                  {i < PHASES.length - 1 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 -mt-4 ${
                        isCompleted ? 'bg-cyan-400' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Skip button */}
          {currentStep > 0 && !step.isCelebration ? (
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

      {/* Main content area */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 py-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-2xl"
          >
            {/* Welcome Step */}
            {step.id === 'welcome' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative w-20 h-20 mx-auto mb-8"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Calculator className="h-10 w-10 text-white" />
                  </div>
                  {/* Floating icons */}
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute -top-4 -right-4 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"
                  >
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="absolute -bottom-3 -left-4 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"
                  >
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight"
                >
                  Budget Planner
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-base sm:text-lg text-slate-400 mb-10 max-w-md mx-auto leading-relaxed"
                >
                  Build your management company budget in minutes. Understand your runway, expenses, and break-even.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-8"
                >
                  <div className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-1">2 min</div>
                    <div className="text-xs text-slate-500">to complete</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-1">6</div>
                    <div className="text-xs text-slate-500">questions</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-1">Free</div>
                    <div className="text-xs text-slate-500">forever</div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Fund Strategy Step */}
            {step.id === 'fund-strategy' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Briefcase className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">What type of fund?</h2>
                  <p className="text-slate-400">This helps us tailor your budget to industry norms</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fundStrategies.map((strategy, index) => (
                    <motion.button
                      key={strategy.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStrategySelect(strategy.id)}
                      className={`relative p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
                        fundStrategy === strategy.id
                          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {fundStrategy === strategy.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-slate-900" />
                        </motion.div>
                      )}
                      <div className="text-2xl mb-2">{strategy.icon}</div>
                      <div className="font-semibold text-white text-sm mb-1">{strategy.name}</div>
                      <div className="text-xs text-slate-500 mb-2 line-clamp-2">{strategy.description}</div>
                      <div className="text-xs font-medium text-blue-400">${strategy.typicalSize}M typical</div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-slate-600">
                        Press {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Fund Size Step */}
            {step.id === 'fund-size' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <DollarSign className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Expected AUM?</h2>
                  <p className="text-slate-400">Total capital you're planning to raise</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                    <Input
                      type="number"
                      value={fundSize}
                      onChange={(e) => setFundSize(parseFloat(e.target.value) || 50)}
                      className="pl-10 pr-16 h-14 sm:h-16 text-2xl sm:text-3xl font-bold text-center bg-slate-800/50 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-400/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">million</span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {[25, 50, 75, 100, 150, 200, 300, 500].map((size) => (
                      <button
                        key={size}
                        onClick={() => setFundSize(size)}
                        className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          fundSize === size
                            ? 'bg-blue-400 text-slate-900'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        ${size}M
                      </button>
                    ))}
                  </div>

                  {/* Management fee rate */}
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2 text-center">Management Fee Rate</label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        value={feeRate}
                        onChange={(e) => setFeeRate(parseFloat(e.target.value) || 2.0)}
                        className="pr-10 h-12 text-xl text-center bg-slate-800/50 border-slate-700 text-white focus:border-blue-400"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    Expected annual revenue: <span className="text-blue-400 font-semibold">${(fundSize * feeRate / 100).toFixed(1)}M</span>
                  </p>
                </div>
              </div>
            )}

            {/* Celebration 1 - Fund Setup Complete */}
            {step.id === 'celebration-1' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                >
                  Fund Setup Complete!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400"
                >
                  Now let's configure your team and office...
                </motion.p>
              </div>
            )}

            {/* Team Size Step */}
            {step.id === 'team-size' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">How big is your team?</h2>
                  <p className="text-slate-400">We'll estimate your personnel costs</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                  {teamSizeOptions.map((option, index) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTeamSizeSelect(option.id)}
                      className={`relative p-4 sm:p-5 rounded-xl text-left transition-all active:scale-[0.98] ${
                        teamSize === option.id
                          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {teamSize === option.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-slate-900" />
                        </motion.div>
                      )}
                      <div className="font-semibold text-white text-base sm:text-lg mb-1">{option.name}</div>
                      <div className="text-sm text-slate-400 mb-3">{option.description}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{option.count} {option.count === 1 ? 'person' : 'people'}</span>
                        <span className="text-sm font-medium text-blue-400">${(option.monthlyCost / 1000).toFixed(0)}K/mo</span>
                      </div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-slate-600">
                        Press {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                  You can customize individual roles after setup
                </p>
              </div>
            )}

            {/* Office Location Step */}
            {step.id === 'office-location' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Building2 className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Where are you based?</h2>
                  <p className="text-slate-400">Office costs vary significantly by location</p>
                </div>

                <div className="grid gap-3 sm:gap-4 max-w-xl mx-auto">
                  {officeLocations.map((location, index) => (
                    <motion.button
                      key={location.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOfficeLocationSelect(location.id)}
                      className={`relative p-4 sm:p-5 rounded-xl text-left transition-all active:scale-[0.98] ${
                        officeLocation === location.id
                          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {officeLocation === location.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-slate-900" />
                        </motion.div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{location.emoji}</div>
                          <div>
                            <div className="font-semibold text-white">{location.name}</div>
                            <div className="text-sm text-slate-400">{location.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">${(location.monthlyCost / 1000).toFixed(1)}K</div>
                          <div className="text-xs text-slate-500">per month</div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-slate-600">
                        Press {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Celebration 2 - Team & Office Complete */}
            {step.id === 'celebration-2' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30"
                >
                  <Users className="h-10 w-10 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                >
                  Team Configuration Done!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400"
                >
                  Let's finalize your budget...
                </motion.p>
              </div>
            )}

            {/* Expenses Overview Step */}
            {step.id === 'expenses-overview' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Layers className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Budget breakdown preview</h2>
                  <p className="text-slate-400">Here's how your expenses will be structured</p>
                </div>

                <div className="space-y-3 sm:space-y-4 max-w-lg mx-auto">
                  {/* Team */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        <span className="font-medium text-white">Team</span>
                      </div>
                      <span className="text-lg font-bold text-white">${(teamCost / 1000).toFixed(0)}K/mo</span>
                    </div>
                    <p className="text-sm text-slate-400">Salaries, bonuses, benefits</p>
                  </div>

                  {/* Operations */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        <span className="font-medium text-white">Operations</span>
                      </div>
                      <span className="text-lg font-bold text-white">${(operationsCost / 1000).toFixed(0)}K/mo</span>
                    </div>
                    <p className="text-sm text-slate-400">Admin, audit, legal, compliance</p>
                  </div>

                  {/* Overhead */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-amber-400" />
                        <span className="font-medium text-white">Overhead</span>
                      </div>
                      <span className="text-lg font-bold text-white">${(overheadCost / 1000).toFixed(0)}K/mo</span>
                    </div>
                    <p className="text-sm text-slate-400">Office, insurance, tech, travel</p>
                  </div>

                  {/* Total */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">Total Monthly Burn</span>
                      <span className="text-2xl font-bold text-white">${(monthlyBurn / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="text-sm text-blue-400">${(monthlyBurn * 12 / 1000).toFixed(0)}K annual budget</div>
                  </div>
                </div>

                {/* Starting capital input */}
                <div className="max-w-md mx-auto mt-6 sm:mt-8">
                  <label className="block text-white font-medium mb-3 text-center">Starting Capital</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                    <Input
                      type="number"
                      value={startingCash}
                      onChange={(e) => setStartingCash(parseFloat(e.target.value) || 500000)}
                      className="pl-10 h-12 sm:h-14 text-xl sm:text-2xl text-center bg-slate-800/50 border-slate-700 text-white focus:border-blue-400"
                    />
                  </div>
                  <div className="flex justify-center gap-2 mt-3">
                    {[250000, 500000, 750000, 1000000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setStartingCash(amount)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          startingCash === amount
                            ? 'bg-blue-400 text-slate-900'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        ${amount / 1000}K
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step.id === 'review' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 mb-4">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ready to build</h2>
                  <p className="text-slate-400">Review your setup and create your budget</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fund Strategy</span>
                      <span className="text-white font-semibold">{fundStrategies.find(s => s.id === fundStrategy)?.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fund Size</span>
                      <span className="text-white font-semibold">${fundSize}M @ {feeRate}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Team Size</span>
                      <span className="text-white font-semibold">{teamSizeOptions.find(t => t.id === teamSize)?.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Office</span>
                      <span className="text-white font-semibold">{officeLocations.find(l => l.id === officeLocation)?.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Starting Capital</span>
                      <span className="text-white font-semibold">${(startingCash / 1000).toFixed(0)}K</span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-slate-300 text-sm mb-1">Monthly Revenue</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">${(monthlyRevenue / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-slate-300 text-sm mb-1">Monthly Burn</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">${(monthlyBurn / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-blue-400/20">
                      <p className="text-blue-400 text-sm mb-1">Estimated Runway</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{runwayMonths} months</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Continue button - only show on non-celebration steps */}
        {!step.isCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-8 left-0 right-0 flex flex-col items-center px-6 pb-safe"
          >
            <Button
              onClick={isLastStep ? completeJourney : goNext}
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-300 hover:to-cyan-400 text-slate-900 rounded-full shadow-lg shadow-blue-500/25"
            >
              {isLastStep ? (
                <>
                  Create Budget
                  <Check className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-1 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Keyboard hint */}
            <div className="mt-3 text-xs text-slate-600 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">Enter</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">→</kbd> to continue
              {!isFirstStep && (
                <>
                  {' '}• <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">←</kbd> to go back
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
