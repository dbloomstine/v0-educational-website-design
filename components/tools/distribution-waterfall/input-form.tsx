'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { InfoPopover } from '@/components/ui/info-popover'
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
              <InfoPopover>
                Total committed capital of the fund. This is the maximum amount LPs have agreed to invest. Typical PE funds range from $100M-$10B, while VC funds often range from $25M-$1B.
              </InfoPopover>
            </div>
            <Input
              id="fundSize"
              type="number"
              min={0}
              step={1000000}
              value={input.fundSize}
              onChange={(e) => updateField('fundSize', parseFloat(e.target.value) || 0)}
              placeholder="100000000"
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="contributedCapital">Contributed Capital</Label>
              <InfoPopover>
                Amount of capital actually drawn from LPs and invested. Often equals fund size, but may be less if not fully deployed. This is the baseline for return of capital calculations.
              </InfoPopover>
            </div>
            <Input
              id="contributedCapital"
              type="number"
              min={0}
              step={1000000}
              value={input.contributedCapital}
              onChange={(e) => updateField('contributedCapital', parseFloat(e.target.value) || 0)}
              placeholder="100000000"
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="grossProceeds">Gross Proceeds</Label>
              <InfoPopover>
                Total cash received from exits and distributions. Change this to model different outcome scenarios. For example, 2x gross proceeds means a 2.0x gross multiple on the fund.
              </InfoPopover>
            </div>
            <Input
              id="grossProceeds"
              type="number"
              min={0}
              step={1000000}
              value={input.grossProceeds}
              onChange={(e) => updateField('grossProceeds', parseFloat(e.target.value) || 0)}
              placeholder="200000000"
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="yearsToExit">Years to Exit</Label>
              <InfoPopover>
                Time from initial investment to exit/distribution. Used to calculate accrued preferred return. Typical holding periods: PE buyouts 3-5 years, VC 5-7 years, growth equity 3-5 years.
              </InfoPopover>
            </div>
            <Input
              id="yearsToExit"
              type="number"
              min={0}
              max={15}
              step={0.5}
              value={input.yearsToExit}
              onChange={(e) => updateField('yearsToExit', parseFloat(e.target.value) || 0)}
              placeholder="5"
              className="h-11 text-base"
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
              <InfoPopover>
                <strong>European (Whole-Fund):</strong> GP only receives carry after entire fund returns capital + pref to LPs. More LP-friendly and common in buyout PE.
                <br /><br />
                <strong>American (Deal-by-Deal):</strong> GP can receive carry on individual deals before fund is fully returned. Typically includes clawback provisions. More common in VC.
                <br /><br />
                <em>Note: This tool shows fund-level results. True deal-by-deal analysis requires modeling each investment separately.</em>
              </InfoPopover>
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
              <InfoPopover>
                Annual hurdle rate LPs must receive before GP participates in profits. This aligns GP incentives with generating strong returns.
                <br /><br />
                <strong>Typical rates:</strong> PE/Credit 6-8%, Real Estate 6-8%, VC often 0% (less common)
              </InfoPopover>
            </div>
            <Input
              id="prefRate"
              type="number"
              min={0}
              max={50}
              step={0.1}
              value={input.prefRate * 100}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                const clamped = Math.max(0, Math.min(50, value))
                updateField('prefRate', clamped / 100)
              }}
              placeholder="8"
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="prefCompounding">Pref Compounding Method</Label>
              <InfoPopover>
                <strong>Simple:</strong> Pref = Capital x Rate x Years. Linear calculation, easier to model.
                <br /><br />
                <strong>Compound:</strong> Pref compounds annually like interest on a loan. Results in higher pref amounts over time. More favorable to LPs.
              </InfoPopover>
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
              <InfoPopover>
                GP's share of profits after pref is paid. This is the primary economic incentive for fund managers and typically the largest component of GP compensation.
                <br /><br />
                <strong>Typical rates:</strong> Buyout PE 15-20%, Growth Equity 20%, VC 20-30%, Real Estate 15-20%
              </InfoPopover>
            </div>
            <Input
              id="carryRate"
              type="number"
              min={0}
              max={50}
              step={1}
              value={input.carryRate * 100}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                const clamped = Math.max(0, Math.min(50, value))
                updateField('carryRate', clamped / 100)
              }}
              placeholder="20"
              className="h-11 text-base"
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
              <InfoPopover>
                After pref is paid, GP receives a larger share (catch-up rate) until they've "caught up" to their target carry percentage of total profits. This ensures GP receives their full carry percentage, not just carry on profits after pref.
              </InfoPopover>
            </label>
          </div>

          {input.hasCatchUp && (
            <div className="space-y-2 ml-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="catchUpRate">Catch-Up Rate (%)</Label>
                <InfoPopover>
                  GP's share during catch-up phase.
                  <br /><br />
                  <strong>100% (Full):</strong> GP gets 100% until caught up - most common.
                  <br />
                  <strong>80%:</strong> GP gets 80%, LP gets 20% during catch-up.
                  <br />
                  <strong>50%:</strong> "Shared catch-up" - 50/50 split during catch-up.
                </InfoPopover>
              </div>
              <Input
                id="catchUpRate"
                type="number"
                min={0}
                max={100}
                step={10}
                value={input.catchUpRate * 100}
                onChange={(e) => updateField('catchUpRate', (parseFloat(e.target.value) || 0) / 100)}
                placeholder="100"
                className="h-11 text-base"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="gpCommitmentPercent">GP Commitment (%)</Label>
              <InfoPopover>
                GP's own capital commitment as % of total fund. GPs invest alongside LPs to align interests. This commitment is subject to the same waterfall as LP capital.
                <br /><br />
                <strong>Typical range:</strong> PE 1-3%, VC 1-5%. Larger commitments signal GP conviction.
              </InfoPopover>
            </div>
            <Input
              id="gpCommitmentPercent"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={input.gpCommitmentPercent * 100}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                const clamped = Math.max(0, Math.min(100, value))
                updateField('gpCommitmentPercent', clamped / 100)
              }}
              placeholder="1"
              className="h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
