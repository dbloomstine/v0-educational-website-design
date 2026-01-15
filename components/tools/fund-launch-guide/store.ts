import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import {
  FundConfig,
  FundLaunchTask,
  ViewMode,
  DEFAULT_CONFIG,
} from './types'
import { PHASES, getApplicableTasks } from './data'

// Storage key
const STORAGE_KEY = 'fund-launch-guide-v2'

// Mapping of provider keys to task IDs for auto-completion
const PROVIDER_TASK_MAP: Record<string, string> = {
  lawFirm: 'legal-counsel',
  fundAdmin: 'sp-fund-admin',
  auditor: 'sp-auditor',
  taxAdvisor: 'sp-tax-advisor',
  bank: 'sp-banking',
  insuranceBroker: 'sp-insurance',
  primeBroker: 'hf-prime-broker',
}

interface FundLaunchStore {
  // Configuration
  config: FundConfig | null
  providers: Record<string, string>

  // Progress
  completedTasks: string[]
  expandedTasks: string[]
  expandedPhases: string[]

  // UI State
  activeTab: 'checklist' | 'learn'
  viewMode: ViewMode
  filterCompleted: 'all' | 'incomplete' | 'completed'
  showOnboarding: boolean
  showQuickJump: boolean
  searchQuery: string
  hasLoaded: boolean

  // Toast states
  showCopied: boolean
  showSaved: boolean

  // Actions
  setConfig: (config: FundConfig) => void
  setProviders: (providers: Record<string, string>) => void
  toggleTaskComplete: (taskId: string) => void
  toggleTaskExpand: (taskId: string) => void
  togglePhaseExpand: (phaseId: string) => void
  setActiveTab: (tab: 'checklist' | 'learn') => void
  setViewMode: (mode: ViewMode) => void
  setFilterCompleted: (filter: 'all' | 'incomplete' | 'completed') => void
  setShowOnboarding: (show: boolean) => void
  setShowQuickJump: (show: boolean) => void
  setSearchQuery: (query: string) => void
  setHasLoaded: (loaded: boolean) => void
  setShowCopied: (show: boolean) => void
  setShowSaved: (show: boolean) => void
  resetProgress: () => void
  removeProvider: (key: string) => void
  completeOnboarding: (config: FundConfig, providers: Record<string, string>, completedTasks?: string[]) => void
  skipOnboarding: () => void

  // Computed getters
  getApplicableTasks: () => FundLaunchTask[]
  getTasksByPhase: () => Map<string, FundLaunchTask[]>
  getProgress: () => { completed: number; total: number; percent: number }
  getCurrentPhase: () => typeof PHASES[number] | undefined
  getTotalTimeEstimate: () => string
  getRecommendedNextTask: () => FundLaunchTask | null
  getTaskDependencies: (task: FundLaunchTask) => { task: FundLaunchTask; type: 'required' | 'recommended'; isCompleted: boolean }[]
  getFilteredTasks: (tasks: FundLaunchTask[]) => FundLaunchTask[]
  getSearchResults: () => FundLaunchTask[]
}

// Parse time estimate to hours
function parseTimeToHours(timeStr: string): number {
  const match = timeStr.match(/(\d+(?:-\d+)?)\s*(hour|day|week|hr|wk)/i)
  if (!match) return 0
  const [, numPart, unit] = match
  const nums = numPart.split('-').map(Number)
  const avgNum = nums.reduce((a, b) => a + b, 0) / nums.length
  if (unit.toLowerCase().startsWith('week') || unit.toLowerCase().startsWith('wk')) return avgNum * 40
  if (unit.toLowerCase().startsWith('day')) return avgNum * 8
  return avgNum // hours
}

