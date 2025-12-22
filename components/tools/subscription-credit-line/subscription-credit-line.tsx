'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  SubscriptionLineInput,
  SubscriptionLineOutput,
  defaultInput,
  calculateSubscriptionLineImpact
} from './subscriptionLineCalculations'
import { InputForm } from './input-form'
import { ResultsView } from './results-view'
import { JourneyMode } from './journey-mode'
import { WhatIfSliders } from './what-if-sliders'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShareButton } from '@/components/tools/share-button'
import { ExportToolbar } from '@/components/tools/shared'
import { exportSubscriptionLineComparisonCSV, exportSubscriptionLineComparisonPDF } from './export'
import { Rocket, Calculator, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Preset scenarios based on market research
const presets: Record<string, { name: string; description: string; input: SubscriptionLineInput }> = {
  'conservative': {
    name: 'Conservative Use',
    description: '$100M fund, 15% facility, 90 days, 4% rate',
    input: {
      fundSize: 100000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded',
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments',
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: true,
      facilitySize: 0.15, // ILPA lower bound
      interestRate: 0.04, // Lower end of 3-6% range
      maxDaysOutstanding: 90, // Traditional/conservative
      repaymentTrigger: 'automatic',
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve'
    }
  },
  'typical': {
    name: 'Typical PE Fund',
    description: '$200M fund, 20% facility, 180 days, 4.5% rate',
    input: {
      fundSize: 200000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded',
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments',
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: true,
      facilitySize: 0.20, // Mid-range
      interestRate: 0.045, // Mid-range of 3-6%
      maxDaysOutstanding: 180, // ILPA recommended max
      repaymentTrigger: 'automatic',
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve'
    }
  },
  'aggressive': {
    name: 'Aggressive Use',
    description: '$300M fund, 25% facility, 360 days, 5.5% rate',
    input: {
      fundSize: 300000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded',
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments',
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: true,
      facilitySize: 0.25, // ILPA upper bound
      interestRate: 0.055, // Higher end
      maxDaysOutstanding: 360, // Aggressive (exceeds ILPA guidance)
      repaymentTrigger: 'distribution-funded',
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve'
    }
  },
  'no-line': {
    name: 'No Credit Facility',
    description: '$150M fund, no subscription line',
    input: {
      fundSize: 150000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded',
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments',
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: false,
      facilitySize: 0,
      interestRate: 0,
      maxDaysOutstanding: 0,
      repaymentTrigger: 'automatic',
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve'
    }
  }
}

export function SubscriptionCreditLine() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Journey mode state
  const [showJourneyMode, setShowJourneyMode] = useState(false)
  const [hasCompletedJourney, setHasCompletedJourney] = useState(false)

  // Parse initial state from URL or use defaults
  const getInitialInput = (): SubscriptionLineInput => {
    if (typeof window === 'undefined') return defaultInput

    return {
      fundSize: parseFloat(searchParams.get('fundSize') || '') || defaultInput.fundSize,
      investmentPeriodYears: parseInt(searchParams.get('investPeriod') || '') || defaultInput.investmentPeriodYears,
      fundTermYears: parseInt(searchParams.get('fundTerm') || '') || defaultInput.fundTermYears,
      deploymentPaceType: (searchParams.get('deployPace') as 'front-loaded' | 'even' | 'back-loaded') || defaultInput.deploymentPaceType,
      managementFeeRate: parseFloat(searchParams.get('mgmtFee') || '') || defaultInput.managementFeeRate,
      managementFeeBasis: (searchParams.get('feeBasis') as 'commitments' | 'invested') || defaultInput.managementFeeBasis,
      carryRate: parseFloat(searchParams.get('carry') || '') || defaultInput.carryRate,
      prefRate: parseFloat(searchParams.get('pref') || '') || defaultInput.prefRate,
      useLine: searchParams.get('useLine') === 'true' || (searchParams.get('useLine') === null && defaultInput.useLine),
      facilitySize: parseFloat(searchParams.get('facilitySize') || '') || defaultInput.facilitySize,
      interestRate: parseFloat(searchParams.get('interestRate') || '') || defaultInput.interestRate,
      maxDaysOutstanding: parseInt(searchParams.get('maxDays') || '') || defaultInput.maxDaysOutstanding,
      repaymentTrigger: (searchParams.get('repayment') as 'automatic' | 'distribution-funded') || defaultInput.repaymentTrigger,
      grossMOIC: parseFloat(searchParams.get('grossMOIC') || '') || defaultInput.grossMOIC,
      realizationScheduleType: (searchParams.get('realization') as 'j-curve' | 'linear' | 'back-loaded') || defaultInput.realizationScheduleType
    }
  }

  // Initialize with calculated results
  const [input, setInput] = useState<SubscriptionLineInput>(getInitialInput)
  const [output, setOutput] = useState<SubscriptionLineOutput>(calculateSubscriptionLineImpact(getInitialInput()))
  const [compareMode, setCompareMode] = useState(false)
  const [compareInput, setCompareInput] = useState<SubscriptionLineInput | null>(null)
  const [compareOutput, setCompareOutput] = useState<SubscriptionLineOutput | null>(null)

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    whatIf: false
  })

  // Handle journey mode completion
  const handleJourneyComplete = (journeyInput: SubscriptionLineInput) => {
    setInput(journeyInput)
    setOutput(calculateSubscriptionLineImpact(journeyInput))
    setShowJourneyMode(false)
    setHasCompletedJourney(true)
  }

  // Update URL when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('fundSize', String(input.fundSize))
      params.set('investPeriod', String(input.investmentPeriodYears))
      params.set('fundTerm', String(input.fundTermYears))
      params.set('deployPace', input.deploymentPaceType)
      params.set('mgmtFee', String(input.managementFeeRate))
      params.set('feeBasis', input.managementFeeBasis)
      params.set('carry', String(input.carryRate))
      params.set('pref', String(input.prefRate))
      params.set('useLine', String(input.useLine))
      params.set('facilitySize', String(input.facilitySize))
      params.set('interestRate', String(input.interestRate))
      params.set('maxDays', String(input.maxDaysOutstanding))
      params.set('repayment', input.repaymentTrigger)
      params.set('grossMOIC', String(input.grossMOIC))
      params.set('realization', input.realizationScheduleType)

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [input, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('fundSize', String(input.fundSize))
    params.set('investPeriod', String(input.investmentPeriodYears))
    params.set('fundTerm', String(input.fundTermYears))
    params.set('deployPace', input.deploymentPaceType)
    params.set('mgmtFee', String(input.managementFeeRate))
    params.set('feeBasis', input.managementFeeBasis)
    params.set('carry', String(input.carryRate))
    params.set('pref', String(input.prefRate))
    params.set('useLine', String(input.useLine))
    params.set('facilitySize', String(input.facilitySize))
    params.set('interestRate', String(input.interestRate))
    params.set('maxDays', String(input.maxDaysOutstanding))
    params.set('repayment', input.repaymentTrigger)
    params.set('grossMOIC', String(input.grossMOIC))
    params.set('realization', input.realizationScheduleType)

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [input, pathname])

  const handleInputChange = (newInput: SubscriptionLineInput) => {
    setInput(newInput)
    const newOutput = calculateSubscriptionLineImpact(newInput)
    setOutput(newOutput)
  }

  const loadPreset = (presetKey: string) => {
    const preset = presets[presetKey]
    if (preset) {
      setInput(preset.input)
      setOutput(calculateSubscriptionLineImpact(preset.input))
      setCompareMode(false)
      setCompareInput(null)
      setCompareOutput(null)
    }
  }


  const startComparison = () => {
    setCompareMode(true)
    setCompareInput({ ...input })
    setCompareOutput({ ...output })
  }

  const updateCompareInput = (newInput: SubscriptionLineInput) => {
    setCompareInput(newInput)
    setCompareOutput(calculateSubscriptionLineImpact(newInput))
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Show journey mode if requested
  if (showJourneyMode) {
    return (
      <JourneyMode
        onComplete={handleJourneyComplete}
        onSkip={() => setShowJourneyMode(false)}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute right-0 top-0">
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Subscription Credit Line Impact Visualizer
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Model how subscription lines of credit affect fund IRR, MOIC, J-curve, and fee drag.
          Compare scenarios with and without credit facilities.
        </p>
      </div>

      {/* Journey Mode Toggle */}
      <div className="rounded-lg border border-primary/50 bg-primary/5 p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {hasCompletedJourney ? 'Want to start over?' : 'New to Subscription Credit Lines?'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {hasCompletedJourney
                  ? 'Restart the guided journey to learn more or try different scenarios'
                  : 'Take a 3-5 minute guided journey to learn the basics and set up your first analysis'
                }
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowJourneyMode(true)}
            aria-label={hasCompletedJourney ? 'Restart guided journey' : 'Start guided journey'}
            size="lg"
            className="flex-shrink-0 w-full md:w-auto min-h-[44px] focus:ring-2 focus:ring-primary"
          >
            <Rocket className="mr-2 h-4 w-4" aria-hidden="true" />
            {hasCompletedJourney ? 'Restart Journey' : 'Start Guided Journey'}
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">About This Tool</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Subscription lines of credit (also called capital call facilities) allow funds to draw on LP commitments
            before formally calling capital. This tool models the impact on key performance metrics including IRR boost,
            MOIC drag, J-curve shape, and total costs.
          </p>
          <p>
            Per ILPA guidance, funds should report both levered (with line) and unlevered (without line) returns
            to provide transparency. ILPA recommends maximum facility size of 15-25% of commitments and
            maximum 180 days outstanding.
          </p>
          <p className="font-medium text-foreground">
            This is an educational tool only. Actual fund performance depends on specific investment timing,
            facility terms, and many other factors. Consult legal and financial advisors for fund structuring.
          </p>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Try These Examples</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Click a preset to see how different subscription line structures affect fund performance
        </p>
        <div className="grid gap-3 md:grid-cols-4">
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

      {/* Key Market Context */}
      <Card className="border-primary/50 bg-primary/5 p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Market Context (2024-2025)</h3>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <strong className="text-foreground">Typical Terms:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• Facility size: 15-25% of commitments</li>
              <li>• Interest rates: 3-6% annual</li>
              <li>• Days outstanding: 90-180 days (ILPA max)</li>
            </ul>
          </div>
          <div>
            <strong className="text-foreground">Expected Impact:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• IRR boost: +35 to +206 bps (year dependent)</li>
              <li>• MOIC reduction: Interest expense drag</li>
              <li>• Flatter J-curve in early years</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {compareMode ? (
        <Tabs defaultValue="scenario-a" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scenario-a">Scenario A</TabsTrigger>
            <TabsTrigger value="scenario-b">Scenario B</TabsTrigger>
            <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
          </TabsList>

          <TabsContent value="scenario-a" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario A Inputs</h3>
                <InputForm input={input} onChange={handleInputChange} />
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario A Results</h3>
                <ResultsView output={output} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenario-b" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario B Inputs</h3>
                {compareInput && (
                  <InputForm input={compareInput} onChange={updateCompareInput} />
                )}
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario B Results</h3>
                {compareOutput && (
                  <ResultsView output={compareOutput} />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            {compareOutput && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Side-by-Side Comparison</h3>
                  <ExportToolbar
                    onExportCSV={() => exportSubscriptionLineComparisonCSV(output, compareOutput)}
                    onExportPDF={() => exportSubscriptionLineComparisonPDF(output, compareOutput)}
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-lg font-medium text-primary">Scenario A</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Using Line:</span>
                        <span className="font-medium">{output.input.useLine ? 'Yes' : 'No'}</span>
                      </div>
                      {output.input.useLine && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Facility Size:</span>
                            <span className="font-medium">{(output.input.facilitySize * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Interest Rate:</span>
                            <span className="font-medium">{(output.input.interestRate * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Max Days Out:</span>
                            <span className="font-medium">{output.input.maxDaysOutstanding} days</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>Net IRR:</span>
                        <span>{(output.irrWithLine * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Net MOIC:</span>
                        <span>{output.moicWithLine.toFixed(2)}x</span>
                      </div>
                      {output.input.useLine && (
                        <>
                          <div className="flex justify-between text-sm font-semibold text-primary">
                            <span>IRR Boost:</span>
                            <span>{output.irrBoost >= 0 ? '+' : ''}{output.irrBoost.toFixed(0)} bps</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold text-red-600">
                            <span>MOIC Drag:</span>
                            <span>-{output.moicDrag.toFixed(2)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-lg font-medium text-primary">Scenario B</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Using Line:</span>
                        <span className="font-medium">{compareOutput.input.useLine ? 'Yes' : 'No'}</span>
                      </div>
                      {compareOutput.input.useLine && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Facility Size:</span>
                            <span className="font-medium">{(compareOutput.input.facilitySize * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Interest Rate:</span>
                            <span className="font-medium">{(compareOutput.input.interestRate * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Max Days Out:</span>
                            <span className="font-medium">{compareOutput.input.maxDaysOutstanding} days</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>Net IRR:</span>
                        <span>{(compareOutput.irrWithLine * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Net MOIC:</span>
                        <span>{compareOutput.moicWithLine.toFixed(2)}x</span>
                      </div>
                      {compareOutput.input.useLine && (
                        <>
                          <div className="flex justify-between text-sm font-semibold text-primary">
                            <span>IRR Boost:</span>
                            <span>{compareOutput.irrBoost >= 0 ? '+' : ''}{compareOutput.irrBoost.toFixed(0)} bps</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold text-red-600">
                            <span>MOIC Drag:</span>
                            <span>-{compareOutput.moicDrag.toFixed(2)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button onClick={() => setCompareMode(false)} variant="outline">
                    Exit Comparison Mode
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Input Form */}
            <div>
              <InputForm input={input} onChange={handleInputChange} />
              <div className="mt-4">
                <Button onClick={startComparison} variant="outline" className="w-full">
                  Compare Two Scenarios
                </Button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div>
              <ResultsView output={output} />
            </div>
          </div>

          {/* What-If Sliders Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('whatIf')}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Sensitivity Analysis</h3>
                  <p className="text-sm text-muted-foreground">Adjust credit facility parameters to see real-time impact</p>
                </div>
              </div>
              {expandedSections.whatIf ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.whatIf && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <WhatIfSliders
                    input={input}
                    output={output}
                    onInputChange={handleInputChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
