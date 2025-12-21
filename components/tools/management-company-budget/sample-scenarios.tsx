"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Library,
  User,
  Users,
  Building2,
  Rocket,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Check,
  Info
} from 'lucide-react'
import { BudgetData, normalizeBudgetData } from './types'
import { calculateBudget, formatCurrency, formatRunway } from './budget-calculator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'

// Partial types for scenario data without required IDs
interface PartialFund {
  name: string
  size: number
  feeRate: number
  firstCloseYear: number
  feeStartMonth?: number
  firstCloseAmount?: number
}

interface PartialTeamMember {
  role: string
  monthlyCost: number
  isPartner?: boolean
}

interface PartialExpenseItem {
  name: string
  monthlyCost: number
  isRecurring?: boolean
  category?: string
}

interface ScenarioData {
  startingCash: number
  funds: PartialFund[]
  expenses: {
    team: PartialTeamMember[]
    operations: PartialExpenseItem[]
    overhead: PartialExpenseItem[]
  }
}

interface ScenarioTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: 'size' | 'strategy' | 'stage'
  data: ScenarioData
  highlights: string[]
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'solo-gp-emerging',
    name: 'Solo GP Emerging Manager',
    description: 'First-time fund manager operating lean with minimal overhead. Focus on proof of concept.',
    icon: User,
    category: 'size',
    data: {
      startingCash: 200000,
      funds: [{
        name: 'Fund I',
        size: 25,
        feeRate: 2.5,
        firstCloseYear: new Date().getFullYear(),
        feeStartMonth: 12,
        firstCloseAmount: 10
      }],
      expenses: {
        team: [
          { role: 'Managing Partner', monthlyCost: 15000, isPartner: true }
        ],
        operations: [
          { name: 'Fund Admin', monthlyCost: 2000, isRecurring: true, category: 'administration' },
          { name: 'Legal Retainer', monthlyCost: 1500, isRecurring: true, category: 'legal' },
          { name: 'Accounting', monthlyCost: 1000, isRecurring: true, category: 'administration' }
        ],
        overhead: [
          { name: 'Co-working Space', monthlyCost: 500, isRecurring: true, category: 'office' },
          { name: 'Software & Tools', monthlyCost: 300, isRecurring: true, category: 'technology' },
          { name: 'Travel', monthlyCost: 1000, isRecurring: true, category: 'travel' }
        ]
      }
    },
    highlights: [
      'Minimal team to maximize runway',
      'Higher fee rate typical for emerging managers',
      'Low overhead with flexible workspace'
    ]
  },
  {
    id: 'two-partner-seed',
    name: 'Two-Partner Seed Fund',
    description: 'Partnership model with complementary skills. Balanced approach to costs and growth.',
    icon: Users,
    category: 'size',
    data: {
      startingCash: 400000,
      funds: [{
        name: 'Fund I',
        size: 50,
        feeRate: 2.0,
        firstCloseYear: new Date().getFullYear(),
        feeStartMonth: 10,
        firstCloseAmount: 20
      }],
      expenses: {
        team: [
          { role: 'Managing Partner 1', monthlyCost: 18000, isPartner: true },
          { role: 'Managing Partner 2', monthlyCost: 18000, isPartner: true },
          { role: 'Executive Assistant', monthlyCost: 5000, isPartner: false }
        ],
        operations: [
          { name: 'Fund Administrator', monthlyCost: 3500, isRecurring: true, category: 'administration' },
          { name: 'Legal', monthlyCost: 2500, isRecurring: true, category: 'legal' },
          { name: 'Accounting/Tax', monthlyCost: 2000, isRecurring: true, category: 'administration' },
          { name: 'Audit Reserve', monthlyCost: 1500, isRecurring: true, category: 'administration' }
        ],
        overhead: [
          { name: 'Office Space', monthlyCost: 3000, isRecurring: true, category: 'office' },
          { name: 'Technology', monthlyCost: 500, isRecurring: true, category: 'technology' },
          { name: 'Travel & Events', monthlyCost: 2500, isRecurring: true, category: 'travel' },
          { name: 'Insurance', monthlyCost: 500, isRecurring: true, category: 'insurance' }
        ]
      }
    },
    highlights: [
      'Shared leadership reduces key-person risk',
      'Operational support for scalability',
      'Market-rate 2% fee structure'
    ]
  },
  {
    id: 'institutional-series-a',
    name: 'Institutional Series A Fund',
    description: 'Larger fund with full team and institutional-grade operations. Positioned for LP due diligence.',
    icon: Building2,
    category: 'size',
    data: {
      startingCash: 1000000,
      funds: [{
        name: 'Fund I',
        size: 150,
        feeRate: 2.0,
        firstCloseYear: new Date().getFullYear(),
        feeStartMonth: 8,
        firstCloseAmount: 75
      }],
      expenses: {
        team: [
          { role: 'Managing Partner', monthlyCost: 30000, isPartner: true },
          { role: 'General Partner', monthlyCost: 25000, isPartner: true },
          { role: 'Principal', monthlyCost: 18000, isPartner: false },
          { role: 'Associate', monthlyCost: 10000, isPartner: false },
          { role: 'Operations Manager', monthlyCost: 8000, isPartner: false }
        ],
        operations: [
          { name: 'Fund Administrator', monthlyCost: 6000, isRecurring: true, category: 'administration' },
          { name: 'Legal Counsel', monthlyCost: 5000, isRecurring: true, category: 'legal' },
          { name: 'Accounting & Tax', monthlyCost: 4000, isRecurring: true, category: 'administration' },
          { name: 'Annual Audit', monthlyCost: 3000, isRecurring: true, category: 'administration' },
          { name: 'Compliance', monthlyCost: 2000, isRecurring: true, category: 'legal' }
        ],
        overhead: [
          { name: 'Office Lease', monthlyCost: 8000, isRecurring: true, category: 'office' },
          { name: 'Technology & Data', monthlyCost: 2000, isRecurring: true, category: 'technology' },
          { name: 'Travel & LP Relations', monthlyCost: 5000, isRecurring: true, category: 'travel' },
          { name: 'D&O Insurance', monthlyCost: 1500, isRecurring: true, category: 'insurance' },
          { name: 'Marketing & Events', monthlyCost: 2000, isRecurring: true, category: 'marketing' }
        ]
      }
    },
    highlights: [
      'Full investment team with career path',
      'Robust operations for LP confidence',
      'Higher starting capital for longer runway'
    ]
  },
  {
    id: 'deep-tech-specialized',
    name: 'Deep Tech Specialist',
    description: 'Specialized fund requiring technical expertise and longer deal timelines.',
    icon: Rocket,
    category: 'strategy',
    data: {
      startingCash: 600000,
      funds: [{
        name: 'Deep Tech Fund I',
        size: 75,
        feeRate: 2.5,
        firstCloseYear: new Date().getFullYear(),
        feeStartMonth: 14,
        firstCloseAmount: 30
      }],
      expenses: {
        team: [
          { role: 'Managing Partner (Technical)', monthlyCost: 25000, isPartner: true },
          { role: 'Partner (Business)', monthlyCost: 22000, isPartner: true },
          { role: 'Technical Advisor (PT)', monthlyCost: 5000, isPartner: false }
        ],
        operations: [
          { name: 'Fund Administrator', monthlyCost: 4000, isRecurring: true, category: 'administration' },
          { name: 'Patent/IP Legal', monthlyCost: 3000, isRecurring: true, category: 'legal' },
          { name: 'General Legal', monthlyCost: 2000, isRecurring: true, category: 'legal' },
          { name: 'Accounting', monthlyCost: 2000, isRecurring: true, category: 'administration' }
        ],
        overhead: [
          { name: 'Office/Lab Access', monthlyCost: 2500, isRecurring: true, category: 'office' },
          { name: 'Technical Databases', monthlyCost: 1500, isRecurring: true, category: 'technology' },
          { name: 'Conference Travel', monthlyCost: 3000, isRecurring: true, category: 'travel' },
          { name: 'Research Tools', monthlyCost: 1000, isRecurring: true, category: 'technology' }
        ]
      }
    },
    highlights: [
      'Higher fees justified by specialized expertise',
      'Longer fundraise timeline expected',
      'Technical advisory for diligence'
    ]
  },
  {
    id: 'growth-stage',
    name: 'Growth Equity Fund',
    description: 'Later-stage fund with larger check sizes and focus on operational value-add.',
    icon: TrendingUp,
    category: 'stage',
    data: {
      startingCash: 2000000,
      funds: [{
        name: 'Growth Fund I',
        size: 300,
        feeRate: 1.75,
        firstCloseYear: new Date().getFullYear(),
        feeStartMonth: 6,
        firstCloseAmount: 150
      }],
      expenses: {
        team: [
          { role: 'Managing Partner', monthlyCost: 40000, isPartner: true },
          { role: 'Partner', monthlyCost: 35000, isPartner: true },
          { role: 'Partner', monthlyCost: 35000, isPartner: true },
          { role: 'VP', monthlyCost: 20000, isPartner: false },
          { role: 'Associate', monthlyCost: 12000, isPartner: false },
          { role: 'Associate', monthlyCost: 12000, isPartner: false },
          { role: 'CFO/Controller', monthlyCost: 15000, isPartner: false },
          { role: 'IR Manager', monthlyCost: 10000, isPartner: false }
        ],
        operations: [
          { name: 'Fund Administrator', monthlyCost: 10000, isRecurring: true, category: 'administration' },
          { name: 'Legal Counsel', monthlyCost: 8000, isRecurring: true, category: 'legal' },
          { name: 'External Accounting', monthlyCost: 5000, isRecurring: true, category: 'administration' },
          { name: 'Annual Audit', monthlyCost: 5000, isRecurring: true, category: 'administration' },
          { name: 'Compliance & Reg', monthlyCost: 3000, isRecurring: true, category: 'legal' }
        ],
        overhead: [
          { name: 'Class A Office', monthlyCost: 15000, isRecurring: true, category: 'office' },
          { name: 'Technology Stack', monthlyCost: 4000, isRecurring: true, category: 'technology' },
          { name: 'LP Relations & Travel', monthlyCost: 8000, isRecurring: true, category: 'travel' },
          { name: 'D&O/E&O Insurance', monthlyCost: 3000, isRecurring: true, category: 'insurance' },
          { name: 'Annual Meeting', monthlyCost: 2000, isRecurring: true, category: 'marketing' }
        ]
      }
    },
    highlights: [
      'Lower fee rate on larger base',
      'Internal CFO for complex reporting',
      'Dedicated IR for LP management'
    ]
  },
  {
    id: 'lean-bootstrap',
    name: 'Bootstrap Mode',
    description: 'Absolute minimum viable setup for testing fund concept before full launch.',
    icon: Clock,
    category: 'strategy',
    data: {
      startingCash: 100000,
      funds: [{
        name: 'Scout Fund',
        size: 10,
        feeRate: 2.5,
        firstCloseYear: new Date().getFullYear(),
        feeStartMonth: 6,
        firstCloseAmount: 5
      }],
      expenses: {
        team: [
          { role: 'Fund Manager', monthlyCost: 8000, isPartner: true }
        ],
        operations: [
          { name: 'Minimal Admin', monthlyCost: 1000, isRecurring: true, category: 'administration' },
          { name: 'Legal (Limited)', monthlyCost: 500, isRecurring: true, category: 'legal' }
        ],
        overhead: [
          { name: 'Home Office', monthlyCost: 200, isRecurring: true, category: 'office' },
          { name: 'Basic Tools', monthlyCost: 100, isRecurring: true, category: 'technology' }
        ]
      }
    },
    highlights: [
      'Proof of concept before scaling',
      'Personal financial sacrifice period',
      'Quick path to first close'
    ]
  }
]

