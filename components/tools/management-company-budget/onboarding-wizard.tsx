"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  DollarSign,
  Sparkles,
  Check,
  Briefcase,
  TrendingUp,
  Calculator
} from 'lucide-react'
import { BudgetData, TeamMember, ExpenseItem } from './types'
import { formatCurrency } from './budget-calculator'

// Fund strategy options with typical benchmarks
const FUND_STRATEGIES = [
  {
    id: 'vc',
    name: 'Venture Capital',
    icon: TrendingUp,
    description: 'Early to growth stage equity',
    typicalSize: { min: 25, max: 150, default: 50 },
    typicalFee: 2.0,
    typicalTeam: ['Managing Partner', 'Partner', 'Associate'],
    teamCostMultiplier: 1.0
  },
  {
    id: 'pe',
    name: 'Private Equity',
    icon: Building2,
    description: 'Buyouts and control investments',
    typicalSize: { min: 100, max: 500, default: 150 },
    typicalFee: 2.0,
    typicalTeam: ['Managing Partner', 'Partner', 'VP', 'Associate', 'Analyst'],
    teamCostMultiplier: 1.15
  },
  {
    id: 'credit',
    name: 'Private Credit',
    icon: DollarSign,
    description: 'Direct lending and structured credit',
    typicalSize: { min: 100, max: 500, default: 200 },
    typicalFee: 1.5,
    typicalTeam: ['Managing Partner', 'Partner', 'Credit Analyst'],
    teamCostMultiplier: 1.1
  },
  {
    id: 'hedge',
    name: 'Hedge Fund',
    icon: Calculator,
    description: 'Liquid strategies and trading',
    typicalSize: { min: 50, max: 500, default: 100 },
    typicalFee: 2.0,
    typicalTeam: ['Portfolio Manager', 'Analyst', 'Trader'],
    teamCostMultiplier: 1.3
  },
  {
    id: 're',
    name: 'Real Estate',
    icon: Building2,
    description: 'Property and real assets',
    typicalSize: { min: 75, max: 300, default: 100 },
    typicalFee: 1.5,
    typicalTeam: ['Managing Partner', 'Partner', 'Acquisitions', 'Asset Manager'],
    teamCostMultiplier: 1.0
  },
  {
    id: 'infra',
    name: 'Infrastructure',
    icon: Briefcase,
    description: 'Infrastructure and essential services',
    typicalSize: { min: 200, max: 1000, default: 300 },
    typicalFee: 1.5,
    typicalTeam: ['Managing Partner', 'Partner', 'Director', 'Associate'],
    teamCostMultiplier: 1.1
  }
]

// Fund size tiers with associated benchmarks
const SIZE_TIERS = [
  {
    id: 'emerging',
    name: 'Emerging Manager',
    range: '$25M - $100M',
    description: 'First or second fund, lean team',
    teamSize: { min: 2, max: 4 },
    totalBudget: { min: 400000, max: 800000 },
    teamPercent: 65
  },
  {
    id: 'established',
    name: 'Established Manager',
    range: '$100M - $300M',
    description: 'Fund II-III, building infrastructure',
    teamSize: { min: 4, max: 8 },
    totalBudget: { min: 800000, max: 1500000 },
    teamPercent: 60
  },
  {
    id: 'institutional',
    name: 'Institutional Scale',
    range: '$300M+',
    description: 'Mature platform with full team',
    teamSize: { min: 8, max: 15 },
    totalBudget: { min: 1500000, max: 3000000 },
    teamPercent: 55
  }
]

