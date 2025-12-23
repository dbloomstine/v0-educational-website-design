"use client"

import { FeePhase, FeeBase } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { InfoPopover } from '@/components/ui/info-popover'

interface FeePhaseEditorProps {
  phases: FeePhase[]
  fundTerm: number
  onPhasesChange: (phases: FeePhase[]) => void
  errors?: string[]
}

const feeBaseOptions: FeeBase[] = [
  'Committed Capital',
  'Invested Cost',
  'Net Asset Value (NAV)',
  'Lower of Cost or Fair Value'
]

const feeBaseDescriptions: Record<FeeBase, string> = {
  'Committed Capital': 'The total amount LPs have committed to the fund, regardless of how much has been drawn. Most common during the investment period - provides predictable fee revenue.',
  'Invested Cost': 'The actual capital that has been invested in portfolio companies (drawn from LPs). Often used post-investment period to align fees with actual deployment.',
  'Net Asset Value (NAV)': 'The current fair market value of the fund\'s investments. Common for hedge funds and evergreen structures. Aligns fees with portfolio performance.',
  'Lower of Cost or Fair Value': 'The lower of invested cost or current NAV - a conservative, LP-friendly approach that limits fees if portfolio value declines.'
}

// Market comparison helper
function getMarketComparison(feeRate: number): { text: string; isAboveMarket: boolean; isTypical: boolean } {
  // PE/VC typical range: 1.5% - 2%
  const typicalLow = 1.5
  const typicalHigh = 2.0

  if (feeRate < typicalLow) {
    return {
      text: 'PE typical: 1.5-2%',
      isAboveMarket: false,
      isTypical: false
    }
  } else if (feeRate >= typicalLow && feeRate <= typicalHigh) {
    return {
      text: 'PE typical: 1.5-2%',
      isAboveMarket: false,
      isTypical: true
    }
  } else {
    return {
      text: 'PE typical: 1.5-2%',
      isAboveMarket: true,
      isTypical: false
    }
  }
}

// Helper to identify which phase/field has an error
function getPhaseErrors(
  errors: string[],
  phaseIndex: number,
  phases: FeePhase[]
): {
  startYear?: string
  endYear?: string
  feeRate?: string
  general?: string
} {
  const phaseNum = phaseIndex + 1
  const result: { startYear?: string; endYear?: string; feeRate?: string; general?: string } = {}

  errors.forEach(error => {
    // Check if error mentions this phase
    if (error.includes(`Phase ${phaseNum}:`)) {
      if (error.includes('Start year') || error.includes('start at year')) {
        result.startYear = error.replace(`Phase ${phaseNum}: `, '')
      } else if (error.includes('end year') || error.includes('End year')) {
        result.endYear = error.replace(`Phase ${phaseNum}: `, '')
      } else if (error.includes('Fee rate')) {
        result.feeRate = error.replace(`Phase ${phaseNum}: `, '')
      } else if (error.includes('Years must be')) {
        result.startYear = error.replace(`Phase ${phaseNum}: `, '')
        result.endYear = error.replace(`Phase ${phaseNum}: `, '')
      } else if (error.includes('Overlaps')) {
        result.startYear = error.replace(`Phase ${phaseNum}: `, '')
      } else {
        result.general = error.replace(`Phase ${phaseNum}: `, '')
      }
    }
    // Check for gap errors (mentions phase index)
    if (error.includes(`phase ${phaseNum}`) && error.includes('Gap')) {
      result.startYear = 'Gap with previous phase'
    }
  })

  // Special case: first phase must start at year 1
  if (phaseIndex === 0 && errors.some(e => e.includes('First phase must start'))) {
    result.startYear = 'Must start at year 1'
  }

  // Special case: last phase must end at fundTerm
  const sortedPhases = [...phases].sort((a, b) => a.startYear - b.startYear)
  const currentPhase = phases[phaseIndex]
  if (sortedPhases.length > 0 && currentPhase && sortedPhases[sortedPhases.length - 1].id === currentPhase.id) {
    if (errors.some(e => e.includes('Last phase must end'))) {
      result.endYear = `Must end at fund term`
    }
  }

  return result
}

