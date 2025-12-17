"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, DollarSign, TrendingUp, Clock, AlertCircle, Building2 } from 'lucide-react'
import { DisclaimerBlock, ExportToolbar, PresetManager } from '@/components/tools/shared'
import { ShareButton } from '@/components/tools/share-button'
import { InfoPopover } from '@/components/ui/info-popover'
import { usePresets } from '@/lib/hooks/use-presets'
import { exportBudgetCSV, exportBudgetPDF } from './export'
import {
  BudgetData,
  Fund,
  TeamMember,
  ExpenseItem,
  DEFAULT_BUDGET_DATA,
  TYPICAL_RANGES
} from './types'
import { calculateBudget, formatCurrency, formatRunway } from './budget-calculator'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts'

export function ManagementCompanyBudget() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse initial state from URL or use defaults
  const getInitialData = (): BudgetData => {
    if (typeof window === 'undefined') return DEFAULT_BUDGET_DATA

    const startingCash = parseFloat(searchParams.get('cash') || '') || DEFAULT_BUDGET_DATA.startingCash

    // For simplicity, we'll store funds, team, and expenses as JSON in URL
    // This is a simplified version - complex nested data is harder to URL-encode
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
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

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

  // Update URL when data changes (debounced) - simplified to just starting cash and funds
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('cash', String(data.startingCash))
      // Encode funds array - limit URL size
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

  // Reset to defaults
  const resetToDefaults = () => {
    setData(DEFAULT_BUDGET_DATA)
  }

  // Chart data - show monthly for first 24 months, then quarterly
  const chartData = results.projections
    .filter((_, i) => i < 24 || i % 3 === 0)
    .map(p => ({
      label: p.label,
      cashBalance: p.cashBalance,
      revenue: p.revenue,
      expenses: p.expenses
    }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Management Company Budget Planner</h1>
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Plan your management company budget and runway. See how long your cash will last and when fees will cover expenses.
        </p>
        {/* Preset Manager */}
        <PresetManager
          presets={presets}
          isLoaded={presetsLoaded}
          onSave={handleSavePreset}
          onLoad={handleLoadPreset}
          onDelete={deletePreset}
          canSave={data.funds.length > 0}
          compact
        />
      </div>

      {/* Key Metrics - Always Visible */}
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

      {/* Cash Runway Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Runway Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v, true)}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelClassName="font-medium"
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="cashBalance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Cash Balance"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Monthly Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Monthly Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Starting Cash */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Starting Cash</CardTitle>
            <InfoPopover>
              Your initial capital to cover expenses before management fees start flowing. This is typically GP capital or seed funding from anchor LPs. Most emerging managers need 12-24 months of runway.
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
              Add each fund you manage. Management fees are calculated based on fund size and fee rate. First Close Year determines when fee revenue begins (fees typically start at first close, not final close).
            </InfoPopover>
          </div>
          <Button size="sm" onClick={addFund}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fund
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add your funds to calculate expected management fee revenue.
          </p>

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
              Enter the all-in monthly cost for each team member including salary, bonus, benefits, and payroll taxes. For emerging managers, team is typically the largest expense (60-70% of budget).
            </InfoPopover>
          </div>
          <Button size="sm" onClick={addTeamMember}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add team members with their all-in monthly cost (salary + bonus + benefits).
          </p>

          {/* Typical ranges hint */}
          <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
            <span className="font-medium">Typical monthly ranges:</span>{' '}
            Managing Partner $15-40K | Partner $12-30K | Associate $6-12K | Analyst $4-8K | CFO $12-25K
          </div>

          {data.expenses.team.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No team members added yet.</p>
          ) : (
            <div className="space-y-4">
              {data.expenses.team.map((member) => (
                <div key={member.id} className="p-4 border rounded-lg space-y-3 md:space-y-0">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                    <Input
                      placeholder="Role (e.g., Managing Partner)"
                      value={member.role}
                      onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 md:w-36">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          placeholder="Monthly cost"
                          value={member.monthlyCost || ''}
                          onChange={(e) => updateTeamMember(member.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                          className="pl-7"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">/month</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(member.id)}
                      className="text-muted-foreground hover:text-destructive justify-start md:justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1 md:mr-0" />
                      <span className="md:hidden">Remove</span>
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
              These are typically fund-level expenses passed through to LPs, but the management company often pays upfront and gets reimbursed. Budget for the cash flow impact even if ultimately charged to the fund.
            </InfoPopover>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Fund administration, audit, legal, compliance, and tax services.
          </p>

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
                    <div className="relative flex-1 sm:w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        value={item.monthlyCost || ''}
                        onChange={(e) => updateOperation(item.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                        className="pl-7"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/month</span>
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
              These are management company expenses paid from fee revenue. D&O/E&O insurance is critical for fund managers - don't skip it. Many emerging managers use coworking spaces to reduce office costs.
            </InfoPopover>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Office, insurance, technology, and travel expenses.
          </p>

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
                    <div className="relative flex-1 sm:w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        value={item.monthlyCost || ''}
                        onChange={(e) => updateOverhead(item.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                        className="pl-7"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/month</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download your budget analysis as CSV (for spreadsheets) or PDF (for presentations).
          </p>
          <ExportToolbar
            onExportCSV={() => {
              setCsvLoading(true)
              setTimeout(() => {
                exportBudgetCSV(data, results)
                setCsvLoading(false)
              }, 100)
            }}
            onExportPDF={() => {
              setPdfLoading(true)
              setTimeout(() => {
                exportBudgetPDF(data, results)
                setPdfLoading(false)
              }, 100)
            }}
            csvLoading={csvLoading}
            pdfLoading={pdfLoading}
          />
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </div>

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Management company budgets involve complex accounting, tax, and legal considerations. This tool is for planning purposes only. Consult with your fund administrator, accountant, and legal counsel before finalizing budgets."
      />
    </div>
  )
}
