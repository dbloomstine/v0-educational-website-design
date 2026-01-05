import { Tool, ToolCategory } from './types'

// 6 high-trust tools for FundOpsHQ
const tools: Tool[] = [
  // A. Fund Formation
  {
    id: 'fund-launch-guide',
    title: 'Fund Launch Guide',
    slug: 'fund-launch-guide',
    shortDescription: 'Interactive checklist and guide for launching your fund. Track progress, customize for your strategy, and never miss a step.',
    inputs: [
      'Fund strategy (VC, PE, Credit, Hedge, RE, Infrastructure)',
      'Target fund size',
      'Jurisdiction structure',
      'Anchor investor status'
    ],
    outputs: [
      '40+ tasks across 8 launch phases',
      'Progress tracking with localStorage',
      'Shareable links and Excel/PDF export',
      'Industry benchmarks and common pitfalls',
      'Timeline, Board, and List views'
    ],
    categories: ['Fund Formation'],
    personas: ['GP', 'COO or Operations', 'Lawyer', 'CFO or Controller'],
    complexity: 'Intermediate',
    status: 'active',
    icon: 'Rocket'
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
    shortDescription: 'Calculate your burn rate, runway, and seed capital needs with a simple budget model.',
    inputs: [
      'Starting cash',
      'Fund size and fee rate',
      'Team costs (all-in monthly)',
      'Operations costs (admin, audit, legal)',
      'Overhead costs (office, insurance, tech)'
    ],
    outputs: [
      'Monthly burn rate',
      'Annual budget vs revenue',
      'Runway in months',
      'Break-even timing',
      'Seed capital needed',
      'Cash runway chart'
    ],
    categories: ['Fund Formation'],
    personas: ['GP', 'CFO or Controller', 'COO or Operations'],
    complexity: 'Beginner',
    status: 'active',
    icon: 'Building'
  },

  // B. Fund Economics
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
    status: 'active',
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
    status: 'active',
    icon: 'LineChart'
  },

  // C. Operations and Compliance
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
export function getAllCategories(): ToolCategory[] {
  const categories = new Set<ToolCategory>()
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

// Get active tools with optional limit
export function getActiveTools(limit?: number): Tool[] {
  const activeTools = tools.filter(tool => tool.status === 'active')
  return limit ? activeTools.slice(0, limit) : activeTools
}

// Get tool count by category
export function getToolCountByCategory(): Record<string, number> {
  const counts: Record<string, number> = {}
  tools.forEach(tool => {
    tool.categories.forEach(cat => {
      counts[cat] = (counts[cat] || 0) + 1
    })
  })
  return counts
}

// Get SEO-friendly title for a tool
export function getToolSeoTitle(tool: Tool): string {
  return `${tool.title} | Free Fund Operations Tool | FundOpsHQ`
}

// Get structured data for a tool (JSON-LD)
export function getToolStructuredData(tool: Tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.title,
    description: tool.shortDescription,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    author: {
      '@type': 'Person',
      name: 'Danny Bloomstine'
    }
  }
}