// Team templates by strategy and size
const TEAM_TEMPLATES: Record<string, Record<string, TeamMember[]>> = {
  vc: {
    emerging: [
      { id: '1', role: 'Managing Partner', monthlyCost: 20000 },
      { id: '2', role: 'Associate', monthlyCost: 8000 },
    ],
    established: [
      { id: '1', role: 'Managing Partner', monthlyCost: 25000 },
      { id: '2', role: 'Partner', monthlyCost: 20000 },
      { id: '3', role: 'Associate', monthlyCost: 10000 },
      { id: '4', role: 'Analyst', monthlyCost: 6000 },
    ],
    institutional: [
      { id: '1', role: 'Managing Partner', monthlyCost: 35000 },
      { id: '2', role: 'Partner', monthlyCost: 25000 },
      { id: '3', role: 'Partner', monthlyCost: 22000 },
      { id: '4', role: 'Principal', monthlyCost: 15000 },
      { id: '5', role: 'Associate', monthlyCost: 10000 },
      { id: '6', role: 'Associate', monthlyCost: 10000 },
      { id: '7', role: 'CFO', monthlyCost: 20000 },
    ],
  },
  pe: {
    emerging: [
      { id: '1', role: 'Managing Partner', monthlyCost: 25000 },
      { id: '2', role: 'VP', monthlyCost: 15000 },
      { id: '3', role: 'Associate', monthlyCost: 10000 },
    ],
    established: [
      { id: '1', role: 'Managing Partner', monthlyCost: 30000 },
      { id: '2', role: 'Partner', monthlyCost: 25000 },
      { id: '3', role: 'VP', monthlyCost: 18000 },
      { id: '4', role: 'Associate', monthlyCost: 12000 },
      { id: '5', role: 'Analyst', monthlyCost: 7000 },
    ],
    institutional: [
      { id: '1', role: 'Managing Partner', monthlyCost: 40000 },
      { id: '2', role: 'Partner', monthlyCost: 30000 },
      { id: '3', role: 'Partner', monthlyCost: 28000 },
      { id: '4', role: 'Principal', monthlyCost: 20000 },
      { id: '5', role: 'VP', monthlyCost: 18000 },
      { id: '6', role: 'Associate', monthlyCost: 12000 },
      { id: '7', role: 'Associate', monthlyCost: 12000 },
      { id: '8', role: 'CFO', monthlyCost: 22000 },
    ],
  },
  credit: {
    emerging: [
      { id: '1', role: 'Managing Partner', monthlyCost: 22000 },
      { id: '2', role: 'Credit Analyst', monthlyCost: 12000 },
    ],
    established: [
      { id: '1', role: 'Managing Partner', monthlyCost: 28000 },
      { id: '2', role: 'Partner', monthlyCost: 22000 },
      { id: '3', role: 'Credit Analyst', monthlyCost: 14000 },
      { id: '4', role: 'Portfolio Analyst', monthlyCost: 10000 },
    ],
    institutional: [
      { id: '1', role: 'Managing Partner', monthlyCost: 35000 },
      { id: '2', role: 'Partner', monthlyCost: 28000 },
      { id: '3', role: 'Director', monthlyCost: 22000 },
      { id: '4', role: 'Senior Analyst', monthlyCost: 16000 },
      { id: '5', role: 'Credit Analyst', monthlyCost: 14000 },
      { id: '6', role: 'CFO', monthlyCost: 20000 },
    ],
  },
  hedge: {
    emerging: [
      { id: '1', role: 'Portfolio Manager', monthlyCost: 30000 },
      { id: '2', role: 'Analyst', monthlyCost: 12000 },
    ],
    established: [
      { id: '1', role: 'Portfolio Manager', monthlyCost: 40000 },
      { id: '2', role: 'Senior Analyst', monthlyCost: 18000 },
      { id: '3', role: 'Analyst', monthlyCost: 14000 },
      { id: '4', role: 'Trader', monthlyCost: 15000 },
    ],
    institutional: [
      { id: '1', role: 'CIO', monthlyCost: 50000 },
      { id: '2', role: 'Portfolio Manager', monthlyCost: 40000 },
      { id: '3', role: 'Senior Analyst', monthlyCost: 22000 },
      { id: '4', role: 'Analyst', monthlyCost: 16000 },
      { id: '5', role: 'Analyst', monthlyCost: 16000 },
      { id: '6', role: 'Trader', monthlyCost: 18000 },
      { id: '7', role: 'COO/CFO', monthlyCost: 25000 },
    ],
  },
  re: {
    emerging: [
      { id: '1', role: 'Managing Partner', monthlyCost: 22000 },
      { id: '2', role: 'Acquisitions', monthlyCost: 12000 },
    ],
    established: [
      { id: '1', role: 'Managing Partner', monthlyCost: 28000 },
      { id: '2', role: 'Partner', monthlyCost: 22000 },
      { id: '3', role: 'Acquisitions Director', monthlyCost: 15000 },
      { id: '4', role: 'Asset Manager', monthlyCost: 12000 },
    ],
    institutional: [
      { id: '1', role: 'Managing Partner', monthlyCost: 35000 },
      { id: '2', role: 'Partner', monthlyCost: 28000 },
      { id: '3', role: 'Acquisitions Director', monthlyCost: 18000 },
      { id: '4', role: 'Asset Manager', monthlyCost: 15000 },
      { id: '5', role: 'Analyst', monthlyCost: 10000 },
      { id: '6', role: 'CFO', monthlyCost: 20000 },
    ],
  },
  infra: {
    emerging: [
      { id: '1', role: 'Managing Partner', monthlyCost: 25000 },
      { id: '2', role: 'Director', monthlyCost: 18000 },
    ],
    established: [
      { id: '1', role: 'Managing Partner', monthlyCost: 32000 },
      { id: '2', role: 'Partner', monthlyCost: 25000 },
      { id: '3', role: 'Director', monthlyCost: 20000 },
      { id: '4', role: 'Associate', monthlyCost: 12000 },
    ],
    institutional: [
      { id: '1', role: 'Managing Partner', monthlyCost: 40000 },
      { id: '2', role: 'Partner', monthlyCost: 30000 },
      { id: '3', role: 'Partner', monthlyCost: 28000 },
      { id: '4', role: 'Director', monthlyCost: 22000 },
      { id: '5', role: 'Associate', monthlyCost: 14000 },
      { id: '6', role: 'Associate', monthlyCost: 14000 },
      { id: '7', role: 'CFO', monthlyCost: 22000 },
    ],
  },
}

