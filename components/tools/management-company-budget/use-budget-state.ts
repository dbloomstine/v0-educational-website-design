"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { BudgetData, DEFAULT_BUDGET_DATA } from './types'

const STORAGE_KEY = 'budget-planner-data'
const HISTORY_KEY = 'budget-planner-history'
const MAX_HISTORY = 50

interface BudgetStateOptions {
  initialData?: BudgetData
  autoSave?: boolean
  enableHistory?: boolean
}

interface BudgetStateReturn {
  data: BudgetData
  setData: (data: BudgetData | ((prev: BudgetData) => BudgetData)) => void

  // Undo/Redo
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void

  // Import/Export
  exportToJson: () => string
  importFromJson: (json: string) => boolean
  downloadJson: () => void

  // Reset
  resetToDefault: () => void

  // State flags
  isDirty: boolean
  lastSaved: Date | null
}

export function useBudgetState(options: BudgetStateOptions = {}): BudgetStateReturn {
  const {
    initialData,
    autoSave = true,
    enableHistory = true
  } = options

  // Load initial state from localStorage or use provided/default
  const getInitialState = (): BudgetData => {
    if (typeof window === 'undefined') {
      return initialData || DEFAULT_BUDGET_DATA
    }

    // If initial data is provided (e.g., from URL), use it
    if (initialData) {
      return initialData
    }

    // Try to load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate structure
        if (parsed.startingCash !== undefined && parsed.funds && parsed.expenses) {
          return parsed
        }
      }
    } catch {
      // Ignore parse errors
    }

    return DEFAULT_BUDGET_DATA
  }

  const [data, setDataInternal] = useState<BudgetData>(getInitialState)
  const [history, setHistory] = useState<BudgetData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Track if we're currently doing undo/redo to avoid adding to history
  const isUndoRedo = useRef(false)
  // Track initial load to avoid saving on first render
  const isInitialLoad = useRef(true)

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !enableHistory) return

    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
          setHistoryIndex(parsed.length - 1)
        }
      }
    } catch {
      // Ignore
    }

    isInitialLoad.current = false
  }, [enableHistory])

  // Auto-save to localStorage when data changes
  useEffect(() => {
    if (typeof window === 'undefined' || !autoSave || isInitialLoad.current) return

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setLastSaved(new Date())
        setIsDirty(false)
      } catch {
        // Storage full or other error
      }
    }, 1000) // Debounce saves

    return () => clearTimeout(timer)
  }, [data, autoSave])

  // Custom setData that manages history
  const setData = useCallback((newData: BudgetData | ((prev: BudgetData) => BudgetData)) => {
    setDataInternal(prev => {
      const nextData = typeof newData === 'function' ? newData(prev) : newData

      // Add to history if not doing undo/redo
      if (enableHistory && !isUndoRedo.current) {
        setHistory(h => {
          // If we're not at the end of history, truncate
          const newHistory = historyIndex < h.length - 1
            ? h.slice(0, historyIndex + 1)
            : h

          // Add new state
          const updated = [...newHistory, prev]

          // Limit history size
          if (updated.length > MAX_HISTORY) {
            return updated.slice(-MAX_HISTORY)
          }
          return updated
        })
        setHistoryIndex(h => Math.min(h + 1, MAX_HISTORY - 1))
      }

      setIsDirty(true)
      return nextData
    })
  }, [enableHistory, historyIndex])

  // Undo
  const undo = useCallback(() => {
    if (historyIndex < 0 || history.length === 0) return

    isUndoRedo.current = true

    // Save current state to allow redo
    if (historyIndex === history.length - 1) {
      setHistory(h => [...h, data])
    }

    const prevState = history[historyIndex]
    setDataInternal(prevState)
    setHistoryIndex(i => i - 1)
    setIsDirty(true)

    setTimeout(() => {
      isUndoRedo.current = false
    }, 0)
  }, [history, historyIndex, data])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return

    isUndoRedo.current = true

    const nextState = history[historyIndex + 2] || history[historyIndex + 1]
    if (nextState) {
      setDataInternal(nextState)
      setHistoryIndex(i => i + 1)
      setIsDirty(true)
    }

    setTimeout(() => {
      isUndoRedo.current = false
    }, 0)
  }, [history, historyIndex])

  // Export to JSON string
  const exportToJson = useCallback((): string => {
    return JSON.stringify(data, null, 2)
  }, [data])

  // Import from JSON string
  const importFromJson = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json)

      // Validate structure
      if (!parsed.startingCash || !parsed.funds || !parsed.expenses) {
        return false
      }

      // Validate funds array
      if (!Array.isArray(parsed.funds)) {
        return false
      }

      // Validate expenses object
      if (!parsed.expenses.team || !parsed.expenses.operations || !parsed.expenses.overhead) {
        return false
      }

      setData(parsed)
      return true
    } catch {
      return false
    }
  }, [setData])

  // Download as JSON file
  const downloadJson = useCallback(() => {
    const json = exportToJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-planner-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportToJson])

  // Reset to default
  const resetToDefault = useCallback(() => {
    setData(DEFAULT_BUDGET_DATA)
  }, [setData])

  // Save history periodically
  useEffect(() => {
    if (typeof window === 'undefined' || !enableHistory) return

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20))) // Keep last 20 in storage
      } catch {
        // Ignore
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [history, enableHistory])

  return {
    data,
    setData,
    canUndo: historyIndex >= 0 && history.length > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
    exportToJson,
    importFromJson,
    downloadJson,
    resetToDefault,
    isDirty,
    lastSaved,
  }
}
