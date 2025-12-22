"use client"

import { useState } from 'react'
import { FundInputs, FeeCalculationResult, FeePhase } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, FileText, CheckCircle2 } from 'lucide-react'
import { generateFeeSummary } from './fee-calculator'
import { ExportToolbar } from '@/components/tools/shared'
import {
  downloadCSV,
  createKeyValueSection,
  createTableSection,
  formatCurrency,
  formatPercent,
  type CSVSection
} from '@/lib/exports'
import {
  downloadPDF,
  createPDFKeyValueSection,
  createPDFTableSection,
  type PDFSection
} from '@/lib/exports'

interface ExportSectionProps {
  fundInputs: FundInputs
  result: FeeCalculationResult
  feePhases: FeePhase[]
}

export function ExportSection({ fundInputs, result, feePhases }: ExportSectionProps) {
  const [copied, setCopied] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const summary = generateFeeSummary(fundInputs, result)

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent fail - clipboard may be unavailable
    }
  }

  const handleExportCSV = () => {
    setCsvLoading(true)
    setTimeout(() => {
      const sections: CSVSection[] = [
        // Fund Summary
        createKeyValueSection('Fund Summary', {
          'Fund Type': fundInputs.fundType,
          'Target Fund Size': `$${fundInputs.fundSize}M`,
          'Fund Term': `${fundInputs.fundTerm} years`,
          'Investment Period': `${fundInputs.investmentPeriod} years`,
          'NAV Growth Rate': `${fundInputs.navGrowthRate || 0}%`
        }),

        // Total Fees
        createKeyValueSection('Total Fee Summary', {
          'Total Management Fees': `$${result.totalFees.toFixed(2)}M`,
          'Average Annual Fee': formatPercent(result.averageAnnualFeePercent, 2),
          'Total Fees as % of Commitments': formatPercent(result.feesAsPercentOfCommitments, 2),
          'Fees in First Half': `$${result.firstHalfFees.toFixed(2)}M`,
          'Fees in Second Half': `$${result.secondHalfFees.toFixed(2)}M`
        }),

        // Fee Phases Table
        createTableSection(
          'Fee Schedule Phases',
          ['Phase', 'Years', 'Fee Base', 'Annual Rate'],
          feePhases.map((phase, idx) => [
            `Phase ${idx + 1}`,
            `${phase.startYear} - ${phase.endYear}`,
            phase.feeBase,
            `${phase.feeRate.toFixed(2)}%`
          ])
        ),

        // Yearly Schedule Table
        createTableSection(
          'Yearly Fee Schedule',
          ['Year', 'Fee Base', 'Base Amount (M)', 'Fee Rate (%)', 'Fee Amount (M)', 'Cumulative (M)', '% of Commitments'],
          result.yearlyData.map(data => [
            String(data.year),
            data.feeBase,
            `$${data.baseAmount.toFixed(2)}`,
            `${data.feeRate.toFixed(2)}%`,
            `$${data.feeAmount.toFixed(2)}`,
            `$${data.cumulativeFees.toFixed(2)}`,
            `${data.feesAsPercentOfCommitments.toFixed(2)}%`
          ])
        )
      ]

      downloadCSV({
        filename: `management-fee-schedule-${new Date().toISOString().split('T')[0]}`,
        toolName: 'Management Fee Calculator',
        sections,
        includeDisclaimer: true
      })
      setCsvLoading(false)
    }, 100)
  }

  const handleExportPDF = () => {
    setPdfLoading(true)
    setTimeout(() => {
      const sections: PDFSection[] = [
        // Fund Summary
        { type: 'title', content: 'Fund Configuration' },
        {
          type: 'keyValue',
          data: {
            'Fund Type': fundInputs.fundType,
            'Target Fund Size': `$${fundInputs.fundSize}M`,
            'Fund Term': `${fundInputs.fundTerm} years`,
            'Investment Period': `${fundInputs.investmentPeriod} years`
          }
        },

        { type: 'spacer' },

        // Total Fees (prominent)
        { type: 'title', content: 'Total Fee Summary' },
        {
          type: 'keyValue',
          data: {
            'Total Management Fees': `$${result.totalFees.toFixed(2)}M`,
            'As % of Commitments': `${result.feesAsPercentOfCommitments.toFixed(2)}%`,
            'Average Annual Fee': `${result.averageAnnualFeePercent.toFixed(2)}%`,
            'First Half of Term': `$${result.firstHalfFees.toFixed(2)}M`,
            'Second Half of Term': `$${result.secondHalfFees.toFixed(2)}M`
          }
        },

        { type: 'spacer' },

        // Fee Phases
        ...createPDFTableSection(
          'Fee Schedule Phases',
          ['Phase', 'Years', 'Fee Base', 'Rate'],
          feePhases.map((phase, idx) => [
            `Phase ${idx + 1}`,
            `Yr ${phase.startYear}-${phase.endYear}`,
            phase.feeBase.substring(0, 15),
            `${phase.feeRate}%`
          ])
        ),

        { type: 'spacer' },

        // Yearly Schedule (first 10 years)
        ...createPDFTableSection(
          'Yearly Fee Schedule',
          ['Year', 'Fee Base', 'Fee ($M)', 'Cumul.'],
          result.yearlyData.slice(0, 10).map(data => [
            `Yr ${data.year}`,
            data.feeBase.substring(0, 12),
            `$${data.feeAmount.toFixed(2)}`,
            `$${data.cumulativeFees.toFixed(2)}`
          ])
        )
      ]

      downloadPDF({
        filename: `management-fee-schedule-${new Date().toISOString().split('T')[0]}`,
        toolName: 'Management Fee Calculator',
        description: `Fee projection for a $${fundInputs.fundSize}M ${fundInputs.fundType} fund with a ${fundInputs.fundTerm}-year term.`,
        sections,
        includeDisclaimer: true
      })
      setPdfLoading(false)
    }, 100)
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
            <span className="text-sm font-medium">Quick Summary</span>
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
          <ExportToolbar
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            csvLoading={csvLoading}
            pdfLoading={pdfLoading}
            compact
          />
        </div>
      </CardContent>
    </Card>
  )
}
