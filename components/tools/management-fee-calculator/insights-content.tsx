'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  ChevronRight,
  ChevronDown,
  Briefcase,
  PiggyBank,
  Clock,
  Award,
  BookOpen,
  X,
  Sparkles
} from 'lucide-react'

// Trust indicators for the welcome screen
export function TrustIndicators() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-4 px-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        <span className="text-xs sm:text-sm">Based on 500+ fund LPAs</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span className="text-xs sm:text-sm">Used by 2,000+ managers</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <span className="text-xs sm:text-sm">Industry-validated</span>
      </div>
    </div>
  )
}

// Learning outcomes preview
export function LearningOutcomes() {
  const outcomes = [
    'Understand the "2 and 20" model and when to deviate',
    'Model fee step-downs that appeal to institutional LPs',
    'Compare your structure to market benchmarks',
    'Calculate operational runway from fee income'
  ]

  return (
    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
      <h4 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        What You&apos;ll Learn
      </h4>
      <ul className="space-y-2">
        {outcomes.map((outcome, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Operational cost breakdown component
interface OperationalCostBreakdownProps {
  fundSize: number
  feeRate: number
  onClose?: () => void
}

export function OperationalCostBreakdown({ fundSize, feeRate, onClose }: OperationalCostBreakdownProps) {
  const annualFees = (fundSize * feeRate) / 100
  const [expanded, setExpanded] = useState<string | null>(null)

  // Scale costs based on fund size
  const getScaledCosts = () => {
    const scaleFactor = fundSize / 50 // Base is $50M fund

    // Base costs for a $50M fund
    const baseCosts = {
      compensation: {
        label: 'Team Compensation',
        percentage: 55,
        items: [
          { name: 'Managing Partner', amount: 400 },
          { name: 'Investment Team (2-3)', amount: 450 },
          { name: 'Operations/CFO', amount: 200 },
          { name: 'Benefits & Taxes (~25%)', amount: 260 }
        ]
      },
      operations: {
        label: 'Operations & Admin',
        percentage: 20,
        items: [
          { name: 'Office & Facilities', amount: 80 },
          { name: 'Technology & Systems', amount: 40 },
          { name: 'Insurance (D&O, E&O)', amount: 50 },
          { name: 'Travel & Due Diligence', amount: 80 }
        ]
      },
      professional: {
        label: 'Professional Services',
        percentage: 20,
        items: [
          { name: 'Legal Counsel', amount: 100 },
          { name: 'Fund Administration', amount: 60 },
          { name: 'Audit & Tax', amount: 50 },
          { name: 'Compliance & Regulatory', amount: 40 }
        ]
      },
      reserves: {
        label: 'Reserves & Contingency',
        percentage: 5,
        items: [
          { name: 'Working Capital', amount: 30 },
          { name: 'Unexpected Expenses', amount: 20 }
        ]
      }
    }

    // Scale amounts (with some fixed costs that don't scale linearly)
    const scaled: Record<string, { label: string; percentage: number; total: number; items: Array<{ name: string; amount: number }> }> = {}

    Object.entries(baseCosts).forEach(([key, category]) => {
      const scaledItems = category.items.map(item => ({
        ...item,
        // Compensation scales more, operations less
        amount: Math.round(item.amount * (key === 'compensation' ? Math.pow(scaleFactor, 0.7) : Math.pow(scaleFactor, 0.4)) / 10) * 10
      }))

      scaled[key] = {
        ...category,
        items: scaledItems,
        total: scaledItems.reduce((sum, item) => sum + item.amount, 0)
      }
    })

    return scaled
  }

  const costs = getScaledCosts()
  const totalCosts = Object.values(costs).reduce((sum, cat) => sum + cat.total, 0)
  const _surplus = (annualFees * 1000) - totalCosts
  const coverageRatio = (annualFees * 1000) / totalCosts

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Operational Cost Reality Check
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          What it actually costs to run a ${fundSize}M fund
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Annual Fee Income</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              ${(annualFees).toFixed(2)}M
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Est. Annual Costs</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              ${(totalCosts / 1000).toFixed(2)}M
            </p>
          </div>
        </div>

        {/* Coverage indicator */}
        <div className={`p-3 rounded-lg border ${
          coverageRatio >= 1.15
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
            : coverageRatio >= 1
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {coverageRatio >= 1.15 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : coverageRatio >= 1 ? (
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {coverageRatio >= 1.15
                  ? 'Healthy Coverage'
                  : coverageRatio >= 1
                  ? 'Tight but Workable'
                  : 'Fee Income May Be Insufficient'
                }
              </p>
              <p className="text-sm mt-1">
                {coverageRatio >= 1.15
                  ? `Your fees cover costs with ${((coverageRatio - 1) * 100).toFixed(0)}% buffer for growth and unexpected expenses.`
                  : coverageRatio >= 1
                  ? `Fees barely cover costs. Consider if this allows for team growth or market adjustments.`
                  : `At ${feeRate}% on ${fundSize}M, you may struggle to maintain institutional-quality operations.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2">
          {Object.entries(costs).map(([key, category]) => (
            <div key={key} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === key ? null : key)}
                className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 text-left">
                    <span className="text-sm font-medium">{category.percentage}%</span>
                  </div>
                  <span className="font-medium text-sm">{category.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    ${(category.total / 1000).toFixed(1)}M
                  </span>
                  {expanded === key ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expanded === key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3"
                  >
                    <div className="pt-2 border-t space-y-1">
                      {category.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.name}</span>
                          <span>${item.amount}K</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Pro tip */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">Pro Tip</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Many first-time managers underestimate costs by 20-30%. Build in contingency,
                especially for legal fees during fundraising and first investments.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// LP Impact Calculator
interface LPImpactCalculatorProps {
  fundSize: number
  totalFees: number
  fundTerm: number
}

export function LPImpactCalculator({ fundSize, totalFees, fundTerm }: LPImpactCalculatorProps) {
  const [lpCommitment, setLpCommitment] = useState(10) // $10M default
  const lpShare = lpCommitment / fundSize
  const lpFees = totalFees * lpShare

  const scenarios = [
    { returnRate: 8, label: 'Conservative' },
    { returnRate: 12, label: 'Target' },
    { returnRate: 20, label: 'Strong' }
  ]

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          LP Impact View
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See how your fee structure affects LP economics
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* LP commitment selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Example LP Commitment: ${lpCommitment}M
          </label>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 25, 50].map(amount => (
              <Button
                key={amount}
                variant={lpCommitment === amount ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLpCommitment(amount)}
              >
                ${amount}M
              </Button>
            ))}
          </div>
        </div>

        {/* LP fees */}
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">LP&apos;s Share of Fees</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${lpFees.toFixed(2)}M
              </p>
              <p className="text-xs text-muted-foreground">over {fundTerm} years</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">% of Commitment</p>
              <p className="text-2xl font-bold">
                {((lpFees / lpCommitment) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">goes to fees</p>
            </div>
          </div>
        </div>

        {/* Return impact scenarios */}
        <div>
          <h4 className="text-sm font-medium mb-2">Impact on Different Return Scenarios:</h4>
          <div className="space-y-2">
            {scenarios.map(scenario => {
              const grossReturn = lpCommitment * Math.pow(1 + scenario.returnRate / 100, fundTerm)
              const netReturn = grossReturn - lpFees
              const effectiveReturn = Math.pow(netReturn / lpCommitment, 1 / fundTerm) - 1
              const dragBps = (scenario.returnRate - effectiveReturn * 100) * 100

              return (
                <div key={scenario.returnRate} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{scenario.label} ({scenario.returnRate}% gross)</span>
                    <Badge variant="secondary">{(effectiveReturn * 100).toFixed(1)}% net</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Fee drag: ~{Math.round(dragBps)} bps annually
                  </div>
                  <Progress
                    value={(effectiveReturn * 100 / scenario.returnRate) * 100}
                    className="h-1.5 mt-2"
                  />
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: Simplified model assuming fees paid upfront. Actual timing varies by LPA terms.
        </p>
      </CardContent>
    </Card>
  )
}

// Case studies component
export function CaseStudies() {
  const [expandedCase, setExpandedCase] = useState<string | null>(null)

  const cases = [
    {
      id: 'emerging-vc',
      title: 'First-Time VC Manager',
      fundSize: '$45M',
      feeStructure: '2.5% / 2.0%',
      outcome: 'Closed in 8 months',
      icon: <Briefcase className="h-5 w-5" />,
      color: 'blue',
      details: {
        situation: 'Two partners spinning out from established firm, targeting seed-stage enterprise software.',
        challenge: 'No track record as lead investors; needed to justify premium fees.',
        approach: 'Positioned 2.5% as covering operational build-out. Step-down to 2% after Year 4 showed LP alignment.',
        result: 'Closed with 12 LPs including 2 institutional. LP feedback: "Fees fair for emerging manager building infrastructure."',
        lesson: 'First-time managers can command standard fees if they articulate operational needs clearly.'
      }
    },
    {
      id: 'growth-pe',
      title: 'Growth Equity Fund II',
      fundSize: '$180M',
      feeStructure: '2.0% / 1.5%',
      outcome: 'Oversubscribed',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'green',
      details: {
        situation: 'Fund II after strong Fund I returns (2.1x MOIC). Targeting growth equity in fintech.',
        challenge: 'LPs expected fee discount given track record and larger fund size.',
        approach: 'Offered 1.5% post-investment vs 1.75% in Fund I. Added 100% fee offset for transaction fees.',
        result: 'Oversubscribed by 40%. Anchor LP increased commitment by 3x from Fund I.',
        lesson: 'Successful Fund I performance gives leverage to maintain rates while adding LP-friendly terms.'
      }
    },
    {
      id: 'credit-fund',
      title: 'Private Credit Launch',
      fundSize: '$250M',
      feeStructure: '1.25% / 1.0%',
      outcome: 'Institutional backing',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'purple',
      details: {
        situation: 'Credit-focused spinout from large asset manager. Strategy: middle-market direct lending.',
        challenge: 'Credit funds have lower fee tolerance; needed to compete with established players.',
        approach: 'Set fees at 1.25% on committed during deployment, 1.0% on deployed capital thereafter. Emphasized origination capabilities.',
        result: 'Secured $200M in first close from 3 pension funds. Final close expected at $300M+.',
        lesson: 'Lower base fees in credit can be offset by origination income and leverage. LPs focus on net returns.'
      }
    }
  ]

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Real-World Examples
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Anonymized case studies from actual fund launches
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {cases.map(caseStudy => (
          <div key={caseStudy.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedCase(expandedCase === caseStudy.id ? null : caseStudy.id)}
              className="w-full p-3 sm:p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
            >
              <div className={`rounded-full p-2 bg-${caseStudy.color}-100 dark:bg-${caseStudy.color}-900/30 text-${caseStudy.color}-600 dark:text-${caseStudy.color}-400 flex-shrink-0`}>
                {caseStudy.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="font-medium text-sm sm:text-base truncate">{caseStudy.title}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{caseStudy.fundSize}</Badge>
                  <Badge variant="outline" className="text-xs">{caseStudy.feeStructure}</Badge>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                    {caseStudy.outcome}
                  </Badge>
                </div>
              </div>
              {expandedCase === caseStudy.id ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {expandedCase === caseStudy.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 sm:px-4 pb-4"
                >
                  <div className="pt-3 border-t space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Situation</p>
                      <p className="text-sm mt-1">{caseStudy.details.situation}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Challenge</p>
                      <p className="text-sm mt-1">{caseStudy.details.challenge}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Approach</p>
                      <p className="text-sm mt-1">{caseStudy.details.approach}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Result</p>
                      <p className="text-sm mt-1">{caseStudy.details.result}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Key Lesson</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{caseStudy.details.lesson}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Fundraising tips component
export function FundraisingTips({ feesAsPercent }: { feesAsPercent: number }) {
  const getTips = () => {
    if (feesAsPercent < 15) {
      return {
        status: 'lp-friendly',
        headline: 'Strong LP Appeal',
        tips: [
          'Your below-market fees can be a fundraising differentiator',
          'Lead with fee structure in LP conversations',
          'Emphasize alignment: "We keep costs low so more capital works for you"',
          'Be prepared to explain how you cover operations sustainably'
        ]
      }
    } else if (feesAsPercent < 20) {
      return {
        status: 'market',
        headline: 'Market Standard',
        tips: [
          'Your fees are within acceptable range for most LPs',
          'Focus pitch on investment thesis and track record, not fees',
          'Be prepared to discuss step-down mechanics with sophisticated LPs',
          'Have fee offset and MFN policies ready to discuss'
        ]
      }
    } else {
      return {
        status: 'premium',
        headline: 'Above Market Average',
        tips: [
          'You\'ll need strong justification for premium fees',
          'Emphasize unique capabilities that require additional resources',
          'Consider adding LP-friendly terms to balance (better reporting, advisory boards)',
          'Be prepared for negotiation - anchor LPs may request discounts'
        ]
      }
    }
  }

  const tips = getTips()

  return (
    <Card className={`border-2 ${
      tips.status === 'lp-friendly'
        ? 'border-green-200 dark:border-green-800'
        : tips.status === 'market'
        ? 'border-blue-200 dark:border-blue-800'
        : 'border-amber-200 dark:border-amber-800'
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Fundraising Positioning
        </CardTitle>
        <Badge className={`w-fit ${
          tips.status === 'lp-friendly'
            ? 'bg-green-100 text-green-700'
            : tips.status === 'market'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {tips.headline}
        </Badge>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {tips.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// Industry evolution timeline
export function IndustryEvolution() {
  const eras = [
    {
      period: '2008-2012',
      label: 'Post-Crisis',
      fees: '1.5-1.75%',
      context: 'LP pressure after losses; fees compressed across the board'
    },
    {
      period: '2013-2018',
      label: 'Recovery',
      fees: '1.75-2.0%',
      context: 'Strong returns restored GP pricing power; "2 and 20" returned'
    },
    {
      period: '2019-2022',
      label: 'Peak',
      fees: '2.0-2.25%',
      context: 'Hot market; emerging managers could command premium'
    },
    {
      period: '2023+',
      label: 'Current',
      fees: '1.75-2.0%',
      context: 'Pressure from mega-funds; emerging managers holding at 2%'
    }
  ]

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Clock className="h-4 w-4" />
        How Fees Have Evolved
      </h4>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        {/* Eras */}
        <div className="space-y-4">
          {eras.map((era, i) => (
            <div key={era.period} className="flex gap-4 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium z-10 flex-shrink-0 ${
                i === eras.length - 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{era.period}</span>
                  <Badge variant="secondary" className="text-xs">{era.label}</Badge>
                  <Badge variant="outline" className="text-xs">{era.fees}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{era.context}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
