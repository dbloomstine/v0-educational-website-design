"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Calculator,
  Calendar,
  DollarSign,
  BarChart3,
  Info,
  FileText
} from 'lucide-react'

interface MethodologyDisclosureProps {
  className?: string
}

export function MethodologyDisclosure({ className }: MethodologyDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const sections = [
    {
      title: 'Management Fee Calculation',
      icon: DollarSign,
      content: `Management fees are calculated as a percentage of committed capital.

**Formula:** Annual Fee = Fund Size × Fee Rate

**Assumptions:**
- Fees begin at first close (default: current year)
- Fees are calculated on committed capital, not invested capital (unless configured otherwise)
- Fees are charged monthly (annual fee ÷ 12)
- No fee stepdown is modeled by default (some LPAs reduce fees after investment period)`
    },
    {
      title: 'Runway Calculation',
      icon: Calendar,
      content: `Runway represents months of operations before cash is depleted (without fee revenue).

**Formula:** Runway Months = Starting Cash ÷ Monthly Burn Rate

**Assumptions:**
- Runway assumes no management fee revenue during the pre-close period
- Monthly expenses remain constant (no inflation adjustment in runway calc)
- No additional capital contributions during runway period`
    },
    {
      title: 'Break-Even Analysis',
      icon: BarChart3,
      content: `Break-even month is when cumulative revenue equals cumulative expenses.

**What it measures:** The point where management fee revenue has fully offset the initial cash outlay and operating losses.

**Note:** This differs from monthly break-even (when monthly fees exceed monthly costs).`
    },
    {
      title: 'Expense Projections',
      icon: Calculator,
      content: `Expenses are projected over a 5-year period by default.

**Inflation Adjustment:** Configurable rate (default 3% annually) applied to all expenses.

**Expense Categories:**
- **Team:** Fully-loaded compensation (salary + bonus + benefits + payroll taxes)
- **Operations:** Fund administration, audit, legal, compliance, tax
- **Overhead:** Office, insurance, technology, travel

**Industry Benchmarks:** Expense ranges are based on industry surveys and fund formation experience.`
    }
  ]

  const sources = [
    {
      name: 'ILPA Fee Reporting Template',
      url: 'https://ilpa.org',
      description: 'Industry standard for fee reporting and disclosure'
    },
    {
      name: 'Cambridge Associates',
      url: 'https://cambridgeassociates.com',
      description: 'Private equity benchmarking data'
    },
    {
      name: 'Preqin',
      url: 'https://preqin.com',
      description: 'Alternative assets industry data'
    },
    {
      name: 'NVCA Yearbook',
      url: 'https://nvca.org',
      description: 'Venture capital industry statistics'
    }
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Methodology & Assumptions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                View Details
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              This tool models management company economics using industry-standard calculations
              and benchmarks from ILPA, Cambridge Associates, and Preqin.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <Info className="h-3.5 w-3.5" />
              <span>Click &quot;View Details&quot; to see full methodology and data sources</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Calculation Methodology */}
            <div className="space-y-4">
              {sections.map((section, idx) => {
                const Icon = section.icon
                return (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium text-sm">{section.title}</h4>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Key Assumptions */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-amber-600" />
                Key Assumptions & Limitations
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Projections are estimates only and actual results will vary</li>
                <li>Fee structures vary by LPA; this models a simplified standard structure</li>
                <li>No modeling of fee offsets, rebates, or carried interest clawbacks</li>
                <li>Expense ranges are general guidelines; actual costs depend on jurisdiction and strategy</li>
                <li>Does not account for fund-level expenses charged to LPs</li>
                <li>Tax implications are not modeled</li>
              </ul>
            </div>

            {/* Data Sources */}
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Industry Data Sources
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/30 rounded-lg border text-sm"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Methodology last reviewed: December 2025 | Based on 2024-2025 industry data
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
