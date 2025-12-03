import { BudgetData, BudgetResults, MonthlyProjection, Fund } from './types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PROJECTION_MONTHS = 60 // 5 years

/**
 * Simple deployment curve for management fees
 * Year 1: 70% of committed (assumes some fundraising runway)
 * Year 2+: 100% of committed
 */
function getDeploymentFactor(monthsFromClose: number): number {
  if (monthsFromClose < 12) return 0.7
  return 1.0
}

/**
 * Calculate monthly management fee revenue from a fund
 */
function calculateMonthlyFundRevenue(fund: Fund, projectionMonth: number, startYear: number): number {
  const projectionYear = startYear + Math.floor(projectionMonth / 12)
  const monthsFromClose = (projectionYear - fund.firstCloseYear) * 12 + (projectionMonth % 12)

  // Fund hasn't closed yet
  if (monthsFromClose < 0) return 0

  const deploymentFactor = getDeploymentFactor(monthsFromClose)
  const annualFee = fund.size * 1_000_000 * (fund.feeRate / 100) * deploymentFactor
  return annualFee / 12
}

/**
 * Calculate total monthly expenses
 */
function calculateMonthlyExpenses(data: BudgetData): number {
  const teamCost = data.expenses.team.reduce((sum, member) => sum + member.monthlyCost, 0)
  const opsCost = data.expenses.operations.reduce((sum, item) => sum + item.monthlyCost, 0)
  const overheadCost = data.expenses.overhead.reduce((sum, item) => sum + item.monthlyCost, 0)
  return teamCost + opsCost + overheadCost
}

/**
 * Main calculation function - generates monthly projections and key metrics
 */
export function calculateBudget(data: BudgetData): BudgetResults {
  const startYear = new Date().getFullYear()
  const monthlyExpenses = calculateMonthlyExpenses(data)
  const projections: MonthlyProjection[] = []

  let cashBalance = data.startingCash
  let breakEvenMonth: number | null = null
  let runwayMonths: number | null = null
  let firstBreakEvenFound = false

  for (let month = 0; month < PROJECTION_MONTHS; month++) {
    const year = startYear + Math.floor(month / 12)
    const monthIndex = month % 12

    // Calculate revenue from all funds
    const revenue = data.funds.reduce((sum, fund) => {
      return sum + calculateMonthlyFundRevenue(fund, month, startYear)
    }, 0)

    const netCashFlow = revenue - monthlyExpenses
    cashBalance += netCashFlow

    // Track break-even (first month where revenue >= expenses)
    if (!firstBreakEvenFound && revenue >= monthlyExpenses) {
      breakEvenMonth = month + 1
      firstBreakEvenFound = true
    }

    // Track runway (month when cash hits zero)
    if (runwayMonths === null && cashBalance <= 0) {
      runwayMonths = month
    }

    projections.push({
      month: month + 1,
      year,
      label: `${MONTHS[monthIndex]} ${year}`,
      revenue,
      expenses: monthlyExpenses,
      netCashFlow,
      cashBalance: Math.max(0, cashBalance) // Don't show negative for display
    })
  }

  // If cash never ran out, runway extends beyond projection
  if (runwayMonths === null) {
    runwayMonths = null // Will display as "60+ months"
  }

  // Calculate annual figures
  const annualRevenue = data.funds.reduce((sum, fund) => {
    return sum + (fund.size * 1_000_000 * (fund.feeRate / 100))
  }, 0)
  const annualBudget = monthlyExpenses * 12

  // Calculate seed capital needed to reach break-even
  // This is the cumulative negative cash flow until break-even
  let seedCapitalNeeded = 0
  let cumulativeCash = data.startingCash

  for (let i = 0; i < projections.length; i++) {
    cumulativeCash += projections[i].netCashFlow
    if (cumulativeCash < 0) {
      seedCapitalNeeded = Math.max(seedCapitalNeeded, Math.abs(cumulativeCash) + data.startingCash)
    }
    if (projections[i].revenue >= projections[i].expenses) {
      break
    }
  }

  return {
    monthlyBurn: monthlyExpenses,
    annualBudget,
    annualRevenue,
    breakEvenMonth,
    runwayMonths,
    seedCapitalNeeded: Math.max(0, seedCapitalNeeded),
    projections
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format months as years/months string
 */
export function formatRunway(months: number | null): string {
  if (months === null) return '60+ months'
  if (months === 0) return '0 months'

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) return `${months} months`
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
  return `${years}y ${remainingMonths}m`
}
