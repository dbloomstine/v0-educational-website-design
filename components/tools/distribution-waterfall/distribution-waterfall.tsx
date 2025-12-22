'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { WaterfallInput, WaterfallOutput, defaultInput, calculateWaterfall, formatCurrency, formatMultiple } from './waterfallCalculations'
import { InputForm } from './input-form'
import { ResultsView } from './results-view'
import { JourneyMode } from './journey-mode'
import { ResultsWalkthrough } from './results-walkthrough'
import { Glossary } from './glossary'
import { FAQSection } from './faq-section'
import { SampleScenarios } from './sample-scenarios'
import { CalculationBreakdown } from './calculation-breakdown'
import { PeerComparison } from './peer-comparison'
import { WhatIfSliders } from './what-if-sliders'
import { SkipToContent, LiveRegion, ScrollToTop, AutoSaveIndicator, MobileResultsGrid } from './accessibility'
import { exportWaterfallSummary, exportComparisonCSV, exportComparisonPDF, exportComparisonExcel } from './export'
import { Confetti, WaterfallFlowAnimation } from './visual-effects'
import { Quiz as QuizPanel, WATERFALL_QUIZ_QUESTIONS } from './quiz'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ShareButton } from '@/components/tools/share-button'
import { ExportToolbar, MethodologyBlock, RelatedToolsSection, LastUpdated, DisclaimerBlock } from '@/components/tools/shared'
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Calculator,
  BarChart3,
  SlidersHorizontal,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Play,
  X,
  Brain
} from 'lucide-react'

// Preset scenarios
const presets: Record<string, { name: string; description: string; input: WaterfallInput }> = {
  'classic-pe': {
    name: 'Classic PE',
    description: '$100M fund, 8% pref, 20% carry, European',
    input: {
      fundSize: 100000000,
      contributedCapital: 100000000,
      grossProceeds: 200000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    }
  },
  'vc-style': {
    name: 'VC Style',
    description: '$50M fund, no pref, 25% carry, American',
    input: {
      fundSize: 50000000,
      contributedCapital: 50000000,
      grossProceeds: 150000000,
      waterfallType: 'american',
      prefRate: 0.0,
      prefCompounding: 'simple',
      carryRate: 0.25,
      catchUpRate: 1.0,
      hasCatchUp: false,
      yearsToExit: 7,
      gpCommitmentPercent: 0.01
    }
  },
  'higher-carry': {
    name: 'Higher Carry',
    description: '$200M fund, 6% pref, 25% carry, European',
    input: {
      fundSize: 200000000,
      contributedCapital: 200000000,
      grossProceeds: 400000000,
      waterfallType: 'european',
      prefRate: 0.06,
      prefCompounding: 'compound',
      carryRate: 0.25,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 6,
      gpCommitmentPercent: 0.03
    }
  },
  'no-catchup': {
    name: 'No Catch-Up',
    description: '$150M fund, 8% pref, 20% carry, no catch-up',
    input: {
      fundSize: 150000000,
      contributedCapital: 150000000,
      grossProceeds: 300000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 0.0,
      hasCatchUp: false,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    }
  }
}

const LOCAL_STORAGE_KEY = 'waterfall-calculator-data'
const JOURNEY_COMPLETED_KEY = 'waterfall-journey-completed'

