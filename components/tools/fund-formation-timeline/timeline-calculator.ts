import {
  FundFormationInputs,
  Milestone,
  Phase,
  PhaseCategory,
  TimelinePreset
} from './types'
import { addDays, subDays, differenceInDays } from 'date-fns'

// Preset scenarios
export const TIMELINE_PRESETS: TimelinePreset[] = [
  {
    name: 'Fast Track with Anchor LP',
    description: '6-9 month timeline with committed anchor investor',
    inputs: {
      strategy: 'VC',
      sizeBand: '$50M - $150M',
      jurisdiction: 'US with Cayman Feeder',
      anchorStatus: 'Yes',
      startingPoint: 'Have Draft Deck and Data Room',
      detailLevel: 'simple'
    }
  },
  {
    name: 'Typical Emerging Manager (12-18 months)',
    description: 'Standard timeline for first-time fund managers',
    inputs: {
      strategy: 'PE',
      sizeBand: '$50M - $150M',
      jurisdiction: 'US Onshore Only',
      anchorStatus: 'In Discussion',
      startingPoint: 'Starting from Scratch',
      detailLevel: 'detailed'
    }
  },
  {
    name: 'Extended Fundraising with Staggered Closes',
    description: '18-24 month timeline with multiple interim closes',
    inputs: {
      strategy: 'Private Credit',
      sizeBand: '$150M - $500M',
      jurisdiction: 'US with Cayman Feeder',
      anchorStatus: 'No',
      startingPoint: 'Starting from Scratch',
      detailLevel: 'detailed'
    }
  }
]

