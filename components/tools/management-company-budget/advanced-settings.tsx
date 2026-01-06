"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  Settings,
  ChevronDown,
  TrendingUp,
  Percent,
  Calendar,
  Calculator,
  Info
} from 'lucide-react'
import { BudgetData, Fund, BudgetSettings } from './types'

interface AdvancedSettingsProps {
  data: BudgetData
  onDataChange: (data: BudgetData) => void
}

export function AdvancedSettings({ data, onDataChange }: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const settings = data.settings || {}

  const updateSettings = (updates: Partial<BudgetSettings>) => {
    onDataChange({
      ...data,
      settings: { ...settings, ...updates }
    })
  }

  const updateFund = (fundId: string, updates: Partial<Fund>) => {
    onDataChange({
      ...data,
      funds: data.funds.map(f => f.id === fundId ? { ...f, ...updates } : f)
    })
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <ChevronDown className={cn(
                "h-5 w-5 transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Global Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4" />
                Projection Settings
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inflation" className="flex items-center gap-1.5 text-sm">
                    <Percent className="h-3.5 w-3.5" />
                    Annual Expense Growth
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="inflation"
                      type="number"
                      step="0.5"
                      min="0"
                      max="15"
                      value={settings.inflationRate ?? 3}
                      onChange={(e) => updateSettings({ inflationRate: parseFloat(e.target.value) || 0 })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%/year</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expenses will grow at this rate annually
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projYears" className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    Projection Period
                  </Label>
                  <Select
                    value={String(settings.projectionYears ?? 5)}
                    onValueChange={(v) => updateSettings({ projectionYears: parseInt(v) })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 years</SelectItem>
                      <SelectItem value="5">5 years</SelectItem>
                      <SelectItem value="7">7 years</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Per-Fund Advanced Settings */}
            {data.funds.map((fund) => (
              <div key={fund.id} className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm">{fund.name} - Advanced Options</h4>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Fee Basis */}
                  <div className="space-y-2">
                    <Label className="text-sm">Fee Basis</Label>
                    <Select
                      value={fund.feeBasis ?? 'committed'}
                      onValueChange={(v) => updateFund(fund.id, { feeBasis: v as 'committed' | 'invested' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="committed">Committed Capital</SelectItem>
                        <SelectItem value="invested">Invested Capital</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How management fees are calculated
                    </p>
                  </div>

                  {/* First Close % */}
                  <div className="space-y-2">
                    <Label className="text-sm">First Close %</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="10"
                        max="100"
                        value={fund.firstClosePercent ?? 50}
                        onChange={(e) => updateFund(fund.id, { firstClosePercent: parseInt(e.target.value) || 50 })}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Capital raised at first close
                    </p>
                  </div>

                  {/* Final Close Timing */}
                  <div className="space-y-2">
                    <Label className="text-sm">Final Close</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="36"
                        value={fund.finalCloseMonth ?? 12}
                        onChange={(e) => updateFund(fund.id, { finalCloseMonth: parseInt(e.target.value) || 12 })}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">months</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Months after first close
                    </p>
                  </div>

                  {/* Investment Period */}
                  <div className="space-y-2">
                    <Label className="text-sm">Investment Period</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="2"
                        max="10"
                        value={fund.investmentPeriod ?? 5}
                        onChange={(e) => updateFund(fund.id, { investmentPeriod: parseInt(e.target.value) || 5 })}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                  </div>

                  {/* Fund Life */}
                  <div className="space-y-2">
                    <Label className="text-sm">Fund Life</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="5"
                        max="15"
                        value={fund.fundLife ?? 10}
                        onChange={(e) => updateFund(fund.id, { fundLife: parseInt(e.target.value) || 10 })}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                  </div>
                </div>

                {/* Carry Projections */}
                <div className="p-3 rounded-lg bg-muted/50 border mt-3">
                  <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Carry Projections (Optional)
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Target Return</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={fund.targetReturn ?? ''}
                          placeholder="2.0"
                          onChange={(e) => updateFund(fund.id, {
                            targetReturn: e.target.value ? parseFloat(e.target.value) : undefined
                          })}
                          className="w-16 h-8"
                        />
                        <span className="text-xs text-muted-foreground">x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Carry Rate</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          value={fund.carryRate ?? 20}
                          onChange={(e) => updateFund(fund.id, { carryRate: parseInt(e.target.value) || 20 })}
                          className="w-16 h-8"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Preferred Return</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="15"
                          value={fund.preferredReturn ?? 8}
                          onChange={(e) => updateFund(fund.id, { preferredReturn: parseInt(e.target.value) || 8 })}
                          className="w-16 h-8"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Set a target return to see estimated carry projections
                  </p>
                </div>
              </div>
            ))}

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                These settings enable more realistic modeling. &quot;Committed&quot; basis charges fees on total commitments immediately.
                &quot;Invested&quot; basis only charges fees on deployed capital, which ramps up over the investment period.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
