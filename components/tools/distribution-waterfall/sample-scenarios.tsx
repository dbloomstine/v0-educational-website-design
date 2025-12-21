'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Rocket,
  TrendingUp,
  Home,
  Coins,
  Users,
  Star,
  ChevronRight,
  CheckCircle2
} from 'lucide-react'
import { WaterfallInput } from './waterfallCalculations'

interface ScenarioTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'pe' | 'vc' | 'growth' | 'real-estate' | 'credit' | 'emerging'
  tags: string[]
  input: WaterfallInput
  explanation: string
  keyFeatures: string[]
  typicalReturns: string
}

const scenarioTemplates: ScenarioTemplate[] = [
  // Private Equity
  {
    id: 'classic-buyout',
    name: 'Classic PE Buyout',
    description: 'Traditional leveraged buyout fund with standard 2&20 terms',
    icon: <Building2 className="h-6 w-6" />,
    category: 'pe',
    tags: ['Buyout', 'Large Cap', 'European'],
    input: {
      fundSize: 500000000,
      contributedCapital: 500000000,
      grossProceeds: 1000000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    },
    explanation: 'A $500M buyout fund that doubles investor capital over 5 years. Uses the European (whole-fund) waterfall with an 8% preferred return and 100% GP catch-up. This structure is standard for large buyout funds and provides strong LP protection.',
    keyFeatures: ['8% preferred return', '20% carried interest', '100% GP catch-up', 'European waterfall', '2% GP commitment'],
    typicalReturns: 'Target: 2.0-2.5x gross / 15-20% net IRR'
  },
  {
    id: 'mid-market-pe',
    name: 'Mid-Market PE',
    description: 'Middle market buyout with moderate terms',
    icon: <Building2 className="h-6 w-6" />,
    category: 'pe',
    tags: ['Mid-Market', 'Control', 'Value-Add'],
    input: {
      fundSize: 150000000,
      contributedCapital: 150000000,
      grossProceeds: 375000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 4,
      gpCommitmentPercent: 0.025
    },
    explanation: 'A $150M mid-market fund targeting 2.5x returns over 4 years. Slightly shorter hold periods than large buyouts, with a higher GP commitment to demonstrate alignment.',
    keyFeatures: ['8% pref rate', '2.5% GP commitment', '4-year hold', 'Control investments', 'Operational value-add'],
    typicalReturns: 'Target: 2.5-3.0x gross / 20-25% net IRR'
  },

  // Venture Capital
  {
    id: 'early-stage-vc',
    name: 'Early-Stage VC',
    description: 'Seed and Series A focused venture fund',
    icon: <Rocket className="h-6 w-6" />,
    category: 'vc',
    tags: ['Seed', 'Series A', 'Tech'],
    input: {
      fundSize: 75000000,
      contributedCapital: 75000000,
      grossProceeds: 225000000,
      waterfallType: 'american',
      prefRate: 0.0,
      prefCompounding: 'simple',
      carryRate: 0.25,
      catchUpRate: 1.0,
      hasCatchUp: false,
      yearsToExit: 7,
      gpCommitmentPercent: 0.02
    },
    explanation: 'A $75M early-stage VC fund with no preferred return (common in VC) and 25% carry. Uses American (deal-by-deal) waterfall, allowing carry on individual winners. Longer 7-year average hold period reflects early-stage company development timelines.',
    keyFeatures: ['No preferred return', '25% carry (VC standard)', 'Deal-by-deal waterfall', 'No catch-up', '7-year hold period'],
    typicalReturns: 'Target: 3.0-5.0x gross, power law distribution'
  },
  {
    id: 'growth-stage-vc',
    name: 'Growth-Stage VC',
    description: 'Series B-D focused growth venture fund',
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'vc',
    tags: ['Growth', 'Late Stage', 'Scaling'],
    input: {
      fundSize: 250000000,
      contributedCapital: 250000000,
      grossProceeds: 625000000,
      waterfallType: 'american',
      prefRate: 0.06,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 0.8,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.015
    },
    explanation: 'A $250M growth equity fund investing in proven companies scaling rapidly. Lower risk than early-stage VC justifies a preferred return. Uses 80% catch-up (LP gets 20% during catch-up) as a compromise between GP and LP interests.',
    keyFeatures: ['6% preferred return', '20% carry', '80% catch-up', 'Proven companies', '5-year hold'],
    typicalReturns: 'Target: 2.5-3.5x gross / 20-25% net IRR'
  },

  // Growth Equity
  {
    id: 'growth-equity',
    name: 'Growth Equity',
    description: 'Minority growth investments in profitable companies',
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'growth',
    tags: ['Minority', 'Profitable', 'Expansion'],
    input: {
      fundSize: 300000000,
      contributedCapital: 300000000,
      grossProceeds: 750000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 4,
      gpCommitmentPercent: 0.02
    },
    explanation: 'A $300M growth equity fund taking minority positions in profitable, growing companies. Uses PE-style terms (European waterfall, 8% pref) due to lower risk profile compared to VC. Shorter hold periods as companies are more mature.',
    keyFeatures: ['Minority stakes', 'Profitable companies', 'PE-style terms', 'Shorter holds', 'Lower risk'],
    typicalReturns: 'Target: 2.5-3.0x gross / 20-25% net IRR'
  },

  // Real Estate
  {
    id: 'real-estate-value-add',
    name: 'Real Estate Value-Add',
    description: 'Value-add real estate fund with property improvements',
    icon: <Home className="h-6 w-6" />,
    category: 'real-estate',
    tags: ['Value-Add', 'Multi-Family', 'Renovation'],
    input: {
      fundSize: 200000000,
      contributedCapital: 200000000,
      grossProceeds: 360000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 0.5,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.03
    },
    explanation: 'A $200M value-add real estate fund acquiring and improving properties. Uses 50% catch-up (GP and LP split equally during catch-up), which is common in real estate. Higher GP commitment (3%) typical for real estate GPs with operating backgrounds.',
    keyFeatures: ['8% pref (real estate standard)', '50% catch-up split', '3% GP commitment', 'Property improvements', 'Cash flow + appreciation'],
    typicalReturns: 'Target: 1.8-2.2x gross / 14-18% net IRR'
  },
  {
    id: 'opportunistic-re',
    name: 'Opportunistic Real Estate',
    description: 'Higher risk/return real estate strategies',
    icon: <Home className="h-6 w-6" />,
    category: 'real-estate',
    tags: ['Opportunistic', 'Development', 'High Risk'],
    input: {
      fundSize: 350000000,
      contributedCapital: 350000000,
      grossProceeds: 700000000,
      waterfallType: 'european',
      prefRate: 0.10,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 6,
      gpCommitmentPercent: 0.025
    },
    explanation: 'A $350M opportunistic fund pursuing higher-risk strategies like ground-up development. Higher 10% preferred return compensates LPs for increased risk. Longer hold periods for development projects.',
    keyFeatures: ['10% preferred return', 'Ground-up development', 'Distressed acquisitions', 'Higher risk/return', '6-year average hold'],
    typicalReturns: 'Target: 2.0-2.5x gross / 15-20% net IRR'
  },

  // Private Credit
  {
    id: 'direct-lending',
    name: 'Direct Lending',
    description: 'Senior secured loans to middle market companies',
    icon: <Coins className="h-6 w-6" />,
    category: 'credit',
    tags: ['Senior Debt', 'Secured', 'Current Income'],
    input: {
      fundSize: 400000000,
      contributedCapital: 400000000,
      grossProceeds: 560000000,
      waterfallType: 'european',
      prefRate: 0.06,
      prefCompounding: 'compound',
      carryRate: 0.15,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 4,
      gpCommitmentPercent: 0.02
    },
    explanation: 'A $400M direct lending fund providing senior secured loans. Lower carry (15%) reflects lower risk and return profile. Compound preferred return and shorter hold periods typical for credit strategies.',
    keyFeatures: ['15% carry (credit standard)', '6% compound pref', 'Current income focus', 'Senior secured', 'Lower volatility'],
    typicalReturns: 'Target: 1.3-1.5x gross / 8-12% net IRR'
  },
  {
    id: 'mezzanine-fund',
    name: 'Mezzanine Fund',
    description: 'Subordinated debt with equity upside',
    icon: <Coins className="h-6 w-6" />,
    category: 'credit',
    tags: ['Subordinated', 'Warrants', 'Hybrid'],
    input: {
      fundSize: 200000000,
      contributedCapital: 200000000,
      grossProceeds: 340000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'compound',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    },
    explanation: 'A $200M mezzanine fund providing subordinated debt with equity warrants. Higher returns than senior debt justify standard PE carry. Compound pref reflects credit fund norms.',
    keyFeatures: ['Subordinated debt', 'Equity warrants', 'Compound pref', 'Current yield + upside', 'Moderate risk'],
    typicalReturns: 'Target: 1.6-1.8x gross / 12-15% net IRR'
  },

  // Emerging Manager
  {
    id: 'emerging-manager',
    name: 'Emerging Manager',
    description: 'First-time fund with LP-friendly terms',
    icon: <Star className="h-6 w-6" />,
    category: 'emerging',
    tags: ['Fund I', 'First-Time', 'LP-Friendly'],
    input: {
      fundSize: 50000000,
      contributedCapital: 50000000,
      grossProceeds: 125000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.18,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.03
    },
    explanation: 'A $50M Fund I from a first-time manager. Offers LP-friendly 18% carry (vs standard 20%) to attract capital. Higher GP commitment (3%) demonstrates conviction. European waterfall provides LP protection.',
    keyFeatures: ['18% carry (reduced)', '3% GP commitment', 'LP-friendly terms', 'Smaller fund size', 'First institutional fund'],
    typicalReturns: 'Target: 2.5x gross / 20%+ net IRR to prove track record'
  },
  {
    id: 'diverse-manager',
    name: 'Diverse Manager Fund',
    description: 'Fund with diversity-focused GP team',
    icon: <Users className="h-6 w-6" />,
    category: 'emerging',
    tags: ['Diverse', 'Emerging', 'ESG'],
    input: {
      fundSize: 75000000,
      contributedCapital: 75000000,
      grossProceeds: 187500000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.025
    },
    explanation: 'A $75M fund led by diverse managers (women/minority-owned). Many institutional LPs have allocation targets for diverse managers. Standard terms with strong GP commitment show institutional readiness.',
    keyFeatures: ['Diverse GP team', 'Standard market terms', 'Institutional quality', 'ESG alignment', 'LP allocation targets'],
    typicalReturns: 'Target: 2.5x gross / competitive with market'
  },

  // Edge Cases / Teaching Examples
  {
    id: 'no-catch-up',
    name: 'No Catch-Up Example',
    description: 'See how removing catch-up affects GP economics',
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'pe',
    tags: ['Educational', 'No Catch-Up', 'LP-Friendly'],
    input: {
      fundSize: 100000000,
      contributedCapital: 100000000,
      grossProceeds: 200000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 0.0,
      hasCatchUp: false,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    },
    explanation: 'A teaching example showing what happens without GP catch-up. GP only earns carry on profits ABOVE the preferred return, resulting in effective carry rate well below 20%. Compare with catch-up scenarios to see the difference.',
    keyFeatures: ['No catch-up provision', 'GP earns less', 'Effective carry < 20%', 'More LP-friendly', 'Educational comparison'],
    typicalReturns: 'Compare effective carry with catch-up scenarios'
  }
]

