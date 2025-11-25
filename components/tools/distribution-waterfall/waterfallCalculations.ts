// Distribution Waterfall Calculations
// Based on market-standard private equity waterfall mechanics
// Sources: Carta, iCapital, Allvue Systems, Moonfare 2024

export interface WaterfallInput {
  // Fund basics
  fundSize: number
  contributedCapital: number
  grossProceeds: number

  // Structure
  waterfallType: 'european' | 'american'

  // Economic terms
  prefRate: number // Annual preferred return (e.g., 0.08 for 8%)
  prefCompounding: 'simple' | 'compound'
  carryRate: number // GP carry percentage (e.g., 0.20 for 20%)
  catchUpRate: number // Percentage GP gets during catch-up (e.g., 1.0 for 100%, 0.5 for 50%)
  hasCatchUp: boolean

  // Timing
  yearsToExit: number // For pref calculation

  // GP commitment
  gpCommitmentPercent: number // GP's LP commitment as % of fund
}

export interface TierResult {
  tier: number
  name: string
  description: string
  toLPs: number
  toGP: number
  total: number
  cumulativeLPs: number
  cumulativeGP: number
  cumulativeTotal: number
}

export interface WaterfallOutput {
  // Input summary
  input: WaterfallInput

  // Tier-by-tier breakdown
  tiers: TierResult[]

  // Summary totals
  totalToLPs: number
  totalToGP: number
  totalDistributed: number

  // Metrics
  lpMultiple: number // LP MOIC
  gpMultiple: number // GP MOIC on their commitment
  effectiveCarryRate: number // GP share of total profits

  // Profit calculation
  totalProfit: number
  lpProfit: number
  gpProfit: number
}

// Default input values
export const defaultInput: WaterfallInput = {
  fundSize: 100000000,
  contributedCapital: 100000000,
  grossProceeds: 200000000,
  waterfallType: 'european',
  prefRate: 0.08,
  prefCompounding: 'simple',
  carryRate: 0.20,
  catchUpRate: 1.0,
  hasCatchUp: true,
  yearsToExit: 5,
  gpCommitmentPercent: 0.01
}

/**
 * Calculate preferred return amount
 */
function calculatePrefReturn(
  contributedCapital: number,
  prefRate: number,
  years: number,
  compounding: 'simple' | 'compound'
): number {
  if (compounding === 'simple') {
    return contributedCapital * prefRate * years
  } else {
    // Compound: FV = PV * (1 + r)^n - PV
    return contributedCapital * (Math.pow(1 + prefRate, years) - 1)
  }
}

/**
 * Calculate European (whole-fund) waterfall
 * Tier 1: Return of capital to LPs
 * Tier 2: Preferred return to LPs
 * Tier 3: GP catch-up (if applicable)
 * Tier 4: Ongoing split (LP/GP at carry rate)
 */
