import { Tool } from './types'

export interface Role {
  id: string
  title: string
  slug: string
  shortTitle: string
  description: string
  // Map to tool personas
  toolPersonas: string[]
}

const roles: Role[] = [
  {
    id: 'cfo-controller',
    title: 'CFO & Controller',
    slug: 'cfo-controller',
    shortTitle: 'CFO',
    description: 'Financial leadership, budgeting, reporting, and fund economics',
    toolPersonas: ['CFO or Controller']
  },
  {
    id: 'coo-operations',
    title: 'COO & Operations',
    slug: 'coo-operations',
    shortTitle: 'COO',
    description: 'Day-to-day operations, fund administration, and service providers',
    toolPersonas: ['COO or Operations']
  },
  {
    id: 'compliance',
    title: 'Compliance',
    slug: 'compliance',
    shortTitle: 'Compliance',
    description: 'Regulatory requirements, policies, and SEC examination',
    toolPersonas: ['Compliance']
  },
  {
    id: 'investor-relations',
    title: 'Investor Relations',
    slug: 'investor-relations',
    shortTitle: 'IR',
    description: 'LP communications, reporting, and fundraising support',
    toolPersonas: ['Investor Relations']
  },
  {
    id: 'gp-principal',
    title: 'GP & Principal',
    slug: 'gp-principal',
    shortTitle: 'GP',
    description: 'Fund strategy, economics, and high-level operations decisions',
    toolPersonas: ['GP']
  },
  {
    id: 'lp-investor',
    title: 'LP & Investor',
    slug: 'lp-investor',
    shortTitle: 'LP',
    description: 'Understanding fund terms, economics, and reporting',
    toolPersonas: ['LP']
  }
]

export function getAllRoles(): Role[] {
  return roles
}

export function getRoleBySlug(slug: string): Role | undefined {
  return roles.find(role => role.slug === slug)
}

export function getToolsForRole(role: Role, allTools: Tool[]): Tool[] {
  return allTools.filter(tool =>
    tool.personas.some((p) => role.toolPersonas.includes(p))
  )
}
