'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBudgetStore } from '../store'
import { formatCurrency, formatRunway } from '../budget-calculator'
import { TrendingUp, TrendingDown, DollarSign, Clock, Target, PiggyBank } from 'lucide-react'

// Simple donut chart for expense breakdown
function ExpenseDonut({ teamPct, opsPct, overheadPct }: { teamPct: number; opsPct: number; overheadPct: number }) {
  const radius = 60
  const strokeWidth = 20
  const circumference = 2 * Math.PI * radius

  const teamOffset = 0
  const opsOffset = teamPct * circumference / 100
  const overheadOffset = (teamPct + opsPct) * circumference / 100

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Team - Blue */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="hsl(217 91% 60%)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${teamPct * circumference / 100} ${circumference}`}
        strokeDashoffset={-teamOffset}
        transform="rotate(-90 80 80)"
        className="transition-all duration-500"
      />
      {/* Operations - Emerald */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="hsl(160 84% 39%)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${opsPct * circumference / 100} ${circumference}`}
        strokeDashoffset={-opsOffset}
        transform="rotate(-90 80 80)"
        className="transition-all duration-500"
      />
      {/* Overhead - Amber */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="hsl(38 92% 50%)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${overheadPct * circumference / 100} ${circumference}`}
        strokeDashoffset={-overheadOffset}
        transform="rotate(-90 80 80)"
        className="transition-all duration-500"
      />
    </svg>
  )
}

// Runway gauge component
function RunwayGauge({ months }: { months: number | null }) {
  const displayMonths = months ?? 60
  const maxMonths = 60
  const percentage = Math.min((displayMonths / maxMonths) * 100, 100)

  const getColor = () => {
    if (displayMonths >= 24) return 'text-emerald-500'
    if (displayMonths >= 18) return 'text-lime-500'
    if (displayMonths >= 12) return 'text-amber-500'
    return 'text-red-500'
  }

  const getStatus = () => {
    if (displayMonths >= 24) return 'Strong'
    if (displayMonths >= 18) return 'Good'
    if (displayMonths >= 12) return 'Monitor'
    return 'Critical'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.51} 251`}
            className={`${getColor()} transition-all duration-700`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getColor()}`}>
            {months === null ? '60+' : months}
          </span>
          <span className="text-xs text-muted-foreground">months</span>
        </div>
      </div>
      <span className={`mt-2 text-sm font-medium ${getColor()}`}>{getStatus()}</span>
    </div>
  )
}

export function OverviewTab() {
  const data = useBudgetStore(state => state.data)
  const results = useBudgetStore(state => state.results)

  const expenseBreakdown = useMemo(() => {
    if (!results) return { teamPct: 33, opsPct: 33, overheadPct: 34 }
    const total = results.teamCost + results.opsCost + results.overheadCost
    if (total === 0) return { teamPct: 33, opsPct: 33, overheadPct: 34 }
    return {
      teamPct: (results.teamCost / total) * 100,
      opsPct: (results.opsCost / total) * 100,
      overheadPct: (results.overheadCost / total) * 100
    }
  }, [results])

  if (!results) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Monthly Burn */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Monthly Burn
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(results.monthlyBurn)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(results.annualBudget)}/year
            </p>
          </CardContent>
        </Card>

        {/* Annual Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Annual Revenue
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(results.annualRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              At full fund deployment
            </p>
          </CardContent>
        </Card>

        {/* Starting Cash */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Starting Cash
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(data.startingCash)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Seed capital available
            </p>
          </CardContent>
        </Card>

        {/* Runway */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Cash Runway
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatRunway(results.runwayMonths)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Until cash depleted
            </p>
          </CardContent>
        </Card>

        {/* Break-Even */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Break-Even
            </CardDescription>
            <CardTitle className="text-2xl">
              {results.breakEvenMonth
                ? `Month ${results.breakEvenMonth}`
                : 'Not in projection'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              When revenue covers expenses
            </p>
          </CardContent>
        </Card>

        {/* Seed Capital Needed */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Minimum Seed Capital
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(results.seedCapitalNeeded)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              To reach break-even
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Runway Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Runway Health</CardTitle>
            <CardDescription>
              Months of runway remaining
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <RunwayGauge months={results.runwayMonths} />
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
            <CardDescription>
              Monthly costs by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ExpenseDonut
                teamPct={expenseBreakdown.teamPct}
                opsPct={expenseBreakdown.opsPct}
                overheadPct={expenseBreakdown.overheadPct}
              />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">
                    Team: {formatCurrency(results.teamCost)} ({expenseBreakdown.teamPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">
                    Operations: {formatCurrency(results.opsCost)} ({expenseBreakdown.opsPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">
                    Overhead: {formatCurrency(results.overheadCost)} ({expenseBreakdown.overheadPct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Projection Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">12-Month Cash Projection</CardTitle>
          <CardDescription>
            Monthly cash balance forecast
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Month</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">Expenses</th>
                  <th className="text-right py-2 font-medium">Net Flow</th>
                  <th className="text-right py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {results.projections.slice(0, 12).map((proj, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2">{proj.label}</td>
                    <td className="text-right py-2 text-emerald-600">
                      {formatCurrency(proj.revenue, true)}
                    </td>
                    <td className="text-right py-2 text-red-500">
                      {formatCurrency(proj.expenses, true)}
                    </td>
                    <td className={`text-right py-2 ${proj.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {formatCurrency(proj.netCashFlow, true)}
                    </td>
                    <td className="text-right py-2 font-medium">
                      {formatCurrency(proj.cashBalance, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