// Operations expense templates by size tier
const OPERATIONS_TEMPLATES: Record<string, ExpenseItem[]> = {
  emerging: [
    { id: '1', name: 'Fund Administration', monthlyCost: 5000 },
    { id: '2', name: 'Audit', monthlyCost: 3500 },
    { id: '3', name: 'Legal (ongoing)', monthlyCost: 2500 },
    { id: '4', name: 'Compliance', monthlyCost: 2000 },
    { id: '5', name: 'Tax Preparation', monthlyCost: 2500 },
  ],
  established: [
    { id: '1', name: 'Fund Administration', monthlyCost: 7500 },
    { id: '2', name: 'Audit', monthlyCost: 5000 },
    { id: '3', name: 'Legal (ongoing)', monthlyCost: 4000 },
    { id: '4', name: 'Compliance', monthlyCost: 3500 },
    { id: '5', name: 'Tax Preparation', monthlyCost: 4000 },
  ],
  institutional: [
    { id: '1', name: 'Fund Administration', monthlyCost: 12000 },
    { id: '2', name: 'Audit', monthlyCost: 7000 },
    { id: '3', name: 'Legal (ongoing)', monthlyCost: 6500 },
    { id: '4', name: 'Compliance', monthlyCost: 5000 },
    { id: '5', name: 'Tax Preparation', monthlyCost: 5500 },
  ],
}

