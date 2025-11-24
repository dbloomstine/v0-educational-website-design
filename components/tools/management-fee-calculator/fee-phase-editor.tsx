"use client"

import { FeePhase, FeeBase } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  'Committed Capital': 'The total amount LPs have committed to the fund, regardless of how much has been drawn',
  'Invested Cost': 'The actual capital that has been invested in portfolio companies (drawn from LPs)',
  'Net Asset Value (NAV)': 'The current fair market value of the fund\'s investments',
  'Lower of Cost or Fair Value': 'The lower of invested cost or current NAV - a conservative approach'
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Fee Schedule Phases</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Define different fee structures for different periods of your fund. Most funds have higher fees during the investment period and lower fees afterward.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button onClick={handleAddPhase} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Phase
        </Button>
      </div>

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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{feeBaseDescriptions[phase.feeBase]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                <Label htmlFor={`${phase.id}-rate`} className="text-xs">Annual Fee Rate (%)</Label>
                <Input
                  id={`${phase.id}-rate`}
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={phase.feeRate}
                  onChange={(e) => handleUpdatePhase(phase.id, { feeRate: parseFloat(e.target.value) || 0 })}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 1.0% - 2.5% for emerging managers
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