interface SampleScenariosProps {
  onApply: (data: BudgetData) => void
  className?: string
}

export function SampleScenarios({ onApply, className }: SampleScenariosProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleApply = (scenario: ScenarioTemplate) => {
    onApply(normalizeBudgetData(scenario.data))
    setDialogOpen(false)
  }

  const getCategoryLabel = (category: ScenarioTemplate['category']) => {
    switch (category) {
      case 'size': return 'By Fund Size'
      case 'strategy': return 'By Strategy'
      case 'stage': return 'By Stage'
    }
  }

  const groupedScenarios = SCENARIO_TEMPLATES.reduce((acc, scenario) => {
    const cat = scenario.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(scenario)
    return acc
  }, {} as Record<string, ScenarioTemplate[]>)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Library className="h-5 w-5" />
          Sample Scenarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Load a pre-built scenario as a starting point for your budget planning.
        </p>

        <div className="grid gap-3">
          {SCENARIO_TEMPLATES.slice(0, 4).map((scenario) => {
            const Icon = scenario.icon
            const results = calculateBudget(normalizeBudgetData(scenario.data))

            return (
              <Dialog key={scenario.id} open={dialogOpen && selectedScenario?.id === scenario.id} onOpenChange={(open) => {
                setDialogOpen(open)
                if (!open) setSelectedScenario(null)
              }}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedScenario(scenario)}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-colors",
                      "hover:bg-muted/50 hover:border-primary/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{scenario.name}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {scenario.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${scenario.data.funds[0].size}M
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRunway(results.runwayMonths)} runway
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {scenario.name}
                    </DialogTitle>
                    <DialogDescription>{scenario.description}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Key metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground">Fund Size</div>
                        <div className="font-bold">${scenario.data.funds[0].size}M</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground">Monthly Burn</div>
                        <div className="font-bold">{formatCurrency(results.monthlyBurn, true)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground">Runway</div>
                        <div className="font-bold">{formatRunway(results.runwayMonths)}</div>
                      </div>
                    </div>

                    {/* Team summary */}
                    <div>
                      <div className="text-sm font-medium mb-2">Team Structure</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {scenario.data.expenses.team.map((member, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{member.role}</span>
                            <span className="font-mono">{formatCurrency(member.monthlyCost, true)}/mo</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div>
                      <div className="text-sm font-medium mb-2">Key Highlights</div>
                      <ul className="space-y-1">
                        {scenario.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button onClick={() => handleApply(scenario)} className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Load This Scenario
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      This will replace your current budget data. You can always undo or modify afterward.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )
          })}
        </div>

        {/* View all link */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              View All Scenarios ({SCENARIO_TEMPLATES.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sample Scenario Library</DialogTitle>
              <DialogDescription>
                Pre-built budget templates for different fund types and stages
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {Object.entries(groupedScenarios).map(([category, scenarios]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium mb-3">{getCategoryLabel(category as ScenarioTemplate['category'])}</h3>
                  <div className="grid gap-2">
                    {scenarios.map((scenario) => {
                      const Icon = scenario.icon
                      const results = calculateBudget(normalizeBudgetData(scenario.data))

                      return (
                        <button
                          key={scenario.id}
                          onClick={() => {
                            handleApply(scenario)
                          }}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-colors",
                            "hover:bg-muted/50 hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{scenario.name}</div>
                              <div className="text-xs text-muted-foreground">{scenario.description}</div>
                            </div>
                            <div className="text-right text-xs">
                              <div>${scenario.data.funds[0].size}M fund</div>
                              <div className="text-muted-foreground">{formatRunway(results.runwayMonths)} runway</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
