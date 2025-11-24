import { Card, CardContent } from '@/components/ui/card'
import { CalculationResults, BudgetData } from './types'
import { calculateRunwayMonths } from './budget-calculator'
import { DollarSign, TrendingUp, TrendingDown, Clock, Target } from 'lucide-react'

interface MetricsSummaryProps {
  results: CalculationResults
  budgetData: BudgetData
  formatCurrency: (value: number, short?: boolean) => string
}

export function MetricsSummary({ results, budgetData, formatCurrency }: MetricsSummaryProps) {
  const firstYear = results.revenue[0]
  const firstYearExpenses = results.expenses[0]
  const firstYearCash = results.cashFlow[0]

  const margin = firstYear.totalRevenue > 0 ? (firstYearCash.ebitda / firstYear.totalRevenue * 100) : 0
  const coverage = firstYear.mgmtFees > 0 ? (firstYear.mgmtFees / firstYearExpenses.totalExpenses) : 0
  const runway = calculateRunwayMonths(
    budgetData.capitalStructure.startingCash,
    firstYear.totalRevenue,
    firstYearExpenses.totalExpenses
  )

  const runwayDisplay = runway >= 120 ? '10+ years' :
    runway >= 12 ? `${Math.floor(runway / 12)} years` : `${runway} months`

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Revenue (Year 1)</p>
              <p className="text-2xl font-bold">{formatCurrency(firstYear.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Management fees + other income</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500 opacity-75" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Expenses (Year 1)</p>
              <p className="text-2xl font-bold">{formatCurrency(firstYearExpenses.totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">All operating costs</p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500 opacity-75" />
          </div>
        </CardContent>
      </Card>

      <Card className={`border-l-4 ${firstYearCash.ebitda >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">EBITDA (Year 1)</p>
              <p className={`text-2xl font-bold ${firstYearCash.ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(firstYearCash.ebitda)}
              </p>
              <p className="text-xs text-muted-foreground">{margin.toFixed(1)}% margin</p>
            </div>
            <TrendingUp className={`h-8 w-8 ${firstYearCash.ebitda >= 0 ? 'text-green-500' : 'text-red-500'} opacity-75`} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cash Runway</p>
              <p className="text-2xl font-bold">{runwayDisplay}</p>
              <p className="text-xs text-muted-foreground">{coverage.toFixed(2)}x fee coverage</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500 opacity-75" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
