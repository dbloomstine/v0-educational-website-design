"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { AlertTriangle, CheckCircle, Flag, TrendingDown, Calendar } from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'

interface EnhancedChartsProps {
  data: BudgetData
  results: BudgetResults
}

export function RunwayGauge({ results }: EnhancedChartsProps) {
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

export function ExpenseBreakdownChart({ data }: EnhancedChartsProps) {
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
  const [timeRange, setTimeRange] = useState<'1y' | '2y' | '5y'>('2y')

  const chartData = useMemo(() => {
    const monthsToShow = timeRange === '1y' ? 12 : timeRange === '2y' ? 24 : 60
    return results.projections
      .slice(0, monthsToShow)
      .filter((_, i) => monthsToShow <= 24 || i < 24 || i % 3 === 0)
      .map((p, idx) => ({
        label: p.label,
        month: idx,
        cashBalance: p.cashBalance,
        revenue: p.revenue,
        expenses: p.expenses,
        netFlow: p.netCashFlow
      }))
  }, [results, timeRange])

  // Find key milestones
  const milestones = useMemo(() => {
    const points: Array<{
      month: number
      monthLabel: string
      label: string
      value: number
      type: 'warning' | 'danger' | 'success' | 'info'
      icon: typeof Flag
    }> = []

    // First close (estimate - month 0 is when fees start)
    if (data.funds[0]?.firstCloseYear) {
      points.push({
        month: 0,
        monthLabel: results.projections[0]?.label || 'Month 1',
        label: 'First Close',
        value: data.startingCash,
        type: 'success',
        icon: Flag
      })
    }

    // 50% runway point
    const halfwayIdx = results.projections.findIndex(p =>
      p.cashBalance <= data.startingCash / 2 && p.cashBalance > 0
    )
    if (halfwayIdx > 0 && halfwayIdx < 60) {
      points.push({
        month: halfwayIdx,
        monthLabel: results.projections[halfwayIdx].label,
        label: '50% Runway',
        value: results.projections[halfwayIdx].cashBalance,
        type: 'warning',
        icon: AlertTriangle
      })
    }

    // Break-even point
    if (results.breakEvenMonth && results.breakEvenMonth <= 60) {
      const breakEvenProj = results.projections[results.breakEvenMonth - 1]
      if (breakEvenProj) {
        points.push({
          month: results.breakEvenMonth - 1,
          monthLabel: breakEvenProj.label,
          label: 'Break-even',
          value: breakEvenProj.cashBalance,
          type: 'success',
          icon: CheckCircle
        })
      }
    }

    // Cash out point
    const cashOutIdx = results.projections.findIndex(p => p.cashBalance <= 0)
    if (cashOutIdx > 0 && cashOutIdx < 60) {
      points.push({
        month: cashOutIdx,
        monthLabel: results.projections[cashOutIdx].label,
        label: 'Cash Depleted',
        value: 0,
        type: 'danger',
        icon: TrendingDown
      })
    }

    return points
  }, [results, data.startingCash, data.funds])

  // Find first close and runway zones for reference areas
  const _zones = useMemo(() => {
    const result = {
      dangerZoneStart: -1,
      warningZoneStart: -1,
      safeZoneEnd: -1
    }

    // Find when cash drops to 25% (danger)
    const dangerIdx = results.projections.findIndex(p => p.cashBalance <= data.startingCash * 0.25)
    if (dangerIdx > 0) result.dangerZoneStart = dangerIdx

    // Find when cash drops to 50% (warning)
    const warningIdx = results.projections.findIndex(p => p.cashBalance <= data.startingCash * 0.5)
    if (warningIdx > 0) result.warningZoneStart = warningIdx

    return result
  }, [results, data.startingCash])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Cash Runway Timeline
        </CardTitle>
        <div className="flex items-center gap-1">
          {(['1y', '2y', '5y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="h-7 px-2 text-xs"
            >
              {range === '1y' ? '1 Year' : range === '2y' ? '2 Years' : '5 Years'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, true)}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const milestone = milestones.find(m => m.monthLabel === label)
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
                        <p className="font-semibold mb-2">{label}</p>
                        {milestone && (
                          <div className={cn(
                            "flex items-center gap-2 mb-2 text-xs px-2 py-1 rounded",
                            milestone.type === 'success' && "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
                            milestone.type === 'warning' && "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
                            milestone.type === 'danger' && "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                          )}>
                            <milestone.icon className="h-3 w-3" />
                            {milestone.label}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Balance:</span>
                            <span className="font-medium">{formatCurrency(data.cashBalance)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="text-emerald-600">{formatCurrency(data.revenue)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Expenses:</span>
                            <span className="text-red-600">{formatCurrency(data.expenses)}</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t">
                            <span className="text-muted-foreground">Net Flow:</span>
                            <span className={data.netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {data.netFlow >= 0 ? '+' : ''}{formatCurrency(data.netFlow)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => <span className="text-xs">{value}</span>}
              />

              {/* Danger zone reference area */}
              <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} />
              <ReferenceLine
                y={data.startingCash * 0.5}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={data.startingCash * 0.25}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />

              <Line
                type="monotone"
                dataKey="cashBalance"
                stroke="#6366f1"
                strokeWidth={3}
                dot={false}
                name="Cash Balance"
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="Monthly Revenue"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="Monthly Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Milestone timeline */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs font-medium text-muted-foreground mb-3">Key Milestones</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {milestones.map((m, i) => {
              const Icon = m.icon
              return (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    m.type === 'success' && "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
                    m.type === 'warning' && "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
                    m.type === 'danger' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                    m.type === 'info' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn(
                      "h-4 w-4",
                      m.type === 'success' && "text-emerald-600 dark:text-emerald-400",
                      m.type === 'warning' && "text-amber-600 dark:text-amber-400",
                      m.type === 'danger' && "text-red-600 dark:text-red-400",
                      m.type === 'info' && "text-blue-600 dark:text-blue-400"
                    )} />
                    <span className="font-medium">{m.label}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {m.monthLabel} • {formatCurrency(m.value, true)}
                  </div>
                </div>
              )
            })}
            {milestones.length === 0 && (
              <div className="col-span-4 text-center text-muted-foreground text-sm py-2">
                No milestones in projection period
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
