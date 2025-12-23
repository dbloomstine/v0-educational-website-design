"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  Scale,
  Calculator,
  GraduationCap,
  Star,
  RotateCcw
} from 'lucide-react'
import { classifyExpense, type ClassificationInput, type ClassificationResult as Result } from './expenseData'
import { exportToPDF } from './exportPDF'
import { ExpenseInputForm } from './expense-input-form'
import { ClassificationResults } from './classification-results'
import { SampleScenariosSection } from './sample-scenarios'
import { ShareButton } from '@/components/tools/share-button'

import { InteractiveJourney } from './interactive-journey'
import { ResultsWalkthrough } from './results-walkthrough'
import { Quiz, QuizResults, EXPENSE_QUIZ_QUESTIONS } from './quiz'

type ViewMode = 'calculator' | 'quiz' | 'results'

const STORAGE_KEY = 'fundExpenseAllocation_lastInput'

export function FundExpenseAllocation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Show journey mode first (full-screen immersive)
  const [showJourney, setShowJourney] = useState(true)
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [hasExistingData, setHasExistingData] = useState<ClassificationInput | null>(null)

  // View state (for non-journey mode)
  const [viewMode, setViewMode] = useState<ViewMode>('calculator')
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null)

  // Results state
  const [result, setResult] = useState<Result | null>(null)
  const [currentInput, setCurrentInput] = useState<ClassificationInput | null>(null)

  // Check for existing data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.expenseCategory && parsed.fundType && parsed.fundStage && parsed.primaryBeneficiary) {
          setHasExistingData(parsed)
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

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
      setShowJourney(false)
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

    // Save to localStorage for returning users
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Journey completion handler
  const handleJourneyComplete = (input: ClassificationInput) => {
    const classification = classifyExpense(input)
    setResult(classification)
    setCurrentInput(input)
    setShowJourney(false)
    // Show walkthrough after journey to explain the results
    setShowWalkthrough(true)

    // Save to localStorage for returning users
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Walkthrough completion handler
  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false)
    setViewMode('results')
  }

  // Journey skip handler
  const handleJourneySkip = () => {
    setShowJourney(false)
    setViewMode('calculator')
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
    setShowJourney(true)
    setViewMode('calculator')
  }

  // Start fresh (clear localStorage and reset)
  const handleStartFresh = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore localStorage errors
    }
    setHasExistingData(null)
    setResult(null)
    setCurrentInput(null)
    setShowJourney(true)
    setViewMode('calculator')
  }

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
          variant="outline"
          size="lg"
          onClick={() => setShowJourney(true)}
          aria-label="Start guided learning journey"
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          Journey
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


  // Show full-screen immersive journey first
  if (showJourney) {
    return (
      <InteractiveJourney
        onComplete={handleJourneyComplete}
        onSkip={handleJourneySkip}
        existingData={hasExistingData}
      />
    )
  }

  // Show results walkthrough after journey completes
  if (showWalkthrough && result && currentInput) {
    return (
      <ResultsWalkthrough
        result={result}
        input={currentInput}
        onClose={handleWalkthroughComplete}
      />
    )
  }

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

      {/* Navigation and main content */}
      {renderNavigation()}

      {/* Main content based on view mode */}
      <AnimatePresence mode="wait">

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
    </div>
  )
}
