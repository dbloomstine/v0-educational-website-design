'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  useSubscriptionLineStore,
  useActiveTab,
  useShowOnboarding,
  useResults,
  useInput,
  PRESETS
} from './store'
import { CalculatorTab } from './tabs/calculator-tab'
import { LearnTab } from './tabs/learn-tab'
import { exportSubscriptionLineCSV, exportSubscriptionLineExcel, exportSubscriptionLinePDF } from './export'
import { formatBasisPoints, SubscriptionLineInput } from './subscriptionLineCalculations'
import { Download, Share2, RotateCcw, FileText, CreditCard } from 'lucide-react'

// Export dropdown
function ExportDropdown() {
  const [open, setOpen] = useState(false)
  const results = useResults()
  const exportToJson = useSubscriptionLineStore((state) => state.exportToJson)

  const handleExportJson = () => {
    const json = exportToJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscription-line-analysis.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const handleExportCsv = () => {
    exportSubscriptionLineCSV(results)
    setOpen(false)
  }

  const handleExportExcel = () => {
    exportSubscriptionLineExcel(results)
    setOpen(false)
  }

  const handleExportPdf = () => {
    exportSubscriptionLinePDF(results)
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
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                <FileText className="h-4 w-4" />
                Export Excel
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Share button
function ShareButton() {
  const getShareableUrl = useSubscriptionLineStore((state) => state.getShareableUrl)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = getShareableUrl()

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
  const setShowOnboarding = useSubscriptionLineStore((state) => state.setShowOnboarding)
  const loadPreset = useSubscriptionLineStore((state) => state.loadPreset)

  const handlePreset = (key: keyof typeof PRESETS) => {
    loadPreset(key)
    setShowOnboarding(false)
  }

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Credit Line Impact Visualizer
          </DialogTitle>
          <DialogDescription>Model how credit facilities affect fund IRR, MOIC, and J-curve</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">Select a starting template:</p>
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
          <Button variant="outline" className="w-full" onClick={() => setShowOnboarding(false)}>
            Start from Scratch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main component
export function SubscriptionCreditLineV2() {
  const searchParams = useSearchParams()
  const activeTab = useActiveTab()
  const setActiveTab = useSubscriptionLineStore((state) => state.setActiveTab)
  const reset = useSubscriptionLineStore((state) => state.reset)
  const results = useResults()
  const input = useInput()
  const setInput = useSubscriptionLineStore((state) => state.setInput)
  const setShowOnboarding = useSubscriptionLineStore((state) => state.setShowOnboarding)

  // Parse URL params on mount
  useEffect(() => {
    const fundSize = searchParams.get('fundSize')
    if (fundSize) {
      // URL has params, load them
      const updates: Partial<SubscriptionLineInput> = {}

      if (fundSize) updates.fundSize = parseFloat(fundSize)
      const investPeriod = searchParams.get('investPeriod')
      if (investPeriod) updates.investmentPeriodYears = parseInt(investPeriod)
      const fundTerm = searchParams.get('fundTerm')
      if (fundTerm) updates.fundTermYears = parseInt(fundTerm)
      const deployPace = searchParams.get('deployPace')
      if (deployPace) updates.deploymentPaceType = deployPace as SubscriptionLineInput['deploymentPaceType']
      const mgmtFee = searchParams.get('mgmtFee')
      if (mgmtFee) updates.managementFeeRate = parseFloat(mgmtFee)
      const feeBasis = searchParams.get('feeBasis')
      if (feeBasis) updates.managementFeeBasis = feeBasis as SubscriptionLineInput['managementFeeBasis']
      const carry = searchParams.get('carry')
      if (carry) updates.carryRate = parseFloat(carry)
      const pref = searchParams.get('pref')
      if (pref) updates.prefRate = parseFloat(pref)
      const useLine = searchParams.get('useLine')
      if (useLine) updates.useLine = useLine === 'true'
      const facilitySize = searchParams.get('facilitySize')
      if (facilitySize) updates.facilitySize = parseFloat(facilitySize)
      const interestRate = searchParams.get('interestRate')
      if (interestRate) updates.interestRate = parseFloat(interestRate)
      const maxDays = searchParams.get('maxDays')
      if (maxDays) updates.maxDaysOutstanding = parseInt(maxDays)
      const repayment = searchParams.get('repayment')
      if (repayment) updates.repaymentTrigger = repayment as SubscriptionLineInput['repaymentTrigger']
      const grossMOIC = searchParams.get('grossMOIC')
      if (grossMOIC) updates.grossMOIC = parseFloat(grossMOIC)
      const realization = searchParams.get('realization')
      if (realization) updates.realizationScheduleType = realization as SubscriptionLineInput['realizationScheduleType']

      setInput(updates)
      setShowOnboarding(false) // Don't show onboarding if loaded from URL
    }
  }, [searchParams, setInput, setShowOnboarding])

  const annualInterestCost = results.totalInterestPaid / input.fundTermYears

  return (
    <div className="space-y-6">
      <QuickStartDialog />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Credit Line Impact Visualizer</h1>
          <p className="text-muted-foreground">Model how credit facilities affect fund IRR, MOIC, and J-curve</p>
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
              <p className="text-lg font-semibold">${(input.fundSize / 1000000).toFixed(0)}M</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">IRR Boost</p>
              <p
                className={`text-lg font-semibold ${results.irrBoost > 0 ? 'text-green-500' : results.irrBoost < 0 ? 'text-red-500' : ''}`}
              >
                {input.useLine ? formatBasisPoints(results.irrBoost) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">MOIC Drag</p>
              <p className={`text-lg font-semibold ${results.moicDrag > 0 ? 'text-amber-500' : ''}`}>
                {input.useLine ? `-${results.moicDrag.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annual Interest</p>
              <p className="text-lg font-semibold">
                {input.useLine ? `$${(annualInterestCost / 1000000).toFixed(1)}M` : 'N/A'}
              </p>
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
            <strong>Disclaimer:</strong> This calculator provides estimates for educational purposes. Actual subscription
            line impact depends on specific facility terms, capital call timing, investment performance, and many other
            factors. Per ILPA guidance, funds should report both levered and unlevered returns. Consult legal and
            financial professionals for actual fund structuring.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Default export for backward compatibility
export default SubscriptionCreditLineV2
