"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, DollarSign, TrendingUp, Clock, AlertCircle, Building2 } from 'lucide-react'
import { DisclaimerBlock } from '@/components/tools/shared'
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
  ReferenceLine
} from 'recharts'

export function ManagementCompanyBudget() {
  const [data, setData] = useState<BudgetData>(DEFAULT_BUDGET_DATA)

  // Calculate results whenever data changes
  const results = useMemo(() => calculateBudget(data), [data])

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
        <h1 className="text-3xl font-bold tracking-tight">Management Company Budget Planner</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Plan your management company budget and runway. See how long your cash will last and when fees will cover expenses.
        </p>
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
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="cashBalance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Cash Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Starting Cash */}
      <Card>
        <CardHeader>
          <CardTitle>Starting Cash</CardTitle>
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
          <CardTitle>Your Fund(s)</CardTitle>
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
                <div key={fund.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
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
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>First Close Year</Label>
                      <Input
                        type="number"
                        value={fund.firstCloseYear}
                        onChange={(e) => updateFund(fund.id, { firstCloseYear: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFund(fund.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="sm:col-span-4 text-sm text-muted-foreground">
                    Expected annual fee: {formatCurrency(fund.size * 1_000_000 * (fund.feeRate / 100))}
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
          <CardTitle>Team</CardTitle>
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
            <div className="space-y-3">
              {data.expenses.team.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Input
                    placeholder="Role (e.g., Managing Partner)"
                    value={member.role}
                    onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                    className="flex-1"
                  />
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
                  <span className="text-sm text-muted-foreground w-16">/month</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTeamMember(member.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operations Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Fund administration, audit, legal, compliance, and tax services.
          </p>

          <div className="space-y-3">
            {data.expenses.operations.map((item) => {
              const range = TYPICAL_RANGES.operations[item.name as keyof typeof TYPICAL_RANGES.operations]
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    {range && <span className="text-xs text-muted-foreground ml-2">{range.note}</span>}
                  </div>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={item.monthlyCost || ''}
                      onChange={(e) => updateOperation(item.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                      className="pl-7"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16">/month</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overhead Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Overhead</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Office, insurance, technology, and travel expenses.
          </p>

          <div className="space-y-3">
            {data.expenses.overhead.map((item) => {
              const range = TYPICAL_RANGES.overhead[item.name as keyof typeof TYPICAL_RANGES.overhead]
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    {range && <span className="text-xs text-muted-foreground ml-2">{range.note}</span>}
                  </div>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={item.monthlyCost || ''}
                      onChange={(e) => updateOverhead(item.id, { monthlyCost: parseFloat(e.target.value) || 0 })}
                      className="pl-7"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16">/month</span>
                </div>
              )
            })}
          </div>
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