export function DistributionWaterfall() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse initial state from URL or localStorage or use defaults
  const getInitialInput = (): WaterfallInput => {
    if (typeof window === 'undefined') return defaultInput

    // Try URL params first
    const hasUrlParams = searchParams.get('fundSize')
    if (hasUrlParams) {
      return {
        fundSize: parseFloat(searchParams.get('fundSize') || '') || defaultInput.fundSize,
        contributedCapital: parseFloat(searchParams.get('contributed') || '') || defaultInput.contributedCapital,
        grossProceeds: parseFloat(searchParams.get('proceeds') || '') || defaultInput.grossProceeds,
        waterfallType: (searchParams.get('type') as 'european' | 'american') || defaultInput.waterfallType,
        prefRate: parseFloat(searchParams.get('pref') || '') || defaultInput.prefRate,
        prefCompounding: (searchParams.get('compounding') as 'simple' | 'compound') || defaultInput.prefCompounding,
        carryRate: parseFloat(searchParams.get('carry') || '') || defaultInput.carryRate,
        catchUpRate: parseFloat(searchParams.get('catchUp') || '') || defaultInput.catchUpRate,
        hasCatchUp: searchParams.get('hasCatchUp') === 'true' || (searchParams.get('hasCatchUp') === null && defaultInput.hasCatchUp),
        yearsToExit: parseInt(searchParams.get('years') || '') || defaultInput.yearsToExit,
        gpCommitmentPercent: parseFloat(searchParams.get('gpCommit') || '') || defaultInput.gpCommitmentPercent
      }
    }

    // Try localStorage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.input) return parsed.input
      }
    } catch {
      // Ignore localStorage errors
    }

    return defaultInput
  }

  // State
  const [input, setInput] = useState<WaterfallInput>(getInitialInput)
  const [output, setOutput] = useState<WaterfallOutput>(calculateWaterfall(getInitialInput()))
  const [compareMode, setCompareMode] = useState(false)
  const [compareInput, setCompareInput] = useState<WaterfallInput | null>(null)
  const [compareOutput, setCompareOutput] = useState<WaterfallOutput | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<'low' | 'medium' | 'high'>('medium')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Journey mode state
  const [showJourney, setShowJourney] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [journeyCompleted, setJourneyCompleted] = useState(false)

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quickScenarios: true,
    whatIf: false,
    calculation: false,
    peerComparison: false,
    glossary: false,
    faq: false,
    scenarios: false,
    waterflowAnimation: false,
    quiz: false
  })

  // Check if journey was previously completed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(JOURNEY_COMPLETED_KEY)
      setJourneyCompleted(completed === 'true')

      // Show journey mode for first-time users
      if (!completed && !searchParams.get('fundSize')) {
        setShowJourney(true)
      }
    }
  }, [searchParams])

  // Auto-save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ input, lastModified: new Date().toISOString() }))
        setLastSaved(new Date())
      } catch {
        // Ignore localStorage errors
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [input])

  // Update URL when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('fundSize', String(input.fundSize))
      params.set('contributed', String(input.contributedCapital))
      params.set('proceeds', String(input.grossProceeds))
      params.set('type', input.waterfallType)
      params.set('pref', String(input.prefRate))
      params.set('compounding', input.prefCompounding)
      params.set('carry', String(input.carryRate))
      params.set('catchUp', String(input.catchUpRate))
      params.set('hasCatchUp', String(input.hasCatchUp))
      params.set('years', String(input.yearsToExit))
      params.set('gpCommit', String(input.gpCommitmentPercent))

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [input, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('fundSize', String(input.fundSize))
    params.set('contributed', String(input.contributedCapital))
    params.set('proceeds', String(input.grossProceeds))
    params.set('type', input.waterfallType)
    params.set('pref', String(input.prefRate))
    params.set('compounding', input.prefCompounding)
    params.set('carry', String(input.carryRate))
    params.set('catchUp', String(input.catchUpRate))
    params.set('hasCatchUp', String(input.hasCatchUp))
    params.set('years', String(input.yearsToExit))
    params.set('gpCommit', String(input.gpCommitmentPercent))

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [input, pathname])

  const handleInputChange = (newInput: WaterfallInput) => {
    setInput(newInput)
    const newOutput = calculateWaterfall(newInput)
    setOutput(newOutput)
  }

  const handleJourneyComplete = (journeyInput: WaterfallInput) => {
    handleInputChange(journeyInput)
    setShowJourney(false)
    setShowWalkthrough(true)
    localStorage.setItem(JOURNEY_COMPLETED_KEY, 'true')
    setJourneyCompleted(true)
  }

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false)
  }

  const loadPreset = (presetKey: string) => {
    const preset = presets[presetKey]
    if (preset) {
      setInput(preset.input)
      setOutput(calculateWaterfall(preset.input))
      setCompareMode(false)
      setCompareInput(null)
      setCompareOutput(null)
    }
  }

  const handleScenarioChange = (scenario: 'low' | 'medium' | 'high') => {
    setSelectedScenario(scenario)
    const multipliers = { low: 1.5, medium: 2.0, high: 3.0 }
    const newProceeds = input.contributedCapital * multipliers[scenario]
    handleInputChange({ ...input, grossProceeds: newProceeds })
  }

  const handleExport = () => {
    exportWaterfallSummary(output)
  }

  const startComparison = () => {
    setCompareMode(true)
    setCompareInput({ ...input })
    setCompareOutput({ ...output })
  }

  const copyScenarioToCompare = () => {
    setCompareMode(true)
    setCompareInput({ ...input })
    setCompareOutput({ ...output })
  }

  const updateCompareInput = (newInput: WaterfallInput) => {
    setCompareInput(newInput)
    setCompareOutput(calculateWaterfall(newInput))
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleStartOver = () => {
    setInput(defaultInput)
    setOutput(calculateWaterfall(defaultInput))
    setCompareMode(false)
    setCompareInput(null)
    setCompareOutput(null)
    localStorage.removeItem(JOURNEY_COMPLETED_KEY)
    setShowJourney(true)
  }

  const loadScenarioFromLibrary = (scenarioInput: WaterfallInput) => {
    handleInputChange(scenarioInput)
    setExpandedSections(prev => ({ ...prev, scenarios: false }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Show journey mode
  if (showJourney) {
    // Check if there's existing data in localStorage for welcome back modal
    let savedInput: WaterfallInput | null = null
    if (typeof window !== 'undefined' && journeyCompleted) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.input) savedInput = parsed.input
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    return (
      <JourneyMode
        onComplete={handleJourneyComplete}
        onSkip={() => {
          setShowJourney(false)
          localStorage.setItem(JOURNEY_COMPLETED_KEY, 'true')
          setJourneyCompleted(true)
        }}
        existingData={savedInput}
      />
    )
  }

  // Show results walkthrough after journey
  if (showWalkthrough) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <SkipToContent />
        <ResultsWalkthrough
          output={output}
          onComplete={handleWalkthroughComplete}
          onSkip={handleWalkthroughComplete}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8" id="waterfall-main-content">
      <SkipToContent />
      <LiveRegion output={output} isCalculating={false} />
      <ScrollToTop />

      {/* Header */}
      <div className="text-center relative">
        <div className="flex justify-center gap-2 mb-4 sm:absolute sm:right-0 sm:top-0 sm:mb-0">
          <AutoSaveIndicator lastSaved={lastSaved} />
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Distribution Waterfall Visualizer
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Model LP and GP economics across preferred return, catch-up, and carried interest tiers.
          Understand how different waterfall structures affect distributions.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowJourney(true)}
            aria-label={journeyCompleted ? 'Restart guided tutorial' : 'Start guided tutorial'}
            className="gap-2 min-h-[44px] focus:ring-2 focus:ring-primary"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {journeyCompleted ? 'Restart Tutorial' : 'Start Tutorial'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowWalkthrough(true)}
            aria-label="Open results explanation"
            className="gap-2 min-h-[44px] focus:ring-2 focus:ring-primary"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Explain Results
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleStartOver}
            aria-label="Start over with new inputs"
            className="gap-2 min-h-[44px] focus:ring-2 focus:ring-primary"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Start Over
          </Button>
        </div>
      </div>

          {/* Waterfall Flow Animation Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('waterflowAnimation')}
              aria-expanded={expandedSections.waterflowAnimation}
              aria-controls="waterflow-animation-content"
              aria-label="Toggle waterfall flow animation section"
              className="flex items-center justify-between w-full p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:from-primary/10 hover:to-purple-500/10 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Waterfall Flow Animation</h3>
                  <p className="text-sm text-muted-foreground">Watch how money flows through each tier</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary mr-2">
                Interactive
              </Badge>
              {expandedSections.waterflowAnimation ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.waterflowAnimation && (
                <motion.div
                  id="waterflow-animation-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                  role="region"
                  aria-label="Waterfall flow animation"
                >
                  <Card className="border-primary/20">
                    <CardContent className="p-6">
                      <WaterfallFlowAnimation output={output} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

      {/* About */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">About This Tool</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            This distribution waterfall visualizer helps private fund managers model how proceeds flow through
            the standard tiers of a fund waterfall: return of capital, preferred return, GP catch-up, and
            ongoing profit split. Compare European (whole-fund) vs American (deal-by-deal) structures.
          </p>
          <p>
            The tool uses market-standard waterfall mechanics based on typical private equity, venture capital,
            and private credit fund structures. Adjust terms to see real-time impact on LP and GP economics.
          </p>
          <p className="font-medium text-foreground">
            This is an educational tool only. Actual fund economics depend on specific LPA terms,
            timing, fees, expenses, and other factors. Consult legal and financial advisors for fund structuring.
          </p>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Try These Examples</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Click a preset to see typical waterfall structures for different fund types
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              aria-label={`Load ${preset.name} scenario: ${preset.description}`}
              className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent hover:border-primary min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div className="mb-1 font-semibold text-foreground">{preset.name}</div>
              <div className="text-xs text-muted-foreground">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Scenario Buttons - More Prominent */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Quick Return Scenarios</CardTitle>
              <p className="text-sm text-muted-foreground">
                One-click to model different return multiples
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleScenarioChange('low')}
              variant={selectedScenario === 'low' ? 'default' : 'outline'}
              size="lg"
              aria-label="Model 1.5x return scenario"
              aria-pressed={selectedScenario === 'low'}
              className="flex-1 sm:flex-none min-w-[140px] min-h-[44px] focus:ring-2 focus:ring-primary"
            >
              1.5x Return
            </Button>
            <Button
              onClick={() => handleScenarioChange('medium')}
              variant={selectedScenario === 'medium' ? 'default' : 'outline'}
              size="lg"
              aria-label="Model 2.0x return scenario"
              aria-pressed={selectedScenario === 'medium'}
              className="flex-1 sm:flex-none min-w-[140px] min-h-[44px] focus:ring-2 focus:ring-primary"
            >
              2.0x Return
            </Button>
            <Button
              onClick={() => handleScenarioChange('high')}
              variant={selectedScenario === 'high' ? 'default' : 'outline'}
              size="lg"
              aria-label="Model 3.0x return scenario"
              aria-pressed={selectedScenario === 'high'}
              className="flex-1 sm:flex-none min-w-[140px] min-h-[44px] focus:ring-2 focus:ring-primary"
            >
              3.0x Return
            </Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Current proceeds: {formatCurrency(input.grossProceeds)} ({formatMultiple(input.grossProceeds / input.contributedCapital)} on {formatCurrency(input.contributedCapital)})
          </div>
        </CardContent>
      </Card>

      {/* Mobile Results Summary */}
      <div className="lg:hidden">
        <MobileResultsGrid output={output} />
      </div>

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
                <ResultsView output={output} onExport={handleExport} onCopyScenario={copyScenarioToCompare} />
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
                  <ResultsView output={compareOutput} onExport={() => exportWaterfallSummary(compareOutput)} />
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
                    onExportCSV={() => exportComparisonCSV(output, compareOutput)}
                    onExportExcel={() => exportComparisonExcel(output, compareOutput)}
                    onExportPDF={() => exportComparisonPDF(output, compareOutput)}
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-lg font-medium text-primary">Scenario A</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Structure:</span>
                        <span className="font-medium">{output.input.waterfallType === 'european' ? 'European' : 'American'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pref Rate:</span>
                        <span className="font-medium">{(output.input.prefRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Carry:</span>
                        <span className="font-medium">{(output.input.carryRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Proceeds:</span>
                        <span className="font-medium">{formatCurrency(output.input.grossProceeds)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>LP Total:</span>
                        <span>{formatCurrency(output.totalToLPs)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>GP Total:</span>
                        <span>{formatCurrency(output.totalToGP)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>LP Multiple:</span>
                        <span>{formatMultiple(output.lpMultiple)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-primary">
                        <span>Effective Carry:</span>
                        <span>{(output.effectiveCarryRate * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-lg font-medium text-primary">Scenario B</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Structure:</span>
                        <span className="font-medium">{compareOutput.input.waterfallType === 'european' ? 'European' : 'American'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pref Rate:</span>
                        <span className="font-medium">{(compareOutput.input.prefRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Carry:</span>
                        <span className="font-medium">{(compareOutput.input.carryRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Proceeds:</span>
                        <span className="font-medium">{formatCurrency(compareOutput.input.grossProceeds)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>LP Total:</span>
                        <span>{formatCurrency(compareOutput.totalToLPs)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>GP Total:</span>
                        <span>{formatCurrency(compareOutput.totalToGP)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>LP Multiple:</span>
                        <span>{formatMultiple(compareOutput.lpMultiple)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-primary">
                        <span>Effective Carry:</span>
                        <span>{(compareOutput.effectiveCarryRate * 100).toFixed(2)}%</span>
                      </div>
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
              <ResultsView output={output} onExport={handleExport} onCopyScenario={copyScenarioToCompare} />
            </div>
          </div>
        </>
      )}

      {/* What-If Sliders */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('whatIf')}
          aria-expanded={expandedSections.whatIf}
          aria-controls="what-if-content"
          aria-label="Toggle what-if analysis section"
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">What-If Analysis</h3>
              <p className="text-sm text-muted-foreground">Adjust parameters to see real-time impact</p>
            </div>
          </div>
          {expandedSections.whatIf ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.whatIf && (
            <motion.div
              id="what-if-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label="What-if analysis controls"
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

      {/* Calculation Breakdown */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('calculation')}
          aria-expanded={expandedSections.calculation}
          aria-controls="calculation-content"
          aria-label="Toggle step-by-step calculation section"
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Step-by-Step Calculation</h3>
              <p className="text-sm text-muted-foreground">See exactly how proceeds flow through each tier</p>
            </div>
          </div>
          {expandedSections.calculation ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.calculation && (
            <motion.div
              id="calculation-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label="Step-by-step calculation breakdown"
            >
              <CalculationBreakdown output={output} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Peer Comparison */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('peerComparison')}
          aria-expanded={expandedSections.peerComparison}
          aria-controls="peer-comparison-content"
          aria-label="Toggle market comparison section"
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Market Comparison</h3>
              <p className="text-sm text-muted-foreground">See how your terms compare to market standards</p>
            </div>
          </div>
          {expandedSections.peerComparison ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.peerComparison && (
            <motion.div
              id="peer-comparison-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label="Market comparison data"
            >
              <PeerComparison input={input} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scenario Library */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('scenarios')}
          aria-expanded={expandedSections.scenarios}
          aria-controls="scenarios-content"
          aria-label="Toggle scenario library section"
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Scenario Library</h3>
              <p className="text-sm text-muted-foreground">Explore pre-built scenarios across fund types</p>
            </div>
          </div>
          {expandedSections.scenarios ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.scenarios && (
            <motion.div
              id="scenarios-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label="Scenario library"
            >
              <SampleScenarios onSelectScenario={loadScenarioFromLibrary} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glossary */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('glossary')}
          aria-expanded={expandedSections.glossary}
          aria-controls="glossary-content"
          aria-label="Toggle glossary section"
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Waterfall Glossary</h3>
              <p className="text-sm text-muted-foreground">Learn key terms and concepts</p>
            </div>
          </div>
          {expandedSections.glossary ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.glossary && (
            <motion.div
              id="glossary-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label="Waterfall glossary terms"
            >
              <Glossary />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('faq')}
          aria-expanded={expandedSections.faq}
          aria-controls="faq-content"
          aria-label="Toggle frequently asked questions section"
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Frequently Asked Questions</h3>
              <p className="text-sm text-muted-foreground">Get answers to common questions</p>
            </div>
          </div>
          {expandedSections.faq ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.faq && (
            <motion.div
              id="faq-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label="Frequently asked questions"
            >
              <FAQSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quiz */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('quiz')}
          aria-expanded={expandedSections.quiz}
          aria-controls="quiz-content"
          aria-label="Toggle knowledge quiz section"
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Knowledge Quiz</h3>
              <p className="text-sm text-muted-foreground">Test your understanding of waterfall mechanics</p>
            </div>
          </div>
          {expandedSections.quiz ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.quiz && (
            <motion.div
              id="quiz-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label="Knowledge quiz"
            >
              <QuizPanel
                onCorrectAnswer={() => {}}
                onComplete={(score, total) => {}}
                onClose={() => toggleSection('quiz')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Methodology */}
      <MethodologyBlock
        title="How we calculate waterfall distributions"
        sources={[
          { text: "ILPA Private Equity Principles 3.0", link: "https://ilpa.org/ilpa-principles/" },
          { text: "Market practice from 500+ PE/VC fund structures" },
          { text: "Industry-standard waterfall mechanics and terminology" }
        ]}
      >
        <p className="font-medium text-foreground mb-2">Our Calculation Approach:</p>
        <ul className="space-y-1.5 ml-4 list-disc">
          <li>
            <strong>Return of Capital:</strong> LPs receive 100% of distributions until their contributed capital is returned.
            This is the foundational tier of all waterfall structures.
          </li>
          <li>
            <strong>Preferred Return:</strong> After return of capital, LPs receive their preferred return (typically 8%)
            on contributed capital. We support both simple and compound interest calculations.
          </li>
          <li>
            <strong>GP Catch-Up:</strong> If enabled, the GP receives 100% (or specified %) of distributions until they
            have received their proportionate share (typically 20/80) of all profits distributed to that point.
          </li>
          <li>
            <strong>Carried Interest Split:</strong> Remaining profits are split according to the carry rate
            (typically 80% LP / 20% GP).
          </li>
          <li>
            <strong>European vs American:</strong> European waterfalls calculate on whole-fund basis; American waterfalls
            calculate deal-by-deal (not fully modeled in this simplified tool).
          </li>
        </ul>
      </MethodologyBlock>

      {/* Related Tools */}
      <RelatedToolsSection
        currentToolSlug="distribution-waterfall"
        relatedTools={[
          {
            slug: 'management-fee-calculator',
            title: 'Management Fee Calculator',
            description: 'Model fund-level management fees and understand how different structures impact economics.',
            reason: 'Understand the other major component of GP compensation alongside carried interest'
          },
          {
            slug: 'subscription-credit-line',
            title: 'Subscription Credit Line Impact Visualizer',
            description: 'Model how subscription lines affect fund IRR, MOIC, and J-curve shape.',
            reason: 'See how credit facilities can boost reported IRR while affecting true economics'
          }
        ]}
        learningPath="Master fund economics: Waterfall → Fee Calculator → Credit Line Impact"
      />

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Actual waterfall calculations depend on specific LPA terms, timing of distributions, fees, and other factors. This tool uses simplified assumptions. Always consult with legal and financial advisors."
      />

      {/* Last Updated */}
      <div className="flex justify-center">
        <LastUpdated
          date="December 2024"
          version="2.1"
          changelogNote="Added what-if analysis"
        />
      </div>
    </div>
  )
}
