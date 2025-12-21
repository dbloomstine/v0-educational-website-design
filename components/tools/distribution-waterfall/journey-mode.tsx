'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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
  PieChart,
  Clock,
  Percent
} from 'lucide-react'
import { WaterfallInput, defaultInput } from './waterfallCalculations'

interface JourneyModeProps {
  onComplete: (input: WaterfallInput) => void
  onSkip: () => void
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
    title: 'Understanding Waterfalls',
    subtitle: "Let's Learn Together",
    icon: <Sparkles className="h-8 w-8" />,
    description: "A distribution waterfall determines how profits flow from a fund's investments to LPs (Limited Partners) and the GP (General Partner). We'll guide you through each concept step by step.",
    learnMore: "The term 'waterfall' comes from the way distributions flow down through multiple tiers, like water cascading down a series of levels. Each tier must be filled before excess proceeds flow to the next."
  },
  {
    id: 'fund-basics',
    title: 'Fund Basics',
    subtitle: 'The Foundation',
    icon: <Building2 className="h-8 w-8" />,
    description: 'Start by telling us about the fund size and how much capital was invested. These form the basis for all waterfall calculations.',
    learnMore: "The difference between fund size (committed capital) and contributed capital matters because management fees are typically charged on committed capital, but the waterfall operates on contributed capital."
  },
  {
    id: 'exit-proceeds',
    title: 'Exit Proceeds',
    subtitle: 'Investment Returns',
    icon: <TrendingUp className="h-8 w-8" />,
    description: "How much did the fund's investments return? This is the total cash received from all exits and distributions before any splits.",
    learnMore: "Gross proceeds is the starting point of the waterfall. A 2x gross multiple means the fund doubled its invested capital. Typical PE funds target 2-3x gross, while top-quartile VC funds may achieve 3-5x or more."
  },
  {
    id: 'structure',
    title: 'Waterfall Structure',
    subtitle: 'European vs American',
    icon: <Layers className="h-8 w-8" />,
    description: "Choose between European (whole-fund) and American (deal-by-deal) waterfall structures. This fundamentally changes when the GP receives carry.",
    learnMore: "European waterfalls require all capital to be returned before any carry is paid, making them more LP-friendly. American waterfalls allow carry on individual profitable deals, even if other deals have losses. Most PE funds use European; many VC funds use American."
  },
  {
    id: 'preferred-return',
    title: 'Preferred Return',
    subtitle: 'The LP Hurdle',
    icon: <Target className="h-8 w-8" />,
    description: "The preferred return (or 'hurdle rate') is the annual return LPs must receive before the GP participates in profits. It protects LP interests.",
    learnMore: "Think of it as a minimum performance threshold. If you set an 8% pref over 5 years, LPs need to receive their capital back plus 40% (simple) or ~47% (compound) before GP gets any carry. This aligns GP incentives with generating strong returns, not just acceptable ones."
  },
  {
    id: 'carried-interest',
    title: 'Carried Interest',
    subtitle: 'GP Economics',
    icon: <Percent className="h-8 w-8" />,
    description: "Carried interest (carry) is the GP's share of profits after the preferred return hurdle is cleared. It's the primary economic incentive for fund managers.",
    learnMore: "The '2 and 20' model (2% management fee + 20% carry) is the industry standard, but terms vary. Emerging managers may accept lower carry (15-18%), while top-tier managers may negotiate for 25-30%."
  },
  {
    id: 'catch-up',
    title: 'GP Catch-Up',
    subtitle: 'Leveling the Field',
    icon: <PieChart className="h-8 w-8" />,
    description: "The catch-up provision allows the GP to receive a larger share of profits after pref is paid, until they've received their target carry percentage of total profits.",
    learnMore: "Without catch-up, GP only earns carry on profits ABOVE the pref. With 100% catch-up, after LPs get their pref, GP receives 100% of the next distributions until they've 'caught up' to 20% of all profits. This ensures fair GP compensation on successful funds."
  },
  {
    id: 'gp-commitment',
    title: 'GP Commitment',
    subtitle: 'Skin in the Game',
    icon: <DollarSign className="h-8 w-8" />,
    description: "GPs typically invest their own capital alongside LPs to demonstrate alignment. This commitment flows through the waterfall like LP capital.",
    learnMore: "Standard GP commitments range from 1-5% of fund size. A larger commitment signals GP conviction and reduces agency risk. This capital is subject to the same return of capital and pref as LP money."
  },
  {
    id: 'timing',
    title: 'Investment Timeline',
    subtitle: 'Hold Period',
    icon: <Clock className="h-8 w-8" />,
    description: "How long was the capital invested? This affects preferred return calculations and gives context to the returns.",
    learnMore: "Typical hold periods vary by strategy: buyout PE (3-5 years), growth equity (3-5 years), VC (5-7 years), real estate (3-7 years). Longer holds increase the preferred return accrual."
  },
  {
    id: 'review',
    title: 'Review Your Inputs',
    subtitle: 'Almost There',
    icon: <CheckCircle2 className="h-8 w-8" />,
    description: "Review your waterfall parameters before we calculate the distribution. You can always adjust these later in the full calculator.",
  }
]

