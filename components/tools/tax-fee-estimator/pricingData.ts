// Types and interfaces
export interface TaxInput {
  fundType: string
  fundSize: string
  strategyComplexity: string
  domicile: string

  // Structure
  mainFunds: number
  parallelFunds: number
  aivCount: number
  blockerCount: number
  gpEntities: number
  managementCo: boolean

  // Investors
  investorCount: string
  stateCount: string
  foreignInvestors: boolean
  erisa: boolean

  // Special reporting
  pfic: boolean
  cfc: boolean
  withholding: boolean
  fatca: boolean

  // Service scope
  quarterlyEstimates: boolean
  planningMeetings: string
  amendments: boolean
  providerTier: string
  serviceLevel: string
}

export interface PricingOutput {
  lowEstimate: number
  mediumEstimate: number
  highEstimate: number
  breakdown: FeeComponent[]
  drivers: CostDriver[]
}

export interface FeeComponent {
  category: string
  description: string
  low: number
  medium: number
  high: number
}

export interface CostDriver {
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

// Default input values (sample emerging VC fund)
export const defaultInput: TaxInput = {
  fundType: 'venture-capital',
  fundSize: '50-150',
  strategyComplexity: 'moderate',
  domicile: 'us-only',

  mainFunds: 1,
  parallelFunds: 0,
  aivCount: 0,
  blockerCount: 0,
  gpEntities: 1,
  managementCo: false,

  investorCount: '11-30',
  stateCount: '3-5',
  foreignInvestors: false,
  erisa: false,

  pfic: false,
  cfc: false,
  withholding: false,
  fatca: false,

  quarterlyEstimates: false,
  planningMeetings: 'basic',
  amendments: false,
  providerTier: 'mid-market',
  serviceLevel: 'compliance'
}

// Base fund return pricing (Form 1065)
// Research: Market data shows $800-1,500 for generic partnerships, but fund returns are 5-10x more complex
// Mid-tier firms: Small funds $8-12k, medium $12-25k, large $25-50k+
// Validated against: Dimov Tax CPA pricing, Anchin fund cost survey ($75-100k total admin+tax)
const baseFundReturn: Record<string, Record<string, number>> = {
  'venture-capital': {
    'under-50': 9000,      // Reduced from 10k
    '50-150': 13000,       // Reduced from 15k
    '150-500': 24000,      // Reduced from 28k
    '500-plus': 40000      // Reduced from 45k
  },
  'pe-buyout': {
    'under-50': 10000,     // Reduced from 12k
    '50-150': 16000,       // Reduced from 18k
    '150-500': 30000,      // Reduced from 35k
    '500-plus': 48000      // Reduced from 55k
  },
  'private-credit': {
    'under-50': 12000,     // Reduced from 14k
    '50-150': 19000,       // Reduced from 22k
    '150-500': 36000,      // Reduced from 42k
    '500-plus': 56000      // Reduced from 65k
  },
  'hedge-fund': {
    'under-50': 11000,     // Reduced from 13k
    '50-150': 17000,       // Reduced from 20k
    '150-500': 33000,      // Reduced from 38k
    '500-plus': 52000      // Reduced from 60k
  },
  'real-estate': {
    'under-50': 10000,     // Reduced from 12k
    '50-150': 16000,       // Reduced from 18k
    '150-500': 30000,      // Reduced from 35k
    '500-plus': 48000      // Reduced from 55k
  },
  'fund-of-funds': {
    'under-50': 13000,     // Reduced from 15k
    '50-150': 22000,       // Reduced from 25k
    '150-500': 39000,      // Reduced from 45k
    '500-plus': 60000      // Reduced from 70k
  },
  'fund-of-one': {
    'under-50': 7000,      // Reduced from 8k
    '50-150': 10000,       // Reduced from 12k
    '150-500': 19000,      // Reduced from 22k
    '500-plus': 30000      // Reduced from 35k
  },
  'other': {
    'under-50': 10000,     // Reduced from 12k
    '50-150': 16000,       // Reduced from 18k
    '150-500': 30000,      // Reduced from 35k
    '500-plus': 48000      // Reduced from 55k
  }
}

// Per-investor K-1 costs
// Market research: $150-$1,000 per K-1 depending on complexity
// Volume discounts apply for larger investor bases
const k1Costs: Record<string, { simple: number, moderate: number, complex: number }> = {
  'under-10': { simple: 140, moderate: 230, complex: 450 },   // Slightly reduced
  '11-30': { simple: 110, moderate: 185, complex: 370 },      // Slightly reduced
  '31-75': { simple: 95, moderate: 165, complex: 320 },       // Slightly reduced
  '76-150': { simple: 80, moderate: 145, complex: 280 },      // Reduced more for volume
  '150-plus': { simple: 70, moderate: 130, complex: 250 }     // Reduced more for volume
}

// Provider tier multipliers
const providerMultipliers: Record<string, number> = {
  'boutique': 0.85,
  'mid-market': 1.0,
  'big-4': 1.35
}

// Main calculation function
export function calculateTaxPricing(input: TaxInput): PricingOutput {
  const breakdown: FeeComponent[] = []
  const drivers: CostDriver[] = []

  // 1. Base fund return(s)
  const baseFee = baseFundReturn[input.fundType][input.fundSize]
  const numMainReturns = input.mainFunds
  const mainFundsFee = baseFee * numMainReturns

  breakdown.push({
    category: 'Main Fund Return(s)',
    description: `Form 1065 preparation for ${numMainReturns} main fund${numMainReturns > 1 ? 's' : ''}`,
    low: Math.round(mainFundsFee * 0.85),
    medium: mainFundsFee,
    high: Math.round(mainFundsFee * 1.20)
  })

  // 2. Parallel funds / AIVs
  if (input.parallelFunds > 0) {
    const parallelFee = Math.round(baseFee * 0.60) * input.parallelFunds
    breakdown.push({
      category: 'Parallel Funds',
      description: `${input.parallelFunds} parallel fund return(s)`,
      low: Math.round(parallelFee * 0.85),
      medium: parallelFee,
      high: Math.round(parallelFee * 1.20)
    })
    drivers.push({
      title: 'Parallel Fund Structure',
      description: `Each parallel fund requires separate Form 1065 preparation and investor allocations, adding approximately ${formatCurrency(Math.round(baseFee * 0.60))} per fund.`,
      impact: 'negative'
    })
  }

  if (input.aivCount > 0) {
    const aivFee = Math.round(baseFee * 0.50) * input.aivCount
    breakdown.push({
      category: 'Alternative Investment Vehicles (AIVs)',
      description: `${input.aivCount} AIV return(s)`,
      low: Math.round(aivFee * 0.85),
      medium: aivFee,
      high: Math.round(aivFee * 1.20)
    })
    drivers.push({
      title: 'AIV Structure',
      description: `${input.aivCount} AIV${input.aivCount > 1 ? 's' : ''} require separate tax returns and coordination with main fund allocations.`,
      impact: 'negative'
    })
  }

  // 3. Blocker corporations
  // Market data: C-corp returns $1,000-2,000 generic, but fund blockers are specialized
  // Blocker corps require coordination with partnership and are more complex
  if (input.blockerCount > 0) {
    const blockerFeeEach = input.strategyComplexity === 'complex' ? 4500 : input.strategyComplexity === 'moderate' ? 3000 : 2000
    const totalBlockerFee = blockerFeeEach * input.blockerCount
    breakdown.push({
      category: 'Blocker Corporations',
      description: `${input.blockerCount} blocker corp tax return(s) (Form 1120)`,
      low: Math.round(totalBlockerFee * 0.85),
      medium: totalBlockerFee,
      high: Math.round(totalBlockerFee * 1.25)
    })
    drivers.push({
      title: 'Blocker Entities',
      description: `Blocker corporations require C-corp tax returns (Form 1120), state filings, and coordination with partnership allocations, adding ${formatCurrency(blockerFeeEach)} per blocker.`,
      impact: 'negative'
    })
  }

  // 4. GP/Carry vehicles
  if (input.gpEntities > 0) {
    const gpFeeEach = 2500    // Reduced from 3000
    const totalGPFee = gpFeeEach * input.gpEntities
    breakdown.push({
      category: 'GP / Carry Vehicles',
      description: `${input.gpEntities} GP/carry entity return(s)`,
      low: Math.round(totalGPFee * 0.85),
      medium: totalGPFee,
      high: Math.round(totalGPFee * 1.20)
    })
  }

  // 5. Management company (if in scope)
  if (input.managementCo) {
    const mgmtCoFee = 3000    // Reduced from 3500
    breakdown.push({
      category: 'Management Company',
      description: 'Management company corporate return',
      low: Math.round(mgmtCoFee * 0.85),
      medium: mgmtCoFee,
      high: Math.round(mgmtCoFee * 1.20)
    })
  }

  // 6. Investor K-1s
  const investorBand = input.investorCount
  const investorCountMid = getInvestorCountMidpoint(investorBand)
  const complexityLevel = input.strategyComplexity === 'complex' ? 'complex' :
                          input.strategyComplexity === 'moderate' ? 'moderate' : 'simple'
  const k1Cost = k1Costs[investorBand][complexityLevel]
  const totalK1Fee = k1Cost * investorCountMid

  breakdown.push({
    category: 'Investor K-1 Preparation',
    description: `~${investorCountMid} K-1s at ${formatCurrency(k1Cost)} each`,
    low: Math.round(totalK1Fee * 0.85),
    medium: totalK1Fee,
    high: Math.round(totalK1Fee * 1.20)
  })

  if (investorCountMid > 50) {
    drivers.push({
      title: 'Large Investor Base',
      description: `With approximately ${investorCountMid} investors, K-1 preparation and delivery becomes a significant component of tax compliance costs.`,
      impact: 'negative'
    })
  }

  // 7. State filings
  const stateCountMid = getStateCountMidpoint(input.stateCount)
  if (stateCountMid > 1) {
    const stateFeeEach = 650    // Reduced from 800
    const totalStateFee = stateFeeEach * stateCountMid
    breakdown.push({
      category: 'State Tax Filings',
      description: `${stateCountMid} state filing(s)`,
      low: Math.round(totalStateFee * 0.80),
      medium: totalStateFee,
      high: Math.round(totalStateFee * 1.30)
    })
    if (stateCountMid > 5) {
      drivers.push({
        title: 'Multi-State Compliance',
        description: `Operating across ${stateCountMid} states requires separate state returns, composite filings, and state-specific adjustments.`,
        impact: 'negative'
      })
    }
  }

  // 8. Foreign investor reporting
  if (input.foreignInvestors) {
    const foreignFee = input.withholding ? 6000 : 3000
    breakdown.push({
      category: 'Foreign Investor Reporting',
      description: input.withholding ? 'Forms 1042/1042-S, withholding calculations' : 'Basic foreign investor compliance',
      low: Math.round(foreignFee * 0.85),
      medium: foreignFee,
      high: Math.round(foreignFee * 1.25)
    })
    drivers.push({
      title: 'Non-U.S. Investors',
      description: `Foreign investors require Form 1042-S reporting${input.withholding ? ', withholding tax calculations (§1446), and potential treaty analysis' : ' and coordination'}, adding complexity and cost.`,
      impact: 'negative'
    })
  }

  // 9. PFIC reporting
  if (input.pfic) {
    const pficFee = 2500 // Assumes 5-10 PFICs at $250-500 each
    breakdown.push({
      category: 'PFIC Reporting',
      description: 'Form 8621 preparation for passive foreign investments',
      low: Math.round(pficFee * 0.75),
      medium: pficFee,
      high: Math.round(pficFee * 1.50)
    })
    drivers.push({
      title: 'PFIC Complexity',
      description: 'Passive Foreign Investment Companies require detailed Form 8621 filings with QEF elections, mark-to-market calculations, or excess distribution reporting—highly specialized and time-intensive work.',
      impact: 'negative'
    })
  }

  // 10. CFC reporting
  if (input.cfc) {
    const cfcFee = 4000 // Form 5471 per CFC
    breakdown.push({
      category: 'CFC Reporting',
      description: 'Form 5471 for controlled foreign corporations',
      low: Math.round(cfcFee * 0.80),
      medium: cfcFee,
      high: Math.round(cfcFee * 1.40)
    })
    drivers.push({
      title: 'Controlled Foreign Corporations',
      description: 'CFCs require Form 5471 with multiple schedules, Subpart F income calculations, and potential GILTI computations—adding $2,000-$5,000+ per CFC depending on complexity.',
      impact: 'negative'
    })
  }

  // 11. FATCA/CRS
  if (input.fatca) {
    const fatcaFee = 2000
    breakdown.push({
      category: 'FATCA / CRS Compliance',
      description: 'Foreign account reporting compliance',
      low: Math.round(fatcaFee * 0.85),
      medium: fatcaFee,
      high: Math.round(fatcaFee * 1.20)
    })
  }

  // 12. Quarterly estimates
  if (input.quarterlyEstimates) {
    const quarterlyFee = 2500
    breakdown.push({
      category: 'Quarterly Estimated Tax Calculations',
      description: '4 quarterly estimate calculations',
      low: Math.round(quarterlyFee * 0.85),
      medium: quarterlyFee,
      high: Math.round(quarterlyFee * 1.20)
    })
    drivers.push({
      title: 'Quarterly Tax Estimates',
      description: 'Providing quarterly estimated tax calculations requires mid-year financial projections and investor-level allocations four times per year.',
      impact: 'negative'
    })
  }

  // 13. Planning/advisory meetings
  if (input.planningMeetings !== 'none') {
    const meetingFee = input.planningMeetings === 'extensive' ? 8000 :
                       input.planningMeetings === 'moderate' ? 4000 : 2000
    breakdown.push({
      category: 'Tax Planning & Advisory',
      description: `${input.planningMeetings.charAt(0).toUpperCase() + input.planningMeetings.slice(1)} planning meetings`,
      low: Math.round(meetingFee * 0.80),
      medium: meetingFee,
      high: Math.round(meetingFee * 1.30)
    })
    if (input.planningMeetings !== 'basic') {
      drivers.push({
        title: 'Tax Planning Services',
        description: `${input.planningMeetings === 'extensive' ? 'Extensive' : 'Moderate'} tax planning and advisory meetings provide proactive structuring guidance, transaction modeling, and strategic tax advice beyond basic compliance.`,
        impact: input.serviceLevel === 'planning' ? 'neutral' : 'negative'
      })
    }
  }

  // 14. Amendment budget
  if (input.amendments) {
    const amendmentFee = Math.round(mainFundsFee * 0.40)
    breakdown.push({
      category: 'Amendment Budget',
      description: 'Budget for potential amendments/restatements',
      low: Math.round(amendmentFee * 0.50),
      medium: amendmentFee,
      high: Math.round(amendmentFee * 1.50)
    })
  }

  // Calculate totals
  const lowTotal = breakdown.reduce((sum, item) => sum + item.low, 0)
  const mediumTotal = breakdown.reduce((sum, item) => sum + item.medium, 0)
  const highTotal = breakdown.reduce((sum, item) => sum + item.high, 0)

  // Apply provider tier multiplier
  const providerMultiplier = providerMultipliers[input.providerTier]

  // Add general drivers
  if (input.strategyComplexity === 'complex') {
    drivers.push({
      title: 'Complex Strategy',
      description: 'Complex strategies involving derivatives, cross-border investments, or intricate structures require specialized tax expertise and significantly more preparation time.',
      impact: 'negative'
    })
  }

  if (input.domicile !== 'us-only') {
    drivers.push({
      title: 'Multi-Jurisdictional Structure',
      description: `Operating across ${input.domicile === 'us-cayman' ? 'U.S. and Cayman' : input.domicile === 'us-lux' ? 'U.S. and Luxembourg' : 'multiple jurisdictions'} requires coordination of different tax regimes, transfer pricing considerations, and specialized international tax compliance.`,
      impact: 'negative'
    })
  }

  if (input.erisa) {
    drivers.push({
      title: 'ERISA/Tax-Exempt Investors',
      description: 'Tax-exempt and ERISA investors require separate UBTI calculations, tracking, and special allocations to avoid unrelated business taxable income issues.',
      impact: 'negative'
    })
  }

  if (input.providerTier === 'big-4') {
    drivers.push({
      title: 'Big 4 Provider',
      description: 'Big 4 accounting firms typically charge premium fees (35-50% higher than mid-market specialists) but offer deep resources, brand recognition, and global coordination capabilities.',
      impact: 'negative'
    })
  } else if (input.providerTier === 'boutique') {
    drivers.push({
      title: 'Boutique Provider (Cost Savings)',
      description: 'Boutique tax firms specializing in funds often offer 15-20% lower fees than mid-market firms while maintaining high-quality, personalized service.',
      impact: 'positive'
    })
  }

  return {
    lowEstimate: Math.round(lowTotal * providerMultiplier),
    mediumEstimate: Math.round(mediumTotal * providerMultiplier),
    highEstimate: Math.round(highTotal * providerMultiplier),
    breakdown,
    drivers
  }
}

// Helper functions
function getInvestorCountMidpoint(band: string): number {
  const map: Record<string, number> = {
    'under-10': 5,
    '11-30': 20,
    '31-75': 50,
    '76-150': 100,
    '150-plus': 200
  }
  return map[band] || 20
}

function getStateCountMidpoint(band: string): number {
  const map: Record<string, number> = {
    '1': 1,
    '2': 2,
    '3-5': 4,
    '6-10': 8,
    '10-plus': 15
  }
  return map[band] || 1
}

export function getFundTypeName(fundType: string): string {
  const names: Record<string, string> = {
    'venture-capital': 'Venture Capital',
    'pe-buyout': 'Private Equity (Buyout)',
    'private-credit': 'Private Credit / Direct Lending',
    'hedge-fund': 'Hedge Fund / Trading',
    'real-estate': 'Real Estate',
    'fund-of-funds': 'Fund of Funds',
    'fund-of-one': 'Fund of One / SMA',
    'other': 'Other'
  }
  return names[fundType] || fundType
}

export function getFundSizeName(fundSize: string): string {
  const names: Record<string, string> = {
    'under-50': 'Under $50M',
    '50-150': '$50M - $150M',
    '150-500': '$150M - $500M',
    '500-plus': '$500M+'
  }
  return names[fundSize] || fundSize
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
