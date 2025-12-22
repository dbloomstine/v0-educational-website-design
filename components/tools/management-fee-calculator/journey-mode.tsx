'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { InfoPopover } from '@/components/ui/info-popover'
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Building2,
  TrendingUp,
  DollarSign,
  Layers,
  CheckCircle2,
  Clock,
  Percent,
  Calculator,
  Zap,
  Gift,
  Star,
  ArrowRight
} from 'lucide-react'
import { FundInputs, FeePhase, FundType, FeeBase } from './types'
import { generateDefaultFeePhases } from './fee-calculator'

interface JourneyModeProps {
  onComplete: (inputs: FundInputs, phases: FeePhase[]) => void
  onSkip: () => void
  onXPEarned?: (xp: number) => void
  onAchievementCheck?: (type: string, value?: unknown) => void
}

interface JourneyStep {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  description: string
  learnMore?: string
}

const journeySteps: JourneyStep[] = [
  {
    id: 'welcome',
    title: 'Management Fees Explained',
    subtitle: "Let's Learn Together",
    icon: <Sparkles className="h-8 w-8" />,
    description: "Management fees are the recurring compensation paid to the GP (General Partner) for managing the fund. They cover operational costs and provide stable income during the fund's lifecycle.",
    learnMore: "Unlike carried interest which is tied to performance, management fees are charged regardless of returns. They're typically the GP's primary source of income during the investment period and are negotiated in the LPA (Limited Partnership Agreement)."
  },
  {
    id: 'fund-type',
    title: 'Choose Your Fund Type',
    subtitle: 'What Kind of Fund?',
    icon: <Building2 className="h-8 w-8" />,
    description: 'Different fund types have different fee conventions. Select the type that matches your strategy to see typical fee structures.',
    learnMore: "PE and VC funds typically charge 2% on commitments during investment period. Credit funds charge less (0.75-1.5%) due to leverage. Hedge funds charge on NAV. Understanding these norms helps you position your fund competitively."
  },
  {
    id: 'fund-size',
    title: 'Target Fund Size',
    subtitle: 'How Much Capital?',
    icon: <DollarSign className="h-8 w-8" />,
    description: 'Your fund size directly impacts total fee dollars. A larger fund means more fees, but also more operational complexity.',
    learnMore: "Emerging managers typically raise $25M-$100M for Fund I. Fee income needs to cover salaries, office costs, legal, compliance, travel, and third-party services. Many GPs underestimate operational costs in early funds."
  },
  {
    id: 'fund-term',
    title: 'Fund Term & Investment Period',
    subtitle: 'Timeline Matters',
    icon: <Clock className="h-8 w-8" />,
    description: 'The fund term is typically 10 years for PE/VC. The investment period (when you can make new investments) is usually 3-5 years.',
    learnMore: "After the investment period ends, you enter the 'harvest period' where you focus on managing and exiting portfolio companies. Many funds step down fees during this period since less active work is required."
  },
  {
    id: 'fee-phases',
    title: 'Fee Structure Phases',
    subtitle: 'The Step-Down',
    icon: <Layers className="h-8 w-8" />,
    description: "Most funds have two phases: higher fees during investment period (on commitments), then lower fees during harvest (on invested capital). This is called a 'step-down'.",
    learnMore: "A typical structure: 2.0% on commitments during years 1-5, then 1.5% on invested capital for years 6-10. Some funds negotiate more complex step-downs (e.g., reducing by 10bps per year after year 6)."
  },
  {
    id: 'fee-basis',
    title: 'Fee Calculation Basis',
    subtitle: 'On What Amount?',
    icon: <Percent className="h-8 w-8" />,
    description: "Fees can be calculated on different bases: committed capital, invested cost, NAV, or the lower of cost/NAV. The basis significantly impacts total fees.",
    learnMore: "Committed capital basis gives the GP predictable fees but can feel expensive to LPs if capital isn't fully deployed. Invested cost is more LP-friendly but creates uncertainty for GP budgeting. NAV-based is common for evergreen/hedge funds."
  },
  {
    id: 'review',
    title: 'Your Fee Structure',
    subtitle: 'Ready to Calculate',
    icon: <Calculator className="h-8 w-8" />,
    description: "Review your inputs below. We'll calculate your total fees over the life of the fund and show you how it compares to market benchmarks.",
    learnMore: "Remember: management fees should cover your operating costs with some cushion, but not be so high they deter LPs. The goal is alignment - enough to run operations professionally, not so much that returns are significantly impacted."
  }
]

