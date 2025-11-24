"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalculationResults } from './types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface BudgetChartsProps {
  results: CalculationResults
  formatCurrency: (value: number, short?: boolean) => string
}

export function BudgetCharts({ results, formatCurrency }: BudgetChartsProps) {
  // Revenue vs Expenses Chart Data
  const revenueExpenseData = results.revenue.map((r, i) => ({
    year: `Year ${r.year}`,
    revenue: r.totalRevenue,
    expenses: results.expenses[i].totalExpenses
  }))

  // Cash Balance Chart Data
  const cashBalanceData = results.cashFlow.map(c => ({
    year: `Year ${c.year}`,
    cash: c.cashBalance
  }))

  // Expense Breakdown Chart Data
  const firstYearExpenses = results.expenses[0]
  const expenseBreakdownData = [
    { name: 'People', value: firstYearExpenses.peopleCost, color: '#3b82f6' },
    { name: 'Services', value: firstYearExpenses.servicesCost, color: '#a855f7' },
    { name: 'Technology', value: firstYearExpenses.technologyCost, color: '#22c55e' },
    { name: 'Office', value: firstYearExpenses.officeCost, color: '#fb923c' },
    { name: 'Marketing', value: firstYearExpenses.marketingCost, color: '#ec4899' },
    { name: 'Insurance', value: firstYearExpenses.insuranceCost, color: '#0ea5e9' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Total Revenue"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Total Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Balance & Runway</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashBalanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cash"
                  name="Cash Balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown (Year 1)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ background: 'white', border: '1px solid #ccc', borderRadius: '6px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
