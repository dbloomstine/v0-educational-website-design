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
  Search
} from 'lucide-react'
import { classifyExpense, type ClassificationInput, type ClassificationResult as Result } from './expenseData'
import { exportToPDF } from './exportPDF'
import { ExpenseInputForm } from './expense-input-form'
import { ClassificationResults } from './classification-results'
import { SampleScenariosSection } from './sample-scenarios'

import { ExpenseLookup } from './expense-lookup'

type ViewMode = 'lookup' | 'advanced' | 'results'

const _STORAGE_KEY = 'fundExpenseAllocation_lastInput'

export function FundExpenseAllocation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Default to the new lookup mode (simplified experience)
  const [viewMode, setViewMode] = useState<ViewMode>('lookup')

  // Results state (for advanced mode)
  const [result, setResult] = useState<Result | null>(null)
  const [currentInput, setCurrentInput] = useState<ClassificationInput | null>(null)

  // Parse initial state from URL on mount (for advanced mode sharing)
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
  const _getShareableUrl = useCallback(() => {
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

  // Handle classification (for advanced mode)
  const handleClassify = (input: ClassificationInput) => {
    const classification = classifyExpense(input)
    setResult(classification)
    setCurrentInput(input)
    setViewMode('results')
  }

  // Sample scenario handler
  const handleLoadSample = (sample: ClassificationInput) => {
    handleClassify(sample)
  }

  // Export handler
  const handleExport = () => {
    if (result && currentInput) {
      exportToPDF(currentInput, result)
    }
  }

  // Reset handler - go back to lookup mode
  const handleReset = () => {
    setResult(null)
    setCurrentInput(null)
    setViewMode('lookup')
  }

  // Render navigation
  const renderNavigation = () => (
    <nav className="mb-4 sm:mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto" aria-label="Tool navigation">
      <div className="flex items-center gap-2 min-w-max sm:flex-wrap pb-2 sm:pb-0">
        <Button
          variant={viewMode === 'lookup' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode('lookup')}
          aria-label="Expense lookup"
          aria-current={viewMode === 'lookup' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xs:inline">Lookup</span>
          <span className="xs:hidden">Search</span>
        </Button>
        <Button
          variant={viewMode === 'advanced' || viewMode === 'results' ? 'default' : 'outline'}
          size="lg"
          onClick={() => setViewMode(result ? 'results' : 'advanced')}
          aria-label="Advanced analyzer with custom options"
          aria-current={viewMode === 'advanced' || viewMode === 'results' ? 'page' : undefined}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xs:inline">Advanced</span>
          <span className="xs:hidden">More</span>
        </Button>
      </div>
    </nav>
  )


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Navigation */}
      {renderNavigation()}

      {/* Main content based on view mode */}
      <AnimatePresence mode="wait">
        {/* New Simplified Lookup Mode */}
        {viewMode === 'lookup' && (
          <motion.div
            key="lookup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ExpenseLookup />
          </motion.div>
        )}

        {viewMode === 'advanced' && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Header for advanced mode */}
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Advanced Classification</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    For complex scenarios, provide detailed context about your fund stage and who benefits from the expense.
                  </p>
                </div>

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
                          <p className="text-sm sm:text-base">Complete the form on the left to see classification guidance</p>
                          <p className="text-xs sm:text-sm mt-2 text-primary">Or use the Lookup tab for quick answers</p>
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
