"use client"

import { useState } from 'react'
import { BudgetData, CalculationResults } from './types'
import { ExportToolbar } from '@/components/tools/shared'
import {
  downloadCSV,
  createKeyValueSection,
  createTableSection,
  type CSVSection
} from '@/lib/exports'
import {
  downloadPDF,
  createPDFTableSection,
  type PDFSection
} from '@/lib/exports'

interface ExportButtonsProps {
  budgetData: BudgetData
  results: CalculationResults | null
  formatCurrency: (value: number, short?: boolean) => string
}

export function ExportButtons({ budgetData, results, formatCurrency }: ExportButtonsProps) {
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleExportCSV = () => {
    if (!results) return
    setCsvLoading(true)

    setTimeout(() => {
      const firstYear = results.revenue[0]
      const firstYearExpenses = results.expenses[0]
      const firstYearCash = results.cashFlow[0]
      const margin = firstYear.totalRevenue > 0 ? (firstYearCash.ebitda / firstYear.totalRevenue * 100) : 0
      const coverage = firstYear.mgmtFees > 0 ? (firstYear.mgmtFees / firstYearExpenses.totalExpenses) : 0

      const sections: CSVSection[] = [
        // Firm Profile
        createKeyValueSection('Firm Profile', {
          'Asset Class': budgetData.firmProfile.assetClass,
          'Geography': budgetData.firmProfile.geography,
          'Stage': budgetData.firmProfile.stage,
          'Active Funds': String(budgetData.funds.length)
        }),

        // Key Metrics
        createKeyValueSection('Key Metrics (Year 1)', {
          'Total Revenue': formatCurrency(firstYear.totalRevenue),
          'Total Expenses': formatCurrency(firstYearExpenses.totalExpenses),
          'EBITDA': formatCurrency(firstYearCash.ebitda),
          'EBITDA Margin': `${margin.toFixed(1)}%`,
          'Management Fee Coverage': `${coverage.toFixed(2)}x`
        }),

        // Funds Table
        createTableSection(
          'Active Funds',
          ['Fund Name', 'Size ($M)', 'Fee Rate (%)', 'Fee Base'],
          budgetData.funds.map(fund => [
            fund.name,
            String(fund.size),
            String(fund.feeRate),
            fund.feeBase
          ])
        ),

        // Revenue Projection
        createTableSection(
          'Revenue Projection',
          ['Year', 'Mgmt Fees', 'Add\'l Fees', 'Recurring', 'Carry', 'Total'],
          results.revenue.map(r => [
            String(r.year),
            formatCurrency(r.mgmtFees),
            formatCurrency(r.additionalFees),
            formatCurrency(r.recurringRevenue),
            formatCurrency(r.carryRevenue),
            formatCurrency(r.totalRevenue)
          ])
        ),

        // Expense Projection
        createTableSection(
          'Expense Projection',
          ['Year', 'People', 'Services', 'Tech', 'Office', 'Marketing', 'Insurance', 'Total'],
          results.expenses.map(e => [
            String(e.year),
            formatCurrency(e.peopleCost),
            formatCurrency(e.servicesCost),
            formatCurrency(e.technologyCost),
            formatCurrency(e.officeCost),
            formatCurrency(e.marketingCost),
            formatCurrency(e.insuranceCost),
            formatCurrency(e.totalExpenses)
          ])
        ),

        // Cash Flow
        createTableSection(
          'Cash Flow',
          ['Year', 'EBITDA', 'Cash Balance'],
          results.cashFlow.map(c => [
            String(c.year),
            formatCurrency(c.ebitda),
            formatCurrency(c.cashBalance)
          ])
        )
      ]

      downloadCSV({
        filename: `management-company-budget-${new Date().toISOString().split('T')[0]}`,
        toolName: 'Management Company Budget Planner',
        sections,
        includeDisclaimer: true
      })
      setCsvLoading(false)
    }, 100)
  }

  const handleExportPDF = () => {
    if (!results) return
    setPdfLoading(true)

    setTimeout(() => {
      const firstYear = results.revenue[0]
      const firstYearExpenses = results.expenses[0]
      const firstYearCash = results.cashFlow[0]
      const margin = firstYear.totalRevenue > 0 ? (firstYearCash.ebitda / firstYear.totalRevenue * 100) : 0
      const coverage = firstYear.mgmtFees > 0 ? (firstYear.mgmtFees / firstYearExpenses.totalExpenses) : 0

      const sections: PDFSection[] = [
        // Firm Profile
        { type: 'title', content: 'Firm Profile' },
        {
          type: 'keyValue',
          data: {
            'Asset Class': budgetData.firmProfile.assetClass,
            'Geography': budgetData.firmProfile.geography,
            'Stage': budgetData.firmProfile.stage,
            'Active Funds': String(budgetData.funds.length)
          }
        },

        { type: 'spacer' },

        // Key Metrics
        { type: 'title', content: 'Key Metrics (Year 1)' },
        {
          type: 'keyValue',
          data: {
            'Total Revenue': formatCurrency(firstYear.totalRevenue),
            'Total Expenses': formatCurrency(firstYearExpenses.totalExpenses),
            'EBITDA': formatCurrency(firstYearCash.ebitda),
            'EBITDA Margin': `${margin.toFixed(1)}%`,
            'Fee Coverage': `${coverage.toFixed(2)}x`
          }
        },

        { type: 'spacer' },

        // Revenue Projection (summary)
        ...createPDFTableSection(
          'Revenue Projection',
          ['Year', 'Mgmt Fees', 'Other', 'Total'],
          results.revenue.slice(0, 5).map(r => [
            `Yr ${r.year}`,
            formatCurrency(r.mgmtFees, true),
            formatCurrency(r.additionalFees + r.recurringRevenue, true),
            formatCurrency(r.totalRevenue, true)
          ])
        ),

        { type: 'spacer' },

        // Cash Flow
        ...createPDFTableSection(
          'Cash Flow Summary',
          ['Year', 'EBITDA', 'Cash'],
          results.cashFlow.slice(0, 5).map(c => [
            `Yr ${c.year}`,
            formatCurrency(c.ebitda, true),
            formatCurrency(c.cashBalance, true)
          ])
        )
      ]

      downloadPDF({
        filename: `management-company-budget-${new Date().toISOString().split('T')[0]}`,
        toolName: 'Management Company Budget Planner',
        description: `${budgetData.firmProfile.assetClass} firm budget with ${budgetData.funds.length} active fund(s).`,
        sections,
        includeDisclaimer: true
      })
      setPdfLoading(false)
    }, 100)
  }

  return (
    <ExportToolbar
      onExportCSV={handleExportCSV}
      onExportPDF={handleExportPDF}
      csvLoading={csvLoading}
      pdfLoading={pdfLoading}
      compact
      disabled={!results}
    />
  )
}
