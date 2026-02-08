"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ToolFiltersProps {
  categories: string[]
  personas: string[]
  complexities: string[]
}

export function ToolFilters({ categories, personas, complexities }: ToolFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [selectedComplexities, setSelectedComplexities] = useState<string[]>([])

  // Initialize from URL params
  useEffect(() => {
    const cats = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const pers = searchParams.get('personas')?.split(',').filter(Boolean) || []
    const comp = searchParams.get('complexities')?.split(',').filter(Boolean) || []

    setSelectedCategories(cats)
    setSelectedPersonas(pers)
    setSelectedComplexities(comp)
  }, [searchParams])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','))
    }
    if (selectedPersonas.length > 0) {
      params.set('personas', selectedPersonas.join(','))
    }
    if (selectedComplexities.length > 0) {
      params.set('complexities', selectedComplexities.join(','))
    }

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname

    router.push(newUrl, { scroll: false })
  }, [selectedCategories, selectedPersonas, selectedComplexities, pathname, router])

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const togglePersona = (persona: string) => {
    setSelectedPersonas(prev =>
      prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona]
    )
  }

  const toggleComplexity = (complexity: string) => {
    setSelectedComplexities(prev =>
      prev.includes(complexity)
        ? prev.filter(c => c !== complexity)
        : [...prev, complexity]
    )
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedPersonas([])
    setSelectedComplexities([])
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedPersonas.length > 0 ||
    selectedComplexities.length > 0

  return (
    <div className="space-y-6">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Filter Tools
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      {/* Category Filters */}
      <fieldset className="space-y-2 border-0 p-0 m-0">
        <legend className="text-sm font-medium">Category</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategories.includes(category) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCategory(category)}
              className="text-xs"
              aria-pressed={selectedCategories.includes(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Persona Filters */}
      <fieldset className="space-y-2 border-0 p-0 m-0">
        <legend className="text-sm font-medium">Persona</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Persona filters">
          {personas.map((persona) => (
            <Button
              key={persona}
              variant={selectedPersonas.includes(persona) ? "default" : "outline"}
              size="sm"
              onClick={() => togglePersona(persona)}
              className="text-xs"
              aria-pressed={selectedPersonas.includes(persona)}
            >
              {persona}
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Complexity Filters */}
      <fieldset className="space-y-2 border-0 p-0 m-0">
        <legend className="text-sm font-medium">Complexity</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Complexity filters">
          {complexities.map((complexity) => (
            <Button
              key={complexity}
              variant={selectedComplexities.includes(complexity) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleComplexity(complexity)}
              className="text-xs"
              aria-pressed={selectedComplexities.includes(complexity)}
            >
              {complexity}
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Active filter count */}
      {hasActiveFilters && (
        <div className="pt-2 text-sm text-muted-foreground">
          {selectedCategories.length + selectedPersonas.length + selectedComplexities.length} filter(s) active
        </div>
      )}
    </div>
  )
}
