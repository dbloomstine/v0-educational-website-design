"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Building2,
  Sparkles,
  BarChart3,
  Settings2,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react'
import { DisclaimerBlock, PresetManager } from '@/components/tools/shared'
import { ShareButton } from '@/components/tools/share-button'
import { InfoPopover } from '@/components/ui/info-popover'
import { usePresets } from '@/lib/hooks/use-presets'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BudgetData,
  Fund,
  TeamMember,
  ExpenseItem,
  DEFAULT_BUDGET_DATA,
  TYPICAL_RANGES
} from './types'
import { calculateBudget, formatCurrency, formatRunway } from './budget-calculator'
import { OnboardingWizard } from './onboarding-wizard'
import { SensitivityAnalysis } from './sensitivity-analysis'
import { Benchmarks } from './benchmarks'
import {
  RunwayGauge,
  ExpenseBreakdownChart,
  EnhancedCashRunwayChart
} from './enhanced-charts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function ManagementCompanyBudget() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Track if user has completed wizard or skipped
  const [showWizard, setShowWizard] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Parse initial state from URL or use defaults
  const getInitialData = (): BudgetData => {
    if (typeof window === 'undefined') return DEFAULT_BUDGET_DATA

    const startingCash = parseFloat(searchParams.get('cash') || '') || DEFAULT_BUDGET_DATA.startingCash

    let funds = DEFAULT_BUDGET_DATA.funds
    let expenses = DEFAULT_BUDGET_DATA.expenses

    try {
      const fundsParam = searchParams.get('funds')
      if (fundsParam) {
        funds = JSON.parse(decodeURIComponent(fundsParam))
      }
    } catch {
      // Keep defaults
    }

    return { startingCash, funds, expenses }
  }

  const [data, setData] = useState<BudgetData>(getInitialData)

  // Check if this is a fresh visit or returning user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('budget-planner-visited')
      const hasUrlParams = searchParams.has('cash') || searchParams.has('funds')

      // Show wizard if first visit and no URL params
      setShowWizard(!hasVisited && !hasUrlParams)
    }
  }, [searchParams])

  // Preset management
  const {
    presets,
    isLoaded: presetsLoaded,
    savePreset,
    loadPreset,
    deletePreset
  } = usePresets<BudgetData>({ storageKey: 'budget-planner-presets' })

  const handleSavePreset = (name: string) => {
    savePreset(name, data)
  }

  const handleLoadPreset = (presetId: string) => {
    const presetData = loadPreset(presetId)
    if (presetData) {
      setData(presetData)
    }
  }

  // Calculate results whenever data changes
  const results = useMemo(() => calculateBudget(data), [data])

  // Update URL when data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('cash', String(data.startingCash))
      if (data.funds.length > 0) {
        params.set('funds', encodeURIComponent(JSON.stringify(data.funds)))
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [data.startingCash, data.funds, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('cash', String(data.startingCash))
    if (data.funds.length > 0) {
      params.set('funds', encodeURIComponent(JSON.stringify(data.funds)))
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [data.startingCash, data.funds, pathname])

  // Helper to generate unique IDs
  const genId = () => Math.random().toString(36).substr(2, 9)

  // Fund handlers
  const addFund = () => {
    const newFund: Fund = {
      id: genId(),
      name: `Fund ${data.funds.length + 1}`,
      size: 50,
      feeRate: 2,
      firstCloseYear: new Date().getFullYear()
    }
    setData(prev => ({ ...prev, funds: [...prev.funds, newFund] }))
  }

  const updateFund = (id: string, updates: Partial<Fund>) => {
    setData(prev => ({
      ...prev,
      funds: prev.funds.map(f => f.id === id ? { ...f, ...updates } : f)
    }))
  }

  const removeFund = (id: string) => {
    setData(prev => ({ ...prev, funds: prev.funds.filter(f => f.id !== id) }))
  }

  // Team handlers
  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: genId(),
      role: '',
      monthlyCost: 0
    }
    setData(prev => ({
      ...prev,
      expenses: { ...prev.expenses, team: [...prev.expenses.team, newMember] }
    }))
  }

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setData(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        team: prev.expenses.team.map(m => m.id === id ? { ...m, ...updates } : m)
      }
    }))
  }

  const removeTeamMember = (id: string) => {
    setData(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        team: prev.expenses.team.filter(m => m.id !== id)
      }
    }))
  }

  // Operations expense handlers
  const updateOperation = (id: string, updates: Partial<ExpenseItem>) => {
    setData(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        operations: prev.expenses.operations.map(o => o.id === id ? { ...o, ...updates } : o)
      }
    }))
  }

  // Overhead expense handlers
  const updateOverhead = (id: string, updates: Partial<ExpenseItem>) => {
    setData(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        overhead: prev.expenses.overhead.map(o => o.id === id ? { ...o, ...updates } : o)
      }
    }))
  }

  // Wizard handlers
  const handleWizardComplete = (wizardData: BudgetData) => {
    setData(wizardData)
    setShowWizard(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('budget-planner-visited', 'true')
    }
  }

  const handleWizardSkip = () => {
    setShowWizard(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('budget-planner-visited', 'true')
    }
  }

  const handleRestartWizard = () => {
    setShowWizard(true)
  }

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['Management Company Budget Analysis'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Key Metrics'],
      ['Starting Cash', formatCurrency(data.startingCash)],
      ['Monthly Burn Rate', formatCurrency(results.monthlyBurn)],
      ['Annual Budget', formatCurrency(results.annualBudget)],
      ['Annual Revenue', formatCurrency(results.annualRevenue)],
      ['Runway', formatRunway(results.runwayMonths)],
      ['Break-Even Month', results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not projected'],
      ['Seed Capital Needed', formatCurrency(results.seedCapitalNeeded)],
    ]
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Funds sheet
    const fundsData = [
      ['Fund Revenue Sources'],
      ['Fund Name', 'Size ($M)', 'Fee Rate (%)', 'First Close Year', 'Annual Fee'],
      ...data.funds.map(f => [
        f.name,
        f.size,
        f.feeRate,
        f.firstCloseYear,
        f.size * 1_000_000 * (f.feeRate / 100)
      ])
    ]
    const fundsWs = XLSX.utils.aoa_to_sheet(fundsData)
    XLSX.utils.book_append_sheet(wb, fundsWs, 'Funds')

    // Team sheet
    const teamData = [
      ['Team Costs'],
      ['Role', 'Monthly Cost', 'Annual Cost'],
      ...data.expenses.team.map(t => [t.role, t.monthlyCost, t.monthlyCost * 12])
    ]
    const teamWs = XLSX.utils.aoa_to_sheet(teamData)
    XLSX.utils.book_append_sheet(wb, teamWs, 'Team')

    // Operations sheet
    const opsData = [
      ['Operations Costs'],
      ['Expense', 'Monthly Cost', 'Annual Cost'],
      ...data.expenses.operations.map(o => [o.name, o.monthlyCost, o.monthlyCost * 12])
    ]
    const opsWs = XLSX.utils.aoa_to_sheet(opsData)
    XLSX.utils.book_append_sheet(wb, opsWs, 'Operations')

    // Projections sheet
    const projData = [
      ['Monthly Cash Flow Projections'],
      ['Month', 'Revenue', 'Expenses', 'Net Cash Flow', 'Cash Balance'],
      ...results.projections.slice(0, 36).map(p => [
        p.label,
        p.revenue,
        p.expenses,
        p.netCashFlow,
        p.cashBalance
      ])
    ]
    const projWs = XLSX.utils.aoa_to_sheet(projData)
    XLSX.utils.book_append_sheet(wb, projWs, 'Projections')

    XLSX.writeFile(wb, `management-company-budget-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Management Company Budget Analysis', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' })

    // Key Metrics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Key Metrics', 14, 42)

    autoTable(doc, {
      startY: 46,
      head: [['Metric', 'Value']],
      body: [
        ['Starting Cash', formatCurrency(data.startingCash)],
        ['Monthly Burn Rate', formatCurrency(results.monthlyBurn)],
        ['Annual Budget', formatCurrency(results.annualBudget)],
        ['Annual Revenue', formatCurrency(results.annualRevenue)],
        ['Runway', formatRunway(results.runwayMonths)],
        ['Break-Even', results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not projected'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    })

    // Fund Revenue
    const finalY1 = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Fund Revenue Sources', 14, finalY1)

    autoTable(doc, {
      startY: finalY1 + 4,
      head: [['Fund', 'Size', 'Fee Rate', 'Annual Fee']],
      body: data.funds.map(f => [
        f.name,
        `$${f.size}M`,
        `${f.feeRate}%`,
        formatCurrency(f.size * 1_000_000 * (f.feeRate / 100))
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10 },
    })

    // Team Costs
    const finalY2 = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Team Costs', 14, finalY2)

    autoTable(doc, {
      startY: finalY2 + 4,
      head: [['Role', 'Monthly', 'Annual']],
      body: data.expenses.team.map(t => [
        t.role,
        formatCurrency(t.monthlyCost),
        formatCurrency(t.monthlyCost * 12)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
    })

    // Disclaimer
    const finalY3 = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    const disclaimer = 'This analysis is for informational purposes only. Consult with your accountant and legal counsel before making financial decisions.'
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 28)
    doc.text(splitDisclaimer, 14, finalY3)

    doc.save(`management-company-budget-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Show wizard if needed
  if (showWizard === null) {
    return null // Loading state
  }

  if (showWizard) {
    return (
      <div className="space-y-8">
        <OnboardingWizard
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Management Company Budget Planner</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Plan your management company budget and runway. See how long your cash will last and when fees will cover expenses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton getShareableUrl={getShareableUrl} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <PresetManager
            presets={presets}
            isLoaded={presetsLoaded}
            onSave={handleSavePreset}
            onLoad={handleLoadPreset}
            onDelete={deletePreset}
            canSave={data.funds.length > 0}
            compact
          />
          <Button variant="ghost" size="sm" onClick={handleRestartWizard}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            Run Setup Wizard
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Monthly Burn</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(results.monthlyBurn, true)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(results.annualBudget, true)}/year</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Annual Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(results.annualRevenue, true)}</p>
            <p className="text-xs text-muted-foreground mt-1">From management fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Runway</span>
            </div>
            <p className={`text-2xl font-bold ${results.runwayMonths !== null && results.runwayMonths < 18 ? 'text-red-600' : ''}`}>
              {formatRunway(results.runwayMonths)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Until cash runs out</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Break-Even</span>
            </div>
            <p className="text-2xl font-bold">
              {results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not in 5 years'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">When fees cover expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Seed Capital Alert */}
      {results.seedCapitalNeeded > data.startingCash && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              You may need {formatCurrency(results.seedCapitalNeeded)} in seed capital
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              Based on your expenses and revenue timing, you&apos;ll need approximately {formatCurrency(results.seedCapitalNeeded - data.startingCash)} more than your starting cash to reach break-even.
            </p>
          </div>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="inputs" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Edit Budget
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <RunwayGauge data={data} results={results} />
            <ExpenseBreakdownChart data={data} results={results} />
          </div>

          {/* Main Chart */}
          <EnhancedCashRunwayChart data={data} results={results} />

          {/* Benchmarks */}
          <Benchmarks data={data} results={results} />
        </TabsContent>

        {/* Edit Budget Tab */}
        <TabsContent value="inputs" className="space-y-6 mt-6">
          {/* Starting Cash */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Starting Cash</CardTitle>
                <InfoPopover>
                  Your initial capital to cover expenses before management fees start flowing. This is typically GP capital or seed funding from anchor LPs.
                </InfoPopover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label htmlFor="starting-cash">How much cash do you have to start?</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="starting-cash"
                    type="number"
                    value={data.startingCash}
                    onChange={(e) => setData(prev => ({ ...prev, startingCash: parseFloat(e.target.value) || 0 }))}
                    className="pl-7"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funds Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Your Fund(s)</CardTitle>
                <InfoPopover>
                  Add each fund you manage. Management fees are calculated based on fund size and fee rate.
                </InfoPopover>
              </div>
              <Button size="sm" onClick={addFund}>
                <Plus className="h-4 w-4 mr-2" />
                Add Fund
              </Button>
            </CardHeader>
            <CardContent>
              {data.funds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No funds added yet. Click &quot;Add Fund&quot; to get started.</p>
              ) : (
                <div className="space-y-4">
                  {data.funds.map((fund) => (
                    <div key={fund.id} className="p-4 border rounded-lg space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2 md:col-span-1">
                          <Label>Fund Name</Label>
                          <Input
                            value={fund.name}
                            onChange={(e) => updateFund(fund.id, { name: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Size ($M)</Label>
                          <Input
                            type="number"
                            value={fund.size}
                            onChange={(e) => updateFund(fund.id, { size: parseFloat(e.target.value) || 0 })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Mgmt Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fund.feeRate}
                            onChange={(e) => updateFund(fund.id, { feeRate: parseFloat(e.target.value) || 0 })}
                            className="mt-1"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <Label>First Close Year</Label>
                          <Input
                            type="number"
                            value={fund.firstCloseYear}
                            onChange={(e) => updateFund(fund.id, { firstCloseYear: parseInt(e.target.value) || new Date().getFullYear() })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Expected annual fee: {formatCurrency(fund.size * 1_000_000 * (fund.feeRate / 100))}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFund(fund.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Team</CardTitle>
                <InfoPopover>
                  Enter the all-in monthly cost for each team member including salary, bonus, benefits, and payroll taxes.
                </InfoPopover>
              </div>
              <Button size="sm" onClick={addTeamMember}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Typical monthly ranges:</span>{' '}
                Managing Partner $15-40K | Partner $12-30K | Associate $6-12K | Analyst $4-8K | CFO $12-25K
              </div>

              {data.expenses.team.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No team members added yet.</p>
              ) : (
                <div className="space-y-4">
                  {data.expenses.team.map((member) => (
                    <div key={member.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
                        <Input
                          placeholder="Role (e.g., Managing Partner)"
                          value={member.role}
                          onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <div className="relative w-36">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input
                              type="number"
                              placeholder="Monthly"
                              value={member.monthlyCost || ''}
                              onChange={(e) => updateTeamMember(member.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                              className="pl-7"
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(member.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operations Expenses */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Operations</CardTitle>
                <InfoPopover>
                  These are typically fund-level expenses passed through to LPs, but the management company often pays upfront.
                </InfoPopover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.expenses.operations.map((item) => {
                  const range = TYPICAL_RANGES.operations[item.name as keyof typeof TYPICAL_RANGES.operations]
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {range && <span className="text-xs text-muted-foreground ml-2">{range.note}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-36">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            value={item.monthlyCost || ''}
                            onChange={(e) => updateOperation(item.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                            className="pl-7"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Overhead Expenses */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Overhead</CardTitle>
                <InfoPopover>
                  These are management company expenses paid from fee revenue.
                </InfoPopover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.expenses.overhead.map((item) => {
                  const range = TYPICAL_RANGES.overhead[item.name as keyof typeof TYPICAL_RANGES.overhead]
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {range && <span className="text-xs text-muted-foreground ml-2">{range.note}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-36">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            value={item.monthlyCost || ''}
                            onChange={(e) => updateOverhead(item.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                            className="pl-7"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <SensitivityAnalysis baseData={data} baseResults={results} />

          {/* Monthly Projection Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Projections (First 24 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Month</th>
                      <th className="text-right py-2 px-2">Revenue</th>
                      <th className="text-right py-2 px-2">Expenses</th>
                      <th className="text-right py-2 px-2">Net Flow</th>
                      <th className="text-right py-2 px-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.projections.slice(0, 24).map((proj, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">{proj.label}</td>
                        <td className="text-right py-2 px-2 text-emerald-600">{formatCurrency(proj.revenue, true)}</td>
                        <td className="text-right py-2 px-2 text-red-600">{formatCurrency(proj.expenses, true)}</td>
                        <td className={`text-right py-2 px-2 ${proj.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(proj.netCashFlow, true)}
                        </td>
                        <td className={`text-right py-2 px-2 font-medium ${proj.cashBalance < data.startingCash * 0.25 ? 'text-amber-600' : ''}`}>
                          {formatCurrency(proj.cashBalance, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Management company budgets involve complex accounting, tax, and legal considerations. This tool is for planning purposes only. Consult with your fund administrator, accountant, and legal counsel before finalizing budgets."
      />
    </div>
  )
}
