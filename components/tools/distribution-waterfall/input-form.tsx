'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { WaterfallInput } from './waterfallCalculations'

interface InputFormProps {
  input: WaterfallInput
  onChange: (input: WaterfallInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const updateField = <K extends keyof WaterfallInput>(field: K, value: WaterfallInput[K]) => {
    onChange({ ...input, [field]: value })
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Fund Basics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fund & Deal Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fundSize">Fund Size</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">Total committed capital of the fund. This is the maximum amount LPs have agreed to invest.</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="fundSize"
                type="number"
                min={0}
                step={1000000}
                value={input.fundSize}
                onChange={(e) => updateField('fundSize', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="contributedCapital">Contributed Capital</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">Amount of capital actually drawn from LPs and invested. Often equals fund size, but may be less if not fully deployed.</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="contributedCapital"
                type="number"
                min={0}
                step={1000000}
                value={input.contributedCapital}
                onChange={(e) => updateField('contributedCapital', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="grossProceeds">Gross Proceeds</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">Total cash received from exits/distributions. Change this to model different outcome scenarios (e.g., 1.5x, 2.0x, 3.0x returns).</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="grossProceeds"
                type="number"
                min={0}
                step={1000000}
                value={input.grossProceeds}
                onChange={(e) => updateField('grossProceeds', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="yearsToExit">Years to Exit</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">Time from initial investment to exit/distribution. Used to calculate accrued preferred return. Typical holding periods are 3-7 years.</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="yearsToExit"
                type="number"
                min={0}
                max={15}
                step={0.5}
                value={input.yearsToExit}
                onChange={(e) => updateField('yearsToExit', parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Waterfall Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waterfall Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="waterfallType">Waterfall Type</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>European:</strong> GP only receives carry after entire fund returns capital + pref to LPs. More LP-friendly.<br/><br/>
                      <strong>American:</strong> GP can receive carry on individual deals before fund is fully returned. Typically includes clawback provisions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={input.waterfallType} onValueChange={(value) => updateField('waterfallType', value as 'european' | 'american')}>
                <SelectTrigger id="waterfallType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="european">European (Whole-Fund)</SelectItem>
                  <SelectItem value="american">American (Deal-by-Deal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Economic Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Economic Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="prefRate">Preferred Return (%)</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">Annual hurdle rate LPs must receive before GP participates in profits. Typical rates: 6-8% for PE/credit, less common in VC.</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="prefRate"
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={input.prefRate * 100}
                onChange={(e) => updateField('prefRate', (parseFloat(e.target.value) || 0) / 100)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="prefCompounding">Pref Compounding Method</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Simple:</strong> Pref = Capital × Rate × Years<br/><br/>
                      <strong>Compound:</strong> Pref compounds annually like interest on a loan. Results in higher pref amounts.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={input.prefCompounding} onValueChange={(value) => updateField('prefCompounding', value as 'simple' | 'compound')}>
                <SelectTrigger id="prefCompounding"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (Non-Compounding)</SelectItem>
                  <SelectItem value="compound">Compound (Annual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="carryRate">Carried Interest (%)</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">GP's share of profits after pref is paid. Typical rates: 15-20% for buyout PE, 20-30% for VC/growth.</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="carryRate"
                type="number"
                min={0}
                max={50}
                step={1}
                value={input.carryRate * 100}
                onChange={(e) => updateField('carryRate', (parseFloat(e.target.value) || 0) / 100)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasCatchUp"
                checked={input.hasCatchUp}
                onCheckedChange={(checked) => updateField('hasCatchUp', checked as boolean)}
              />
              <label htmlFor="hasCatchUp" className="text-sm cursor-pointer flex items-center gap-2">
                Enable GP Catch-Up
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">After pref is paid, GP receives a larger share (catch-up rate) until they've "caught up" to their target carry percentage of total profits.</p></TooltipContent>
                </Tooltip>
              </label>
            </div>

            {input.hasCatchUp && (
              <div className="space-y-2 ml-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="catchUpRate">Catch-Up Rate (%)</Label>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        GP's share during catch-up phase.<br/><br/>
                        <strong>100%:</strong> "Full catch-up" - GP gets 100% until caught up<br/>
                        <strong>50%:</strong> "Shared catch-up" - 50/50 split during catch-up<br/>
                        Most common: 100%
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="catchUpRate"
                  type="number"
                  min={0}
                  max={100}
                  step={10}
                  value={input.catchUpRate * 100}
                  onChange={(e) => updateField('catchUpRate', (parseFloat(e.target.value) || 0) / 100)}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="gpCommitmentPercent">GP Commitment (%)</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">GP's own capital commitment as % of total fund. Typical range: 1-3% for PE, 1-5% for VC. GPs invest alongside LPs to align interests.</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="gpCommitmentPercent"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={input.gpCommitmentPercent * 100}
                onChange={(e) => updateField('gpCommitmentPercent', (parseFloat(e.target.value) || 0) / 100)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
