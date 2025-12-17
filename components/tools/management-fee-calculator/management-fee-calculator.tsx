"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { FundInputs, FeePhase, FeeCalculationResult, FundType } from './types'
import { calculateManagementFees, validateFeePhases, generateDefaultFeePhases } from './fee-calculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoPopover } from '@/components/ui/info-popover'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeePhaseEditor } from './fee-phase-editor'
import { SummaryCards } from './summary-cards'
import { ResultsChart } from './results-chart'
import { ResultsTable } from './results-table'
import { ExportSection } from './export-section'
import { DisclaimerBlock } from '@/components/tools/shared'
import { ShareButton } from '@/components/tools/share-button'

const fundTypeOptions: FundType[] = [
  'Private Equity',
  'Venture Capital',
  'Private Credit',
  'Real Estate',
  'Hedge Fund',
  'Other'
]

const fundTypeDescriptions: Record<FundType, string> = {
  'Private Equity': 'Typically 10-12 year term with 3-5 year investment period. Fees usually 2% on commitments during investment period, then 1.5-2% on invested capital.',
  'Venture Capital': 'Usually 10 year term with 3-4 year investment period. Fees typically 2-2.5% on commitments, sometimes flat through the entire fund life.',
  'Private Credit': 'Varies widely, often perpetual or 5-7 years. Fees range from 0.75-1.5% depending on strategy and leverage.',
  'Real Estate': 'Typically 7-10 year term with 2-3 year investment period. Fees usually 1-1.5% on commitments or invested capital.',
  'Hedge Fund': 'Usually perpetual with quarterly liquidity. Fees typically 1.5-2% on NAV annually.',
  'Other': 'Custom fund structure - adjust fee phases to match your LPA terms.'
}

// Default values for reset
const DEFAULT_INPUTS: FundInputs = {
  fundType: 'Venture Capital',
  fundSize: 50,
  fundTerm: 10,
  investmentPeriod: 4,
  gpCommitment: 2,
  navGrowthRate: 0
}

export function ManagementFeeCalculator() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse initial state from URL or use defaults
  const getInitialInputs = (): FundInputs => {
    if (typeof window === 'undefined') return DEFAULT_INPUTS

    return {
      fundType: (searchParams.get('type') as FundType) || DEFAULT_INPUTS.fundType,
      fundSize: parseFloat(searchParams.get('size') || '') || DEFAULT_INPUTS.fundSize,
      fundTerm: parseInt(searchParams.get('term') || '') || DEFAULT_INPUTS.fundTerm,
      investmentPeriod: parseInt(searchParams.get('ip') || '') || DEFAULT_INPUTS.investmentPeriod,
      gpCommitment: parseFloat(searchParams.get('gp') || '') || DEFAULT_INPUTS.gpCommitment,
      navGrowthRate: parseFloat(searchParams.get('nav') || '') || DEFAULT_INPUTS.navGrowthRate
    }
  }

  // Fund inputs state
  const [fundInputs, setFundInputs] = useState<FundInputs>(getInitialInputs)

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

  // Update URL when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('type', fundInputs.fundType)
      params.set('size', String(fundInputs.fundSize))
      params.set('term', String(fundInputs.fundTerm))
      params.set('ip', String(fundInputs.investmentPeriod))
      if (fundInputs.navGrowthRate) params.set('nav', String(fundInputs.navGrowthRate))

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [fundInputs, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('type', fundInputs.fundType)
    params.set('size', String(fundInputs.fundSize))
    params.set('term', String(fundInputs.fundTerm))
    params.set('ip', String(fundInputs.investmentPeriod))
    if (fundInputs.navGrowthRate) params.set('nav', String(fundInputs.navGrowthRate))

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [fundInputs, pathname])

  const handleFundInputChange = (updates: Partial<FundInputs>) => {
    setFundInputs(prev => ({ ...prev, ...updates }))
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setFundInputs(DEFAULT_INPUTS)
    setFeePhases(generateDefaultFeePhases(DEFAULT_INPUTS))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Management Fee Calculator</h2>
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Model your fund-level management fees over the life of the fund. Built for emerging managers
          who want to stress test fee levels before finalizing their LPA.
        </p>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This is a simplified educational tool for modeling management fees. Actual fee calculations
            may be more complex depending on your LPA terms. Always consult with legal counsel and fund
            administrators before finalizing fee structures.
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
                  <InfoPopover>
                    {fundTypeDescriptions[fundInputs.fundType]}
                  </InfoPopover>
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
                  <InfoPopover>
                    Total committed capital from all LPs and the GP. This is the amount you are targeting to raise, not the amount called or invested. Emerging manager funds typically range from $10M to $100M.
                  </InfoPopover>
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
                  <InfoPopover>
                    Total life of the fund before final liquidation, including any extensions. Most PE/VC funds are 10 years with two 1-year extensions possible. Credit and real estate funds may be shorter.
                  </InfoPopover>
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
                  <InfoPopover>
                    The period during which the fund can make new investments. Typically 3-5 years for PE/VC. Management fees are often higher during this period and based on commitments, then may step down to a lower rate on invested capital.
                  </InfoPopover>
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
                  <InfoPopover>
                    Assumed annual growth in portfolio value. Only affects NAV-based fee calculations. Leave at 0 for conservative estimates. Typical VC target IRRs are 20-30%, but realized NAV growth varies significantly by vintage and strategy.
                  </InfoPopover>
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

          {/* Reset Button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <SummaryCards result={result} fundSize={fundInputs.fundSize} />
              <ResultsChart yearlyData={result.yearlyData} />
              <ResultsTable yearlyData={result.yearlyData} />
              <ExportSection fundInputs={fundInputs} result={result} feePhases={feePhases} />
              <DisclaimerBlock
                additionalDisclaimer="Always consult with legal counsel and fund administrators before finalizing your LPA fee terms."
              />
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
