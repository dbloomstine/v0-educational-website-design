"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FundInputs, FeePhase, FeeCalculationResult, FundType } from './types'
import { calculateManagementFees, validateFeePhases, generateDefaultFeePhases } from './fee-calculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoPopover } from '@/components/ui/info-popover'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Play,
  Calculator,
  Target,
  GraduationCap,
  BarChart3,
  CheckCircle2,
  Star,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeePhaseEditor } from './fee-phase-editor'
import { SummaryCards } from './summary-cards'
import { ResultsChart } from './results-chart'
import { ResultsTable } from './results-table'
import { ExportSection } from './export-section'
import { DisclaimerBlock, MethodologyBlock, RelatedToolsSection } from '@/components/tools/shared'
import { ShareButton } from '@/components/tools/share-button'

// Educational imports
import { JourneyMode } from './journey-mode'
import { Quiz, QuizResults, FEE_QUIZ_QUESTIONS } from './quiz'
import { Glossary } from './glossary'
import { FAQSection } from './faq-section'
import { ResultsWalkthrough } from './results-walkthrough'
import { EnhancedScenarios } from './enhanced-scenarios'
import {
  TrustIndicators,
  LearningOutcomes
} from './insights-content'

const fundTypeOptions: FundType[] = [
  'Private Equity',
  'Venture Capital',
  'Private Credit',
  'Real Estate',
  'Hedge Fund',
  'Other'
]

const fundTypeDescriptions: Record<FundType, string> = {
  'Private Equity': 'Typically 10-12 year term with 3-5 year investment period. Fees usually 2% on commitments during investment period, then 1.5-2% on invested capital.',
  'Venture Capital': 'Usually 10 year term with 3-4 year investment period. Fees typically 2-2.5% on commitments, sometimes flat through the entire fund life.',
  'Private Credit': 'Varies widely, often perpetual or 5-7 years. Fees range from 0.75-1.5% depending on strategy and leverage.',
  'Real Estate': 'Typically 7-10 year term with 2-3 year investment period. Fees usually 1-1.5% on commitments or invested capital.',
  'Hedge Fund': 'Usually perpetual with quarterly liquidity. Fees typically 1.5-2% on NAV annually.',
  'Other': 'Custom fund structure - adjust fee phases to match your LPA terms.'
}

// Default values for reset
const DEFAULT_INPUTS: FundInputs = {
  fundType: 'Venture Capital',
  fundSize: 50,
  fundTerm: 10,
  investmentPeriod: 4,
  gpCommitment: 2,
  navGrowthRate: 0
}

type ViewMode = 'calculator' | 'journey' | 'quiz' | 'glossary' | 'faq' | 'scenarios' | 'walkthrough'