const fundTypeOptions: FundType[] = [
  'Private Equity',
  'Venture Capital',
  'Private Credit',
  'Real Estate',
  'Hedge Fund',
  'Other'
]

const fundTypeDefaults: Record<FundType, { feeRate: number; term: number; ip: number; description: string }> = {
  'Private Equity': { feeRate: 2.0, term: 10, ip: 5, description: '2% on commitments during investment period, 1.5-2% on invested capital after' },
  'Venture Capital': { feeRate: 2.0, term: 10, ip: 4, description: '2-2.5% on commitments, often flat throughout fund life' },
  'Private Credit': { feeRate: 1.0, term: 7, ip: 3, description: '0.75-1.5% depending on strategy and leverage' },
  'Real Estate': { feeRate: 1.5, term: 8, ip: 3, description: '1-1.5% on commitments or invested capital' },
  'Hedge Fund': { feeRate: 1.5, term: 10, ip: 10, description: '1.5-2% on NAV annually' },
  'Other': { feeRate: 2.0, term: 10, ip: 5, description: 'Custom structure - adjust to match your LPA' }
}

export function JourneyMode({ onComplete, onSkip, onXPEarned, onAchievementCheck }: JourneyModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)

  // Form state
  const [fundType, setFundType] = useState<FundType>('Venture Capital')
  const [fundSize, setFundSize] = useState(50)
  const [fundTerm, setFundTerm] = useState(10)
  const [investmentPeriod, setInvestmentPeriod] = useState(4)
  const [phase1Rate, setPhase1Rate] = useState(2.0)
  const [phase2Rate, setPhase2Rate] = useState(1.5)
  const [phase1Basis, setPhase1Basis] = useState<FeeBase>('Committed Capital')
  const [phase2Basis, setPhase2Basis] = useState<FeeBase>('Invested Cost')

  const step = journeySteps[currentStep]
  const progress = ((currentStep + 1) / journeySteps.length) * 100

  // Award XP for learning
  const awardXP = (amount: number) => {
    setXpEarned(prev => prev + amount)
    onXPEarned?.(amount)
  }

  const handleNext = () => {
    if (currentStep < journeySteps.length - 1) {
      // Award XP for completing each step
      awardXP(15)
      onAchievementCheck?.('journey_step', currentStep + 1)

      setCurrentStep(prev => prev + 1)
      setShowLearnMore(false)
    } else {
      // Complete the journey
      awardXP(50) // Bonus for completion
      onAchievementCheck?.('journey_complete')

      const inputs: FundInputs = {
        fundType,
        fundSize,
        fundTerm,
        investmentPeriod,
        gpCommitment: 2,
        navGrowthRate: 0
      }

      const phases: FeePhase[] = [
        {
          id: 'phase-1',
          startYear: 1,
          endYear: investmentPeriod,
          feeBase: phase1Basis,
          feeRate: phase1Rate
        },
        {
          id: 'phase-2',
          startYear: investmentPeriod + 1,
          endYear: fundTerm,
          feeBase: phase2Basis,
          feeRate: phase2Rate
        }
      ]

      onComplete(inputs, phases)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setShowLearnMore(false)
    }
  }

  const handleFundTypeChange = (type: FundType) => {
    setFundType(type)
    const defaults = fundTypeDefaults[type]
    setFundTerm(defaults.term)
    setInvestmentPeriod(defaults.ip)
    setPhase1Rate(defaults.feeRate)
    setPhase2Rate(Math.max(defaults.feeRate - 0.5, 0.5))
  }

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Visual diagram of fee flow */}
            <div className="grid gap-3 mt-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
              >
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">LPs Commit Capital</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Investors commit to invest a certain amount</p>
                </div>
              </motion.div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
              >
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                  <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">GP Charges Fees</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Typically 1.5-2.5% annually on capital</p>
                </div>
              </motion.div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800"
              >
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">Covers Operations</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Salaries, office, legal, compliance, travel</p>
                </div>
              </motion.div>
            </div>
          </div>
        )

      case 'fund-type':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {fundTypeOptions.map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFundTypeChange(type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    fundType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <h4 className="font-semibold text-foreground">{type}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fundTypeDefaults[type].description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      ~{fundTypeDefaults[type].feeRate}% fee
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {fundTypeDefaults[type].term}yr term
                    </Badge>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )

      case 'fund-size':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fundSize" className="flex items-center gap-2">
                  Target Fund Size
                  <InfoPopover>
                    The total capital commitments you're targeting from all LPs and the GP.
                  </InfoPopover>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="fundSize"
                    type="number"
                    min={1}
                    value={fundSize}
                    onChange={(e) => setFundSize(parseFloat(e.target.value) || 50)}
                    className="pl-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">M</span>
                </div>
              </div>

              {/* Quick select buttons */}
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100, 150, 200].map((size) => (
                  <Button
                    key={size}
                    variant={fundSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFundSize(size)}
                  >
                    ${size}M
                  </Button>
                ))}
              </div>

              {/* Fee preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-muted/50"
              >
                <p className="text-sm">
                  <span className="text-muted-foreground">At {phase1Rate}% annual fee: </span>
                  <span className="font-semibold text-foreground">
                    ${((fundSize * phase1Rate) / 100).toFixed(2)}M per year
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This needs to cover all operational costs
                </p>
              </motion.div>
            </div>
          </div>
        )

      case 'fund-term':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fundTerm">Fund Term (years)</Label>
                <Input
                  id="fundTerm"
                  type="number"
                  min={3}
                  max={15}
                  value={fundTerm}
                  onChange={(e) => setFundTerm(parseInt(e.target.value) || 10)}
                />
                <div className="flex gap-2">
                  {[7, 10, 12].map((term) => (
                    <Button
                      key={term}
                      variant={fundTerm === term ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFundTerm(term)}
                    >
                      {term} yrs
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentPeriod">Investment Period (years)</Label>
                <Input
                  id="investmentPeriod"
                  type="number"
                  min={1}
                  max={fundTerm - 1}
                  value={investmentPeriod}
                  onChange={(e) => setInvestmentPeriod(parseInt(e.target.value) || 4)}
                />
                <div className="flex gap-2">
                  {[3, 4, 5].map((ip) => (
                    <Button
                      key={ip}
                      variant={investmentPeriod === ip ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInvestmentPeriod(ip)}
                    >
                      {ip} yrs
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline visualization */}
            <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary/30"
                animate={{ width: `${(investmentPeriod / fundTerm) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <span className="text-xs font-medium">Investment Period</span>
                <span className="text-xs text-muted-foreground">Harvest Period</span>
              </div>
            </div>
          </div>
        )

      case 'fee-phases':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Phase 1 */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge className="bg-primary">Phase 1</Badge>
                    Years 1-{investmentPeriod}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Fee Rate (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={phase1Rate}
                      onChange={(e) => setPhase1Rate(parseFloat(e.target.value) || 2)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-1">
                    {[1.5, 2.0, 2.5].map((rate) => (
                      <Button
                        key={rate}
                        variant={phase1Rate === rate ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setPhase1Rate(rate)}
                      >
                        {rate}%
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Phase 2 */}
              <Card className="border-muted-foreground/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="secondary">Phase 2</Badge>
                    Years {investmentPeriod + 1}-{fundTerm}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Fee Rate (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={phase2Rate}
                      onChange={(e) => setPhase2Rate(parseFloat(e.target.value) || 1.5)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-1">
                    {[1.0, 1.5, 2.0].map((rate) => (
                      <Button
                        key={rate}
                        variant={phase2Rate === rate ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setPhase2Rate(rate)}
                      >
                        {rate}%
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step-down indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">
                {phase1Rate > phase2Rate
                  ? `Fee steps down by ${((phase1Rate - phase2Rate) * 100 / phase1Rate).toFixed(0)}% after investment period`
                  : 'Consider adding a step-down to be more LP-friendly'
                }
              </p>
            </div>
          </div>
        )

      case 'fee-basis':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Phase 1 Fee Basis</Label>
                <Select value={phase1Basis} onValueChange={(v) => setPhase1Basis(v as FeeBase)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Committed Capital">Committed Capital</SelectItem>
                    <SelectItem value="Invested Cost">Invested Cost</SelectItem>
                    <SelectItem value="Net Asset Value (NAV)">NAV</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {phase1Basis === 'Committed Capital' && 'Most common during investment period'}
                  {phase1Basis === 'Invested Cost' && 'LP-friendly but creates GP uncertainty'}
                  {phase1Basis === 'Net Asset Value (NAV)' && 'Common for hedge funds'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Phase 2 Fee Basis</Label>
                <Select value={phase2Basis} onValueChange={(v) => setPhase2Basis(v as FeeBase)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Committed Capital">Committed Capital</SelectItem>
                    <SelectItem value="Invested Cost">Invested Cost</SelectItem>
                    <SelectItem value="Net Asset Value (NAV)">NAV</SelectItem>
                    <SelectItem value="Lower of Cost or Fair Value">Lower of Cost/FV</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {phase2Basis === 'Invested Cost' && 'Standard after investment period'}
                  {phase2Basis === 'Committed Capital' && 'Less common but simpler'}
                  {phase2Basis === 'Net Asset Value (NAV)' && 'Aligns with portfolio value'}
                  {phase2Basis === 'Lower of Cost or Fair Value' && 'Most LP-friendly option'}
                </p>
              </div>
            </div>

            {/* Basis comparison */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">Impact on your ${fundSize}M fund:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Phase 1 ({phase1Basis}):</p>
                  <p className="font-semibold">
                    ${((fundSize * phase1Rate / 100) * investmentPeriod).toFixed(2)}M total
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phase 2 ({phase2Basis}):</p>
                  <p className="font-semibold">
                    ~${((fundSize * phase2Rate / 100) * (fundTerm - investmentPeriod)).toFixed(2)}M total
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>

            {/* Summary grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Fund Type</p>
                <p className="font-semibold">{fundType}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Fund Size</p>
                <p className="font-semibold">${fundSize}M</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Fund Term</p>
                <p className="font-semibold">{fundTerm} years</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Investment Period</p>
                <p className="font-semibold">{investmentPeriod} years</p>
              </div>
            </div>

            {/* Fee summary */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Fee Structure Summary</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Phase 1 (Years 1-{investmentPeriod}):</span>
                    <span className="font-medium">{phase1Rate}% on {phase1Basis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phase 2 (Years {investmentPeriod + 1}-{fundTerm}):</span>
                    <span className="font-medium">{phase2Rate}% on {phase2Basis}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-semibold">
                      <span>Estimated Total Fees:</span>
                      <span className="text-primary">
                        ~${(
                          (fundSize * phase1Rate / 100 * investmentPeriod) +
                          (fundSize * phase2Rate / 100 * (fundTerm - investmentPeriod))
                        ).toFixed(2)}M
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* XP earned indicator */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            >
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                You've earned {xpEarned} XP so far! Complete the journey for bonus XP!
              </span>
            </motion.div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="rounded-full bg-primary/10 p-3 text-primary"
            >
              {step.icon}
            </motion.div>
            <div>
              <CardTitle className="text-xl">{step.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{step.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              <Zap className="h-3 w-3 mr-1" />
              {xpEarned} XP
            </Badge>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip Tutorial
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          Step {currentStep + 1} of {journeySteps.length}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}

            {step.learnMore && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowLearnMore(!showLearnMore)
                    if (!showLearnMore) awardXP(5) // Bonus for reading more
                  }}
                  className="text-primary"
                >
                  {showLearnMore ? 'Hide Details' : 'Learn More → (+5 XP)'}
                </Button>
                <AnimatePresence>
                  {showLearnMore && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-200">{step.learnMore}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep === journeySteps.length - 1 ? (
              <>
                <Calculator className="h-4 w-4" />
                Calculate Fees
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
