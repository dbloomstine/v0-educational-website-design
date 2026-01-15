import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { FundInputs, FeePhase, FeeCalculationResult } from './types'
import { calculateManagementFees, generateDefaultFeePhases } from './fee-calculator'

// Default fund inputs
const DEFAULT_FUND_INPUTS: FundInputs = {
  fundType: 'Private Equity',
  fundSize: 100,
  fundTerm: 10,
  investmentPeriod: 5,
  gpCommitment: 2,
  navGrowthRate: 8
}

// Generate ID for phases
const generateId = () => Math.random().toString(36).substr(2, 9)

// Preset configurations
export const PRESETS = {
  'standard-pe': {
    name: 'Standard PE',
    description: '2% on committed, 1.5% on invested post-IP',
    fundInputs: {
      fundType: 'Private Equity' as const,
      fundSize: 100,
      fundTerm: 10,
      investmentPeriod: 5,
      navGrowthRate: 8
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 5, feeBase: 'Committed Capital' as const, feeRate: 2.0 },
      { id: 'p2', startYear: 6, endYear: 10, feeBase: 'Invested Cost' as const, feeRate: 1.5 }
    ]
  },
  'vc-flat': {
    name: 'VC Flat Rate',
    description: '2.5% on committed for full term',
    fundInputs: {
      fundType: 'Venture Capital' as const,
      fundSize: 50,
      fundTerm: 10,
      investmentPeriod: 5,
      navGrowthRate: 15
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 10, feeBase: 'Committed Capital' as const, feeRate: 2.5 }
    ]
  },
  'credit-fund': {
    name: 'Credit Fund',
    description: '1.5% on invested capital',
    fundInputs: {
      fundType: 'Private Credit' as const,
      fundSize: 200,
      fundTerm: 7,
      investmentPeriod: 3,
      navGrowthRate: 5
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 7, feeBase: 'Invested Cost' as const, feeRate: 1.5 }
    ]
  },
  'step-down': {
    name: 'Step-Down',
    description: '2% → 1.75% → 1.5% over fund life',
    fundInputs: {
      fundType: 'Private Equity' as const,
      fundSize: 150,
      fundTerm: 12,
      investmentPeriod: 5,
      navGrowthRate: 10
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 4, feeBase: 'Committed Capital' as const, feeRate: 2.0 },
      { id: 'p2', startYear: 5, endYear: 8, feeBase: 'Invested Cost' as const, feeRate: 1.75 },
      { id: 'p3', startYear: 9, endYear: 12, feeBase: 'Invested Cost' as const, feeRate: 1.5 }
    ]
  }
} as const

interface FeeCalcStore {
  // Fund inputs
  fundInputs: FundInputs
  feePhases: FeePhase[]
  results: FeeCalculationResult

  // UI
  activeTab: 'calculator' | 'learn'
  showOnboarding: boolean

  // Actions
  setFundInputs: (inputs: Partial<FundInputs>) => void
  setFeePhases: (phases: FeePhase[]) => void
  addPhase: () => void
  updatePhase: (id: string, updates: Partial<FeePhase>) => void
  removePhase: (id: string) => void
  loadPreset: (presetKey: keyof typeof PRESETS) => void
  setActiveTab: (tab: 'calculator' | 'learn') => void
  setShowOnboarding: (show: boolean) => void
  reset: () => void
  recalculate: () => void

  // Export
  exportToJson: () => string
}

const defaultPhases = generateDefaultFeePhases(DEFAULT_FUND_INPUTS)
const defaultResults = calculateManagementFees(DEFAULT_FUND_INPUTS, defaultPhases)

export const useFeeCalcStore = create<FeeCalcStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        fundInputs: DEFAULT_FUND_INPUTS,
        feePhases: defaultPhases,
        results: defaultResults,
        activeTab: 'calculator',
        showOnboarding: true,

        // Actions
        setFundInputs: (inputs) => {
          const newInputs = { ...get().fundInputs, ...inputs }
          const results = calculateManagementFees(newInputs, get().feePhases)
          set({ fundInputs: newInputs, results })
        },

        setFeePhases: (phases) => {
          const results = calculateManagementFees(get().fundInputs, phases)
          set({ feePhases: phases, results })
        },

        addPhase: () => {
          const { feePhases, fundInputs } = get()
          const lastPhase = feePhases[feePhases.length - 1]
          const startYear = lastPhase ? lastPhase.endYear + 1 : 1
          const endYear = Math.min(startYear + 2, fundInputs.fundTerm)

          if (startYear > fundInputs.fundTerm) return

          const newPhase: FeePhase = {
            id: generateId(),
            startYear,
            endYear,
            feeBase: 'Invested Cost',
            feeRate: 1.5
          }

          const newPhases = [...feePhases, newPhase]
          const results = calculateManagementFees(fundInputs, newPhases)
          set({ feePhases: newPhases, results })
        },

        updatePhase: (id, updates) => {
          const { feePhases, fundInputs } = get()
          const newPhases = feePhases.map(p =>
            p.id === id ? { ...p, ...updates } : p
          )
          const results = calculateManagementFees(fundInputs, newPhases)
          set({ feePhases: newPhases, results })
        },

        removePhase: (id) => {
          const { feePhases, fundInputs } = get()
          if (feePhases.length <= 1) return

          const newPhases = feePhases.filter(p => p.id !== id)
          const results = calculateManagementFees(fundInputs, newPhases)
          set({ feePhases: newPhases, results })
        },

        loadPreset: (presetKey) => {
          const preset = PRESETS[presetKey]
          if (preset) {
            // Deep copy to avoid readonly issues
            const feePhases = preset.feePhases.map(p => ({ ...p })) as FeePhase[]
            const fundInputs = { ...preset.fundInputs }
            const results = calculateManagementFees(fundInputs, feePhases)
            set({
              fundInputs,
              feePhases,
              results
            })
          }
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setShowOnboarding: (show) => set({ showOnboarding: show }),

        reset: () => {
          const phases = generateDefaultFeePhases(DEFAULT_FUND_INPUTS)
          const results = calculateManagementFees(DEFAULT_FUND_INPUTS, phases)
          set({
            fundInputs: DEFAULT_FUND_INPUTS,
            feePhases: phases,
            results,
            showOnboarding: true
          })
        },

        recalculate: () => {
          const { fundInputs, feePhases } = get()
          const results = calculateManagementFees(fundInputs, feePhases)
          set({ results })
        },

        exportToJson: () => {
          const { fundInputs, feePhases, results } = get()
          return JSON.stringify({ fundInputs, feePhases, results }, null, 2)
        }
      }),
      {
        name: 'fee-calculator-v2',
        partialize: (state) => ({
          fundInputs: state.fundInputs,
          feePhases: state.feePhases,
          showOnboarding: state.showOnboarding
        })
      }
    )
  )
)

// Selector hooks
export const useResults = () => useFeeCalcStore(state => state.results)
export const useFundInputs = () => useFeeCalcStore(state => state.fundInputs)
export const useFeePhases = () => useFeeCalcStore(state => state.feePhases)
export const useActiveTab = () => useFeeCalcStore(state => state.activeTab)
export const useShowOnboarding = () => useFeeCalcStore(state => state.showOnboarding)
