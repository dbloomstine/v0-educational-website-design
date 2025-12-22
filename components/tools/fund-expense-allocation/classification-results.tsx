"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AlertCircle, ChevronDown, ChevronUp, RotateCcw, TrendingUp } from 'lucide-react'
import { ExportToolbar, MobileExportBar, DisclaimerBlock, RelatedToolsSection } from '@/components/tools/shared'
import { exportToPDF, exportToCSV, exportToExcel } from './exportPDF'
import type { ClassificationResult as Result, ClassificationInput } from './expenseData'

interface ClassificationResultsProps {
  result: Result
  input: ClassificationInput
  onExport: () => void
  onReset: () => void
}

export function ClassificationResults({ result, input, onExport, onReset }: ClassificationResultsProps) {
  const [showDetailed, setShowDetailed] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [showLogic, setShowLogic] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleExportCSV = async () => {
    setCsvLoading(true)
    try {
      exportToCSV(input, result)
    } finally {
      setCsvLoading(false)
    }
  }

  const handleExportExcel = async () => {
    setExcelLoading(true)
    try {
      exportToExcel(input, result)
    } finally {
      setExcelLoading(false)
    }
  }

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      exportToPDF(input, result)
    } finally {
      setPdfLoading(false)
    }
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'fund-expense':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
      case 'management-expense':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
      case 'case-by-case':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800'
      default:
        return 'bg-muted text-foreground border-border'
    }
  }

  const getMarketPracticeBadge = (practice: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'common-fund': { label: 'Common Fund Expense', color: 'bg-green-100 text-green-700 border-green-300' },
      'common-mgmt': { label: 'Common Management Expense', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      'often-negotiated': { label: 'Often Negotiated', color: 'bg-purple-100 text-purple-700 border-purple-300' },
      'lp-focus-item': { label: 'LP Focus Item', color: 'bg-orange-100 text-orange-700 border-orange-300' }
    }

    const badge = badges[practice] || { label: practice, color: 'bg-muted text-muted-foreground border-border' }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getConfidenceBadge = (confidence: 'high' | 'moderate' | 'depends-on-lpa') => {
    const badges = {
      'high': {
        label: 'High Confidence',
        color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
      },
      'moderate': {
        label: 'Moderate Confidence',
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
      },
      'depends-on-lpa': {
        label: 'Depends on LPA Terms',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
      }
    }

    const badge = badges[confidence]
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getLpSensitivityBadge = (sensitivity: 'high' | 'standard') => {
    const badges = {
      'high': {
        label: 'High LP Focus',
        color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
        description: 'LPs typically scrutinize this expense type closely'
      },
      'standard': {
        label: 'Standard',
        color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800',
        description: 'Normal operating expense with standard LP expectations'
      }
    }

    const badge = badges[sensitivity]
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`} title={badge.description}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="space-y-4" id="results">
      {/* Headline Classification */}
      <Card className={`border-2 ${getClassificationColor(result.classification)}`}>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <CardTitle className="text-xl">{result.headline}</CardTitle>
            {getMarketPracticeBadge(result.marketPractice)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed">{result.rationale}</p>

          {/* Quick Win Indicators */}
          <div className="pt-3 border-t space-y-3">
            <div>
              <h5 className="text-sm font-semibold mb-2">Confidence Level</h5>
              {getConfidenceBadge(result.confidenceLevel)}
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-2">LP Sensitivity</h5>
              {getLpSensitivityBadge(result.lpSensitivityLevel)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flags and Alerts */}
      {result.flags.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">Important Considerations</h4>
                <ul className="space-y-2">
                  {result.flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                      • {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Explanation */}
      <Card>
        <Collapsible open={showDetailed} onOpenChange={setShowDetailed}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Detailed Explanation</CardTitle>
                {showDetailed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <h5 className="font-semibold mb-2">How This Works</h5>
                <p className="text-muted-foreground leading-relaxed">{result.detailedExplanation}</p>
              </div>
              <div>
                <h5 className="font-semibold mb-2">LP Sensitivities</h5>
                <p className="text-muted-foreground leading-relaxed">{result.lpSensitivities}</p>
              </div>
              {result.sampleLanguage && (
                <div>
                  <h5 className="font-semibold mb-2">Sample LPA Language</h5>
                  <div className="bg-muted border rounded p-4 text-sm font-mono leading-relaxed">
                    {result.sampleLanguage}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Examples */}
      {result.examples.length > 0 && (
        <Card>
          <Collapsible open={showExamples} onOpenChange={setShowExamples}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Examples</CardTitle>
                  {showExamples ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t pt-4">
                <ul className="space-y-2">
                  {result.examples.map((example, idx) => (
                    <li key={idx} className="text-muted-foreground leading-relaxed flex items-start">
                      <span className="text-primary mr-2 flex-shrink-0">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Logic Explanation */}
      {result.logicExplanation.length > 0 && (
        <Card>
          <Collapsible open={showLogic} onOpenChange={setShowLogic}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Classification Logic</CardTitle>
                  {showLogic ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  This classification was determined based on the following factors:
                </p>
                <ul className="space-y-2">
                  {result.logicExplanation.map((logic, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground leading-relaxed flex items-start">
                      <span className="text-primary mr-2 flex-shrink-0">→</span>
                      <span>{logic}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Similar Expenses */}
      {result.similarExpenses.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              You Might Also Want to Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Similar expenses that are commonly reviewed together:
            </p>
            <div className="flex flex-wrap gap-2">
              {result.similarExpenses.map((expense, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                >
                  {expense}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExportToolbar
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            csvLoading={csvLoading}
            excelLoading={excelLoading}
            pdfLoading={pdfLoading}
            compact
          />
          <Button onClick={onReset} variant="outline" className="w-full sm:w-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Analyze Another Expense
          </Button>
        </CardContent>
      </Card>

      {/* Related Tools */}
      <RelatedToolsSection
        currentToolSlug="fund-expense-allocation"
        relatedTools={[
          {
            slug: 'management-company-budget',
            title: 'Management Company Budget Planner',
            description: 'Calculate your burn rate, runway, and seed capital needs with a simple budget model.',
            reason: 'Use your expense classifications to build an accurate management company budget'
          },
          {
            slug: 'fund-launch-guide',
            title: 'Fund Launch Guide',
            description: 'Interactive checklist and guide for launching your fund.',
            reason: 'Track your fund formation progress and ensure proper expense policies are in place'
          }
        ]}
        learningPath="Build compliant operations: Expense Allocation → Budget Planner → Fund Launch Guide"
      />

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Actual expense treatment should be determined in consultation with legal counsel, fund administrators, auditors, and as specified in your fund's governing documents."
      />

      {/* Mobile Export Bar */}
      <MobileExportBar
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        csvLoading={csvLoading}
        excelLoading={excelLoading}
        pdfLoading={pdfLoading}
      />
    </div>
  )
}
