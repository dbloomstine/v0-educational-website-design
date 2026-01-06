"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export interface UsePersistedStateOptions<T> {
  /** localStorage key for persistence */
  storageKey: string
  /** URL parameter mappings (state key -> URL param name) */
  urlParams?: Record<keyof T, string>
  /** Debounce delay for URL/storage updates in ms (default: 500) */
  debounceMs?: number
  /** Whether to sync with URL (default: true) */
  syncUrl?: boolean
  /** Whether to sync with localStorage (default: true) */
  syncStorage?: boolean
}

/**
 * Hook for persisting state to both URL params and localStorage
 * Provides shareable URLs and persistent state across sessions
 *
 * Used by tool components like Distribution Waterfall, Fund Launch Guide, etc.
 */
export function usePersistedState<T extends Record<string, any>>(
  defaultState: T,
  options: UsePersistedStateOptions<T>
) {
  const {
    storageKey,
    urlParams,
    debounceMs = 500,
    syncUrl = true,
    syncStorage = true
  } = options

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isInitialized = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  /**
   * Load initial state from URL or localStorage
   */
  const getInitialState = useCallback((): T => {
    if (typeof window === 'undefined') return defaultState

    // Try URL params first if enabled
    if (syncUrl && urlParams) {
      const firstParamKey = Object.values(urlParams)[0]
      const hasUrlParams = searchParams.get(firstParamKey as string)

      if (hasUrlParams) {
        const parsed: Partial<T> = {}
        for (const [stateKey, paramName] of Object.entries(urlParams)) {
          const value = searchParams.get(paramName)
          if (value !== null) {
            const defaultValue = defaultState[stateKey as keyof T]
            if (typeof defaultValue === 'number') {
              parsed[stateKey as keyof T] = parseFloat(value) as T[keyof T]
            } else if (typeof defaultValue === 'boolean') {
              parsed[stateKey as keyof T] = (value === 'true') as T[keyof T]
            } else if (typeof defaultValue === 'object') {
              try {
                parsed[stateKey as keyof T] = JSON.parse(decodeURIComponent(value))
              } catch {
                // Keep default
              }
            } else {
              parsed[stateKey as keyof T] = value as T[keyof T]
            }
          }
        }
        return { ...defaultState, ...parsed }
      }
    }

    // Try localStorage if enabled
    if (syncStorage) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Support both direct state and wrapped state with metadata
          const state = parsed.input || parsed.state || parsed
          return { ...defaultState, ...state }
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    return defaultState
  }, [defaultState, searchParams, storageKey, syncStorage, syncUrl, urlParams])

  const [state, setState] = useState<T>(getInitialState)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Initialize from URL/storage on mount
  useEffect(() => {
    if (isInitialized.current) return
    setState(getInitialState())
    isInitialized.current = true
  }, [])

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !syncStorage || !isInitialized.current) return

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          state,
          lastModified: new Date().toISOString()
        }))
        setLastSaved(new Date())
      } catch {
        // Ignore localStorage errors
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [state, storageKey, debounceMs, syncStorage])

  // Update URL when state changes
  useEffect(() => {
    if (!syncUrl || !urlParams || !isInitialized.current) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      const params = new URLSearchParams()

      for (const [stateKey, paramName] of Object.entries(urlParams)) {
        const value = state[stateKey as keyof T]
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object') {
            params.set(paramName, encodeURIComponent(JSON.stringify(value)))
          } else {
            params.set(paramName, String(value))
          }
        }
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, debounceMs)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [state, urlParams, pathname, router, debounceMs, syncUrl])

  /**
   * Generate a shareable URL with current state
   */
  const getShareableUrl = useCallback((): string => {
    if (!urlParams) return typeof window !== 'undefined' ? window.location.href : ''

    const params = new URLSearchParams()

    for (const [stateKey, paramName] of Object.entries(urlParams)) {
      const value = state[stateKey as keyof T]
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          params.set(paramName, encodeURIComponent(JSON.stringify(value)))
        } else {
          params.set(paramName, String(value))
        }
      }
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return params.toString() ? `${baseUrl}${pathname}?${params.toString()}` : `${baseUrl}${pathname}`
  }, [state, urlParams, pathname])

  /**
   * Copy shareable URL to clipboard
   */
  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    const url = getShareableUrl()
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return false
    }
  }, [getShareableUrl])

  /**
   * Reset state to defaults and clear storage
   */
  const resetState = useCallback(() => {
    setState(defaultState)
    if (syncStorage && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Ignore
      }
    }
  }, [defaultState, storageKey, syncStorage])

  /**
   * Update a specific field in the state
   */
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({ ...prev, [field]: value }))
  }, [])

  return {
    state,
    setState,
    updateField,
    resetState,
    getShareableUrl,
    copyShareableUrl,
    lastSaved,
    isInitialized: isInitialized.current
  }
}
