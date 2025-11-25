"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Info } from 'lucide-react'
import { classifyExpense, type ClassificationInput, type ClassificationResult as Result } from './expenseData'
import { exportToPDF } from './exportPDF'
import { ExpenseInputForm } from './expense-input-form'
import { ClassificationResults } from './classification-results'
import { SampleScenariosSection } from './sample-scenarios'

export function FundExpenseAllocation() {
  const [result, setResult] = useState<Result | null>(null)
  const [currentInput, setCurrentInput] = useState<ClassificationInput | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(true)

  const handleClassify = (input: ClassificationInput) => {
    const classification = classifyExpense(input)
    setResult(classification)
    setCurrentInput(input)
    setShowOnboarding(false)
  }

  const handleLoadSample = (sample: ClassificationInput) => {
    handleClassify(sample)
  }

  const handleExport = () => {
    if (result && currentInput) {
      exportToPDF(currentInput, result)
    }
  }

  const handleReset = () => {
    setResult(null)
    setCurrentInput(null)
    setShowOnboarding(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">
          Fund Expense Allocation Helper
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Interactive tool to classify expenses as fund or management company expenses with detailed
          market practice guidance.
        </p>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This is an educational tool. It does not constitute legal, tax, or financial advice.
            Always consult with legal counsel and fund administrators before making expense allocation decisions.
          </p>
        </div>
      </div>

      {/* Sample Scenarios */}
      <SampleScenariosSection onLoadSample={handleLoadSample} />

      {/* Onboarding */}
      {showOnboarding && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Welcome to the Fund Expense Allocation Helper
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  This interactive tool helps emerging and established fund managers quickly understand whether a
                  specific expense should typically be treated as a <strong>fund expense</strong> or a{' '}
                  <strong>management company expense</strong>, and why.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Who is this for?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      CFOs, COOs, controllers, emerging managers, and fund operations teams navigating expense
                      allocation decisions
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">What it does</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Provides classification guidance, market practice insights, LP sensitivities, and sample LPA
                      language for 25+ expense types
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">How to use it</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Select or describe an expense, provide context about your fund, and get instant guidance with
                      exportable analysis
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4">
                  <Button onClick={() => setShowOnboarding(false)} size="sm">
                    Got it, let&apos;s get started →
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-1">
          <ExpenseInputForm onClassify={handleClassify} />
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {result && currentInput ? (
            <ClassificationResults
              result={result}
              input={currentInput}
              onExport={handleExport}
              onReset={handleReset}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>Select an expense category and fund context to see classification guidance</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
