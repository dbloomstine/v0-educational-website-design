'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useExpenseStore, useShowOnboarding, expenseCategories } from './store'
import { LookupTab } from './tabs/lookup-tab'
import { RotateCcw, Scale, Building, Briefcase } from 'lucide-react'

// Quick start dialog
function QuickStartDialog() {
  const showOnboarding = useShowOnboarding()
  const setShowOnboarding = useExpenseStore(state => state.setShowOnboarding)

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Fund Expense Allocation
          </DialogTitle>
          <DialogDescription>
            Determine proper expense allocation between fund and management company
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                <Building className="h-4 w-4" />
                Fund Expenses
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Costs that directly benefit the fund and its LPs (audit, legal, deal costs)
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                <Briefcase className="h-4 w-4" />
                Management Expenses
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overhead costs that benefit the GP (office, fundraising, platform tech)
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 font-medium text-sm">
                <Scale className="h-4 w-4" />
                Case-by-Case
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Expenses that depend on specific circumstances and LPA language
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => setShowOnboarding(false)}
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main component
export function FundExpenseAllocation() {
  const reset = useExpenseStore(state => state.reset)

  // Count categories by classification
  const fundExpenseCount = expenseCategories.filter(c => c.defaultClassification === 'fund-expense').length
  const mgmtExpenseCount = expenseCategories.filter(c => c.defaultClassification === 'management-expense').length
  const caseByCase = expenseCategories.filter(c => c.defaultClassification === 'case-by-case').length

  return (
    <div className="space-y-6">
      <QuickStartDialog />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fund Expense Allocation</h1>
          <p className="text-muted-foreground">
            Classify expenses between fund and management company
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Key metrics bar */}
      <Card className="bg-accent/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Fund Expenses</p>
              <p className="text-lg font-semibold text-blue-400">{fundExpenseCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Management Expenses</p>
              <p className="text-lg font-semibold text-emerald-400">{mgmtExpenseCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Case-by-Case</p>
              <p className="text-lg font-semibold text-amber-400">{caseByCase}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="mt-6">
        <LookupTab />
      </div>

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This tool provides general guidance on expense allocation
            practices. Actual treatment depends on your fund's specific LPA language, side letters,
            and applicable law. Consult legal and accounting professionals for definitive guidance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
