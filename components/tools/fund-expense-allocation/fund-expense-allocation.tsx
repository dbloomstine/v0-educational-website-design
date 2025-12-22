"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  Scale,
  BookOpen,
  Play,
  Calculator,
  Target,
  GraduationCap,
  Star,
  RotateCcw,
  CheckCircle2
} from 'lucide-react'
import { classifyExpense, type ClassificationInput, type ClassificationResult as Result } from './expenseData'
import { exportToPDF } from './exportPDF'
import { ExpenseInputForm } from './expense-input-form'
import { ClassificationResults } from './classification-results'
import { SampleScenariosSection } from './sample-scenarios'
import { ShareButton } from '@/components/tools/share-button'

import { InteractiveJourney } from './interactive-journey'
import { Quiz, QuizResults, EXPENSE_QUIZ_QUESTIONS } from './quiz'

type ViewMode = 'welcome' | 'journey' | 'calculator' | 'quiz' | 'results'

export function FundExpenseAllocation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('welcome')
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null)

  // Results state
  const [result, setResult] = useState<Result | null>(null)
  const [currentInput, setCurrentInput] = useState<ClassificationInput | null>(null)

  // Parse initial state from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const category = searchParams.get('category')
    const fundType = searchParams.get('fundType')
    const fundStage = searchParams.get('fundStage')
    const beneficiary = searchParams.get('beneficiary')

    if (category && fundType && fundStage && beneficiary) {
      const input: ClassificationInput = {
        expenseCategory: category,
        fundType: fundType as ClassificationInput['fundType'],
        fundStage: fundStage as ClassificationInput['fundStage'],
        primaryBeneficiary: beneficiary as ClassificationInput['primaryBeneficiary']
      }
      const classification = classifyExpense(input)
      setResult(classification)
      setCurrentInput(input)
      setViewMode('results')
    }
  }, [searchParams])

  // Update URL when input changes
  useEffect(() => {
    if (!currentInput) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('category', currentInput.expenseCategory)
      params.set('fundType', currentInput.fundType)
      params.set('fundStage', currentInput.fundStage)
      params.set('beneficiary', currentInput.primaryBeneficiary)

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)

    return () => clearTimeout(timer)
  }, [currentInput, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    if (!currentInput) {
      return typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : pathname
    }

    const params = new URLSearchParams()
    params.set('category', currentInput.expenseCategory)
    params.set('fundType', currentInput.fundType)
    params.set('fundStage', currentInput.fundStage)
    params.set('beneficiary', currentInput.primaryBeneficiary)

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [currentInput, pathname])

  // Handle classification
  const handleClassify = (input: ClassificationInput) => {
    const classification = classifyExpense(input)
    setResult(classification)
    setCurrentInput(input)
    setViewMode('results')
  }

  // Journey completion handler
  const handleJourneyComplete = (input: ClassificationInput) => {
    handleClassify(input)
  }

  // Sample scenario handler
  const handleLoadSample = (sample: ClassificationInput) => {
    handleClassify(sample)
  }

  // Quiz handlers
  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total })
  }

  const handleQuizRetry = () => {
    setQuizScore(null)
  }

  // Export handler
  const handleExport = () => {
    if (result && currentInput) {
      exportToPDF(currentInput, result)
    }
  }

  // Reset handler
  const handleReset = () => {
    setResult(null)
    setCurrentInput(null)
    setViewMode('welcome')
  }

  // Render welcome screen
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
            <Scale className="h-10 w-10 sm:h-14 sm:w-14 text-primary" />
          </motion.div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Fund Expense Allocation Helper</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Learn whether expenses should be borne by the fund or management company,
              with detailed guidance and market practice insights.
            </p>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm">25+ expense categories</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm">LP sensitivity analysis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Sample LPA language</span>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewMode('journey')}
              aria-label="Start guided journey to learn expense allocation"
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
                Step-by-step walkthrough that teaches expense allocation while you analyze.
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewMode('calculator')}
              aria-label="Jump directly to expense analyzer"
              className="p-4 sm:p-6 rounded-xl border-2 border-muted-foreground/30 text-left hover:border-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="rounded-full bg-muted p-1.5 sm:p-2">
                  <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1">Quick Analysis</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Jump straight to the form if you already know expense allocation basics.
              </p>
            </motion.button>
          </div>

          {/* Quick actions */}
          <div className="pt-4 sm:pt-6 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Or try something else:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('quiz')}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <Star className="h-3 w-3" />
                Test Your Knowledge
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Load a sample scenario
                  const sampleInput: ClassificationInput = {
                    expenseCategory: 'broken-deal-costs',
                    fundType: 'pe',
                    fundStage: 'post-close',
                    primaryBeneficiary: 'fund'
                  }
                  handleLoadSample(sampleInput)
                }}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <Play className="h-3 w-3" />
                See Example
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // Render navigation
  const renderNavigation = () => (
    <nav className="mb-4 sm:mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto" aria-label="Tool navigation">
      <div className="flex items-center gap-2 min-w-max sm:flex-wrap pb-2 sm:pb-0">
        <Button
          variant={viewMode === 'calculator' || viewMode === 'results' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode(result ? 'results' : 'calculator')}
          aria-label="Expense analyzer"
          aria-current={viewMode === 'calculator' || viewMode === 'results' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xs:inline">Analyzer</span>
          <span className="xs:hidden">Tool</span>
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
          variant="outline"
          size="lg"
          onClick={handleReset}
          aria-label="Start over with new inputs"
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Start Over</span>
          <span className="sm:hidden">Reset</span>
        </Button>
      </div>
    </nav>
  )


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center relative px-4 sm:px-0">
        <div className="flex justify-center gap-2 mb-3 sm:absolute sm:right-0 sm:top-0 sm:mb-0">
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          Fund Expense Allocation
        </h1>
        <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-lg text-muted-foreground">
          Learn whether expenses should be fund or management company expenses with detailed guidance.
        </p>
      </div>

      {/* Welcome screen or main content */}
      {viewMode === 'welcome' ? (
        renderWelcome()
      ) : (
        <>
          {/* Navigation */}
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
                <InteractiveJourney
                  onComplete={handleJourneyComplete}
                  onSkip={() => setViewMode('calculator')}
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
                    questions={EXPENSE_QUIZ_QUESTIONS.slice(0, 5)}
                    onComplete={handleQuizComplete}
                    onClose={() => setViewMode('calculator')}
                  />
                )}
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
                    This is an educational tool. Always consult with legal counsel and fund administrators
                    before making expense allocation decisions.
                  </p>
                </div>

                {/* Sample Scenarios */}
                <SampleScenariosSection onLoadSample={handleLoadSample} />

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6">
                  {/* Left Column - Input Form */}
                  <div className="lg:col-span-1">
                    <ExpenseInputForm onClassify={handleClassify} />
                  </div>

                  {/* Right Column - Results placeholder */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="py-8 sm:py-12">
                        <div className="text-center text-muted-foreground">
                          <Scale className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                          <p className="text-sm sm:text-base">Select an expense category and provide fund context to see classification guidance</p>
                          <p className="text-xs sm:text-sm mt-2 text-primary">Or try the Guided Journey for a step-by-step experience</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {viewMode === 'results' && result && currentInput && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Educational disclaimer */}
                <div className="flex items-start gap-2 p-2.5 sm:p-3 mb-4 sm:mb-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                    This is an educational tool. Always consult with legal counsel and fund administrators
                    before making expense allocation decisions.
                  </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {/* Left Column - Input Form */}
                  <div className="lg:col-span-1">
                    <ExpenseInputForm onClassify={handleClassify} />
                  </div>

                  {/* Right Column - Results */}
                  <div className="lg:col-span-2">
                    <ClassificationResults
                      result={result}
                      input={currentInput}
                      onExport={handleExport}
                      onReset={handleReset}
                    />
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
