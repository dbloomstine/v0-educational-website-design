// Types for the Investor Report Narrative Generator

// Fund type is now a free-form string to support all fund strategies
// e.g., "Venture Capital", "Real Estate", "Private Credit", "Secondaries", "GP Stakes", "Growth Equity", etc.

export type ToneOption = 'conservative' | 'neutral' | 'optimistic'

export type LetterFormat = 'executive-summary' | 'full-letter'

export interface PerformanceData {
  period: string
  fundReturn: number
  benchmarkReturn: number
  alpha: number
  volatility?: number
  sharpeRatio?: number
  maxDrawdown?: number
  ytdReturn?: number
  inceptionReturn?: number
}

export interface AttributionItem {
  name: string
  contribution: number
  weight?: number
  sector?: string
  isContributor: boolean
}

// Auto-extraction types
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ExtractedMetadata {
  fundName?: string
  fundNameConfidence?: ConfidenceLevel
  fundNameSource?: string
  reportingPeriod?: string
  reportingPeriodConfidence?: ConfidenceLevel
  reportingPeriodSource?: string
  fundType?: string
  fundTypeConfidence?: ConfidenceLevel
  fundTypeSource?: string
}

export interface ParsedData {
  performance?: PerformanceData
  attribution?: {
    contributors: AttributionItem[]
    detractors: AttributionItem[]
  }
  commentary?: string
  rawText?: string
  fileName: string
  fileType: string
  extractedMetadata?: ExtractedMetadata
}

export interface GenerationSettings {
  fundName: string
  fundType: string // Free-form fund type (e.g., "Venture Capital", "Real Estate", "Private Credit")
  reportingPeriod: string
  tone: ToneOption
  format: LetterFormat
  sections: {
    performanceOverview: boolean
    attributionAnalysis: boolean
    keyEvents: boolean
    forwardOutlook: boolean
  }
}

export interface GeneratedSection {
  id: string
  title: string
  content: string
  isLoading?: boolean
  error?: string
}

export interface GeneratedNarrative {
  sections: GeneratedSection[]
  fullText: string
  generatedAt: Date
  settings: GenerationSettings
}

export interface FileUploadState {
  files: ParsedData[]
  isProcessing: boolean
  error?: string
}

// API request/response types
export interface GenerateNarrativeRequest {
  parsedData: ParsedData[]
  settings: GenerationSettings
  regenerateSection?: string // Optional: only regenerate this section
}

export interface GenerateNarrativeResponse {
  success: boolean
  narrative?: GeneratedNarrative
  error?: string
}

// Chat refinement types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  affectedSections?: string[]
}

export interface RefineNarrativeRequest {
  currentNarrative: GeneratedNarrative
  chatHistory: ChatMessage[]
  userMessage: string
  parsedData: ParsedData[]
  settings: GenerationSettings
}

export interface RefineNarrativeResponse {
  success: boolean
  updatedNarrative?: GeneratedNarrative
  assistantMessage: string
  affectedSections?: string[]
  error?: string
}

// Brand settings for PDF customization
export interface BrandSettings {
  websiteUrl?: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  isAutoExtracted: boolean
  lastExtracted?: Date
}

export interface ExtractBrandRequest {
  websiteUrl: string
}

export interface ExtractBrandResponse {
  success: boolean
  brand?: {
    logoUrl: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  error?: string
}
