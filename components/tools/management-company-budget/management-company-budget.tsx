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
  ChevronDown,
  Undo2,
  Redo2,
  Upload,
  Download,
  Save
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
  DropdownMenuSeparator,
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
import { JourneyMode } from './journey-mode'
import { ResultsWalkthrough } from './results-walkthrough'
import { SensitivityAnalysis } from './sensitivity-analysis'
import { Benchmarks } from './benchmarks'
import {
  RunwayGauge,
  ExpenseBreakdownChart,
  EnhancedCashRunwayChart
} from './enhanced-charts'
import { GPCommitment } from './gp-commitment'
import { ScenarioComparison } from './scenario-comparison'
import { AdvancedSettings } from './advanced-settings'
import { GoalSeeking } from './goal-seeking'
import { ScenarioTemplates } from './scenario-templates'
import { WaterfallChart } from './waterfall-chart'
import { StackedExpenseChart } from './stacked-expense-chart'
import { WhatIfSliders } from './what-if-sliders'
import { ValidationWarnings } from './validation-warnings'
import { MethodologyDisclosure } from './methodology-disclosure'
import { useBudgetState } from './use-budget-state'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function ManagementCompanyBudget() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Track if user has completed wizard or skipped
  const [showWizard, setShowWizard] = useState<boolean | null>(null)
  const [showResultsWalkthrough, setShowResultsWalkthrough] = useState(false)
  const [wizardManuallyTriggered, setWizardManuallyTriggered] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // GP Commitment tracking
  const [gpCommitmentPercent, setGpCommitmentPercent] = useState(2) // 2% is typical
  const [gpFundedAmount, setGpFundedAmount] = useState(0)

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

  // Use the enhanced budget state hook with undo/redo and auto-save
  const {
    data,
    setData,
    canUndo,
    canRedo,
    undo,
    redo,
    exportToJson,
    importFromJson,
    downloadJson,
    resetToDefault,
    isDirty,
    lastSaved
  } = useBudgetState({ initialData: getInitialData() })

  // File input ref for JSON import
  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const content = ev.target?.result as string
          const success = importFromJson(content)
          if (!success) {
            alert('Invalid budget file. Please select a valid JSON export.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Check if this is a fresh visit or returning user (only on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && showWizard === null) {
      // Check for ?wizard=1 to force wizard display (for testing)
      const forceWizard = searchParams.get('wizard') === '1'
      const hasVisited = localStorage.getItem('budget-planner-visited')
      const hasUrlParams = searchParams.has('cash') || searchParams.has('funds')

      // Show wizard if first visit, no URL params, or forced
      const shouldShowWizard = forceWizard || (!hasVisited && !hasUrlParams)
      setShowWizard(shouldShowWizard)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    setShowResultsWalkthrough(true) // Show the results walkthrough after wizard
    setWizardManuallyTriggered(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('budget-planner-visited', 'true')
    }
  }

  const handleWizardSkip = () => {
    setShowWizard(false)
    setWizardManuallyTriggered(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('budget-planner-visited', 'true')
    }
  }

  const handleRestartWizard = () => {
    setWizardManuallyTriggered(true)
    setShowWizard(true)
  }

  const handleWalkthroughComplete = () => {
    setShowResultsWalkthrough(false)
  }

  const handleWalkthroughSkip = () => {
    setShowResultsWalkthrough(false)
  }

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()

    // Helper to set column widths
    const setColWidths = (ws: XLSX.WorkSheet, widths: number[]) => {
      ws['!cols'] = widths.map(w => ({ wch: w }))
    }

    // Summary sheet
    const totalFundSize = data.funds.reduce((sum, f) => sum + f.size * 1_000_000, 0)
    const gpCommitment = totalFundSize * (gpCommitmentPercent / 100)
    const summaryData = [
      ['Management Company Budget Analysis'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['KEY METRICS'],
      ['Metric', 'Value', 'Notes'],
      ['Starting Cash', data.startingCash, ''],
      ['Monthly Burn Rate', results.monthlyBurn, ''],
      ['Annual Budget', results.annualBudget, ''],
      ['Annual Revenue', results.annualRevenue, 'From management fees'],
      ['Runway', results.runwayMonths ? `${results.runwayMonths} months` : 'Infinite', results.runwayMonths && results.runwayMonths < 18 ? 'Warning: Below 18 month target' : ''],
      ['Break-Even Month', results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not in projection period', ''],
      ['Seed Capital Needed', results.seedCapitalNeeded, results.seedCapitalNeeded > data.startingCash ? 'Warning: Exceeds starting cash' : ''],
      [''],
      ['GP COMMITMENT'],
      ['GP Commitment %', `${gpCommitmentPercent}%`, ''],
      ['Total GP Commitment', gpCommitment, ''],
      ['Amount Funded', gpFundedAmount, ''],
      ['Unfunded Commitment', Math.max(0, gpCommitment - gpFundedAmount), ''],
      [''],
      ['EXPENSE BREAKDOWN'],
      ['Category', 'Monthly', 'Annual', '% of Total'],
      ['Team', results.teamCost, results.teamCost * 12, results.monthlyBurn > 0 ? `${((results.teamCost / results.monthlyBurn) * 100).toFixed(1)}%` : '0%'],
      ['Operations', results.opsCost, results.opsCost * 12, results.monthlyBurn > 0 ? `${((results.opsCost / results.monthlyBurn) * 100).toFixed(1)}%` : '0%'],
      ['Overhead', results.overheadCost, results.overheadCost * 12, results.monthlyBurn > 0 ? `${((results.overheadCost / results.monthlyBurn) * 100).toFixed(1)}%` : '0%'],
      ['TOTAL', results.monthlyBurn, results.annualBudget, '100%'],
    ]
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    setColWidths(summaryWs, [25, 18, 30])
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Funds sheet
    const fundsData = [
      ['Fund Revenue Sources'],
      [''],
      ['Fund Name', 'Size ($M)', 'Fee Rate (%)', 'First Close Year', 'Annual Fee', 'Monthly Fee', 'GP Commitment'],
      ...data.funds.map(f => [
        f.name,
        f.size,
        f.feeRate,
        f.firstCloseYear,
        f.size * 1_000_000 * (f.feeRate / 100),
        (f.size * 1_000_000 * (f.feeRate / 100)) / 12,
        f.size * 1_000_000 * (gpCommitmentPercent / 100)
      ]),
      [''],
      ['TOTAL', data.funds.reduce((s, f) => s + f.size, 0), '', '', results.annualRevenue, results.annualRevenue / 12, gpCommitment]
    ]
    const fundsWs = XLSX.utils.aoa_to_sheet(fundsData)
    setColWidths(fundsWs, [15, 12, 12, 15, 15, 15, 15])
    XLSX.utils.book_append_sheet(wb, fundsWs, 'Funds')

    // Team sheet
    const teamData = [
      ['Team Costs'],
      [''],
      ['Role', 'Monthly Cost', 'Annual Cost'],
      ...data.expenses.team.map(t => [t.role, t.monthlyCost, t.monthlyCost * 12]),
      [''],
      ['TOTAL', results.teamCost, results.teamCost * 12]
    ]
    const teamWs = XLSX.utils.aoa_to_sheet(teamData)
    setColWidths(teamWs, [25, 15, 15])
    XLSX.utils.book_append_sheet(wb, teamWs, 'Team')

    // Operations sheet
    const opsData = [
      ['Operations Costs'],
      [''],
      ['Expense', 'Monthly Cost', 'Annual Cost'],
      ...data.expenses.operations.map(o => [o.name, o.monthlyCost, o.monthlyCost * 12]),
      [''],
      ['TOTAL', results.opsCost, results.opsCost * 12]
    ]
    const opsWs = XLSX.utils.aoa_to_sheet(opsData)
    setColWidths(opsWs, [25, 15, 15])
    XLSX.utils.book_append_sheet(wb, opsWs, 'Operations')

    // Overhead sheet
    const overheadData = [
      ['Overhead Costs'],
      [''],
      ['Expense', 'Monthly Cost', 'Annual Cost'],
      ...data.expenses.overhead.map(o => [o.name, o.monthlyCost, o.monthlyCost * 12]),
      [''],
      ['TOTAL', results.overheadCost, results.overheadCost * 12]
    ]
    const overheadWs = XLSX.utils.aoa_to_sheet(overheadData)
    setColWidths(overheadWs, [25, 15, 15])
    XLSX.utils.book_append_sheet(wb, overheadWs, 'Overhead')

    // Projections sheet (60 months / 5 years)
    const projData = [
      ['Monthly Cash Flow Projections (5 Years)'],
      [''],
      ['Month', 'Revenue', 'Expenses', 'Net Cash Flow', 'Cash Balance', 'Cumulative Revenue', 'Cumulative Expenses'],
      ...results.projections.map((p, i) => {
        const cumRevenue = results.projections.slice(0, i + 1).reduce((s, pr) => s + pr.revenue, 0)
        const cumExpenses = results.projections.slice(0, i + 1).reduce((s, pr) => s + pr.expenses, 0)
        return [
          p.label,
          p.revenue,
          p.expenses,
          p.netCashFlow,
          p.cashBalance,
          cumRevenue,
          cumExpenses
        ]
      })
    ]
    const projWs = XLSX.utils.aoa_to_sheet(projData)
    setColWidths(projWs, [15, 15, 15, 15, 15, 18, 18])
    XLSX.utils.book_append_sheet(wb, projWs, 'Projections')

    // Annual Summary sheet
    const annualSummary: (string | number)[][] = [
      ['Annual Summary'],
      [''],
      ['Year', 'Total Revenue', 'Total Expenses', 'Net Cash Flow', 'Year-End Balance']
    ]
    for (let year = 0; year < 5; year++) {
      const yearProjs = results.projections.slice(year * 12, (year + 1) * 12)
      if (yearProjs.length === 0) break
      const yearRevenue = yearProjs.reduce((s, p) => s + p.revenue, 0)
      const yearExpenses = yearProjs.reduce((s, p) => s + p.expenses, 0)
      const yearEndBalance = yearProjs[yearProjs.length - 1]?.cashBalance ?? 0
      annualSummary.push([
        `Year ${year + 1}`,
        yearRevenue,
        yearExpenses,
        yearRevenue - yearExpenses,
        yearEndBalance
      ])
    }
    const annualWs = XLSX.utils.aoa_to_sheet(annualSummary)
    setColWidths(annualWs, [10, 15, 15, 15, 18])
    XLSX.utils.book_append_sheet(wb, annualWs, 'Annual Summary')

    XLSX.writeFile(wb, `management-company-budget-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Helper to add page number
    const addPageNumber = (pageNum: number) => {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(128, 128, 128)
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }

    // Helper to check if we need a new page
    const checkNewPage = (currentY: number, neededSpace: number): number => {
      if (currentY + neededSpace > pageHeight - 30) {
        doc.addPage()
        return 20
      }
      return currentY
    }

    // Calculate GP commitment values
    const totalFundSize = data.funds.reduce((sum, f) => sum + f.size * 1_000_000, 0)
    const gpCommitment = totalFundSize * (gpCommitmentPercent / 100)

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Management Company', pageWidth / 2, 22, { align: 'center' })
    doc.text('Budget Analysis', pageWidth / 2, 30, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' })

    // Key Metrics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Key Metrics', 14, 54)

    autoTable(doc, {
      startY: 58,
      head: [['Metric', 'Value', 'Status']],
      body: [
        ['Starting Cash', formatCurrency(data.startingCash), ''],
        ['Monthly Burn Rate', formatCurrency(results.monthlyBurn), ''],
        ['Annual Budget', formatCurrency(results.annualBudget), ''],
        ['Annual Revenue', formatCurrency(results.annualRevenue), ''],
        ['Runway', formatRunway(results.runwayMonths), results.runwayMonths !== null && results.runwayMonths < 18 ? 'Below 18mo target' : 'OK'],
        ['Break-Even', results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not in 5 years', ''],
        ['Seed Capital Needed', formatCurrency(results.seedCapitalNeeded), results.seedCapitalNeeded > data.startingCash ? 'Shortfall' : 'Covered'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      columnStyles: { 2: { cellWidth: 30 } },
    })

    // GP Commitment Summary
    let currentY = (doc as any).lastAutoTable.finalY + 12
    currentY = checkNewPage(currentY, 50)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('GP Commitment', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Metric', 'Value']],
      body: [
        ['GP Commitment %', `${gpCommitmentPercent}%`],
        ['Total Commitment', formatCurrency(gpCommitment)],
        ['Amount Funded', formatCurrency(gpFundedAmount)],
        ['Unfunded Commitment', formatCurrency(Math.max(0, gpCommitment - gpFundedAmount))],
      ],
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] },
      styles: { fontSize: 10 },
    })

    // Fund Revenue
    currentY = (doc as any).lastAutoTable.finalY + 12
    currentY = checkNewPage(currentY, 60)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Fund Revenue Sources', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Fund', 'Size', 'Fee Rate', 'Annual Fee', 'GP Commitment']],
      body: [
        ...data.funds.map(f => [
          f.name,
          `$${f.size}M`,
          `${f.feeRate}%`,
          formatCurrency(f.size * 1_000_000 * (f.feeRate / 100)),
          formatCurrency(f.size * 1_000_000 * (gpCommitmentPercent / 100))
        ]),
        ['TOTAL', `$${data.funds.reduce((s, f) => s + f.size, 0)}M`, '', formatCurrency(results.annualRevenue), formatCurrency(gpCommitment)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
    })

    // Expense Breakdown
    currentY = (doc as any).lastAutoTable.finalY + 12
    currentY = checkNewPage(currentY, 80)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Expense Breakdown', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Category', 'Monthly', 'Annual', '% of Total']],
      body: [
        ['Team', formatCurrency(results.teamCost), formatCurrency(results.teamCost * 12), results.monthlyBurn > 0 ? `${((results.teamCost / results.monthlyBurn) * 100).toFixed(1)}%` : '0%'],
        ['Operations', formatCurrency(results.opsCost), formatCurrency(results.opsCost * 12), results.monthlyBurn > 0 ? `${((results.opsCost / results.monthlyBurn) * 100).toFixed(1)}%` : '0%'],
        ['Overhead', formatCurrency(results.overheadCost), formatCurrency(results.overheadCost * 12), results.monthlyBurn > 0 ? `${((results.overheadCost / results.monthlyBurn) * 100).toFixed(1)}%` : '0%'],
        ['TOTAL', formatCurrency(results.monthlyBurn), formatCurrency(results.annualBudget), '100%']
      ],
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 10 },
    })

    // Team Details
    currentY = (doc as any).lastAutoTable.finalY + 12
    currentY = checkNewPage(currentY, 60)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Team Costs', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Role', 'Monthly', 'Annual']],
      body: [
        ...data.expenses.team.map(t => [
          t.role,
          formatCurrency(t.monthlyCost),
          formatCurrency(t.monthlyCost * 12)
        ]),
        ['TOTAL', formatCurrency(results.teamCost), formatCurrency(results.teamCost * 12)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
    })

    // Operations Details
    currentY = (doc as any).lastAutoTable.finalY + 12
    currentY = checkNewPage(currentY, 60)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Operations Costs', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Expense', 'Monthly', 'Annual']],
      body: [
        ...data.expenses.operations.map(o => [
          o.name,
          formatCurrency(o.monthlyCost),
          formatCurrency(o.monthlyCost * 12)
        ]),
        ['TOTAL', formatCurrency(results.opsCost), formatCurrency(results.opsCost * 12)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
    })

    // Overhead Details
    currentY = (doc as any).lastAutoTable.finalY + 12
    currentY = checkNewPage(currentY, 60)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Overhead Costs', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Expense', 'Monthly', 'Annual']],
      body: [
        ...data.expenses.overhead.map(o => [
          o.name,
          formatCurrency(o.monthlyCost),
          formatCurrency(o.monthlyCost * 12)
        ]),
        ['TOTAL', formatCurrency(results.overheadCost), formatCurrency(results.overheadCost * 12)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166] },
      styles: { fontSize: 10 },
    })

    // Annual Summary (new page)
    doc.addPage()

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('5-Year Annual Summary', 14, 20)

    const annualBody: string[][] = []
    for (let year = 0; year < 5; year++) {
      const yearProjs = results.projections.slice(year * 12, (year + 1) * 12)
      if (yearProjs.length === 0) break
      const yearRevenue = yearProjs.reduce((s, p) => s + p.revenue, 0)
      const yearExpenses = yearProjs.reduce((s, p) => s + p.expenses, 0)
      const yearEndBalance = yearProjs[yearProjs.length - 1]?.cashBalance ?? 0
      annualBody.push([
        `Year ${year + 1}`,
        formatCurrency(yearRevenue),
        formatCurrency(yearExpenses),
        formatCurrency(yearRevenue - yearExpenses),
        formatCurrency(yearEndBalance)
      ])
    }

    autoTable(doc, {
      startY: 24,
      head: [['Year', 'Total Revenue', 'Total Expenses', 'Net Cash Flow', 'Year-End Balance']],
      body: annualBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    })

    // First 12 months projection
    currentY = (doc as any).lastAutoTable.finalY + 12

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('First 12 Months Cash Flow', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Month', 'Revenue', 'Expenses', 'Net Flow', 'Balance']],
      body: results.projections.slice(0, 12).map(p => [
        p.label,
        formatCurrency(p.revenue, true),
        formatCurrency(p.expenses, true),
        formatCurrency(p.netCashFlow, true),
        formatCurrency(p.cashBalance, true)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
    })

    // Disclaimer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addPageNumber(i)
    }

    // Add disclaimer on last page
    doc.setPage(totalPages)
    const disclaimerY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 20 : pageHeight - 40
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    const disclaimer = 'This analysis is for informational purposes only. Management company budgets involve complex accounting, tax, and legal considerations. Consult with your fund administrator, accountant, and legal counsel before finalizing budgets or making financial decisions.'
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 28)
    doc.text(splitDisclaimer, 14, disclaimerY)

    doc.save(`management-company-budget-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Show wizard if needed
  if (showWizard === null) {
    return null // Loading state
  }

  if (showWizard) {
    return (
      <JourneyMode
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
      />
    )
  }

  if (showResultsWalkthrough) {
    return (
      <ResultsWalkthrough
        data={data}
        results={results}
        onComplete={handleWalkthroughComplete}
        onSkip={handleWalkthroughSkip}
      />
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
            {/* Undo/Redo buttons */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="h-8 px-2 rounded-r-none border-r"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="h-8 px-2 rounded-l-none"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            <ShareButton getShareableUrl={getShareableUrl} />

            {/* Export/Import dropdown */}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadJson}>
                  <Download className="h-4 w-4 mr-2" />
                  Save as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Load from JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <PresetManager
              presets={presets}
              isLoaded={presetsLoaded}
              onSave={handleSavePreset}
              onLoad={handleLoadPreset}
              onDelete={deletePreset}
              canSave={data.funds.length > 0}
              compact
            />
            {/* Auto-save indicator */}
            {lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3" />
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
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
          {/* Budget Health Check */}
          <ValidationWarnings data={data} results={results} />

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <RunwayGauge data={data} results={results} />
            <ExpenseBreakdownChart data={data} results={results} />
          </div>

          {/* Main Chart */}
          <EnhancedCashRunwayChart data={data} results={results} />

          {/* Additional Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <WaterfallChart data={data} results={results} />
            <StackedExpenseChart data={data} results={results} />
          </div>

          {/* Benchmarks */}
          <Benchmarks data={data} results={results} />

          {/* Methodology & Transparency */}
          <MethodologyDisclosure />
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

          {/* Advanced Settings */}
          <AdvancedSettings data={data} onDataChange={setData} />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          {/* What-If Sliders */}
          <WhatIfSliders data={data} results={results} onApply={setData} />

          {/* Goal Seeking and Scenario Templates */}
          <div className="grid lg:grid-cols-2 gap-6">
            <GoalSeeking
              data={data}
              results={results}
              onApply={(field, value) => {
                if (field === 'fundSize' && data.funds.length > 0) {
                  setData({
                    ...data,
                    funds: data.funds.map((f, i) => i === 0 ? { ...f, size: value } : f)
                  })
                } else if (field === 'startingCash') {
                  setData({ ...data, startingCash: value })
                }
              }}
            />
            <ScenarioTemplates currentData={data} onApply={setData} />
          </div>

          {/* Scenario Comparison and GP Commitment */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ScenarioComparison currentData={data} currentResults={results} />
            <GPCommitment
              data={data}
              gpCommitmentPercent={gpCommitmentPercent}
              onGpCommitmentChange={setGpCommitmentPercent}
              fundedAmount={gpFundedAmount}
              onFundedAmountChange={setGpFundedAmount}
            />
          </div>

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
