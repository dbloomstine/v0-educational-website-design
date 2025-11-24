export type AssetClass =
  | 'Venture Capital'
  | 'Private Equity Buyout'
  | 'Growth Equity'
  | 'Private Credit'
  | 'Real Estate'
  | 'Hedge Fund'

export type Geography = 'US' | 'Europe' | 'Asia' | 'Global' | 'Other'

export type Stage =
  | 'Emerging Manager - Fund I'
  | 'Emerging Manager - Fund II'
  | 'Emerging Manager - Fund III+'
  | 'Established Multi-Fund Platform'

export type FeeBase = 'committed' | 'invested' | 'nav'

export type ExpenseType = 'fixed' | 'variable'

export interface FirmProfile {
  assetClass: AssetClass
  geography: Geography
  stage: Stage
}

export interface Fund {
  id: string
  name: string
  size: number // in millions
  feeRate: number // percentage
  feeBase: FeeBase
  stepDown: {
    enabled: boolean
    year: number
    newRate: number
  }
  gpCommitment: number // percentage
  gpFundedByMgmtCo: boolean
}

export interface CapitalStructure {
  startingCash: number
  partnerCapital: number
  creditLine: number
}

export interface PlanningHorizon {
  years: number
  granularity: 'annual' | 'quarterly'
}

export interface RevenueItem {
  id: string
  description: string
  amount: number
  type: 'recurring' | 'one-time'
}

export interface Revenue {
  additionalFees: RevenueItem[]
  recurringRevenue: RevenueItem[]
  carryRevenue: number
}

export interface PeopleExpense {
  id: string
  role: string
  fte: number
  baseSalary: number
  bonusPercent: number
}

export interface ExpenseItem {
  id: string
  description: string
  amount: number
  type: ExpenseType
}

export interface Expenses {
  people: PeopleExpense[]
  services: ExpenseItem[]
  technology: ExpenseItem[]
  office: ExpenseItem[]
  marketing: ExpenseItem[]
  insurance: ExpenseItem[]
}

export interface BudgetData {
  firmProfile: FirmProfile
  funds: Fund[]
  capitalStructure: CapitalStructure
  planningHorizon: PlanningHorizon
  revenue: Revenue
  expenses: Expenses
}

export interface YearlyRevenue {
  year: number
  mgmtFees: number
  additionalFees: number
  recurringRevenue: number
  carryRevenue: number
  totalRevenue: number
}

export interface YearlyExpenses {
  year: number
  peopleCost: number
  servicesCost: number
  technologyCost: number
  officeCost: number
  marketingCost: number
  insuranceCost: number
  totalExpenses: number
}

export interface YearlyCashFlow {
  year: number
  ebitda: number
  cashBalance: number
}

export interface ScenarioResults {
  revenue: YearlyRevenue[]
  expenses: YearlyExpenses[]
  cashFlow: YearlyCashFlow[]
}

export interface CalculationResults {
  revenue: YearlyRevenue[]
  expenses: YearlyExpenses[]
  cashFlow: YearlyCashFlow[]
  scenarios: {
    base: ScenarioResults
    lean: ScenarioResults
    aggressive: ScenarioResults
  }
}
