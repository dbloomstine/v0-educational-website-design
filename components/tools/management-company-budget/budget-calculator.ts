import {
  BudgetData,
  YearlyRevenue,
  YearlyExpenses,
  YearlyCashFlow,
  CalculationResults,
  ScenarioResults,
  Fund
} from './types'

const BENEFITS_RATE = 0.20 // 20% for benefits and payroll taxes

export function calculateBudget(data: BudgetData, showCarry: boolean): CalculationResults {
  const years = data.planningHorizon.years

  // Calculate revenue for each year
  const revenue = calculateRevenue(data, years, showCarry)

  // Calculate expenses for each year
  const expenses = calculateExpenses(data, years)

  // Calculate cash flow
  const cashFlow = calculateCashFlow(data, revenue, expenses, years)

  // Calculate scenarios
  const scenarios = calculateScenarios(data, revenue, expenses, years, showCarry)

  return {
    revenue,
    expenses,
    cashFlow,
    scenarios
  }
}

function calculateRevenue(data: BudgetData, years: number, showCarry: boolean): YearlyRevenue[] {
  const revenue: YearlyRevenue[] = []

  for (let year = 1; year <= years; year++) {
    let mgmtFees = 0

    // Calculate management fees from each fund
    data.funds.forEach(fund => {
      mgmtFees += calculateFundManagementFee(fund, year)
    })

    // Add other revenue sources
    const additionalFees = data.revenue.additionalFees.reduce((sum, item) => sum + item.amount, 0)
    const recurringRevenue = data.revenue.recurringRevenue.reduce((sum, item) => sum + item.amount, 0)
    const carryRevenue = showCarry ? data.revenue.carryRevenue : 0

    const totalRevenue = mgmtFees + additionalFees + recurringRevenue + carryRevenue

    revenue.push({
      year,
      mgmtFees,
      additionalFees,
      recurringRevenue,
      carryRevenue,
      totalRevenue
    })
  }

  return revenue
}

function calculateFundManagementFee(fund: Fund, year: number): number {
  // Determine fee rate based on step-down
  let feeRate = fund.feeRate
  if (fund.stepDown.enabled && year >= fund.stepDown.year) {
    feeRate = fund.stepDown.newRate
  }

  // Calculate fee base in dollars
  let feeBase = fund.size * 1000000

  // Adjust fee base based on type
  if (fund.feeBase === 'invested') {
    // Assume deployment schedule: 70% by year 3, 85% by year 5
    const deploymentRate = Math.min(0.85, year <= 3 ? (year * 0.23) : (0.7 + (year - 3) * 0.075))
    feeBase = feeBase * deploymentRate
  } else if (fund.feeBase === 'nav') {
    // Assume 5% annual appreciation on deployed capital
    const deploymentRate = Math.min(0.85, year <= 3 ? (year * 0.23) : (0.7 + (year - 3) * 0.075))
    feeBase = feeBase * deploymentRate * Math.pow(1.05, year - 1)
  }

  return feeBase * (feeRate / 100)
}

function calculateExpenses(data: BudgetData, years: number): YearlyExpenses[] {
  const expenses: YearlyExpenses[] = []

  for (let year = 1; year <= years; year++) {
    // People costs with benefits
    const peopleCost = data.expenses.people.reduce((sum, person) => {
      const totalComp = person.baseSalary * (1 + person.bonusPercent / 100)
      const withBenefits = totalComp * (1 + BENEFITS_RATE)
      return sum + (person.fte * withBenefits)
    }, 0)

    const servicesCost = data.expenses.services.reduce((sum, item) => sum + item.amount, 0)
    const technologyCost = data.expenses.technology.reduce((sum, item) => sum + item.amount, 0)
    const officeCost = data.expenses.office.reduce((sum, item) => sum + item.amount, 0)
    const marketingCost = data.expenses.marketing.reduce((sum, item) => sum + item.amount, 0)
    const insuranceCost = data.expenses.insurance.reduce((sum, item) => sum + item.amount, 0)

    const totalExpenses = peopleCost + servicesCost + technologyCost + officeCost + marketingCost + insuranceCost

    expenses.push({
      year,
      peopleCost,
      servicesCost,
      technologyCost,
      officeCost,
      marketingCost,
      insuranceCost,
      totalExpenses
    })
  }

  return expenses
}

function calculateCashFlow(
  data: BudgetData,
  revenue: YearlyRevenue[],
  expenses: YearlyExpenses[],
  years: number
): YearlyCashFlow[] {
  const cashFlow: YearlyCashFlow[] = []
  let cumulativeCash = data.capitalStructure.startingCash

  for (let year = 1; year <= years; year++) {
    const yearRevenue = revenue[year - 1].totalRevenue
    const yearExpenses = expenses[year - 1].totalExpenses
    const ebitda = yearRevenue - yearExpenses

    cumulativeCash += ebitda

    cashFlow.push({
      year,
      ebitda,
      cashBalance: cumulativeCash
    })
  }

  return cashFlow
}

