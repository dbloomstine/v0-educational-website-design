"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot
} from 'recharts'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'
import { Flag, TrendingUp, AlertTriangle } from 'lucide-react'

interface StackedExpenseChartProps {
  data: BudgetData
  results: BudgetResults
}

interface Milestone {
  month: number
  label: string
  type: 'positive' | 'warning' | 'neutral'
  icon: 'flag' | 'trending' | 'alert'
}

export function StackedExpenseChart({ data, results }: StackedExpenseChartProps) {
  // Transform projections for stacked area
  const chartData = useMemo(() => {
    const teamPercent = results.monthlyBurn > 0 ? results.teamCost / results.monthlyBurn : 0
    const opsPercent = results.monthlyBurn > 0 ? results.opsCost / results.monthlyBurn : 0
    const overheadPercent = results.monthlyBurn > 0 ? results.overheadCost / results.monthlyBurn : 0

    return results.projections.map((proj, idx) => ({
      label: proj.label,
      month: idx + 1,
      team: proj.expenses * teamPercent,
      operations: proj.expenses * opsPercent,
      overhead: proj.expenses * overheadPercent,
      totalExpenses: proj.expenses,
      revenue: proj.revenue,
      cashBalance: proj.cashBalance
    }))
  }, [results])

  // Calculate milestones
  const milestones = useMemo(() => {
    const ms: Milestone[] = []

    // First close (month 1 typically)
    const firstCloseMonth = data.funds[0]?.firstCloseYear
      ? 1 // Assume first close in projection month 1
      : null
    if (firstCloseMonth) {
      ms.push({
        month: firstCloseMonth,
        label: 'First Close',
        type: 'positive',
        icon: 'flag'
      })
    }

    // Final close (typically 12 months after first)
    const finalCloseMonth = data.funds[0]?.finalCloseMonth ?? 12
    ms.push({
      month: finalCloseMonth,
      label: 'Final Close',
      type: 'positive',
      icon: 'flag'
    })

    // Break-even
    if (results.breakEvenMonth) {
      ms.push({
        month: results.breakEvenMonth,
        label: 'Break-Even',
        type: 'positive',
        icon: 'trending'
      })
    }

    // Low cash warning (25% of starting)
    const lowCashThreshold = data.startingCash * 0.25
    const lowCashMonth = results.projections.findIndex(p => p.cashBalance < lowCashThreshold && p.cashBalance > 0)
    if (lowCashMonth > 0) {
      ms.push({
        month: lowCashMonth + 1,
        label: 'Low Cash Warning',
        type: 'warning',
        icon: 'alert'
      })
    }

    // Cash out
    if (results.runwayMonths !== null && results.runwayMonths < results.projections.length) {
      ms.push({
        month: results.runwayMonths,
        label: 'Cash Depleted',
        type: 'warning',
        icon: 'alert'
      })
    }

    return ms.sort((a, b) => a.month - b.month)
  }, [data, results])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    const milestone = milestones.find(m => chartData[m.month - 1]?.label === label)

    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
        <div className="font-medium mb-2">{label}</div>
        {milestone && (
          <div className={`mb-2 text-xs px-2 py-1 rounded ${
            milestone.type === 'positive' ? 'bg-emerald-100 text-emerald-800' :
            milestone.type === 'warning' ? 'bg-amber-100 text-amber-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {milestone.label}
          </div>
        )}
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-mono">{formatCurrency(entry.value, true)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense Breakdown Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="opsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="overheadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, true)}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Milestone reference lines */}
              {milestones.map((milestone, idx) => (
                <ReferenceLine
                  key={idx}
                  x={chartData[milestone.month - 1]?.label}
                  stroke={
                    milestone.type === 'positive' ? '#10b981' :
                    milestone.type === 'warning' ? '#f59e0b' : '#94a3b8'
                  }
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  label={{
                    value: milestone.label,
                    position: 'top',
                    fontSize: 9,
                    fill: milestone.type === 'positive' ? '#10b981' :
                          milestone.type === 'warning' ? '#f59e0b' : '#94a3b8'
                  }}
                />
              ))}

              <Area
                type="monotone"
                dataKey="overhead"
                stackId="1"
                stroke="#14b8a6"
                fill="url(#overheadGradient)"
                name="Overhead"
              />
              <Area
                type="monotone"
                dataKey="operations"
                stackId="1"
                stroke="#f59e0b"
                fill="url(#opsGradient)"
                name="Operations"
              />
              <Area
                type="monotone"
                dataKey="team"
                stackId="1"
                stroke="#6366f1"
                fill="url(#teamGradient)"
                name="Team"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Milestones */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-indigo-500" />
              Team
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500" />
              Operations
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-teal-500" />
              Overhead
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {milestones.slice(0, 3).map((ms, idx) => (
              <span
                key={idx}
                className={`flex items-center gap-1 ${
                  ms.type === 'positive' ? 'text-emerald-600' :
                  ms.type === 'warning' ? 'text-amber-600' : 'text-muted-foreground'
                }`}
              >
                {ms.icon === 'flag' && <Flag className="h-3 w-3" />}
                {ms.icon === 'trending' && <TrendingUp className="h-3 w-3" />}
                {ms.icon === 'alert' && <AlertTriangle className="h-3 w-3" />}
                {ms.label}
              </span>
            ))}
          </div>
        </div>

        {/* Inflation note if enabled */}
        {data.settings?.inflationRate && data.settings.inflationRate > 0 && (
          <div className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
            Note: Expenses grow at {data.settings.inflationRate}% annually (inflation adjustment enabled)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
