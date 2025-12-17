'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { WaterfallInput, WaterfallOutput, defaultInput, calculateWaterfall, formatCurrency, formatMultiple } from './waterfallCalculations'
import { InputForm } from './input-form'
import { ResultsView } from './results-view'
import { exportWaterfallSummary, exportComparisonCSV, exportComparisonPDF } from './export'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShareButton } from '@/components/tools/share-button'
import { ExportToolbar } from '@/components/tools/shared'

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

export function DistributionWaterfall() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse initial state from URL or use defaults
  const getInitialInput = (): WaterfallInput => {
    if (typeof window === 'undefined') return defaultInput

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

  // Initialize with calculated results
  const [input, setInput] = useState<WaterfallInput>(getInitialInput)
  const [output, setOutput] = useState<WaterfallOutput>(calculateWaterfall(getInitialInput()))
  const [compareMode, setCompareMode] = useState(false)
  const [compareInput, setCompareInput] = useState<WaterfallInput | null>(null)
  const [compareOutput, setCompareOutput] = useState<WaterfallOutput | null>(null)

  // Quick scenario buttons for different proceeds
  const [selectedScenario, setSelectedScenario] = useState<'low' | 'medium' | 'high'>('medium')

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

  const updateCompareInput = (newInput: WaterfallInput) => {
    setCompareInput(newInput)
    setCompareOutput(calculateWaterfall(newInput))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute right-0 top-0">
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Distribution Waterfall Visualizer
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Model LP and GP economics across preferred return, catch-up, and carried interest tiers.
          Understand how different waterfall structures affect distributions.
        </p>
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
              className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent hover:border-primary"
            >
              <div className="mb-1 font-semibold text-foreground">{preset.name}</div>
              <div className="text-xs text-muted-foreground">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Scenario Buttons */}
      <Card className="border-border bg-card p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Quick Scenarios</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          See how different return multiples affect the waterfall
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleScenarioChange('low')}
            variant={selectedScenario === 'low' ? 'default' : 'outline'}
            className="flex-1 sm:flex-none"
          >
            1.5x Return
          </Button>
          <Button
            onClick={() => handleScenarioChange('medium')}
            variant={selectedScenario === 'medium' ? 'default' : 'outline'}
            className="flex-1 sm:flex-none"
          >
            2.0x Return
          </Button>
          <Button
            onClick={() => handleScenarioChange('high')}
            variant={selectedScenario === 'high' ? 'default' : 'outline'}
            className="flex-1 sm:flex-none"
          >
            3.0x Return
          </Button>
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
                <ResultsView output={output} onExport={handleExport} />
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
              <ResultsView output={output} onExport={handleExport} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
