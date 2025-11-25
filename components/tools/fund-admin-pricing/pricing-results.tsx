"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { PricingOutput, formatCurrency } from './pricingData'

interface PricingResultsProps {
  results: PricingOutput
  onExport: () => void
}

export function PricingResults({ results, onExport }: PricingResultsProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showScope, setShowScope] = useState(false)
  const [showDrivers, setShowDrivers] = useState(false)

  const { annualFees, onboardingFee, breakdown, drivers, scopeOfServices, outOfScope, currency } = results

  return (
    <div className="space-y-6">
      {/* Annual Fee Estimates */}
      <Card className="border-2 border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl">Estimated Annual Administration Fees</CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on your fund profile and selected services
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Low Estimate</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(annualFees.low, currency)}</p>
              <p className="text-xs text-muted-foreground mt-2">Conservative scenario</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-primary/10 border-2 border-primary">
              <p className="text-sm font-semibold text-primary mb-2">Mid Estimate</p>
              <p className="text-4xl font-bold">{formatCurrency(annualFees.medium, currency)}</p>
              <p className="text-xs text-muted-foreground mt-2">Most likely scenario</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">High Estimate</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(annualFees.high, currency)}</p>
              <p className="text-xs text-muted-foreground mt-2">Complex scenario</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Onboarding / Setup Fees</p>
                <p className="text-blue-800 dark:text-blue-200">
                  First-year setup: <strong>{formatCurrency(onboardingFee.low, currency)} - {formatCurrency(onboardingFee.high, currency)}</strong> (one-time)
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Covers initial system setup, data migration, and process establishment
                </p>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="mt-6">
            <div className="flex items-end justify-between gap-4 h-40">
              <div className="flex-1 flex flex-col justify-end items-center">
                <div
                  className="w-full bg-primary/30 rounded-t-lg transition-all"
                  style={{ height: `${(annualFees.low / annualFees.high) * 100}%` }}
                />
                <p className="text-xs text-muted-foreground mt-2">Low</p>
              </div>
              <div className="flex-1 flex flex-col justify-end items-center">
                <div
                  className="w-full bg-primary rounded-t-lg transition-all"
                  style={{ height: `${(annualFees.medium / annualFees.high) * 100}%` }}
                />
                <p className="text-xs font-semibold mt-2">Mid</p>
              </div>
              <div className="flex-1 flex flex-col justify-end items-center">
                <div className="w-full bg-primary/30 rounded-t-lg h-full transition-all" />
                <p className="text-xs text-muted-foreground mt-2">High</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detailed Cost Breakdown</CardTitle>
                {showBreakdown ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              <div className="space-y-3">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-primary/30 pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-semibold text-sm">{item.category}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <p className="text-sm font-medium whitespace-nowrap ml-4">
                        {formatCurrency(item.low, currency)} - {formatCurrency(item.high, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="font-bold">Total Annual Fees</p>
                <p className="font-bold text-lg">
                  {formatCurrency(annualFees.low, currency)} - {formatCurrency(annualFees.high, currency)}
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Pricing Drivers */}
      {drivers.length > 0 && (
        <Card>
          <Collapsible open={showDrivers} onOpenChange={setShowDrivers}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Key Pricing Drivers</CardTitle>
                  {showDrivers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  These factors are pushing your pricing estimate higher or lower:
                </p>
                <div className="space-y-3">
                  {drivers.map((driver, idx) => {
                    const impactColors = {
                      high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
                      medium: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
                      low: 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    };
                    const impactLabels = {
                      high: 'High Impact',
                      medium: 'Medium Impact',
                      low: 'Low Impact'
                    };

                    return (
                      <div key={idx} className={`border-l-4 pl-4 py-2 ${impactColors[driver.impact]}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{driver.factor}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{driver.explanation}</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-background border whitespace-nowrap">
                            {impactLabels[driver.impact]}
                          </span>
                        </div>
                      </div>
                    );
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
                <CardTitle className="text-lg">Scope of Services</CardTitle>
                {showScope ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-green-700 dark:text-green-400">
                    ✓ Included in Pricing Estimate
                  </h4>
                  <ul className="space-y-2">
                    {scopeOfServices.filter(s => s.included).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {item.service}
                          {item.notes && <span className="text-muted-foreground text-xs ml-1">({item.notes})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {scopeOfServices.some(s => !s.included) && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-red-700 dark:text-red-400">
                      ✗ Not Included (would be priced separately)
                    </h4>
                    <ul className="space-y-2">
                      {scopeOfServices.filter(s => !s.included).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{item.service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-3">Typically Out of Scope</h4>
                  <ul className="space-y-1">
                    {outOfScope.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3">
                    These services would require separate vendors or additional fees
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Export and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button onClick={onExport} variant="default">
            <Download className="h-4 w-4 mr-2" />
            Download Summary
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print Results
          </Button>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Important Disclaimer:</strong> These estimates are for educational and planning purposes only.
            Actual fees will vary by administrator, specific fund circumstances, negotiation, and scope changes.
            This tool does not constitute a binding quote or recommendation. Always request formal proposals from
            multiple qualified fund administrators and review detailed scope and pricing terms.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
