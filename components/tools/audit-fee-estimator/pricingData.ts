// Types and interfaces
export interface AuditInput {
  fundType: string
  fundSize: string
  portfolioCount: string
  entityCount: string
  jurisdictions: string
  emergingManager: string
  strategyComplexity: string
  valuationComplexity: string
  complexInstruments: boolean
  hasAdmin: boolean
  auditYear: string
  timeline: string
  framework: string
  secRegistered: boolean
}

export interface PricingOutput {
  lowEstimate: number
  mediumEstimate: number
  highEstimate: number
  drivers: CostDriver[]
  basePrice: number
  totalMultiplier: number
}

export interface CostDriver {
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

// Default input values (sample VC fund)
export const defaultInput: AuditInput = {
  fundType: 'venture-capital',
  fundSize: '50-100',
  portfolioCount: '11-25',
  entityCount: '2-3',
  jurisdictions: 'us-only',
  emergingManager: 'fund-1',
  strategyComplexity: 'simple',
  valuationComplexity: 'significant-3',
  complexInstruments: false,
  hasAdmin: false,
  auditYear: 'first',
  timeline: 'normal',
  framework: 'gaap',
  secRegistered: false
}

// Base pricing by fund type and size
// Research basis: Mid-tier firms $12-18k for small funds, Big 4 $25k+ for $250M+
// Sources: Dimov Audit, Barrington Partners survey, hedge fund industry data
const basePricing: Record<string, Record<string, number>> = {
  'venture-capital': {
    'under-50': 15000,
    '50-100': 20000,
    '100-250': 32000,
    '250-500': 50000,
    '500-plus': 75000
  },
  'pe-buyout': {
    'under-50': 18000,
    '50-100': 25000,
    '100-250': 42000,
    '250-500': 65000,
    '500-plus': 95000
  },
  'growth-equity': {
    'under-50': 16000,
    '50-100': 22000,
    '100-250': 38000,
    '250-500': 58000,
    '500-plus': 85000
  },
  'private-credit': {
    'under-50': 22000,
    '50-100': 32000,
    '100-250': 52000,
    '250-500': 78000,
    '500-plus': 110000
  },
  'real-estate': {
    'under-50': 20000,
    '50-100': 28000,
    '100-250': 45000,
    '250-500': 68000,
    '500-plus': 95000
  },
  'fund-of-funds': {
    'under-50': 25000,
    '50-100': 35000,
    '100-250': 55000,
    '250-500': 85000,
    '500-plus': 120000
  },
  'other': {
    'under-50': 18000,
    '50-100': 25000,
    '100-250': 42000,
    '250-500': 65000,
    '500-plus': 95000
  }
}

// Portfolio count multipliers
const portfolioMultipliers: Record<string, number> = {
  '0-10': 1.0,
  '11-25': 1.05,
  '26-50': 1.15,
  '51-100': 1.30,
  '100-plus': 1.50
}

// Entity count multipliers
const entityMultipliers: Record<string, number> = {
  '1': 1.0,
  '2-3': 1.05,
  '4-6': 1.15,
  '7-10': 1.30,
  '10-plus': 1.50
}

// Strategy complexity multipliers
const strategyMultipliers: Record<string, number> = {
  'simple': 1.0,
  'moderate': 1.10,
  'complex': 1.25
}

// Main calculation function
export function calculateAuditPricing(input: AuditInput): PricingOutput {
  let basePrice = basePricing[input.fundType][input.fundSize]
  let multiplier = 1.0
  const drivers: CostDriver[] = []

  // Portfolio count adjustment
  if (portfolioMultipliers[input.portfolioCount] > 1.0) {
    multiplier *= portfolioMultipliers[input.portfolioCount]
    drivers.push({
      title: 'Portfolio Size',
      description: `With ${input.portfolioCount} portfolio companies/positions, the auditor must verify valuations, cap tables, and collect financial data from many investees—increasing audit time by ${((portfolioMultipliers[input.portfolioCount] - 1) * 100).toFixed(0)}%.`,
      impact: 'negative'
    })
  }

  // Entity count adjustment
  if (entityMultipliers[input.entityCount] > 1.0) {
    multiplier *= entityMultipliers[input.entityCount]
    drivers.push({
      title: 'Complex Structure',
      description: `Your fund has ${input.entityCount} legal entities (funds, feeders, SPVs, blockers). Each requires separate audit procedures and consolidation, adding ${((entityMultipliers[input.entityCount] - 1) * 100).toFixed(0)}% to the base fee.`,
      impact: 'negative'
    })
  }

  // First-year audit premium (research: 30-50% higher)
  if (input.auditYear === 'first') {
    multiplier *= 1.35
    drivers.push({
      title: 'First-Year Audit',
      description: 'First-year audits are typically 35-40% more expensive due to initial setup, understanding your accounting systems, documenting internal controls, and establishing audit procedures. Subsequent years are more efficient.',
      impact: 'negative'
    })
  }

  // Strategy complexity adjustment
  if (strategyMultipliers[input.strategyComplexity] > 1.0) {
    multiplier *= strategyMultipliers[input.strategyComplexity]
    drivers.push({
      title: 'Strategy Complexity',
      description: `${input.strategyComplexity === 'complex' ? 'Complex strategies with derivatives, credit facilities, and intricate waterfalls' : 'Moderate strategy complexity'} require additional specialized audit procedures and expertise, increasing fees by ${((strategyMultipliers[input.strategyComplexity] - 1) * 100).toFixed(0)}%.`,
      impact: 'negative'
    })
  }

  // Valuation complexity (Level 3 assets)
  if (input.valuationComplexity === 'significant-3') {
    multiplier *= 1.20
    drivers.push({
      title: 'Valuation Complexity',
      description: 'Significant Level 3 (illiquid, unobservable) assets require detailed review of valuation models, assumptions, and management judgment—adding 20% to audit time and cost.',
      impact: 'negative'
    })
  }

  // Complex instruments
  if (input.complexInstruments) {
    multiplier *= 1.15
    drivers.push({
      title: 'Complex Financial Instruments',
      description: 'Derivatives, options, warrants, or convertible debt require specialized valuation expertise and additional audit procedures, adding 15% to the base fee.',
      impact: 'negative'
    })
  }

  // Administrator discount (reputable admin reduces audit cost)
  if (input.hasAdmin) {
    multiplier *= 0.85
    drivers.push({
      title: 'Third-Party Administrator (Cost Reduction)',
      description: 'Using a reputable third-party fund administrator saves audit time—they maintain organized books, produce draft financials, and streamline the process, reducing fees by ~15%.',
      impact: 'positive'
    })
  } else {
    drivers.push({
      title: 'No Third-Party Administrator',
      description: 'Without a dedicated fund administrator, the audit team must spend more time reviewing in-house accounting, increasing overall cost. Consider hiring a reputable administrator to reduce future audit fees.',
      impact: 'neutral'
    })
  }

  // Cross-border complexity
  if (input.jurisdictions !== 'us-only') {
    const crossBorderMultiplier = input.jurisdictions === 'multiple' ? 1.20 : 1.10
    multiplier *= crossBorderMultiplier
    drivers.push({
      title: 'Cross-Border Structure',
      description: `Operating across ${input.jurisdictions === 'multiple' ? 'multiple jurisdictions' : 'two jurisdictions'} requires coordination with foreign regulations, tax rules, and potentially multiple audit firms—adding ${((crossBorderMultiplier - 1) * 100).toFixed(0)}% to fees.`,
      impact: 'negative'
    })
  }

  // Rush timeline premium
  if (input.timeline === 'rush') {
    multiplier *= 1.20
    drivers.push({
      title: 'Rush Timeline',
      description: 'Tight deadlines require the audit team to deploy more resources simultaneously and work overtime, increasing fees by 20%. Plan for 90+ days when possible to reduce costs.',
      impact: 'negative'
    })
  }

  // Non-GAAP framework
  if (input.framework !== 'gaap') {
    multiplier *= 1.10
    drivers.push({
      title: 'Non-U.S. GAAP Reporting',
      description: 'IFRS or other reporting frameworks may require additional specialized expertise and less common audit procedures, adding 10% to fees.',
      impact: 'negative'
    })
  }

  // SEC registration
  if (input.secRegistered) {
    multiplier *= 1.08
    drivers.push({
      title: 'SEC-Registered Adviser',
      description: 'SEC-registered advisers (>$150M AUM) require compliance with additional regulatory standards and enhanced documentation, adding 8% to audit fees.',
      impact: 'negative'
    })
  }

  // Calculate final estimates
  const mediumEstimate = Math.round(basePrice * multiplier)
  const lowEstimate = Math.round(mediumEstimate * 0.80)  // -20% for low estimate
  const highEstimate = Math.round(mediumEstimate * 1.25) // +25% for high estimate

  return {
    lowEstimate,
    mediumEstimate,
    highEstimate,
    drivers,
    basePrice,
    totalMultiplier: multiplier
  }
}

// Helper functions for display
export function getFundTypeName(fundType: string): string {
  const names: Record<string, string> = {
    'venture-capital': 'Venture Capital',
    'pe-buyout': 'Private Equity (Buyout)',
    'growth-equity': 'Growth Equity',
    'private-credit': 'Private Credit / Direct Lending',
    'real-estate': 'Real Estate',
    'fund-of-funds': 'Fund of Funds',
    'other': 'Other'
  }
  return names[fundType] || fundType
}

export function getFundSizeName(fundSize: string): string {
  const names: Record<string, string> = {
    'under-50': 'Under $50M',
    '50-100': '$50M - $100M',
    '100-250': '$100M - $250M',
    '250-500': '$250M - $500M',
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
