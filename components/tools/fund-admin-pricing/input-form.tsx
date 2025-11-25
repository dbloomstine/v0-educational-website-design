"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { FundAdminInput, getFundTypeName, getRegionName } from './pricingData'

interface InputFormProps {
  input: FundAdminInput
  onChange: (input: FundAdminInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const updateField = <K extends keyof FundAdminInput>(field: K, value: FundAdminInput[K]) => {
    onChange({ ...input, [field]: value })
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Fund Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fund Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fundType">Fund Type</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Different fund types have varying administrative complexity. PE buyout and real estate typically have more complex portfolio accounting.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={input.fundType} onValueChange={(value) => updateField('fundType', value as any)}>
                <SelectTrigger id="fundType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vc">Venture Capital</SelectItem>
                  <SelectItem value="pe-growth">Private Equity - Growth</SelectItem>
                  <SelectItem value="pe-buyout">Private Equity - Buyout</SelectItem>
                  <SelectItem value="private-credit">Private Credit / Debt</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="fund-of-funds">Fund of Funds</SelectItem>
                  <SelectItem value="hedge-fund">Hedge Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="aumAmount">Fund Size (AUM)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Target or current assets under management. Base fees typically scale with fund size.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="aumAmount"
                    type="number"
                    value={input.aumAmount}
                    onChange={(e) => updateField('aumAmount', Number(e.target.value))}
                    placeholder="250"
                  />
                  <Select value={input.aumCurrency} onValueChange={(value) => updateField('aumCurrency', value as any)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Amount in millions</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="region">Primary Jurisdiction</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Offshore jurisdictions often require specialized expertise and may increase costs.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={input.region} onValueChange={(value) => updateField('region', value as any)}>
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="offshore">Offshore (Cayman, Luxembourg)</SelectItem>
                    <SelectItem value="multi-region">Multiple Regions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Investment Strategy Complexity</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Complex strategies (derivatives, leverage, multiple asset classes) require more specialized accounting.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <RadioGroup value={input.strategyComplexity} onValueChange={(value) => updateField('strategyComplexity', value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple" className="font-normal cursor-pointer">Simple (single strategy, straightforward valuations)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="font-normal cursor-pointer">Moderate (some complexity, standard valuations)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complex" id="complex" />
                  <Label htmlFor="complex" className="font-normal cursor-pointer">Complex (derivatives, leverage, complex valuations)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Structure and Entities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fund Structure & Entities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mainEntities">Main Fund Entities</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Primary fund entities requiring full accounting (e.g., main fund LP, GP entity). Typical: 1-2.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="mainEntities"
                  type="number"
                  min="1"
                  value={input.mainEntities}
                  onChange={(e) => updateField('mainEntities', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="spvCount">SPVs / Co-Investment Vehicles</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Deal-by-deal SPVs add significant per-entity administration costs. Typical: 0-10.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="spvCount"
                  type="number"
                  min="0"
                  value={input.spvCount}
                  onChange={(e) => updateField('spvCount', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="masterFeeder"
                  checked={input.hasMasterFeeder}
                  onCheckedChange={(checked) => updateField('hasMasterFeeder', !!checked)}
                />
                <Label htmlFor="masterFeeder" className="font-normal cursor-pointer">
                  Master-Feeder Structure
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Offshore master with onshore/offshore feeders. Adds consolidation complexity.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parallelFunds"
                  checked={input.hasParallelFunds}
                  onCheckedChange={(checked) => updateField('hasParallelFunds', !!checked)}
                />
                <Label htmlFor="parallelFunds" className="font-normal cursor-pointer">
                  Parallel Funds
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Separate funds investing side-by-side (e.g., for ERISA investors). Requires allocation tracking.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="mgmtEntities">Management Company Entities</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">GP, management company, or carry vehicle entities needing bookkeeping. Typical: 0-2.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="mgmtEntities"
                type="number"
                min="0"
                value={input.managementCompanyEntities}
                onChange={(e) => updateField('managementCompanyEntities', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investors and Reporting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investors & Reporting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="investorCount">Number of Investors</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">More investors mean more capital account tracking, K-1s, and reporting distributions. Typical: 10-100.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="investorCount"
                  type="number"
                  min="1"
                  value={input.investorCount}
                  onChange={(e) => updateField('investorCount', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="reportingFreq">Reporting Frequency</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Monthly reporting significantly increases workload vs. quarterly or annual.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={input.reportingFrequency} onValueChange={(value) => updateField('reportingFrequency', value as any)}>
                  <SelectTrigger id="reportingFreq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="investorLevel"
                  checked={input.investorLevelReporting}
                  onCheckedChange={(checked) => updateField('investorLevelReporting', !!checked)}
                />
                <Label htmlFor="investorLevel" className="font-normal cursor-pointer">
                  Investor-Level Performance Reporting
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Individual IRR, TVPI, DPI calculations for each investor.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="capCalls"
                  checked={input.capitalCallDistribution}
                  onCheckedChange={(checked) => updateField('capitalCallDistribution', !!checked)}
                />
                <Label htmlFor="capCalls" className="font-normal cursor-pointer">
                  Capital Calls & Distribution Processing
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Admin handles notice generation and tracking of LP payments.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customReporting"
                  checked={input.customReporting}
                  onCheckedChange={(checked) => updateField('customReporting', !!checked)}
                />
                <Label htmlFor="customReporting" className="font-normal cursor-pointer">
                  Custom / Side Letter Reporting
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Bespoke reports for specific investors per side letters.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services and Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financialStatements"
                  checked={input.financialStatements}
                  onCheckedChange={(checked) => updateField('financialStatements', !!checked)}
                />
                <Label htmlFor="financialStatements" className="font-normal cursor-pointer">
                  Financial Statement Preparation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auditSupport"
                  checked={input.auditSupport}
                  onCheckedChange={(checked) => updateField('auditSupport', !!checked)}
                />
                <Label htmlFor="auditSupport" className="font-normal cursor-pointer">
                  Audit Coordination & Support
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bankRecon"
                  checked={input.bankReconciliation}
                  onCheckedChange={(checked) => updateField('bankReconciliation', !!checked)}
                />
                <Label htmlFor="bankRecon" className="font-normal cursor-pointer">
                  Bank & Custody Reconciliations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regulatoryFilings"
                  checked={input.regulatoryFilings}
                  onCheckedChange={(checked) => updateField('regulatoryFilings', !!checked)}
                />
                <Label htmlFor="regulatoryFilings" className="font-normal cursor-pointer">
                  Regulatory Filings (Form PF, FATCA, CRS)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kycAml"
                  checked={input.kycAmlSupport}
                  onCheckedChange={(checked) => updateField('kycAmlSupport', !!checked)}
                />
                <Label htmlFor="kycAml" className="font-normal cursor-pointer">
                  KYC/AML Onboarding & Monitoring
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="waterfall"
                  checked={input.waterfallCalculations}
                  onCheckedChange={(checked) => updateField('waterfallCalculations', !!checked)}
                />
                <Label htmlFor="waterfall" className="font-normal cursor-pointer">
                  Waterfall & Carry Calculations
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="taxSupport">Tax Preparation Services</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Basic: returns and K-1s. Full: comprehensive tax planning and advisory.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <RadioGroup value={input.taxSupport} onValueChange={(value) => updateField('taxSupport', value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="taxNone" />
                  <Label htmlFor="taxNone" className="font-normal cursor-pointer">None (handled separately)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="taxBasic" />
                  <Label htmlFor="taxBasic" className="font-normal cursor-pointer">Basic (returns & K-1s)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="taxFull" />
                  <Label htmlFor="taxFull" className="font-normal cursor-pointer">Full (returns, K-1s, advisory)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="cfoConsulting">CFO-Level Consulting</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Strategic financial guidance, budgeting support, and advisory services beyond pure administration.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <RadioGroup value={input.cfoConsulting} onValueChange={(value) => updateField('cfoConsulting', value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="cfoNone" />
                  <Label htmlFor="cfoNone" className="font-normal cursor-pointer">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="cfoLight" />
                  <Label htmlFor="cfoLight" className="font-normal cursor-pointer">Light (ad-hoc support)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heavy" id="cfoHeavy" />
                  <Label htmlFor="cfoHeavy" className="font-normal cursor-pointer">Heavy (ongoing strategic partner)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
