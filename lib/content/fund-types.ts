import { FundType } from './types'

export const fundTypes: Record<string, FundType> = {
  'private-equity': {
    id: 'private-equity',
    name: 'Private Equity',
    slug: 'private-equity',
    description: 'Operations guidance for CFOs, IR, compliance, and fund admin teams',
    color: 'oklch(0.60 0.16 270)',  // Muted purple
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'legal', 'hr']
  },
  'private-credit': {
    id: 'private-credit',
    name: 'Private Credit',
    slug: 'private-credit',
    description: 'Best practices for credit fund ops, compliance, and loan admin',
    color: 'oklch(0.58 0.14 160)',  // Muted teal
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'loan-administration', 'legal', 'hr']
  },
  'venture-capital': {
    id: 'venture-capital',
    name: 'Venture Capital',
    slug: 'venture-capital',
    description: 'Scaling operations for COOs, CFOs, and fund admin professionals',
    color: 'oklch(0.62 0.16 220)',  // Steel blue
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'legal', 'hr']
  },
  'hedge-funds': {
    id: 'hedge-funds',
    name: 'Hedge Funds',
    slug: 'hedge-funds',
    description: 'Operations and compliance for middle office and prime brokerage',
    color: 'oklch(0.55 0.03 250)',  // Slate gray (monochrome)
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'prime-brokerage', 'legal', 'hr']
  },
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Fund operations, tax structuring, and investor reporting guidance',
    color: 'oklch(0.58 0.14 30)',   // Terracotta
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'legal', 'hr']
  },
  'infrastructure': {
    id: 'infrastructure',
    name: 'Infrastructure',
    slug: 'infrastructure',
    description: 'Long-term asset ops, compliance, and LP reporting frameworks',
    color: 'oklch(0.60 0.14 200)',  // Slate blue
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'legal', 'hr']
  },
  'secondaries': {
    id: 'secondaries',
    name: 'Secondaries',
    slug: 'secondaries',
    description: 'Transfer operations, valuation, and fund administration guidance',
    color: 'oklch(0.60 0.15 340)',  // Dusty rose
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'legal', 'hr']
  },
  'gp-stakes': {
    id: 'gp-stakes',
    name: 'GP-Stakes',
    slug: 'gp-stakes',
    description: 'Governance, compliance, and operational frameworks for GP investments',
    color: 'oklch(0.65 0.15 65)',   // Amber
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'legal', 'hr']
  }
}

export const getFundType = (slug: string): FundType | undefined => {
  return fundTypes[slug]
}

export const getAllFundTypes = (): FundType[] => {
  return Object.values(fundTypes)
}
