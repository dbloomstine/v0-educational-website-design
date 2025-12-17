import { BudgetData, BudgetResults, MonthlyProjection, Fund, BudgetSettings } from './types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Default settings
const DEFAULT_SETTINGS: Required<BudgetSettings> = {
  inflationRate: 3, // 3% annual expense growth
  projectionYears: 5,
  gpCommitmentPercent: 2,
  gpFundedAmount: 0
}

/**
 * Get settings with defaults applied
 */
function getSettings(data: BudgetData): Required<BudgetSettings> {
  return {
    ...DEFAULT_SETTINGS,
    ...data.settings
  }
}

/**
 * Advanced fee ramp-up model
 * Models capital deployment from first close through final close and investment period
 */
function getFeeMultiplier(fund: Fund, monthsFromFirstClose: number): number {
  // Use advanced fields if available, otherwise use simple defaults
  const firstClosePercent = fund.firstClosePercent ?? 50 // 50% at first close
  const finalCloseMonth = fund.finalCloseMonth ?? 12 // 12 months to final close
  const feeBasis = fund.feeBasis ?? 'committed'

  // Before first close
  if (monthsFromFirstClose < 0) return 0

  // Calculate capital raised (linear ramp from first close to final close)
  let capitalRaisedPercent: number
  if (monthsFromFirstClose >= finalCloseMonth) {
    capitalRaisedPercent = 100 // Full fund raised
  } else {
    // Linear ramp from firstClosePercent to 100%
    const progress = monthsFromFirstClose / finalCloseMonth
    capitalRaisedPercent = firstClosePercent + (100 - firstClosePercent) * progress
  }

  if (feeBasis === 'invested') {
    // Fees on invested capital - typically lower in early years
    const investmentPeriod = fund.investmentPeriod ?? 5
    const monthsInInvestmentPeriod = investmentPeriod * 12

    if (monthsFromFirstClose < monthsInInvestmentPeriod) {
      // During investment period, fees on deployed capital
      // Assume linear deployment over investment period
      const deploymentProgress = Math.min(monthsFromFirstClose / monthsInInvestmentPeriod, 1)
      return (capitalRaisedPercent / 100) * deploymentProgress
    } else {
      // Post-investment period, fees on remaining invested capital
      // Typically decreases as investments are realized
      const yearsPostInvestment = (monthsFromFirstClose - monthsInInvestmentPeriod) / 12
      const remainingFactor = Math.max(0.3, 1 - yearsPostInvestment * 0.15)
      return (capitalRaisedPercent / 100) * remainingFactor
    }
  }

  // Committed capital basis (default) - fees on committed regardless of deployment
  return capitalRaisedPercent / 100
}

/**
 * Calculate monthly management fee revenue from a fund
 */
function calculateMonthlyFundRevenue(fund: Fund, projectionMonth: number, startYear: number): number {
  const projectionYear = startYear + Math.floor(projectionMonth / 12)
  const monthInYear = projectionMonth % 12
  const monthsFromFirstClose = (projectionYear - fund.firstCloseYear) * 12 + monthInYear

  const feeMultiplier = getFeeMultiplier(fund, monthsFromFirstClose)
  const annualFee = fund.size * 1_000_000 * (fund.feeRate / 100) * feeMultiplier
  return annualFee / 12
}

/**
 * Calculate monthly expenses with inflation adjustment
 */
function calculateMonthlyExpenses(data: BudgetData, monthIndex: number): {
  total: number
  team: number
  ops: number
  overhead: number
} {
  const settings = getSettings(data)
  const yearsElapsed = Math.floor(monthIndex / 12)
  const inflationFactor = Math.pow(1 + settings.inflationRate / 100, yearsElapsed)

  const team = data.expenses.team.reduce((sum, member) => sum + member.monthlyCost, 0) * inflationFactor
  const ops = data.expenses.operations.reduce((sum, item) => sum + item.monthlyCost, 0) * inflationFactor
  const overhead = data.expenses.overhead.reduce((sum, item) => sum + item.monthlyCost, 0) * inflationFactor

  return {
    total: team + ops + overhead,
    team,
    ops,
    overhead
  }
}

