"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import {
  expenseCategories,
  fundTypes,
  fundStages,
  beneficiaries,
  type ClassificationInput,
  type FundType,
  type FundStage,
  type Beneficiary
} from './expenseData'

interface ExpenseInputFormProps {
  onClassify: (input: ClassificationInput) => void
  initialValues?: ClassificationInput
}

export function ExpenseInputForm({ onClassify, initialValues }: ExpenseInputFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialValues?.expenseCategory || '')
  const [customDescription, setCustomDescription] = useState(initialValues?.customDescription || '')
  const [fundType, setFundType] = useState<FundType>(initialValues?.fundType || 'pe')
  const [fundStage, setFundStage] = useState<FundStage>(initialValues?.fundStage || 'post-close')
  const [beneficiary, setBeneficiary] = useState<Beneficiary>(initialValues?.primaryBeneficiary || 'fund')
  const [lpaContext, setLpaContext] = useState(initialValues?.lpaContext || '')
  const [inputMode, setInputMode] = useState<'category' | 'custom'>('category')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const input: ClassificationInput = {
      expenseCategory: inputMode === 'custom' ? 'custom' : selectedCategory,
      customDescription: inputMode === 'custom' ? customDescription : undefined,
      fundType,
      fundStage,
      primaryBeneficiary: beneficiary,
      lpaContext: lpaContext.trim() || undefined
    }

    onClassify(input)
  }

  const isFormValid = inputMode === 'custom' ? customDescription.trim().length > 0 : selectedCategory !== ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card id="input-form">
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Describe the Expense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={inputMode} onValueChange={(value) => setInputMode(value as 'category' | 'custom')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="category" id="category" />
              <Label htmlFor="category" className="font-normal">Choose from categories</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="font-normal">Describe custom expense</Label>
            </div>
          </RadioGroup>

          {inputMode === 'category' ? (
            <div className="space-y-2">
              <Label htmlFor="expense-category">Expense Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select an expense category..." />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-sm text-muted-foreground">
                  {expenseCategories.find(c => c.id === selectedCategory)?.description}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="custom-description">Describe Your Expense</Label>
              <Textarea
                id="custom-description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="E.g., 'Legal fees for negotiating a credit facility' or 'Cost of attending an industry conference'"
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 2: Provide Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fund-type">Fund Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The investment strategy of your fund affects how certain expenses are typically treated</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={fundType} onValueChange={(value) => setFundType(value as FundType)}>
              <SelectTrigger id="fund-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fundTypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {fundTypes[fundType].description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fund-stage">Fund Stage</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Where your fund is in its lifecycle can affect expense treatment, especially for formation and fundraising costs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={fundStage} onValueChange={(value) => setFundStage(value as FundStage)}>
              <SelectTrigger id="fund-stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fundStages).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {fundStages[fundStage].description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="beneficiary">Primary Beneficiary</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Who primarily benefits from this expense? This is often the key factor in determining proper allocation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={beneficiary} onValueChange={(value) => setBeneficiary(value as Beneficiary)}>
              <SelectTrigger id="beneficiary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(beneficiaries).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {beneficiaries[beneficiary].description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="lpa-context">LPA Context (Optional)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>If your LPA has specific language about this type of expense, note it here for reference</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="lpa-context"
              value={lpaContext}
              onChange={(e) => setLpaContext(e.target.value)}
              placeholder="E.g., 'Our LPA caps organization costs at 0.5% of commitments' or 'Side letter requires LPAC approval for broken deal costs over $100k'"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={!isFormValid} className="w-full" size="lg">
        Get Classification Guidance
      </Button>
    </form>
  )
}
