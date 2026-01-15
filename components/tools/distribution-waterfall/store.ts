import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { WaterfallInput, WaterfallOutput, defaultInput, calculateWaterfall } from './waterfallCalculations'

// Preset scenarios
export const PRESETS = {
  'classic-pe': {
    name: 'Classic PE',
    description: '$100M fund, 8% pref, 20% carry, European',
    input: {
      ...defaultInput,
      fundSize: 100_000_000,
      contributedCapital: 100_000_000,
      grossProceeds: 200_000_000,
      waterfallType: 'european' as const,
      prefRate: 0.08,
      carryRate: 0.20,
      hasCatchUp: true,
      catchUpRate: 1.0,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    }
  },
  'vc-style': {
    name: 'VC Style',
    description: '$50M fund, no pref, 25% carry',
    input: {
      ...defaultInput,
      fundSize: 50_000_000,
      contributedCapital: 50_000_000,
      grossProceeds: 150_000_000,
      waterfallType: 'american' as const,
      prefRate: 0.0,
      carryRate: 0.25,
      hasCatchUp: false,
      catchUpRate: 1.0,
      yearsToExit: 7,
      gpCommitmentPercent: 0.01
    }
  },
  'higher-carry': {
    name: 'Higher Carry',
    description: '$200M fund, 6% pref, 25% carry',
    input: {
      ...defaultInput,
      fundSize: 200_000_000,
      contributedCapital: 200_000_000,
      grossProceeds: 400_000_000,
      waterfallType: 'european' as const,
      prefRate: 0.06,
      prefCompounding: 'compound' as const,
      carryRate: 0.25,
      hasCatchUp: true,
      catchUpRate: 1.0,
      yearsToExit: 6,
      gpCommitmentPercent: 0.03
    }
  },
  'no-catchup': {
    name: 'No Catch-Up',
    description: 'Straight to 80/20 after pref',
    input: {
      ...defaultInput,
      fundSize: 150_000_000,
      contributedCapital: 150_000_000,
      grossProceeds: 300_000_000,
      waterfallType: 'european' as const,
      prefRate: 0.08,
      carryRate: 0.20,
      hasCatchUp: false,
      catchUpRate: 1.0,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    }
  }
} as const

interface WaterfallStore {
  // Core state
  input: WaterfallInput
  output: WaterfallOutput

  // Comparison
  compareInput: WaterfallInput | null
  compareOutput: WaterfallOutput | null
  showComparison: boolean

  // UI
  activeTab: 'calculator' | 'learn'
  showOnboarding: boolean

  // Actions
  setInput: (input: Partial<WaterfallInput>) => void
  loadPreset: (presetKey: keyof typeof PRESETS) => void
  toggleComparison: () => void
  copyToCompare: () => void
  setCompareInput: (input: Partial<WaterfallInput>) => void
  setActiveTab: (tab: 'calculator' | 'learn') => void
  setShowOnboarding: (show: boolean) => void
  reset: () => void

  // Export
  exportToJson: () => string
}

export const useWaterfallStore = create<WaterfallStore>()(
  persist(
    (set, get) => ({
        // Initial state
        input: defaultInput,
        output: calculateWaterfall(defaultInput),
        compareInput: null,
        compareOutput: null,
        showComparison: false,
        activeTab: 'calculator',
        showOnboarding: true,

        // Actions
        setInput: (partialInput) => {
          const newInput = { ...get().input, ...partialInput }
          set({
            input: newInput,
            output: calculateWaterfall(newInput)
          })
        },

        loadPreset: (presetKey) => {
          const preset = PRESETS[presetKey]
          if (preset) {
            set({
              input: preset.input,
              output: calculateWaterfall(preset.input)
            })
          }
        },

        toggleComparison: () => {
          const { showComparison, input } = get()
          if (!showComparison) {
            // Starting comparison - copy current input
            set({
              showComparison: true,
              compareInput: { ...input },
              compareOutput: calculateWaterfall(input)
            })
          } else {
            // Ending comparison
            set({
              showComparison: false,
              compareInput: null,
              compareOutput: null
            })
          }
        },

        copyToCompare: () => {
          const { input } = get()
          set({
            showComparison: true,
            compareInput: { ...input },
            compareOutput: calculateWaterfall(input)
          })
        },

        setCompareInput: (partialInput) => {
          const { compareInput } = get()
          if (!compareInput) return

          const newInput = { ...compareInput, ...partialInput }
          set({
            compareInput: newInput,
            compareOutput: calculateWaterfall(newInput)
          })
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setShowOnboarding: (show) => set({ showOnboarding: show }),

        reset: () => {
          set({
            input: defaultInput,
            output: calculateWaterfall(defaultInput),
            compareInput: null,
            compareOutput: null,
            showComparison: false,
            showOnboarding: true
          })
        },

        exportToJson: () => {
          const { input, output } = get()
          return JSON.stringify({ input, output }, null, 2)
        }
      }),
      {
        name: 'waterfall-calculator-v2',
        partialize: (state) => ({
          input: state.input,
          showOnboarding: state.showOnboarding
        })
      }
    )
  )

// Selector hooks
export const useOutput = () => useWaterfallStore(state => state.output)
export const useInput = () => useWaterfallStore(state => state.input)
export const useActiveTab = () => useWaterfallStore(state => state.activeTab)
export const useShowOnboarding = () => useWaterfallStore(state => state.showOnboarding)
export const useComparison = () => useWaterfallStore(
  useShallow(state => ({
    showComparison: state.showComparison,
    compareInput: state.compareInput,
    compareOutput: state.compareOutput
  }))
)
