'use client'

import { useMemo } from 'react'
import { GlossaryBase, type GlossaryTerm } from '@/components/tools/shared'
import { glossary } from './expenseData'

/**
 * Convert glossary object from expenseData to GlossaryTerm array
 */
function convertGlossaryTerms(): GlossaryTerm[] {
  return Object.entries(glossary)
    .map(([key, definition]) => ({
      term: key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      definition
    }))
    .sort((a, b) => a.term.localeCompare(b.term))
}

export function GlossarySection() {
  const terms = useMemo(convertGlossaryTerms, [])

  return (
    <GlossaryBase
      terms={terms}
      title="Glossary"
      subtitle="Key terms used in fund expense allocation and LPA drafting."
      collapsible
      defaultCollapsed
      showSearch={false}
    />
  )
}
