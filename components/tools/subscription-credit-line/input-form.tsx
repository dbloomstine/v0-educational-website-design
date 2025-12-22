'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { InfoPopover } from '@/components/ui/info-popover'
import { Badge } from '@/components/ui/badge'
import { SubscriptionLineInput } from './subscriptionLineCalculations'

interface InputFormProps {
  input: SubscriptionLineInput
  onChange: (input: SubscriptionLineInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const handleChange = (field: keyof SubscriptionLineInput, value: any) => {
    onChange({ ...input, [field]: value })
  }

  // ILPA compliance checks - QUICK WIN #2
  const facilitySizePct = input.facilitySize * 100
  const isFacilitySizeCompliant = facilitySizePct >= 15 && facilitySizePct <= 25
  const isDaysCompliant = input.maxDaysOutstanding <= 180

  return (
    <div className="space-y-6">
      {/* Fund Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fund Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fund Size */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fundSize">Fund Size</Label>
              <InfoPopover>
                Total committed capital to the fund. This is the maximum amount LPs have agreed to invest.
              </InfoPopover>
            </div>
            <Input
              id="fundSize"
              type="number"
              value={input.fundSize}
              onChange={(e) => handleChange('fundSize', parseFloat(e.target.value) || 0)}
              placeholder="100000000"
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">
              ${(input.fundSize / 1000000).toFixed(0)}M
            </p>
          </div>

          {/* Investment Period */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="investmentPeriod">Investment Period (Years)</Label>
              <InfoPopover>
                The period during which the fund makes new investments, typically 4-6 years for PE/VC funds.
              </InfoPopover>
            </div>
            <Input
              id="investmentPeriod"
              type="number"
              value={input.investmentPeriodYears}
              onChange={(e) => handleChange('investmentPeriodYears', parseInt(e.target.value) || 0)}
              min="1"
              max="10"
              className="h-12 text-base"
            />
          </div>

          {/* Fund Term */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fundTerm">Total Fund Term (Years)</Label>
              <InfoPopover>
                Total fund life including investment period and harvest period, typically 10-12 years for PE funds.
              </InfoPopover>
            </div>
            <Input
              id="fundTerm"
              type="number"
              value={input.fundTermYears}
              onChange={(e) => handleChange('fundTermYears', parseInt(e.target.value) || 0)}
              min="5"
              max="15"
              className="h-12 text-base"
            />
          </div>

          {/* Deployment Pace */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="deploymentPace">Deployment Pace</Label>
              <InfoPopover>
                How capital is deployed over the investment period. Front-loaded is typical for PE (35% year 1, 30% year 2, etc.).
              </InfoPopover>
            </div>
            <Select
              value={input.deploymentPaceType}
              onValueChange={(value: any) => handleChange('deploymentPaceType', value)}
            >
              <SelectTrigger id="deploymentPace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear (Equal each year)</SelectItem>
                <SelectItem value="front-loaded">Front-Loaded (Typical PE)</SelectItem>
                <SelectItem value="back-loaded">Back-Loaded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Realization Schedule */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="realizationSchedule">Realization Schedule</Label>
              <InfoPopover>
                When investments are realized and distributions occur. J-curve is typical: minimal early returns, peak in middle years, tail-off at end.
              </InfoPopover>
            </div>
            <Select
              value={input.realizationScheduleType}
              onValueChange={(value: any) => handleChange('realizationScheduleType', value)}
            >
              <SelectTrigger id="realizationSchedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="j-curve">J-Curve (Typical PE)</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="back-loaded">Back-Loaded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gross MOIC */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="grossMOIC">Gross MOIC (Multiple)</Label>
              <InfoPopover>
                Gross multiple on invested capital before fees. E.g., 2.5x means $100M invested returns $250M gross.
              </InfoPopover>
            </div>
            <Input
              id="grossMOIC"
              type="number"
              step="0.1"
              value={input.grossMOIC}
              onChange={(e) => handleChange('grossMOIC', parseFloat(e.target.value) || 0)}
              placeholder="2.5"
              className="h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Economics and Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Economics and Fees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Management Fee Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="managementFeeRate">Management Fee Rate (%)</Label>
              <InfoPopover>
                Annual management fee as a percentage, typically 1.5-2.0% for PE funds.
              </InfoPopover>
            </div>
            <Input
              id="managementFeeRate"
              type="number"
              step="0.1"
              value={input.managementFeeRate * 100}
              onChange={(e) => handleChange('managementFeeRate', (parseFloat(e.target.value) || 0) / 100)}
              placeholder="2.0"
              className="h-12 text-base"
            />
          </div>

          {/* Management Fee Basis */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="feeBasis">Management Fee Basis</Label>
              <InfoPopover>
                Whether fees are charged on total commitments or invested capital. Commitments basis is more common.
              </InfoPopover>
            </div>
            <Select
              value={input.managementFeeBasis}
              onValueChange={(value: any) => handleChange('managementFeeBasis', value)}
            >
              <SelectTrigger id="feeBasis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commitments">Commitments</SelectItem>
                <SelectItem value="invested-capital">Invested Capital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Carry Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="carryRate">Carried Interest (%)</Label>
              <InfoPopover>
                GP's share of profits above preferred return, typically 20% for PE and VC funds.
              </InfoPopover>
            </div>
            <Input
              id="carryRate"
              type="number"
              step="1"
              value={input.carryRate * 100}
              onChange={(e) => handleChange('carryRate', (parseFloat(e.target.value) || 0) / 100)}
              placeholder="20"
              className="h-12 text-base"
            />
          </div>

          {/* Pref Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="prefRate">Preferred Return (%)</Label>
              <InfoPopover>
                Hurdle rate LPs must achieve before GP receives carry, typically 8% for PE funds.
              </InfoPopover>
            </div>
            <Input
              id="prefRate"
              type="number"
              step="0.5"
              value={input.prefRate * 100}
              onChange={(e) => handleChange('prefRate', (parseFloat(e.target.value) || 0) / 100)}
              placeholder="8"
              className="h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Line Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription Line Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Use Line */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useLine"
              checked={input.useLine}
              onCheckedChange={(checked) => handleChange('useLine', checked)}
            />
            <Label htmlFor="useLine" className="text-sm font-normal cursor-pointer">
              Use subscription line of credit
            </Label>
          </div>

          {input.useLine && (
            <>
              {/* Facility Size */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="facilitySize">Facility Size (% of Commitments)</Label>
                  <InfoPopover>
                    Size of credit facility as % of total commitments. ILPA recommends maximum 15-25%. Typical is 20%.
                  </InfoPopover>
                  {input.useLine && (
                    <Badge
                      variant={isFacilitySizeCompliant ? "default" : "secondary"}
                      className={isFacilitySizeCompliant ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
                    >
                      {isFacilitySizeCompliant ? "Within ILPA guidance" : "Exceeds ILPA guidance"}
                    </Badge>
                  )}
                </div>
                <Input
                  id="facilitySize"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={input.facilitySize * 100}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    const clamped = Math.max(0, Math.min(100, value))
                    handleChange('facilitySize', clamped / 100)
                  }}
                  placeholder="20"
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(input.fundSize * input.facilitySize)} facility
                </p>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <InfoPopover>
                    Annual interest rate on the subscription line. Typical range is 3-6% (2024-2025), a few hundred bps below other commercial lending.
                  </InfoPopover>
                </div>
                <Input
                  id="interestRate"
                  type="number"
                  min={0}
                  max={20}
                  step="0.1"
                  value={input.interestRate * 100}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    const clamped = Math.max(0, Math.min(20, value))
                    handleChange('interestRate', clamped / 100)
                  }}
                  placeholder="4.5"
                  className="h-12 text-base"
                />
              </div>

              {/* Max Days Outstanding */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="maxDays">Maximum Days Outstanding</Label>
                  <InfoPopover>
                    How long draws can remain outstanding before repayment. Historically 90 days, trending to 180-360 days. ILPA recommends maximum 180 days.
                  </InfoPopover>
                  {input.useLine && (
                    <Badge
                      variant={isDaysCompliant ? "default" : "secondary"}
                      className={isDaysCompliant ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
                    >
                      {isDaysCompliant ? "Within ILPA guidance" : "Exceeds ILPA guidance"}
                    </Badge>
                  )}
                </div>
                <Input
                  id="maxDays"
                  type="number"
                  min={0}
                  max={365}
                  value={input.maxDaysOutstanding}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    const clamped = Math.max(0, Math.min(365, value))
                    handleChange('maxDaysOutstanding', clamped)
                  }}
                  placeholder="180"
                  className="h-12 text-base"
                />
              </div>

              {/* Repayment Trigger */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="repaymentTrigger">Repayment Trigger</Label>
                  <InfoPopover>
                    When the line is repaid. Automatic = repaid after max days via capital call. Distribution-funded = repaid from portfolio exits.
                  </InfoPopover>
                </div>
                <Select
                  value={input.repaymentTrigger}
                  onValueChange={(value: any) => handleChange('repaymentTrigger', value)}
                >
                  <SelectTrigger id="repaymentTrigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic (Time-Based)</SelectItem>
                    <SelectItem value="distribution-funded">Distribution-Funded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
