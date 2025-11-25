"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { TaxInput } from './pricingData'

interface InputFormProps {
  input: TaxInput
  onChange: (input: TaxInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const updateField = <K extends keyof TaxInput>(field: K, value: TaxInput[K]) => {
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
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Different fund types have varying tax complexity. VC tends to be simpler, while hedge funds and credit funds often have more complex instruments.</p></TooltipContent></Tooltip>
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
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Committed capital or AUM. Larger funds typically have higher base tax fees.</p></TooltipContent></Tooltip>
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
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Plain vanilla = straightforward equity. Moderate = some debt/preferred. Complex = derivatives, cross-border, complex instruments.</p></TooltipContent></Tooltip>
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
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Multi-jurisdictional structures require coordination across different tax systems.</p></TooltipContent></Tooltip>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mainFunds">Main Funds</Label>
                  <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Number of primary fund entities requiring Form 1065.</p></TooltipContent></Tooltip>
                </div>
                <Input id="mainFunds" type="number" min="1" value={input.mainFunds} onChange={(e) => updateField('mainFunds', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="parallelFunds">Parallel Funds</Label>
                  <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Parallel funds for tax-exempt or foreign investors. Each requires separate tax return.</p></TooltipContent></Tooltip>
                </div>
                <Input id="parallelFunds" type="number" min="0" value={input.parallelFunds} onChange={(e) => updateField('parallelFunds', Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="aivCount">AIVs</Label>
                  <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Alternative Investment Vehicles for co-investments.</p></TooltipContent></Tooltip>
                </div>
                <Input id="aivCount" type="number" min="0" value={input.aivCount} onChange={(e) => updateField('aivCount', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="blockerCount">Blockers</Label>
                  <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Corporate blockers to prevent UBTI/ECI for tax-exempt/foreign investors. Each requires Form 1120.</p></TooltipContent></Tooltip>
                </div>
                <Input id="blockerCount" type="number" min="0" value={input.blockerCount} onChange={(e) => updateField('blockerCount', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="gpEntities">GP Entities</Label>
                  <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">GP and carry vehicle entities.</p></TooltipContent></Tooltip>
                </div>
                <Input id="gpEntities" type="number" min="0" value={input.gpEntities} onChange={(e) => updateField('gpEntities', Number(e.target.value))} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="managementCo" checked={input.managementCo} onCheckedChange={(checked) => updateField('managementCo', checked as boolean)} />
              <Label htmlFor="managementCo" className="font-normal cursor-pointer">Include Management Company Tax Return</Label>
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
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Each investor requires a Schedule K-1. Costs are $100-$800 per K-1 depending on complexity.</p></TooltipContent></Tooltip>
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
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">States where fund has filing obligations (~$500-1,500 per state).</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.stateCount} onValueChange={(value) => updateField('stateCount', value)}>
                <SelectTrigger id="stateCount"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3-5">3-5</SelectItem>
                  <SelectItem value="6-10">6-10</SelectItem>
                  <SelectItem value="10-plus">10+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="foreignInvestors" checked={input.foreignInvestors} onCheckedChange={(checked) => updateField('foreignInvestors', checked as boolean)} />
                <Label htmlFor="foreignInvestors" className="font-normal cursor-pointer">Non-U.S. Investors (Forms 1042/1042-S)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="erisa" checked={input.erisa} onCheckedChange={(checked) => updateField('erisa', checked as boolean)} />
                <Label htmlFor="erisa" className="font-normal cursor-pointer">Tax-Exempt / ERISA Investors (UBTI tracking)</Label>
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
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="cfc" checked={input.cfc} onCheckedChange={(checked) => updateField('cfc', checked as boolean)} />
              <Label htmlFor="cfc" className="font-normal cursor-pointer">CFC Reporting (Form 5471)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="withholding" checked={input.withholding} onCheckedChange={(checked) => updateField('withholding', checked as boolean)} />
              <Label htmlFor="withholding" className="font-normal cursor-pointer">Withholding Tax Calculations (§1446)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="fatca" checked={input.fatca} onCheckedChange={(checked) => updateField('fatca', checked as boolean)} />
              <Label htmlFor="fatca" className="font-normal cursor-pointer">FATCA / CRS Compliance</Label>
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="planningMeetings">Tax Planning Level</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Basic = 1-2 annual calls. Moderate = quarterly planning. Extensive = proactive structuring advisory.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.planningMeetings} onValueChange={(value) => updateField('planningMeetings', value)}>
                <SelectTrigger id="planningMeetings"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Compliance Only)</SelectItem>
                  <SelectItem value="basic">Basic (1-2 calls/year)</SelectItem>
                  <SelectItem value="moderate">Moderate (Quarterly)</SelectItem>
                  <SelectItem value="extensive">Extensive (Proactive Advisory)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="amendments" checked={input.amendments} onCheckedChange={(checked) => updateField('amendments', checked as boolean)} />
              <Label htmlFor="amendments" className="font-normal cursor-pointer">Budget for Amendments / Restatements</Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Provider Tier</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Boutique: 15% lower fees. Mid-market: Standard. Big 4: 35% premium.</p></TooltipContent></Tooltip>
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
    </TooltipProvider>
  )
}
