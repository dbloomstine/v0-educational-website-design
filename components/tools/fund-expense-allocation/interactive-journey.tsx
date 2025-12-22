'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Zap,
  CheckCircle2,
  Briefcase,
  Building2,
  Users,
  DollarSign,
  Scale,
  Rocket,
  TrendingUp,
  Home,
  Layers,
  Target,
  Clock,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
  FileText,
  Banknote,
  Gavel,
  Plane,
  Monitor,
  Shield,
  UserCheck
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
type StepId = 'welcome' | 'expense' | 'fund-type' | 'fund-stage' | 'beneficiary' | 'context' | 'review'

interface Step {
  id: StepId
  title: string
  subtitle: string
  xpReward: number
}

const STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome', subtitle: 'Learn about expense allocation', xpReward: 0 },
  { id: 'expense', title: 'Select Expense', subtitle: 'What expense are you analyzing?', xpReward: 10 },
  { id: 'fund-type', title: 'Fund Type', subtitle: 'What type of fund is this?', xpReward: 10 },
  { id: 'fund-stage', title: 'Fund Stage', subtitle: 'Where is the fund in its lifecycle?', xpReward: 10 },
  { id: 'beneficiary', title: 'Beneficiary', subtitle: 'Who primarily benefits?', xpReward: 10 },
  { id: 'context', title: 'Additional Context', subtitle: 'Any specific LPA terms? (Optional)', xpReward: 5 },
  { id: 'review', title: 'Review', subtitle: 'Confirm your selections', xpReward: 0 }
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

// Fund type icons
const getFundTypeIcon = (fundType: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'pe': <Briefcase className="h-6 w-6" />,
    'vc': <Rocket className="h-6 w-6" />,
    'private-credit': <TrendingUp className="h-6 w-6" />,
    'real-estate': <Home className="h-6 w-6" />,
    'fund-of-funds': <Layers className="h-6 w-6" />,
    'hybrid': <Target className="h-6 w-6" />
  }
  return iconMap[fundType] || <Briefcase className="h-6 w-6" />
}

// Fund stage icons
const getFundStageIcon = (stage: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'pre-launch': <Sparkles className="h-6 w-6" />,
    'fundraising': <Users className="h-6 w-6" />,
    'post-close': <TrendingUp className="h-6 w-6" />,
    'harvesting': <DollarSign className="h-6 w-6" />
  }
  return iconMap[stage] || <Clock className="h-6 w-6" />
}

// Beneficiary icons
const getBeneficiaryIcon = (beneficiary: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'fund': <Users className="h-6 w-6" />,
    'management': <Briefcase className="h-6 w-6" />,
    'both': <Scale className="h-6 w-6" />
  }
  return iconMap[beneficiary] || <Users className="h-6 w-6" />
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
  onXPEarned: (xp: number) => void
  initialInput?: Partial<ClassificationInput>
}

