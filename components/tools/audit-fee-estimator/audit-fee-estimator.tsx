"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { AuditInput, PricingOutput, calculateAuditPricing, defaultInput, getFundTypeName, getFundSizeName } from './pricingData'
import { InputForm } from './input-form'
import { PricingResults } from './pricing-results'
import { exportAuditCSV, exportAuditPDF } from './export'

export function AuditFeeEstimator() {
  const [input, setInput] = useState<AuditInput>(defaultInput)
  const [results, setResults] = useState<PricingOutput | null>(() => calculateAuditPricing(defaultInput))

  const handleInputChange = (newInput: AuditInput) => {
    setInput(newInput)
    const newResults = calculateAuditPricing(newInput)
    setResults(newResults)
  }

  const handleReset = () => {
    setInput(defaultInput)
    setResults(calculateAuditPricing(defaultInput))
  }

  const handleExportCSV = () => {
    if (results) {
      exportAuditCSV(input, results)
    }
  }

  const handleExportPDF = () => {
    if (results) {
      exportAuditPDF(input, results)
    }
  }

  // Generate summary text for header
  const summaryText = `${getFundTypeName(input.fundType)} • ${getFundSizeName(input.fundSize)} • ${input.portfolioCount} Portfolio Companies • ${input.auditYear === 'first' ? 'First-Year Audit' : 'Repeat Audit'}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">
          Audit Fee Estimator
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Estimate annual audit fees for your investment fund based on size, complexity, and structure.
          Understand what drives costs and plan your budget accordingly.
        </p>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This tool provides rough planning estimates based on typical market ranges for fund audits.
            Actual quotes will vary by firm, specific scope, timing, and detailed fund characteristics.
            Use these estimates for budgeting purposes only, not as binding quotes.
            Always obtain formal proposals from qualified audit firms.
          </p>
        </div>
      </div>

      {/* Current Fund Summary */}
      {results && (
        <Card className="bg-accent/20 border-accent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Estimate For:</p>
                <p className="font-semibold text-lg">{summaryText}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Sample
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Column - Inputs (2 columns) */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-8">
            <h3 className="text-xl font-semibold mb-4">Tell Us About Your Fund</h3>
            <InputForm input={input} onChange={handleInputChange} />
          </div>
        </div>

        {/* Right Column - Results (3 columns) */}
        <div className="lg:col-span-3">
          {results ? (
            <>
              <h3 className="text-xl font-semibold mb-4">Your Audit Fee Estimate</h3>
              <PricingResults
                results={results}
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
              />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>Configure your fund details to see audit fee estimates</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