// Overhead expense templates by size tier
const OVERHEAD_TEMPLATES: Record<string, ExpenseItem[]> = {
  emerging: [
    { id: '1', name: 'Office / Coworking', monthlyCost: 1500 },
    { id: '2', name: 'D&O / E&O Insurance', monthlyCost: 2000 },
    { id: '3', name: 'Technology / Software', monthlyCost: 1000 },
    { id: '4', name: 'Travel & Entertainment', monthlyCost: 2000 },
  ],
  established: [
    { id: '1', name: 'Office / Coworking', monthlyCost: 4000 },
    { id: '2', name: 'D&O / E&O Insurance', monthlyCost: 3000 },
    { id: '3', name: 'Technology / Software', monthlyCost: 2000 },
    { id: '4', name: 'Travel & Entertainment', monthlyCost: 3500 },
  ],
  institutional: [
    { id: '1', name: 'Office / Coworking', monthlyCost: 8000 },
    { id: '2', name: 'D&O / E&O Insurance', monthlyCost: 4500 },
    { id: '3', name: 'Technology / Software', monthlyCost: 3500 },
    { id: '4', name: 'Travel & Entertainment', monthlyCost: 5000 },
  ],
}

interface WizardConfig {
  strategy: string
  fundSize: number
  feeRate: number
  sizeTier: string
  startingCash: number
  firstCloseYear: number
  teamMembers: TeamMember[]
  customizedTeam: boolean
}

interface OnboardingWizardProps {
  onComplete: (data: BudgetData) => void
  onSkip: () => void
}