export function JourneyMode({ onComplete, onSkip }: JourneyModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [input, setInput] = useState<WaterfallInput>(defaultInput)
  const [showLearnMore, setShowLearnMore] = useState(false)

  const step = journeySteps[currentStep]
  const progress = ((currentStep + 1) / journeySteps.length) * 100

  const updateInput = <K extends keyof WaterfallInput>(field: K, value: WaterfallInput[K]) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < journeySteps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setShowLearnMore(false)
    } else {
      onComplete(input)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setShowLearnMore(false)
    }
  }

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            <div className="grid gap-3 mt-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Return of Capital</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">LPs get their invested money back first</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Preferred Return</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">LPs receive their minimum hurdle return</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">GP Catch-Up</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">GP catches up to their target carry share</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-2">
                  <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">Profit Split</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Remaining profits shared LP/GP per carry rate</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'fund-basics':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fundSize" className="flex items-center gap-2">
                  Total Fund Size (Committed Capital)
                  <InfoPopover>
                    The total amount LPs have committed to invest. This represents the maximum capital available to deploy.
                  </InfoPopover>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="fundSize"
                    type="number"
                    min={0}
                    step={1000000}
                    value={input.fundSize}
                    onChange={(e) => updateInput('fundSize', parseFloat(e.target.value) || 0)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Typical range: $25M-$10B depending on strategy
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributedCapital" className="flex items-center gap-2">
                  Contributed Capital (Actually Invested)
                  <InfoPopover>
                    How much capital was actually drawn from LPs and deployed into investments. May be less than committed if fund wasn't fully invested.
                  </InfoPopover>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="contributedCapital"
                    type="number"
                    min={0}
                    step={1000000}
                    value={input.contributedCapital}
                    onChange={(e) => updateInput('contributedCapital', parseFloat(e.target.value) || 0)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Usually 85-100% of committed capital
                </p>
              </div>
            </div>
          </div>
        )

      case 'exit-proceeds':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grossProceeds" className="flex items-center gap-2">
                  Gross Exit Proceeds
                  <InfoPopover>
                    Total cash returned from all exits and distributions before any waterfall splits.
                  </InfoPopover>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="grossProceeds"
                    type="number"
                    min={0}
                    step={1000000}
                    value={input.grossProceeds}
                    onChange={(e) => updateInput('grossProceeds', parseFloat(e.target.value) || 0)}
                    className="pl-7"
                  />
                </div>
              </div>

              {/* Quick scenario buttons */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Quick scenarios:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '1.5x', multiplier: 1.5 },
                    { label: '2.0x', multiplier: 2.0 },
                    { label: '2.5x', multiplier: 2.5 },
                    { label: '3.0x', multiplier: 3.0 }
                  ].map(({ label, multiplier }) => (
                    <Button
                      key={label}
                      variant={input.grossProceeds === input.contributedCapital * multiplier ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateInput('grossProceeds', input.contributedCapital * multiplier)}
                    >
                      {label} Return
                    </Button>
                  ))}
                </div>
              </div>

              {input.contributedCapital > 0 && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Gross Multiple: </span>
                    <span className="font-semibold text-foreground">
                      {(input.grossProceeds / input.contributedCapital).toFixed(2)}x
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Total Profit: </span>
                    <span className="font-semibold text-foreground">
                      ${((input.grossProceeds - input.contributedCapital) / 1000000).toFixed(1)}M
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'structure':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => updateInput('waterfallType', 'european')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  input.waterfallType === 'european'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <h4 className="font-semibold text-foreground mb-2">European (Whole-Fund)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  GP receives carry only after the entire fund returns capital + pref to all LPs.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ More LP-friendly</li>
                  <li>✓ Standard in buyout PE</li>
                  <li>✓ No clawback typically needed</li>
                </ul>
              </button>

              <button
                onClick={() => updateInput('waterfallType', 'american')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  input.waterfallType === 'american'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <h4 className="font-semibold text-foreground mb-2">American (Deal-by-Deal)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  GP can receive carry on individual deals before the full fund is returned.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Earlier GP carry</li>
                  <li>✓ Common in VC</li>
                  <li>✓ Requires clawback provision</li>
                </ul>
              </button>
            </div>
          </div>
        )

      case 'preferred-return':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefRate" className="flex items-center gap-2">
                  Preferred Return Rate (Annual %)
                  <InfoPopover>
                    The annual hurdle rate LPs must receive before GP earns carry.
                  </InfoPopover>
                </Label>
                <div className="relative">
                  <Input
                    id="prefRate"
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={input.prefRate * 100}
                    onChange={(e) => updateInput('prefRate', (parseFloat(e.target.value) || 0) / 100)}
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[0, 6, 8, 10].map((rate) => (
                    <Button
                      key={rate}
                      variant={input.prefRate * 100 === rate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateInput('prefRate', rate / 100)}
                    >
                      {rate === 0 ? 'None' : `${rate}%`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefCompounding" className="flex items-center gap-2">
                  Compounding Method
                  <InfoPopover>
                    Simple: Pref = Capital × Rate × Years<br />
                    Compound: Pref compounds annually like a loan
                  </InfoPopover>
                </Label>
                <Select
                  value={input.prefCompounding}
                  onValueChange={(value) => updateInput('prefCompounding', value as 'simple' | 'compound')}
                >
                  <SelectTrigger id="prefCompounding">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple (Non-Compounding)</SelectItem>
                    <SelectItem value="compound">Compound (Annual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {input.prefRate > 0 && input.contributedCapital > 0 && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Over 5 years, {input.prefRate * 100}% {input.prefCompounding} pref on ${(input.contributedCapital / 1000000).toFixed(0)}M = {' '}
                    <span className="font-semibold text-foreground">
                      ${(input.prefCompounding === 'simple'
                        ? input.contributedCapital * input.prefRate * 5
                        : input.contributedCapital * (Math.pow(1 + input.prefRate, 5) - 1)
                      / 1000000).toFixed(1)}M
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'carried-interest':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="carryRate" className="flex items-center gap-2">
                  Carried Interest Rate (%)
                  <InfoPopover>
                    GP's share of profits after pref hurdle is cleared. This is the main GP incentive.
                  </InfoPopover>
                </Label>
                <div className="relative">
                  <Input
                    id="carryRate"
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    value={input.carryRate * 100}
                    onChange={(e) => updateInput('carryRate', (parseFloat(e.target.value) || 0) / 100)}
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[15, 20, 25, 30].map((rate) => (
                    <Button
                      key={rate}
                      variant={input.carryRate * 100 === rate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateInput('carryRate', rate / 100)}
                    >
                      {rate}%
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  20% is industry standard ("2 and 20")
                </p>
              </div>
            </div>
          </div>
        )

      case 'catch-up':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="hasCatchUp"
                  checked={input.hasCatchUp}
                  onCheckedChange={(checked) => updateInput('hasCatchUp', checked as boolean)}
                />
                <Label htmlFor="hasCatchUp" className="cursor-pointer">
                  Enable GP Catch-Up Provision
                </Label>
              </div>

              <AnimatePresence>
                {input.hasCatchUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="catchUpRate" className="flex items-center gap-2">
                      Catch-Up Rate (%)
                      <InfoPopover>
                        100% = GP gets all distributions during catch-up<br />
                        80% = GP gets 80%, LP gets 20%<br />
                        50% = Split 50/50 during catch-up
                      </InfoPopover>
                    </Label>
                    <div className="relative">
                      <Input
                        id="catchUpRate"
                        type="number"
                        min={50}
                        max={100}
                        step={10}
                        value={input.catchUpRate * 100}
                        onChange={(e) => updateInput('catchUpRate', (parseFloat(e.target.value) || 0) / 100)}
                        className="pr-7"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[50, 80, 100].map((rate) => (
                        <Button
                          key={rate}
                          variant={input.catchUpRate * 100 === rate ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateInput('catchUpRate', rate / 100)}
                        >
                          {rate}%
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">How catch-up works:</p>
                <p className="text-sm text-muted-foreground">
                  {input.hasCatchUp
                    ? `After LPs receive their pref, GP gets ${input.catchUpRate * 100}% of distributions until they've received ${input.carryRate * 100}% of total profits. Then it splits ${(100 - input.carryRate * 100)}/${input.carryRate * 100} LP/GP.`
                    : `Without catch-up, GP earns ${input.carryRate * 100}% carry only on profits ABOVE the preferred return amount. Total GP share of profits will be less than ${input.carryRate * 100}%.`
                  }
                </p>
              </div>
            </div>
          </div>
        )

      case 'gp-commitment':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gpCommitmentPercent" className="flex items-center gap-2">
                  GP Commitment (% of Fund)
                  <InfoPopover>
                    GP's own capital invested alongside LPs. Shows alignment of interests.
                  </InfoPopover>
                </Label>
                <div className="relative">
                  <Input
                    id="gpCommitmentPercent"
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={input.gpCommitmentPercent * 100}
                    onChange={(e) => updateInput('gpCommitmentPercent', (parseFloat(e.target.value) || 0) / 100)}
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 5].map((rate) => (
                    <Button
                      key={rate}
                      variant={input.gpCommitmentPercent * 100 === rate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateInput('gpCommitmentPercent', rate / 100)}
                    >
                      {rate}%
                    </Button>
                  ))}
                </div>
              </div>

              {input.fundSize > 0 && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <span className="text-muted-foreground">GP Commitment Amount: </span>
                    <span className="font-semibold text-foreground">
                      ${((input.fundSize * input.gpCommitmentPercent) / 1000000).toFixed(2)}M
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'timing':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yearsToExit" className="flex items-center gap-2">
                  Years to Exit
                  <InfoPopover>
                    Time from investment to exit. Affects preferred return accrual.
                  </InfoPopover>
                </Label>
                <Input
                  id="yearsToExit"
                  type="number"
                  min={1}
                  max={15}
                  step={0.5}
                  value={input.yearsToExit}
                  onChange={(e) => updateInput('yearsToExit', parseFloat(e.target.value) || 5)}
                />
                <div className="flex gap-2 mt-2">
                  {[3, 5, 7, 10].map((years) => (
                    <Button
                      key={years}
                      variant={input.yearsToExit === years ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateInput('yearsToExit', years)}
                    >
                      {years} years
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Buyout: 3-5 years | Growth: 3-5 years | VC: 5-7 years
                </p>
              </div>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Fund Size</p>
                  <p className="font-semibold">${(input.fundSize / 1000000).toFixed(0)}M</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contributed</p>
                  <p className="font-semibold">${(input.contributedCapital / 1000000).toFixed(0)}M</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gross Proceeds</p>
                  <p className="font-semibold">${(input.grossProceeds / 1000000).toFixed(0)}M</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gross Multiple</p>
                  <p className="font-semibold">{(input.grossProceeds / input.contributedCapital).toFixed(2)}x</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Waterfall Type</p>
                  <p className="font-semibold capitalize">{input.waterfallType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hold Period</p>
                  <p className="font-semibold">{input.yearsToExit} years</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pref Rate</p>
                  <p className="font-semibold">{(input.prefRate * 100).toFixed(1)}% ({input.prefCompounding})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carry Rate</p>
                  <p className="font-semibold">{(input.carryRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Catch-Up</p>
                  <p className="font-semibold">{input.hasCatchUp ? `${(input.catchUpRate * 100).toFixed(0)}%` : 'None'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GP Commitment</p>
                  <p className="font-semibold">{(input.gpCommitmentPercent * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
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
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              {step.icon}
            </div>
            <div>
              <CardTitle className="text-xl">{step.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{step.subtitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip Tutorial
          </Button>
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
                  onClick={() => setShowLearnMore(!showLearnMore)}
                  className="text-primary"
                >
                  {showLearnMore ? 'Hide Details' : 'Learn More →'}
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
            {currentStep === journeySteps.length - 1 ? 'Calculate Waterfall' : 'Continue'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
