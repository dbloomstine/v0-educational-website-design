import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { BudgetData, BudgetResults, Fund, TeamMember, ExpenseItem, DEFAULT_BUDGET_DATA, generateId, normalizeBudgetData } from './types'
import { calculateBudget } from './budget-calculator'

interface SavedScenario {
  id: string
  name: string
  data: BudgetData
  savedAt: string
}

interface BudgetStore {
  // Core data
  data: BudgetData
  results: BudgetResults | null

  // UI state
  showOnboarding: boolean
  activeTab: 'overview' | 'inputs' | 'analysis'

  // Scenarios
  savedScenarios: SavedScenario[]

  // Data actions
  setData: (data: BudgetData) => void
  setStartingCash: (cash: number) => void

  // Fund actions
  addFund: (fund: Omit<Fund, 'id'>) => void
  updateFund: (id: string, updates: Partial<Fund>) => void
  removeFund: (id: string) => void

  // Team actions
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  removeTeamMember: (id: string) => void

  // Expense actions
  addOperationsExpense: (expense: Omit<ExpenseItem, 'id'>) => void
  updateOperationsExpense: (id: string, updates: Partial<ExpenseItem>) => void
  removeOperationsExpense: (id: string) => void
  addOverheadExpense: (expense: Omit<ExpenseItem, 'id'>) => void
  updateOverheadExpense: (id: string, updates: Partial<ExpenseItem>) => void
  removeOverheadExpense: (id: string) => void

  // Scenario actions
  saveScenario: (name: string) => void
  loadScenario: (id: string) => void
  deleteScenario: (id: string) => void

  // UI actions
  setShowOnboarding: (show: boolean) => void
  setActiveTab: (tab: 'overview' | 'inputs' | 'analysis') => void

  // Recalculate
  recalculate: () => void

  // Reset
  reset: () => void

  // Import/Export
  exportToJson: () => string
  importFromJson: (json: string) => boolean
}

export const useBudgetStore = create<BudgetStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        data: DEFAULT_BUDGET_DATA,
        results: calculateBudget(DEFAULT_BUDGET_DATA),
        showOnboarding: true,
        activeTab: 'overview',
        savedScenarios: [],

        // Data actions
        setData: (data) => {
          const normalized = normalizeBudgetData(data)
          set({ data: normalized, results: calculateBudget(normalized) })
        },

        setStartingCash: (cash) => {
          const newData = { ...get().data, startingCash: cash }
          set({ data: newData, results: calculateBudget(newData) })
        },

        // Fund actions
        addFund: (fund) => {
          const newFund: Fund = { ...fund, id: generateId() }
          const newData = { ...get().data, funds: [...get().data.funds, newFund] }
          set({ data: newData, results: calculateBudget(newData) })
        },

        updateFund: (id, updates) => {
          const newData = {
            ...get().data,
            funds: get().data.funds.map(f => f.id === id ? { ...f, ...updates } : f)
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        removeFund: (id) => {
          const newData = {
            ...get().data,
            funds: get().data.funds.filter(f => f.id !== id)
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        // Team actions
        addTeamMember: (member) => {
          const newMember: TeamMember = { ...member, id: generateId() }
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              team: [...get().data.expenses.team, newMember]
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        updateTeamMember: (id, updates) => {
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              team: get().data.expenses.team.map(m => m.id === id ? { ...m, ...updates } : m)
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        removeTeamMember: (id) => {
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              team: get().data.expenses.team.filter(m => m.id !== id)
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        // Operations expense actions
        addOperationsExpense: (expense) => {
          const newExpense: ExpenseItem = { ...expense, id: generateId() }
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              operations: [...get().data.expenses.operations, newExpense]
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        updateOperationsExpense: (id, updates) => {
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              operations: get().data.expenses.operations.map(e => e.id === id ? { ...e, ...updates } : e)
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        removeOperationsExpense: (id) => {
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              operations: get().data.expenses.operations.filter(e => e.id !== id)
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        // Overhead expense actions
        addOverheadExpense: (expense) => {
          const newExpense: ExpenseItem = { ...expense, id: generateId() }
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              overhead: [...get().data.expenses.overhead, newExpense]
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        updateOverheadExpense: (id, updates) => {
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              overhead: get().data.expenses.overhead.map(e => e.id === id ? { ...e, ...updates } : e)
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        removeOverheadExpense: (id) => {
          const newData = {
            ...get().data,
            expenses: {
              ...get().data.expenses,
              overhead: get().data.expenses.overhead.filter(e => e.id !== id)
            }
          }
          set({ data: newData, results: calculateBudget(newData) })
        },

        // Scenario actions
        saveScenario: (name) => {
          const scenario: SavedScenario = {
            id: generateId(),
            name,
            data: JSON.parse(JSON.stringify(get().data)),
            savedAt: new Date().toISOString()
          }
          set({ savedScenarios: [...get().savedScenarios, scenario] })
        },

        loadScenario: (id) => {
          const scenario = get().savedScenarios.find(s => s.id === id)
          if (scenario) {
            const data = normalizeBudgetData(scenario.data)
            set({ data, results: calculateBudget(data) })
          }
        },

        deleteScenario: (id) => {
          set({ savedScenarios: get().savedScenarios.filter(s => s.id !== id) })
        },

        // UI actions
        setShowOnboarding: (show) => set({ showOnboarding: show }),
        setActiveTab: (tab) => set({ activeTab: tab }),

        // Recalculate
        recalculate: () => {
          set({ results: calculateBudget(get().data) })
        },

        // Reset
        reset: () => {
          set({
            data: DEFAULT_BUDGET_DATA,
            results: calculateBudget(DEFAULT_BUDGET_DATA),
            showOnboarding: true,
            activeTab: 'overview'
          })
        },

        // Import/Export
        exportToJson: () => {
          return JSON.stringify(get().data, null, 2)
        },

        importFromJson: (json) => {
          try {
            const parsed = JSON.parse(json)
            const normalized = normalizeBudgetData(parsed)
            set({ data: normalized, results: calculateBudget(normalized) })
            return true
          } catch {
            return false
          }
        }
      }),
      {
        name: 'budget-planner-v2',
        partialize: (state) => ({
          data: state.data,
          savedScenarios: state.savedScenarios,
          showOnboarding: state.showOnboarding
        })
      }
    )
  )
)

// Selector hooks for common patterns
export const useResults = () => useBudgetStore(state => state.results)
export const useData = () => useBudgetStore(state => state.data)
export const useActiveTab = () => useBudgetStore(state => state.activeTab)
export const useShowOnboarding = () => useBudgetStore(state => state.showOnboarding)