// Common roles available for team building
const AVAILABLE_ROLES = [
  { role: 'Managing Partner', cost: { emerging: 20000, established: 28000, institutional: 35000 } },
  { role: 'Partner', cost: { emerging: 18000, established: 24000, institutional: 30000 } },
  { role: 'Principal', cost: { emerging: 15000, established: 18000, institutional: 22000 } },
  { role: 'VP', cost: { emerging: 12000, established: 16000, institutional: 20000 } },
  { role: 'Director', cost: { emerging: 14000, established: 18000, institutional: 22000 } },
  { role: 'Associate', cost: { emerging: 8000, established: 10000, institutional: 12000 } },
  { role: 'Analyst', cost: { emerging: 6000, established: 8000, institutional: 10000 } },
  { role: 'CFO / Controller', cost: { emerging: 15000, established: 18000, institutional: 22000 } },
  { role: 'COO', cost: { emerging: 15000, established: 18000, institutional: 22000 } },
  { role: 'IR / Marketing', cost: { emerging: 10000, established: 14000, institutional: 18000 } },
  { role: 'Portfolio Manager', cost: { emerging: 25000, established: 35000, institutional: 45000 } },
  { role: 'Trader', cost: { emerging: 12000, established: 16000, institutional: 20000 } },
  { role: 'Credit Analyst', cost: { emerging: 10000, established: 14000, institutional: 18000 } },
  { role: 'Asset Manager', cost: { emerging: 10000, established: 14000, institutional: 18000 } },
]

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<WizardConfig>({
    strategy: '',
    fundSize: 50,
    feeRate: 2.0,
    sizeTier: 'emerging',
    startingCash: 500000,
    firstCloseYear: new Date().getFullYear(),
    teamMembers: [],
    customizedTeam: false
  })

  const totalSteps = 5

  const selectedStrategy = FUND_STRATEGIES.find(s => s.id === config.strategy)
  const selectedTier = SIZE_TIERS.find(t => t.id === config.sizeTier)

  // Determine size tier based on fund size
  const determineSizeTier = (size: number): string => {
    if (size < 100) return 'emerging'
    if (size < 300) return 'established'
    return 'institutional'
  }

  const handleStrategySelect = (strategyId: string) => {
    const strategy = FUND_STRATEGIES.find(s => s.id === strategyId)
    if (strategy) {
      const newSizeTier = determineSizeTier(strategy.typicalSize.default)
      const defaultTeam = TEAM_TEMPLATES[strategyId]?.[newSizeTier] || []
      setConfig(prev => ({
        ...prev,
        strategy: strategyId,
        fundSize: strategy.typicalSize.default,
        feeRate: strategy.typicalFee,
        sizeTier: newSizeTier,
        teamMembers: defaultTeam.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9) })),
        customizedTeam: false
      }))
    }
  }

  const handleFundSizeChange = (size: number) => {
    const newTier = determineSizeTier(size)
    const shouldUpdateTeam = newTier !== config.sizeTier && !config.customizedTeam

    setConfig(prev => ({
      ...prev,
      fundSize: size,
      sizeTier: newTier,
      // Update team if tier changes and user hasn't customized
      ...(shouldUpdateTeam && config.strategy ? {
        teamMembers: (TEAM_TEMPLATES[config.strategy]?.[newTier] || []).map(t => ({
          ...t,
          id: Math.random().toString(36).substr(2, 9)
        }))
      } : {})
    }))
  }

  // Team management functions
  const addTeamMember = (roleInfo: typeof AVAILABLE_ROLES[0]) => {
    const tier = config.sizeTier as 'emerging' | 'established' | 'institutional'
    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      role: roleInfo.role,
      monthlyCost: roleInfo.cost[tier]
    }
    setConfig(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember],
      customizedTeam: true
    }))
  }

  const removeTeamMember = (id: string) => {
    setConfig(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(m => m.id !== id),
      customizedTeam: true
    }))
  }

  const resetTeamToDefault = () => {
    const defaultTeam = TEAM_TEMPLATES[config.strategy]?.[config.sizeTier] || []
    setConfig(prev => ({
      ...prev,
      teamMembers: defaultTeam.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9) })),
      customizedTeam: false
    }))
  }

  // Calculate team costs
  const teamMonthlyCost = config.teamMembers.reduce((sum, m) => sum + m.monthlyCost, 0)
  const teamAnnualCost = teamMonthlyCost * 12

  const handleComplete = () => {
    // Generate full budget data from wizard config
    // Use user's customized team if they modified it, otherwise use template
    const finalTeam = config.teamMembers.length > 0
      ? config.teamMembers
      : TEAM_TEMPLATES[config.strategy]?.[config.sizeTier] || TEAM_TEMPLATES.vc.emerging
    const opsTemplate = OPERATIONS_TEMPLATES[config.sizeTier] || OPERATIONS_TEMPLATES.emerging
    const overheadTemplate = OVERHEAD_TEMPLATES[config.sizeTier] || OVERHEAD_TEMPLATES.emerging

    // Generate new IDs for all items
    const genId = () => Math.random().toString(36).substr(2, 9)

    const budgetData: BudgetData = {
      startingCash: config.startingCash,
      funds: [
        {
          id: genId(),
          name: 'Fund I',
          size: config.fundSize,
          feeRate: config.feeRate,
          firstCloseYear: config.firstCloseYear
        }
      ],
      expenses: {
        team: finalTeam.map(t => ({ ...t, id: genId() })),
        operations: opsTemplate.map(o => ({ ...o, id: genId() })),
        overhead: overheadTemplate.map(o => ({ ...o, id: genId() }))
      }
    }

    onComplete(budgetData)
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!config.strategy
      case 2: return config.fundSize > 0 && config.feeRate > 0
      case 3: return config.teamMembers.length > 0 // Team step
      case 4: return config.startingCash > 0 // Starting capital
      case 5: return true // Review
      default: return false
    }
  }

  // Calculate preview metrics
  const previewAnnualFees = config.fundSize * 1_000_000 * (config.feeRate / 100)
  const teamTemplate = TEAM_TEMPLATES[config.strategy]?.[config.sizeTier] || []
  const opsTemplate = OPERATIONS_TEMPLATES[config.sizeTier] || []
  const overheadTemplate = OVERHEAD_TEMPLATES[config.sizeTier] || []
  // Use user's configured team if available, otherwise use template
  const actualTeamCost = config.teamMembers.length > 0 ? teamMonthlyCost : teamTemplate.reduce((s, m) => s + m.monthlyCost, 0)
  const previewMonthlyBurn = actualTeamCost + [
    ...opsTemplate.map(o => o.monthlyCost),
    ...overheadTemplate.map(o => o.monthlyCost)
  ].reduce((a, b) => a + b, 0)
  const previewRunwayMonths = previewMonthlyBurn > 0 ? Math.floor(config.startingCash / previewMonthlyBurn) : 0

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Budget Wizard</span>
        </div>
        <CardTitle className="text-2xl">Set Up Your Budget</CardTitle>
        <CardDescription className="text-base">
          Answer a few questions to get a customized budget template with industry benchmarks.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i + 1 === step ? "w-8 bg-primary" : i + 1 < step ? "w-2 bg-primary" : "w-2 bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Strategy Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-1">What type of fund are you launching?</h3>
              <p className="text-sm text-muted-foreground">This helps us set appropriate benchmarks and team templates.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FUND_STRATEGIES.map((strategy) => {
                const Icon = strategy.icon
                const isSelected = config.strategy === strategy.id
                return (
                  <button
                    key={strategy.id}
                    onClick={() => handleStrategySelect(strategy.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <Icon className={cn("h-6 w-6 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <div className="font-medium text-sm">{strategy.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{strategy.description}</div>
                  </button>
                )
              })}
            </div>

            {selectedStrategy && (
              <div className="mt-6 p-4 bg-accent/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Typical for {selectedStrategy.name}:</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Fund Size</div>
                    <div className="font-medium">${selectedStrategy.typicalSize.min}M - ${selectedStrategy.typicalSize.max}M</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Mgmt Fee</div>
                    <div className="font-medium">{selectedStrategy.typicalFee}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Core Team</div>
                    <div className="font-medium">{selectedStrategy.typicalTeam.length} roles</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Fund Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-1">Tell us about your fund</h3>
              <p className="text-sm text-muted-foreground">These inputs drive your fee revenue projections.</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="fundSize" className="text-base">Target Fund Size</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="fundSize"
                      type="number"
                      value={config.fundSize}
                      onChange={(e) => handleFundSizeChange(parseFloat(e.target.value) || 0)}
                      className="pl-7 pr-12 text-lg"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">M</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This puts you in the <span className="font-medium">{selectedTier?.name}</span> tier ({selectedTier?.range})
                </p>
              </div>

              <div>
                <Label htmlFor="feeRate" className="text-base">Management Fee Rate</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="relative flex-1">
                    <Input
                      id="feeRate"
                      type="number"
                      step="0.1"
                      value={config.feeRate}
                      onChange={(e) => setConfig(prev => ({ ...prev, feeRate: parseFloat(e.target.value) || 0 }))}
                      className="pr-8 text-lg"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="firstCloseYear" className="text-base">Expected First Close Year</Label>
                <Input
                  id="firstCloseYear"
                  type="number"
                  value={config.firstCloseYear}
                  onChange={(e) => setConfig(prev => ({ ...prev, firstCloseYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="mt-2 text-lg"
                />
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Annual Fee Revenue</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {formatCurrency(previewAnnualFees)}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatCurrency(previewAnnualFees / 12)}/month at full deployment
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Team Building */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-1">Build your team</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ve suggested a starting team based on your fund type and size. Customize it to match your plans.
              </p>
            </div>

            {/* Current team display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Your Team ({config.teamMembers.length} {config.teamMembers.length === 1 ? 'person' : 'people'})
                </Label>
                {config.customizedTeam && (
                  <Button variant="ghost" size="sm" onClick={resetTeamToDefault} className="text-xs h-7">
                    Reset to suggested
                  </Button>
                )}
              </div>

              {config.teamMembers.length > 0 ? (
                <div className="grid gap-2">
                  {config.teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{member.role}</div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(member.monthlyCost)}/mo</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Add team members below</p>
                </div>
              )}
            </div>

            {/* Team cost summary */}
            {config.teamMembers.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium">Team Cost</span>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(teamMonthlyCost)}/mo</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(teamAnnualCost)}/year</div>
                </div>
              </div>
            )}

            {/* Add team members */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Add team members</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ROLES.map((roleInfo) => {
                  const tier = config.sizeTier as 'emerging' | 'established' | 'institutional'
                  const cost = roleInfo.cost[tier]
                  return (
                    <button
                      key={roleInfo.role}
                      onClick={() => addTeamMember(roleInfo)}
                      className="px-3 py-2 text-xs rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
                    >
                      <div className="font-medium">{roleInfo.role}</div>
                      <div className="text-muted-foreground group-hover:text-primary/70">+{formatCurrency(cost, true)}/mo</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Benchmark info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                {selectedTier?.name} Benchmark
              </div>
              <div className="text-blue-800 dark:text-blue-200 text-xs">
                Typical team size: {selectedTier?.teamSize.min}-{selectedTier?.teamSize.max} people
                {' • '}
                Team usually represents ~{selectedTier?.teamPercent}% of total budget
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Starting Capital */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-1">How much starting capital do you have?</h3>
              <p className="text-sm text-muted-foreground">This is GP capital or seed funding to cover expenses before fees flow.</p>
            </div>

            <div>
              <Label htmlFor="startingCash" className="text-base">Starting Cash</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="startingCash"
                  type="number"
                  value={config.startingCash}
                  onChange={(e) => setConfig(prev => ({ ...prev, startingCash: parseFloat(e.target.value) || 0 }))}
                  className="pl-7 text-lg"
                />
              </div>
            </div>

            {/* Quick selection buttons */}
            <div className="flex flex-wrap gap-2">
              {[250000, 500000, 750000, 1000000, 1500000].map((amount) => (
                <Button
                  key={amount}
                  variant={config.startingCash === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConfig(prev => ({ ...prev, startingCash: amount }))}
                >
                  {formatCurrency(amount, true)}
                </Button>
              ))}
            </div>

            {previewMonthlyBurn > 0 && (
              <div className="p-4 bg-accent rounded-lg">
                <div className="text-sm font-medium">Estimated Runway</div>
                <div className="text-2xl font-bold mt-1">
                  {previewRunwayMonths} months
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on estimated {formatCurrency(previewMonthlyBurn)}/month burn rate
                </div>
                {previewRunwayMonths < 18 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Most managers target 18-24 months of runway before first close fees arrive.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-1">Review Your Setup</h3>
              <p className="text-sm text-muted-foreground">We will generate a customized budget template based on these inputs.</p>
            </div>

            <div className="grid gap-4">
              {/* Fund Summary */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">Fund Details</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Strategy</div>
                    <div className="font-medium">{selectedStrategy?.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Target Size</div>
                    <div className="font-medium">${config.fundSize}M</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Mgmt Fee</div>
                    <div className="font-medium">{config.feeRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">First Close</div>
                    <div className="font-medium">{config.firstCloseYear}</div>
                  </div>
                </div>
              </div>

              {/* Team Preview */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    Your Team ({config.teamMembers.length} {config.teamMembers.length === 1 ? 'role' : 'roles'})
                    {config.customizedTeam && <span className="text-xs text-muted-foreground ml-1">(customized)</span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.teamMembers.map((member) => (
                    <span key={member.id} className="px-2 py-1 bg-accent rounded text-xs">
                      {member.role}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Total: {formatCurrency(teamMonthlyCost)}/month
                </div>
              </div>

              {/* Financial Preview */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">Financial Overview</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Starting Cash</div>
                    <div className="font-medium">{formatCurrency(config.startingCash)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Annual Revenue</div>
                    <div className="font-medium">{formatCurrency(previewAnnualFees)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Est. Monthly Burn</div>
                    <div className="font-medium">{formatCurrency(previewMonthlyBurn)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Est. Runway</div>
                    <div className="font-medium">{previewRunwayMonths} months</div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              You can customize all values after setup. This is just a starting point based on industry benchmarks.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <div>
            {step === 1 ? (
              <Button variant="ghost" onClick={onSkip}>
                Skip Wizard
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            {step < totalSteps ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                <Check className="h-4 w-4 mr-1" />
                Create Budget
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
