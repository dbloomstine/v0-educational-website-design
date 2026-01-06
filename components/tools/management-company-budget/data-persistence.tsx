"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Save,
  Cloud,
  CloudOff,
  Download,
  Upload,
  Clock,
  History,
  RotateCcw
} from 'lucide-react'
import { BudgetData } from './types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

const STORAGE_KEY = 'mcb-saved-budget'
const HISTORY_KEY = 'mcb-budget-history'
const MAX_HISTORY = 10

interface SavedState {
  data: BudgetData
  savedAt: number
  name?: string
}

interface AutoSaveIndicatorProps {
  data: BudgetData
  onRestore: (data: BudgetData) => void
  className?: string
}

export function AutoSaveIndicator({ data, onRestore, className }: AutoSaveIndicatorProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [history, setHistory] = useState<SavedState[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<string>('')

  // Load history on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY)
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData) as SavedState
        setLastSaved(new Date(parsed.savedAt))
      }
    } catch {
      // Ignore errors
    }
  }, [])

  // Auto-save on data change
  useEffect(() => {
    const currentData = JSON.stringify(data)

    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) {
      return
    }
    previousDataRef.current = currentData

    setSaveStatus('unsaved')

    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving')

      try {
        const saveState: SavedState = {
          data,
          savedAt: Date.now()
        }

        // Save current state
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState))

        // Add to history
        const newHistory = [saveState, ...history].slice(0, MAX_HISTORY)
        setHistory(newHistory)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))

        setLastSaved(new Date())
        setSaveStatus('saved')
      } catch {
        // Silent fail - localStorage may be unavailable
        setSaveStatus('unsaved')
      }
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [data, history])

  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  // Export to JSON
  const handleExport = () => {
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import from JSON
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const imported = JSON.parse(text) as BudgetData
        // Basic validation
        if (imported.startingCash && imported.funds && imported.expenses) {
          onRestore(imported)
        } else {
          alert('Invalid budget file format')
        }
      } catch {
        alert('Failed to parse budget file')
      }
    }
    input.click()
  }

  // Restore from history
  const handleRestore = (state: SavedState) => {
    onRestore(state.data)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Save Status Indicator */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {saveStatus === 'saved' && (
          <>
            <Cloud className="h-3.5 w-3.5 text-emerald-500" />
            <span>Saved {lastSaved ? formatRelativeTime(lastSaved) : ''}</span>
          </>
        )}
        {saveStatus === 'saving' && (
          <>
            <Save className="h-3.5 w-3.5 animate-pulse text-blue-500" />
            <span>Saving...</span>
          </>
        )}
        {saveStatus === 'unsaved' && (
          <>
            <CloudOff className="h-3.5 w-3.5 text-amber-500" />
            <span>Unsaved changes</span>
          </>
        )}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
            <History className="h-3.5 w-3.5" />
            <span className="text-xs">History</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Data Management</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import from JSON
          </DropdownMenuItem>

          {history.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Recent Versions
              </DropdownMenuLabel>
              {history.slice(0, 5).map((state, idx) => (
                <DropdownMenuItem
                  key={idx}
                  onClick={() => handleRestore(state)}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  {formatRelativeTime(new Date(state.savedAt))}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Hook for using auto-save
export function useAutoSave(data: BudgetData) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    setIsSaving(true)
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          data,
          savedAt: Date.now()
        }))
        setLastSaved(new Date())
      } catch {
        // Silent fail - auto-save unavailable
      }
      setIsSaving(false)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [data])

  return { isSaving, lastSaved }
}

// Load saved data on mount
export function loadSavedData(): BudgetData | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as SavedState
      return parsed.data
    }
  } catch {
    // Ignore
  }
  return null
}
