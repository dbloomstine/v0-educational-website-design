// Fund Launch Guide - Types

export type FundStrategy =
  | 'VC'
  | 'PE'
  | 'Private Credit'
  | 'Hedge Fund'
  | 'Real Estate'
  | 'Infrastructure'

export type FundSize =
  | 'emerging' // < $100M
  | 'mid' // $100M - $500M
  | 'large' // > $500M

export type Jurisdiction =
  | 'US Onshore'
  | 'US + Cayman'
  | 'EU/AIFMD'

export type TaskCategory =
  | 'legal'
  | 'regulatory'
  | 'operations'
  | 'marketing'
  | 'finance'

export type TaskPriority =
  | 'critical'
  | 'important'
  | 'optional'

export interface FundLaunchPhase {
  id: string
  name: string
  shortName: string
  description: string
  icon: string
  color: string
  order: number
  estimatedWeeks: string
}

export interface TaskDependency {
  taskId: string
  type: 'required' | 'recommended'
}

export interface FundLaunchTask {
  id: string
  phaseId: string
  title: string
  quickTip: string
  fullExplanation: string
  pitfalls?: string[]
  timeEstimate: string
  benchmark?: string
  category: TaskCategory
  priority: TaskPriority
  dependencies?: TaskDependency[]
  applicableTo: {
    strategies: FundStrategy[] | 'all'
    sizes: FundSize[] | 'all'
    jurisdictions: Jurisdiction[] | 'all'
  }
  deepDiveUrl?: string
  externalResources?: { label: string; url: string }[]
  order: number
}
