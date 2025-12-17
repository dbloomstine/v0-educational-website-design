"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList
} from 'recharts'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'

interface WaterfallChartProps {
  data: BudgetData
  results: BudgetResults
}

interface WaterfallItem {
  name: string
  value: number
  cumulative: number
  isTotal?: boolean
  isPositive?: boolean
}

export function WaterfallChart({ data, results }: WaterfallChartProps) {
  const chartData = useMemo(() => {
    const items: WaterfallItem[] = []
    let cumulative = 0

    // Starting Cash
    cumulative = data.startingCash
    items.push({
      name: 'Starting Cash',
      value: data.startingCash,
      cumulative,
      isPositive: true
    })

    // Annual Revenue (Year 1)
    const year1Revenue = results.projections.slice(0, 12).reduce((sum, p) => sum + p.revenue, 0)
    cumulative += year1Revenue
    items.push({
      name: 'Year 1 Revenue',
      value: year1Revenue,
      cumulative,
      isPositive: true
    })

    // Team Costs
    const teamAnnual = results.teamCost * 12
    cumulative -= teamAnnual
    items.push({
      name: 'Team Costs',
      value: -teamAnnual,
      cumulative,
      isPositive: false
    })

    // Operations
    const opsAnnual = results.opsCost * 12
    cumulative -= opsAnnual
    items.push({
      name: 'Operations',
      value: -opsAnnual,
      cumulative,
      isPositive: false
    })

    // Overhead
    const overheadAnnual = results.overheadCost * 12
    cumulative -= overheadAnnual
    items.push({
      name: 'Overhead',
      value: -overheadAnnual,
      cumulative,
      isPositive: false
    })

    // Year-End Balance
    items.push({
      name: 'Year 1 Ending',
      value: cumulative,
      cumulative,
      isTotal: true
    })

    return items
  }, [data, results])

  // Custom shape for waterfall bars
  const WaterfallBar = (props: any) => {
    const { x, y, width, height, payload } = props

    if (payload.isTotal) {
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.abs(height)}
          fill={payload.cumulative >= 0 ? '#10b981' : '#ef4444'}
          rx={2}
        />
      )
    }

    // For incremental bars, we need to position them correctly
    const prevCumulative = payload.isPositive
      ? payload.cumulative - payload.value
      : payload.cumulative + Math.abs(payload.value)

    const barHeight = Math.abs(height)
    const barY = payload.isPositive
      ? y
      : y - barHeight

    return (
      <rect
        x={x}
        y={barY}
        width={width}
        height={barHeight}
        fill={payload.isPositive ? '#10b981' : '#ef4444'}
        rx={2}
      />
    )
  }

  // Transform data for the chart
  const transformedData = useMemo(() => {
    return chartData.map((item, index) => {
      const prevCumulative = index > 0 ? chartData[index - 1].cumulative : 0

      return {
        ...item,
        // For rendering, we use cumulative for totals, and the delta for others
        displayValue: item.isTotal ? item.cumulative : item.value,
        // Track the bottom of the bar for non-total items
        bottom: item.isTotal ? 0 : (item.isPositive ? prevCumulative : item.cumulative),
        // The actual bar height
        barValue: item.isTotal ? item.cumulative : Math.abs(item.value)
      }
    })
  }, [chartData])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Year 1 Cash Flow Waterfall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, true)}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => label}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

              {/* Floating bars for waterfall effect */}
              <Bar
                dataKey="barValue"
                stackId="stack"
              >
                {transformedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isTotal
                      ? (entry.cumulative >= 0 ? '#10b981' : '#ef4444')
                      : (entry.isPositive ? '#10b981' : '#ef4444')
                    }
                  />
                ))}
                <LabelList
                  dataKey="displayValue"
                  position="top"
                  formatter={(v: number) => formatCurrency(v, true)}
                  style={{ fontSize: 10, fill: '#6b7280' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            Income / Positive
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            Expenses / Negative
          </span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Total Inflows</div>
            <div className="font-bold text-emerald-600">
              {formatCurrency(data.startingCash + (results.projections.slice(0, 12).reduce((sum, p) => sum + p.revenue, 0)))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Total Outflows</div>
            <div className="font-bold text-red-600">
              {formatCurrency(results.annualBudget)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Net Change</div>
            <div className={`font-bold ${results.projections[11]?.cashBalance >= data.startingCash ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency((results.projections[11]?.cashBalance || 0) - data.startingCash)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
