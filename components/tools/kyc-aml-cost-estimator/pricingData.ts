// Types and interfaces
export interface KYCAMLInput {
  // Fund profile
  fundType: string
  domicile: string
  investorJurisdictions: string
  riskLevel: string

  // Investor counts by type
  individualCount: number
  entityCount: number
  institutionalCount: number

  // KYC/AML scope
  dueDiligenceLevel: string
  checksDepth: string[]
  monitoringFrequency: string

  // Complexity factors
  nonResidentProportion: string
  complexOwnership: boolean
  highRiskProportion: string

  // Operating model
  operatingModel: string
  hasOngoingMonitoring: boolean
}

export interface PricingOutput {
  // Per-investor costs
  perInvestorCosts: {
    individual: { low: number; medium: number; high: number }
    entity: { low: number; medium: number; high: number }
    institutional: { low: number; medium: number; high: number }
  }

  // Total costs
  initialOnboarding: { low: number; medium: number; high: number }
  annualOngoing: { low: number; medium: number; high: number }

  // Breakdowns
  breakdown: CostBreakdown[]
  drivers: CostDriver[]

  // Summary data
  totalInvestors: number
  averagePerInvestor: { low: number; medium: number; high: number }
}

export interface CostBreakdown {
  category: string
  investorType?: string
  count?: number
  perUnit: { low: number; medium: number; high: number }
  total: { low: number; medium: number; high: number }
}

