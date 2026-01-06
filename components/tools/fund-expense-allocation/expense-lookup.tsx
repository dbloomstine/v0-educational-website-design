'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Scale,
  Building2,
  Users,
  FileText,
  AlertCircle,
  Lightbulb,
  BookOpen,
  X,
} from 'lucide-react'
import {
  expenseCategories,
  fundTypes,
  type ExpenseCategory,
  type FundType,
  type Classification,
} from './expenseData'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Group expenses by their default classification
const groupedExpenses = {
  'fund-expense': expenseCategories.filter(e => e.defaultClassification === 'fund-expense'),
  'management-expense': expenseCategories.filter(e => e.defaultClassification === 'management-expense'),
  'case-by-case': expenseCategories.filter(e => e.defaultClassification === 'case-by-case'),
}

const classificationLabels: Record<Classification, string> = {
  'fund-expense': 'Fund Expense',
  'management-expense': 'Management Company Expense',
  'case-by-case': 'Case-by-Case',
}

const classificationDescriptions: Record<Classification, string> = {
  'fund-expense': 'Costs borne by the fund (LPs pay)',
  'management-expense': 'Costs borne by the GP/management company',
  'case-by-case': 'Depends on LPA terms and specific circumstances',
}

const classificationColors: Record<Classification, { bg: string; text: string; border: string; badge: string }> = {
  'fund-expense': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  'management-expense': {
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  },
  'case-by-case': {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
}

const confidenceLabels = {
  'high': { label: 'High confidence', color: 'text-emerald-600 dark:text-emerald-400' },
  'moderate': { label: 'Moderate confidence', color: 'text-amber-600 dark:text-amber-400' },
  'depends-on-lpa': { label: 'Check your LPA', color: 'text-blue-600 dark:text-blue-400' },
}

interface ExpenseLookupProps {
  onSelectExpense?: (expense: ExpenseCategory, fundType: FundType) => void
}

export function ExpenseLookup({ onSelectExpense }: ExpenseLookupProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExpense, setSelectedExpense] = useState<ExpenseCategory | null>(null)
  const [fundType, setFundType] = useState<FundType>('pe')
  const [expandedSections, setExpandedSections] = useState({
    explanation: true,
    lpSensitivities: false,
    examples: false,
    sampleLanguage: false,
  })

  // Filter expenses based on search
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedExpenses
    }
    const query = searchQuery.toLowerCase()
    const filterFn = (expense: ExpenseCategory) =>
      expense.name.toLowerCase().includes(query) ||
      expense.description.toLowerCase().includes(query) ||
      expense.tooltip.toLowerCase().includes(query)

    return {
      'fund-expense': groupedExpenses['fund-expense'].filter(filterFn),
      'management-expense': groupedExpenses['management-expense'].filter(filterFn),
      'case-by-case': groupedExpenses['case-by-case'].filter(filterFn),
    }
  }, [searchQuery])

  const totalResults = filteredExpenses['fund-expense'].length +
    filteredExpenses['management-expense'].length +
    filteredExpenses['case-by-case'].length

  const handleSelectExpense = (expense: ExpenseCategory) => {
    setSelectedExpense(expense)
    onSelectExpense?.(expense, fundType)
  }

  const handleClearSelection = () => {
    setSelectedExpense(null)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Render expense list item
  const renderExpenseItem = (expense: ExpenseCategory) => {
    const isSelected = selectedExpense?.id === expense.id
    const colors = classificationColors[expense.defaultClassification]

    return (
      <button
        key={expense.id}
        onClick={() => handleSelectExpense(expense)}
        className={`w-full text-left p-3 rounded-lg border transition-all ${
          isSelected
            ? `${colors.bg} ${colors.border} ring-2 ring-primary/50`
            : 'bg-card border-border hover:bg-muted/50 hover:border-primary/30'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground">{expense.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{expense.tooltip}</div>
          </div>
          {isSelected && (
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          )}
        </div>
      </button>
    )
  }

  // Render classification group
  const renderGroup = (classification: Classification, expenses: ExpenseCategory[]) => {
    if (expenses.length === 0) return null

    const colors = classificationColors[classification]
    const icon = classification === 'fund-expense' ? Users :
                 classification === 'management-expense' ? Building2 : Scale

    return (
      <div key={classification} className="space-y-2">
        <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
          {icon === Users && <Users className={`h-4 w-4 ${colors.text}`} />}
          {icon === Building2 && <Building2 className={`h-4 w-4 ${colors.text}`} />}
          {icon === Scale && <Scale className={`h-4 w-4 ${colors.text}`} />}
          <span className={`text-sm font-semibold ${colors.text}`}>
            {classificationLabels[classification]}
          </span>
          <span className="text-xs text-muted-foreground">({expenses.length})</span>
        </div>
        <div className="space-y-1.5">
          {expenses.map(renderExpenseItem)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Fund Expense Allocation Guide
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select an expense to see how it&apos;s typically classified and why.
          No confusing questions - just pick an expense and get your answer.
        </p>
      </div>

      {/* Educational disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 dark:text-blue-100">
          This is educational guidance based on industry practices. Always consult your fund&apos;s LPA and legal counsel for definitive answers.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Expense Selector */}
        <div className="space-y-4">
          {/* Search and Fund Type */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={fundType} onValueChange={(v) => setFundType(v as FundType)}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Fund Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fundTypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search results count */}
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              {totalResults} expense{totalResults !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Expense List */}
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {renderGroup('fund-expense', filteredExpenses['fund-expense'])}
            {renderGroup('case-by-case', filteredExpenses['case-by-case'])}
            {renderGroup('management-expense', filteredExpenses['management-expense'])}

            {totalResults === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No expenses match your search.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-primary hover:underline text-sm mt-2"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <AnimatePresence mode="wait">
            {selectedExpense ? (
              <motion.div
                key={selectedExpense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Classification Header */}
                <div className={`p-4 rounded-xl border ${classificationColors[selectedExpense.defaultClassification].bg} ${classificationColors[selectedExpense.defaultClassification].border}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-foreground">{selectedExpense.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{selectedExpense.description}</p>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Classification Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`text-sm px-3 py-1 ${classificationColors[selectedExpense.defaultClassification].badge}`}>
                      {selectedExpense.defaultClassification === 'fund-expense' && <Users className="h-3.5 w-3.5 mr-1.5" />}
                      {selectedExpense.defaultClassification === 'management-expense' && <Building2 className="h-3.5 w-3.5 mr-1.5" />}
                      {selectedExpense.defaultClassification === 'case-by-case' && <Scale className="h-3.5 w-3.5 mr-1.5" />}
                      {classificationLabels[selectedExpense.defaultClassification]}
                    </Badge>
                    <span className={`text-xs ${confidenceLabels[selectedExpense.confidenceLevel].color}`}>
                      {confidenceLabels[selectedExpense.confidenceLevel].label}
                    </span>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-3">
                    {selectedExpense.defaultClassification === 'fund-expense' && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                    {selectedExpense.defaultClassification === 'management-expense' && (
                      <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    {selectedExpense.defaultClassification === 'case-by-case' && (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedExpense.defaultClassification === 'fund-expense' && 'This is typically a Fund Expense'}
                        {selectedExpense.defaultClassification === 'management-expense' && 'This is typically a Management Company Expense'}
                        {selectedExpense.defaultClassification === 'case-by-case' && 'This depends on your specific situation'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {classificationDescriptions[selectedExpense.defaultClassification]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expandable Sections */}
                <div className="space-y-2">
                  {/* Detailed Explanation */}
                  <button
                    onClick={() => toggleSection('explanation')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Why this classification?</span>
                    </div>
                    {expandedSections.explanation ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <AnimatePresence>
                    {expandedSections.explanation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-card border border-border rounded-lg text-sm text-muted-foreground leading-relaxed">
                          {selectedExpense.detailedExplanation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* LP Sensitivities */}
                  <button
                    onClick={() => toggleSection('lpSensitivities')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">LP Sensitivities</span>
                      {selectedExpense.lpSensitivityLevel === 'high' && (
                        <Badge variant="warning" className="text-xs">High</Badge>
                      )}
                    </div>
                    {expandedSections.lpSensitivities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <AnimatePresence>
                    {expandedSections.lpSensitivities && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                          {selectedExpense.lpSensitivities}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Examples */}
                  <button
                    onClick={() => toggleSection('examples')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Examples</span>
                    </div>
                    {expandedSections.examples ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <AnimatePresence>
                    {expandedSections.examples && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {selectedExpense.examples.map((example, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sample LPA Language */}
                  {selectedExpense.sampleLanguage && (
                    <>
                      <button
                        onClick={() => toggleSection('sampleLanguage')}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-purple-500" />
                          <span className="font-medium text-sm">Sample LPA Language</span>
                        </div>
                        {expandedSections.sampleLanguage ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <AnimatePresence>
                        {expandedSections.sampleLanguage && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                              <p className="text-sm text-purple-900 dark:text-purple-100 italic font-mono leading-relaxed">
                                {selectedExpense.sampleLanguage}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                {/* Related Expenses */}
                {selectedExpense.similarExpenseIds.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Related Expenses</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedExpense.similarExpenseIds
                        .map(id => expenseCategories.find(e => e.id === id))
                        .filter(Boolean)
                        .slice(0, 3)
                        .map(expense => expense && (
                          <button
                            key={expense.id}
                            onClick={() => handleSelectExpense(expense)}
                            className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            {expense.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center bg-muted/30 rounded-xl border border-dashed border-border"
              >
                <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold text-foreground mb-2">Select an Expense</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Choose an expense from the list to see its typical classification and detailed guidance.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
