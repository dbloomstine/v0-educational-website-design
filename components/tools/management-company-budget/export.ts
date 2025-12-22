import { BudgetData, BudgetResults } from './types'
import { formatCurrency, formatRunway } from './budget-calculator'
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

export function exportBudgetCSV(data: BudgetData, results: BudgetResults) {
  const sections: CSVSection[] = [
    // Summary Metrics
    createKeyValueSection('Budget Summary', {
      'Starting Cash': formatCurrency(data.startingCash),
      'Monthly Burn Rate': formatCurrency(results.monthlyBurn),
      'Annual Budget': formatCurrency(results.annualBudget),
      'Annual Revenue (at full deployment)': formatCurrency(results.annualRevenue),
      'Runway': formatRunway(results.runwayMonths),
      'Break-Even Month': results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not projected',
      'Seed Capital Needed': formatCurrency(results.seedCapitalNeeded)
    }),

    // Fund Details
    createTableSection(
      'Fund Revenue Sources',
      ['Fund Name', 'Size ($M)', 'Fee Rate (%)', 'First Close Year', 'Annual Fee'],
      data.funds.map(fund => [
        fund.name,
        `$${fund.size}M`,
        `${fund.feeRate}%`,
        String(fund.firstCloseYear),
        formatCurrency(fund.size * 1_000_000 * (fund.feeRate / 100))
      ])
    ),

    // Team Costs
    createTableSection(
      'Team Costs',
      ['Role', 'Monthly Cost', 'Annual Cost'],
      data.expenses.team.map(member => [
        member.role,
        formatCurrency(member.monthlyCost),
        formatCurrency(member.monthlyCost * 12)
      ])
    ),

    // Operations Costs
    createTableSection(
      'Operations Costs',
      ['Expense', 'Monthly Cost', 'Annual Cost'],
      data.expenses.operations.map(item => [
        item.name,
        formatCurrency(item.monthlyCost),
        formatCurrency(item.monthlyCost * 12)
      ])
    ),

    // Overhead Costs
    createTableSection(
      'Overhead Costs',
      ['Expense', 'Monthly Cost', 'Annual Cost'],
      data.expenses.overhead.map(item => [
        item.name,
        formatCurrency(item.monthlyCost),
        formatCurrency(item.monthlyCost * 12)
      ])
    ),

    // Monthly Projections (first 24 months)
    createTableSection(
      'Monthly Cash Flow Projections (24 months)',
      ['Month', 'Revenue', 'Expenses', 'Net Cash Flow', 'Cash Balance'],
      results.projections.slice(0, 24).map(proj => [
        proj.label,
        formatCurrency(proj.revenue),
        formatCurrency(proj.expenses),
        formatCurrency(proj.netCashFlow),
        formatCurrency(proj.cashBalance)
      ])
    )
  ]

  downloadCSV({
    filename: `fundopshq-management-company-budget-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Management Company Budget Planner',
    sections,
    includeDisclaimer: true
  })
}

export function exportBudgetPDF(data: BudgetData, results: BudgetResults) {
  const totalTeamCost = data.expenses.team.reduce((sum, m) => sum + m.monthlyCost, 0)
  const totalOpsCost = data.expenses.operations.reduce((sum, i) => sum + i.monthlyCost, 0)
  const totalOverheadCost = data.expenses.overhead.reduce((sum, i) => sum + i.monthlyCost, 0)

  const sections: PDFSection[] = [
    // Key Metrics
    { type: 'title', content: 'Budget Summary' },
    {
      type: 'keyValue',
      data: {
        'Starting Cash': formatCurrency(data.startingCash),
        'Monthly Burn Rate': formatCurrency(results.monthlyBurn),
        'Annual Budget': formatCurrency(results.annualBudget),
        'Annual Revenue': formatCurrency(results.annualRevenue)
      }
    },
    {
      type: 'keyValue',
      data: {
        'Runway': formatRunway(results.runwayMonths),
        'Break-Even': results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'Not projected',
        'Seed Capital Needed': formatCurrency(results.seedCapitalNeeded)
      }
    },

    { type: 'spacer' },

    // Fund Revenue
    { type: 'title', content: 'Fund Revenue Sources' },
    ...createPDFTableSection(
      '',
      ['Fund', 'Size', 'Fee Rate', 'Annual Fee'],
      data.funds.map(fund => [
        fund.name.substring(0, 15),
        `$${fund.size}M`,
        `${fund.feeRate}%`,
        formatCurrency(fund.size * 1_000_000 * (fund.feeRate / 100))
      ])
    ),

    { type: 'spacer' },

    // Expense Summary
    { type: 'title', content: 'Monthly Expense Breakdown' },
    {
      type: 'keyValue',
      data: {
        'Team Costs': formatCurrency(totalTeamCost),
        'Operations Costs': formatCurrency(totalOpsCost),
        'Overhead Costs': formatCurrency(totalOverheadCost),
        'Total Monthly': formatCurrency(results.monthlyBurn)
      }
    },

    { type: 'spacer' },

    // Team Details
    ...createPDFTableSection(
      'Team Costs',
      ['Role', 'Monthly', 'Annual'],
      data.expenses.team.map(member => [
        member.role.substring(0, 20),
        formatCurrency(member.monthlyCost),
        formatCurrency(member.monthlyCost * 12)
      ])
    ),

    { type: 'spacer' },

    // Cash Flow Projection (first 12 months)
    ...createPDFTableSection(
      'Cash Flow Projection (12 months)',
      ['Month', 'Revenue', 'Expenses', 'Balance'],
      results.projections.slice(0, 12).map(proj => [
        proj.label,
        formatCurrency(proj.revenue),
        formatCurrency(proj.expenses),
        formatCurrency(proj.cashBalance)
      ])
    )
  ]

  downloadPDF({
    filename: `fundopshq-management-company-budget-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Management Company Budget Planner',
    description: `Budget projection with ${formatCurrency(data.startingCash)} starting cash and ${formatRunway(results.runwayMonths)} runway.`,
    sections,
    includeDisclaimer: true
  })
}
