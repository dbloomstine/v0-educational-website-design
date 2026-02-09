'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Building,
  Briefcase,
  Scale,
  AlertTriangle,
} from 'lucide-react'
import { expenseCategories, ExpenseCategory, Classification } from './expenseData'

// Classification display helpers
const classificationConfig: Record<Classification, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  'fund-expense': {
    label: 'Fund Expense',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: Building,
  },
  'management-expense': {
    label: 'Management Expense',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: Briefcase,
  },
  'case-by-case': {
    label: 'Case-by-Case',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Scale,
  },
}

function ClassificationBadge({ classification }: { classification: Classification }) {
  const config = classificationConfig[classification]
  return (
    <Badge className={`${config.bgColor} ${config.color} ${config.borderColor}`}>
      {config.label}
    </Badge>
  )
}

// Expense card with expandable details
function ExpenseCard({ expense }: { expense: ExpenseCategory }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = classificationConfig[expense.defaultClassification]

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            isExpanded
              ? 'bg-accent/50 border-border'
              : 'bg-accent/30 border-transparent hover:bg-accent/40'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{expense.name}</span>
                {expense.lpSensitivityLevel === 'high' && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {expense.description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ClassificationBadge classification={expense.defaultClassification} />
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-4">
          {/* Why this classification */}
          <div className="pt-3 border-t border-border/50">
            <h4 className="text-sm font-medium mb-2 text-foreground/80">Why this classification</h4>
            <p className="text-sm text-muted-foreground">{expense.detailedExplanation}</p>
          </div>

          {/* LP Sensitivities */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground/80">LP Sensitivities</h4>
            <p className="text-sm text-muted-foreground">{expense.lpSensitivities}</p>
          </div>

          {/* Examples */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground/80">Examples</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {expense.examples.map((example, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sample LPA Language */}
          {expense.sampleLanguage && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground/80">Sample LPA Language</h4>
              <div className="p-3 bg-muted/50 rounded-lg text-sm italic text-muted-foreground border border-border/50">
                {expense.sampleLanguage}
              </div>
            </div>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
            <span>
              Confidence: <Badge variant="outline" className="ml-1 text-xs">{expense.confidenceLevel}</Badge>
            </span>
            {expense.lpSensitivityLevel === 'high' && (
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                LP Sensitive
              </Badge>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Category section with collapsible list
function CategorySection({
  title,
  classification,
  expenses,
  defaultOpen = false,
}: {
  title: string
  classification: Classification
  expenses: ExpenseCategory[]
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const config = classificationConfig[classification]
  const Icon = config.icon

  if (expenses.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <h3 className={`text-sm font-medium ${config.color}`}>
              {title} ({expenses.length})
            </h3>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-3">
          {expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Main component
export function FundExpenseAllocation() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | Classification>('all')

  // Filter expenses based on search and filter
  const filteredExpenses = useMemo(() => {
    let result = expenseCategories

    // Filter by classification type
    if (filterType !== 'all') {
      result = result.filter((exp) => exp.defaultClassification === filterType)
    }

    // Filter by search query
    const query = searchQuery.toLowerCase().trim()
    if (query) {
      result = result.filter(
        (exp) =>
          exp.name.toLowerCase().includes(query) ||
          exp.description.toLowerCase().includes(query) ||
          exp.examples.some((ex) => ex.toLowerCase().includes(query))
      )
    }

    return result
  }, [searchQuery, filterType])

  // Group expenses by classification
  const grouped = useMemo(() => {
    return {
      'fund-expense': filteredExpenses.filter((e) => e.defaultClassification === 'fund-expense'),
      'management-expense': filteredExpenses.filter((e) => e.defaultClassification === 'management-expense'),
      'case-by-case': filteredExpenses.filter((e) => e.defaultClassification === 'case-by-case'),
    }
  }, [filteredExpenses])

  // Count by classification (unfiltered for stats)
  const counts = useMemo(() => ({
    fund: expenseCategories.filter((e) => e.defaultClassification === 'fund-expense').length,
    mgmt: expenseCategories.filter((e) => e.defaultClassification === 'management-expense').length,
    caseByCase: expenseCategories.filter((e) => e.defaultClassification === 'case-by-case').length,
  }), [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Fund Expense Allocation Guide</h1>
        <p className="text-muted-foreground">
          Learn how to classify common fund expenses between fund and management company
        </p>
      </div>

      {/* Stats bar */}
      <Card className="bg-accent/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Fund Expenses</p>
              <p className="text-lg font-semibold text-blue-400">{counts.fund}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Management Expenses</p>
              <p className="text-lg font-semibold text-emerald-400">{counts.mgmt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Case-by-Case</p>
              <p className="text-lg font-semibold text-amber-400">{counts.caseByCase}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses..."
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | Classification)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="fund-expense">Fund Expenses</SelectItem>
            <SelectItem value="management-expense">Management Expenses</SelectItem>
            <SelectItem value="case-by-case">Case-by-Case</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expense Categories */}
      <div className="space-y-4">
        {filterType === 'all' ? (
          <>
            <CategorySection
              title="Fund Expenses"
              classification="fund-expense"
              expenses={grouped['fund-expense']}
              defaultOpen={true}
            />
            <CategorySection
              title="Management Expenses"
              classification="management-expense"
              expenses={grouped['management-expense']}
            />
            <CategorySection
              title="Case-by-Case"
              classification="case-by-case"
              expenses={grouped['case-by-case']}
            />
          </>
        ) : (
          // When filtered to a specific type, show all expenses flat
          <div className="space-y-2">
            {filteredExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        )}

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No expense categories match your search.</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This tool provides general guidance on expense allocation
            practices. Actual treatment depends on your fund&apos;s specific LPA language, side letters,
            and applicable law. Consult legal and accounting professionals for definitive guidance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
