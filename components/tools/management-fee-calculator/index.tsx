'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFeeCalcStore, useActiveTab, useShowOnboarding, useResults, useFundInputs, PRESETS } from './store'
import { CalculatorTab } from './tabs/calculator-tab'
import { LearnTab } from './tabs/learn-tab'
import { Download, Share2, RotateCcw, Calculator, FileText } from 'lucide-react'

// Format currency
function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}M`
}

// Export functionality
function ExportDropdown() {
  const [open, setOpen] = useState(false)
  const results = useResults()
  const exportToJson = useFeeCalcStore(state => state.exportToJson)

  const handleExportJson = () => {
    const json = exportToJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fee-schedule.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const handleExportCsv = () => {
    const headers = ['Year', 'Fee Base', 'Base Amount', 'Rate', 'Fee', 'Cumulative']
    const rows = results.yearlyData.map(y => [
      y.year,
      y.feeBase,
      y.baseAmount.toFixed(2),
      y.feeRate.toFixed(2),
      y.feeAmount.toFixed(2),
      y.cumulativeFees.toFixed(2)
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fee-schedule.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-popover border rounded-lg shadow-lg z-50">
            <div className="p-1">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                <FileText className="h-4 w-4" />
                Export JSON
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                <FileText className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Share functionality
function ShareButton() {
  const fundInputs = useFundInputs()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const params = new URLSearchParams()
    params.set('data', btoa(JSON.stringify(fundInputs)))

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-2" />
      {copied ? 'Copied!' : 'Share'}
    </Button>
  )
}

// Quick start dialog
function QuickStartDialog() {
  const showOnboarding = useShowOnboarding()
  const setShowOnboarding = useFeeCalcStore(state => state.setShowOnboarding)
  const loadPreset = useFeeCalcStore(state => state.loadPreset)

  const handlePreset = (key: keyof typeof PRESETS) => {
    loadPreset(key)
    setShowOnboarding(false)
  }

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Management Fee Calculator
          </DialogTitle>
          <DialogDescription>
            Model fee schedules across fund life
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Select a starting template:
          </p>
          <div className="space-y-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePreset(key as keyof typeof PRESETS)}
                className="w-full p-3 text-left border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-sm text-muted-foreground">{preset.description}</div>
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowOnboarding(false)}
          >
            Start from Scratch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main component
export function ManagementFeeCalculator() {
  const activeTab = useActiveTab()
  const setActiveTab = useFeeCalcStore(state => state.setActiveTab)
  const reset = useFeeCalcStore(state => state.reset)
  const results = useResults()
  const fundInputs = useFundInputs()

  return (
    <div className="space-y-6">
      <QuickStartDialog />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Management Fee Calculator</h1>
          <p className="text-muted-foreground">
            Model fee schedules and total fee load
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown />
          <ShareButton />
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Key metrics bar */}
      <Card className="bg-accent/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Fund Size</p>
              <p className="text-lg font-semibold">${fundInputs.fundSize}M</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Fees</p>
              <p className="text-lg font-semibold text-blue-500">{formatCurrency(results.totalFees)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">% of Commitments</p>
              <p className="text-lg font-semibold">{results.feesAsPercentOfCommitments.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Annual</p>
              <p className="text-lg font-semibold">{results.averageAnnualFeePercent.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="learn">Learn</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-6">
          <CalculatorTab />
        </TabsContent>

        <TabsContent value="learn" className="mt-6">
          <LearnTab />
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This calculator provides estimates for educational purposes.
            Actual fee structures depend on specific LPA terms, side letter modifications, and
            accounting treatment. Consult legal and financial professionals for actual fund economics.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
