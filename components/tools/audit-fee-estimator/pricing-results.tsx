"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PricingOutput, formatCurrency } from './pricingData'
import { includedServices, outOfScopeServices } from './export'
import { ExportToolbar } from '@/components/tools/shared'
import { DisclaimerBlock } from '@/components/tools/shared'

interface PricingResultsProps {
  results: PricingOutput
  onExportCSV: () => void
  onExportPDF: () => void
}

export function PricingResults({ results, onExportCSV, onExportPDF }: PricingResultsProps) {
  const [showDrivers, setShowDrivers] = useState(true)
  const [showScope, setShowScope] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const { lowEstimate, mediumEstimate, highEstimate, drivers } = results

  const handleCSVExport = () => {
    setCsvLoading(true)
    setTimeout(() => {
      onExportCSV()
      setCsvLoading(false)
    }, 100)
  }

  const handlePDFExport = () => {
    setPdfLoading(true)
    setTimeout(() => {
      onExportPDF()
      setPdfLoading(false)
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Annual Fee Estimates */}
      <Card className="border-2 border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl">Estimated Annual Audit Fees</CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on your fund profile and complexity factors
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-700 dark:text-green-400 mb-2 font-medium">Low Estimate</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">{formatCurrency(lowEstimate)}</p>
              <p className="text-xs text-muted-foreground mt-2">Conservative scenario</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Mid Estimate</p>
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(mediumEstimate)}</p>
              <p className="text-xs text-muted-foreground mt-2">Most likely scenario</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-2 font-medium">High Estimate</p>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">{formatCurrency(highEstimate)}</p>
              <p className="text-xs text-muted-foreground mt-2">Complex scenario</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Important Planning Reminder</p>
                <p className="text-amber-800 dark:text-amber-200">
                  These are rough planning estimates based on typical market ranges. Actual fees vary by audit firm, scope, timing, and specific circumstances. Always request formal proposals from 2-3 qualified audit firms.
                </p>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="mt-6">
            <div className="flex items-end justify-between gap-4 h-40">
              <div className="flex-1 flex flex-col justify-end items-center">
                <div
                  className="w-full bg-green-500/40 rounded-t-lg transition-all"
                  style={{ height: `${(lowEstimate / highEstimate) * 100}%` }}
                />
                <p className="text-xs text-muted-foreground mt-2">Low</p>
              </div>
              <div className="flex-1 flex flex-col justify-end items-center">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all"
                  style={{ height: `${(mediumEstimate / highEstimate) * 100}%` }}
                />
                <p className="text-xs font-semibold mt-2">Mid</p>
              </div>
              <div className="flex-1 flex flex-col justify-end items-center">
                <div className="w-full bg-orange-500/40 rounded-t-lg h-full transition-all" />
                <p className="text-xs text-muted-foreground mt-2">High</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Drivers */}
      {drivers.length > 0 && (
        <Card>
          <Collapsible open={showDrivers} onOpenChange={setShowDrivers}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">What's Driving This Estimate?</CardTitle>
                  {showDrivers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Key factors influencing your audit fee range:
                </p>
                <div className="space-y-3">
                  {drivers.map((driver, idx) => {
                    const impactIcon = driver.impact === 'positive' ? TrendingDown :
                                      driver.impact === 'negative' ? TrendingUp : Minus
                    const impactColor = driver.impact === 'positive' ? 'text-green-600 dark:text-green-400' :
                                       driver.impact === 'negative' ? 'text-orange-600 dark:text-orange-400' :
                                       'text-blue-600 dark:text-blue-400'
                    const bgColor = driver.impact === 'positive' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' :
                                   driver.impact === 'negative' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900' :
                                   'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                    const Icon = impactIcon

                    return (
                      <div key={idx} className={`border-l-4 pl-4 py-3 ${bgColor} rounded-r`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 ${impactColor} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{driver.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{driver.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Scope of Services */}
      <Card>
        <Collapsible open={showScope} onOpenChange={setShowScope}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">What's Typically Included vs. Out of Scope</CardTitle>
                {showScope ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-green-700 dark:text-green-400 flex items-center gap-2">
                    <span className="text-lg">Included</span> in Base Audit
                  </h4>
                  <ul className="space-y-2">
                    {includedServices.map((item, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-orange-700 dark:text-orange-400 flex items-center gap-2">
                    <span className="text-lg">Usually</span> Billed Separately
                  </h4>
                  <ul className="space-y-2">
                    {outOfScopeServices.map((item, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Pro Tip:</strong> When requesting proposals, clearly specify what's in scope vs. optional. Ask for separate pricing for tax services, AUPs, and any special reports so you can budget accurately and compare quotes on an apples-to-apples basis.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Export Toolbar */}
      <ExportToolbar
        onExportCSV={handleCSVExport}
        onExportPDF={handlePDFExport}
        csvLoading={csvLoading}
        pdfLoading={pdfLoading}
      />

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Always obtain formal proposals from qualified audit firms and consult with your legal and financial advisors before making decisions."
      />
    </div>
  )
}
