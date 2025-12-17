// Fund Launch Guide v2 - Types and Data Model

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
  | 'critical' // Must do, blocks other tasks
  | 'important' // Should do, best practice
  | 'optional' // Nice to have, situation dependent

export interface FundLaunchPhase {
  id: string
  name: string
  shortName: string
  description: string
  icon: string
  color: string
  order: number
  estimatedWeeks: string // e.g., "4-8 weeks"
}

export interface TaskDependency {
  taskId: string
  type: 'required' | 'recommended' // Required = blocking, Recommended = soft suggestion
}

export interface FundLaunchTask {
  id: string
  phaseId: string

  // Content
  title: string
  quickTip: string // 1-2 sentences, always visible
  fullExplanation: string // Expanded content
  pitfalls?: string[] // Common mistakes to avoid

  // Metadata
  timeEstimate: string // e.g., "2-4 weeks"
  benchmark?: string // e.g., "90% of funds complete before first close"
  category: TaskCategory
  priority: TaskPriority

  // Dependencies
  dependencies?: TaskDependency[]

  // Applicability - which fund configs this applies to
  applicableTo: {
    strategies: FundStrategy[] | 'all'
    sizes: FundSize[] | 'all'
    jurisdictions: Jurisdiction[] | 'all'
  }

  // Links
  deepDiveUrl?: string // Link to FundOpsHQ article
  externalResources?: { label: string; url: string }[]

  // Display
  order: number
}

export interface FundConfig {
  strategy: FundStrategy
  size: FundSize
  jurisdiction: Jurisdiction
  hasAnchor: boolean
  targetFirstClose?: Date
  fundName?: string
}

export interface UserProgress {
  completedTasks: string[]
  config: FundConfig
  currentPhase?: string
  startedAt: number
  lastUpdated: number
}

export type ViewMode = 'timeline' | 'board' | 'list'

export interface FundLaunchState {
  // User configuration
  config: FundConfig | null

  // Progress
  completedTasks: Set<string>

  // UI state
  viewMode: ViewMode
  expandedTasks: Set<string>
  currentPhase: string | null

  // Onboarding
  hasCompletedOnboarding: boolean
  showOnboarding: boolean
}

// Storage key for localStorage
export const STORAGE_KEY = 'fundopshq-fund-launch-guide'

// Default config
export const DEFAULT_CONFIG: FundConfig = {
  strategy: 'VC',
  size: 'emerging',
  jurisdiction: 'US Onshore',
  hasAnchor: false,
}
