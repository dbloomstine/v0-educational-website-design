"use client"

import { useState, useEffect } from 'react'
import { FundInputs, FeePhase, FeeCalculationResult, FundType } from './types'
import { calculateManagementFees, validateFeePhases, generateDefaultFeePhases } from './fee-calculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, AlertCircle } from 'lucide-react'
import { FeePhaseEditor } from './fee-phase-editor'
import { SummaryCards } from './summary-cards'
import { ResultsChart } from './results-chart'
import { ResultsTable } from './results-table'
import { ExportSection } from './export-section'

const fundTypeOptions: FundType[] = [
  'Private Equity',
  'Venture Capital',
  'Private Credit',
  'Real Estate',
  'Hedge Fund',
  'Other'
]

const fundTypeDescriptions: Record<FundType, string> = {
  'Private Equity': 'Typically 10-12 year term with 3-5 year investment period',
  'Venture Capital': 'Usually 10 year term with 3-4 year investment period',
  'Private Credit': 'Varies widely, often perpetual or 5-7 years',
  'Real Estate': 'Typically 7-10 year term with 2-3 year investment period',
  'Hedge Fund': 'Usually perpetual with quarterly liquidity',
  'Other': 'Custom fund structure'
}

export function ManagementFeeCalculator() {
  // Fund inputs state
  const [fundInputs, setFundInputs] = useState<FundInputs>({
    fundType: 'Venture Capital',
    fundSize: 50,
    fundTerm: 10,
    investmentPeriod: 4,
    gpCommitment: 2,
    navGrowthRate: 0
  })

  // Fee phases state
  const [feePhases, setFeePhases] = useState<FeePhase[]>([])

  // Results state
  const [result, setResult] = useState<FeeCalculationResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Initialize with default phases
  useEffect(() => {
    const defaultPhases = generateDefaultFeePhases(fundInputs)
    setFeePhases(defaultPhases)
  }, []) // Only run on mount

  // Recalculate when inputs or phases change
  useEffect(() => {
    const validation = validateFeePhases(feePhases, fundInputs.fundTerm)
    setValidationErrors(validation.errors)

    if (validation.valid && feePhases.length > 0) {
      const calculatedResult = calculateManagementFees(fundInputs, feePhases)
      setResult(calculatedResult)
    } else {
      setResult(null)
    }
  }, [fundInputs, feePhases])

  const handleFundInputChange = (updates: Partial<FundInputs>) => {
    setFundInputs(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Management Fee Calculator</h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Model your fund-level management fees over the life of the fund. Built for emerging managers
          who want to stress test fee levels before finalizing their LPA.
        </p>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This is a simplified educational tool. It does not constitute legal, tax, or financial advice.
            Always consult with legal counsel and fund administrators before finalizing fee structures.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Fund Basics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fund Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="fund-type" className="text-sm">Fund Type</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{fundTypeDescriptions[fundInputs.fundType]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={fundInputs.fundType}
                  onValueChange={(value) => handleFundInputChange({ fundType: value as FundType })}
                >
                  <SelectTrigger id="fund-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fundTypeOptions.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="fund-size" className="text-sm">Target Fund Size ($ millions)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Total committed capital from all LPs and the GP</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="fund-size"
                  type="number"
                  min={1}
                  value={fundInputs.fundSize}
                  onChange={(e) => handleFundInputChange({ fundSize: parseFloat(e.target.value) || 50 })}
                />
                <p className="text-xs text-muted-foreground">Typical emerging fund: $10M - $100M</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="fund-term" className="text-sm">Fund Term (years)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Total life of the fund before final liquidation, including extensions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="fund-term"
                  type="number"
                  min={1}
                  max={20}
                  value={fundInputs.fundTerm}
                  onChange={(e) => handleFundInputChange({ fundTerm: parseInt(e.target.value) || 10 })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="investment-period" className="text-sm">Investment Period (years)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Period during which the fund can make new investments. Fees are typically higher during this period.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="investment-period"
                  type="number"
                  min={1}
                  max={fundInputs.fundTerm}
                  value={fundInputs.investmentPeriod}
                  onChange={(e) => handleFundInputChange({ investmentPeriod: parseInt(e.target.value) || 4 })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="nav-growth" className="text-sm">Annual NAV Growth Rate (%) - Optional</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Assumed annual growth in portfolio value. Only affects NAV-based fee calculations. Leave at 0 for conservative estimates.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="nav-growth"
                  type="number"
                  min={-20}
                  max={50}
                  step={1}
                  value={fundInputs.navGrowthRate || 0}
                  onChange={(e) => handleFundInputChange({ navGrowthRate: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Use 0% for flat/conservative model</p>
              </div>
            </CardContent>
          </Card>

          {/* Fee Phase Editor */}
          <FeePhaseEditor
            phases={feePhases}
            fundTerm={fundInputs.fundTerm}
            onPhasesChange={setFeePhases}
            errors={validationErrors}
          />
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <SummaryCards result={result} fundSize={fundInputs.fundSize} />
              <ResultsChart yearlyData={result.yearlyData} />
              <ResultsTable yearlyData={result.yearlyData} />
              <ExportSection fundInputs={fundInputs} result={result} feePhases={feePhases} />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your fund basics and fee schedule to see results</p>
                  {validationErrors.length > 0 && (
                    <p className="mt-2 text-sm text-destructive">Please fix validation errors to continue</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
