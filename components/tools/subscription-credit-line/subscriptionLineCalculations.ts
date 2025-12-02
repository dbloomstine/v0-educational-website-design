// Subscription Credit Line Impact Calculations
// Based on market-standard subscription facility mechanics
// Sources: ILPA 2017 & 2020 guidance, Canterbury Consulting, Callan, CAIA 2024

export interface SubscriptionLineInput {
  // Fund basics
  fundSize: number
  investmentPeriodYears: number
  fundTermYears: number

  // Deployment
  deploymentPaceType: 'linear' | 'front-loaded' | 'back-loaded'
  customDeploymentSchedule?: number[] // Optional custom % per year

  // Economics and fees
  managementFeeRate: number // e.g., 0.02 for 2%
  managementFeeBasis: 'commitments' | 'invested-capital'
  carryRate: number // e.g., 0.20 for 20%
  prefRate: number // e.g., 0.08 for 8%

  // Subscription line settings
  useLine: boolean
  facilitySize: number // As % of commitments, e.g., 0.20 for 20%
  interestRate: number // Annual rate, e.g., 0.045 for 4.5%
  maxDaysOutstanding: number // e.g., 180
  repaymentTrigger: 'automatic' | 'distribution-funded' // When line is repaid

  // Return assumptions
  grossMOIC: number // e.g., 2.5 for 2.5x
  realizationScheduleType: 'linear' | 'j-curve' | 'back-loaded'
}

export interface CashFlowYear {
  year: number

  // Without line
  capitalCallsNoLine: number
  distributionsNoLine: number
  managementFeesNoLine: number

  // With line
  capitalCallsWithLine: number
  distributionsWithLine: number
  managementFeesWithLine: number
  lineDraws: number
  lineRepayments: number
  interestPaid: number
  lineBalance: number

  // Cumulative values
  cumulativeCalledNoLine: number
  cumulativeDistributedNoLine: number
  cumulativeCalledWithLine: number
  cumulativeDistributedWithLine: number

  // Net cash flows (for IRR calculation)
  netCashFlowNoLine: number
  netCashFlowWithLine: number
}

export interface SubscriptionLineOutput {
  input: SubscriptionLineInput

  // Cash flow schedule
  cashFlows: CashFlowYear[]

  // Performance metrics - No Line
  irrNoLine: number
  moicNoLine: number
  tvpiNoLine: number
  dpiNoLine: number

  // Performance metrics - With Line
  irrWithLine: number
  moicWithLine: number
  tvpiWithLine: number
  dpiWithLine: number

  // Impact analysis
  irrBoost: number // Basis points
  moicDrag: number // Percentage reduction
  totalInterestPaid: number
  totalManagementFees: number
  feeDrag: number // As % of returns

  // J-curve analysis
  jCurveDataNoLine: { year: number; nav: number }[]
  jCurveDataWithLine: { year: number; nav: number }[]

  // Timing analysis
  avgDaysCapitalOutstanding: number
  capitalEfficiency: number // How much line usage reduced capital outstanding
}

// Default input values based on market standards
export const defaultInput: SubscriptionLineInput = {
  fundSize: 100000000,
  investmentPeriodYears: 5,
  fundTermYears: 10,
  deploymentPaceType: 'front-loaded',
  managementFeeRate: 0.02,
  managementFeeBasis: 'commitments',
  carryRate: 0.20,
  prefRate: 0.08,
  useLine: true,
  facilitySize: 0.20, // 20% of commitments (within ILPA 15-25% guidance)
  interestRate: 0.045, // 4.5% (mid-range of typical 3-6%)
  maxDaysOutstanding: 180, // ILPA recommended max
  repaymentTrigger: 'automatic',
  grossMOIC: 2.5,
  realizationScheduleType: 'j-curve'
}

/**
 * Generate deployment schedule based on pace type
 */
function generateDeploymentSchedule(
  input: SubscriptionLineInput
): number[] {
  const years = input.investmentPeriodYears

  if (input.customDeploymentSchedule) {
    return input.customDeploymentSchedule
  }

  const schedule: number[] = []

  switch (input.deploymentPaceType) {
    case 'linear':
      // Equal amounts each year
      for (let i = 0; i < years; i++) {
        schedule.push(1 / years)
      }
      break

    case 'front-loaded':
      // More in early years (typical PE pattern)
      // Year 1: 35%, Year 2: 30%, Year 3: 20%, Year 4: 10%, Year 5: 5%
      if (years === 5) {
        schedule.push(0.35, 0.30, 0.20, 0.10, 0.05)
      } else {
        // Approximation for other periods
        for (let i = 0; i < years; i++) {
          const weight = (years - i) / ((years * (years + 1)) / 2)
          schedule.push(weight)
        }
      }
      break

    case 'back-loaded':
      // More in later years (less common)
      for (let i = 0; i < years; i++) {
        const weight = (i + 1) / ((years * (years + 1)) / 2)
        schedule.push(weight)
      }
      break
  }

  return schedule
}

