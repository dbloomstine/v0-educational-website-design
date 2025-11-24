"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExportButtons } from './export-buttons'
import { Tool } from '@/lib/content/types'
import { AlertCircle, Calculator } from 'lucide-react'
import { FundFormationTimeline } from './fund-formation-timeline/fund-formation-timeline'
import { ManagementFeeCalculator } from './management-fee-calculator/management-fee-calculator'
import { ManagementCompanyBudget } from './management-company-budget/management-company-budget'
import { SideLetterObligations } from './side-letter-obligations/side-letter-obligations'
import { FundExpenseAllocation } from './fund-expense-allocation/fund-expense-allocation'

interface ToolPlaceholderProps {
  tool: Tool
}

// Category color mapping
const categoryColors: Record<string, string> = {
  'Fund Formation': 'oklch(0.65 0.19 275)', // Purple
  'Pricing and Costs': 'oklch(0.55 0.15 150)', // Teal
  'Fund Economics': 'oklch(0.65 0.22 230)', // Blue
  'Operations and Compliance': 'oklch(0.68 0.19 35)' // Orange
}

export function ToolPlaceholder({ tool }: ToolPlaceholderProps) {
  const primaryCategory = tool.categories[0]
  const categoryColor = categoryColors[primaryCategory] || 'oklch(0.6 0.16 210)'

  // If this is the Fund Formation Timeline tool, render the actual calculator
  if (tool.slug === 'fund-formation-timeline') {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <FundFormationTimeline />
          </div>
        </div>
      </div>
    )
  }

  // If this is the Management Fee Calculator tool, render the actual calculator
  if (tool.slug === 'management-fee-calculator') {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <ManagementFeeCalculator />
          </div>
        </div>
      </div>
    )
  }

  // If this is the Management Company Budget tool, render the actual planner
  if (tool.slug === 'management-company-budget') {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <ManagementCompanyBudget />
          </div>
        </div>
      </div>
    )
  }

  // If this is the Side Letter Obligations tool, render the actual tool
  if (tool.slug === 'side-letter-obligations') {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <SideLetterObligations />
          </div>
        </div>
      </div>
    )
  }

  // If this is the Fund Expense Allocation tool, render the actual tool
  if (tool.slug === 'fund-expense-allocation') {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <FundExpenseAllocation />
          </div>
        </div>
      </div>
    )
  }

  // Otherwise render the placeholder
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Tool Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {tool.categories.map((category) => (
                <span
                  key={category}
                  className="text-xs font-medium uppercase tracking-wider px-3 py-1 rounded"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${categoryColors[category]} 15%, transparent)`,
                    color: categoryColors[category]
                  }}
                >
                  {category}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight">{tool.title}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {tool.shortDescription}
            </p>
          </div>

          {/* Coming Soon Notice */}
          {tool.status === 'coming-soon' && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="flex items-start gap-4 pt-6">
                <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    This tool is currently under development. Want early access or have specific requirements?
                  </p>
                  <Button asChild size="sm">
                    <a href="/contact">Request Early Access</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tool Overview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inputs Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Required Inputs</CardTitle>
                <CardDescription>Information needed to run this calculator</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tool.inputs.map((input, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{input}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Outputs Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Outputs & Results</CardTitle>
                <CardDescription>What this calculator provides</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tool.outputs.map((output, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{output}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Calculator Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculator Interface
              </CardTitle>
              <CardDescription>
                The interactive calculator will appear here once implemented
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Form Placeholder */}
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">Calculator Coming Soon</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  This tool is currently under development. The input form and calculation
                  engine will be implemented here.
                </p>
              </div>

              {/* Export Options */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Export Results</h4>
                    <p className="text-sm text-muted-foreground">
                      Save your calculations in multiple formats
                    </p>
                  </div>
                  <ExportButtons disabled={true} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-accent/20 border-accent">
            <CardContent className="pt-6">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-3">
                  Need Help with {tool.title.replace(/Calculator|Estimator|Tool|Helper|Planner|Visualizer|Generator/i, '').trim()}?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Want to discuss your specific use case or get a customized version of this tool?
                  Let's chat about your needs.
                </p>
                <Button asChild size="lg">
                  <a href="/contact">Schedule a Conversation</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
