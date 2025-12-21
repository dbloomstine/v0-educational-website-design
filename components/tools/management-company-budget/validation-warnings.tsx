"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock
} from 'lucide-react'
import { BudgetData, BudgetResults, TYPICAL_RANGES } from './types'
import { formatCurrency } from './budget-calculator'

interface ValidationWarningsProps {
  data: BudgetData
  results: BudgetResults
}

interface ValidationItem {
  id: string
  severity: 'error' | 'warning' | 'info' | 'success'
  category: string
  title: string
  message: string
  suggestion?: string
  icon: typeof AlertTriangle
}

export function ValidationWarnings({ data, results }: ValidationWarningsProps) {
  const validations = useMemo((): ValidationItem[] => {
    const items: ValidationItem[] = []

    // === FUND VALIDATIONS ===
    const fund = data.funds[0]
    if (fund) {
      // Fee rate validation
      if (fund.feeRate < 1.0) {
        items.push({
          id: 'fee-rate-low',
          severity: 'warning',
          category: 'Fund',
          title: 'Below-market fee rate',
          message: `A ${fund.feeRate}% management fee is below market norms (typically 1.5-2.5%).`,
          suggestion: 'Ensure this aligns with your LP negotiations. Lower fees may require larger fund size.',
          icon: DollarSign
        })
      } else if (fund.feeRate > 2.5) {
        items.push({
          id: 'fee-rate-high',
          severity: 'info',
          category: 'Fund',
          title: 'Above-market fee rate',
          message: `A ${fund.feeRate}% management fee is above typical market rates.`,
          suggestion: 'This may be appropriate for specialized strategies or smaller funds.',
          icon: DollarSign
        })
      }

      // Fund size vs team validation
      const teamCount = data.expenses.team.length
      const minTeamForSize = fund.size > 200 ? 4 : fund.size > 100 ? 3 : 1
      if (teamCount < minTeamForSize) {
        items.push({
          id: 'team-size',
          severity: 'info',
          category: 'Team',
          title: 'Lean team for fund size',
          message: `${teamCount} team member(s) for a $${fund.size}M fund is below typical staffing levels.`,
          suggestion: 'Consider if you have sufficient resources for deal sourcing, due diligence, and portfolio management.',
          icon: Users
        })
      }
    }

    // === RUNWAY VALIDATIONS ===
    if (results.runwayMonths !== null && results.runwayMonths < 12) {
      items.push({
        id: 'runway-critical',
        severity: 'error',
        category: 'Runway',
        title: 'Critical runway',
        message: `Only ${results.runwayMonths} months of runway before management fees.`,
        suggestion: 'Consider increasing starting capital or reducing expenses. Most managers target 18-24 months.',
        icon: Clock
      })
    } else if (results.runwayMonths !== null && results.runwayMonths < 18) {
      items.push({
        id: 'runway-warning',
        severity: 'warning',
        category: 'Runway',
        title: 'Limited runway',
        message: `${results.runwayMonths} months of runway may be tight if fundraising extends.`,
        suggestion: 'Fundraising often takes longer than expected. Consider a cushion.',
        icon: Clock
      })
    } else if (results.runwayMonths !== null && results.runwayMonths >= 24) {
      items.push({
        id: 'runway-good',
        severity: 'success',
        category: 'Runway',
        title: 'Strong runway position',
        message: `${results.runwayMonths}+ months of runway provides good cushion for fundraising delays.`,
        icon: CheckCircle2
      })
    }

    // === EXPENSE VALIDATIONS ===
    const teamCost = data.expenses.team.reduce((s, t) => s + t.monthlyCost, 0)
    const totalCost = results.monthlyBurn

    // Team cost as percentage of total
    const teamPercent = (teamCost / totalCost) * 100
    if (teamPercent < 50) {
      items.push({
        id: 'team-cost-low',
        severity: 'info',
        category: 'Expenses',
        title: 'Low team cost ratio',
        message: `Team costs are ${teamPercent.toFixed(0)}% of total expenses (industry norm: 60-70%).`,
        suggestion: 'This may indicate outsourced functions or lean operations. Ensure key roles are covered.',
        icon: Users
      })
    } else if (teamPercent > 80) {
      items.push({
        id: 'team-cost-high',
        severity: 'warning',
        category: 'Expenses',
        title: 'High team cost ratio',
        message: `Team costs are ${teamPercent.toFixed(0)}% of total expenses.`,
        suggestion: 'Consider if operations/overhead budgets are sufficient for fund admin, legal, and compliance.',
        icon: Users
      })
    }

    // Check for missing essential expenses
    const hasAudit = data.expenses.operations.some(o => o.name.toLowerCase().includes('audit'))
    const hasLegal = data.expenses.operations.some(o => o.name.toLowerCase().includes('legal'))
    const hasAdmin = data.expenses.operations.some(o => o.name.toLowerCase().includes('admin'))

    if (!hasAudit || !hasLegal || !hasAdmin) {
      const missing = []
      if (!hasAudit) missing.push('audit')
      if (!hasLegal) missing.push('legal')
      if (!hasAdmin) missing.push('fund administration')

      items.push({
        id: 'missing-essentials',
        severity: 'warning',
        category: 'Expenses',
        title: 'Missing essential expenses',
        message: `Budget may be missing: ${missing.join(', ')}.`,
        suggestion: 'These are typically required for institutional-quality fund operations.',
        icon: AlertCircle
      })
    }

    // === REVENUE VS EXPENSES ===
    if (results.annualRevenue < results.annualBudget * 0.8) {
      items.push({
        id: 'revenue-gap',
        severity: 'warning',
        category: 'Cash Flow',
        title: 'Revenue gap',
        message: `Annual expenses (${formatCurrency(results.annualBudget, true)}) exceed fee revenue (${formatCurrency(results.annualRevenue, true)}) by ${formatCurrency(results.annualBudget - results.annualRevenue, true)}.`,
        suggestion: 'The management company will need to grow AUM or reduce costs to reach profitability.',
        icon: TrendingDown
      })
    } else if (results.annualRevenue >= results.annualBudget) {
      items.push({
        id: 'revenue-positive',
        severity: 'success',
        category: 'Cash Flow',
        title: 'Positive cash flow',
        message: `Fee revenue covers operating expenses with ${formatCurrency(results.annualRevenue - results.annualBudget, true)} surplus.`,
        icon: TrendingUp
      })
    }

    // === STARTING CAPITAL ===
    if (data.startingCash < 200000) {
      items.push({
        id: 'capital-low',
        severity: 'warning',
        category: 'Capital',
        title: 'Low starting capital',
        message: `${formatCurrency(data.startingCash)} may be insufficient for fund launch costs.`,
        suggestion: 'Formation legal fees alone often run $150K-$300K. Consider additional seed capital sources.',
        icon: DollarSign
      })
    }

    return items
  }, [data, results])

  const errorCount = validations.filter(v => v.severity === 'error').length
  const warningCount = validations.filter(v => v.severity === 'warning').length
  const successCount = validations.filter(v => v.severity === 'success').length

  if (validations.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Budget Health Check
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {errorCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {warningCount} warnings
              </span>
            )}
            {successCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {successCount} good
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {validations.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-lg border",
                item.severity === 'error' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                item.severity === 'warning' && "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
                item.severity === 'info' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                item.severity === 'success' && "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn(
                  "h-5 w-5 mt-0.5 flex-shrink-0",
                  item.severity === 'error' && "text-red-600 dark:text-red-400",
                  item.severity === 'warning' && "text-amber-600 dark:text-amber-400",
                  item.severity === 'info' && "text-blue-600 dark:text-blue-400",
                  item.severity === 'success' && "text-emerald-600 dark:text-emerald-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{item.title}</span>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-background rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  {item.suggestion && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      💡 {item.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
