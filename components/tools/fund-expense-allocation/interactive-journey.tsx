'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  CheckCircle2,
  Briefcase,
  Building2,
  Users,
  DollarSign,
  Scale,
  Clock,
  Lightbulb,
  Sparkles,
  FileText,
  Banknote,
  Gavel,
  Plane,
  Monitor,
  Shield,
  UserCheck,
  ArrowRight,
  Check,
  TrendingUp,
  Target,
  ListChecks,
  ClipboardCheck,
} from 'lucide-react'
import {
  expenseCategories,
  fundTypes,
  fundStages,
  beneficiaries,
  FundType,
  FundStage,
  Beneficiary,
  ClassificationInput
} from './expenseData'
import confetti from 'canvas-confetti'

// Define phases for the journey
const PHASES = [
  { id: 1, name: 'Expense', icon: DollarSign },
  { id: 2, name: 'Context', icon: Building2 },
  { id: 3, name: 'Review', icon: ClipboardCheck },
]

// Transform data into arrays for rendering
const EXPENSE_CATEGORIES = expenseCategories
const FUND_TYPES = Object.entries(fundTypes).map(([id, data]) => ({
  id,
  label: data.name,
  description: data.description
}))
const FUND_STAGES = Object.entries(fundStages).map(([id, data]) => ({
  id,
  label: data.name,
  description: data.description
}))
const BENEFICIARIES = Object.entries(beneficiaries).map(([id, data]) => ({
  id,
  label: data.name,
  description: data.description
}))

// Step definitions
interface Step {
  id: string
  title: string
  phase: number
  isCelebration?: boolean
}

const STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome', phase: 1 },
  { id: 'expense', title: 'Expense Type', phase: 1 },
  { id: 'celebration-1', title: 'Expense Selected', phase: 1, isCelebration: true },
  { id: 'fund-type', title: 'Fund Type', phase: 2 },
  { id: 'fund-stage', title: 'Fund Stage', phase: 2 },
  { id: 'beneficiary', title: 'Beneficiary', phase: 2 },
  { id: 'celebration-2', title: 'Context Complete', phase: 2, isCelebration: true },
  { id: 'review', title: 'Review', phase: 3 }
]

// Icons for expense categories
const getCategoryIcon = (categoryId: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'fund-formation-legal': <Gavel className="h-5 w-5" />,
    'broken-deal': <DollarSign className="h-5 w-5" />,
    'ongoing-fund-legal': <Shield className="h-5 w-5" />,
    'audit-tax-admin': <FileText className="h-5 w-5" />,
    'travel-existing-lp': <Plane className="h-5 w-5" />,
    'travel-diligence': <Plane className="h-5 w-5" />,
    'fund-technology': <Monitor className="h-5 w-5" />,
    'financing-fees': <Banknote className="h-5 w-5" />,
    'org-offering': <FileText className="h-5 w-5" />,
    'fund-regulatory': <Shield className="h-5 w-5" />,
    'transaction-fees': <DollarSign className="h-5 w-5" />,
    'placement-agent': <Users className="h-5 w-5" />,
    'ongoing-mgmt-legal': <Gavel className="h-5 w-5" />,
    'travel-prospective-lp': <Plane className="h-5 w-5" />,
    'conferences': <Users className="h-5 w-5" />,
    'platform-technology': <Monitor className="h-5 w-5" />,
    'office-overhead': <Building2 className="h-5 w-5" />,
    'marketing-pr': <Target className="h-5 w-5" />,
    'mgmt-formation': <Briefcase className="h-5 w-5" />,
    'firm-compliance': <Shield className="h-5 w-5" />,
    'portfolio-monitoring': <TrendingUp className="h-5 w-5" />,
    'do-eo-insurance': <Shield className="h-5 w-5" />,
    'key-person-insurance': <UserCheck className="h-5 w-5" />,
    'portfolio-consulting': <Lightbulb className="h-5 w-5" />,
    'dedicated-office': <Building2 className="h-5 w-5" />,
    'custom': <HelpCircle className="h-5 w-5" />
  }
  return iconMap[categoryId] || <DollarSign className="h-5 w-5" />
}

// Fund type icons and emojis
const fundTypeEmojis: Record<string, string> = {
  'pe': '🏢',
  'vc': '🚀',
  'private-credit': '💳',
  'real-estate': '🏠',
  'fund-of-funds': '📊',
  'hybrid': '⚡'
}

// Fund stage emojis
const fundStageEmojis: Record<string, string> = {
  'pre-launch': '✨',
  'fundraising': '📢',
  'post-close': '📈',
  'harvesting': '💰'
}

// Beneficiary emojis
const beneficiaryEmojis: Record<string, string> = {
  'fund': '👥',
  'management': '🏢',
  'both': '⚖️'
}

