'use client'

import { useState } from 'react'
import { TaxInput, PricingOutput, defaultInput, calculateTaxPricing } from './pricingData'
import { InputForm } from './input-form'
import { PricingResults } from './pricing-results'

export function TaxFeeEstimator() {
  const [input, setInput] = useState<TaxInput>(defaultInput)
  const [output, setOutput] = useState<PricingOutput | null>(null)

  const handleInputChange = (newInput: TaxInput) => {
    setInput(newInput)
    const newOutput = calculateTaxPricing(newInput)
    setOutput(newOutput)
  }

  const handleCalculate = () => {
    const newOutput = calculateTaxPricing(input)
    setOutput(newOutput)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Tax Fee Estimator
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Estimate annual tax compliance costs for your private investment fund. This tool helps you
          budget for tax return preparation, K-1s, blocker entities, and specialized reporting requirements.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Input Form */}
        <div>
          <InputForm
            input={input}
            onChange={handleInputChange}
            onCalculate={handleCalculate}
          />
        </div>

        {/* Right Column - Results */}
        <div>
          {output ? (
            <PricingResults output={output} input={input} />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 p-8">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Adjust the inputs on the left to see your estimate
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The calculator will update automatically as you make changes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Footer */}
      <div className="mt-12 rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">About This Estimator</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            This tax fee estimator is designed for private investment fund managers (PE, VC, credit, real estate,
            hedge funds) to budget annual tax compliance costs. Estimates are based on market research of mid-tier
            tax firms serving emerging and established fund managers.
          </p>
          <p>
            The calculator accounts for the most common fee drivers: K-1 volume and complexity, entity structure,
            cross-border reporting (PFIC, CFC, FATCA), state filings, and specialized services. Actual fees depend
            on your specific scope, firm relationship, and engagement structure.
          </p>
          <p className="font-medium text-foreground">
            This is an educational tool only. Consult with qualified tax professionals for actual fee quotes
            and tax advice specific to your fund.
          </p>
        </div>
      </div>
    </div>
  )
}
