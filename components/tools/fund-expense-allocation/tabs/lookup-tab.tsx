'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useExpenseStore, expenseCategories, ExpenseCategory } from '../store'
import { Search, ChevronRight, Building, Briefcase, Scale, AlertTriangle } from 'lucide-react'

// Classification badge colors
function getClassificationBadge(classification: string) {
  switch (classification) {
    case 'fund-expense':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Fund Expense</Badge>
    case 'management-expense':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Management Expense</Badge>
    case 'case-by-case':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Case-by-Case</Badge>
    default:
      return null
  }
}

// Market practice badge
function getMarketPracticeBadge(practice: string) {
  switch (practice) {
    case 'common-fund':
      return <Badge variant="outline" className="text-xs">Common: Fund</Badge>
    case 'common-mgmt':
      return <Badge variant="outline" className="text-xs">Common: Management</Badge>
    case 'often-negotiated':
      return <Badge variant="outline" className="text-xs">Often Negotiated</Badge>
    case 'lp-focus-item':
      return <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">LP Focus Item</Badge>
    default:
      return null
  }
}

// Category detail panel
function CategoryDetail({ category }: { category: ExpenseCategory }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <CardDescription className="mt-1">{category.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {getClassificationBadge(category.defaultClassification)}
            {category.lpSensitivityLevel === 'high' && (
              <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                LP Sensitive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Detailed Explanation</h4>
          <p className="text-sm text-muted-foreground">{category.detailedExplanation}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">LP Sensitivities</h4>
          <p className="text-sm text-muted-foreground">{category.lpSensitivities}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Common Examples</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {category.examples.map((example, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {example}
              </li>
            ))}
          </ul>
        </div>

        {category.sampleLanguage && (
          <div>
            <h4 className="text-sm font-medium mb-2">Sample LPA Language</h4>
            <div className="p-3 bg-accent/30 rounded-lg text-sm italic text-muted-foreground">
              {category.sampleLanguage}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Market Practice:</span>
            {getMarketPracticeBadge(category.marketPractice)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <Badge variant="outline" className="text-xs">{category.confidenceLevel}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Category list item
function CategoryListItem({
  category,
  isSelected,
  onClick
}: {
  category: ExpenseCategory
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left rounded-lg border transition-colors ${
        isSelected
          ? 'bg-primary/10 border-primary'
          : 'bg-accent/30 border-transparent hover:bg-accent/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{category.name}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {category.description}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {getClassificationBadge(category.defaultClassification)}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  )
}

export function LookupTab() {
  const searchQuery = useExpenseStore(state => state.searchQuery)
  const setSearchQuery = useExpenseStore(state => state.setSearchQuery)
  const selectedCategory = useExpenseStore(state => state.selectedCategory)
  const selectCategory = useExpenseStore(state => state.selectCategory)

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return expenseCategories
    return expenseCategories.filter(cat =>
      cat.name.toLowerCase().includes(query) ||
      cat.description.toLowerCase().includes(query) ||
      cat.examples.some(ex => ex.toLowerCase().includes(query))
    )
  }, [searchQuery])

  // Group by classification
  const grouped = useMemo(() => {
    const groups = {
      'fund-expense': [] as ExpenseCategory[],
      'management-expense': [] as ExpenseCategory[],
      'case-by-case': [] as ExpenseCategory[]
    }
    filteredCategories.forEach(cat => {
      groups[cat.defaultClassification].push(cat)
    })
    return groups
  }, [filteredCategories])

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expense categories..."
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category list */}
        <div className="space-y-4">
          {/* Fund expenses */}
          {grouped['fund-expense'].length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-medium text-blue-400">Fund Expenses ({grouped['fund-expense'].length})</h3>
              </div>
              <div className="space-y-2">
                {grouped['fund-expense'].map(cat => (
                  <CategoryListItem
                    key={cat.id}
                    category={cat}
                    isSelected={selectedCategory?.id === cat.id}
                    onClick={() => selectCategory(cat)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Management expenses */}
          {grouped['management-expense'].length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-medium text-emerald-400">Management Expenses ({grouped['management-expense'].length})</h3>
              </div>
              <div className="space-y-2">
                {grouped['management-expense'].map(cat => (
                  <CategoryListItem
                    key={cat.id}
                    category={cat}
                    isSelected={selectedCategory?.id === cat.id}
                    onClick={() => selectCategory(cat)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Case by case */}
          {grouped['case-by-case'].length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-amber-400">Case-by-Case ({grouped['case-by-case'].length})</h3>
              </div>
              <div className="space-y-2">
                {grouped['case-by-case'].map(cat => (
                  <CategoryListItem
                    key={cat.id}
                    category={cat}
                    isSelected={selectedCategory?.id === cat.id}
                    onClick={() => selectCategory(cat)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No expense categories match your search.
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {selectedCategory ? (
            <CategoryDetail category={selectedCategory} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Select an expense category to see details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
