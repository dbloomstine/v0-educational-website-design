'use client'

import { useState } from 'react'
import { TaxInput, PricingOutput, defaultInput, calculateTaxPricing } from './pricingData'
import { InputForm } from './input-form'
import { PricingResults } from './pricing-results'
import { Button } from '@/components/ui/button'

// Preset scenarios for users to try
const presets: Record<string, { name: string; description: string; input: TaxInput }> = {
  'emerging-vc': {
    name: 'Emerging VC Fund',
    description: '$75M fund, 20 investors, simple structure',
    input: {
      fundType: 'venture-capital',
      fundSize: '50-100',
      fundComplexity: 'simple',
      taxYear: 'subsequent',
      investorCount: '11-30',
      investorComplexity: 'mostly-simple',
      parallelFunds: 0,
      aivCount: 2,
      blockerCount: 0,
      gpEntityCount: 1,
      managementCo: true,
      usStates: '2-3',
      foreignJurisdictions: 'none',
      pficReporting: false,
      cfcReporting: false,
      fatcaReporting: false,
      quarterlyEstimates: true,
      taxPlanning: 'basic',
      stateComplexity: 'simple'
    }
  },
  'mid-pe': {
    name: 'Mid-Market PE Fund',
    description: '$300M fund, 45 LPs, blockers & offshore',
    input: {
      fundType: 'pe-buyout',
      fundSize: '250-500',
      fundComplexity: 'moderate',
      taxYear: 'subsequent',
      investorCount: '31-75',
      investorComplexity: 'mixed',
      parallelFunds: 1,
      aivCount: 5,
      blockerCount: 2,
      gpEntityCount: 2,
      managementCo: true,
      usStates: '4-6',
      foreignJurisdictions: 'single',
      pficReporting: false,
      cfcReporting: true,
      fatcaReporting: true,
      quarterlyEstimates: true,
      taxPlanning: 'detailed',
      stateComplexity: 'moderate'
    }
  },
  'large-credit': {
    name: 'Large Credit Fund',
    description: '$750M fund, 100+ LPs, complex multi-jurisdictional',
    input: {
      fundType: 'private-credit',
      fundSize: '500-plus',
      fundComplexity: 'complex',
      taxYear: 'subsequent',
      investorCount: '76-150',
      investorComplexity: 'mostly-complex',
      parallelFunds: 2,
      aivCount: 8,
      blockerCount: 4,
      gpEntityCount: 3,
      managementCo: true,
      usStates: '10-plus',
      foreignJurisdictions: 'multiple',
      pficReporting: true,
      cfcReporting: true,
      fatcaReporting: true,
      quarterlyEstimates: true,
      taxPlanning: 'comprehensive',
      stateComplexity: 'complex'
    }
  }
}

export function TaxFeeEstimator() {
  // Initialize with calculated results
  const [input, setInput] = useState<TaxInput>(defaultInput)
  const [output, setOutput] = useState<PricingOutput>(calculateTaxPricing(defaultInput))

  const handleInputChange = (newInput: TaxInput) => {
    setInput(newInput)
    const newOutput = calculateTaxPricing(newInput)
    setOutput(newOutput)
  }

  const handleCalculate = () => {
    const newOutput = calculateTaxPricing(input)
    setOutput(newOutput)
  }

  const loadPreset = (presetKey: string) => {
    const preset = presets[presetKey]
    if (preset) {
      setInput(preset.input)
      setOutput(calculateTaxPricing(preset.input))
    }
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

      {/* About This Estimator - Moved to top */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
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

      {/* Preset Scenarios */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Try These Examples</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Click a preset to see typical tax costs for different fund profiles
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent hover:border-primary"
            >
              <div className="mb-1 font-semibold text-foreground">{preset.name}</div>
              <div className="text-xs text-muted-foreground">{preset.description}</div>
            </button>
          ))}
        </div>
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
          <PricingResults output={output} input={input} />
        </div>
      </div>
    </div>
  )
}
