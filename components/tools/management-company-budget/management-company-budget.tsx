"use client"

import { useState, useEffect } from 'react'
import { BudgetData, CalculationResults } from './types'
import { calculateBudget, calculateRunwayMonths, getSampleData } from './budget-calculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Plus, Trash2, Building2, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { InfoPopover } from '@/components/ui/info-popover'
import { DisclaimerBlock } from '@/components/tools/shared'
import { MetricsSummary } from './metrics-summary'
import { BudgetCharts } from './budget-charts'
import { FundsEditor } from './funds-editor'
import { ExpensesEditor } from './expenses-editor'
import { ExportButtons } from './export-buttons'

export function ManagementCompanyBudget() {
  const [budgetData, setBudgetData] = useState<BudgetData>(getSampleData())
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [showCarry, setShowCarry] = useState(true)
  const [auditMode, setAuditMode] = useState(false)

  // Recalculate when data changes
  useEffect(() => {
    const calculated = calculateBudget(budgetData, showCarry)
    setResults(calculated)
  }, [budgetData, showCarry])

  const handleFirmProfileChange = (updates: Partial<BudgetData['firmProfile']>) => {
    setBudgetData(prev => ({
      ...prev,
      firmProfile: { ...prev.firmProfile, ...updates }
    }))
  }

  const handleCapitalStructureChange = (updates: Partial<BudgetData['capitalStructure']>) => {
    setBudgetData(prev => ({
      ...prev,
      capitalStructure: { ...prev.capitalStructure, ...updates }
    }))
  }

  const handlePlanningHorizonChange = (updates: Partial<BudgetData['planningHorizon']>) => {
    setBudgetData(prev => ({
      ...prev,
      planningHorizon: { ...prev.planningHorizon, ...updates }
    }))
  }

  const handleRevenueChange = (updates: Partial<BudgetData['revenue']>) => {
    setBudgetData(prev => ({
      ...prev,
      revenue: { ...prev.revenue, ...updates }
    }))
  }

  const loadSampleData = () => {
    setBudgetData(getSampleData())
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setBudgetData({
        ...getSampleData(),
        funds: [],
        revenue: { additionalFees: [], recurringRevenue: [], carryRevenue: 0 },
        expenses: { people: [], services: [], technology: [], office: [], marketing: [], insurance: [] }
      })
    }
  }

  const formatCurrency = (value: number, short = false): string => {
    if (short && Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Management Company Budget Planner</h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Model your management company economics, revenues, expenses, and cash runway. Built for emerging and
          established fund managers planning their operating budget.
        </p>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This is an educational tool for modeling management company budgets. It does not constitute
            financial, tax, or legal advice. Consult with your fund administrator, accountant, and legal counsel.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border rounded-lg">
        <Button variant="outline" onClick={loadSampleData}>
          <Building2 className="h-4 w-4 mr-2" />
          Load Sample Data
        </Button>
        <Button variant="outline" onClick={clearAllData}>
          Clear All
        </Button>
        <div className="flex items-center gap-2 sm:ml-4">
          <Switch
            id="show-carry"
            checked={showCarry}
            onCheckedChange={setShowCarry}
          />
          <Label htmlFor="show-carry" className="text-sm cursor-pointer whitespace-nowrap">Show Carry Revenue</Label>
          <InfoPopover iconSize="sm">
            Include carried interest as a revenue source in projections. Carry is speculative and depends on fund performance - many managers exclude it for conservative planning.
          </InfoPopover>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="audit-mode"
            checked={auditMode}
            onCheckedChange={setAuditMode}
          />
          <Label htmlFor="audit-mode" className="text-sm cursor-pointer whitespace-nowrap">Audit Mode</Label>
          <InfoPopover iconSize="sm">
            Shows detailed line-item breakdown with audit-ready formatting. Useful for review by accountants or during fundraising due diligence.
          </InfoPopover>
        </div>
        <div className="flex-1" />
        <ExportButtons budgetData={budgetData} results={results} formatCurrency={formatCurrency} />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
            <TabsTrigger value="firm" className="flex-1 sm:flex-none whitespace-nowrap">Firm & Funds</TabsTrigger>
            <TabsTrigger value="revenue" className="flex-1 sm:flex-none">Revenue</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1 sm:flex-none">Expenses</TabsTrigger>
            <TabsTrigger value="scenarios" className="flex-1 sm:flex-none">Scenarios</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {results && (
            <>
              <MetricsSummary
                results={results}
                budgetData={budgetData}
                formatCurrency={formatCurrency}
              />
              <BudgetCharts
                results={results}
                formatCurrency={formatCurrency}
              />
            </>
          )}
        </TabsContent>

        {/* Firm & Funds Tab */}
        <TabsContent value="firm" className="space-y-6">
          {/* Firm Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Firm Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="asset-class">Asset Class</Label>
                    <InfoPopover>
                      Your primary investment strategy. This affects typical fee structures, expense ratios, and industry benchmarks. Multi-strategy firms should select their predominant asset class.
                    </InfoPopover>
                  </div>
                  <Select
                    value={budgetData.firmProfile.assetClass}
                    onValueChange={(value: any) => handleFirmProfileChange({ assetClass: value })}
                  >
                    <SelectTrigger id="asset-class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Venture Capital">Venture Capital</SelectItem>
                      <SelectItem value="Private Equity Buyout">Private Equity Buyout</SelectItem>
                      <SelectItem value="Growth Equity">Growth Equity</SelectItem>
                      <SelectItem value="Private Credit">Private Credit</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Hedge Fund">Hedge Fund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="geography">Geography</Label>
                    <InfoPopover>
                      Primary operating geography. This affects compensation benchmarks, office costs, and regulatory overhead. Global firms typically have higher operating costs.
                    </InfoPopover>
                  </div>
                  <Select
                    value={budgetData.firmProfile.geography}
                    onValueChange={(value: any) => handleFirmProfileChange({ geography: value })}
                  >
                    <SelectTrigger id="geography">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="Asia">Asia</SelectItem>
                      <SelectItem value="Global">Global</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="stage">Stage</Label>
                    <InfoPopover>
                      Your firm's development stage. Emerging managers typically have higher expense ratios (as % of AUM) and may operate with negative margins in early years while building the platform.
                    </InfoPopover>
                  </div>
                  <Select
                    value={budgetData.firmProfile.stage}
                    onValueChange={(value: any) => handleFirmProfileChange({ stage: value })}
                  >
                    <SelectTrigger id="stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emerging Manager - Fund I">Emerging Manager - Fund I</SelectItem>
                      <SelectItem value="Emerging Manager - Fund II">Emerging Manager - Fund II</SelectItem>
                      <SelectItem value="Emerging Manager - Fund III+">Emerging Manager - Fund III+</SelectItem>
                      <SelectItem value="Established Multi-Fund Platform">Established Multi-Fund Platform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funds Editor */}
          <FundsEditor
            funds={budgetData.funds}
            onChange={(funds) => setBudgetData(prev => ({ ...prev, funds }))}
          />

          {/* Capital Structure & Planning Horizon */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Starting Cash & Capital Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="starting-cash">Starting Cash Balance ($)</Label>
                  <Input
                    id="starting-cash"
                    type="number"
                    value={budgetData.capitalStructure.startingCash}
                    onChange={(e) => handleCapitalStructureChange({ startingCash: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-capital">Partner Capital Contributions ($)</Label>
                  <Input
                    id="partner-capital"
                    type="number"
                    value={budgetData.capitalStructure.partnerCapital}
                    onChange={(e) => handleCapitalStructureChange({ partnerCapital: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit-line">Credit Line / Facility ($)</Label>
                  <Input
                    id="credit-line"
                    type="number"
                    value={budgetData.capitalStructure.creditLine}
                    onChange={(e) => handleCapitalStructureChange({ creditLine: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planning Horizon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="planning-years">Planning Period (Years)</Label>
                  <Select
                    value={budgetData.planningHorizon.years.toString()}
                    onValueChange={(value) => handlePlanningHorizonChange({ years: parseInt(value) })}
                  >
                    <SelectTrigger id="planning-years">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                      <SelectItem value="7">7 Years</SelectItem>
                      <SelectItem value="10">10 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="granularity">Display Granularity</Label>
                  <Select
                    value={budgetData.planningHorizon.granularity}
                    onValueChange={(value: any) => handlePlanningHorizonChange({ granularity: value })}
                  >
                    <SelectTrigger id="granularity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Management fee revenue is calculated automatically from your fund configurations. Add any additional
              fee income or revenue streams below.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Additional Fee Income
                <Button
                  size="sm"
                  onClick={() => {
                    const newItem = {
                      id: Date.now().toString(),
                      description: '',
                      amount: 0,
                      type: 'recurring' as const
                    }
                    handleRevenueChange({
                      additionalFees: [...budgetData.revenue.additionalFees, newItem]
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitoring fees, transaction fees, advisory retainers, board fees, consulting income
              </p>
              <div className="space-y-3">
                {budgetData.revenue.additionalFees.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const updated = budgetData.revenue.additionalFees.map(i =>
                          i.id === item.id ? { ...i, description: e.target.value } : i
                        )
                        handleRevenueChange({ additionalFees: updated })
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => {
                        const updated = budgetData.revenue.additionalFees.map(i =>
                          i.id === item.id ? { ...i, amount: parseFloat(e.target.value) || 0 } : i
                        )
                        handleRevenueChange({ additionalFees: updated })
                      }}
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = budgetData.revenue.additionalFees.filter(i => i.id !== item.id)
                        handleRevenueChange({ additionalFees: updated })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carry & Performance Fee Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Optional: Model expected annual carry distributions to the management company (scenario only, not guaranteed)
              </p>
              <div className="space-y-2">
                <Label htmlFor="carry-revenue">Expected Annual Carry ($)</Label>
                <Input
                  id="carry-revenue"
                  type="number"
                  value={budgetData.revenue.carryRevenue}
                  onChange={(e) => handleRevenueChange({ carryRevenue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <ExpensesEditor
            expenses={budgetData.expenses}
            onChange={(expenses) => setBudgetData(prev => ({ ...prev, expenses }))}
          />
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Compare different hiring and growth scenarios side by side
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(['base', 'lean', 'aggressive'] as const).map((scenarioType) => {
                    const scenario = results.scenarios[scenarioType]
                    const firstYear = scenario.revenue[0]
                    const firstYearExpenses = scenario.expenses[0]
                    const firstYearCash = scenario.cashFlow[0]
                    const lastYearCash = scenario.cashFlow[scenario.cashFlow.length - 1]
                    const margin = firstYear.totalRevenue > 0 ?
                      (firstYearCash.ebitda / firstYear.totalRevenue * 100) : 0

                    const titles = {
                      base: 'Base Case',
                      lean: 'Lean / Conservative',
                      aggressive: 'Aggressive Growth'
                    }

                    return (
                      <div key={scenarioType} className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-semibold text-lg">{titles[scenarioType]}</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue (Yr 1)</span>
                            <span className="font-medium">{formatCurrency(firstYear.totalRevenue, true)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expenses (Yr 1)</span>
                            <span className="font-medium">{formatCurrency(firstYearExpenses.totalExpenses, true)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">EBITDA (Yr 1)</span>
                            <span className={`font-medium ${firstYearCash.ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(firstYearCash.ebitda, true)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Margin</span>
                            <span className="font-medium">{margin.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-muted-foreground">Cash (End)</span>
                            <span className={`font-medium ${lastYearCash.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(lastYearCash.cashBalance, true)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Management company budgets involve complex accounting, tax, and legal considerations. This tool is for planning purposes only. Consult with your fund administrator, accountant, and legal counsel before finalizing budgets."
      />
    </div>
  )
}