/**
 * Generate realization schedule based on type
 */
function generateRealizationSchedule(
  input: SubscriptionLineInput
): number[] {
  const years = input.fundTermYears
  const deployYears = input.investmentPeriodYears

  const schedule: number[] = new Array(years).fill(0)

  switch (input.realizationScheduleType) {
    case 'linear':
      // Start realizing after year 3, linear to end
      for (let i = 3; i < years; i++) {
        schedule[i] = 1 / (years - 3)
      }
      break

    case 'j-curve':
      // Typical J-curve: minimal early, peak in middle, tail off
      // Year 1-2: 0%, Year 3-4: 10%, Year 5-6: 35%, Year 7-8: 30%, Year 9-10: 25%
      if (years === 10) {
        schedule[2] = 0.05
        schedule[3] = 0.05
        schedule[4] = 0.15
        schedule[5] = 0.20
        schedule[6] = 0.15
        schedule[7] = 0.15
        schedule[8] = 0.13
        schedule[9] = 0.12
      } else {
        // Approximation: start at year 3, peak in middle
        const startYear = Math.min(3, Math.floor(years / 3))
        const peakYear = Math.floor(years * 0.6)
        for (let i = startYear; i < years; i++) {
          if (i < peakYear) {
            schedule[i] = (i - startYear + 1) / ((years - startYear) * 3)
          } else {
            schedule[i] = (years - i) / ((years - startYear) * 2)
          }
        }
        // Normalize
        const sum = schedule.reduce((a, b) => a + b, 0)
        for (let i = 0; i < years; i++) {
          schedule[i] = schedule[i] / sum
        }
      }
      break

    case 'back-loaded':
      // Heavy realizations in final years
      for (let i = deployYears; i < years; i++) {
        const weight = (i - deployYears + 1)
        schedule[i] = weight
      }
      // Normalize
      const sum = schedule.reduce((a, b) => a + b, 0)
      for (let i = 0; i < years; i++) {
        schedule[i] = schedule[i] / sum
      }
      break
  }

  return schedule
}

/**
 * Calculate IRR using Newton's method
 */
function calculateIRR(cashFlows: number[]): number {
  // Initial guess
  let irr = 0.1
  const maxIterations = 100
  const tolerance = 0.0001

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + irr, t)
      dnpv -= t * cashFlows[t] / Math.pow(1 + irr, t + 1)
    }

    const newIRR = irr - npv / dnpv

    if (Math.abs(newIRR - irr) < tolerance) {
      return newIRR
    }

    irr = newIRR
  }

  return irr
}

/**
 * Main calculation function
 */
