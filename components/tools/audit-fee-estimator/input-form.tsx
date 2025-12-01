"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { InfoPopover } from '@/components/ui/info-popover'
import { AuditInput } from './pricingData'

interface InputFormProps {
  input: AuditInput
  onChange: (input: AuditInput) => void
}

export function InputForm({ input, onChange }: InputFormProps) {
  const updateField = <K extends keyof AuditInput>(field: K, value: AuditInput[K]) => {
    onChange({ ...input, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Fund Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fund Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fundType">Fund Type</Label>
              <InfoPopover>
                Different fund types have different audit complexity. VC tends to be simpler due to straightforward equity investments. Private credit requires more work due to loan valuations and interest calculations. Fund-of-funds require verification of underlying fund NAVs across multiple managers.
              </InfoPopover>
            </div>
            <Select value={input.fundType} onValueChange={(value) => updateField('fundType', value)}>
              <SelectTrigger id="fundType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venture-capital">Venture Capital</SelectItem>
                <SelectItem value="pe-buyout">Private Equity (Buyout)</SelectItem>
                <SelectItem value="growth-equity">Growth Equity</SelectItem>
                <SelectItem value="private-credit">Private Credit / Direct Lending</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="fund-of-funds">Fund of Funds</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fundSize">Fund Size (AUM)</Label>
              <InfoPopover>
                Larger funds typically have higher audit fees due to increased scope and regulatory scrutiny. The materiality threshold scales with AUM, affecting how much sampling and testing is required. Funds over $250M often attract Big 4 firm pricing.
              </InfoPopover>
            </div>
            <Select value={input.fundSize} onValueChange={(value) => updateField('fundSize', value)}>
              <SelectTrigger id="fundSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-50">Under $50M</SelectItem>
                <SelectItem value="50-100">$50M - $100M</SelectItem>
                <SelectItem value="100-250">$100M - $250M</SelectItem>
                <SelectItem value="250-500">$250M - $500M</SelectItem>
                <SelectItem value="500-plus">$500M+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="portfolioCount">Number of Portfolio Companies</Label>
              <InfoPopover>
                More investments mean more valuations to verify, cap tables to confirm, and financial data to collect. Each portfolio company requires the auditor to review investment agreements, verify cost basis, and assess fair value methodology.
              </InfoPopover>
            </div>
            <Select value={input.portfolioCount} onValueChange={(value) => updateField('portfolioCount', value)}>
              <SelectTrigger id="portfolioCount">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-10">0-10</SelectItem>
                <SelectItem value="11-25">11-25</SelectItem>
                <SelectItem value="26-50">26-50</SelectItem>
                <SelectItem value="51-100">51-100</SelectItem>
                <SelectItem value="100-plus">100+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="entityCount">Number of Legal Entities</Label>
              <InfoPopover>
                Each fund, feeder, blocker, SPV, or parallel vehicle requires separate audit procedures and consolidation. Master-feeder structures, offshore vehicles, and blocker corporations all add complexity. Each entity has its own trial balance, allocations, and financial statements.
              </InfoPopover>
            </div>
            <Select value={input.entityCount} onValueChange={(value) => updateField('entityCount', value)}>
              <SelectTrigger id="entityCount">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 (single fund)</SelectItem>
                <SelectItem value="2-3">2-3 (e.g., fund + GP)</SelectItem>
                <SelectItem value="4-6">4-6 (e.g., master-feeder)</SelectItem>
                <SelectItem value="7-10">7-10 (multiple feeders/SPVs)</SelectItem>
                <SelectItem value="10-plus">10+ (complex structure)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="jurisdictions">Primary Jurisdictions</Label>
              <InfoPopover>
                Cross-border structures require coordination with foreign regulations, tax rules, and potentially multiple auditors. Cayman, Delaware, Luxembourg, and Ireland structures each have specific requirements. Multi-jurisdiction audits may require reliance letters between audit firms.
              </InfoPopover>
            </div>
            <Select value={input.jurisdictions} onValueChange={(value) => updateField('jurisdictions', value)}>
              <SelectTrigger id="jurisdictions">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-only">U.S. Only</SelectItem>
                <SelectItem value="us-plus-1">U.S. + 1 other jurisdiction</SelectItem>
                <SelectItem value="multiple">Multiple jurisdictions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="emergingManager">Emerging Manager Status</Label>
              <InfoPopover>
                First-time fund managers are emerging managers and may have less established processes. Fund II or III teams are still building track records and infrastructure. Established managers (Fund IV+) typically have mature operations and existing auditor relationships.
              </InfoPopover>
            </div>
            <Select value={input.emergingManager} onValueChange={(value) => updateField('emergingManager', value)}>
              <SelectTrigger id="emergingManager">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fund-1">Fund I (first-time fund)</SelectItem>
                <SelectItem value="fund-2-3">Fund II or III (emerging)</SelectItem>
                <SelectItem value="established">Established (Fund IV+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complexity & Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complexity & Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="strategyComplexity">Strategy Complexity</Label>
              <InfoPopover>
                Simple = straightforward equity investments with standard terms. Moderate = some debt, preferred structures, or side pockets. Complex = derivatives, subscription lines, multiple waterfalls, or intricate capital structures requiring specialized audit expertise.
              </InfoPopover>
            </div>
            <Select value={input.strategyComplexity} onValueChange={(value) => updateField('strategyComplexity', value)}>
              <SelectTrigger id="strategyComplexity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple (straightforward equity)</SelectItem>
                <SelectItem value="moderate">Moderate (some complexity)</SelectItem>
                <SelectItem value="complex">Complex (derivatives, credit facilities, waterfalls)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="valuationComplexity">Valuation Complexity</Label>
              <InfoPopover>
                Level 1 = quoted prices in active markets (public stocks). Level 2 = observable inputs (recent transactions, comparables). Level 3 = illiquid, unobservable inputs requiring custom models and significant judgment. Level 3 assets require much more audit work to validate assumptions and methodologies.
              </InfoPopover>
            </div>
            <Select value={input.valuationComplexity} onValueChange={(value) => updateField('valuationComplexity', value)}>
              <SelectTrigger id="valuationComplexity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mostly-1-2">Largely Level 1 & 2 (observable inputs)</SelectItem>
                <SelectItem value="significant-3">Significant Level 3 (illiquid, model-based)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Complex Instruments?</Label>
              <InfoPopover>
                Derivatives, options, warrants, convertible debt, SAFE notes, or complex preferred structures require specialized audit procedures. Auditors may need to engage valuation specialists and perform additional testing of pricing models.
              </InfoPopover>
            </div>
            <RadioGroup value={input.complexInstruments ? 'yes' : 'no'} onValueChange={(value) => updateField('complexInstruments', value === 'yes')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="complex-yes" />
                <Label htmlFor="complex-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="complex-no" />
                <Label htmlFor="complex-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Third-Party Fund Administrator?</Label>
              <InfoPopover>
                A reputable third-party administrator (SS&C, Apex, Citco, etc.) maintains books and records, produces draft financials, and has established controls. This significantly reduces audit time and cost by providing organized documentation and reliable starting points for the audit team.
              </InfoPopover>
            </div>
            <RadioGroup value={input.hasAdmin ? 'yes' : 'no'} onValueChange={(value) => updateField('hasAdmin', value === 'yes')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="admin-yes" />
                <Label htmlFor="admin-yes" className="font-normal cursor-pointer">Yes (reputable administrator)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="admin-no" />
                <Label htmlFor="admin-no" className="font-normal cursor-pointer">No (in-house or boutique)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Audit Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audit Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="auditYear">First-Year or Repeat Audit?</Label>
              <InfoPopover>
                First-year audits are typically 30-50% more expensive due to initial setup, understanding your systems, documenting controls, and establishing audit procedures. Repeat audits benefit from prior-year knowledge, existing documentation, and established relationships with your team.
              </InfoPopover>
            </div>
            <Select value={input.auditYear} onValueChange={(value) => updateField('auditYear', value)}>
              <SelectTrigger id="auditYear">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">First-year audit</SelectItem>
                <SelectItem value="repeat">Repeat audit (same firm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="timeline">Required Timeline</Label>
              <InfoPopover>
                Rush timelines or tight deadlines require more resources and overtime from the audit team, increasing fees by 20-30%. Normal timeline is 90+ days from year-end. Plan ahead to avoid rush fees, especially for first-year audits which can take 8-12 weeks.
              </InfoPopover>
            </div>
            <Select value={input.timeline} onValueChange={(value) => updateField('timeline', value)}>
              <SelectTrigger id="timeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal timeline (90+ days)</SelectItem>
                <SelectItem value="rush">Rush / tight deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="framework">Reporting Framework</Label>
              <InfoPopover>
                U.S. GAAP is standard for U.S. domestic funds. IFRS may be required for European investors or offshore structures. Different frameworks have different disclosure requirements and may require auditors with specialized expertise in that framework.
              </InfoPopover>
            </div>
            <Select value={input.framework} onValueChange={(value) => updateField('framework', value)}>
              <SelectTrigger id="framework">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gaap">U.S. GAAP</SelectItem>
                <SelectItem value="ifrs">IFRS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>SEC-Registered Adviser?</Label>
              <InfoPopover>
                SEC-registered investment advisers with more than $150M AUM are generally required to have audited financials for their private fund clients. The auditor must follow SEC-specific standards and enhanced documentation requirements, adding modestly to fees.
              </InfoPopover>
            </div>
            <RadioGroup value={input.secRegistered ? 'yes' : 'no'} onValueChange={(value) => updateField('secRegistered', value === 'yes')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="sec-yes" />
                <Label htmlFor="sec-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="sec-no" />
                <Label htmlFor="sec-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