function calculateScenarios(
  data: BudgetData,
  baseRevenue: YearlyRevenue[],
  baseExpenses: YearlyExpenses[],
  years: number,
  showCarry: boolean
): { base: ScenarioResults; lean: ScenarioResults; aggressive: ScenarioResults } {
  // Base scenario
  const baseCashFlow = calculateCashFlowFromExpenses(data.capitalStructure.startingCash, baseRevenue, baseExpenses)

  // Lean scenario: 70% headcount, 60% discretionary spend
  const leanExpenses = baseExpenses.map(e => ({
    ...e,
    peopleCost: e.peopleCost * 0.7,
    marketingCost: e.marketingCost * 0.6,
    officeCost: e.officeCost * 0.7,
    totalExpenses: e.peopleCost * 0.7 + e.servicesCost + e.technologyCost +
                   e.officeCost * 0.7 + e.marketingCost * 0.6 + e.insuranceCost
  }))
  const leanCashFlow = calculateCashFlowFromExpenses(data.capitalStructure.startingCash, baseRevenue, leanExpenses)

  // Aggressive scenario: 150% headcount, 120% discretionary spend
  const aggressiveExpenses = baseExpenses.map(e => ({
    ...e,
    peopleCost: e.peopleCost * 1.5,
    marketingCost: e.marketingCost * 1.2,
    officeCost: e.officeCost * 1.1,
    totalExpenses: e.peopleCost * 1.5 + e.servicesCost + e.technologyCost +
                   e.officeCost * 1.1 + e.marketingCost * 1.2 + e.insuranceCost
  }))
  const aggressiveCashFlow = calculateCashFlowFromExpenses(data.capitalStructure.startingCash, baseRevenue, aggressiveExpenses)

  return {
    base: {
      revenue: baseRevenue,
      expenses: baseExpenses,
      cashFlow: baseCashFlow
    },
    lean: {
      revenue: baseRevenue,
      expenses: leanExpenses,
      cashFlow: leanCashFlow
    },
    aggressive: {
      revenue: baseRevenue,
      expenses: aggressiveExpenses,
      cashFlow: aggressiveCashFlow
    }
  }
}

function calculateCashFlowFromExpenses(
  startingCash: number,
  revenue: YearlyRevenue[],
  expenses: YearlyExpenses[]
): YearlyCashFlow[] {
  const cashFlow: YearlyCashFlow[] = []
  let cumulativeCash = startingCash

  for (let i = 0; i < revenue.length; i++) {
    const ebitda = revenue[i].totalRevenue - expenses[i].totalExpenses
    cumulativeCash += ebitda

    cashFlow.push({
      year: i + 1,
      ebitda,
      cashBalance: cumulativeCash
    })
  }

  return cashFlow
}

export function calculateRunwayMonths(
  startingCash: number,
  firstYearRevenue: number,
  firstYearExpenses: number
): number {
  let cash = startingCash
  let months = 0
  const monthlyBurn = firstYearExpenses / 12
  const monthlyRevenue = firstYearRevenue / 12
  const monthlyNet = monthlyRevenue - monthlyBurn

  if (monthlyNet >= 0) return 120 // 10+ years

  while (cash > 0 && months < 120) {
    cash += monthlyNet
    months++
  }

  return months
}

export function getSampleData(): BudgetData {
  return {
    firmProfile: {
      assetClass: 'Venture Capital',
      geography: 'US',
      stage: 'Emerging Manager - Fund I'
    },
    funds: [
      {
        id: '1',
        name: 'Fund I',
        size: 100,
        feeRate: 2.0,
        feeBase: 'committed',
        stepDown: {
          enabled: true,
          year: 6,
          newRate: 1.5
        },
        gpCommitment: 2.5,
        gpFundedByMgmtCo: false
      }
    ],
    capitalStructure: {
      startingCash: 500000,
      partnerCapital: 0,
      creditLine: 0
    },
    planningHorizon: {
      years: 5,
      granularity: 'annual'
    },
    revenue: {
      additionalFees: [
        { id: '1', description: 'Portfolio Monitoring Fees', amount: 50000, type: 'recurring' }
      ],
      recurringRevenue: [],
      carryRevenue: 0
    },
    expenses: {
      people: [
        { id: '1', role: 'Managing Partner', fte: 1, baseSalary: 300000, bonusPercent: 50 },
        { id: '2', role: 'Partner', fte: 1, baseSalary: 250000, bonusPercent: 40 },
        { id: '3', role: 'Principal', fte: 1, baseSalary: 200000, bonusPercent: 30 },
        { id: '4', role: 'Associate', fte: 1, baseSalary: 150000, bonusPercent: 20 },
        { id: '5', role: 'CFO / COO', fte: 0.5, baseSalary: 200000, bonusPercent: 25 },
        { id: '6', role: 'Fund Controller', fte: 1, baseSalary: 120000, bonusPercent: 15 }
      ],
      services: [
        { id: '1', description: 'Fund Administration', amount: 100000, type: 'fixed' },
        { id: '2', description: 'Annual Audit & Tax', amount: 75000, type: 'fixed' },
        { id: '3', description: 'Legal (Fund & GP)', amount: 50000, type: 'fixed' },
        { id: '4', description: 'Compliance & Regulatory', amount: 40000, type: 'fixed' }
      ],
      technology: [
        { id: '1', description: 'Fund Accounting System', amount: 30000, type: 'fixed' },
        { id: '2', description: 'CRM & Deal Tracking', amount: 15000, type: 'fixed' },
        { id: '3', description: 'Data Providers', amount: 25000, type: 'fixed' },
        { id: '4', description: 'Document Management', amount: 10000, type: 'fixed' }
      ],
      office: [
        { id: '1', description: 'Office Rent / Coworking', amount: 60000, type: 'fixed' },
        { id: '2', description: 'Utilities & Supplies', amount: 12000, type: 'variable' }
      ],
      marketing: [
        { id: '1', description: 'Travel & Entertainment', amount: 75000, type: 'variable' },
        { id: '2', description: 'Conferences & Events', amount: 40000, type: 'variable' },
        { id: '3', description: 'Website & Marketing', amount: 20000, type: 'variable' }
      ],
      insurance: [
        { id: '1', description: 'D&O Insurance', amount: 50000, type: 'fixed' },
        { id: '2', description: 'E&O Insurance', amount: 30000, type: 'fixed' },
        { id: '3', description: 'Contingency Buffer', amount: 25000, type: 'variable' }
      ]
    }
  }
}
