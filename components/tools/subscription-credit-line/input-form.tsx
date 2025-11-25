'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { SubscriptionLineInput } from './subscriptionLineCalculations'

interface InputFormProps {
  input: SubscriptionLineInput
  onChange: (input: SubscriptionLineInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const handleChange = (field: keyof SubscriptionLineInput, value: any) => {
    onChange({ ...input, [field]: value })
  }

  return (
    <TooltipProvider>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Total committed capital to the fund. This is the maximum amount LPs have agreed to invest.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="fundSize"
                type="number"
                value={input.fundSize}
                onChange={(e) => handleChange('fundSize', parseFloat(e.target.value) || 0)}
                placeholder="100000000"
              />
              <p className="text-xs text-muted-foreground">
                ${(input.fundSize / 1000000).toFixed(0)}M
              </p>
            </div>

            {/* Investment Period */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="investmentPeriod">Investment Period (Years)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The period during which the fund makes new investments, typically 4-6 years for PE/VC funds.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="investmentPeriod"
                type="number"
                value={input.investmentPeriodYears}
                onChange={(e) => handleChange('investmentPeriodYears', parseInt(e.target.value) || 0)}
                min="1"
                max="10"
              />
            </div>

            {/* Fund Term */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fundTerm">Total Fund Term (Years)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Total fund life including investment period and harvest period, typically 10-12 years for PE funds.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="fundTerm"
                type="number"
                value={input.fundTermYears}
                onChange={(e) => handleChange('fundTermYears', parseInt(e.target.value) || 0)}
                min="5"
                max="15"
              />
            </div>

            {/* Deployment Pace */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="deploymentPace">Deployment Pace</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>How capital is deployed over the investment period. Front-loaded is typical for PE (35% year 1, 30% year 2, etc.).</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>When investments are realized and distributions occur. J-curve is typical: minimal early returns, peak in middle years, tail-off at end.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Gross multiple on invested capital before fees. E.g., 2.5x means $100M invested returns $250M gross.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="grossMOIC"
                type="number"
                step="0.1"
                value={input.grossMOIC}
                onChange={(e) => handleChange('grossMOIC', parseFloat(e.target.value) || 0)}
                placeholder="2.5"
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Annual management fee as a percentage, typically 1.5-2.0% for PE funds.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="managementFeeRate"
                type="number"
                step="0.1"
                value={input.managementFeeRate * 100}
                onChange={(e) => handleChange('managementFeeRate', (parseFloat(e.target.value) || 0) / 100)}
                placeholder="2.0"
              />
            </div>

            {/* Management Fee Basis */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="feeBasis">Management Fee Basis</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Whether fees are charged on total commitments or invested capital. Commitments basis is more common.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>GP's share of profits above preferred return, typically 20% for PE and VC funds.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="carryRate"
                type="number"
                step="1"
                value={input.carryRate * 100}
                onChange={(e) => handleChange('carryRate', (parseFloat(e.target.value) || 0) / 100)}
                placeholder="20"
              />
            </div>

            {/* Pref Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="prefRate">Preferred Return (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Hurdle rate LPs must achieve before GP receives carry, typically 8% for PE funds.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="prefRate"
                type="number"
                step="0.5"
                value={input.prefRate * 100}
                onChange={(e) => handleChange('prefRate', (parseFloat(e.target.value) || 0) / 100)}
                placeholder="8"
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="facilitySize">Facility Size (% of Commitments)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Size of credit facility as % of total commitments. ILPA recommends maximum 15-25%. Typical is 20%.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="facilitySize"
                    type="number"
                    step="1"
                    value={input.facilitySize * 100}
                    onChange={(e) => handleChange('facilitySize', (parseFloat(e.target.value) || 0) / 100)}
                    placeholder="20"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(input.fundSize * input.facilitySize)} facility
                  </p>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Annual interest rate on the subscription line. Typical range is 3-6% (2024-2025), a few hundred bps below other commercial lending.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={input.interestRate * 100}
                    onChange={(e) => handleChange('interestRate', (parseFloat(e.target.value) || 0) / 100)}
                    placeholder="4.5"
                  />
                </div>

                {/* Max Days Outstanding */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="maxDays">Maximum Days Outstanding</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>How long draws can remain outstanding before repayment. Historically 90 days, trending to 180-360 days. ILPA recommends maximum 180 days.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="maxDays"
                    type="number"
                    value={input.maxDaysOutstanding}
                    onChange={(e) => handleChange('maxDaysOutstanding', parseInt(e.target.value) || 0)}
                    placeholder="180"
                  />
                </div>

                {/* Repayment Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="repaymentTrigger">Repayment Trigger</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>When the line is repaid. Automatic = repaid after max days via capital call. Distribution-funded = repaid from portfolio exits.</p>
                      </TooltipContent>
                    </Tooltip>
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
    </TooltipProvider>
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
