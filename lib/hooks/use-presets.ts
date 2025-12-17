"use client"

import { useState, useEffect, useCallback } from 'react'

export interface Preset<T> {
  id: string
  name: string
  data: T
  createdAt: number
}

interface UsePresetsOptions<T> {
  /** Unique storage key for this tool's presets */
  storageKey: string
  /** Maximum number of presets to store */
  maxPresets?: number
}

/**
 * Hook for managing user presets with localStorage persistence
 *
 * @example
 * ```tsx
 * const { presets, savePreset, loadPreset, deletePreset } = usePresets<WaterfallInput>({
 *   storageKey: 'waterfall-presets'
 * })
 * ```
 */
export function usePresets<T>({ storageKey, maxPresets = 10 }: UsePresetsOptions<T>) {
  const [presets, setPresets] = useState<Preset<T>[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load presets from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as Preset<T>[]
        setPresets(parsed)
      }
    } catch (error) {
      console.error('Error loading presets:', error)
    }
    setIsLoaded(true)
  }, [storageKey])

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(presets))
    } catch (error) {
      console.error('Error saving presets:', error)
    }
  }, [presets, storageKey, isLoaded])

  const savePreset = useCallback((name: string, data: T): Preset<T> => {
    const newPreset: Preset<T> = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      data,
      createdAt: Date.now()
    }

    setPresets(current => {
      // Add new preset at the beginning, limit to maxPresets
      const updated = [newPreset, ...current].slice(0, maxPresets)
      return updated
    })

    return newPreset
  }, [maxPresets])

  const loadPreset = useCallback((id: string): T | null => {
    const preset = presets.find(p => p.id === id)
    return preset?.data ?? null
  }, [presets])

  const deletePreset = useCallback((id: string) => {
    setPresets(current => current.filter(p => p.id !== id))
  }, [])

  const renamePreset = useCallback((id: string, newName: string) => {
    setPresets(current =>
      current.map(p => p.id === id ? { ...p, name: newName } : p)
    )
  }, [])

  const clearAllPresets = useCallback(() => {
    setPresets([])
  }, [])

  return {
    presets,
    isLoaded,
    savePreset,
    loadPreset,
    deletePreset,
    renamePreset,
    clearAllPresets
  }
}