export const useFundLaunchStore = create<FundLaunchStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        config: null,
        providers: {},
        completedTasks: [],
        expandedTasks: [],
        expandedPhases: [],
        activeTab: 'checklist',
        viewMode: 'timeline',
        filterCompleted: 'all',
        showOnboarding: true,
        showQuickJump: false,
        searchQuery: '',
        hasLoaded: false,
        showCopied: false,
        showSaved: false,

        // Actions
        setConfig: (config) => set({ config }),

        setProviders: (providers) => {
          const { completedTasks } = get()
          const completedSet = new Set(completedTasks)

          // Auto-complete tasks for selected providers
          Object.keys(providers).forEach(key => {
            const taskId = PROVIDER_TASK_MAP[key]
            if (taskId) {
              completedSet.add(taskId)
            }
          })

          // Remove completions for removed providers
          Object.entries(PROVIDER_TASK_MAP).forEach(([providerKey, taskId]) => {
            if (!providers[providerKey] && completedSet.has(taskId)) {
              completedSet.delete(taskId)
            }
          })

          set({ providers, completedTasks: Array.from(completedSet) })
        },

        toggleTaskComplete: (taskId) => {
          const { completedTasks } = get()
          const completedSet = new Set(completedTasks)

          if (completedSet.has(taskId)) {
            completedSet.delete(taskId)
          } else {
            completedSet.add(taskId)
          }

          set({ completedTasks: Array.from(completedSet), showSaved: true })

          // Auto-hide saved toast
          setTimeout(() => {
            set({ showSaved: false })
          }, 1500)
        },

        toggleTaskExpand: (taskId) => {
          const { expandedTasks } = get()
          const expandedSet = new Set(expandedTasks)

          if (expandedSet.has(taskId)) {
            expandedSet.delete(taskId)
          } else {
            expandedSet.add(taskId)
          }

          set({ expandedTasks: Array.from(expandedSet) })
        },

        togglePhaseExpand: (phaseId) => {
          const { expandedPhases } = get()
          const expandedSet = new Set(expandedPhases)

          if (expandedSet.has(phaseId)) {
            expandedSet.delete(phaseId)
          } else {
            expandedSet.add(phaseId)
          }

          set({ expandedPhases: Array.from(expandedSet) })
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setViewMode: (mode) => set({ viewMode: mode }),
        setFilterCompleted: (filter) => set({ filterCompleted: filter }),
        setShowOnboarding: (show) => set({ showOnboarding: show }),
        setShowQuickJump: (show) => set({ showQuickJump: show, searchQuery: show ? '' : get().searchQuery }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setHasLoaded: (loaded) => set({ hasLoaded: loaded }),
        setShowCopied: (show) => set({ showCopied: show }),
        setShowSaved: (show) => set({ showSaved: show }),

        resetProgress: () => {
          set({
            completedTasks: [],
            expandedTasks: [],
            providers: {},
          })
        },

        removeProvider: (key) => {
          const { providers, completedTasks } = get()
          const newProviders = { ...providers }
          delete newProviders[key]

          // Remove auto-completed task
          const taskId = PROVIDER_TASK_MAP[key]
          const newCompletedTasks = taskId
            ? completedTasks.filter(id => id !== taskId)
            : completedTasks

          set({ providers: newProviders, completedTasks: newCompletedTasks })
        },

        completeOnboarding: (config, providers, journeyCompletedTasks) => {
          const completedTasks = journeyCompletedTasks || []

          // Add provider-related task completions
          Object.keys(providers).forEach(key => {
            const taskId = PROVIDER_TASK_MAP[key]
            if (taskId && !completedTasks.includes(taskId)) {
              completedTasks.push(taskId)
            }
          })

          set({
            config,
            providers,
            completedTasks,
            showOnboarding: false,
            expandedTasks: [],
            expandedPhases: [],
          })
        },

        skipOnboarding: () => {
          set({
            config: DEFAULT_CONFIG,
            showOnboarding: false,
          })
        },

        // Computed getters
        getApplicableTasks: () => {
          const { config } = get()
          if (!config) return []
          return getApplicableTasks(config)
        },

        getTasksByPhase: () => {
          const applicableTasks = get().getApplicableTasks()
          const map = new Map<string, FundLaunchTask[]>()
          PHASES.forEach(phase => {
            const phaseTasks = applicableTasks
              .filter(t => t.phaseId === phase.id)
              .sort((a, b) => a.order - b.order)
            map.set(phase.id, phaseTasks)
          })
          return map
        },

        getProgress: () => {
          const applicableTasks = get().getApplicableTasks()
          const { completedTasks } = get()
          const completedSet = new Set(completedTasks)
          const completed = applicableTasks.filter(t => completedSet.has(t.id)).length
          const total = applicableTasks.length
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0
          return { completed, total, percent }
        },

        getCurrentPhase: () => {
          const tasksByPhase = get().getTasksByPhase()
          const { completedTasks } = get()
          const completedSet = new Set(completedTasks)

          return PHASES.find(phase => {
            const phaseTasks = tasksByPhase.get(phase.id) || []
            const phaseCompleted = phaseTasks.filter(t => completedSet.has(t.id)).length
            return phaseCompleted < phaseTasks.length
          }) || PHASES[PHASES.length - 1]
        },

        getTotalTimeEstimate: () => {
          const applicableTasks = get().getApplicableTasks()
          const { completedTasks } = get()
          const completedSet = new Set(completedTasks)
          const incompleteTasks = applicableTasks.filter(t => !completedSet.has(t.id))
          const totalHours = incompleteTasks.reduce((sum, task) => sum + parseTimeToHours(task.timeEstimate), 0)

          if (totalHours === 0) return 'All done!'
          if (totalHours < 8) return `~${Math.ceil(totalHours)} hours`
          if (totalHours < 40) return `~${Math.ceil(totalHours / 8)} days`
          return `~${Math.ceil(totalHours / 40)} weeks`
        },

        getRecommendedNextTask: () => {
          const applicableTasks = get().getApplicableTasks()
          const { completedTasks } = get()
          const completedSet = new Set(completedTasks)

          const priorityOrder = { critical: 0, important: 1, optional: 2 }
          const incompleteTasks = applicableTasks
            .filter(t => !completedSet.has(t.id))
            .sort((a, b) => {
              // First by priority
              const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
              if (priorityDiff !== 0) return priorityDiff
              // Then by phase order
              const phaseA = PHASES.findIndex(p => p.id === a.phaseId)
              const phaseB = PHASES.findIndex(p => p.id === b.phaseId)
              if (phaseA !== phaseB) return phaseA - phaseB
              // Then by task order
              return a.order - b.order
            })
          return incompleteTasks[0] || null
        },

        getTaskDependencies: (task) => {
          const applicableTasks = get().getApplicableTasks()
          const { completedTasks } = get()
          const completedSet = new Set(completedTasks)

          if (!task.dependencies) return []
          return task.dependencies.map(dep => {
            const depTask = applicableTasks.find(t => t.id === dep.taskId)
            return depTask ? {
              task: depTask,
              type: dep.type,
              isCompleted: completedSet.has(dep.taskId),
            } : null
          }).filter(Boolean) as { task: FundLaunchTask; type: 'required' | 'recommended'; isCompleted: boolean }[]
        },

        getFilteredTasks: (tasks) => {
          const { filterCompleted, completedTasks } = get()
          const completedSet = new Set(completedTasks)

          if (filterCompleted === 'all') return tasks
          if (filterCompleted === 'incomplete') return tasks.filter(t => !completedSet.has(t.id))
          return tasks.filter(t => completedSet.has(t.id))
        },

        getSearchResults: () => {
          const { searchQuery } = get()
          if (!searchQuery.trim()) return []

          const applicableTasks = get().getApplicableTasks()
          const query = searchQuery.toLowerCase()
          return applicableTasks
            .filter(task =>
              task.title.toLowerCase().includes(query) ||
              task.quickTip.toLowerCase().includes(query) ||
              task.category.toLowerCase().includes(query)
            )
            .slice(0, 8)
        },
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          config: state.config,
          providers: state.providers,
          completedTasks: state.completedTasks,
          showOnboarding: state.showOnboarding,
          viewMode: state.viewMode,
          expandedTasks: state.expandedTasks,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.hasLoaded = true
          }
        },
      }
    )
  )
)

// Export PHASES for use in components
export { PHASES }

// Selector hooks for common use cases
export const useConfig = () => useFundLaunchStore(state => state.config)
export const useProviders = () => useFundLaunchStore(state => state.providers)
export const useCompletedTasks = () => useFundLaunchStore(state => state.completedTasks)
export const useActiveTab = () => useFundLaunchStore(state => state.activeTab)
export const useViewMode = () => useFundLaunchStore(state => state.viewMode)
export const useShowOnboarding = () => useFundLaunchStore(state => state.showOnboarding)
export const useHasLoaded = () => useFundLaunchStore(state => state.hasLoaded)
