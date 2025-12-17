"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'

interface EnhancedChartsProps {
  data: BudgetData
  results: BudgetResults
}

export function RunwayGauge({ data, results }: EnhancedChartsProps) {
  const runwayMonths = results.runwayMonths ?? 60
  const maxMonths = 60

  // Calculate gauge percentage (capped at 100%)
  const percentage = Math.min((runwayMonths / maxMonths) * 100, 100)

  // Determine color based on runway
  const getColor = () => {
    if (runwayMonths >= 24) return { primary: '#22c55e', bg: 'bg-emerald-100 dark:bg-emerald-950/30' }
    if (runwayMonths >= 18) return { primary: '#84cc16', bg: 'bg-lime-100 dark:bg-lime-950/30' }
    if (runwayMonths >= 12) return { primary: '#eab308', bg: 'bg-amber-100 dark:bg-amber-950/30' }
    return { primary: '#ef4444', bg: 'bg-red-100 dark:bg-red-950/30' }
  }

  const color = getColor()

  // Milestones
  const milestones = [
    { months: 12, label: '12mo', position: (12 / maxMonths) * 100 },
    { months: 18, label: '18mo', position: (18 / maxMonths) * 100 },
    { months: 24, label: '24mo', position: (24 / maxMonths) * 100 },
    { months: 36, label: '36mo', position: (36 / maxMonths) * 100 },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Runway Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main gauge */}
          <div className="relative">
            {/* Background track */}
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              {/* Filled portion */}
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color.primary
                }}
              />
            </div>

            {/* Milestone markers */}
            <div className="relative h-6 mt-1">
              {milestones.map((milestone) => (
                <div
                  key={milestone.months}
                  className="absolute flex flex-col items-center transform -translate-x-1/2"
                  style={{ left: `${milestone.position}%` }}
                >
                  <div className="w-px h-2 bg-border" />
                  <span className="text-[10px] text-muted-foreground">{milestone.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold" style={{ color: color.primary }}>
                {runwayMonths >= 60 ? '60+' : runwayMonths} months
              </div>
              <div className="text-sm text-muted-foreground">
                {runwayMonths >= 24 ? 'Strong runway' :
                 runwayMonths >= 18 ? 'Good runway' :
                 runwayMonths >= 12 ? 'Monitor closely' :
                 'Critical - needs attention'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Monthly burn</div>
              <div className="font-semibold">{formatCurrency(results.monthlyBurn, true)}</div>
            </div>
          </div>

          {/* Key dates */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground">50% runway at</div>
              <div className="font-medium text-sm">
                {runwayMonths ? `Month ${Math.floor(runwayMonths / 2)}` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Break-even at</div>
              <div className="font-medium text-sm">
                {results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not projected'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpenseBreakdownChart({ data, results }: EnhancedChartsProps) {
  const chartData = useMemo(() => {
    const teamCost = data.expenses.team.reduce((s, t) => s + t.monthlyCost, 0)
    const opsCost = data.expenses.operations.reduce((s, o) => s + o.monthlyCost, 0)
    const overheadCost = data.expenses.overhead.reduce((s, o) => s + o.monthlyCost, 0)
    const total = teamCost + opsCost + overheadCost

    return [
      { name: 'Team', value: teamCost, percent: total > 0 ? (teamCost / total) * 100 : 0, fill: '#6366f1' },
      { name: 'Operations', value: opsCost, percent: total > 0 ? (opsCost / total) * 100 : 0, fill: '#f59e0b' },
      { name: 'Overhead', value: overheadCost, percent: total > 0 ? (overheadCost / total) * 100 : 0, fill: '#22c55e' },
    ]
  }, [data])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{formatCurrency(item.value, true)}</span>
                  <span className="text-muted-foreground ml-1">({item.percent.toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StackedCashFlowChart({ data, results }: EnhancedChartsProps) {
  const chartData = useMemo(() => {
    const teamCost = data.expenses.team.reduce((s, t) => s + t.monthlyCost, 0)
    const opsCost = data.expenses.operations.reduce((s, o) => s + o.monthlyCost, 0)
    const overheadCost = data.expenses.overhead.reduce((s, o) => s + o.monthlyCost, 0)

    return results.projections
      .filter((_, i) => i < 24 || i % 3 === 0)
      .slice(0, 30) // Limit to 30 data points for readability
      .map(p => ({
        label: p.label,
        revenue: p.revenue,
        team: -teamCost,
        operations: -opsCost,
        overhead: -overheadCost,
        cashBalance: p.cashBalance,
        netFlow: p.netCashFlow
      }))
  }, [data, results])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cash Flow by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, true)}
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(Math.abs(value)),
                  name === 'team' ? 'Team' :
                  name === 'operations' ? 'Operations' :
                  name === 'overhead' ? 'Overhead' :
                  name === 'revenue' ? 'Revenue' : name
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  value === 'team' ? 'Team' :
                  value === 'operations' ? 'Operations' :
                  value === 'overhead' ? 'Overhead' :
                  value === 'revenue' ? 'Revenue' : value
                )}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="team"
                stackId="2"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="operations"
                stackId="2"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="overhead"
                stackId="2"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Above line = Revenue</span>
          <span>|</span>
          <span>Below line = Expenses by category</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function EnhancedCashRunwayChart({ data, results }: EnhancedChartsProps) {
  const chartData = useMemo(() => {
    return results.projections
      .filter((_, i) => i < 24 || i % 3 === 0)
      .map(p => ({
        label: p.label,
        cashBalance: p.cashBalance,
        revenue: p.revenue,
        expenses: p.expenses,
        netFlow: p.netCashFlow
      }))
  }, [results])

  // Find key milestones
  const milestones = useMemo(() => {
    const points: Array<{ month: string; label: string; value: number }> = []

    // 50% runway point
    const halfwayIdx = results.projections.findIndex(p =>
      p.cashBalance <= data.startingCash / 2
    )
    if (halfwayIdx > 0) {
      points.push({
        month: results.projections[halfwayIdx].label,
        label: '50% runway',
        value: results.projections[halfwayIdx].cashBalance
      })
    }

    // Break-even point
    if (results.breakEvenMonth) {
      const breakEvenProj = results.projections[results.breakEvenMonth - 1]
      if (breakEvenProj) {
        points.push({
          month: breakEvenProj.label,
          label: 'Break-even',
          value: breakEvenProj.cashBalance
        })
      }
    }

    return points
  }, [results, data.startingCash])

  return (
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

              {/* Reference lines */}
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
              <ReferenceLine
                y={data.startingCash / 2}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{ value: '50%', position: 'right', fontSize: 10 }}
              />

              <Line
                type="monotone"
                dataKey="cashBalance"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
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

        {/* Milestone indicators */}
        {milestones.length > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t">
            {milestones.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="text-muted-foreground">{m.label}:</span>{' '}
                <span className="font-medium">{m.month}</span>
                <span className="text-muted-foreground ml-1">({formatCurrency(m.value, true)})</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
