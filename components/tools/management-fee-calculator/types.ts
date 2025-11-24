export type FundType =
  | 'Private Equity'
  | 'Venture Capital'
  | 'Private Credit'
  | 'Real Estate'
  | 'Hedge Fund'
  | 'Other'

export type FeeBase =
  | 'Committed Capital'
  | 'Invested Cost'
  | 'Net Asset Value (NAV)'
  | 'Lower of Cost or Fair Value'

export interface FeePhase {
  id: string
  startYear: number
  endYear: number
  feeBase: FeeBase
  feeRate: number // as percentage (e.g., 2.0 for 2%)
}

export interface FundInputs {
  fundType: FundType
  fundSize: number // in millions
  fundTerm: number // in years
  investmentPeriod: number // in years
  gpCommitment?: number // as percentage
  navGrowthRate?: number // as percentage per year
}

export interface YearlyFeeData {
  year: number
  feeBase: FeeBase
  baseAmount: number // in millions
  feeRate: number // as percentage
  feeAmount: number // in millions
  cumulativeFees: number // in millions
  feesAsPercentOfCommitments: number // as percentage
}

export interface FeeCalculationResult {
  yearlyData: YearlyFeeData[]
  totalFees: number // in millions
  averageAnnualFeePercent: number // as percentage of commitments
  firstHalfFees: number // fees in first half of term
  secondHalfFees: number // fees in second half of term
  feesAsPercentOfCommitments: number // total fees as % of commitments
}

export interface Scenario {
  name: string
  fundInputs: FundInputs
  feePhases: FeePhase[]
}
