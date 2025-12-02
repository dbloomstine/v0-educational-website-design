import { Pillar } from './types'

export const pillars: Record<string, Pillar> = {
  'cfo': {
    id: 'cfo',
    title: 'CFO',
    slug: 'cfo',
    description: 'Financial planning, budgeting, and strategic decision-making',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'compliance': {
    id: 'compliance',
    title: 'Compliance',
    slug: 'compliance',
    description: 'Regulatory requirements and best practices',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'fund-administration': {
    id: 'fund-administration',
    title: 'Fund Administration',
    slug: 'fund-administration',
    description: 'NAV calculations, investor reporting, and fund accounting',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'investor-relations': {
    id: 'investor-relations',
    title: 'Investor Relations',
    slug: 'investor-relations',
    description: 'Communication strategies and investor updates',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'tax': {
    id: 'tax',
    title: 'Tax',
    slug: 'tax',
    description: 'Tax structuring, K-1s, and international tax considerations',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'banking': {
    id: 'banking',
    title: 'Banking',
    slug: 'banking',
    description: 'Banking relationships and cash management',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'fundraising': {
    id: 'fundraising',
    title: 'Fundraising',
    slug: 'fundraising',
    description: 'Capital raising and LP communications',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'insurance': {
    id: 'insurance',
    title: 'Insurance',
    slug: 'insurance',
    description: 'D&O insurance and risk mitigation',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'audit': {
    id: 'audit',
    title: 'Audit',
    slug: 'audit',
    description: 'Financial statement audits and internal controls',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'cyber-it': {
    id: 'cyber-it',
    title: 'Cyber/IT',
    slug: 'cyber-it',
    description: 'Cybersecurity and technology infrastructure',
    fundTypes: ['private-equity', 'private-credit', 'venture-capital', 'hedge-funds', 'real-estate', 'infrastructure', 'secondaries', 'gp-stakes']
  },
  'loan-administration': {
    id: 'loan-administration',
    title: 'Loan Administration',
    slug: 'loan-administration',
    description: 'Loan servicing, documentation, and monitoring',
    fundTypes: ['private-credit']
  },
  'prime-brokerage': {
    id: 'prime-brokerage',
    title: 'Prime Brokerage',
    slug: 'prime-brokerage',
    description: 'Prime broker relationships and margin management',
    fundTypes: ['hedge-funds']
  }
}

export const getPillar = (slug: string): Pillar | undefined => {
  return pillars[slug]
}

export const getPillarsByFundType = (fundTypeSlug: string): Pillar[] => {
  return Object.values(pillars).filter(p => p.fundTypes.includes(fundTypeSlug))
}