export function InteractiveJourney({
  onComplete,
  onSkip,
  onXPEarned,
  initialInput
}: InteractiveJourneyProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selections, setSelections] = useState<Partial<ClassificationInput>>({
    expenseCategory: initialInput?.expenseCategory || '',
    customDescription: initialInput?.customDescription || '',
    fundType: initialInput?.fundType || 'pe',
    fundStage: initialInput?.fundStage || 'post-close',
    primaryBeneficiary: initialInput?.primaryBeneficiary || 'fund',
    lpaContext: initialInput?.lpaContext || ''
  })
  const [showLearnMore, setShowLearnMore] = useState<string | null>(null)
  const [earnedStepXP, setEarnedStepXP] = useState<Set<number>>(new Set())

  const currentStep = STEPS[currentStepIndex]
  const progress = (currentStepIndex / (STEPS.length - 1)) * 100

  // Handle step completion XP
  const handleStepXP = (stepIndex: number) => {
    if (!earnedStepXP.has(stepIndex) && STEPS[stepIndex].xpReward > 0) {
      onXPEarned(STEPS[stepIndex].xpReward)
      setEarnedStepXP(prev => new Set([...prev, stepIndex]))
    }
  }

  const goToNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      handleStepXP(currentStepIndex)
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const goToPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    if (selections.expenseCategory) {
      onComplete(selections as ClassificationInput)
    }
  }

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
      case 'context':
        return true
      case 'review':
        return true
      default:
        return true
    }
  }

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.id === selections.expenseCategory)
  const selectedFundType = FUND_TYPES.find(f => f.id === selections.fundType)
  const selectedStage = FUND_STAGES.find(s => s.id === selections.fundStage)
  const selectedBeneficiary = BENEFICIARIES.find(b => b.id === selections.primaryBeneficiary)

  // Render step content
  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 sm:space-y-6"
          >
            <div className="inline-block rounded-full bg-primary/10 p-4 sm:p-6">
              <Scale className="h-10 w-10 sm:h-14 sm:w-14 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Expense Allocation Helper</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                We'll walk you through classifying fund expenses step-by-step.
                Learn whether an expense should be borne by the fund or the management company.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 max-w-2xl mx-auto text-left">
              <div className="p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <DollarSign className="h-5 w-5 text-green-600 mb-2" />
                <h4 className="font-medium text-sm">Fund Expenses</h4>
                <p className="text-xs text-muted-foreground">Borne by the limited partnership</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Briefcase className="h-5 w-5 text-blue-600 mb-2" />
                <h4 className="font-medium text-sm">Management Expenses</h4>
                <p className="text-xs text-muted-foreground">Borne by the GP/manager</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Scale className="h-5 w-5 text-amber-600 mb-2" />
                <h4 className="font-medium text-sm">Case-by-Case</h4>
                <p className="text-xs text-muted-foreground">Depends on context & LPA</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-amber-600">
              <Zap className="h-4 w-4" />
              <span>Earn up to 45 XP by completing this analysis</span>
            </div>
          </motion.div>
        )

      case 'expense':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-1">What expense are you analyzing?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Select a category or describe a custom expense</p>
            </div>

            {/* Expense category groups */}
            <div className="space-y-4 sm:space-y-6">
              {/* Fund Expenses */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Badge className="bg-green-100 text-green-700 text-xs">Usually Fund Expense</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupedCategories.fundExpenses.slice(0, 6).map(category => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelections(prev => ({ ...prev, expenseCategory: category.id }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selections.expenseCategory === category.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`rounded-full p-1.5 flex-shrink-0 ${
                          selections.expenseCategory === category.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {getCategoryIcon(category.id)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{category.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Management Expenses */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Badge className="bg-blue-100 text-blue-700 text-xs">Usually Management Expense</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupedCategories.managementExpenses.slice(0, 6).map(category => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelections(prev => ({ ...prev, expenseCategory: category.id }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selections.expenseCategory === category.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`rounded-full p-1.5 flex-shrink-0 ${
                          selections.expenseCategory === category.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {getCategoryIcon(category.id)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{category.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Case-by-Case */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Often Negotiated</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupedCategories.caseByCase.map(category => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelections(prev => ({ ...prev, expenseCategory: category.id }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selections.expenseCategory === category.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`rounded-full p-1.5 flex-shrink-0 ${
                          selections.expenseCategory === category.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {getCategoryIcon(category.id)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{category.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom option */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelections(prev => ({ ...prev, expenseCategory: 'custom' }))}
                  className={`w-full p-3 rounded-lg border-2 border-dashed text-left transition-all ${
                    selections.expenseCategory === 'custom'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-sm">Describe a different expense...</span>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {selections.expenseCategory === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <Textarea
                        placeholder="Describe the expense you want to classify..."
                        value={selections.customDescription || ''}
                        onChange={e => setSelections(prev => ({ ...prev, customDescription: e.target.value }))}
                        className="text-sm min-h-[80px]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )

      case 'fund-type':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-1">What type of fund is this?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Different fund types have different expense conventions</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {FUND_TYPES.map(fundType => (
                <motion.button
                  key={fundType.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelections(prev => ({ ...prev, fundType: fundType.id as FundType }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selections.fundType === fundType.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 flex-shrink-0 ${
                      selections.fundType === fundType.id
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getFundTypeIcon(fundType.id)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{fundType.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fundType.description}</p>
                    </div>
                  </div>
                  {selections.fundType === fundType.id && (
                    <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Educational tip */}
            <div className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-blue-800 dark:text-blue-200">Why does fund type matter?</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Different fund types have different cost structures. For example, real estate funds often have
                    property-level expenses, while fund-of-funds have different broken deal conventions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 'fund-stage':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-1">Where is the fund in its lifecycle?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">The fund stage affects expense classification rules</p>
            </div>

            {/* Timeline visualization */}
            <div className="relative py-4">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2" />
              <div className="relative flex justify-between">
                {FUND_STAGES.map((stage, index) => (
                  <motion.button
                    key={stage.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelections(prev => ({ ...prev, fundStage: stage.id as FundStage }))}
                    className="flex flex-col items-center"
                  >
                    <div className={`relative z-10 rounded-full p-2 sm:p-3 transition-all ${
                      selections.fundStage === stage.id
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}>
                      {getFundStageIcon(stage.id)}
                    </div>
                    <p className={`mt-2 text-xs sm:text-sm font-medium text-center max-w-[70px] sm:max-w-[100px] ${
                      selections.fundStage === stage.id ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {stage.label}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Selected stage details */}
            <AnimatePresence mode="wait">
              {selectedStage && (
                <motion.div
                  key={selectedStage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <h4 className="font-semibold text-sm sm:text-base mb-1">{selectedStage.label}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedStage.description}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Educational tip */}
            <div className="p-3 sm:p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Fundraising stage matters!</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    During fundraising, costs like placement agent fees and LP marketing are typically borne
                    by the management company, not the fund.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 'beneficiary':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-1">Who primarily benefits from this expense?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">This is a key factor in determining allocation</p>
            </div>

            <div className="grid gap-3">
              {BENEFICIARIES.map(beneficiary => (
                <motion.button
                  key={beneficiary.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelections(prev => ({ ...prev, primaryBeneficiary: beneficiary.id as Beneficiary }))}
                  className={`p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                    selections.primaryBeneficiary === beneficiary.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full p-3 flex-shrink-0 ${
                      selections.primaryBeneficiary === beneficiary.id
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getBeneficiaryIcon(beneficiary.id)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base">{beneficiary.label}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{beneficiary.description}</p>
                    </div>
                    {selections.primaryBeneficiary === beneficiary.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Educational tip */}
            <div className="p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-green-800 dark:text-green-200">The benefit test</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Generally, if an expense primarily benefits the fund/LPs, it should be a fund expense.
                    If it primarily benefits the GP's platform or ability to raise future funds, it's typically
                    a management expense.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 'context':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-1">Any additional context?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Optional: Add LPA-specific terms or special circumstances</p>
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder="E.g., 'LPA specifies 50/50 allocation for D&O insurance' or 'First-time fund with organizational expense cap'..."
                value={selections.lpaContext || ''}
                onChange={e => setSelections(prev => ({ ...prev, lpaContext: e.target.value }))}
                className="min-h-[120px] text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This helps provide more tailored guidance. If you don't have specific LPA terms to add,
                you can skip this step.
              </p>
            </div>

            {/* Quick tips */}
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
              <p className="font-medium text-sm mb-2">Common LPA provisions to consider:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Organizational expense caps (e.g., "$500K cap on org costs")</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Fee offset provisions for transaction fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Specific allocation ratios for shared expenses</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Side letter commitments to certain LPs</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )

      case 'review':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-1">Review Your Selections</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Confirm everything looks correct before analyzing</p>
            </div>

            <div className="space-y-3">
              {/* Expense */}
              <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Expense Category</p>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedCategory?.name || selections.customDescription || 'Not selected'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStepIndex(1)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Fund Type */}
              <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Fund Type</p>
                    <p className="font-medium text-sm sm:text-base">{selectedFundType?.label || 'Not selected'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStepIndex(2)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Fund Stage */}
              <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Fund Stage</p>
                    <p className="font-medium text-sm sm:text-base">{selectedStage?.label || 'Not selected'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStepIndex(3)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Beneficiary */}
              <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Primary Beneficiary</p>
                    <p className="font-medium text-sm sm:text-base">{selectedBeneficiary?.label || 'Not selected'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStepIndex(4)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Context (if provided) */}
              {selections.lpaContext && (
                <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Additional Context</p>
                      <p className="font-medium text-sm line-clamp-2">{selections.lpaContext}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStepIndex(5)}>
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4 sm:p-6">
        {/* Progress bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
            <span className="font-medium">{currentStep.title}</span>
            <span className="text-muted-foreground">Step {currentStepIndex + 1} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div>
            {currentStepIndex > 0 ? (
              <Button variant="outline" onClick={goToPrev} className="gap-1.5 text-sm">
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            ) : (
              <Button variant="ghost" onClick={onSkip} className="text-sm text-muted-foreground">
                Skip tutorial
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep.xpReward > 0 && !earnedStepXP.has(currentStepIndex) && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                +{currentStep.xpReward} XP
              </Badge>
            )}

            {currentStepIndex === STEPS.length - 1 ? (
              <Button onClick={handleComplete} disabled={!canProceed()} className="gap-1.5 text-sm">
                <Sparkles className="h-4 w-4" />
                Analyze Expense
              </Button>
            ) : (
              <Button onClick={goToNext} disabled={!canProceed()} className="gap-1.5 text-sm">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
