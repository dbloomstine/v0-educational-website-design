"use client"

import { FeeCalculationResult } from './types'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Percent, TrendingUp, Calculator } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

  // Calculate average annual fee in millions
  const avgAnnualFeeMillion = result.totalFees / result.yearlyData.length

  return (
    <div className="space-y-4">
      {/* Annual Fee Summary Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Annual Fee Summary</h3>
              <Badge variant="outline" className="bg-background">
                Fund Life Overview
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total fees over fund life</p>
                <p className="text-2xl font-bold text-primary">${result.totalFees.toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average annual fee</p>
                <p className="text-2xl font-bold text-primary">${avgAnnualFeeMillion.toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fees as % of fund size</p>
                <p className="text-2xl font-bold text-primary">{result.feesAsPercentOfCommitments.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  )
}