export function calculateSubscriptionLineImpact(
  input: SubscriptionLineInput
): SubscriptionLineOutput {
  const deploymentSchedule = generateDeploymentSchedule(input)
  const realizationSchedule = generateRealizationSchedule(input)

  const cashFlows: CashFlowYear[] = []
  const cashFlowsNoLine: number[] = []
  const cashFlowsWithLine: number[] = []

  // Calculate gross proceeds
  const totalInvested = input.fundSize
  const grossProceeds = totalInvested * input.grossMOIC

  let cumulativeCalledNoLine = 0
  let cumulativeDistributedNoLine = 0
  let cumulativeCalledWithLine = 0
  let cumulativeDistributedWithLine = 0
  let cumulativeInvestedCapital = 0 // Track actual invested capital (excluding fees)

  // Track total capital for MOIC calculation (investment + fees, excluding interest)
  // This ensures MOIC reflects return on actual capital invested, not financing costs
  let totalCapitalForMOIC_NoLine = 0
  let totalCapitalForMOIC_WithLine = 0

  let lineBalance = 0
  let totalInterestPaid = 0
  let totalManagementFees = 0

  const maxLineSize = input.fundSize * input.facilitySize
  const daysInYear = 365
  const maxDaysOut = input.maxDaysOutstanding

  // Year 0 (initial)
  cashFlowsNoLine.push(0)
  cashFlowsWithLine.push(0)

  // Calculate year-by-year cash flows
  for (let year = 1; year <= input.fundTermYears; year++) {
    const yearIndex = year - 1

    // Investment deployment (capital calls)
    const deploymentPct = yearIndex < deploymentSchedule.length ? deploymentSchedule[yearIndex] : 0
    const investmentAmount = totalInvested * deploymentPct

    // Realizations (distributions)
    const realizationPct = realizationSchedule[yearIndex] || 0
    const distributionAmount = grossProceeds * realizationPct

    // Management fees
    let managementFee = 0
    if (input.managementFeeBasis === 'commitments') {
      managementFee = input.fundSize * input.managementFeeRate
    } else {
      // Invested capital basis (fees calculated on actual invested capital, not including prior fees)
      const investedSoFar = cumulativeInvestedCapital + investmentAmount
      managementFee = investedSoFar * input.managementFeeRate
    }
    totalManagementFees += managementFee

    // Update cumulative invested capital (excluding fees)
    cumulativeInvestedCapital += investmentAmount

    // Scenario 1: No subscription line
    const capitalCallNoLine = investmentAmount + managementFee
    const distributionNoLine = distributionAmount

    cumulativeCalledNoLine += capitalCallNoLine
    cumulativeDistributedNoLine += distributionNoLine
    totalCapitalForMOIC_NoLine += investmentAmount + managementFee // Capital for MOIC excludes financing costs

    const netCashFlowNoLine = distributionNoLine - capitalCallNoLine
    cashFlowsNoLine.push(netCashFlowNoLine)

    // Scenario 2: With subscription line
    let capitalCallWithLine = 0
    let lineDraws = 0
    let lineRepayments = 0
    let interestPaid = 0

    if (input.useLine && yearIndex < input.investmentPeriodYears) {
      // During investment period, use line for capital calls
      const callAmount = investmentAmount + managementFee
      const availableLineCapacity = maxLineSize - lineBalance

      // Draw on line up to available capacity
      lineDraws = Math.min(callAmount, availableLineCapacity)
      capitalCallWithLine = callAmount - lineDraws

      lineBalance += lineDraws

      // Calculate interest on average balance for the actual days outstanding
      // Average balance = midpoint between beginning (before draw) and ending (after draw)
      const avgBalance = lineBalance - lineDraws / 2
      // Prorate interest based on max days outstanding (line shouldn't be out longer)
      const effectiveDays = Math.min(maxDaysOut, daysInYear)
      const annualInterest = avgBalance * input.interestRate * (effectiveDays / daysInYear)
      interestPaid = annualInterest
      totalInterestPaid += interestPaid

      // Repay line based on trigger
      if (input.repaymentTrigger === 'automatic' && lineBalance > 0) {
        // Repay after max days outstanding
        const repaymentRatio = Math.min(1, daysInYear / maxDaysOut)
        const scheduledRepayment = lineBalance * repaymentRatio

        // Use distributions to repay if available
        if (distributionAmount > 0) {
          lineRepayments = Math.min(lineBalance, distributionAmount)
          lineBalance -= lineRepayments
        } else if (scheduledRepayment > 0) {
          // Call capital to repay line
          lineRepayments = scheduledRepayment
          capitalCallWithLine += lineRepayments
          lineBalance -= lineRepayments
        }
      } else if (input.repaymentTrigger === 'distribution-funded' && distributionAmount > 0) {
        // Repay from distributions
        lineRepayments = Math.min(lineBalance, distributionAmount)
        lineBalance -= lineRepayments
      }

      // Pay interest from capital call
      capitalCallWithLine += interestPaid
    } else {
      // After investment period or if not using line
      capitalCallWithLine = investmentAmount + managementFee

      // Handle any remaining line balance from investment period
      if (lineBalance > 0) {
        // Calculate interest on remaining balance (prorated like during investment period)
        const effectiveDays = Math.min(maxDaysOut, daysInYear)
        interestPaid = lineBalance * input.interestRate * (effectiveDays / daysInYear)
        totalInterestPaid += interestPaid

        // Repay line balance (distributions first, then capital call if needed)
        if (distributionAmount > 0) {
          lineRepayments = Math.min(lineBalance, distributionAmount)
          lineBalance -= lineRepayments
        } else if (input.repaymentTrigger === 'automatic') {
          // Even after investment period, line must be repaid to respect maxDaysOut
          lineRepayments = lineBalance
          capitalCallWithLine += lineRepayments
          lineBalance = 0
        }

        // Add interest to capital call
        capitalCallWithLine += interestPaid
      }
    }

    const distributionWithLine = Math.max(0, distributionAmount - lineRepayments)

    cumulativeCalledWithLine += capitalCallWithLine
    cumulativeDistributedWithLine += distributionWithLine
    // Capital for MOIC: investment + fees only, exclude interest and line repayments
    // (line repayments aren't new capital, they're repaying borrowed amounts)
    totalCapitalForMOIC_WithLine += investmentAmount + managementFee

    const netCashFlowWithLine = distributionWithLine - capitalCallWithLine
    cashFlowsWithLine.push(netCashFlowWithLine)

    // Store year data
    cashFlows.push({
      year,
      capitalCallsNoLine: capitalCallNoLine,
      distributionsNoLine: distributionNoLine,
      managementFeesNoLine: managementFee,
      capitalCallsWithLine: capitalCallWithLine,
      distributionsWithLine: distributionWithLine,
      managementFeesWithLine: managementFee,
      lineDraws: lineDraws,
      lineRepayments: lineRepayments,
      interestPaid: interestPaid,
      lineBalance: lineBalance,
      cumulativeCalledNoLine,
      cumulativeDistributedNoLine,
      cumulativeCalledWithLine,
      cumulativeDistributedWithLine,
      netCashFlowNoLine,
      netCashFlowWithLine
    })
  }

  // Calculate performance metrics
  const irrNoLine = calculateIRR(cashFlowsNoLine)
  const irrWithLine = calculateIRR(cashFlowsWithLine)

  // MOIC calculation: distributions / (investment + fees), excluding interest
  // This gives an accurate picture of return on invested capital
  // Using totalCapitalForMOIC to exclude interest expense from denominator
  const moicNoLine = cumulativeDistributedNoLine / totalCapitalForMOIC_NoLine
  const moicWithLine = cumulativeDistributedWithLine / totalCapitalForMOIC_WithLine

  const tvpiNoLine = cumulativeDistributedNoLine / input.fundSize
  const tvpiWithLine = cumulativeDistributedWithLine / input.fundSize

  const dpiNoLine = cumulativeDistributedNoLine / input.fundSize
  const dpiWithLine = cumulativeDistributedWithLine / input.fundSize

  // Calculate impact metrics
  const irrBoost = (irrWithLine - irrNoLine) * 10000 // Basis points
  const moicDrag = ((moicNoLine - moicWithLine) / moicNoLine) * 100 // Percentage
  const feeDrag = (totalManagementFees + totalInterestPaid) / grossProceeds * 100

  // Generate J-curve data (cumulative NAV over time)
  const jCurveDataNoLine: { year: number; nav: number }[] = []
  const jCurveDataWithLine: { year: number; nav: number }[] = []

  let navNoLine = 0
  let navWithLine = 0

  jCurveDataNoLine.push({ year: 0, nav: 0 })
  jCurveDataWithLine.push({ year: 0, nav: 0 })

  for (let i = 0; i < cashFlows.length; i++) {
    navNoLine += cashFlows[i].netCashFlowNoLine
    navWithLine += cashFlows[i].netCashFlowWithLine

    jCurveDataNoLine.push({ year: i + 1, nav: navNoLine })
    jCurveDataWithLine.push({ year: i + 1, nav: navWithLine })
  }

  // Calculate capital efficiency
  const avgDaysCapitalOutstanding = (cumulativeCalledWithLine / cumulativeCalledNoLine) * 365
  const capitalEfficiency = (1 - cumulativeCalledWithLine / cumulativeCalledNoLine) * 100

  return {
    input,
    cashFlows,
    irrNoLine,
    moicNoLine,
    tvpiNoLine,
    dpiNoLine,
    irrWithLine,
    moicWithLine,
    tvpiWithLine,
    dpiWithLine,
    irrBoost,
    moicDrag,
    totalInterestPaid,
    totalManagementFees,
    feeDrag,
    jCurveDataNoLine,
    jCurveDataWithLine,
    avgDaysCapitalOutstanding,
    capitalEfficiency
  }
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format basis points
 */
export function formatBasisPoints(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)} bps`
}

/**
 * Format multiple (e.g., 2.5x)
 */
export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`
}
