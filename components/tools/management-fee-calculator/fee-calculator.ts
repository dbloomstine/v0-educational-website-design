import { FundInputs, FeePhase, YearlyFeeData, FeeCalculationResult, FeeBase } from './types'

/**
 * Calculate the base amount for a given year based on the fee base type
 */
function calculateBaseAmount(
  year: number,
  feeBase: FeeBase,
  fundInputs: FundInputs
): number {
  const { fundSize, investmentPeriod, navGrowthRate = 0 } = fundInputs

  switch (feeBase) {
    case 'Committed Capital':
      return fundSize

    case 'Invested Cost':
      // Assume capital is invested linearly during investment period
      if (year <= investmentPeriod) {
        return fundSize * (year / investmentPeriod)
      }
      return fundSize

    case 'Net Asset Value (NAV)':
      // Simple NAV calculation: starts at invested cost, grows by navGrowthRate
      if (year <= investmentPeriod) {
        const invested = fundSize * (year / investmentPeriod)
        const yearsGrowing = Math.max(0, year - 1)
        return invested * Math.pow(1 + navGrowthRate / 100, yearsGrowing)
      } else {
        // After investment period, NAV grows from fully invested amount
        const yearsGrowing = year - 1
        return fundSize * Math.pow(1 + navGrowthRate / 100, yearsGrowing)
      }

    case 'Lower of Cost or Fair Value':
      // Conservative approach: use invested cost as floor
      const investedCost = year <= investmentPeriod
        ? fundSize * (year / investmentPeriod)
        : fundSize

      const fairValue = year <= investmentPeriod
        ? investedCost * Math.pow(1 + navGrowthRate / 100, Math.max(0, year - 1))
        : fundSize * Math.pow(1 + navGrowthRate / 100, year - 1)

      return Math.min(investedCost, fairValue)

    default:
      return fundSize
  }
}

/**
 * Find the applicable fee phase for a given year
 */
function getFeePhaseForYear(year: number, feePhases: FeePhase[]): FeePhase | null {
  return feePhases.find(phase => year >= phase.startYear && year <= phase.endYear) || null
}

/**
 * Calculate management fees for all years
 */
export function calculateManagementFees(
  fundInputs: FundInputs,
  feePhases: FeePhase[]
): FeeCalculationResult {
  const yearlyData: YearlyFeeData[] = []
  let cumulativeFees = 0

  // Calculate fees for each year
  for (let year = 1; year <= fundInputs.fundTerm; year++) {
    const phase = getFeePhaseForYear(year, feePhases)

    if (!phase) {
      // No phase defined for this year - use 0 fees
      yearlyData.push({
        year,
        feeBase: 'Committed Capital',
        baseAmount: 0,
        feeRate: 0,
        feeAmount: 0,
        cumulativeFees,
        feesAsPercentOfCommitments: (cumulativeFees / fundInputs.fundSize) * 100
      })
      continue
    }

    const baseAmount = calculateBaseAmount(year, phase.feeBase, fundInputs)
    const feeAmount = (baseAmount * phase.feeRate) / 100
    cumulativeFees += feeAmount

    yearlyData.push({
      year,
      feeBase: phase.feeBase,
      baseAmount,
      feeRate: phase.feeRate,
      feeAmount,
      cumulativeFees,
      feesAsPercentOfCommitments: (cumulativeFees / fundInputs.fundSize) * 100
    })
  }

  // Calculate summary metrics
  const totalFees = cumulativeFees
  const averageAnnualFeePercent = (totalFees / fundInputs.fundSize / fundInputs.fundTerm) * 100

  const midpoint = Math.floor(fundInputs.fundTerm / 2)
  const firstHalfFees = yearlyData
    .filter(d => d.year <= midpoint)
    .reduce((sum, d) => sum + d.feeAmount, 0)
  const secondHalfFees = totalFees - firstHalfFees

  const feesAsPercentOfCommitments = (totalFees / fundInputs.fundSize) * 100

  return {
    yearlyData,
    totalFees,
    averageAnnualFeePercent,
    firstHalfFees,
    secondHalfFees,
    feesAsPercentOfCommitments
  }
}

/**
 * Validate fee phases to ensure they don't overlap and cover the full term
 */
export function validateFeePhases(
  feePhases: FeePhase[],
  fundTerm: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (feePhases.length === 0) {
    errors.push('At least one fee phase is required')
    return { valid: false, errors }
  }

  // Sort phases by start year
  const sortedPhases = [...feePhases].sort((a, b) => a.startYear - b.startYear)

  // Check each phase
  sortedPhases.forEach((phase, index) => {
    // Validate year range
    if (phase.startYear > phase.endYear) {
      errors.push(`Phase ${index + 1}: Start year must be before or equal to end year`)
    }

    if (phase.startYear < 1 || phase.endYear > fundTerm) {
      errors.push(`Phase ${index + 1}: Years must be between 1 and ${fundTerm}`)
    }

    // Check for overlaps with previous phase
    if (index > 0) {
      const prevPhase = sortedPhases[index - 1]
      if (phase.startYear <= prevPhase.endYear) {
        errors.push(`Phase ${index + 1}: Overlaps with previous phase`)
      }

      // Check for gaps
      if (phase.startYear > prevPhase.endYear + 1) {
        errors.push(`Gap between phase ${index} and phase ${index + 1}`)
      }
    }

    // Validate fee rate
    if (phase.feeRate < 0 || phase.feeRate > 10) {
      errors.push(`Phase ${index + 1}: Fee rate should be between 0% and 10%`)
    }
  })

  // Check if first phase starts at year 1
  if (sortedPhases[0].startYear !== 1) {
    errors.push('First phase must start at year 1')
  }

  // Check if last phase covers the final year
  if (sortedPhases[sortedPhases.length - 1].endYear !== fundTerm) {
    errors.push(`Last phase must end at year ${fundTerm}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate default fee phases for a given fund configuration
 */
export function generateDefaultFeePhases(fundInputs: FundInputs): FeePhase[] {
  const { investmentPeriod, fundTerm } = fundInputs

  const phases: FeePhase[] = []

  // Phase 1: Investment period - higher fees on committed capital
  phases.push({
    id: 'phase-1',
    startYear: 1,
    endYear: investmentPeriod,
    feeBase: 'Committed Capital',
    feeRate: 2.0
  })

  // Phase 2: Post-investment period - lower fees on invested cost
  if (investmentPeriod < fundTerm) {
    phases.push({
      id: 'phase-2',
      startYear: investmentPeriod + 1,
      endYear: fundTerm,
      feeBase: 'Invested Cost',
      feeRate: 1.5
    })
  }

  return phases
}

/**
 * Generate a text summary of the fee calculation
 */
export function generateFeeSummary(
  fundInputs: FundInputs,
  result: FeeCalculationResult
): string {
  const { fundSize, fundTerm, fundType } = fundInputs
  const { totalFees, feesAsPercentOfCommitments, firstHalfFees, secondHalfFees } = result

  return `For a $${fundSize.toFixed(0)}M ${fundType} fund with a ${fundTerm}-year term and this fee schedule, total management fees are estimated at $${totalFees.toFixed(2)}M over the life of the fund, or about ${feesAsPercentOfCommitments.toFixed(1)}% of total commitments. Fees are highest during the first half of the fund term ($${firstHalfFees.toFixed(2)}M) compared to the second half ($${secondHalfFees.toFixed(2)}M).`
}
