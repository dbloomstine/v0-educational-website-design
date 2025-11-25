"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { FundAdminInput, PricingOutput, calculateAdminPricing, defaultInput, getFundTypeName, formatCurrency } from './pricingData'
import { InputForm } from './input-form'
import { PricingResults } from './pricing-results'
import { exportPricingSummary } from './export'

export function FundAdminPricing() {
  const [input, setInput] = useState<FundAdminInput>(defaultInput)
  const [results, setResults] = useState<PricingOutput | null>(() => calculateAdminPricing(defaultInput))

  const handleInputChange = (newInput: FundAdminInput) => {
    setInput(newInput)
    const newResults = calculateAdminPricing(newInput)
    setResults(newResults)
  }

  const handleReset = () => {
    setInput(defaultInput)
    setResults(calculateAdminPricing(defaultInput))
  }

  const handleExport = () => {
    if (results) {
      exportPricingSummary(input, results)
    }
  }

  // Generate summary text for header
  const summaryText = `${getFundTypeName(input.fundType)} • ${formatCurrency(input.aumAmount, input.aumCurrency)}M AUM • ${input.investorCount} Investors • ${input.reportingFrequency.charAt(0).toUpperCase() + input.reportingFrequency.slice(1)} Reporting`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">
          Fund Administration Pricing Estimator
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Get realistic pricing estimates for fund administration services based on your fund profile,
          structure, and service requirements. Understand what drives costs and compare scenarios.
        </p>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This tool provides directional pricing guidance based on market research and common pricing models.
            Actual fees will vary by provider and specific circumstances. Always request formal quotes.
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
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Column - Inputs (2 columns) */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-8">
            <h3 className="text-xl font-semibold mb-4">Configure Your Fund</h3>
            <InputForm input={input} onChange={handleInputChange} />
          </div>
        </div>

        {/* Right Column - Results (3 columns) */}
        <div className="lg:col-span-3">
          {results ? (
            <>
              <h3 className="text-xl font-semibold mb-4">Pricing Estimate</h3>
              <PricingResults results={results} onExport={handleExport} />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>Configure your fund details to see pricing estimates</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
