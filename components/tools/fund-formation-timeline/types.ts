// Type definitions for Fund Formation Timeline Generator

export type FundStrategy = 'VC' | 'PE' | 'Private Credit' | 'Real Estate' | 'Hedge Fund' | 'Other'

export type FundSizeBand = '< $50M' | '$50M - $150M' | '$150M - $500M' | '> $500M'

export type Jurisdiction =
  | 'US Onshore Only'
  | 'US with Cayman Feeder'
  | 'EU AIF Style'
  | 'Not Sure'

export type AnchorStatus = 'Yes' | 'No' | 'In Discussion'

export type StartingPoint =
  | 'Starting from Scratch'
  | 'Have Draft Deck and Data Room'
  | 'Close to First Close'

export type ViewMode = 'timeline' | 'cards' | 'calendar'

export type DetailLevel = 'simple' | 'detailed'

export type PhaseCategory =
  | 'pre-launch'
  | 'legal'
  | 'go-to-market'
  | 'fundraising'
  | 'launch'

export type TaskCategory = 'legal' | 'regulatory' | 'investor-relations' | 'operations'

export interface FundFormationInputs {
  strategy: FundStrategy
  sizeBand: FundSizeBand
  jurisdiction: Jurisdiction
  firstCloseDate: Date
  finalCloseDate: Date
  anchorStatus: AnchorStatus
  startingPoint: StartingPoint
  detailLevel: DetailLevel
}

export interface Milestone {
  id: string
  name: string
  description: string
  phase: PhaseCategory
  category: TaskCategory[]
  owner: string
  startDate: Date
  endDate: Date
  duration: number // in days
  dependencies: string[] // milestone IDs
  isOptional: boolean
  affectedByAnchor: boolean
  affectedByJurisdiction: boolean
  affectedBySize: boolean
}

export interface Phase {
  id: PhaseCategory
  name: string
  description: string
  color: string
  milestones: Milestone[]
  startDate: Date
  endDate: Date
}

export interface TimelinePreset {
  name: string
  description: string
  inputs: Partial<FundFormationInputs>
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'csv' | 'text'
  includeDescriptions: boolean
  includeOwners: boolean
}
