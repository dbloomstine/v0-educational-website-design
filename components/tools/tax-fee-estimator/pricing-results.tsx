'use client'

import { PricingOutput, formatCurrency } from './pricingData'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { exportTaxPricing } from './export'
import { TaxInput } from './pricingData'

interface PricingResultsProps {
  output: PricingOutput
  input: TaxInput
}

export function PricingResults({ output, input }: PricingResultsProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showDrivers, setShowDrivers] = useState(true)
  const [showScope, setShowScope] = useState(false)

  const handleExport = () => {
    exportTaxPricing(output, input)
  }

  return (
    <div className="space-y-6">
      {/* Main Estimate Card */}
      <Card className="border-border bg-card p-8">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Estimated Tax Fee Range</h2>
          <p className="text-sm text-muted-foreground">
            Annual tax compliance and K-1 preparation costs
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4 text-center">
            <div className="mb-1 text-sm font-medium text-muted-foreground">Low Estimate</div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(output.lowEstimate)}</div>
          </div>
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center">
            <div className="mb-1 text-sm font-medium text-primary">Most Likely</div>
            <div className="text-3xl font-bold text-primary">{formatCurrency(output.mediumEstimate)}</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4 text-center">
            <div className="mb-1 text-sm font-medium text-muted-foreground">High Estimate</div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(output.highEstimate)}</div>
          </div>
        </div>

        {/* Visual Range Indicator */}
        <div className="relative mb-4 h-3 rounded-full bg-gradient-to-r from-green-500/20 via-blue-500/20 to-amber-500/20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/40 via-primary/40 to-amber-500/40" />
          {/* Low marker */}
          <div
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-green-500"
            style={{ left: '0%' }}
          />
          {/* Medium marker */}
          <div
            className="absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-primary bg-primary shadow-lg"
            style={{ left: '50%' }}
          />
          {/* High marker */}
          <div
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-500"
            style={{ right: '0%' }}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            These estimates reflect typical mid-tier tax firms serving private investment funds. Big 4 firms typically charge 30-50% more. 
            Regional firms may offer 15-25% lower fees for simpler structures. Actual costs depend on specific scope, firm experience, 
            and your relationship.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Summary
          </Button>
        </div>
      </Card>

      {/* Fee Breakdown */}
      <Card className="border-border bg-card p-6">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-foreground">Detailed Fee Breakdown</h3>
          {showBreakdown ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showBreakdown && (
          <div className="mt-4 space-y-3">
            {output.breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground">{item.component}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <div className="ml-4 text-right">
                  <div className="font-semibold text-foreground">{formatCurrency(item.fee)}</div>
                  {item.quantity && (
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.fee / item.quantity)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="text-lg font-bold text-foreground">Total (Medium Estimate)</div>
              <div className="text-xl font-bold text-primary">{formatCurrency(output.mediumEstimate)}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Cost Drivers */}
      {output.drivers.length > 0 && (
        <Card className="border-border bg-card p-6">
          <button
            onClick={() => setShowDrivers(!showDrivers)}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-foreground">
              What's Driving Your Tax Fees ({output.drivers.length} factors)
            </h3>
            {showDrivers ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {showDrivers && (
            <div className="mt-4 space-y-3">
              {output.drivers.map((driver, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    driver.impact === 'positive'
                      ? 'border-green-500/30 bg-green-500/5'
                      : driver.impact === 'negative'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-foreground">{driver.title}</span>
                    {driver.impact === 'positive' && (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                        Cost Reduction
                      </span>
                    )}
                    {driver.impact === 'negative' && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                        Cost Driver
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{driver.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Scope & Assumptions */}
      <Card className="border-border bg-card p-6">
        <button
          onClick={() => setShowScope(!showScope)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-foreground">Scope & Assumptions</h3>
          {showScope ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showScope && (
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="mb-2 font-semibold text-foreground">What's Typically Included:</h4>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>Federal partnership tax return preparation (Form 1065)</li>
                <li>Schedule K-1 preparation and distribution to all investors</li>
                <li>Corporate tax returns for blocker entities and GP entities</li>
                <li>State and local tax return filings</li>
                <li>Annual tax provision calculations</li>
                <li>Routine tax compliance and advisory calls</li>
                <li>Basic tax planning during the year</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-foreground">Often NOT Included (Additional Fees):</h4>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>Tax structuring for new funds or transactions (usually project-based)</li>
                <li>IRS audit defense or controversy work</li>
                <li>State tax controversy or appeals</li>
                <li>Transfer pricing studies (for cross-border funds)</li>
                <li>Tax opinion letters for specific transactions</li>
                <li>Portfolio company tax advisory (unless bundled)</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-foreground">Key Variables That Can Change Pricing:</h4>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>Significant mid-year transactions or restructurings</li>
                <li>Quality and organization of your accounting records</li>
                <li>Number of revisions or amended returns required</li>
                <li>Responsiveness to information requests</li>
                <li>Use of fund administrator vs. in-house accounting</li>
                <li>Timeliness of year-end close and data delivery</li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 font-semibold text-foreground">How to Use This Estimate:</h4>
              <p>
                Use this as a starting point for budgeting and RFP discussions. Most tax firms will provide a 
                fixed-fee engagement letter after reviewing your specific situation. Expect fees to be lower in 
                subsequent years as efficiency improves, unless fund complexity increases significantly.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
