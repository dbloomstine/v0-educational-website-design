"use client"

import { FeeCalculationResult } from './types'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Percent, TrendingUp, Calculator } from 'lucide-react'

interface SummaryCardsProps {
  result: FeeCalculationResult
  fundSize: number
}

export function SummaryCards({ result, fundSize }: SummaryCardsProps) {
  const metrics = [
    {
      icon: DollarSign,
      label: 'Total Management Fees',
      value: `$${result.totalFees.toFixed(2)}M`,
      subtext: `Over the life of the fund`,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Percent,
      label: 'As % of Commitments',
      value: `${result.feesAsPercentOfCommitments.toFixed(1)}%`,
      subtext: `Total fees / fund size`,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: Calculator,
      label: 'Average Annual Fee',
      value: `${result.averageAnnualFeePercent.toFixed(2)}%`,
      subtext: `Per year of commitments`,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: TrendingUp,
      label: 'First vs Second Half',
      value: `$${result.firstHalfFees.toFixed(1)}M vs $${result.secondHalfFees.toFixed(1)}M`,
      subtext: `Fee distribution over time`,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-accent ${metric.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {metric.label}
                  </p>
                  <p className="text-lg font-bold truncate mb-0.5">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.subtext}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