const categoryLabels: Record<string, { label: string; color: string }> = {
  pe: { label: 'Private Equity', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  vc: { label: 'Venture Capital', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  growth: { label: 'Growth Equity', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  'real-estate': { label: 'Real Estate', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  credit: { label: 'Private Credit', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  emerging: { label: 'Emerging Manager', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' }
}

interface SampleScenariosProps {
  onSelectScenario: (input: WaterfallInput) => void
  compact?: boolean
}

export function SampleScenarios({ onSelectScenario, compact = false }: SampleScenariosProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)

  const filteredScenarios = selectedCategory
    ? scenarioTemplates.filter(s => s.category === selectedCategory)
    : scenarioTemplates

  const categories = Object.keys(categoryLabels)

  if (compact) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Start Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {scenarioTemplates.slice(0, 4).map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario.input)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left"
              >
                <div className="text-primary">{scenario.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{scenario.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{scenario.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Scenario Library</CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore pre-built waterfall scenarios across different fund types
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({scenarioTemplates.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryLabels[cat].label}
            </Button>
          ))}
        </div>

        {/* Scenarios grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-lg border border-border bg-background overflow-hidden"
            >
              <button
                onClick={() => setExpandedScenario(
                  expandedScenario === scenario.id ? null : scenario.id
                )}
                className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    {scenario.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{scenario.name}</h4>
                      <Badge variant="secondary" className={categoryLabels[scenario.category].color}>
                        {categoryLabels[scenario.category].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scenario.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {expandedScenario === scenario.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  <p className="text-sm text-foreground">{scenario.explanation}</p>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Key Features:</p>
                    <ul className="space-y-1">
                      {scenario.keyFeatures.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Typical Returns:</p>
                    <p className="text-sm font-medium">{scenario.typicalReturns}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Fund Size: </span>
                      <span className="font-medium">${(scenario.input.fundSize / 1000000).toFixed(0)}M</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pref Rate: </span>
                      <span className="font-medium">{(scenario.input.prefRate * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carry: </span>
                      <span className="font-medium">{(scenario.input.carryRate * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">GP Commit: </span>
                      <span className="font-medium">{(scenario.input.gpCommitmentPercent * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => onSelectScenario(scenario.input)}
                    className="w-full"
                  >
                    Load This Scenario
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
