"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
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
    <TooltipProvider>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Different fund types have different audit complexity. VC tends to be simpler, while private credit and fund-of-funds are typically more complex.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Larger funds typically have higher audit fees due to increased scope, materiality thresholds, and regulatory scrutiny.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">More investments mean more valuations to verify, cap tables to confirm, and financial data to collect—all of which increase audit time and cost.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Each fund, feeder, blocker, SPV, or parallel vehicle requires separate audit procedures and consolidation, increasing complexity and cost.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Cross-border structures require coordination with foreign regulations, tax rules, and potentially multiple auditors—adding time and cost.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">First-time fund managers are emerging managers. Even Fund II or III can be considered emerging if the team is relatively new to the strategy.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Simple = straightforward equity investments. Moderate = some debt, preferred structures. Complex = derivatives, credit facilities, waterfalls, complex capital structures.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Level 1/2 = observable market prices or inputs. Level 3 = illiquid, unobservable inputs requiring custom models and significant judgment—much more audit work.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Derivatives, options, warrants, convertible debt, or complex preferred structures require specialized audit procedures and valuation expertise.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">A reputable third-party administrator (e.g., SS&C, Apex, Citco) maintains books and records and produces draft financials, significantly reducing audit time and cost.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">First-year audits are typically 30-50% more expensive due to initial setup, understanding your systems, and documenting controls. Repeat audits benefit from efficiency.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Rush timelines or tight deadlines require more resources and overtime from the audit team, increasing fees by 20-30%.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">U.S. GAAP is standard for U.S. funds. IFRS or other frameworks may require additional specialized expertise.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">SEC-registered advisers with {'>'}$150M AUM are required to have audited financials, and auditors must follow additional regulatory standards.</p>
                  </TooltipContent>
                </Tooltip>
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
    </TooltipProvider>
  )
}
