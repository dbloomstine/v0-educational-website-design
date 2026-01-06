'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Rocket,
  TrendingUp,
  DollarSign,
  Shield,
  Sparkles,
  ChevronRight,
  X,
  Play
} from 'lucide-react'
import { FundInputs, FeePhase } from './types'

interface Scenario {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  fundInputs: FundInputs
  feePhases: FeePhase[]
  tags: string[]
  highlight?: string
}

export const SAMPLE_SCENARIOS: Scenario[] = [
  {
    id: 'emerging-vc',
    name: 'Emerging VC Fund I',
    description: 'First-time venture fund with standard terms and modest size',
    icon: <Rocket className="h-6 w-6" />,
    fundInputs: {
      fundType: 'Venture Capital',
      fundSize: 50,
      fundTerm: 10,
      investmentPeriod: 4,
      gpCommitment: 2,
      navGrowthRate: 0
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 4, feeBase: 'Committed Capital', feeRate: 2.0 },
      { id: 'p2', startYear: 5, endYear: 10, feeBase: 'Invested Cost', feeRate: 2.0 }
    ],
    tags: ['Emerging Manager', 'Standard Terms'],
    highlight: 'Most common starting point for new VCs'
  },
  {
    id: 'institutional-pe',
    name: 'Institutional PE Fund',
    description: 'Mid-market PE with LP-friendly step-downs',
    icon: <Building2 className="h-6 w-6" />,
    fundInputs: {
      fundType: 'Private Equity',
      fundSize: 250,
      fundTerm: 10,
      investmentPeriod: 5,
      gpCommitment: 2,
      navGrowthRate: 0
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 5, feeBase: 'Committed Capital', feeRate: 1.75 },
      { id: 'p2', startYear: 6, endYear: 10, feeBase: 'Invested Cost', feeRate: 1.5 }
    ],
    tags: ['Institutional', 'LP-Friendly'],
    highlight: 'Negotiated rates for larger fund'
  },
  {
    id: 'growth-equity',
    name: 'Growth Equity Fund',
    description: 'Later-stage investing with faster deployment',
    icon: <TrendingUp className="h-6 w-6" />,
    fundInputs: {
      fundType: 'Private Equity',
      fundSize: 150,
      fundTerm: 8,
      investmentPeriod: 3,
      gpCommitment: 2,
      navGrowthRate: 15
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 3, feeBase: 'Committed Capital', feeRate: 2.0 },
      { id: 'p2', startYear: 4, endYear: 8, feeBase: 'Invested Cost', feeRate: 1.5 }
    ],
    tags: ['Growth', 'Shorter Term'],
    highlight: 'Faster capital deployment cycle'
  },
  {
    id: 'private-credit',
    name: 'Private Credit Fund',
    description: 'Direct lending with lower fees but stable income',
    icon: <DollarSign className="h-6 w-6" />,
    fundInputs: {
      fundType: 'Private Credit',
      fundSize: 200,
      fundTerm: 7,
      investmentPeriod: 3,
      gpCommitment: 2,
      navGrowthRate: 0
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 3, feeBase: 'Committed Capital', feeRate: 1.0 },
      { id: 'p2', startYear: 4, endYear: 7, feeBase: 'Invested Cost', feeRate: 0.75 }
    ],
    tags: ['Credit', 'Lower Fees'],
    highlight: 'Lower fees offset by leverage income'
  },
  {
    id: 'real-estate',
    name: 'Real Estate Value-Add',
    description: 'Real estate fund with property-based fees',
    icon: <Building2 className="h-6 w-6" />,
    fundInputs: {
      fundType: 'Real Estate',
      fundSize: 100,
      fundTerm: 8,
      investmentPeriod: 3,
      gpCommitment: 5,
      navGrowthRate: 8
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 3, feeBase: 'Committed Capital', feeRate: 1.5 },
      { id: 'p2', startYear: 4, endYear: 8, feeBase: 'Net Asset Value (NAV)', feeRate: 1.25 }
    ],
    tags: ['Real Estate', 'NAV-Based'],
    highlight: 'Higher GP commitment, NAV-based harvest fees'
  },
  {
    id: 'lp-friendly',
    name: 'LP-Friendly Structure',
    description: 'Aggressive step-downs with cost/FV basis',
    icon: <Shield className="h-6 w-6" />,
    fundInputs: {
      fundType: 'Private Equity',
      fundSize: 100,
      fundTerm: 10,
      investmentPeriod: 4,
      gpCommitment: 3,
      navGrowthRate: 0
    },
    feePhases: [
      { id: 'p1', startYear: 1, endYear: 4, feeBase: 'Committed Capital', feeRate: 1.75 },
      { id: 'p2', startYear: 5, endYear: 7, feeBase: 'Invested Cost', feeRate: 1.5 },
      { id: 'p3', startYear: 8, endYear: 10, feeBase: 'Lower of Cost or Fair Value', feeRate: 1.25 }
    ],
    tags: ['LP-Friendly', '3-Phase'],
    highlight: 'Maximum LP alignment with 3 step-downs'
  }
]

interface EnhancedScenariosProps {
  onSelectScenario: (inputs: FundInputs, phases: FeePhase[]) => void
  onClose?: () => void
  onXPEarned?: (xp: number) => void
}

export function EnhancedScenarios({ onSelectScenario, onClose, onXPEarned }: EnhancedScenariosProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (scenario: Scenario) => {
    setSelectedId(scenario.id)
    onXPEarned?.(15)
    setTimeout(() => {
      onSelectScenario(scenario.fundInputs, scenario.feePhases)
    }, 300)
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Sample Scenarios</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Explore real-world fee structures to understand different approaches
        </p>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-2">
        {SAMPLE_SCENARIOS.map((scenario) => (
          <motion.div
            key={scenario.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`cursor-pointer transition-all h-full ${
                selectedId === scenario.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleSelect(scenario)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    {scenario.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{scenario.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {scenario.description}
                    </p>

                    {/* Fund details */}
                    <div className="flex flex-wrap gap-2 mb-2 text-xs">
                      <span className="px-2 py-1 bg-muted rounded">
                        ${scenario.fundInputs.fundSize}M
                      </span>
                      <span className="px-2 py-1 bg-muted rounded">
                        {scenario.fundInputs.fundTerm}yr
                      </span>
                      <span className="px-2 py-1 bg-muted rounded">
                        {scenario.feePhases[0].feeRate}% → {scenario.feePhases[scenario.feePhases.length - 1].feeRate}%
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {scenario.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {scenario.highlight && (
                      <p className="text-xs text-primary mt-2 flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {scenario.highlight}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
