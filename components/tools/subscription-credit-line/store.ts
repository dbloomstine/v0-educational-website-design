import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import {
  SubscriptionLineInput,
  SubscriptionLineOutput,
  defaultInput,
  calculateSubscriptionLineImpact
} from './subscriptionLineCalculations'

// Preset configurations based on market research
export const PRESETS = {
  'conservative': {
    name: 'Conservative Use',
    description: '$100M fund, 15% facility, 90 days, 4% rate',
    input: {
      fundSize: 100000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded' as const,
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments' as const,
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: true,
      facilitySize: 0.15,
      interestRate: 0.04,
      maxDaysOutstanding: 90,
      repaymentTrigger: 'automatic' as const,
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve' as const
    }
  },
  'typical': {
    name: 'Typical PE Fund',
    description: '$200M fund, 20% facility, 180 days, 4.5% rate',
    input: {
      fundSize: 200000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded' as const,
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments' as const,
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: true,
      facilitySize: 0.20,
      interestRate: 0.045,
      maxDaysOutstanding: 180,
      repaymentTrigger: 'automatic' as const,
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve' as const
    }
  },
  'aggressive': {
    name: 'Aggressive Use',
    description: '$300M fund, 25% facility, 360 days, 5.5% rate',
    input: {
      fundSize: 300000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded' as const,
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments' as const,
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: true,
      facilitySize: 0.25,
      interestRate: 0.055,
      maxDaysOutstanding: 360,
      repaymentTrigger: 'distribution-funded' as const,
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve' as const
    }
  },
  'no-line': {
    name: 'No Credit Facility',
    description: '$150M fund, no subscription line',
    input: {
      fundSize: 150000000,
      investmentPeriodYears: 5,
      fundTermYears: 10,
      deploymentPaceType: 'front-loaded' as const,
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments' as const,
      carryRate: 0.20,
      prefRate: 0.08,
      useLine: false,
      facilitySize: 0,
      interestRate: 0,
      maxDaysOutstanding: 0,
      repaymentTrigger: 'automatic' as const,
      grossMOIC: 2.5,
      realizationScheduleType: 'j-curve' as const
    }
  }
} as const

interface SubscriptionLineStore {
  // Inputs
  input: SubscriptionLineInput

  // Results (computed)
  results: SubscriptionLineOutput

  // Comparison mode
  compareMode: boolean
  compareInput: SubscriptionLineInput | null
  compareResults: SubscriptionLineOutput | null

  // UI
  activeTab: 'calculator' | 'learn'
  showOnboarding: boolean
  expandedSections: Record<string, boolean>

  // Actions
  setInput: (updates: Partial<SubscriptionLineInput>) => void
  loadPreset: (presetKey: keyof typeof PRESETS) => void
  startComparison: () => void
  updateCompareInput: (updates: Partial<SubscriptionLineInput>) => void
  exitComparison: () => void
  setActiveTab: (tab: 'calculator' | 'learn') => void
  setShowOnboarding: (show: boolean) => void
  toggleSection: (section: string) => void
  reset: () => void

  // Export/Share
  exportToJson: () => string
  getShareableUrl: () => string
}

const defaultResults = calculateSubscriptionLineImpact(defaultInput)

export const useSubscriptionLineStore = create<SubscriptionLineStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        input: defaultInput,
        results: defaultResults,
        compareMode: false,
        compareInput: null,
        compareResults: null,
        activeTab: 'calculator',
        showOnboarding: true,
        expandedSections: { whatIf: false },

        // Actions
        setInput: (updates) => {
          const newInput = { ...get().input, ...updates }
          const results = calculateSubscriptionLineImpact(newInput)
          set({ input: newInput, results })
        },

        loadPreset: (presetKey) => {
          const preset = PRESETS[presetKey]
          if (preset) {
            const input = { ...preset.input }
            const results = calculateSubscriptionLineImpact(input)
            set({
              input,
              results,
              compareMode: false,
              compareInput: null,
              compareResults: null
            })
          }
        },

        startComparison: () => {
          const { input, results } = get()
          set({
            compareMode: true,
            compareInput: { ...input },
            compareResults: { ...results }
          })
        },

        updateCompareInput: (updates) => {
          const currentCompare = get().compareInput
          if (currentCompare) {
            const newInput = { ...currentCompare, ...updates }
            const results = calculateSubscriptionLineImpact(newInput)
            set({ compareInput: newInput, compareResults: results })
          }
        },

        exitComparison: () => {
          set({
            compareMode: false,
            compareInput: null,
            compareResults: null
          })
        },

        setActiveTab: (tab) => set({ activeTab: tab }),

        setShowOnboarding: (show) => set({ showOnboarding: show }),

        toggleSection: (section) => {
          set((state) => ({
            expandedSections: {
              ...state.expandedSections,
              [section]: !state.expandedSections[section]
            }
          }))
        },

        reset: () => {
          const results = calculateSubscriptionLineImpact(defaultInput)
          set({
            input: defaultInput,
            results,
            compareMode: false,
            compareInput: null,
            compareResults: null,
            showOnboarding: true,
            expandedSections: { whatIf: false }
          })
        },

        exportToJson: () => {
          const { input, results } = get()
          return JSON.stringify({ input, results }, null, 2)
        },

        getShareableUrl: () => {
          const { input } = get()
          const params = new URLSearchParams()
          params.set('fundSize', String(input.fundSize))
          params.set('investPeriod', String(input.investmentPeriodYears))
          params.set('fundTerm', String(input.fundTermYears))
          params.set('deployPace', input.deploymentPaceType)
          params.set('mgmtFee', String(input.managementFeeRate))
          params.set('feeBasis', input.managementFeeBasis)
          params.set('carry', String(input.carryRate))
          params.set('pref', String(input.prefRate))
          params.set('useLine', String(input.useLine))
          params.set('facilitySize', String(input.facilitySize))
          params.set('interestRate', String(input.interestRate))
          params.set('maxDays', String(input.maxDaysOutstanding))
          params.set('repayment', input.repaymentTrigger)
          params.set('grossMOIC', String(input.grossMOIC))
          params.set('realization', input.realizationScheduleType)

          const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
          const pathname = typeof window !== 'undefined' ? window.location.pathname : '/tools/subscription-credit-line'
          return `${baseUrl}${pathname}?${params.toString()}`
        }
      }),
      {
        name: 'subscription-credit-line-v2',
        partialize: (state) => ({
          input: state.input,
          showOnboarding: state.showOnboarding,
          expandedSections: state.expandedSections
        })
      }
    )
  )
)

// Selector hooks for convenience
export const useInput = () => useSubscriptionLineStore((state) => state.input)
export const useResults = () => useSubscriptionLineStore((state) => state.results)
export const useCompareMode = () => useSubscriptionLineStore((state) => state.compareMode)
export const useCompareResults = () => useSubscriptionLineStore((state) => state.compareResults)
export const useActiveTab = () => useSubscriptionLineStore((state) => state.activeTab)
export const useShowOnboarding = () => useSubscriptionLineStore((state) => state.showOnboarding)
