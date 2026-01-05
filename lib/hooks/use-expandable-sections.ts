"use client"

import { useState, useCallback } from 'react'

export interface UseExpandableSectionsOptions {
  /** Initial expanded state for each section */
  initialState?: Record<string, boolean>
  /** Allow multiple sections to be open at once (default: true) */
  allowMultiple?: boolean
}

/**
 * Hook for managing multiple expandable/collapsible sections
 * Used by tool components for FAQ, Glossary, What-If, etc.
 */
export function useExpandableSections(options: UseExpandableSectionsOptions = {}) {
  const { initialState = {}, allowMultiple = true } = options

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialState)

  /**
   * Toggle a section's expanded state
   */
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      if (allowMultiple) {
        return { ...prev, [sectionId]: !prev[sectionId] }
      }
      // Single mode: close all others when opening one
      const newState: Record<string, boolean> = {}
      for (const key of Object.keys(prev)) {
        newState[key] = key === sectionId ? !prev[sectionId] : false
      }
      return newState
    })
  }, [allowMultiple])

  /**
   * Check if a section is expanded
   */
  const isExpanded = useCallback((sectionId: string): boolean => {
    return !!expandedSections[sectionId]
  }, [expandedSections])

  /**
   * Expand a specific section
   */
  const expandSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: true }))
  }, [])

  /**
   * Collapse a specific section
   */
  const collapseSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: false }))
  }, [])

  /**
   * Expand all sections
   */
  const expandAll = useCallback(() => {
    setExpandedSections(prev => {
      const newState: Record<string, boolean> = {}
      for (const key of Object.keys(prev)) {
        newState[key] = true
      }
      return newState
    })
  }, [])

  /**
   * Collapse all sections
   */
  const collapseAll = useCallback(() => {
    setExpandedSections(prev => {
      const newState: Record<string, boolean> = {}
      for (const key of Object.keys(prev)) {
        newState[key] = false
      }
      return newState
    })
  }, [])

  return {
    expandedSections,
    toggleSection,
    isExpanded,
    expandSection,
    collapseSection,
    expandAll,
    collapseAll
  }
}
