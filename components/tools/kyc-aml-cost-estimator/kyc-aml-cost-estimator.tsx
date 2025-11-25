'use client'

import { useState } from 'react'
import { KYCAMLInput, PricingOutput, defaultInput, calculateKYCAMLPricing } from './pricingData'
import { InputForm } from './input-form'
import { PricingResults } from './pricing-results'

// Preset scenarios for users to try
const presets: Record<string, { name: string; description: string; input: KYCAMLInput }> = {
  'emerging-vc': {
    name: 'Emerging VC Fund',
    description: '30 investors, mostly individuals, standard CDD',
    input: {
      fundType: 'venture-capital',
      domicile: 'us',
      investorJurisdictions: 'domestic',
      riskLevel: 'standard',
      individualCount: 20,
      entityCount: 8,
      institutionalCount: 2,
      dueDiligenceLevel: 'standard',
      checksDepth: ['id-verification', 'pep-sanctions'],
      monitoringFrequency: 'annual',
      nonResidentProportion: 'minimal',
      complexOwnership: false,
      highRiskProportion: 'low',
      operatingModel: 'bundled',
      hasOngoingMonitoring: true
    }
  },
  'mid-pe': {
    name: 'Mid-Market PE Fund',
    description: '65 investors, mixed international, some EDD',
    input: {
      fundType: 'pe-buyout',
      domicile: 'cayman',
      investorJurisdictions: 'mixed',
      riskLevel: 'standard',
      individualCount: 40,
      entityCount: 20,
      institutionalCount: 5,
      dueDiligenceLevel: 'standard',
      checksDepth: ['id-verification', 'pep-sanctions', 'adverse-media'],
      monitoringFrequency: 'annual',
      nonResidentProportion: 'some',
      complexOwnership: false,
      highRiskProportion: 'low',
      operatingModel: 'outsourced',
      hasOngoingMonitoring: true
    }
  },
  'complex-intl': {
    name: 'International Fund (Higher Risk)',
    description: '100+ investors, international, complex structures, EDD',
    input: {
      fundType: 'hedge-fund',
      domicile: 'cayman',
      investorJurisdictions: 'international',
      riskLevel: 'higher-risk',
      individualCount: 50,
      entityCount: 45,
      institutionalCount: 15,
      dueDiligenceLevel: 'enhanced',
      checksDepth: ['id-verification', 'pep-sanctions', 'adverse-media', 'source-of-wealth'],
      monitoringFrequency: 'quarterly',
      nonResidentProportion: 'majority',
      complexOwnership: true,
      highRiskProportion: 'moderate',
      operatingModel: 'outsourced',
      hasOngoingMonitoring: true
    }
  }
}

export function KYCAMLCostEstimator() {
  // Initialize with calculated results
  const [input, setInput] = useState<KYCAMLInput>(defaultInput)
  const [output, setOutput] = useState<PricingOutput>(calculateKYCAMLPricing(defaultInput))

  const handleInputChange = (newInput: KYCAMLInput) => {
    setInput(newInput)
    const newOutput = calculateKYCAMLPricing(newInput)
    setOutput(newOutput)
  }

  const loadPreset = (presetKey: string) => {
    const preset = presets[presetKey]
    if (preset) {
      setInput(preset.input)
      setOutput(calculateKYCAMLPricing(preset.input))
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          KYC / AML Cost Estimator
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Estimate investor onboarding and ongoing KYC/AML monitoring costs for your private investment fund.
          Understand how investor mix, jurisdictions, and compliance requirements affect your budget.
        </p>
      </div>

      {/* About This Estimator */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">About This Estimator</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            This KYC/AML cost estimator helps private investment fund managers budget for investor onboarding
            and ongoing monitoring costs. Estimates are based on market research of mid-tier KYC/AML service
            providers, including specialized vendors and fund administrators.
          </p>
          <p>
            The calculator accounts for key cost drivers: investor type (individual, entity, institutional),
            due diligence level (standard vs. enhanced), jurisdictional complexity, ownership structures,
            and monitoring frequency. Costs can vary significantly based on your operating model and provider choice.
          </p>
          <p className="font-medium text-foreground">
            This is an educational tool only. Consult with qualified compliance professionals for actual
            pricing and AML/KYC compliance advice specific to your fund.
          </p>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Try These Examples</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Click a preset to see typical KYC/AML costs for different fund profiles
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
