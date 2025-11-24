export type FundType =
  | 'Venture Capital'
  | 'Private Equity Buyout'
  | 'Growth Equity'
  | 'Private Credit'
  | 'Real Estate'
  | 'Fund of Funds'
  | 'Hedge Fund'

export type InvestorCategory =
  | 'Pension'
  | 'Sovereign Wealth Fund'
  | 'Endowment'
  | 'Family Office'
  | 'Insurance'
  | 'Corporate'
  | 'Fund of Funds'
  | 'HNW'

export type ClauseCategory =
  | 'fees'
  | 'mfn'
  | 'liquidity'
  | 'reporting'
  | 'esg'
  | 'coinvest'
  | 'regulatory'
  | 'excuse'
  | 'other'

export interface Fund {
  name: string
  type: FundType
  vintage: number
  standardFee: number
  standardCarry: number
  term: number
}

export interface Investor {
  id: string
  name: string
  commitment: number
  category: InvestorCategory
  regulatory: {
    erisa: boolean
    act40: boolean
    aifmd: boolean
    other: boolean
  }
}

export interface Clause {
  id: string
  investorId: string
  category: ClauseCategory
  description: string
}

export interface MFNConfig {
  tier1Threshold: number
  tier2Threshold: number
  tier1Scope: ClauseCategory[]
  tier2Scope: ClauseCategory[]
  exclusions: string
}

export interface Scenario {
  id: string
  name: string
  investorId: string
  type: string
  description: string
  impact: ScenarioImpact
}

export interface ScenarioImpact {
  category: ClauseCategory
  impactedCount: number
  impactedInvestors: Array<{
    id: string
    name: string
    tier: string
    level: 'high' | 'medium' | 'low'
  }>
}

export interface SideLetterData {
  fund: Fund
  investors: Investor[]
  clauses: Clause[]
  mfnConfig: MFNConfig
  scenarios: Scenario[]
}
