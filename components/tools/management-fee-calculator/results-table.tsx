"use client"

import { YearlyFeeData } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ResultsTableProps {
  yearlyData: YearlyFeeData[]
}

export function ResultsTable({ yearlyData }: ResultsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Year-by-Year Fee Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Year</TableHead>
                <TableHead>Fee Base</TableHead>
                <TableHead className="text-right">Base Amount</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Fee Amount</TableHead>
                <TableHead className="text-right">Cumulative</TableHead>
                <TableHead className="text-right">% of Commits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearlyData.map((data) => (
                <TableRow key={data.year}>
                  <TableCell className="font-medium">{data.year}</TableCell>
                  <TableCell className="text-sm">{data.feeBase}</TableCell>
                  <TableCell className="text-right text-sm">
                    ${data.baseAmount.toFixed(1)}M
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {data.feeRate.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${data.feeAmount.toFixed(2)}M
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    ${data.cumulativeFees.toFixed(2)}M
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {data.feesAsPercentOfCommitments.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