export function FeePhaseEditor({ phases, fundTerm, onPhasesChange, errors = [] }: FeePhaseEditorProps) {
  const handleAddPhase = () => {
    // Find the last phase to determine where new phase should start
    const sortedPhases = [...phases].sort((a, b) => a.startYear - b.startYear)
    const lastPhase = sortedPhases[sortedPhases.length - 1]

    const newPhase: FeePhase = {
      id: `phase-${Date.now()}`,
      startYear: lastPhase ? lastPhase.endYear + 1 : 1,
      endYear: fundTerm,
      feeBase: 'Committed Capital',
      feeRate: 2.0
    }

    onPhasesChange([...phases, newPhase])
  }

  const handleUpdatePhase = (id: string, updates: Partial<FeePhase>) => {
    onPhasesChange(
      phases.map(phase =>
        phase.id === id ? { ...phase, ...updates } : phase
      )
    )
  }

  const handleDeletePhase = (id: string) => {
    onPhasesChange(phases.filter(phase => phase.id !== id))
  }

  // Rate preset handlers
  const applyFlatPreset = () => {
    onPhasesChange([{
      id: 'phase-1',
      startYear: 1,
      endYear: fundTerm,
      feeBase: 'Committed Capital',
      feeRate: 2.0
    }])
  }

  const applyTieredPreset = () => {
    const investmentPeriod = Math.min(4, Math.floor(fundTerm / 2))
    onPhasesChange([
      {
        id: 'phase-1',
        startYear: 1,
        endYear: investmentPeriod,
        feeBase: 'Committed Capital',
        feeRate: 2.0
      },
      {
        id: 'phase-2',
        startYear: investmentPeriod + 1,
        endYear: fundTerm,
        feeBase: 'Invested Cost',
        feeRate: 1.5
      }
    ])
  }

  const applyDecliningPreset = () => {
    const thirdPeriod = Math.floor(fundTerm / 3)
    const phases: FeePhase[] = []

    phases.push({
      id: 'phase-1',
      startYear: 1,
      endYear: thirdPeriod,
      feeBase: 'Committed Capital',
      feeRate: 2.0
    })

    if (thirdPeriod * 2 < fundTerm) {
      phases.push({
        id: 'phase-2',
        startYear: thirdPeriod + 1,
        endYear: thirdPeriod * 2,
        feeBase: 'Committed Capital',
        feeRate: 1.75
      })

      phases.push({
        id: 'phase-3',
        startYear: thirdPeriod * 2 + 1,
        endYear: fundTerm,
        feeBase: 'Invested Cost',
        feeRate: 1.5
      })
    } else {
      phases.push({
        id: 'phase-2',
        startYear: thirdPeriod + 1,
        endYear: fundTerm,
        feeBase: 'Invested Cost',
        feeRate: 1.5
      })
    }

    onPhasesChange(phases)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Fee Schedule Phases</h3>
          <InfoPopover>
            Define different fee structures for different periods of your fund. Most funds have higher fees during the investment period (typically 2% on commitments) and lower fees afterward (often 1.5-2% on invested capital or NAV). Add multiple phases to model step-downs or changes in fee base.
          </InfoPopover>
        </div>
        <Button onClick={handleAddPhase} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Phase
        </Button>
      </div>

      {/* Rate Presets */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={applyFlatPreset}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                2% Flat
              </Button>
              <Button
                onClick={applyTieredPreset}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                2%/1.5% Tiered
              </Button>
              <Button
                onClick={applyDecliningPreset}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Declining
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Apply common fee structures as starting points
            </p>
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm font-medium text-destructive mb-1">Please fix the following:</p>
          <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {phases.sort((a, b) => a.startYear - b.startYear).map((phase, index) => {
          const phaseErrors = getPhaseErrors(errors, index, phases)
          const hasAnyError = phaseErrors.startYear || phaseErrors.endYear || phaseErrors.feeRate || phaseErrors.general

          return (
          <Card key={phase.id} className={`relative ${hasAnyError ? 'border-destructive/50' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Phase {index + 1}
                </CardTitle>
                {phases.length > 1 && (
                  <Button
                    onClick={() => handleDeletePhase(phase.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`${phase.id}-start`} className={`text-xs ${phaseErrors.startYear ? 'text-destructive' : ''}`}>Start Year</Label>
                  <Input
                    id={`${phase.id}-start`}
                    type="number"
                    min={1}
                    max={fundTerm}
                    value={phase.startYear}
                    onChange={(e) => handleUpdatePhase(phase.id, { startYear: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                    aria-invalid={!!phaseErrors.startYear}
                    className={`h-11 text-base ${phaseErrors.startYear ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                  />
                  {phaseErrors.startYear && (
                    <p className="text-xs text-destructive">{phaseErrors.startYear}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${phase.id}-end`} className={`text-xs ${phaseErrors.endYear ? 'text-destructive' : ''}`}>End Year</Label>
                  <Input
                    id={`${phase.id}-end`}
                    type="number"
                    min={1}
                    max={fundTerm}
                    value={phase.endYear}
                    onChange={(e) => handleUpdatePhase(phase.id, { endYear: parseInt(e.target.value) || fundTerm })}
                    placeholder="10"
                    aria-invalid={!!phaseErrors.endYear}
                    className={`h-11 text-base ${phaseErrors.endYear ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                  />
                  {phaseErrors.endYear && (
                    <p className="text-xs text-destructive">{phaseErrors.endYear}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${phase.id}-base`} className="text-xs">Fee Base</Label>
                  <InfoPopover>
                    {feeBaseDescriptions[phase.feeBase]}
                  </InfoPopover>
                </div>
                <Select
                  value={phase.feeBase}
                  onValueChange={(value) => handleUpdatePhase(phase.id, { feeBase: value as FeeBase })}
                >
                  <SelectTrigger id={`${phase.id}-base`} className="h-11 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feeBaseOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${phase.id}-rate`} className={`text-xs ${phaseErrors.feeRate ? 'text-destructive' : ''}`}>Annual Fee Rate (%)</Label>
                  <InfoPopover>
                    The annual management fee percentage charged on the fee base. Typical ranges: PE/VC 1.5-2.5%, Credit 0.75-1.5%, Real Estate 1-1.5%. Emerging managers often start at 2% and may negotiate down for larger LPs.
                  </InfoPopover>
                </div>
                <Input
                  id={`${phase.id}-rate`}
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={phase.feeRate}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    const clamped = Math.max(0, Math.min(10, value))
                    handleUpdatePhase(phase.id, { feeRate: clamped })
                  }}
                  placeholder="2.0"
                  aria-invalid={!!phaseErrors.feeRate}
                  className={`h-11 text-base ${phaseErrors.feeRate ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                />
                {phaseErrors.feeRate && (
                  <p className="text-xs text-destructive">{phaseErrors.feeRate}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {getMarketComparison(phase.feeRate).text}
                  </p>
                  {getMarketComparison(phase.feeRate).isTypical && (
                    <Badge variant="success" className="text-xs">
                      Market rate
                    </Badge>
                  )}
                  {getMarketComparison(phase.feeRate).isAboveMarket && (
                    <Badge variant="warning" className="text-xs">
                      Above market
                    </Badge>
                  )}
                  {!getMarketComparison(phase.feeRate).isTypical && !getMarketComparison(phase.feeRate).isAboveMarket && (
                    <Badge variant="info" className="text-xs">
                      Below market
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
        })}
      </div>
    </div>
  )
}
