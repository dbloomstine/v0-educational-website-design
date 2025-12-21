// Types for Management Company Budget Planner

export interface Fund {
  id: string
  name: string
  size: number // in millions
  feeRate: number // percentage (e.g., 2 for 2%)
  firstCloseYear: number // year of first close (e.g., 2025)
  feeStartMonth?: number // months until management fees begin (for journey mode)
  firstCloseAmount?: number // amount in millions at first close
  // Advanced fields (optional for backwards compatibility)
  feeBasis?: 'committed' | 'invested' // How fees are calculated
  firstClosePercent?: number // % of fund raised at first close (default 50)
  finalCloseMonth?: number // Months after first close for final close (default 12)
  investmentPeriod?: number // Years for investment period (default 5)
  fundLife?: number // Total fund life in years (default 10)
  // Carry projections
  targetReturn?: number // Target gross return multiple (e.g., 2.0x)
  carryRate?: number // Carry percentage (default 20%)
  preferredReturn?: number // Hurdle rate (default 8%)
}

export interface ExpenseItem {
  id: string
  name: string
  monthlyCost: number
  isRecurring?: boolean
  category?: string // e.g., 'administration', 'legal', 'office', 'technology', 'travel', 'insurance', 'marketing'
}

export interface TeamMember {
  id: string
  role: string
  monthlyCost: number // all-in cost (salary + bonus + benefits)
  isPartner?: boolean
}

// Helper to generate unique IDs
export const generateId = (): string => Math.random().toString(36).substr(2, 9)

// Generic type for data that may be missing IDs
interface PartialBudgetDataInput {
  startingCash?: number
  funds?: Array<Partial<Fund> & { name: string; size: number; feeRate: number }>
  expenses?: {
    team?: Array<Partial<TeamMember> & { role: string; monthlyCost: number }>
    operations?: Array<Partial<ExpenseItem> & { name: string; monthlyCost: number }>
    overhead?: Array<Partial<ExpenseItem> & { name: string; monthlyCost: number }>
  }
  settings?: BudgetSettings
}

// Helper to normalize data that may be missing IDs
export const normalizeBudgetData = (data: PartialBudgetDataInput): BudgetData => {
  return {
    startingCash: data.startingCash ?? 500000,
    funds: (data.funds ?? []).map(f => ({
      ...f,
      id: f.id ?? generateId(),
      firstCloseYear: f.firstCloseYear ?? new Date().getFullYear(),
    })) as Fund[],
    expenses: {
      team: (data.expenses?.team ?? []).map(t => ({
        ...t,
        id: t.id ?? generateId(),
      })) as TeamMember[],
      operations: (data.expenses?.operations ?? []).map(o => ({
        ...o,
        id: o.id ?? generateId(),
      })) as ExpenseItem[],
      overhead: (data.expenses?.overhead ?? []).map(o => ({
        ...o,
        id: o.id ?? generateId(),
      })) as ExpenseItem[],
    },
    settings: data.settings,
  }
}

export interface Expenses {
  team: TeamMember[]
  operations: ExpenseItem[] // fund admin, audit, legal, compliance, tax
  overhead: ExpenseItem[] // office, insurance, technology, travel
}

export interface BudgetSettings {
  inflationRate?: number // Annual expense growth rate (default 3%)
  projectionYears?: number // How many years to project (default 5)
  gpCommitmentPercent?: number // GP commitment as % of fund (default 2%)
  gpFundedAmount?: number // Amount already funded toward GP commitment
}

export interface BudgetData {
  startingCash: number
  funds: Fund[]
  expenses: Expenses
  settings?: BudgetSettings // Optional for backwards compatibility
}

export interface MonthlyProjection {
  month: number
  year: number
  label: string // e.g., "Jan 2025"
  revenue: number
  expenses: number
  netCashFlow: number
  cashBalance: number
}

export interface BudgetResults {
  monthlyBurn: number
  annualBudget: number
  annualRevenue: number
  breakEvenMonth: number | null // null if never breaks even in projection
  runwayMonths: number | null // null if runway extends beyond projection
  seedCapitalNeeded: number
  projections: MonthlyProjection[]
  // Expense breakdown
  teamCost: number
  opsCost: number
  overheadCost: number
  // Carry projections (if enabled)
  estimatedCarry?: number
  carryTimeline?: { year: number; amount: number }[]
}

// Typical expense ranges for guidance
export const TYPICAL_RANGES = {
  team: {
    'Managing Partner / CEO': { min: 15000, max: 40000, typical: 25000 },
    'Partner': { min: 12000, max: 30000, typical: 20000 },
    'Principal / VP': { min: 10000, max: 20000, typical: 15000 },
    'Associate': { min: 6000, max: 12000, typical: 8000 },
    'Analyst': { min: 4000, max: 8000, typical: 6000 },
    'CFO / Controller': { min: 12000, max: 25000, typical: 18000 },
    'Operations / Admin': { min: 5000, max: 12000, typical: 8000 },
  },
  operations: {
    'Fund Administration': { min: 4000, max: 12500, typical: 7500, note: '$50-150K/year' },
    'Audit': { min: 2500, max: 7000, typical: 4500, note: '$30-85K/year' },
    'Legal (ongoing)': { min: 2000, max: 8000, typical: 4000, note: '$25-100K/year' },
    'Compliance': { min: 2000, max: 6000, typical: 3500, note: '$25-75K/year' },
    'Tax Preparation': { min: 2000, max: 6000, typical: 3500, note: '$25-75K/year' },
  },
  overhead: {
    'Office / Coworking': { min: 500, max: 8000, typical: 2500, note: '$6-100K/year' },
    'D&O / E&O Insurance': { min: 1500, max: 5000, typical: 2500, note: '$18-60K/year' },
    'Technology / Software': { min: 500, max: 3000, typical: 1500, note: '$6-36K/year' },
    'Travel & Entertainment': { min: 1000, max: 5000, typical: 2500, note: '$12-60K/year' },
  },
} as const

// Default starting data for a typical emerging manager
export const DEFAULT_BUDGET_DATA: BudgetData = {
  startingCash: 500000,
  funds: [
    {
      id: '1',
      name: 'Fund I',
      size: 50,
      feeRate: 2,
      firstCloseYear: new Date().getFullYear(),
    },
  ],
  expenses: {
    team: [
      { id: '1', role: 'Managing Partner', monthlyCost: 20000 },
      { id: '2', role: 'Associate', monthlyCost: 8000 },
    ],
    operations: [
      { id: '1', name: 'Fund Administration', monthlyCost: 6000 },
      { id: '2', name: 'Audit', monthlyCost: 4000 },
      { id: '3', name: 'Legal (ongoing)', monthlyCost: 3000 },
      { id: '4', name: 'Compliance', monthlyCost: 2500 },
      { id: '5', name: 'Tax Preparation', monthlyCost: 3000 },
    ],
    overhead: [
      { id: '1', name: 'Office / Coworking', monthlyCost: 2000 },
      { id: '2', name: 'D&O / E&O Insurance', monthlyCost: 2500 },
      { id: '3', name: 'Technology / Software', monthlyCost: 1200 },
      { id: '4', name: 'Travel & Entertainment', monthlyCost: 2000 },
    ],
  },
}
