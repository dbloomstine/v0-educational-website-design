"use client"

import { PricingOutput, KYCAMLInput, formatCurrency } from './pricingData'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, ChevronDown, ChevronUp, AlertCircle, Users, Building2, Building } from 'lucide-react'
import { useState } from 'react'
import { exportKYCAMLPricing } from './export'

interface PricingResultsProps {
  output: PricingOutput
  input: KYCAMLInput
}

export function PricingResults({ output, input }: PricingResultsProps) {
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [showDrivers, setShowDrivers] = useState(true)

  const handleExport = () => {
    exportKYCAMLPricing(output, input)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Total Investors</div>
          <div className="text-3xl font-bold text-foreground">{output.totalInvestors}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {input.individualCount} individuals, {input.entityCount} entities, {input.institutionalCount} institutional
          </div>
        </Card>
        <Card className="border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Avg Per Investor</div>
          <div className="text-3xl font-bold text-primary">{formatCurrency(output.averagePerInvestor.medium)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(output.averagePerInvestor.low)} - {formatCurrency(output.averagePerInvestor.high)}
          </div>
        </Card>
        <Card className="border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Initial + Platform</div>
          <div className="text-3xl font-bold text-foreground">{formatCurrency(output.initialOnboarding.medium)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(output.initialOnboarding.low)} - {formatCurrency(output.initialOnboarding.high)}
          </div>
        </Card>
      </div>

      {/* Main Cost Summary */}
      <Card className="border-border bg-card p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Estimated KYC / AML Costs</h2>
          <p className="text-sm text-muted-foreground">
            Initial investor onboarding and ongoing monitoring costs
          </p>
        </div>

        <div className="mb-8 space-y-6">
          {/* Initial Onboarding */}
          <div>
            <div className="mb-3 text-sm font-medium text-muted-foreground">Initial Onboarding (One-Time)</div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <div className="mb-1 text-sm font-medium text-muted-foreground">Low Estimate</div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(output.initialOnboarding.low)}</div>
              </div>
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center">
                <div className="mb-1 text-sm font-medium text-primary">Most Likely</div>
                <div className="text-3xl font-bold text-primary">{formatCurrency(output.initialOnboarding.medium)}</div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <div className="mb-1 text-sm font-medium text-muted-foreground">High Estimate</div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(output.initialOnboarding.high)}</div>
              </div>
            </div>
          </div>

          {/* Ongoing Annual */}
          {input.hasOngoingMonitoring && (
            <div>
              <div className="mb-3 text-sm font-medium text-muted-foreground">Ongoing Annual Monitoring</div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-background p-4 text-center">
                  <div className="mb-1 text-sm font-medium text-muted-foreground">Low Estimate</div>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(output.annualOngoing.low)}</div>
                </div>
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center">
                  <div className="mb-1 text-sm font-medium text-primary">Most Likely</div>
                  <div className="text-3xl font-bold text-primary">{formatCurrency(output.annualOngoing.medium)}</div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4 text-center">
                  <div className="mb-1 text-sm font-medium text-muted-foreground">High Estimate</div>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(output.annualOngoing.high)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visual indicator */}
        <div className="relative mb-6 h-3 rounded-full bg-gradient-to-r from-green-500/20 via-blue-500/20 to-amber-500/20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/40 via-primary/40 to-amber-500/40" />
          <div className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-green-500" style={{ left: '0%' }} />
          <div className="absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-primary bg-primary shadow-lg" style={{ left: '50%' }} />
          <div className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-500" style={{ right: '0%' }} />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            These estimates reflect typical mid-tier KYC/AML service providers. Costs vary based on provider choice, 
            technology platform, degree of automation, and specific compliance requirements. Bundling with a fund 
            administrator may offer economies of scale.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Summary
          </Button>
        </div>
      </Card>

      {/* Per-Investor Cost Breakdown */}
      <Card className="border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Per-Investor Costs by Type</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Individuals</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low:</span>
                <span className="font-medium">{formatCurrency(output.perInvestorCosts.individual.low)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medium:</span>
                <span className="font-medium text-primary">{formatCurrency(output.perInvestorCosts.individual.medium)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High:</span>
                <span className="font-medium">{formatCurrency(output.perInvestorCosts.individual.high)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{input.individualCount} investors</div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold">Entities</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low:</span>
                <span className="font-medium">{formatCurrency(output.perInvestorCosts.entity.low)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medium:</span>
                <span className="font-medium text-primary">{formatCurrency(output.perInvestorCosts.entity.medium)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High:</span>
                <span className="font-medium">{formatCurrency(output.perInvestorCosts.entity.high)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{input.entityCount} investors</div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-foreground">
              <Building className="h-5 w-5" />
              <span className="font-semibold">Institutional</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low:</span>
                <span className="font-medium">{formatCurrency(output.perInvestorCosts.institutional.low)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medium:</span>
                <span className="font-medium text-primary">{formatCurrency(output.perInvestorCosts.institutional.medium)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High:</span>
                <span className="font-medium">{formatCurrency(output.perInvestorCosts.institutional.high)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{input.institutionalCount} investors</div>
          </div>
        </div>
      </Card>

      {/* Detailed Breakdown */}
      <Card className="border-border bg-card p-6">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-foreground">Detailed Cost Breakdown</h3>
          {showBreakdown ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showBreakdown && (
          <div className="mt-4 space-y-3">
            {output.breakdown.map((item, index) => (
              <div key={index} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold text-foreground">{item.category}</div>
                  {item.count && <div className="text-sm text-muted-foreground">{item.count} investors</div>}
                </div>
                {item.count && (
                  <div className="mb-2 text-sm text-muted-foreground">
                    {formatCurrency(item.perUnit.low)} - {formatCurrency(item.perUnit.high)} per investor
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(item.total.low)} - {formatCurrency(item.total.high)}
                  </span>
                </div>
              </div>
            ))}
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
              What's Driving Your Costs ({output.drivers.length} factors)
            </h3>
            {showDrivers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
    </div>
  )
}
