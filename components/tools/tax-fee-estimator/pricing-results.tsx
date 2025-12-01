'use client'

import { useState } from 'react'
import { PricingOutput, TaxInput, formatCurrency } from './pricingData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ExportToolbar } from '@/components/tools/shared'
import { DisclaimerBlock } from '@/components/tools/shared'
import { exportTaxCSV, exportTaxPDF, includedServices, outOfScopeServices } from './export'

interface PricingResultsProps {
  output: PricingOutput
  input: TaxInput
}

export function PricingResults({ output, input }: PricingResultsProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showDrivers, setShowDrivers] = useState(true)
  const [showScope, setShowScope] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleCSVExport = () => {
    setCsvLoading(true)
    setTimeout(() => {
      exportTaxCSV(input, output)
      setCsvLoading(false)
    }, 100)
  }

  const handlePDFExport = () => {
    setPdfLoading(true)
    setTimeout(() => {
      exportTaxPDF(input, output)
      setPdfLoading(false)
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Main Estimate Card */}
      <Card className="border-2 border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl">Estimated Annual Tax Fees</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tax compliance and K-1 preparation costs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-700 dark:text-green-400 mb-2 font-medium">Low Estimate</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(output.lowEstimate)}</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Most Likely</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(output.mediumEstimate)}</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-2 font-medium">High Estimate</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{formatCurrency(output.highEstimate)}</p>
            </div>
          </div>

          {/* Visual Range Indicator */}
          <div className="mt-6 relative h-3 rounded-full bg-gradient-to-r from-green-500/20 via-blue-500/20 to-orange-500/20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/40 via-blue-500/40 to-orange-500/40" />
            <div className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-green-500" style={{ left: '0%' }} />
            <div className="absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-blue-500 bg-blue-500 shadow-lg" style={{ left: '50%' }} />
            <div className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-orange-500" style={{ right: '0%' }} />
          </div>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                These estimates reflect typical mid-tier tax firms serving private investment funds. Big 4 firms typically charge 30-50% more.
                Regional firms may offer 15-25% lower fees for simpler structures. Actual costs depend on specific scope, firm experience,
                and your relationship.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <Card>
        <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detailed Fee Breakdown</CardTitle>
                {showBreakdown ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              <div className="space-y-3">
                {output.breakdown.map((item, index) => (
                  <div key={index} className="border-l-4 border-primary/30 pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-semibold text-sm">{item.category}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <p className="text-sm font-medium whitespace-nowrap ml-4">
                        {formatCurrency(item.medium)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="font-bold">Total (Medium Estimate)</p>
                <p className="font-bold text-lg text-primary">
                  {formatCurrency(output.mediumEstimate)}
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Cost Drivers */}
      {output.drivers.length > 0 && (
        <Card>
          <Collapsible open={showDrivers} onOpenChange={setShowDrivers}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    What's Driving Your Tax Fees ({output.drivers.length} factors)
                  </CardTitle>
                  {showDrivers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t pt-4">
                <div className="space-y-3">
                  {output.drivers.map((driver, idx) => {
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
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{driver.title}</p>
                              {driver.impact === 'positive' && (
                                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                                  Cost Reduction
                                </span>
                              )}
                              {driver.impact === 'negative' && (
                                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-600 dark:text-orange-400">
                                  Cost Driver
                                </span>
                              )}
                            </div>
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

      {/* Scope & Assumptions */}
      <Card>
        <Collapsible open={showScope} onOpenChange={setShowScope}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Scope & Assumptions</CardTitle>
                {showScope ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-green-700 dark:text-green-400">
                    What's Typically Included
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
                  <h4 className="font-semibold text-sm mb-3 text-orange-700 dark:text-orange-400">
                    Often NOT Included (Additional Fees)
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
                <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">How to Use This Estimate</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Use this as a starting point for budgeting and RFP discussions. Most tax firms will provide a
                  fixed-fee engagement letter after reviewing your specific situation. Expect fees to be lower in
                  subsequent years as efficiency improves, unless fund complexity increases significantly.
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
        additionalDisclaimer="Consult with qualified tax professionals for actual fee quotes and tax advice specific to your fund."
      />
    </div>
  )
}