/**
 * Calculate estimated carried interest from a fund
 */
function calculateCarry(fund: Fund): { total: number; timeline: { year: number; amount: number }[] } {
  const targetReturn = fund.targetReturn ?? 2.0 // Default 2x
  const carryRate = fund.carryRate ?? 20 // Default 20%
  const preferredReturn = fund.preferredReturn ?? 8 // Default 8%
  const fundLife = fund.fundLife ?? 10
  const investmentPeriod = fund.investmentPeriod ?? 5

  // Calculate total fund value at target return
  const fundSize = fund.size * 1_000_000
  const totalValue = fundSize * targetReturn
  const profit = totalValue - fundSize

  // Calculate hurdle (preferred return compounded)
  const avgHoldingPeriod = fundLife - investmentPeriod / 2 // Approximate
  const hurdleAmount = fundSize * (Math.pow(1 + preferredReturn / 100, avgHoldingPeriod) - 1)

  // Carry is on profits above hurdle
  const carryableProfit = Math.max(0, profit - hurdleAmount)
  const totalCarry = carryableProfit * (carryRate / 100)

  // Model carry realization timeline (bulk of carry in years 7-10)
  const timeline: { year: number; amount: number }[] = []
  const carryYears = [
    { year: fund.firstCloseYear + 5, pct: 0.05 },
    { year: fund.firstCloseYear + 6, pct: 0.10 },
    { year: fund.firstCloseYear + 7, pct: 0.20 },
    { year: fund.firstCloseYear + 8, pct: 0.25 },
    { year: fund.firstCloseYear + 9, pct: 0.25 },
    { year: fund.firstCloseYear + 10, pct: 0.15 },
  ]

  for (const cy of carryYears) {
    timeline.push({
      year: cy.year,
      amount: totalCarry * cy.pct
    })
  }

  return { total: totalCarry, timeline }
}

/**
 * Main calculation function - generates monthly projections and key metrics
 */
export function calculateBudget(data: BudgetData): BudgetResults {
  const settings = getSettings(data)
  const startYear = new Date().getFullYear()
  const projectionMonths = settings.projectionYears * 12
  const projections: MonthlyProjection[] = []

  // Get base monthly expenses (without inflation for metrics)
  const baseExpenses = calculateMonthlyExpenses(data, 0)

  let cashBalance = data.startingCash
  let breakEvenMonth: number | null = null
  let runwayMonths: number | null = null
  let firstBreakEvenFound = false

  for (let month = 0; month < projectionMonths; month++) {
    const year = startYear + Math.floor(month / 12)
    const monthIndex = month % 12

    // Calculate revenue from all funds (with ramp-up)
    const revenue = data.funds.reduce((sum, fund) => {
      return sum + calculateMonthlyFundRevenue(fund, month, startYear)
    }, 0)

    // Calculate expenses with inflation
    const expenses = calculateMonthlyExpenses(data, month)
    const monthlyExpenses = expenses.total

    const netCashFlow = revenue - monthlyExpenses
    cashBalance += netCashFlow

    // Track break-even (first month where revenue >= expenses)
    if (!firstBreakEvenFound && monthlyExpenses > 0 && revenue >= monthlyExpenses) {
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
      cashBalance: Math.max(0, cashBalance)
    })
  }

  // Calculate annual revenue at full deployment
  const annualRevenue = data.funds.reduce((sum, fund) => {
    return sum + (fund.size * 1_000_000 * (fund.feeRate / 100))
  }, 0)

  // Calculate seed capital needed to reach break-even
  let lowestCashPoint = data.startingCash
  let cumulativeCash = data.startingCash

  for (let i = 0; i < projections.length; i++) {
    cumulativeCash += projections[i].netCashFlow
    lowestCashPoint = Math.min(lowestCashPoint, cumulativeCash)
    if (projections[i].revenue >= projections[i].expenses) {
      break
    }
  }

  const seedCapitalNeeded = lowestCashPoint < 0
    ? data.startingCash + Math.abs(lowestCashPoint)
    : data.startingCash

  // Calculate carry projections
  let estimatedCarry = 0
  const carryTimeline: { year: number; amount: number }[] = []

  for (const fund of data.funds) {
    if (fund.targetReturn && fund.targetReturn > 1) {
      const carry = calculateCarry(fund)
      estimatedCarry += carry.total
      for (const ct of carry.timeline) {
        const existing = carryTimeline.find(c => c.year === ct.year)
        if (existing) {
          existing.amount += ct.amount
        } else {
          carryTimeline.push({ ...ct })
        }
      }
    }
  }

  // Sort carry timeline by year
  carryTimeline.sort((a, b) => a.year - b.year)

  return {
    monthlyBurn: baseExpenses.total,
    annualBudget: baseExpenses.total * 12,
    annualRevenue,
    breakEvenMonth,
    runwayMonths,
    seedCapitalNeeded: Math.max(0, seedCapitalNeeded),
    projections,
    teamCost: baseExpenses.team,
    opsCost: baseExpenses.ops,
    overheadCost: baseExpenses.overhead,
    estimatedCarry: estimatedCarry > 0 ? estimatedCarry : undefined,
    carryTimeline: carryTimeline.length > 0 ? carryTimeline : undefined
  }
}

