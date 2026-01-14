'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useBudgetStore, useActiveTab, useShowOnboarding } from './store'
import { OverviewTab } from './tabs/overview-tab'
import { InputsTab } from './tabs/inputs-tab'
import { AnalysisTab } from './tabs/analysis-tab'
import { Download, Share2, RotateCcw, Calculator, FileSpreadsheet, FileText } from 'lucide-react'

// Export functionality
function ExportDropdown() {
  const [open, setOpen] = useState(false)
  const data = useBudgetStore(state => state.data)
  const results = useBudgetStore(state => state.results)
  const exportToJson = useBudgetStore(state => state.exportToJson)

  const handleExportJson = () => {
    const json = exportToJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-scenario.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const handleExportCsv = () => {
    if (!results) return

    const headers = ['Month', 'Revenue', 'Expenses', 'Net Cash Flow', 'Cash Balance']
    const rows = results.projections.map(p => [
      p.label,
      p.revenue.toFixed(0),
      p.expenses.toFixed(0),
      p.netCashFlow.toFixed(0),
      p.cashBalance.toFixed(0)
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-projections.csv'
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
                <FileSpreadsheet className="h-4 w-4" />
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
  const data = useBudgetStore(state => state.data)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const params = new URLSearchParams()
    params.set('data', btoa(JSON.stringify(data)))

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
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

// Quick start dialog for first-time users
function QuickStartDialog() {
  const showOnboarding = useShowOnboarding()
  const setShowOnboarding = useBudgetStore(state => state.setShowOnboarding)
  const setActiveTab = useBudgetStore(state => state.setActiveTab)

  const handleStartFromScratch = () => {
    setShowOnboarding(false)
    setActiveTab('inputs')
  }

  const handleUseDefaults = () => {
    setShowOnboarding(false)
    setActiveTab('overview')
  }

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Management Company Budget
          </DialogTitle>
          <DialogDescription>
            Plan your fund's operational budget and forecast cash runway
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This tool helps you model your management company economics including:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            <li>Management fee revenue from multiple funds</li>
            <li>Team, operations, and overhead expenses</li>
            <li>Cash runway and break-even projections</li>
            <li>Sensitivity analysis and scenario comparison</li>
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleUseDefaults} className="w-full">
              Start with Example Data
            </Button>
            <Button variant="outline" onClick={handleStartFromScratch} className="w-full">
              Enter My Own Numbers
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main component
export function ManagementCompanyBudget() {
  const activeTab = useActiveTab()
  const setActiveTab = useBudgetStore(state => state.setActiveTab)
  const reset = useBudgetStore(state => state.reset)
  const results = useBudgetStore(state => state.results)

  return (
    <div className="space-y-6">
      <QuickStartDialog />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Management Company Budget</h1>
          <p className="text-muted-foreground">
            Plan operational expenses and forecast cash runway
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

      {/* Key metrics bar (always visible) */}
      {results && (
        <Card className="bg-accent/30">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Burn</p>
                <p className="text-lg font-semibold">
                  ${(results.monthlyBurn / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Annual Revenue</p>
                <p className="text-lg font-semibold">
                  ${(results.annualRevenue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Runway</p>
                <p className={`text-lg font-semibold ${
                  results.runwayMonths !== null && results.runwayMonths < 12
                    ? 'text-red-500'
                    : results.runwayMonths !== null && results.runwayMonths < 24
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`}>
                  {results.runwayMonths === null ? '60+' : results.runwayMonths} months
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Break-Even</p>
                <p className="text-lg font-semibold">
                  {results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inputs">Edit Budget</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="inputs" className="mt-6">
          <InputsTab />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <AnalysisTab />
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This tool provides estimates for educational purposes only.
            Actual costs vary significantly by jurisdiction, fund strategy, and market conditions.
            Consult qualified professionals before making financial decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
