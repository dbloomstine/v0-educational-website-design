import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { BudgetData, CalculationResults } from './types'

interface ExportButtonsProps {
  budgetData: BudgetData
  results: CalculationResults | null
  formatCurrency: (value: number, short?: boolean) => string
}

export function ExportButtons({ budgetData, results, formatCurrency }: ExportButtonsProps) {
  const exportToCSV = () => {
    if (!results) return

    const lines: string[][] = []

    // Header
    lines.push(['Management Company Budget Plan - ' + new Date().toLocaleDateString()])
    lines.push([])

    // Firm Profile
    lines.push(['Firm Profile'])
    lines.push(['Asset Class', budgetData.firmProfile.assetClass])
    lines.push(['Geography', budgetData.firmProfile.geography])
    lines.push(['Stage', budgetData.firmProfile.stage])
    lines.push([])

    // Funds
    lines.push(['Active Funds'])
    lines.push(['Fund Name', 'Size ($M)', 'Fee Rate (%)', 'Fee Base'])
    budgetData.funds.forEach(fund => {
      lines.push([fund.name, fund.size.toString(), fund.feeRate.toString(), fund.feeBase])
    })
    lines.push([])

    // Revenue
    lines.push(['Revenue Projection'])
    lines.push(['Year', 'Management Fees', 'Additional Fees', 'Recurring Revenue', 'Carry', 'Total Revenue'])
    results.revenue.forEach(r => {
      lines.push([
        r.year.toString(),
        r.mgmtFees.toString(),
        r.additionalFees.toString(),
        r.recurringRevenue.toString(),
        r.carryRevenue.toString(),
        r.totalRevenue.toString()
      ])
    })
    lines.push([])

    // Expenses
    lines.push(['Expense Projection'])
    lines.push(['Year', 'People', 'Services', 'Technology', 'Office', 'Marketing', 'Insurance', 'Total'])
    results.expenses.forEach(e => {
      lines.push([
        e.year.toString(),
        e.peopleCost.toString(),
        e.servicesCost.toString(),
        e.technologyCost.toString(),
        e.officeCost.toString(),
        e.marketingCost.toString(),
        e.insuranceCost.toString(),
        e.totalExpenses.toString()
      ])
    })
    lines.push([])

    // Cash Flow
    lines.push(['Cash Flow'])
    lines.push(['Year', 'EBITDA', 'Cash Balance'])
    results.cashFlow.forEach(c => {
      lines.push([c.year.toString(), c.ebitda.toString(), c.cashBalance.toString()])
    })

    const csv = lines.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'management-company-budget.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportSummary = () => {
    if (!results) return

    const firstYear = results.revenue[0]
    const firstYearExpenses = results.expenses[0]
    const firstYearCash = results.cashFlow[0]
    const margin = firstYear.totalRevenue > 0 ? (firstYearCash.ebitda / firstYear.totalRevenue * 100) : 0
    const coverage = firstYear.mgmtFees > 0 ? (firstYear.mgmtFees / firstYearExpenses.totalExpenses) : 0

    const summary = `MANAGEMENT COMPANY BUDGET SNAPSHOT
Generated: ${new Date().toLocaleDateString()}

FIRM PROFILE
Asset Class: ${budgetData.firmProfile.assetClass}
Geography: ${budgetData.firmProfile.geography}
Stage: ${budgetData.firmProfile.stage}
Active Funds: ${budgetData.funds.length}

KEY METRICS (Year 1)
Total Revenue: ${formatCurrency(firstYear.totalRevenue)}
Total Expenses: ${formatCurrency(firstYearExpenses.totalExpenses)}
EBITDA: ${formatCurrency(firstYearCash.ebitda)}
EBITDA Margin: ${margin.toFixed(1)}%
Management Fee Coverage: ${coverage.toFixed(2)}x

REVENUE BREAKDOWN (Year 1)
Management Fees: ${formatCurrency(firstYear.mgmtFees)}
Additional Fees: ${formatCurrency(firstYear.additionalFees)}
Recurring Revenue: ${formatCurrency(firstYear.recurringRevenue)}
Carry (Scenario): ${formatCurrency(firstYear.carryRevenue)}

EXPENSE BREAKDOWN (Year 1)
People Costs: ${formatCurrency(firstYearExpenses.peopleCost)}
Outsourced Services: ${formatCurrency(firstYearExpenses.servicesCost)}
Technology: ${formatCurrency(firstYearExpenses.technologyCost)}
Office & Overhead: ${formatCurrency(firstYearExpenses.officeCost)}
Marketing & Travel: ${formatCurrency(firstYearExpenses.marketingCost)}
Insurance: ${formatCurrency(firstYearExpenses.insuranceCost)}

Generated with FundOpsHQ Management Company Budget Planner
`

    // Copy to clipboard
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!')
    })

    // Download as text file
    const blob = new Blob([summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!results}>
        <Download className="h-4 w-4 mr-2" />
        Export to CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportSummary} disabled={!results}>
        <FileText className="h-4 w-4 mr-2" />
        Export Summary
      </Button>
    </>
  )
}
