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
  Sparkles,
  Trophy,
  BookOpen,
  HelpCircle,
  Play,
  Calculator,
  Target,
  Zap,
  GraduationCap,
  BarChart3,
  ChevronRight,
  Star,
  CheckCircle2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeePhaseEditor } from './fee-phase-editor'
import { SummaryCards } from './summary-cards'
import { ResultsChart } from './results-chart'
import { ResultsTable } from './results-table'
import { ExportSection } from './export-section'
import { DisclaimerBlock } from '@/components/tools/shared'
import { ShareButton } from '@/components/tools/share-button'

// Gamification imports
import {
  useGamification,
  AchievementPopup,
  LevelUpPopup,
  XPProgressBar,
  LEVELS,
  GamificationState
} from './gamification'
import { JourneyMode } from './journey-mode'
import { Quiz, QuizResults, FEE_QUIZ_QUESTIONS } from './quiz'
import { Confetti } from './visual-effects'
import { Glossary } from './glossary'
import { FAQSection } from './faq-section'
import { ResultsWalkthrough } from './results-walkthrough'
import { EnhancedScenarios } from './enhanced-scenarios'

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

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('journey')
  const [showConfetti, setShowConfetti] = useState(false)
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Gamification
  const gamification = useGamification()
  const currentLevel = gamification.getCurrentLevel()
  const nextLevel = gamification.getNextLevel()

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

  // Initialize with default phases and check for first visit
  useEffect(() => {
    const defaultPhases = generateDefaultFeePhases(fundInputs)
    setFeePhases(defaultPhases)

    // Check for first visit achievement
    if (!gamification.state.achievements.find(a => a.id === 'early-bird')?.unlocked) {
      gamification.unlockAchievement('early-bird')
    }

    // Check if user completed journey before
    if (gamification.state.tutorialCompleted) {
      setViewMode('calculator')
      setShowWelcome(false)
    }
  }, [])

  // Recalculate when inputs or phases change
  useEffect(() => {
    const validation = validateFeePhases(feePhases, fundInputs.fundTerm)
    setValidationErrors(validation.errors)

    if (validation.valid && feePhases.length > 0) {
      const calculatedResult = calculateManagementFees(fundInputs, feePhases)
      setResult(calculatedResult)
      setLastSaved(new Date())

      // Check achievements
      if (fundInputs.fundSize >= 100) {
        gamification.unlockAchievement('big-fund')
      }
      if (calculatedResult.feesAsPercentOfCommitments < 15) {
        gamification.unlockAchievement('fee-friendly')
      }
      if (feePhases.length >= 3) {
        gamification.unlockAchievement('phase-tinkerer')
      }
    } else {
      setResult(null)
    }
  }, [fundInputs, feePhases])

  // Track fund type exploration
  useEffect(() => {
    gamification.trackFundTypeExplored(fundInputs.fundType)
  }, [fundInputs.fundType])

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
    setViewMode('calculator')
    gamification.completeTutorial()
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleJourneySkip = () => {
    setViewMode('calculator')
  }

  // Quiz handlers
  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total })
    if (score === total) {
      gamification.unlockAchievement('perfect-score')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  const handleQuizRetry = () => {
    setQuizScore(null)
  }

  // Scenario selection handler
  const handleScenarioSelect = (inputs: FundInputs, phases: FeePhase[]) => {
    setFundInputs(inputs)
    setFeePhases(phases)
    gamification.trackScenarioExplored(inputs.fundType + '-' + inputs.fundSize)
    setViewMode('calculator')
  }

  // Render welcome/mode selection
  const renderWelcome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-block rounded-full bg-primary/10 p-6"
          >
            <Calculator className="h-12 w-12 text-primary" />
          </motion.div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Management Fee Calculator</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Model your fund-level management fees and understand how different structures impact GP and LP economics.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowWelcome(false)
                setViewMode('journey')
              }}
              className="p-6 rounded-xl border-2 border-primary bg-primary/5 text-left hover:bg-primary/10 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <Badge className="bg-green-100 text-green-700">Recommended</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">Guided Journey</h3>
              <p className="text-sm text-muted-foreground">
                Learn fee concepts step-by-step while building your model. Perfect for first-timers.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-amber-600">
                <Zap className="h-3 w-3" />
                <span>Earn up to 200 XP</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowWelcome(false)
                setViewMode('calculator')
              }}
              className="p-6 rounded-xl border-2 border-muted-foreground/30 text-left hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-muted p-2">
                  <Calculator className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">Jump to Calculator</h3>
              <p className="text-sm text-muted-foreground">
                Skip the tutorial and go straight to modeling. Best if you're already familiar with fee structures.
              </p>
            </motion.button>
          </div>

          {/* Quick start scenarios */}
          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-4">Or explore a sample scenario:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Emerging VC', 'PE Fund', 'Private Credit'].map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowWelcome(false)
                    setViewMode('scenarios')
                  }}
                  className="gap-2"
                >
                  <Play className="h-3 w-3" />
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
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <Button
        variant={viewMode === 'calculator' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('calculator')}
        className="gap-2"
      >
        <Calculator className="h-4 w-4" />
        Calculator
      </Button>
      <Button
        variant={viewMode === 'journey' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('journey')}
        className="gap-2"
      >
        <GraduationCap className="h-4 w-4" />
        Learn
      </Button>
      <Button
        variant={viewMode === 'scenarios' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('scenarios')}
        className="gap-2"
      >
        <Target className="h-4 w-4" />
        Scenarios
      </Button>
      <Button
        variant={viewMode === 'quiz' ? 'default' : 'outline'}
        size="sm"
        onClick={() => {
          setViewMode('quiz')
          setQuizScore(null)
        }}
        className="gap-2"
      >
        <Star className="h-4 w-4" />
        Quiz
      </Button>
      <Button
        variant={viewMode === 'glossary' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('glossary')}
        className="gap-2"
      >
        <BookOpen className="h-4 w-4" />
        Glossary
      </Button>
      <Button
        variant={viewMode === 'faq' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('faq')}
        className="gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        FAQ
      </Button>
    </div>
  )

  // Render XP bar
  const renderXPBar = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <XPProgressBar
          xp={gamification.state.xp}
          currentLevel={currentLevel}
          nextLevel={nextLevel}
        />
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">
              {gamification.state.achievements.filter(a => a.unlocked).length} / {gamification.state.achievements.length} achievements
            </span>
          </div>
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('walkthrough')}
              className="gap-2 text-primary"
            >
              <BarChart3 className="h-4 w-4" />
              Understand Results
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Confetti effect */}
      <Confetti show={showConfetti} />

      {/* Achievement popup */}
      <AchievementPopup
        achievement={gamification.showAchievement}
        onClose={() => gamification.setShowAchievement(null)}
      />

      {/* Level up popup */}
      <LevelUpPopup
        level={gamification.showLevelUp}
        onClose={() => gamification.setShowLevelUp(null)}
      />

      {/* Header */}
      <div className="text-center relative">
        <div className="flex justify-center gap-2 mb-4 sm:absolute sm:right-0 sm:top-0 sm:mb-0">
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Management Fee Calculator
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Model fund-level management fees and understand how different structures impact economics.
        </p>
      </div>

      {/* Welcome screen or main content */}
      {showWelcome ? (
        renderWelcome()
      ) : (
        <>
          {/* XP Progress Bar */}
          {renderXPBar()}

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
                <JourneyMode
                  onComplete={handleJourneyComplete}
                  onSkip={handleJourneySkip}
                  onXPEarned={(xp) => gamification.addXP(xp)}
                  onAchievementCheck={(type, value) => {
                    if (type === 'journey_step') {
                      if (value === 1) gamification.unlockAchievement('first-steps')
                      if (value === 2) gamification.unlockAchievement('fee-fundamentals')
                      if (value === 4) gamification.unlockAchievement('phase-master')
                      if (value === 5) gamification.unlockAchievement('basis-believer')
                    }
                  }}
                />
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
                    onCorrectAnswer={() => gamification.trackQuizCorrect()}
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
                  onTermRead={(termId) => gamification.trackGlossaryRead(termId)}
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
                  onFaqRead={(faqId) => gamification.trackFaqRead(faqId)}
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
                  onXPEarned={(xp) => gamification.addXP(xp)}
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
                  onXPEarned={(xp) => gamification.addXP(xp)}
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
                <div className="flex items-start gap-2 p-3 mb-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    This is an educational tool for modeling management fees. Actual fee calculations
                    may be more complex depending on your LPA terms. Always consult with legal counsel.
                  </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left Column - Inputs */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Fund Basics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Fund Basics
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            +5 XP per change
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                            min={1}
                            value={fundInputs.fundSize}
                            onChange={(e) => handleFundInputChange({ fundSize: parseFloat(e.target.value) || 50 })}
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
                            max={20}
                            value={fundInputs.fundTerm}
                            onChange={(e) => handleFundInputChange({ fundTerm: parseInt(e.target.value) || 10 })}
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
                      <Button variant="outline" onClick={resetToDefaults}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </Button>
                    </div>
                  </div>

                  {/* Right Column - Results */}
                  <div className="lg:col-span-2 space-y-6">
                    {result ? (
                      <>
                        {/* Results summary with walkthrough button */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">Results</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewMode('walkthrough')
                              gamification.addXP(5)
                            }}
                            className="gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Explain Results
                          </Button>
                        </div>

                        <SummaryCards result={result} fundSize={fundInputs.fundSize} />
                        <ResultsChart yearlyData={result.yearlyData} />
                        <ResultsTable yearlyData={result.yearlyData} />
                        <ExportSection fundInputs={fundInputs} result={result} feePhases={feePhases} />
                        <DisclaimerBlock
                          additionalDisclaimer="Always consult with legal counsel and fund administrators before finalizing your LPA fee terms."
                        />
                      </>
                    ) : (
                      <Card>
                        <CardContent className="py-12">
                          <div className="text-center text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Configure your fund basics and fee schedule to see results</p>
                            {validationErrors.length > 0 && (
                              <p className="mt-2 text-sm text-destructive">Please fix validation errors to continue</p>
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
        </>
      )}
    </div>
  )
}
