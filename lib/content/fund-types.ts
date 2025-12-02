import { FundType } from './types'

export const fundTypes: Record<string, FundType> = {
  'private-equity': {
    id: 'private-equity',
    name: 'Private Equity',
    slug: 'private-equity',
    description: 'Operations guidance for CFOs, IR, compliance, and fund admin teams',
    color: 'oklch(0.65 0.19 275)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it']
  },
  'private-credit': {
    id: 'private-credit',
    name: 'Private Credit',
    slug: 'private-credit',
    description: 'Best practices for credit fund ops, compliance, and loan admin',
    color: 'oklch(0.55 0.15 150)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'loan-administration']
  },
  'venture-capital': {
    id: 'venture-capital',
    name: 'Venture Capital',
    slug: 'venture-capital',
    description: 'Scaling operations for COOs, CFOs, and fund admin professionals',
    color: 'oklch(0.65 0.22 230)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it']
  },
  'hedge-funds': {
    id: 'hedge-funds',
    name: 'Hedge Funds',
    slug: 'hedge-funds',
    description: 'Operations and compliance for middle office and prime brokerage',
    color: 'oklch(0.68 0.19 35)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'prime-brokerage']
  },
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Fund operations, tax structuring, and investor reporting guidance',
    color: 'oklch(0.62 0.15 25)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it']
  },
  'infrastructure': {
    id: 'infrastructure',
    name: 'Infrastructure',
    slug: 'infrastructure',
    description: 'Long-term asset ops, compliance, and LP reporting frameworks',
    color: 'oklch(0.6 0.16 210)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it']
  },
  'secondaries': {
    id: 'secondaries',
    name: 'Secondaries',
    slug: 'secondaries',
    description: 'Transfer operations, valuation, and fund administration guidance',
    color: 'oklch(0.64 0.20 350)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it']
  },
  'gp-stakes': {
    id: 'gp-stakes',
    name: 'GP-Stakes',
    slug: 'gp-stakes',
    description: 'Governance, compliance, and operational frameworks for GP investments',
    color: 'oklch(0.66 0.18 50)',
    pillars: ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it']
  }
}

export const getFundType = (slug: string): FundType | undefined => {
  return fundTypes[slug]
}

export const getAllFundTypes = (): FundType[] => {
  return Object.values(fundTypes)
}
