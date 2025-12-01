"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { InfoPopover } from '@/components/ui/info-popover'
import { FundAdminInput } from './pricingData'

interface InputFormProps {
  input: FundAdminInput
  onChange: (input: FundAdminInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const updateField = <K extends keyof FundAdminInput>(field: K, value: FundAdminInput[K]) => {
    onChange({ ...input, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Fund Profile */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Fund Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="fundType">Fund Type</Label>
              <InfoPopover>
                <p className="font-medium mb-1">How fund type affects pricing:</p>
                <p>Different fund types have varying administrative complexity. PE buyout and real estate typically have more complex portfolio accounting. Hedge funds require daily/weekly NAV and more frequent reconciliations.</p>
              </InfoPopover>
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="aumAmount">Fund Size (AUM)</Label>
                <InfoPopover>
                  <p className="font-medium mb-1">Fund size and pricing:</p>
                  <p>Target or current assets under management in millions. Base fees typically scale with fund size, with larger funds paying lower percentages but higher absolute fees.</p>
                  <p className="mt-2 text-xs">Typical ranges: $25M-$500M+ for emerging managers</p>
                </InfoPopover>
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="region">Primary Jurisdiction</Label>
                <InfoPopover>
                  <p className="font-medium mb-1">Jurisdiction considerations:</p>
                  <p>Offshore jurisdictions (Cayman, Luxembourg) often require specialized expertise and regulatory knowledge. Multi-region structures add coordination complexity.</p>
                </InfoPopover>
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
            <div className="flex items-center gap-1.5">
              <Label>Investment Strategy Complexity</Label>
              <InfoPopover>
                <p className="font-medium mb-1">What makes a strategy complex:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Simple:</strong> Single strategy, straightforward equity investments</li>
                  <li><strong>Moderate:</strong> Multiple deal types, some leverage</li>
                  <li><strong>Complex:</strong> Derivatives, significant leverage, multiple asset classes, complex valuations</li>
                </ul>
              </InfoPopover>
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
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Fund Structure & Entities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="mainEntities">Main Fund Entities</Label>
                <InfoPopover>
                  <p className="font-medium mb-1">Primary fund entities:</p>
                  <p>Number of main fund entities requiring full accounting (e.g., main fund LP, GP entity).</p>
                  <p className="mt-2 text-xs">Typical: 1-2 for most funds</p>
                </InfoPopover>
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="spvCount">SPVs / Co-Investment Vehicles</Label>
                <InfoPopover>
                  <p className="font-medium mb-1">SPV impact on pricing:</p>
                  <p>Deal-by-deal SPVs add significant per-entity administration costs. Each SPV requires separate books, bank accounts, and reporting.</p>
                  <p className="mt-2 text-xs">Typical: 0-10 for PE funds, varies by strategy</p>
                </InfoPopover>
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
              <InfoPopover>
                <p>Offshore master with onshore/offshore feeders. Adds consolidation complexity and typically 10-20% to admin costs.</p>
              </InfoPopover>
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
              <InfoPopover>
                <p>Separate funds investing side-by-side (e.g., for ERISA or tax-exempt investors). Requires allocation tracking across vehicles.</p>
              </InfoPopover>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="mgmtEntities">Management Company Entities</Label>
              <InfoPopover>
                <p className="font-medium mb-1">GP-side entities:</p>
                <p>GP, management company, or carry vehicle entities needing bookkeeping. Many admins bundle 1-2 GP entities at reduced rates.</p>
                <p className="mt-2 text-xs">Typical: 0-2 entities</p>
              </InfoPopover>
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
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Investors & Reporting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="investorCount">Number of Investors</Label>
                <InfoPopover>
                  <p className="font-medium mb-1">Investor count impact:</p>
                  <p>More investors mean more capital account tracking, K-1s, and reporting distributions. Each investor adds incremental work.</p>
                  <p className="mt-2 text-xs">Typical: 10-100 for institutional funds</p>
                </InfoPopover>
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="reportingFreq">Reporting Frequency</Label>
                <InfoPopover>
                  <p className="font-medium mb-1">Reporting frequency impact:</p>
                  <p>Monthly reporting significantly increases workload vs. quarterly or annual. Each reporting cycle requires NAV calculation, investor statements, and quality review.</p>
                </InfoPopover>
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
              <InfoPopover>
                <p>Individual IRR, TVPI, DPI calculations for each investor based on their specific cash flows. Standard for institutional LPs.</p>
              </InfoPopover>
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
              <InfoPopover>
                <p>Administrator handles notice generation, wire tracking, and recording of LP capital contributions and distributions.</p>
              </InfoPopover>
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
              <InfoPopover>
                <p>Bespoke reports for specific investors per side letter requirements. Adds manual work and quality control complexity.</p>
              </InfoPopover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services and Scope */}
      <Card>
        <CardHeader className="pb-4">
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
            <div className="flex items-center gap-1.5">
              <Label htmlFor="taxSupport">Tax Preparation Services</Label>
              <InfoPopover>
                <p className="font-medium mb-1">Tax service levels:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>None:</strong> Handled by separate tax provider</li>
                  <li><strong>Basic:</strong> Fund returns and K-1 preparation</li>
                  <li><strong>Full:</strong> Comprehensive tax planning, advisory, and all returns</li>
                </ul>
              </InfoPopover>
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
            <div className="flex items-center gap-1.5">
              <Label htmlFor="cfoConsulting">CFO-Level Consulting</Label>
              <InfoPopover>
                <p className="font-medium mb-1">CFO services:</p>
                <p>Strategic financial guidance beyond pure administration. Includes budgeting, cash flow management, LP relationship support, and board reporting.</p>
              </InfoPopover>
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
  )
}