/**
 * Goal-seeking: Find the fund size needed for a target runway
 */
export function findFundSizeForRunway(
  data: BudgetData,
  targetRunwayMonths: number,
  tolerance: number = 1
): number | null {
  if (data.funds.length === 0) return null

  let minSize = 10 // $10M minimum
  let maxSize = 2000 // $2B maximum
  let iterations = 0
  const maxIterations = 50

  while (iterations < maxIterations && maxSize - minSize > 1) {
    const midSize = (minSize + maxSize) / 2

    // Create test data with adjusted fund size
    const testData: BudgetData = {
      ...data,
      funds: data.funds.map((f, i) => i === 0 ? { ...f, size: midSize } : f)
    }

    const results = calculateBudget(testData)
    const runway = results.runwayMonths

    if (runway === null) {
      // Infinite runway - fund is big enough, try smaller
      maxSize = midSize
    } else if (runway < targetRunwayMonths - tolerance) {
      // Not enough runway - need bigger fund
      minSize = midSize
    } else if (runway > targetRunwayMonths + tolerance) {
      // Too much runway - try smaller
      maxSize = midSize
    } else {
      // Within tolerance
      return Math.ceil(midSize)
    }

    iterations++
  }

  return Math.ceil((minSize + maxSize) / 2)
}

/**
 * Goal-seeking: Find the starting cash needed for a target runway
 */
export function findCashForRunway(
  data: BudgetData,
  targetRunwayMonths: number,
  tolerance: number = 1
): number | null {
  let minCash = 0
  let maxCash = 10_000_000 // $10M maximum
  let iterations = 0
  const maxIterations = 50

  while (iterations < maxIterations && maxCash - minCash > 10000) {
    const midCash = (minCash + maxCash) / 2

    const testData: BudgetData = { ...data, startingCash: midCash }
    const results = calculateBudget(testData)
    const runway = results.runwayMonths

    if (runway === null) {
      maxCash = midCash
    } else if (runway < targetRunwayMonths - tolerance) {
      minCash = midCash
    } else if (runway > targetRunwayMonths + tolerance) {
      maxCash = midCash
    } else {
      return Math.ceil(midCash / 10000) * 10000 // Round to nearest $10K
    }

    iterations++
  }

  return Math.ceil((minCash + maxCash) / 2 / 10000) * 10000
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
