"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Clock,
  LucideIcon
} from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency } from './budget-calculator'

interface CalculationBreakdownProps {
  data: BudgetData
  results: BudgetResults
  metric: 'monthlyBurn' | 'annualRevenue' | 'runway' | 'breakeven'
}

interface CalculationStep {
  label: string
  formula?: string
  value: string
  explanation?: string
  isSubtotal?: boolean
  isTotal?: boolean
}

export function CalculationBreakdown({ data, results, metric }: CalculationBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSteps = (): { title: string; icon: LucideIcon; steps: CalculationStep[] } => {
    switch (metric) {
      case 'monthlyBurn':
        const teamCost = data.expenses.team.reduce((s, t) => s + t.monthlyCost, 0)
        const opsCost = data.expenses.operations.reduce((s, o) => s + o.monthlyCost, 0)
        const overheadCost = data.expenses.overhead.reduce((s, o) => s + o.monthlyCost, 0)

        return {
          title: 'Monthly Burn Rate',
          icon: TrendingUp,
          steps: [
            {
              label: 'Team Compensation',
              formula: data.expenses.team.map(t => formatCurrency(t.monthlyCost, true)).join(' + '),
              value: formatCurrency(teamCost),
              explanation: `${data.expenses.team.length} team member(s) total`
            },
            {
              label: 'Operations',
              formula: data.expenses.operations.map(o => formatCurrency(o.monthlyCost, true)).join(' + '),
              value: formatCurrency(opsCost),
              explanation: 'Fund admin, audit, legal, compliance, tax'
            },
            {
              label: 'Overhead',
              formula: data.expenses.overhead.map(o => formatCurrency(o.monthlyCost, true)).join(' + '),
              value: formatCurrency(overheadCost),
              explanation: 'Office, insurance, technology, travel'
            },
            {
              label: 'Total Monthly Burn',
              formula: `${formatCurrency(teamCost, true)} + ${formatCurrency(opsCost, true)} + ${formatCurrency(overheadCost, true)}`,
              value: formatCurrency(results.monthlyBurn),
              isTotal: true
            }
          ]
        }

      case 'annualRevenue':
        const fund = data.funds[0]
        const annualFee = fund ? fund.size * 1_000_000 * (fund.feeRate / 100) : 0

        return {
          title: 'Annual Fee Revenue',
          icon: DollarSign,
          steps: [
            {
              label: 'Fund Size',
              value: fund ? `$${fund.size}M` : '$0',
              explanation: 'Committed capital from LPs'
            },
            {
              label: 'Management Fee Rate',
              value: fund ? `${fund.feeRate}%` : '0%',
              explanation: 'Annual fee as percentage of commitments'
            },
            {
              label: 'Calculation',
              formula: fund ? `$${fund.size}M × ${fund.feeRate}%` : 'N/A',
              value: formatCurrency(annualFee),
              explanation: 'Fund Size × Fee Rate = Annual Management Fee'
            },
            {
              label: 'Annual Fee Revenue',
              value: formatCurrency(results.annualRevenue),
              isTotal: true,
              explanation: 'Total from all funds'
            }
          ]
        }

      case 'runway':
        return {
          title: 'Runway Calculation',
          icon: Clock,
          steps: [
            {
              label: 'Starting Cash',
              value: formatCurrency(data.startingCash),
              explanation: 'Available capital before fees'
            },
            {
              label: 'Monthly Burn Rate',
              value: formatCurrency(results.monthlyBurn),
              explanation: 'Total monthly expenses'
            },
            {
              label: 'Calculation',
              formula: `${formatCurrency(data.startingCash, true)} ÷ ${formatCurrency(results.monthlyBurn, true)}`,
              value: `${Math.floor(data.startingCash / results.monthlyBurn)} months`,
              explanation: 'Starting Cash ÷ Monthly Burn = Runway Months'
            },
            {
              label: 'Pre-Revenue Runway',
              value: results.runwayMonths !== null ? `${results.runwayMonths} months` : 'Indefinite',
              isTotal: true,
              explanation: 'Months until cash depleted (without fee revenue)'
            }
          ]
        }

      case 'breakeven':
        return {
          title: 'Break-Even Analysis',
          icon: Calculator,
          steps: [
            {
              label: 'Monthly Revenue (at full deployment)',
              value: formatCurrency(results.annualRevenue / 12),
              explanation: 'Annual fee revenue ÷ 12'
            },
            {
              label: 'Monthly Expenses',
              value: formatCurrency(results.monthlyBurn),
              explanation: 'Total monthly operating costs'
            },
            {
              label: 'Monthly Net Cash Flow',
              formula: `${formatCurrency(results.annualRevenue / 12, true)} - ${formatCurrency(results.monthlyBurn, true)}`,
              value: formatCurrency((results.annualRevenue / 12) - results.monthlyBurn),
              explanation: (results.annualRevenue / 12) >= results.monthlyBurn ? 'Positive: revenue exceeds costs' : 'Negative: costs exceed revenue'
            },
            {
              label: 'Break-Even Month',
              value: results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not projected',
              isTotal: true,
              explanation: 'When cumulative cash flows turn positive'
            }
          ]
        }

      default:
        return { title: '', icon: Calculator, steps: [] }
    }
  }

  const { title, icon: Icon, steps } = getSteps()

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">How is this calculated?</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3 bg-background">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-start justify-between gap-4 text-sm",
                step.isTotal && "pt-3 border-t font-medium",
                step.isSubtotal && "text-muted-foreground"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(step.isTotal && "font-semibold")}>{step.label}</span>
                </div>
                {step.formula && (
                  <code className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded mt-1 inline-block">
                    {step.formula}
                  </code>
                )}
                {step.explanation && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.explanation}</p>
                )}
              </div>
              <div className={cn(
                "text-right font-mono",
                step.isTotal && "font-bold text-primary"
              )}>
                {step.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact inline version for tooltips/popovers
interface InlineBreakdownProps {
  label: string
  value: string
  formula: string
  components: Array<{ name: string; value: string }>
}

export function InlineBreakdown({ label, value, formula, components }: InlineBreakdownProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between items-center font-medium">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="text-xs space-y-1">
        <div className="font-mono bg-muted/50 px-2 py-1 rounded text-muted-foreground">
          {formula}
        </div>
        {components.map((comp, i) => (
          <div key={i} className="flex justify-between text-muted-foreground">
            <span>{comp.name}</span>
            <span className="font-mono">{comp.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