export interface CostDriver {
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

// Default input values (sample mid-size PE fund)
export const defaultInput: KYCAMLInput = {
  fundType: 'pe-buyout',
  domicile: 'us',
  investorJurisdictions: 'mixed',
  riskLevel: 'standard',

  individualCount: 40,
  entityCount: 20,
  institutionalCount: 5,

  dueDiligenceLevel: 'standard',
  checksDepth: ['id-verification', 'pep-sanctions', 'adverse-media'],
  monitoringFrequency: 'annual',

  nonResidentProportion: 'some',
  complexOwnership: false,
  highRiskProportion: 'low',

  operatingModel: 'outsourced',
  hasOngoingMonitoring: true
}

// Base per-investor costs
// Research: $150-300 for individuals (simple), $400-700 (with EDD)
// $300-600 for entities (simple), $600-1,200 (with EDD)
// $800-1,500 for institutions (simple), $1,500-3,000 (with EDD)
const baseInvestorCosts = {
  individual: {
    standard: { low: 150, medium: 225, high: 300 },
    enhanced: { low: 400, medium: 550, high: 700 }
  },
  entity: {
    standard: { low: 300, medium: 450, high: 600 },
    enhanced: { low: 600, medium: 900, high: 1200 }
  },
  institutional: {
    standard: { low: 800, medium: 1150, high: 1500 },
    enhanced: { low: 1500, medium: 2250, high: 3000 }
  }
}

// Platform/license annual fees based on total AUM and investor count
function calculatePlatformFee(input: KYCAMLInput): { low: number; medium: number; high: number } {
  const totalInvestors = input.individualCount + input.entityCount + input.institutionalCount

  if (input.operatingModel === 'in-house') {
    // Lower platform fees for in-house (just software licenses)
    if (totalInvestors < 30) {
      return { low: 3000, medium: 5000, high: 8000 }
    } else if (totalInvestors < 75) {
      return { low: 8000, medium: 12000, high: 18000 }
    } else {
      return { low: 18000, medium: 28000, high: 40000 }
    }
  } else if (input.operatingModel === 'outsourced') {
    // Moderate platform fees for outsourced
    if (totalInvestors < 30) {
      return { low: 5000, medium: 8000, high: 12000 }
    } else if (totalInvestors < 75) {
      return { low: 12000, medium: 20000, high: 30000 }
    } else {
      return { low: 30000, medium: 45000, high: 65000 }
    }
  } else {
    // Bundled through administrator - included in their fees
    return { low: 0, medium: 0, high: 0 }
  }
}

// Main calculation function
export function calculateKYCAMLPricing(input: KYCAMLInput): PricingOutput {
  const breakdown: CostBreakdown[] = []
  const drivers: CostDriver[] = []

  // Determine if EDD is needed
  const needsEDD = input.dueDiligenceLevel === 'enhanced' ||
                   input.riskLevel === 'higher-risk' ||
                   input.highRiskProportion !== 'low'

  const ddLevel = needsEDD ? 'enhanced' : 'standard'

  // Calculate base costs per investor type
  const individualCost = baseInvestorCosts.individual[ddLevel]
  const entityCost = baseInvestorCosts.entity[ddLevel]
  const institutionalCost = baseInvestorCosts.institutional[ddLevel]

  // Apply complexity multipliers
  let complexityMultiplier = 1.0

  // Non-resident investors increase costs
  if (input.nonResidentProportion === 'majority') {
    complexityMultiplier *= 1.25
    drivers.push({
      title: 'Majority Non-Resident Investors',
      description: 'When most investors are non-residents, KYC/AML costs increase by 20-30% due to cross-border verification challenges, additional documentation requirements, and more complex source of funds analysis.',
      impact: 'negative'
    })
  } else if (input.nonResidentProportion === 'some') {
    complexityMultiplier *= 1.10
    drivers.push({
      title: 'International Investor Base',
      description: 'Mixed domestic and international investors require additional verification steps and cross-border compliance checks, adding approximately 10% to costs.',
      impact: 'negative'
    })
  }

  // Complex ownership chains increase entity costs
  if (input.complexOwnership) {
    complexityMultiplier *= 1.20
    drivers.push({
      title: 'Complex Ownership Structures',
      description: 'Ultimate Beneficial Owner (UBO) analysis for multi-layered entity structures requires additional research and verification, typically adding 15-25% to entity onboarding costs.',
      impact: 'negative'
    })
  }

  // Checks depth affects costs
  if (input.checksDepth.includes('source-of-wealth')) {
    complexityMultiplier *= 1.15
    drivers.push({
      title: 'Source of Wealth/Funds Analysis',
      description: 'Detailed source of wealth and source of funds analysis is time-intensive, requiring document review and verification of the origin of assets, adding 10-20% to costs.',
      impact: 'negative'
    })
  }

  // High-risk jurisdiction premium
  if (input.investorJurisdictions === 'high-risk' || input.riskLevel === 'higher-risk') {
    complexityMultiplier *= 1.30
    drivers.push({
      title: 'Higher-Risk Jurisdictions',
      description: 'Investors from high-risk jurisdictions (FATF grey-list countries, higher corruption indices) require Enhanced Due Diligence, additional screening, and more frequent monitoring, increasing costs by 25-35%.',
      impact: 'negative'
    })
  }

  // Apply multiplier to base costs
  const adjustedIndividualCost = {
    low: Math.round(individualCost.low * complexityMultiplier),
    medium: Math.round(individualCost.medium * complexityMultiplier),
    high: Math.round(individualCost.high * complexityMultiplier)
  }

  const adjustedEntityCost = {
    low: Math.round(entityCost.low * complexityMultiplier),
    medium: Math.round(entityCost.medium * complexityMultiplier),
    high: Math.round(entityCost.high * complexityMultiplier)
  }

  const adjustedInstitutionalCost = {
    low: Math.round(institutionalCost.low * complexityMultiplier),
    medium: Math.round(institutionalCost.medium * complexityMultiplier),
    high: Math.round(institutionalCost.high * complexityMultiplier)
  }

  // Calculate totals by investor type
  if (input.individualCount > 0) {
    const individualTotal = {
      low: adjustedIndividualCost.low * input.individualCount,
      medium: adjustedIndividualCost.medium * input.individualCount,
      high: adjustedIndividualCost.high * input.individualCount
    }
    breakdown.push({
      category: 'Individual Investors',
      investorType: 'individual',
      count: input.individualCount,
      perUnit: adjustedIndividualCost,
      total: individualTotal
    })
  }

  if (input.entityCount > 0) {
    const entityTotal = {
      low: adjustedEntityCost.low * input.entityCount,
      medium: adjustedEntityCost.medium * input.entityCount,
      high: adjustedEntityCost.high * input.entityCount
    }
    breakdown.push({
      category: 'Entity Investors (LLCs, Partnerships)',
      investorType: 'entity',
      count: input.entityCount,
      perUnit: adjustedEntityCost,
      total: entityTotal
    })
  }

  if (input.institutionalCount > 0) {
    const institutionalTotal = {
      low: adjustedInstitutionalCost.low * input.institutionalCount,
      medium: adjustedInstitutionalCost.medium * input.institutionalCount,
      high: adjustedInstitutionalCost.high * input.institutionalCount
    }
    breakdown.push({
      category: 'Institutional Investors',
      investorType: 'institutional',
      count: input.institutionalCount,
      perUnit: adjustedInstitutionalCost,
      total: institutionalTotal
    })
  }

  // Calculate initial onboarding total
  const initialOnboarding = breakdown.reduce((acc, item) => ({
    low: acc.low + item.total.low,
    medium: acc.medium + item.total.medium,
    high: acc.high + item.total.high
  }), { low: 0, medium: 0, high: 0 })

  // Add platform/license fees if applicable
  const platformFee = calculatePlatformFee(input)
  if (platformFee.medium > 0) {
    breakdown.push({
      category: 'Platform / License Fees (Annual)',
      perUnit: platformFee,
      total: platformFee
    })

    if (input.operatingModel === 'in-house') {
      drivers.push({
        title: 'In-House KYC Platform',
        description: 'Managing KYC/AML in-house requires software licenses for screening, document verification, and case management. Platform costs are lower but require dedicated staff resources.',
        impact: 'neutral'
      })
    } else if (input.operatingModel === 'outsourced') {
      drivers.push({
        title: 'Outsourced KYC Provider',
        description: 'Using a specialized KYC/AML provider includes both per-investor fees and platform/subscription costs, but reduces internal resource requirements and provides expertise.',
        impact: 'neutral'
      })
    }
  } else if (input.operatingModel === 'bundled') {
    drivers.push({
      title: 'Bundled Through Fund Administrator',
      description: 'KYC/AML services bundled with fund administration typically offer economies of scale, as the administrator leverages existing systems and workflows. Costs are included in their overall fee.',
      impact: 'positive'
    })
  }

  // Calculate ongoing annual monitoring
  let monitoringMultiplier = 0.25 // Default: annual refresh at 25% of initial cost

  if (input.monitoringFrequency === 'quarterly') {
    monitoringMultiplier = 0.50 // Quarterly monitoring costs more
    drivers.push({
      title: 'Quarterly Monitoring',
      description: 'Quarterly ongoing monitoring (vs. annual) includes more frequent PEP/sanctions screening, adverse media checks, and periodic reviews, typically costing 45-55% of initial onboarding costs per year.',
      impact: 'negative'
    })
  } else if (input.monitoringFrequency === 'continuous') {
    monitoringMultiplier = 0.65 // Continuous monitoring is most expensive
    drivers.push({
      title: 'Continuous Monitoring',
      description: 'Real-time continuous monitoring with automated alerts for sanctions, PEP status changes, and adverse media provides the highest level of compliance but costs 60-70% of initial onboarding annually.',
      impact: 'negative'
    })
  } else if (input.hasOngoingMonitoring) {
    drivers.push({
      title: 'Annual Ongoing Monitoring',
      description: 'Annual refresh of KYC documents, PEP/sanctions screening, and periodic reviews typically costs 20-30% of initial onboarding costs per year.',
      impact: 'neutral'
    })
  }

  const annualOngoing = input.hasOngoingMonitoring ? {
    low: Math.round(initialOnboarding.low * monitoringMultiplier + platformFee.low),
    medium: Math.round(initialOnboarding.medium * monitoringMultiplier + platformFee.medium),
    high: Math.round(initialOnboarding.high * monitoringMultiplier + platformFee.high)
  } : platformFee

  // Add contextual drivers
  if (needsEDD) {
    drivers.push({
      title: 'Enhanced Due Diligence Required',
      description: 'Enhanced Due Diligence (EDD) is triggered by higher-risk jurisdictions, high-risk investor profiles, or large investment amounts. EDD typically costs 2-3x standard KYC due to additional documentation, source of wealth analysis, and senior management review.',
      impact: 'negative'
    })
  }

  const totalInvestors = input.individualCount + input.entityCount + input.institutionalCount

  if (totalInvestors > 100) {
    drivers.push({
      title: 'Large Investor Base',
      description: 'With over 100 investors, consider automated onboarding workflows and digital KYC platforms to achieve economies of scale and reduce per-investor costs by 15-25%.',
      impact: 'positive'
    })
  }

  // Calculate average per investor
  const averagePerInvestor = {
    low: Math.round((initialOnboarding.low + platformFee.low) / totalInvestors),
    medium: Math.round((initialOnboarding.medium + platformFee.medium) / totalInvestors),
    high: Math.round((initialOnboarding.high + platformFee.high) / totalInvestors)
  }

  // Add platform fee to initial onboarding for final total
  const finalInitialOnboarding = {
    low: initialOnboarding.low + platformFee.low,
    medium: initialOnboarding.medium + platformFee.medium,
    high: initialOnboarding.high + platformFee.high
  }

  return {
    perInvestorCosts: {
      individual: adjustedIndividualCost,
      entity: adjustedEntityCost,
      institutional: adjustedInstitutionalCost
    },
    initialOnboarding: finalInitialOnboarding,
    annualOngoing,
    breakdown,
    drivers,
    totalInvestors,
    averagePerInvestor
  }
}

// Helper function for formatting currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Helper functions for display names
export function getFundTypeName(fundType: string): string {
  const names: Record<string, string> = {
    'venture-capital': 'Venture Capital',
    'pe-buyout': 'Private Equity (Buyout)',
    'growth-equity': 'Growth Equity',
    'private-credit': 'Private Credit',
    'real-estate': 'Real Estate',
    'hedge-fund': 'Hedge Fund',
    'fund-of-funds': 'Fund of Funds',
    'other': 'Other'
  }
  return names[fundType] || fundType
}
