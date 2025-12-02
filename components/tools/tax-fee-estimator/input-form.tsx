"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { InfoPopover } from '@/components/ui/info-popover'
import { TaxInput } from './pricingData'

interface InputFormProps {
  input: TaxInput
  onChange: (input: TaxInput) => void
  onCalculate?: () => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const updateField = <K extends keyof TaxInput>(field: K, value: TaxInput[K]) => {
    onChange({ ...input, [field]: value })
  }

  return (
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
              <InfoPopover>
                Different fund types have varying tax complexity. VC tends to be simpler with straightforward equity. Hedge funds and credit funds often have more complex instruments. Real estate has specific cost recovery and depreciation rules. Fund-of-funds require tracking underlying K-1s.
              </InfoPopover>
            </div>
            <Select value={input.fundType} onValueChange={(value) => updateField('fundType', value)}>
              <SelectTrigger id="fundType"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="venture-capital">Venture Capital</SelectItem>
                <SelectItem value="pe-buyout">Private Equity (Buyout)</SelectItem>
                <SelectItem value="private-credit">Private Credit / Direct Lending</SelectItem>
                <SelectItem value="hedge-fund">Hedge Fund / Trading</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="fund-of-funds">Fund of Funds</SelectItem>
                <SelectItem value="fund-of-one">Fund of One / SMA</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fundSize">Fund Size</Label>
              <InfoPopover>
                Committed capital or AUM. Larger funds typically have higher base tax fees due to more complex allocations, more investors, and greater regulatory scrutiny. The base return cost scales with fund size.
              </InfoPopover>
            </div>
            <Select value={input.fundSize} onValueChange={(value) => updateField('fundSize', value)}>
              <SelectTrigger id="fundSize"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="under-50">Under $50M</SelectItem>
                <SelectItem value="50-150">$50M - $150M</SelectItem>
                <SelectItem value="150-500">$150M - $500M</SelectItem>
                <SelectItem value="500-plus">$500M+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="strategyComplexity">Strategy Complexity</Label>
              <InfoPopover>
                Plain vanilla = straightforward equity or simple debt. Moderate = some preferred structures, convertibles, or limited derivatives. Complex = significant derivatives, cross-border transactions, complex capital structures, or multi-strategy approaches.
              </InfoPopover>
            </div>
            <Select value={input.strategyComplexity} onValueChange={(value) => updateField('strategyComplexity', value)}>
              <SelectTrigger id="strategyComplexity"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Plain Vanilla</SelectItem>
                <SelectItem value="moderate">Moderate Complexity</SelectItem>
                <SelectItem value="complex">Complex / Cross-Border / Derivatives</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="domicile">Main Domicile(s)</Label>
              <InfoPopover>
                Multi-jurisdictional structures require coordination across different tax systems. U.S.-Cayman structures are common for foreign investors. Luxembourg is popular for European investors. Each additional jurisdiction adds compliance requirements.
              </InfoPopover>
            </div>
            <Select value={input.domicile} onValueChange={(value) => updateField('domicile', value)}>
              <SelectTrigger id="domicile"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="us-only">U.S. Partnership Only</SelectItem>
                <SelectItem value="us-cayman">U.S. + Cayman</SelectItem>
                <SelectItem value="us-lux">U.S. + Luxembourg</SelectItem>
                <SelectItem value="multiple">Multiple Jurisdictions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Structure & Entities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Structure & Entities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="mainFunds">Main Funds</Label>
                <InfoPopover>
                  Number of primary fund entities requiring Form 1065 (partnership return). Most single-fund managers have 1, but multi-fund platforms may have several.
                </InfoPopover>
              </div>
              <Input id="mainFunds" type="number" min="1" value={input.mainFunds} onChange={(e) => updateField('mainFunds', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="parallelFunds">Parallel Funds</Label>
                <InfoPopover>
                  Parallel funds are often created for tax-exempt, ERISA, or foreign investors. Each requires a separate tax return but can share allocations with the main fund.
                </InfoPopover>
              </div>
              <Input id="parallelFunds" type="number" min="0" value={input.parallelFunds} onChange={(e) => updateField('parallelFunds', Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="aivCount">AIVs</Label>
                <InfoPopover>
                  Alternative Investment Vehicles (AIVs) or co-investment vehicles. Each AIV typically requires its own partnership return and K-1s, adding ~50% of base fund return cost.
                </InfoPopover>
              </div>
              <Input id="aivCount" type="number" min="0" value={input.aivCount} onChange={(e) => updateField('aivCount', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="blockerCount">Blockers</Label>
                <InfoPopover>
                  Corporate blockers prevent UBTI (unrelated business taxable income) or ECI (effectively connected income) for tax-exempt and foreign investors. Each requires Form 1120 (corporate return).
                </InfoPopover>
              </div>
              <Input id="blockerCount" type="number" min="0" value={input.blockerCount} onChange={(e) => updateField('blockerCount', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="gpEntities">GP Entities</Label>
                <InfoPopover>
                  General partner and carry vehicle entities. These typically include the GP entity and separate carried interest vehicles, each requiring their own tax returns.
                </InfoPopover>
              </div>
              <Input id="gpEntities" type="number" min="0" value={input.gpEntities} onChange={(e) => updateField('gpEntities', Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="managementCo" checked={input.managementCo} onCheckedChange={(checked) => updateField('managementCo', checked as boolean)} />
            <Label htmlFor="managementCo" className="font-normal cursor-pointer">Include Management Company Tax Return</Label>
            <InfoPopover>
              The management company (typically an LLC or S-Corp) that receives management fees. Adding this includes the annual tax return for that entity.
            </InfoPopover>
          </div>
        </CardContent>
      </Card>

      {/* Investors & Jurisdictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investors & Jurisdictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="investorCount">Number of Investors (K-1s)</Label>
              <InfoPopover>
                Each investor requires a Schedule K-1 showing their share of income, deductions, and credits. K-1 preparation costs $70-$450 per investor depending on complexity and volume discounts.
              </InfoPopover>
            </div>
            <Select value={input.investorCount} onValueChange={(value) => updateField('investorCount', value)}>
              <SelectTrigger id="investorCount"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="under-10">Under 10</SelectItem>
                <SelectItem value="11-30">11-30</SelectItem>
                <SelectItem value="31-75">31-75</SelectItem>
                <SelectItem value="76-150">76-150</SelectItem>
                <SelectItem value="150-plus">150+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="stateCount">Number of States</Label>
              <InfoPopover>
                States where the fund has filing obligations based on investor locations or fund activities. Each state adds $500-$1,500 in filing fees and preparation time.
              </InfoPopover>
            </div>
            <Select value={input.stateCount} onValueChange={(value) => updateField('stateCount', value)}>
              <SelectTrigger id="stateCount"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 state</SelectItem>
                <SelectItem value="2">2 states</SelectItem>
                <SelectItem value="3-5">3-5 states</SelectItem>
                <SelectItem value="6-10">6-10 states</SelectItem>
                <SelectItem value="10-plus">10+ states</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="foreignInvestors" checked={input.foreignInvestors} onCheckedChange={(checked) => updateField('foreignInvestors', checked as boolean)} />
              <Label htmlFor="foreignInvestors" className="font-normal cursor-pointer">Non-U.S. Investors (Forms 1042/1042-S)</Label>
              <InfoPopover>
                Foreign investors require Form 1042-S reporting and potentially withholding tax calculations under Section 1446. This adds compliance complexity and cost.
              </InfoPopover>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="erisa" checked={input.erisa} onCheckedChange={(checked) => updateField('erisa', checked as boolean)} />
              <Label htmlFor="erisa" className="font-normal cursor-pointer">Tax-Exempt / ERISA Investors (UBTI tracking)</Label>
              <InfoPopover>
                Tax-exempt investors (pensions, endowments, foundations) and ERISA plans require careful tracking of unrelated business taxable income (UBTI) and may need special allocations.
              </InfoPopover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Reporting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Special Reporting Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="pfic" checked={input.pfic} onCheckedChange={(checked) => updateField('pfic', checked as boolean)} />
            <Label htmlFor="pfic" className="font-normal cursor-pointer">PFIC Reporting (Form 8621)</Label>
            <InfoPopover>
              Passive Foreign Investment Companies require Form 8621 filings with QEF elections, mark-to-market calculations, or excess distribution computations. Common for funds investing in foreign companies.
            </InfoPopover>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="cfc" checked={input.cfc} onCheckedChange={(checked) => updateField('cfc', checked as boolean)} />
            <Label htmlFor="cfc" className="font-normal cursor-pointer">CFC Reporting (Form 5471)</Label>
            <InfoPopover>
              Controlled Foreign Corporations require Form 5471 with detailed schedules, Subpart F income calculations, and GILTI computations. Adds $2,000-$5,000+ per CFC.
            </InfoPopover>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="withholding" checked={input.withholding} onCheckedChange={(checked) => updateField('withholding', checked as boolean)} />
            <Label htmlFor="withholding" className="font-normal cursor-pointer">Withholding Tax Calculations (Section 1446)</Label>
            <InfoPopover>
              Section 1446 requires partnerships with foreign partners to withhold and pay tax on effectively connected taxable income. Requires quarterly calculations and deposits.
            </InfoPopover>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="fatca" checked={input.fatca} onCheckedChange={(checked) => updateField('fatca', checked as boolean)} />
            <Label htmlFor="fatca" className="font-normal cursor-pointer">FATCA / CRS Compliance</Label>
            <InfoPopover>
              Foreign Account Tax Compliance Act (FATCA) and Common Reporting Standard (CRS) require reporting of foreign financial accounts and certain foreign investor information.
            </InfoPopover>
          </div>
        </CardContent>
      </Card>

      {/* Service Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="quarterlyEstimates" checked={input.quarterlyEstimates} onCheckedChange={(checked) => updateField('quarterlyEstimates', checked as boolean)} />
            <Label htmlFor="quarterlyEstimates" className="font-normal cursor-pointer">Quarterly Estimated Tax Calculations</Label>
            <InfoPopover>
              Many states and investors require quarterly estimated tax payments. This service provides calculations four times per year based on projected fund income.
            </InfoPopover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="planningMeetings">Tax Planning Level</Label>
              <InfoPopover>
                None = pure compliance only. Basic = 1-2 annual review calls. Moderate = quarterly planning and transaction review. Extensive = proactive structuring, deal advisory, and strategic planning.
              </InfoPopover>
            </div>
            <Select value={input.planningMeetings} onValueChange={(value) => updateField('planningMeetings', value)}>
              <SelectTrigger id="planningMeetings"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Compliance Only)</SelectItem>
                <SelectItem value="basic">Basic (1-2 calls/year)</SelectItem>
                <SelectItem value="regular">Regular (Quarterly)</SelectItem>
                <SelectItem value="comprehensive">Comprehensive (Proactive Advisory)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="amendments" checked={input.amendments} onCheckedChange={(checked) => updateField('amendments', checked as boolean)} />
            <Label htmlFor="amendments" className="font-normal cursor-pointer">Budget for Amendments / Restatements</Label>
            <InfoPopover>
              Include a contingency budget for amended returns or K-1 restatements. First-year funds or funds with complex transactions may need this more often.
            </InfoPopover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Provider Tier</Label>
              <InfoPopover>
                Boutique fund-focused firms often offer 15% lower fees with personalized service. Mid-market firms are the baseline. Big 4 firms charge 35%+ premiums but offer global resources and brand recognition.
              </InfoPopover>
            </div>
            <RadioGroup value={input.providerTier} onValueChange={(value) => updateField('providerTier', value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boutique" id="boutique" />
                <Label htmlFor="boutique" className="font-normal cursor-pointer">Boutique / Specialist Firm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mid-market" id="mid-market" />
                <Label htmlFor="mid-market" className="font-normal cursor-pointer">Mid-Market Firm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="big-4" id="big-4" />
                <Label htmlFor="big-4" className="font-normal cursor-pointer">Big 4 / Large Global Firm</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
