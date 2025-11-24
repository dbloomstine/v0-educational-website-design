"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'
import { sampleScenarios, expenseCategories, fundTypes, type ClassificationInput } from './expenseData'

interface SampleScenariosSectionProps {
  onLoadSample: (input: ClassificationInput) => void
}

export function SampleScenariosSection({ onLoadSample }: SampleScenariosSectionProps) {
  const getSampleName = (input: ClassificationInput): string => {
    const category = expenseCategories.find(cat => cat.id === input.expenseCategory)
    return category?.name || 'Sample Scenario'
  }

  const getSampleDescription = (input: ClassificationInput): string => {
    const fundTypeName = fundTypes[input.fundType]?.name || input.fundType.toUpperCase()
    const stage = input.fundStage.replace('-', ' ')
    return `${fundTypeName} • ${stage}`
  }

  return (
    <Card className="bg-accent/20 border-accent">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <CardTitle className="text-lg">Try a Sample Scenario</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Not sure where to start? Load one of these common expense scenarios to see how the tool works.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sampleScenarios.map((scenario, idx) => (
            <Button
              key={idx}
              onClick={() => onLoadSample(scenario)}
              variant="outline"
              className="h-auto py-3 px-4 text-left justify-start hover:bg-accent hover:border-primary transition-all"
            >
              <div>
                <div className="font-medium text-sm">{getSampleName(scenario)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getSampleDescription(scenario)}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
