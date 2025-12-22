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
        {phases.sort((a, b) => a.startYear - b.startYear).map((phase, index) => (
          <Card key={phase.id} className="relative">
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
                  <Label htmlFor={`${phase.id}-start`} className="text-xs">Start Year</Label>
                  <Input
                    id={`${phase.id}-start`}
                    type="number"
                    min={1}
                    max={fundTerm}
                    value={phase.startYear}
                    onChange={(e) => handleUpdatePhase(phase.id, { startYear: parseInt(e.target.value) || 1 })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${phase.id}-end`} className="text-xs">End Year</Label>
                  <Input
                    id={`${phase.id}-end`}
                    type="number"
                    min={1}
                    max={fundTerm}
                    value={phase.endYear}
                    onChange={(e) => handleUpdatePhase(phase.id, { endYear: parseInt(e.target.value) || fundTerm })}
                    className="h-9"
                  />
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
                  <SelectTrigger id={`${phase.id}-base`} className="h-9">
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
                  <Label htmlFor={`${phase.id}-rate`} className="text-xs">Annual Fee Rate (%)</Label>
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
                  className="h-9"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {getMarketComparison(phase.feeRate).text}
                  </p>
                  {getMarketComparison(phase.feeRate).isTypical && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Market rate
                    </Badge>
                  )}
                  {getMarketComparison(phase.feeRate).isAboveMarket && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Above market
                    </Badge>
                  )}
                  {!getMarketComparison(phase.feeRate).isTypical && !getMarketComparison(phase.feeRate).isAboveMarket && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Below market
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
