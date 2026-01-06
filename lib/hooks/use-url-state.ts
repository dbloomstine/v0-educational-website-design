"use client"

import { useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

/**
 * Hook for syncing state with URL search params
 * Allows users to share/bookmark tool configurations
 */
export function useUrlState<T extends Record<string, any>>(
  state: T,
  setState: (state: T) => void,
  options?: {
    debounceMs?: number
    paramPrefix?: string
  }
) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isInitialized = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  const debounceMs = options?.debounceMs ?? 500
  const paramPrefix = options?.paramPrefix ?? ''

  // Parse URL params on mount
  useEffect(() => {
    if (isInitialized.current) return

    const parsedState: Partial<T> = {}
    let hasParams = false

    for (const [key, defaultValue] of Object.entries(state)) {
      const paramKey = paramPrefix ? `${paramPrefix}_${key}` : key
      const paramValue = searchParams.get(paramKey)

      if (paramValue !== null) {
        hasParams = true
        // Parse based on type of default value
        if (typeof defaultValue === 'number') {
          parsedState[key as keyof T] = parseFloat(paramValue) as T[keyof T]
        } else if (typeof defaultValue === 'boolean') {
          parsedState[key as keyof T] = (paramValue === 'true') as T[keyof T]
        } else if (Array.isArray(defaultValue)) {
          try {
            parsedState[key as keyof T] = JSON.parse(decodeURIComponent(paramValue)) as T[keyof T]
          } catch {
            // Keep default if parsing fails
          }
        } else if (typeof defaultValue === 'object' && defaultValue !== null) {
          try {
            parsedState[key as keyof T] = JSON.parse(decodeURIComponent(paramValue)) as T[keyof T]
          } catch {
            // Keep default if parsing fails
          }
        } else {
          parsedState[key as keyof T] = paramValue as T[keyof T]
        }
      }
    }

    if (hasParams) {
      setState({ ...state, ...parsedState })
    }

    isInitialized.current = true
  }, []) // Only run on mount

  // Update URL when state changes (debounced)
  const updateUrl = useCallback((newState: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      const params = new URLSearchParams()

      for (const [key, value] of Object.entries(newState)) {
        const paramKey = paramPrefix ? `${paramPrefix}_${key}` : key

        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object') {
            params.set(paramKey, encodeURIComponent(JSON.stringify(value)))
          } else {
            params.set(paramKey, String(value))
          }
        }
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.replace(newUrl, { scroll: false })
    }, debounceMs)
  }, [pathname, router, debounceMs, paramPrefix])

  // Generate shareable URL
  const getShareableUrl = useCallback((): string => {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(state)) {
      const paramKey = paramPrefix ? `${paramPrefix}_${key}` : key

      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          params.set(paramKey, encodeURIComponent(JSON.stringify(value)))
        } else {
          params.set(paramKey, String(value))
        }
      }
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return params.toString() ? `${baseUrl}${pathname}?${params.toString()}` : `${baseUrl}${pathname}`
  }, [state, pathname, paramPrefix])

  // Copy URL to clipboard
  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    const url = getShareableUrl()
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return false
    }
  }, [getShareableUrl])

  return {
    updateUrl,
    getShareableUrl,
    copyShareableUrl,
    isInitialized: isInitialized.current
  }
}