// Group expenses by classification tendency
const groupedCategories = {
  fundExpenses: EXPENSE_CATEGORIES.filter(c => c.defaultClassification === 'fund-expense'),
  managementExpenses: EXPENSE_CATEGORIES.filter(c => c.defaultClassification === 'management-expense'),
  caseByCase: EXPENSE_CATEGORIES.filter(c => c.defaultClassification === 'case-by-case')
}

interface InteractiveJourneyProps {
  onComplete: (input: ClassificationInput) => void
  onSkip: () => void
  initialInput?: Partial<ClassificationInput>
  existingData?: ClassificationInput | null
}

export function InteractiveJourney({
  onComplete,
  onSkip,
  initialInput,
  existingData
}: InteractiveJourneyProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showWelcomeBack, setShowWelcomeBack] = useState(!!existingData)
  const [selections, setSelections] = useState<Partial<ClassificationInput>>({
    expenseCategory: initialInput?.expenseCategory || '',
    customDescription: initialInput?.customDescription || '',
    fundType: initialInput?.fundType || 'pe',
    fundStage: initialInput?.fundStage || 'post-close',
    primaryBeneficiary: initialInput?.primaryBeneficiary || 'fund',
    lpaContext: initialInput?.lpaContext || ''
  })

  const currentStep = STEPS[currentStepIndex]
  const progress = (currentStepIndex / (STEPS.length - 1)) * 100
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1
  const currentPhase = PHASES.find(p => p.id === currentStep.phase) || PHASES[0]

  // Trigger celebration confetti
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#14b8a6', '#22c55e', '#6366f1'],
    })
  }, [])

  // Auto-advance helper (250ms delay for selections)
  const autoAdvance = useCallback(() => {
    setTimeout(() => {
      if (currentStepIndex < STEPS.length - 1) {
        setDirection(1)
        setCurrentStepIndex(prev => prev + 1)
      }
    }, 250)
  }, [currentStepIndex])

  // Handle going to next step
  const goNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setDirection(1)
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // Complete
      if (selections.expenseCategory) {
        onComplete(selections as ClassificationInput)
      }
    }
  }, [currentStepIndex, selections, onComplete])

  // Handle going to previous step
  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1)
      // Skip celebration steps when going back
      let prevStep = currentStepIndex - 1
      while (prevStep > 0 && STEPS[prevStep].isCelebration) {
        prevStep--
      }
      setCurrentStepIndex(prevStep)
    }
  }, [currentStepIndex])

  // Trigger celebration on celebration steps and auto-advance
  useEffect(() => {
    if (currentStep.isCelebration) {
      triggerCelebration()
      const timer = setTimeout(() => {
        setDirection(1)
        setCurrentStepIndex(prev => prev + 1)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentStepIndex, currentStep.isCelebration, triggerCelebration])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (canProceed() && !currentStep.isCelebration && !isLastStep) {
          goNext()
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        e.preventDefault()
        if (!isFirstStep) {
          goBack()
        }
      } else if (e.key >= '1' && e.key <= '6') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (currentStep.id === 'fund-type' && index < FUND_TYPES.length) {
          handleFundTypeSelect(FUND_TYPES[index].id as FundType)
        } else if (currentStep.id === 'fund-stage' && index < FUND_STAGES.length) {
          handleStageSelect(FUND_STAGES[index].id as FundStage)
        } else if (currentStep.id === 'beneficiary' && index < BENEFICIARIES.length) {
          handleBeneficiarySelect(BENEFICIARIES[index].id as Beneficiary)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStepIndex, selections, isFirstStep, isLastStep, currentStep])

  const canProceed = () => {
    switch (currentStep.id) {
      case 'welcome':
        return true
      case 'expense':
        return !!selections.expenseCategory && (selections.expenseCategory !== 'custom' || !!selections.customDescription)
      case 'fund-type':
        return !!selections.fundType
      case 'fund-stage':
        return !!selections.fundStage
      case 'beneficiary':
        return !!selections.primaryBeneficiary
      case 'review':
        return true
      default:
        return true
    }
  }

  const handleContinueExisting = () => {
    if (existingData) {
      onComplete(existingData)
    }
  }

  const handleStartFresh = () => {
    setShowWelcomeBack(false)
    setCurrentStepIndex(0)
  }

  const handleExpenseSelect = (categoryId: string) => {
    setSelections(prev => ({ ...prev, expenseCategory: categoryId }))
    autoAdvance()
  }

  const handleFundTypeSelect = (fundType: FundType) => {
    setSelections(prev => ({ ...prev, fundType }))
    autoAdvance()
  }

  const handleStageSelect = (stage: FundStage) => {
    setSelections(prev => ({ ...prev, fundStage: stage }))
    autoAdvance()
  }

  const handleBeneficiarySelect = (beneficiary: Beneficiary) => {
    setSelections(prev => ({ ...prev, primaryBeneficiary: beneficiary }))
    autoAdvance()
  }

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.id === selections.expenseCategory)
  const selectedFundType = FUND_TYPES.find(f => f.id === selections.fundType)
  const selectedStage = FUND_STAGES.find(s => s.id === selections.fundStage)
  const selectedBeneficiary = BENEFICIARIES.find(b => b.id === selections.primaryBeneficiary)

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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">
              You have a previous expense classification. Would you like to continue with it?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinueExisting}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              Continue with previous
            </button>
            <button
              onClick={handleStartFresh}
              className="w-full p-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            >
              Classify a new expense
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Navigation header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Back button */}
          {currentStepIndex > 0 && !currentStep.isCelebration ? (
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
                          ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                          : isCompleted
                          ? 'bg-emerald-400'
                          : 'bg-slate-700'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium transition-colors ${
                        isActive ? 'text-emerald-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {phase.name}
                    </span>
                  </div>
                  {i < PHASES.length - 1 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 -mt-4 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Skip button */}
          {currentStepIndex > 0 && !currentStep.isCelebration ? (
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
      <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 py-24 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-3xl"
          >
            {/* Welcome Step */}
            {currentStep.id === 'welcome' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative w-20 h-20 mx-auto mb-8"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Scale className="h-10 w-10 text-white" />
                  </div>
                  {/* Floating icons */}
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute -top-4 -right-4 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"
                  >
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="absolute -bottom-3 -left-4 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"
                  >
                    <Building2 className="h-4 w-4 text-amber-400" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight"
                >
                  Fund Expense Allocation
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-base sm:text-lg text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed"
                >
                  Determine whether an expense should be borne by the fund or the management company based on industry best practices.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-8"
                >
                  <div className="p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-xl sm:text-2xl mb-1">👥</div>
                    <div className="text-xs text-slate-400">Fund</div>
                    <div className="text-xs sm:text-sm font-medium text-emerald-400">LP bears cost</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-xl sm:text-2xl mb-1">🏢</div>
                    <div className="text-xs text-slate-400">Mgmt Co</div>
                    <div className="text-xs sm:text-sm font-medium text-amber-400">GP bears cost</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-slate-500/10 border border-slate-500/20">
                    <div className="text-xl sm:text-2xl mb-1">⚖️</div>
                    <div className="text-xs text-slate-400">Case-by-Case</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-400">LPA dependent</div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Expense Selection Step */}
            {currentStep.id === 'expense' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">What type of expense?</h2>
                  <p className="text-slate-400">Select the expense category you need to classify</p>
                </div>

                <div className="space-y-6 max-h-[45vh] overflow-y-auto pr-2">
                  {/* Fund Expenses */}
                  <div>
                    <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Typically Fund Expenses
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupedCategories.fundExpenses.map((category) => (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleExpenseSelect(category.id)}
                          className={`relative p-3 rounded-lg text-left transition-all active:scale-[0.98] ${
                            selections.expenseCategory === category.id
                              ? 'bg-emerald-500/20 border-2 border-emerald-400/50'
                              : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                          }`}
                        >
                          {selections.expenseCategory === category.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center"
                            >
                              <Check className="h-2.5 w-2.5 text-slate-900" />
                            </motion.div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-emerald-400">{getCategoryIcon(category.id)}</span>
                            <span className="font-medium text-white text-sm truncate">{category.name}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Case by Case */}
                  <div>
                    <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Case-by-Case (LPA Dependent)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupedCategories.caseByCase.map((category) => (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleExpenseSelect(category.id)}
                          className={`relative p-3 rounded-lg text-left transition-all active:scale-[0.98] ${
                            selections.expenseCategory === category.id
                              ? 'bg-amber-500/20 border-2 border-amber-400/50'
                              : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                          }`}
                        >
                          {selections.expenseCategory === category.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center"
                            >
                              <Check className="h-2.5 w-2.5 text-slate-900" />
                            </motion.div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-amber-400">{getCategoryIcon(category.id)}</span>
                            <span className="font-medium text-white text-sm truncate">{category.name}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Management Expenses */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Typically Management Company Expenses
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupedCategories.managementExpenses.map((category) => (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleExpenseSelect(category.id)}
                          className={`relative p-3 rounded-lg text-left transition-all active:scale-[0.98] ${
                            selections.expenseCategory === category.id
                              ? 'bg-slate-500/20 border-2 border-slate-400/50'
                              : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                          }`}
                        >
                          {selections.expenseCategory === category.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-400 flex items-center justify-center"
                            >
                              <Check className="h-2.5 w-2.5 text-slate-900" />
                            </motion.div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-400">{getCategoryIcon(category.id)}</span>
                            <span className="font-medium text-white text-sm truncate">{category.name}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {selections.expenseCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <p className="text-sm text-slate-300">
                      <span className="font-medium">{selectedCategory?.name}:</span>{' '}
                      <span className="text-slate-400">{selectedCategory?.description}</span>
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Celebration 1 - Expense Selected */}
            {currentStep.id === 'celebration-1' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                >
                  Expense Selected!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400"
                >
                  Now let's add context about your fund...
                </motion.p>
              </div>
            )}

            {/* Fund Type Step */}
            {currentStep.id === 'fund-type' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">What type of fund?</h2>
                  <p className="text-slate-400">Different fund types have different expense conventions</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FUND_TYPES.map((ft, index) => (
                    <motion.button
                      key={ft.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFundTypeSelect(ft.id as FundType)}
                      className={`relative p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
                        selections.fundType === ft.id
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {selections.fundType === ft.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-slate-900" />
                        </motion.div>
                      )}
                      <div className="text-2xl mb-2">{fundTypeEmojis[ft.id] || '📁'}</div>
                      <div className="font-semibold text-white text-sm mb-1">{ft.label}</div>
                      <div className="text-xs text-slate-500 line-clamp-2">{ft.description}</div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-slate-600">
                        Press {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Fund Stage Step */}
            {currentStep.id === 'fund-stage' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Clock className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Where is the fund in its lifecycle?</h2>
                  <p className="text-slate-400">Fund stage can affect expense allocation</p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                  {FUND_STAGES.map((stage, index) => (
                    <motion.button
                      key={stage.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStageSelect(stage.id as FundStage)}
                      className={`relative p-5 rounded-xl text-left transition-all active:scale-[0.98] ${
                        selections.fundStage === stage.id
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {selections.fundStage === stage.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-slate-900" />
                        </motion.div>
                      )}
                      <div className="text-3xl mb-3">{fundStageEmojis[stage.id] || '📅'}</div>
                      <div className="font-semibold text-white mb-1">{stage.label}</div>
                      <div className="text-sm text-slate-500">{stage.description}</div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-slate-600">
                        Press {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Beneficiary Step */}
            {currentStep.id === 'beneficiary' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Users className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Who primarily benefits?</h2>
                  <p className="text-slate-400">This helps determine the most appropriate allocation</p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {BENEFICIARIES.map((ben, index) => (
                    <motion.button
                      key={ben.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBeneficiarySelect(ben.id as Beneficiary)}
                      className={`relative p-6 rounded-xl text-center transition-all active:scale-[0.98] ${
                        selections.primaryBeneficiary === ben.id
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {selections.primaryBeneficiary === ben.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-slate-900" />
                        </motion.div>
                      )}
                      <div className="text-4xl mb-3">{beneficiaryEmojis[ben.id] || '👤'}</div>
                      <div className="font-semibold text-white mb-1">{ben.label}</div>
                      <div className="text-xs text-slate-500">{ben.description}</div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-600">
                        Press {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Celebration 2 - Context Complete */}
            {currentStep.id === 'celebration-2' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30"
                >
                  <ListChecks className="h-10 w-10 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                >
                  Context Complete!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400"
                >
                  Ready to generate your classification...
                </motion.p>
              </div>
            )}

            {/* Review Step */}
            {currentStep.id === 'review' && (
              <div>
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ready to classify</h2>
                  <p className="text-slate-400">Review your selections and get the allocation guidance</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Expense Type</span>
                      <span className="text-white font-semibold">{selectedCategory?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fund Type</span>
                      <span className="text-white font-semibold flex items-center gap-2">
                        <span>{fundTypeEmojis[selections.fundType || ''] || ''}</span>
                        {selectedFundType?.label || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fund Stage</span>
                      <span className="text-white font-semibold flex items-center gap-2">
                        <span>{fundStageEmojis[selections.fundStage || ''] || ''}</span>
                        {selectedStage?.label || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Beneficiary</span>
                      <span className="text-white font-semibold flex items-center gap-2">
                        <span>{beneficiaryEmojis[selections.primaryBeneficiary || ''] || ''}</span>
                        {selectedBeneficiary?.label || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-center">
                    <p className="text-slate-300 text-sm mb-1">Click below to see</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">Classification & Guidance</p>
                    <p className="text-emerald-400 text-sm mt-1">with LP sensitivity analysis</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Continue button - only show on non-celebration steps */}
        {!currentStep.isCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-8 left-0 right-0 flex flex-col items-center px-6 pb-safe"
          >
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-900 rounded-full shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? (
                <>
                  Get Classification
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
