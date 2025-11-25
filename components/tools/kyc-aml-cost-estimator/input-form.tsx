"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { KYCAMLInput } from './pricingData'

interface InputFormProps {
  input: KYCAMLInput
  onChange: (input: KYCAMLInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const updateField = <K extends keyof KYCAMLInput>(field: K, value: KYCAMLInput[K]) => {
    onChange({ ...input, [field]: value })
  }

  const toggleCheck = (check: string) => {
    const newChecks = input.checksDepth.includes(check)
      ? input.checksDepth.filter(c => c !== check)
      : [...input.checksDepth, check]
    updateField('checksDepth', newChecks)
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
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Your fund strategy type affects typical investor profiles and risk tolerance.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.fundType} onValueChange={(value) => updateField('fundType', value)}>
                <SelectTrigger id="fundType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venture-capital">Venture Capital</SelectItem>
                  <SelectItem value="pe-buyout">Private Equity (Buyout)</SelectItem>
                  <SelectItem value="growth-equity">Growth Equity</SelectItem>
                  <SelectItem value="private-credit">Private Credit</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="hedge-fund">Hedge Fund</SelectItem>
                  <SelectItem value="fund-of-funds">Fund of Funds</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="domicile">Fund Domicile</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Where your fund is legally established. Different jurisdictions have varying AML requirements.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.domicile} onValueChange={(value) => updateField('domicile', value)}>
                <SelectTrigger id="domicile"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="cayman">Cayman Islands</SelectItem>
                  <SelectItem value="luxembourg">Luxembourg</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ireland">Ireland</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="investorJurisdictions">Investor Jurisdictions</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Geographic distribution of your investors. Cross-border investors typically require more extensive verification.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.investorJurisdictions} onValueChange={(value) => updateField('investorJurisdictions', value)}>
                <SelectTrigger id="investorJurisdictions"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Primarily Domestic</SelectItem>
                  <SelectItem value="mixed">Mixed Domestic & International</SelectItem>
                  <SelectItem value="international">Primarily International</SelectItem>
                  <SelectItem value="high-risk">Includes High-Risk Jurisdictions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="riskLevel">Overall Risk Level</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Your risk assessment considering investor base, jurisdictions, and regulatory environment.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.riskLevel} onValueChange={(value) => updateField('riskLevel', value)}>
                <SelectTrigger id="riskLevel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Risk</SelectItem>
                  <SelectItem value="higher-risk">Higher Risk (requires EDD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Investor Mix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investor Counts by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="individualCount">Individual Investors</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">High net worth individuals, family offices investing directly. Requires ID verification, PEP screening, source of funds.</p></TooltipContent></Tooltip>
              </div>
              <Input
                id="individualCount"
                type="number"
                min={0}
                value={input.individualCount}
                onChange={(e) => updateField('individualCount', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="entityCount">Entity Investors (LLCs, Partnerships)</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Legal entities like LLCs, partnerships, SPVs. Requires entity verification, beneficial owner analysis, corporate documents.</p></TooltipContent></Tooltip>
              </div>
              <Input
                id="entityCount"
                type="number"
                min={0}
                value={input.entityCount}
                onChange={(e) => updateField('entityCount', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="institutionalCount">Institutional Investors</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Pensions, endowments, insurance companies, sovereign wealth funds. Most extensive due diligence with corporate structure analysis.</p></TooltipContent></Tooltip>
              </div>
              <Input
                id="institutionalCount"
                type="number"
                min={0}
                value={input.institutionalCount}
                onChange={(e) => updateField('institutionalCount', parseInt(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* KYC/AML Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KYC / AML Scope & Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="dueDiligenceLevel">Due Diligence Level</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Standard for typical investors. Enhanced (EDD) required for high-risk, large investments, or PEPs.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.dueDiligenceLevel} onValueChange={(value) => updateField('dueDiligenceLevel', value)}>
                <SelectTrigger id="dueDiligenceLevel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard CDD</SelectItem>
                  <SelectItem value="enhanced">Enhanced Due Diligence (EDD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Depth of Checks</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check-id"
                    checked={input.checksDepth.includes('id-verification')}
                    onCheckedChange={() => toggleCheck('id-verification')}
                  />
                  <label htmlFor="check-id" className="text-sm cursor-pointer">ID & Address Verification</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check-pep"
                    checked={input.checksDepth.includes('pep-sanctions')}
                    onCheckedChange={() => toggleCheck('pep-sanctions')}
                  />
                  <label htmlFor="check-pep" className="text-sm cursor-pointer">PEP & Sanctions Screening</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check-media"
                    checked={input.checksDepth.includes('adverse-media')}
                    onCheckedChange={() => toggleCheck('adverse-media')}
                  />
                  <label htmlFor="check-media" className="text-sm cursor-pointer">Adverse Media Screening</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check-sow"
                    checked={input.checksDepth.includes('source-of-wealth')}
                    onCheckedChange={() => toggleCheck('source-of-wealth')}
                  />
                  <label htmlFor="check-sow" className="text-sm cursor-pointer">Source of Wealth / Funds Analysis</label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="monitoringFrequency">Ongoing Monitoring Frequency</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">How often to refresh KYC and re-screen investors. Annual is standard; quarterly/continuous for higher risk.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.monitoringFrequency} onValueChange={(value) => updateField('monitoringFrequency', value)}>
                <SelectTrigger id="monitoringFrequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Ongoing Monitoring</SelectItem>
                  <SelectItem value="annual">Annual Refresh</SelectItem>
                  <SelectItem value="quarterly">Quarterly Monitoring</SelectItem>
                  <SelectItem value="continuous">Continuous Monitoring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Complexity Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complexity Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="nonResidentProportion">Non-Resident Investor Proportion</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Higher proportion of non-residents increases verification complexity and costs.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.nonResidentProportion} onValueChange={(value) => updateField('nonResidentProportion', value)}>
                <SelectTrigger id="nonResidentProportion"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal ({`<`}25%)</SelectItem>
                  <SelectItem value="some">Some (25-50%)</SelectItem>
                  <SelectItem value="majority">Majority ({`>`}50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="complexOwnership"
                checked={input.complexOwnership}
                onCheckedChange={(checked) => updateField('complexOwnership', checked as boolean)}
              />
              <label htmlFor="complexOwnership" className="text-sm cursor-pointer">
                Complex Ownership Chains (multi-layer UBO analysis required)
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="highRiskProportion">High-Risk Investor Proportion</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">PEPs, high-risk industries, or investors from sanctioned countries requiring EDD.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.highRiskProportion} onValueChange={(value) => updateField('highRiskProportion', value)}>
                <SelectTrigger id="highRiskProportion"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low ({`<`}10%)</SelectItem>
                  <SelectItem value="moderate">Moderate (10-25%)</SelectItem>
                  <SelectItem value="high">High ({`>`}25%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Operating Model */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operating Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="operatingModel">KYC/AML Operating Model</Label>
                <Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">How you manage KYC/AML: in-house team, outsourced provider, or bundled with fund administrator.</p></TooltipContent></Tooltip>
              </div>
              <Select value={input.operatingModel} onValueChange={(value) => updateField('operatingModel', value)}>
                <SelectTrigger id="operatingModel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-house">In-House (own team + software)</SelectItem>
                  <SelectItem value="outsourced">Outsourced to KYC/AML Provider</SelectItem>
                  <SelectItem value="bundled">Bundled Through Fund Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasOngoingMonitoring"
                checked={input.hasOngoingMonitoring}
                onCheckedChange={(checked) => updateField('hasOngoingMonitoring', checked as boolean)}
              />
              <label htmlFor="hasOngoingMonitoring" className="text-sm cursor-pointer">
                Include Ongoing Monitoring Costs
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
