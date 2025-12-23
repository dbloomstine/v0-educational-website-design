"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { glossary } from './expenseData'

export function GlossarySection() {
  const [isOpen, setIsOpen] = useState(false)

  // Convert glossary object to array and sort alphabetically
  const terms = Object.entries(glossary)
    .map(([term, definition]) => ({
      term: term.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      definition
    }))
    .sort((a, b) => a.term.localeCompare(b.term))

  return (
    <Card className="border-muted">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Glossary</CardTitle>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Key terms used in fund expense allocation and LPA drafting.
            </p>
            <div className="space-y-4">
              {terms.map(({ term, definition }) => (
                <div key={term} className="pb-4 border-b border-border last:border-0 last:pb-0">
                  <dt className="font-semibold text-sm text-foreground mb-1">{term}</dt>
                  <dd className="text-sm text-muted-foreground leading-relaxed">{definition}</dd>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