function calculateEuropeanWaterfall(input: WaterfallInput): WaterfallOutput {
  const tiers: TierResult[] = []
  let remaining = input.grossProceeds
  let cumulativeLPs = 0
  let cumulativeGP = 0

  // GP commitment as LP
  const gpAsLP = input.contributedCapital * input.gpCommitmentPercent
  const lpOnlyCapital = input.contributedCapital - gpAsLP

  // Tier 1: Return of capital to LPs (including GP as LP)
  const tier1Amount = Math.min(remaining, input.contributedCapital)
  const tier1ToLPs = tier1Amount * (lpOnlyCapital / input.contributedCapital)
  const tier1ToGP = tier1Amount * (gpAsLP / input.contributedCapital)

  cumulativeLPs += tier1ToLPs
  cumulativeGP += tier1ToGP
  remaining -= tier1Amount

  tiers.push({
    tier: 1,
    name: 'Return of Capital',
    description: 'Return of contributed capital to all investors (LPs + GP commitment)',
    toLPs: tier1ToLPs,
    toGP: tier1ToGP,
    total: tier1Amount,
    cumulativeLPs,
    cumulativeGP,
    cumulativeTotal: cumulativeLPs + cumulativeGP
  })

  if (remaining <= 0) {
    return buildOutput(input, tiers, cumulativeLPs, cumulativeGP, lpOnlyCapital, gpAsLP)
  }

  // Tier 2: Preferred return to LPs
  const prefAmount = calculatePrefReturn(
    input.contributedCapital,
    input.prefRate,
    input.yearsToExit,
    input.prefCompounding
  )

  const tier2Amount = Math.min(remaining, prefAmount)
  const tier2ToLPs = tier2Amount * (lpOnlyCapital / input.contributedCapital)
  const tier2ToGP = tier2Amount * (gpAsLP / input.contributedCapital)

  cumulativeLPs += tier2ToLPs
  cumulativeGP += tier2ToGP
  remaining -= tier2Amount

  tiers.push({
    tier: 2,
    name: 'Preferred Return',
    description: `${(input.prefRate * 100).toFixed(1)}% annual ${input.prefCompounding} preferred return to all investors`,
    toLPs: tier2ToLPs,
    toGP: tier2ToGP,
    total: tier2Amount,
    cumulativeLPs,
    cumulativeGP,
    cumulativeTotal: cumulativeLPs + cumulativeGP
  })

  if (remaining <= 0 || !input.hasCatchUp) {
    // If no catch-up, go straight to ongoing split
    if (remaining > 0 && !input.hasCatchUp) {
      const tier4ToGP = remaining * input.carryRate
      const tier4ToLPs = remaining - tier4ToGP

      cumulativeLPs += tier4ToLPs
      cumulativeGP += tier4ToGP

      tiers.push({
        tier: 4,
        name: 'Ongoing Profit Split',
        description: `${((1 - input.carryRate) * 100).toFixed(0)}/${(input.carryRate * 100).toFixed(0)} LP/GP split of remaining profits`,
        toLPs: tier4ToLPs,
        toGP: tier4ToGP,
        total: remaining,
        cumulativeLPs,
        cumulativeGP,
        cumulativeTotal: cumulativeLPs + cumulativeGP
      })
    }

    return buildOutput(input, tiers, cumulativeLPs, cumulativeGP, lpOnlyCapital, gpAsLP)
  }

  // Tier 3: GP catch-up
  // Calculate how much GP needs to "catch up" to reach their target carry percentage
  // Target: GP should have (carry rate) of total profits after pref
  const profitsAfterPref = input.grossProceeds - input.contributedCapital - prefAmount
  const gpTargetShare = profitsAfterPref * input.carryRate
  const gpCurrentShare = cumulativeGP - gpAsLP // Subtract their LP commitment
  const gpCatchUpNeeded = Math.max(0, gpTargetShare - gpCurrentShare)

  const tier3Amount = Math.min(remaining, gpCatchUpNeeded / input.catchUpRate)
  const tier3ToGP = tier3Amount * input.catchUpRate
  const tier3ToLPs = tier3Amount - tier3ToGP

  cumulativeLPs += tier3ToLPs
  cumulativeGP += tier3ToGP
  remaining -= tier3Amount

  tiers.push({
    tier: 3,
    name: 'GP Catch-Up',
    description: `${(input.catchUpRate * 100).toFixed(0)}% to GP until they reach ${(input.carryRate * 100).toFixed(0)}% of profits`,
    toLPs: tier3ToLPs,
    toGP: tier3ToGP,
    total: tier3Amount,
    cumulativeLPs,
    cumulativeGP,
    cumulativeTotal: cumulativeLPs + cumulativeGP
  })

  if (remaining <= 0) {
    return buildOutput(input, tiers, cumulativeLPs, cumulativeGP, lpOnlyCapital, gpAsLP)
  }

  // Tier 4: Ongoing split
  const tier4ToGP = remaining * input.carryRate
  const tier4ToLPs = remaining - tier4ToGP

  cumulativeLPs += tier4ToLPs
  cumulativeGP += tier4ToGP

  tiers.push({
    tier: 4,
    name: 'Ongoing Profit Split',
    description: `${((1 - input.carryRate) * 100).toFixed(0)}/${(input.carryRate * 100).toFixed(0)} LP/GP split of remaining profits`,
    toLPs: tier4ToLPs,
    toGP: tier4ToGP,
    total: remaining,
    cumulativeLPs,
    cumulativeGP,
    cumulativeTotal: cumulativeLPs + cumulativeGP
  })

  return buildOutput(input, tiers, cumulativeLPs, cumulativeGP, lpOnlyCapital, gpAsLP)
}

/**
 * Calculate American (deal-by-deal) waterfall
 * For simplicity, we model this as a single deal with the same tier structure,
 * but note that in practice, GP can take carry on individual deals
 */
function calculateAmericanWaterfall(input: WaterfallInput): WaterfallOutput {
  // For a single aggregated deal, American waterfall follows same tier structure
  // The key difference in practice is that GP can take carry deal-by-deal
  // without waiting for entire fund to return capital + pref

  // We'll use the same calculation but add a note in the description
  const result = calculateEuropeanWaterfall(input)

  // Add note about American structure
  result.tiers[0].description += ' (In American waterfall, this is calculated per-deal, not at fund level)'

  return result
}

/**
 * Build final output with calculated metrics
 */
function buildOutput(
  input: WaterfallInput,
  tiers: TierResult[],
  totalToLPs: number,
  totalToGP: number,
  lpOnlyCapital: number,
  gpAsLP: number
): WaterfallOutput {
  const totalDistributed = totalToLPs + totalToGP
  const totalProfit = input.grossProceeds - input.contributedCapital
  const lpProfit = totalToLPs - lpOnlyCapital
  const gpProfit = totalToGP - gpAsLP

  // Calculate multiples
  const lpMultiple = lpOnlyCapital > 0 ? totalToLPs / lpOnlyCapital : 0
  const gpMultiple = gpAsLP > 0 ? totalToGP / gpAsLP : 0

  // Effective carry rate = GP's share of total profits
  const effectiveCarryRate = totalProfit > 0 ? gpProfit / totalProfit : 0

  return {
    input,
    tiers,
    totalToLPs,
    totalToGP,
    totalDistributed,
    lpMultiple,
    gpMultiple,
    effectiveCarryRate,
    totalProfit,
    lpProfit,
    gpProfit
  }
}

/**
 * Main calculation function
 */
export function calculateWaterfall(input: WaterfallInput): WaterfallOutput {
  if (input.waterfallType === 'european') {
    return calculateEuropeanWaterfall(input)
  } else {
    return calculateAmericanWaterfall(input)
  }
}

/**
 * Calculate waterfall for multiple scenarios
 */
export function calculateMultipleScenarios(
  input: WaterfallInput,
  proceedsScenarios: number[]
): WaterfallOutput[] {
  return proceedsScenarios.map(proceeds =>
    calculateWaterfall({ ...input, grossProceeds: proceeds })
  )
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
 * Format multiple (e.g., 2.5x)
 */
export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`
}
