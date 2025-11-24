"use client"

import { useState } from 'react'
import { FundInputs, FeeCalculationResult, FeePhase } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Copy, FileText, CheckCircle2 } from 'lucide-react'
import { generateFeeSummary } from './fee-calculator'

interface ExportSectionProps {
  fundInputs: FundInputs
  result: FeeCalculationResult
  feePhases: FeePhase[]
}

export function ExportSection({ fundInputs, result, feePhases }: ExportSectionProps) {
  const [copied, setCopied] = useState(false)

  const summary = generateFeeSummary(fundInputs, result)

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleExportCSV = () => {
    let csv = 'Year,Fee Base,Base Amount (M),Fee Rate (%),Fee Amount (M),Cumulative Fees (M),% of Commitments\n'

    result.yearlyData.forEach(data => {
      csv += `${data.year},"${data.feeBase}",${data.baseAmount.toFixed(2)},${data.feeRate.toFixed(2)},${data.feeAmount.toFixed(2)},${data.cumulativeFees.toFixed(2)},${data.feesAsPercentOfCommitments.toFixed(2)}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `management-fee-schedule-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export & Share</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Summary</span>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg text-sm leading-relaxed">
            {summary}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCopySummary}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Summary
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Disclaimer:</strong> This calculator provides simplified estimates for educational purposes only.
            It does not constitute legal, tax, or financial advice. Actual management fee calculations may be more
            complex and should be reviewed with legal counsel and fund administrators before finalizing your LPA.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
