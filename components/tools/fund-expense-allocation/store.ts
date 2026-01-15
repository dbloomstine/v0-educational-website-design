import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import {
  ClassificationInput,
  ClassificationResult,
  classifyExpense,
  expenseCategories,
  ExpenseCategory
} from './expenseData'

interface ExpenseAllocationStore {
  // Search/Lookup state
  searchQuery: string
  selectedCategory: ExpenseCategory | null

  // Classification state
  classificationInput: ClassificationInput | null
  classificationResult: ClassificationResult | null

  // UI state
  activeTab: 'lookup' | 'classify' | 'learn'
  showOnboarding: boolean

  // Actions
  setSearchQuery: (query: string) => void
  selectCategory: (category: ExpenseCategory | null) => void
  setClassificationInput: (input: Partial<ClassificationInput>) => void
  classify: () => void
  clearClassification: () => void
  setActiveTab: (tab: 'lookup' | 'classify' | 'learn') => void
  setShowOnboarding: (show: boolean) => void
  reset: () => void

  // Computed
  filteredCategories: ExpenseCategory[]
}

export const useExpenseStore = create<ExpenseAllocationStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        searchQuery: '',
        selectedCategory: null,
        classificationInput: null,
        classificationResult: null,
        activeTab: 'lookup',
        showOnboarding: true,

        // Computed - filtered categories based on search
        get filteredCategories() {
          const query = get().searchQuery.toLowerCase().trim()
          if (!query) return expenseCategories
          return expenseCategories.filter(cat =>
            cat.name.toLowerCase().includes(query) ||
            cat.description.toLowerCase().includes(query) ||
            cat.examples.some(ex => ex.toLowerCase().includes(query))
          )
        },

        // Actions
        setSearchQuery: (query) => {
          const filteredCategories = query.trim()
            ? expenseCategories.filter(cat =>
                cat.name.toLowerCase().includes(query.toLowerCase()) ||
                cat.description.toLowerCase().includes(query.toLowerCase()) ||
                cat.examples.some(ex => ex.toLowerCase().includes(query.toLowerCase()))
              )
            : expenseCategories
          set({ searchQuery: query, filteredCategories })
        },

        selectCategory: (category) => {
          set({ selectedCategory: category })
          if (category) {
            set({
              classificationInput: {
                expenseCategory: category.id,
                fundType: 'pe',
                fundStage: 'post-close',
                primaryBeneficiary: 'fund'
              }
            })
          }
        },

        setClassificationInput: (input) => {
          const current = get().classificationInput || {
            expenseCategory: '',
            fundType: 'pe' as const,
            fundStage: 'post-close' as const,
            primaryBeneficiary: 'fund' as const
          }
          set({ classificationInput: { ...current, ...input } })
        },

        classify: () => {
          const { classificationInput } = get()
          if (!classificationInput || !classificationInput.expenseCategory) return

          const result = classifyExpense(classificationInput)
          set({ classificationResult: result })
        },

        clearClassification: () => {
          set({
            classificationInput: null,
            classificationResult: null,
            selectedCategory: null
          })
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setShowOnboarding: (show) => set({ showOnboarding: show }),

        reset: () => {
          set({
            searchQuery: '',
            selectedCategory: null,
            classificationInput: null,
            classificationResult: null,
            showOnboarding: true
          })
        }
      }),
      {
        name: 'expense-allocation-v2',
        partialize: (state) => ({
          showOnboarding: state.showOnboarding
        })
      }
    )
  )
)

// Re-export for convenience
export { expenseCategories }
export type { ExpenseCategory, ClassificationResult, ClassificationInput }

// Selector hooks
export const useSearchQuery = () => useExpenseStore(state => state.searchQuery)
export const useSelectedCategory = () => useExpenseStore(state => state.selectedCategory)
export const useClassificationResult = () => useExpenseStore(state => state.classificationResult)
export const useActiveTab = () => useExpenseStore(state => state.activeTab)
export const useShowOnboarding = () => useExpenseStore(state => state.showOnboarding)