export function ManagementFeeCalculator() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // View mode state - start directly in journey mode
  const [viewMode, setViewMode] = useState<ViewMode>('journey')
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null)
  const [showJourney, setShowJourney] = useState(true) // Full-screen journey on first load
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Parse initial state from URL or use defaults
  const getInitialInputs = (): FundInputs => {
    if (typeof window === 'undefined') return DEFAULT_INPUTS

    return {
      fundType: (searchParams.get('type') as FundType) || DEFAULT_INPUTS.fundType,
      fundSize: parseFloat(searchParams.get('size') || '') || DEFAULT_INPUTS.fundSize,
      fundTerm: parseInt(searchParams.get('term') || '') || DEFAULT_INPUTS.fundTerm,
      investmentPeriod: parseInt(searchParams.get('ip') || '') || DEFAULT_INPUTS.investmentPeriod,
      gpCommitment: parseFloat(searchParams.get('gp') || '') || DEFAULT_INPUTS.gpCommitment,
      navGrowthRate: parseFloat(searchParams.get('nav') || '') || DEFAULT_INPUTS.navGrowthRate
    }
  }

  // Fund inputs state
  const [fundInputs, setFundInputs] = useState<FundInputs>(getInitialInputs)

  // Fee phases state
  const [feePhases, setFeePhases] = useState<FeePhase[]>([])

  // Results state
  const [result, setResult] = useState<FeeCalculationResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Initialize with default phases
  useEffect(() => {
    const defaultPhases = generateDefaultFeePhases(fundInputs)
    setFeePhases(defaultPhases)
  }, [])

  // Recalculate when inputs or phases change
  useEffect(() => {
    const validation = validateFeePhases(feePhases, fundInputs.fundTerm)
    setValidationErrors(validation.errors)

    if (validation.valid && feePhases.length > 0) {
      const calculatedResult = calculateManagementFees(fundInputs, feePhases)
      setResult(calculatedResult)
      setLastSaved(new Date())
    } else {
      setResult(null)
    }
  }, [fundInputs, feePhases])

  // Update URL when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('type', fundInputs.fundType)
      params.set('size', String(fundInputs.fundSize))
      params.set('term', String(fundInputs.fundTerm))
      params.set('ip', String(fundInputs.investmentPeriod))
      if (fundInputs.navGrowthRate) params.set('nav', String(fundInputs.navGrowthRate))

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [fundInputs, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('type', fundInputs.fundType)
    params.set('size', String(fundInputs.fundSize))
    params.set('term', String(fundInputs.fundTerm))
    params.set('ip', String(fundInputs.investmentPeriod))
    if (fundInputs.navGrowthRate) params.set('nav', String(fundInputs.navGrowthRate))

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [fundInputs, pathname])

  const handleFundInputChange = (updates: Partial<FundInputs>) => {
    setFundInputs(prev => ({ ...prev, ...updates }))
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setFundInputs(DEFAULT_INPUTS)
    setFeePhases(generateDefaultFeePhases(DEFAULT_INPUTS))
  }

  // Journey mode handlers
  const handleJourneyComplete = (inputs: FundInputs, phases: FeePhase[]) => {
    setFundInputs(inputs)
    setFeePhases(phases)
    setShowJourney(false)
    // Show results walkthrough after journey to explain the results
    setViewMode('walkthrough')
  }

  const handleJourneySkip = () => {
    setShowJourney(false)
    setViewMode('calculator')
  }

  // Check if user has existing data (returning user)
  const hasExistingData = feePhases.length > 0 && result !== null

  // Quiz handlers
  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total })
  }

  const handleQuizRetry = () => {
    setQuizScore(null)
  }

  // Scenario selection handler
  const handleScenarioSelect = (inputs: FundInputs, phases: FeePhase[]) => {
    setFundInputs(inputs)
    setFeePhases(phases)
    setViewMode('calculator')
  }

  // Render welcome/mode selection
  const renderWelcome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-0"
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-4 sm:space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-block rounded-full bg-primary/10 p-4 sm:p-6"
          >
            <Calculator className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
          </motion.div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Management Fee Calculator</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Model your fund-level management fees and understand how different structures impact GP and LP economics.
            </p>
          </div>

          {/* Trust indicators */}
          <TrustIndicators />

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowJourney(true)
                setViewMode('journey')
              }}
              aria-label="Start guided journey to learn fee concepts"
              className="p-4 sm:p-6 rounded-xl border-2 border-primary bg-primary/5 text-left hover:bg-primary/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="rounded-full bg-primary/20 p-1.5 sm:p-2">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <Badge className="bg-green-100 text-green-700 text-xs">Recommended</Badge>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1">Guided Journey</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Learn fee concepts step-by-step while building your model. Perfect for first-timers.
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowJourney(false)
                setViewMode('calculator')
              }}
              aria-label="Jump directly to calculator"
              className="p-4 sm:p-6 rounded-xl border-2 border-muted-foreground/30 text-left hover:border-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="rounded-full bg-muted p-1.5 sm:p-2">
                  <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1">Jump to Calculator</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Skip the tutorial and go straight to modeling. Best if you're already familiar with fee structures.
              </p>
            </motion.button>
          </div>

          {/* Learning outcomes */}
          <div className="text-left">
            <LearningOutcomes />
          </div>

          {/* Quick start scenarios */}
          <div className="pt-4 sm:pt-6 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Or explore a sample scenario:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Emerging VC', 'PE Fund', 'Private Credit'].map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowJourney(false)
                    setViewMode('scenarios')
                  }}
                  aria-label={`Explore ${name} scenario`}
                  className="gap-1.5 sm:gap-2 text-xs sm:text-sm min-h-[44px] focus:ring-2 focus:ring-primary"
                >
                  <Play className="h-3 w-3" aria-hidden="true" />
                  {name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // Render navigation tabs
  const renderNavigation = () => (
    <nav className="mb-4 sm:mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto" aria-label="Tool navigation">
      <div className="flex items-center gap-2 min-w-max sm:flex-wrap pb-2 sm:pb-0">
        <Button
          variant={viewMode === 'calculator' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode('calculator')}
          aria-label="Calculator mode"
          aria-current={viewMode === 'calculator' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xs:inline">Calculator</span>
          <span className="xs:hidden">Calc</span>
        </Button>
        <Button
          variant={viewMode === 'journey' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode('journey')}
          aria-label="Guided learning journey"
          aria-current={viewMode === 'journey' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          Learn
        </Button>
        <Button
          variant={viewMode === 'scenarios' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode('scenarios')}
          aria-label="Sample scenarios"
          aria-current={viewMode === 'scenarios' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <Target className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xs:inline">Scenarios</span>
          <span className="xs:hidden">Demo</span>
        </Button>
        <Button
          variant={viewMode === 'quiz' ? 'default' : 'outline'}
          size="lg"
          onClick={() => {
            setViewMode('quiz')
            setQuizScore(null)
          }}
          aria-label="Knowledge quiz"
          aria-current={viewMode === 'quiz' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <Star className="h-4 w-4" aria-hidden="true" />
          Quiz
        </Button>
        <Button
          variant={viewMode === 'glossary' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode('glossary')}
          aria-label="Glossary of terms"
          aria-current={viewMode === 'glossary' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Glossary</span>
          <span className="sm:hidden">Terms</span>
        </Button>
        <Button
          variant={viewMode === 'faq' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode('faq')}
          aria-label="Frequently asked questions"
          aria-current={viewMode === 'faq' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          FAQ
        </Button>
      </div>
    </nav>
  )


  // Show full-screen journey mode first
  if (showJourney) {
    return (
      <JourneyMode
        onComplete={handleJourneyComplete}
        onSkip={handleJourneySkip}
        existingData={hasExistingData ? { inputs: fundInputs, phases: feePhases } : null}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center relative px-4 sm:px-0">
        <div className="flex justify-center gap-2 mb-3 sm:absolute sm:right-0 sm:top-0 sm:mb-0">
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          Management Fee Calculator
        </h1>
        <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-lg text-muted-foreground">
          Model fund-level management fees and understand how different structures impact economics.
        </p>
      </div>

      {/* Navigation tabs */}
      {renderNavigation()}

      {/* Main content based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'journey' && (
          <motion.div
            key="journey"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Want to go through the guided setup again?</p>
              <Button onClick={() => setShowJourney(true)} size="lg">
                Start Guided Journey
              </Button>
            </div>
          </motion.div>
        )}

        {viewMode === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                {quizScore ? (
                  <QuizResults
                    score={quizScore.score}
                    total={quizScore.total}
                    onRetry={handleQuizRetry}
                    onClose={() => setViewMode('calculator')}
                  />
                ) : (
                  <Quiz
                    questions={FEE_QUIZ_QUESTIONS.slice(0, 5)}
                    onComplete={handleQuizComplete}
                    onClose={() => setViewMode('calculator')}
                  />
                )}
              </motion.div>
            )}

            {viewMode === 'glossary' && (
              <motion.div
                key="glossary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto"
              >
                <Glossary
                  onClose={() => setViewMode('calculator')}
                />
              </motion.div>
            )}

            {viewMode === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto"
              >
                <FAQSection
                  onClose={() => setViewMode('calculator')}
                />
              </motion.div>
            )}

            {viewMode === 'scenarios' && (
              <motion.div
                key="scenarios"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <EnhancedScenarios
                  onSelectScenario={handleScenarioSelect}
                  onClose={() => setViewMode('calculator')}
                />
              </motion.div>
            )}

            {viewMode === 'walkthrough' && result && (
              <motion.div
                key="walkthrough"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto"
              >
                <ResultsWalkthrough
                  result={result}
                  fundInputs={fundInputs}
                  feePhases={feePhases}
                  onClose={() => setViewMode('calculator')}
                />
              </motion.div>
            )}

            {viewMode === 'calculator' && (
              <motion.div
                key="calculator"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Educational disclaimer */}
                <div className="flex items-start gap-2 p-2.5 sm:p-3 mb-4 sm:mb-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                    This is an educational tool for modeling management fees. Actual fee calculations
                    may be more complex depending on your LPA terms. Always consult with legal counsel.
                  </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {/* Left Column - Inputs */}
                  <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                    {/* Fund Basics */}
                    <Card>
                      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">
                          Fund Basics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="fund-type" className="text-sm">Fund Type</Label>
                            <InfoPopover>
                              {fundTypeDescriptions[fundInputs.fundType]}
                            </InfoPopover>
                          </div>
                          <Select
                            value={fundInputs.fundType}
                            onValueChange={(value) => handleFundInputChange({ fundType: value as FundType })}
                          >
                            <SelectTrigger id="fund-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fundTypeOptions.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="fund-size" className="text-sm">Target Fund Size ($ millions)</Label>
                            <InfoPopover>
                              Total committed capital from all LPs and the GP. Emerging manager funds typically range from $10M to $100M.
                            </InfoPopover>
                          </div>
                          <Input
                            id="fund-size"
                            type="number"
                            min={0}
                            max={10000}
                            value={fundInputs.fundSize}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              const clamped = Math.max(0, Math.min(10000, value))
                              handleFundInputChange({ fundSize: clamped })
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Typical emerging fund: $10M - $100M</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="fund-term" className="text-sm">Fund Term (years)</Label>
                            <InfoPopover>
                              Total life of the fund before final liquidation, including any extensions. Most PE/VC funds are 10 years.
                            </InfoPopover>
                          </div>
                          <Input
                            id="fund-term"
                            type="number"
                            min={1}
                            max={25}
                            value={fundInputs.fundTerm}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1
                              const clamped = Math.max(1, Math.min(25, value))
                              handleFundInputChange({ fundTerm: clamped })
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="investment-period" className="text-sm">Investment Period (years)</Label>
                            <InfoPopover>
                              The period during which the fund can make new investments. Typically 3-5 years for PE/VC.
                            </InfoPopover>
                          </div>
                          <Input
                            id="investment-period"
                            type="number"
                            min={1}
                            max={fundInputs.fundTerm}
                            value={fundInputs.investmentPeriod}
                            onChange={(e) => handleFundInputChange({ investmentPeriod: parseInt(e.target.value) || 4 })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="nav-growth" className="text-sm">Annual NAV Growth Rate (%) - Optional</Label>
                            <InfoPopover>
                              Assumed annual growth in portfolio value. Only affects NAV-based fee calculations. Leave at 0 for conservative estimates.
                            </InfoPopover>
                          </div>
                          <Input
                            id="nav-growth"
                            type="number"
                            min={-20}
                            max={50}
                            step={1}
                            value={fundInputs.navGrowthRate || 0}
                            onChange={(e) => handleFundInputChange({ navGrowthRate: parseFloat(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">Use 0% for flat/conservative model</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fee Phase Editor */}
                    <FeePhaseEditor
                      phases={feePhases}
                      fundTerm={fundInputs.fundTerm}
                      onPhasesChange={setFeePhases}
                      errors={validationErrors}
                    />

                    {/* Reset Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={resetToDefaults}
                        aria-label="Reset all values to defaults"
                        title="Clear all inputs and restore default values"
                        className="text-xs sm:text-sm min-h-[44px] focus:ring-2 focus:ring-primary"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                        Reset to Defaults
                      </Button>
                    </div>
                  </div>

                  {/* Right Column - Results */}
                  <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {result ? (
                      <>
                        {/* Results summary with walkthrough button */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold">Results</h3>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setViewMode('walkthrough')}
                            aria-label="Open results explanation walkthrough"
                            className="gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[44px] focus:ring-2 focus:ring-primary"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            Explain Results
                          </Button>
                        </div>

                        <SummaryCards result={result} fundSize={fundInputs.fundSize} />
                        <ResultsChart yearlyData={result.yearlyData} />
                        <ResultsTable yearlyData={result.yearlyData} />

                        <ExportSection fundInputs={fundInputs} result={result} feePhases={feePhases} />

                        {/* Related Tools */}
                        <RelatedToolsSection
                          currentToolSlug="management-fee-calculator"
                          relatedTools={[
                            {
                              slug: 'distribution-waterfall',
                              title: 'Distribution Waterfall Visualizer',
                              description: 'Visualize LP and GP economics across preferred return, catch-up, and carry tiers.',
                              reason: 'After modeling your management fees, understand how profits flow through the waterfall'
                            },
                            {
                              slug: 'management-company-budget',
                              title: 'Management Company Budget Planner',
                              description: 'Calculate your burn rate, runway, and seed capital needs with a simple budget model.',
                              reason: 'Use your fee projections to build a realistic management company budget'
                            }
                          ]}
                          learningPath="Master fund economics: Fee Calculator → Waterfall → Credit Line"
                        />

                        {/* Methodology */}
                        <MethodologyBlock
                          sources={[
                            { text: "ILPA Fee Reporting Template (industry standard)" },
                            { text: "Market practice from 500+ PE/VC funds" },
                            { text: "Based on typical LPA fee provisions" }
                          ]}
                        >
                          <p className="font-medium text-foreground mb-2">Our Calculation Approach:</p>
                          <ul className="space-y-1.5 ml-4 list-disc">
                            <li>
                              <strong>Fee Phases:</strong> We apply different fee rates to different bases (commitments, invested capital, or NAV)
                              based on your custom phase definitions. Most funds step down from commitment-based fees during the investment period
                              to capital-based fees during the harvest period.
                            </li>
                            <li>
                              <strong>Year-by-Year Calculation:</strong> Fees are calculated annually based on the applicable fee base at the start
                              of each year. For NAV-based fees, we apply your specified growth rate assumption.
                            </li>
                            <li>
                              <strong>Total Economics:</strong> We sum all annual management fees across the fund term to show total fees collected,
                              fees as a percentage of commitments, and effective annual rate.
                            </li>
                            <li>
                              <strong>Assumptions:</strong> Calculations assume fees are paid in full on schedule. Actual fees may vary based on
                              capital called, portfolio valuations, fee offsets, waivers, or other LPA terms not modeled here.
                            </li>
                          </ul>
                        </MethodologyBlock>

                        <DisclaimerBlock
                          additionalDisclaimer="Always consult with legal counsel and fund administrators before finalizing your LPA fee terms."
                        />
                      </>
                    ) : (
                      <Card>
                        <CardContent className="py-8 sm:py-12">
                          <div className="text-center text-muted-foreground">
                            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                            <p className="text-sm sm:text-base">Configure your fund basics and fee schedule to see results</p>
                            {validationErrors.length > 0 && (
                              <p className="mt-2 text-xs sm:text-sm text-destructive">Please fix validation errors to continue</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  )
}
