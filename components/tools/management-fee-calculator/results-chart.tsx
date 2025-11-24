"use client"

import { YearlyFeeData } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ResultsChartProps {
  yearlyData: YearlyFeeData[]
}

export function ResultsChart({ yearlyData }: ResultsChartProps) {
  const maxFeeAmount = Math.max(...yearlyData.map(d => d.feeAmount))
  const maxCumulative = Math.max(...yearlyData.map(d => d.cumulativeFees))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fee Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="annual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="annual">Annual Fees</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative Fees</TabsTrigger>
          </TabsList>

          <TabsContent value="annual" className="space-y-4">
            <div className="h-64 flex items-end gap-1 px-2 py-4 bg-accent/20 rounded-lg">
              {yearlyData.map((data) => {
                const heightPercent = (data.feeAmount / maxFeeAmount) * 100
                return (
                  <div key={data.year} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-primary hover:bg-primary/80 transition-all rounded-t relative group"
                        style={{ height: `${Math.max(heightPercent * 2, 4)}px` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg z-10">
                          ${data.feeAmount.toFixed(2)}M
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">{data.year}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Year</span>
              <span className="text-muted-foreground">Annual management fees by year</span>
            </div>
          </TabsContent>

          <TabsContent value="cumulative" className="space-y-4">
            <div className="h-64 flex items-end gap-1 px-2 py-4 bg-accent/20 rounded-lg">
              {yearlyData.map((data) => {
                const heightPercent = (data.cumulativeFees / maxCumulative) * 100
                return (
                  <div key={data.year} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-blue-500 hover:bg-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all rounded-t relative group"
                        style={{ height: `${Math.max(heightPercent * 2, 4)}px` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg z-10">
                          ${data.cumulativeFees.toFixed(2)}M
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">{data.year}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Year</span>
              <span className="text-muted-foreground">Cumulative fees over time</span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