// Base milestone templates
function getBaseMilestones(): Omit<Milestone, 'startDate' | 'endDate'>[] {
  return [
    // Pre-launch Planning
    {
      id: 'strategy-definition',
      name: 'Define Investment Strategy',
      description: 'Clarify fund strategy, target size, economics, and value proposition',
      phase: 'pre-launch',
      category: ['operations'],
      owner: 'GP Team',
      duration: 14,
      dependencies: [],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: false,
      affectedBySize: false
    },
    {
      id: 'track-record',
      name: 'Build Track Record Story',
      description: 'Document past performance, pipeline, and proof points',
      phase: 'pre-launch',
      category: ['investor-relations', 'operations'],
      owner: 'GP Team',
      duration: 21,
      dependencies: ['strategy-definition'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: false,
      affectedBySize: false
    },
    {
      id: 'service-providers',
      name: 'Select Key Service Providers',
      description: 'Identify and engage legal counsel, fund admin, auditor, and other providers',
      phase: 'pre-launch',
      category: ['operations', 'legal'],
      owner: 'GP Team',
      duration: 28,
      dependencies: ['strategy-definition'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: true,
      affectedBySize: true
    },

    // Legal and Structuring
    {
      id: 'structure-design',
      name: 'Fund Structure Design',
      description: 'Design fund structure and draft term sheet',
      phase: 'legal',
      category: ['legal'],
      owner: 'Legal Counsel',
      duration: 14,
      dependencies: ['service-providers'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: true,
      affectedBySize: true
    },
    {
      id: 'document-drafting',
      name: 'Draft Fund Documents',
      description: 'Draft LPA, PPM/offering memo, subscription docs, and side letter templates',
      phase: 'legal',
      category: ['legal'],
      owner: 'Legal Counsel',
      duration: 42,
      dependencies: ['structure-design'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: true,
      affectedBySize: true
    },
    {
      id: 'regulatory-analysis',
      name: 'Regulatory Analysis & Filings',
      description: 'Complete regulatory analysis and any required registrations or filings',
      phase: 'legal',
      category: ['legal', 'regulatory'],
      owner: 'Legal Counsel',
      duration: 28,
      dependencies: ['structure-design'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: true,
      affectedBySize: true
    },
    {
      id: 'entity-formation',
      name: 'Form Entities & Open Bank Accounts',
      description: 'Form fund entities and establish banking relationships',
      phase: 'legal',
      category: ['legal', 'operations'],
      owner: 'Legal Counsel',
      duration: 21,
      dependencies: ['document-drafting', 'regulatory-analysis'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: true,
      affectedBySize: false
    },

    // Go-to-Market Preparation
    {
      id: 'marketing-materials',
      name: 'Build Deck & Data Room',
      description: 'Create pitch deck, data room, and supporting marketing materials',
      phase: 'go-to-market',
      category: ['investor-relations', 'operations'],
      owner: 'GP Team',
      duration: 21,
      dependencies: ['track-record'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: false,
      affectedBySize: false
    },
    {
      id: 'admin-setup',
      name: 'Set Up Fund Administration',
      description: 'Engage fund administrator and establish processes',
      phase: 'go-to-market',
      category: ['operations'],
      owner: 'Fund Admin',
      duration: 14,
      dependencies: ['service-providers'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: false,
      affectedBySize: true
    },
    {
      id: 'compliance-setup',
      name: 'Set Up Compliance Program',
      description: 'Establish compliance policies, procedures, and monitoring',
      phase: 'go-to-market',
      category: ['regulatory', 'operations'],
      owner: 'COO / Compliance',
      duration: 21,
      dependencies: ['regulatory-analysis'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: true,
      affectedBySize: true
    },
    {
      id: 'target-list',
      name: 'Prepare LP Target List',
      description: 'Build marketing list and identify initial LP prospects',
      phase: 'go-to-market',
      category: ['investor-relations'],
      owner: 'GP Team',
      duration: 14,
      dependencies: ['marketing-materials'],
      isOptional: false,
      affectedByAnchor: true,
      affectedByJurisdiction: false,
      affectedBySize: true
    },

    // Fundraising Execution
    {
      id: 'soft-circle',
      name: 'Soft Circle Investors',
      description: 'Initial meetings with target LPs to gauge interest',
      phase: 'fundraising',
      category: ['investor-relations'],
      owner: 'GP Team',
      duration: 60,
      dependencies: ['target-list', 'marketing-materials'],
      isOptional: false,
      affectedByAnchor: true,
      affectedByJurisdiction: false,
      affectedBySize: true
    },
    {
      id: 'first-close-prep',
      name: 'First Close Preparation',
      description: 'Finalize documents and prepare for minimum viable first close',
      phase: 'fundraising',
      category: ['legal', 'investor-relations', 'operations'],
      owner: 'GP Team',
      duration: 14,
      dependencies: ['soft-circle', 'entity-formation', 'admin-setup'],
      isOptional: false,
      affectedByAnchor: true,
      affectedByJurisdiction: false,
      affectedBySize: false
    },
    {
      id: 'first-close',
      name: 'First Close',
      description: 'Execute first close with initial LP commitments',
      phase: 'fundraising',
      category: ['legal', 'investor-relations'],
      owner: 'GP Team',
      duration: 7,
      dependencies: ['first-close-prep'],
      isOptional: false,
      affectedByAnchor: true,
      affectedByJurisdiction: false,
      affectedBySize: false
    },
    {
      id: 'subsequent-fundraising',
      name: 'Subsequent Fundraising',
      description: 'Continue raising capital toward target fund size',
      phase: 'fundraising',
      category: ['investor-relations'],
      owner: 'GP Team',
      duration: 120,
      dependencies: ['first-close'],
      isOptional: false,
      affectedByAnchor: true,
      affectedByJurisdiction: false,
      affectedBySize: true
    },
    {
      id: 'final-close',
      name: 'Final Close',
      description: 'Complete fundraising and close fund at target size',
      phase: 'fundraising',
      category: ['legal', 'investor-relations'],
      owner: 'GP Team',
      duration: 7,
      dependencies: ['subsequent-fundraising'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: false,
      affectedBySize: false
    },

    // Launch and Early Operations
    {
      id: 'first-capital-call',
      name: 'First Capital Call',
      description: 'Issue first capital call for initial investment',
      phase: 'launch',
      category: ['operations'],
      owner: 'Fund Admin',
      duration: 14,
      dependencies: ['first-close'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: false,
      affectedBySize: false
    },
    {
      id: 'reporting-cadence',
      name: 'Establish Reporting Cadence',
      description: 'Set up quarterly reporting and investor communication schedule',
      phase: 'launch',
      category: ['investor-relations', 'operations'],
      owner: 'GP Team / Fund Admin',
      duration: 21,
      dependencies: ['first-close'],
      isOptional: false,
      affectedByAnchor: false,
      affectedByJurisdiction: false,
      affectedBySize: false
    }
  ]
}

// Calculate timeline based on inputs
export function calculateTimeline(inputs: FundFormationInputs): Phase[] {
  const baseMilestones = getBaseMilestones()

  // Calculate total days between first and final close
  const totalDays = differenceInDays(inputs.finalCloseDate, inputs.firstCloseDate)

  // Adjust durations based on inputs
  const adjustedMilestones = baseMilestones.map(milestone => {
    let duration = milestone.duration

    // Adjust for anchor investor
    if (milestone.affectedByAnchor && inputs.anchorStatus === 'Yes') {
      duration = Math.floor(duration * 0.7) // 30% faster with anchor
    } else if (milestone.affectedByAnchor && inputs.anchorStatus === 'No') {
      duration = Math.floor(duration * 1.3) // 30% slower without anchor
    }

    // Adjust for jurisdiction complexity
    if (milestone.affectedByJurisdiction) {
      if (inputs.jurisdiction === 'US Onshore Only') {
        duration = Math.floor(duration * 0.9) // 10% faster for simple structure
      } else if (inputs.jurisdiction === 'EU AIF Style') {
        duration = Math.floor(duration * 1.2) // 20% slower for EU
      }
    }

    // Adjust for fund size
    if (milestone.affectedBySize) {
      if (inputs.sizeBand === '< $50M') {
        duration = Math.floor(duration * 0.8) // 20% faster for smaller funds
      } else if (inputs.sizeBand === '> $500M') {
        duration = Math.floor(duration * 1.3) // 30% slower for larger funds
      }
    }

    return { ...milestone, duration }
  })

  // Filter milestones based on starting point
  const filteredMilestones = filterByStartingPoint(adjustedMilestones, inputs.startingPoint)

  // Filter by detail level
  const finalMilestones = filterByDetailLevel(filteredMilestones, inputs.detailLevel)

  // Calculate dates working backwards from first close
  const milestonesWithDates = calculateMilestoneDates(
    finalMilestones,
    inputs.firstCloseDate,
    inputs.finalCloseDate
  )

  // Group into phases
  return groupIntoPhases(milestonesWithDates)
}

function filterByStartingPoint(
  milestones: Omit<Milestone, 'startDate' | 'endDate'>[],
  startingPoint: string
): Omit<Milestone, 'startDate' | 'endDate'>[] {
  if (startingPoint === 'Have Draft Deck and Data Room') {
    return milestones.filter(m =>
      !['strategy-definition', 'track-record', 'marketing-materials'].includes(m.id)
    )
  } else if (startingPoint === 'Close to First Close') {
    return milestones.filter(m => m.phase === 'fundraising' || m.phase === 'launch')
  }
  return milestones
}

function filterByDetailLevel(
  milestones: Omit<Milestone, 'startDate' | 'endDate'>[],
  detailLevel: string
): Omit<Milestone, 'startDate' | 'endDate'>[] {
  if (detailLevel === 'simple') {
    // Only show major milestones
    const keyMilestones = [
      'strategy-definition',
      'service-providers',
      'document-drafting',
      'entity-formation',
      'marketing-materials',
      'soft-circle',
      'first-close',
      'final-close',
      'first-capital-call'
    ]
    return milestones.filter(m => keyMilestones.includes(m.id))
  }
  return milestones
}

function calculateMilestoneDates(
  milestones: Omit<Milestone, 'startDate' | 'endDate'>[],
  firstCloseDate: Date,
  finalCloseDate: Date
): Milestone[] {
  // Find the first close milestone
  const firstCloseIndex = milestones.findIndex(m => m.id === 'first-close')
  const finalCloseIndex = milestones.findIndex(m => m.id === 'final-close')

  const result: Milestone[] = []
  const dateMap = new Map<string, { startDate: Date; endDate: Date }>()

  // Work backwards from first close
  if (firstCloseIndex >= 0) {
    let currentDate = firstCloseDate

    for (let i = firstCloseIndex; i >= 0; i--) {
      const milestone = milestones[i]
      const endDate = i === firstCloseIndex ? currentDate : subDays(currentDate, 1)
      const startDate = subDays(endDate, milestone.duration - 1)

      dateMap.set(milestone.id, { startDate, endDate })
      currentDate = startDate
    }
  }

  // Work forwards from first close to final close
  if (firstCloseIndex >= 0 && finalCloseIndex >= 0) {
    let currentDate = firstCloseDate

    for (let i = firstCloseIndex; i <= finalCloseIndex; i++) {
      if (i === firstCloseIndex) {
        continue // Already calculated
      }

      const milestone = milestones[i]
      const startDate = addDays(currentDate, 1)

      // Special handling for final close - use the target date
      const endDate = i === finalCloseIndex
        ? finalCloseDate
        : addDays(startDate, milestone.duration - 1)

      dateMap.set(milestone.id, { startDate, endDate })
      currentDate = endDate
    }
  }

  // Add any remaining milestones after final close
  if (finalCloseIndex >= 0 && finalCloseIndex < milestones.length - 1) {
    let currentDate = finalCloseDate

    for (let i = finalCloseIndex + 1; i < milestones.length; i++) {
      const milestone = milestones[i]
      const startDate = addDays(currentDate, 1)
      const endDate = addDays(startDate, milestone.duration - 1)

      dateMap.set(milestone.id, { startDate, endDate })
      currentDate = endDate
    }
  }

  // Construct final milestone objects
  milestones.forEach(milestone => {
    const dates = dateMap.get(milestone.id)
    if (dates) {
      result.push({
        ...milestone,
        startDate: dates.startDate,
        endDate: dates.endDate
      })
    }
  })

  return result
}

function groupIntoPhases(milestones: Milestone[]): Phase[] {
  const phaseConfigs: Record<PhaseCategory, { name: string; description: string; color: string }> = {
    'pre-launch': {
      name: 'Pre-Launch Planning',
      description: 'Strategy definition and foundational preparation',
      color: 'oklch(0.65 0.19 275)' // Purple
    },
    'legal': {
      name: 'Legal & Structuring',
      description: 'Fund formation, documentation, and regulatory compliance',
      color: 'oklch(0.55 0.15 150)' // Teal
    },
    'go-to-market': {
      name: 'Go-to-Market Prep',
      description: 'Marketing materials and operational setup',
      color: 'oklch(0.65 0.22 230)' // Blue
    },
    'fundraising': {
      name: 'Fundraising Execution',
      description: 'Investor meetings, closes, and capital raising',
      color: 'oklch(0.68 0.19 35)' // Orange
    },
    'launch': {
      name: 'Launch & Early Operations',
      description: 'First investments and operational execution',
      color: 'oklch(0.62 0.15 25)' // Red
    }
  }

  const phases: Phase[] = []

  Object.keys(phaseConfigs).forEach(phaseId => {
    const phaseMilestones = milestones.filter(m => m.phase === phaseId)

    if (phaseMilestones.length > 0) {
      const startDate = new Date(
        Math.min(...phaseMilestones.map(m => m.startDate.getTime()))
      )
      const endDate = new Date(
        Math.max(...phaseMilestones.map(m => m.endDate.getTime()))
      )

      const config = phaseConfigs[phaseId as PhaseCategory]

      phases.push({
        id: phaseId as PhaseCategory,
        name: config.name,
        description: config.description,
        color: config.color,
        milestones: phaseMilestones,
        startDate,
        endDate
      })
    }
  })

  return phases.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

// Get default sample inputs
export function getDefaultInputs(): FundFormationInputs {
  const today = new Date()
  const firstClose = addDays(today, 180) // 6 months from now
  const finalClose = addDays(firstClose, 240) // 8 months after first close

  return {
    strategy: 'VC',
    sizeBand: '$50M - $150M',
    jurisdiction: 'US Onshore Only',
    firstCloseDate: firstClose,
    finalCloseDate: finalClose,
    anchorStatus: 'In Discussion',
    startingPoint: 'Starting from Scratch',
    detailLevel: 'detailed'
  }
}
