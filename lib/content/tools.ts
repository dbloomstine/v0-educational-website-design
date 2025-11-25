import { Tool } from './types'

// All 12 tools for FundOpsHQ
const tools: Tool[] = [
  // A. Fund Formation
  {
    id: 'fund-formation-timeline',
    title: 'Fund Formation Timeline Generator',
    slug: 'fund-formation-timeline',
    shortDescription: 'Generate a month-by-month roadmap for launching your fund from T-12 to T+12.',
    inputs: [
      'Fund type',
      'First close date',
      'Target fund size',
      'Jurisdiction',
      'Complexity level'
    ],
    outputs: [
      'Timeline by month',
      'Tasks grouped by legal, operations, compliance, fundraising, investor onboarding'
    ],
    categories: ['Fund Formation'],
    personas: ['GP', 'COO or Operations', 'Lawyer'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'Calendar'
  },
  {
    id: 'management-fee-calculator',
    title: 'Management Fee Calculator',
    slug: 'management-fee-calculator',
    shortDescription: 'Model management fee schedules across fund life, commitment period, and step-downs.',
    inputs: [
      'Fund size',
      'Term',
      'Commitment period',
      'Fee rates',
      'Fee bases',
      'Step-downs'
    ],
    outputs: [
      'Year-by-year fee schedule',
      'Summary metrics'
    ],
    categories: ['Fund Formation'],
    personas: ['GP', 'CFO or Controller', 'LP'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'DollarSign'
  },
  {
    id: 'management-company-budget',
    title: 'Management Company Budget Planner',
    slug: 'management-company-budget',
    shortDescription: 'Plan your management company budget, burn, and runway.',
    inputs: [
      'Team roles and salaries',
      'Office and overhead',
      'Legal costs',
      'Admin costs',
      'Travel budget',
      'Software/tech stack',
      'Other fixed costs'
    ],
    outputs: [
      'Monthly burn rate',
      'Annual budget',
      'Estimated runway',
      'Suggested GP/seed capital needs'
    ],
    categories: ['Fund Formation'],
    personas: ['GP', 'CFO or Controller', 'COO or Operations'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'Building'
  },
  {
    id: 'side-letter-obligations',
    title: 'Side Letter Obligations Tool',
    slug: 'side-letter-obligations',
    shortDescription: 'Summarize and score side letter obligations so you can manage them operationally.',
    inputs: [
      'Side letter text (pasted or uploaded)',
      'Fund type (PE, VC, credit, real estate)',
      'LP type (pension, sovereign, family office, etc.)'
    ],
    outputs: [
      'Obligations grouped by theme (MFN, reporting, fees, co-invest, liquidity, investment restrictions, excuse rights)',
      'Operational actions',
      'Owner (legal, operations, compliance)',
      'Complexity score'
    ],
    categories: ['Fund Formation', 'Operations and Compliance'],
    personas: ['GP', 'Lawyer', 'Compliance', 'COO or Operations'],
    complexity: 'Advanced',
    status: 'active',
    icon: 'FileText'
  },

  // B. Pricing and Costs
  {
    id: 'fund-admin-pricing',
    title: 'Fund Administration Pricing Estimator',
    slug: 'fund-admin-pricing',
    shortDescription: 'Estimate typical fund administration fee ranges and what drives cost.',
    inputs: [
      'Fund type',
      'AUM',
      'Number of entities',
      'Investor count',
      'Jurisdictions',
      'Reporting frequency',
      'Complexity'
    ],
    outputs: [
      'Estimated fee band',
      'Key cost drivers',
      'Notes on scope assumptions'
    ],
    categories: ['Pricing and Costs'],
    personas: ['GP', 'CFO or Controller', 'COO or Operations'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'Calculator'
  },
  {
    id: 'audit-fee-estimator',
    title: 'Audit Fee Estimator',
    slug: 'audit-fee-estimator',
    shortDescription: 'Estimate audit fee ranges based on size and complexity.',
    inputs: [
      'Fund type',
      'AUM',
      'Number of portfolio companies or positions',
      'Jurisdictions',
      'Entity structure complexity'
    ],
    outputs: [
      'Estimated audit fee range',
      'What typically drives higher or lower cost'
    ],
    categories: ['Pricing and Costs'],
    personas: ['GP', 'CFO or Controller', 'LP'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'ClipboardCheck'
  },
  {
    id: 'tax-fee-estimator',
    title: 'Tax Fee Estimator',
    slug: 'tax-fee-estimator',
    shortDescription: 'Estimate tax preparation fees for funds, blockers, and GP entities.',
    inputs: [
      'Fund type',
      'Number and type of entities (fund, feeders, blockers, GP, carry vehicle)',
      'Jurisdictions',
      'Portfolio complexity'
    ],
    outputs: [
      'Estimated tax fee ranges',
      'Typical drivers',
      'Potential add-on costs'
    ],
    categories: ['Pricing and Costs'],
    personas: ['GP', 'CFO or Controller'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'Receipt'
  },
  {
    id: 'kyc-aml-cost-estimator',
    title: 'Investor Onboarding / KYC / AML Cost Estimator',
    slug: 'kyc-aml-cost-estimator',
    shortDescription: 'Estimate investor onboarding and KYC/AML costs per investor and in total.',
    inputs: [
      'Number of investors',
      'Investor type mix (institutional, HNWI, retail, offshore)',
      'Jurisdictions',
      'Frequency of refresh',
      'Whether third-party provider is used'
    ],
    outputs: [
      'Per-investor cost bands',
      'Total expected annual cost',
      'Notes on what can drive costs up'
    ],
    categories: ['Pricing and Costs'],
    personas: ['COO or Operations', 'Compliance', 'CFO or Controller'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'UserCheck'
  },

  // C. Fund Economics
  {
    id: 'distribution-waterfall',
    title: 'Distribution Waterfall Visualizer',
    slug: 'distribution-waterfall',
    shortDescription: 'Visualize LP and GP economics across preferred return, catch-up, and carry tiers.',
    inputs: [
      'Contributions',
      'Distributions or proceeds',
      'LP and GP percentages',
      'Preferred return',
      'Carry rate',
      'Years'
    ],
    outputs: [
      'Tier-by-tier breakdown',
      'Total to LP and GP',
      'Basic charts to show flows'
    ],
    categories: ['Fund Economics'],
    personas: ['GP', 'CFO or Controller', 'LP', 'Lawyer'],
    complexity: 'Advanced',
    status: 'coming-soon',
    icon: 'TrendingUp'
  },
  {
    id: 'subscription-credit-line',
    title: 'Subscription Credit Line Impact Visualizer',
    slug: 'subscription-credit-line',
    shortDescription: 'Show how a subscription line of credit affects IRR, MOIC, and fee drag.',
    inputs: [
      'Fund size',
      'Facility size',
      'Interest rate',
      'Typical days outstanding',
      'Draw pattern',
      'Pacing'
    ],
    outputs: [
      'IRR with and without the line',
      'MOIC impact',
      'Fee drag',
      'Simple charts'
    ],
    categories: ['Fund Economics'],
    personas: ['GP', 'CFO or Controller', 'LP'],
    complexity: 'Advanced',
    status: 'coming-soon',
    icon: 'LineChart'
  },

  // D. Operations and Compliance
  {
    id: 'fund-expense-allocation',
    title: 'Fund Expense Allocation Helper',
    slug: 'fund-expense-allocation',
    shortDescription: 'Interactive tool to classify expenses as fund or management company expenses with detailed market practice guidance.',
    inputs: [
      'Expense category (25+ predefined types)',
      'Fund type (PE, VC, Credit, RE, FoF)',
      'Fund stage',
      'Primary beneficiary',
      'Custom expense descriptions'
    ],
    outputs: [
      'Classification (fund/management/case-by-case)',
      'Detailed rationale and market practice',
      'LP sensitivities and flags',
      'Sample LPA language',
      'Exportable PDF report'
    ],
    categories: ['Operations and Compliance'],
    personas: ['CFO or Controller', 'Compliance', 'Lawyer', 'COO or Operations'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'Split'
  }
]

// Helper functions
export function getAllTools(): Tool[] {
  return tools
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find(tool => tool.slug === slug)
}

export function getToolsByCategory(category: string): Tool[] {
  return tools.filter(tool => tool.categories.includes(category as any))
}

export function getToolsByPersona(persona: string): Tool[] {
  return tools.filter(tool => tool.personas.includes(persona as any))
}

export function getToolsByComplexity(complexity: string): Tool[] {
  return tools.filter(tool => tool.complexity === complexity)
}

// Get unique values for filters
export function getAllCategories(): string[] {
  const categories = new Set<string>()
  tools.forEach(tool => tool.categories.forEach(cat => categories.add(cat)))
  return Array.from(categories)
}

export function getAllPersonas(): string[] {
  const personas = new Set<string>()
  tools.forEach(tool => tool.personas.forEach(persona => personas.add(persona)))
  return Array.from(personas)
}

export function getAllComplexities(): string[] {
  return ['Beginner', 'Intermediate', 'Advanced']
}
