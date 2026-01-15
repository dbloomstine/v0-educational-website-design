"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Compass,
  Building2,
  Globe,
  Users,
  ChevronRight,
  ChevronLeft,
  Rocket,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { FundConfig, FundStrategy, FundSize, Jurisdiction } from './types'

interface OnboardingWizardProps {
  onComplete: (config: FundConfig) => void
  onSkip: () => void
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to the Fund Launch Guide',
    description: 'Get a personalized roadmap for launching your fund.',
  },
  {
    id: 'strategy',
    title: 'What type of fund are you launching?',
    description: 'This affects your regulatory requirements and typical timeline.',
  },
  {
    id: 'size',
    title: 'What\'s your target fund size?',
    description: 'This influences infrastructure needs and LP expectations.',
  },
  {
    id: 'jurisdiction',
    title: 'Where will your fund be domiciled?',
    description: 'This determines your legal structure and regulatory filings.',
  },
  {
    id: 'anchor',
    title: 'Do you have an anchor investor?',
    description: 'Anchor investors can significantly accelerate your timeline.',
  },
  {
    id: 'preview',
    title: 'Your customized roadmap is ready!',
    description: 'Here\'s what we\'ve prepared based on your inputs.',
  },
]

const STRATEGY_OPTIONS: { value: FundStrategy; label: string; description: string }[] = [
  { value: 'VC', label: 'Venture Capital', description: 'Early-stage equity investments in startups' },
  { value: 'PE', label: 'Private Equity', description: 'Buyouts and growth equity investments' },
  { value: 'Private Credit', label: 'Private Credit', description: 'Direct lending and credit strategies' },
  { value: 'Hedge Fund', label: 'Hedge Fund', description: 'Multi-strategy, long/short, or other hedge strategies' },
  { value: 'Real Estate', label: 'Real Estate', description: 'Property investments and development' },
  { value: 'Infrastructure', label: 'Infrastructure', description: 'Infrastructure and energy investments' },
]

const SIZE_OPTIONS: { value: FundSize; label: string; description: string; range: string }[] = [
  { value: 'emerging', label: 'Emerging Manager', description: 'First fund or smaller AUM', range: '< $100M' },
  { value: 'mid', label: 'Mid-Size', description: 'Established but not institutional scale', range: '$100M - $500M' },
  { value: 'large', label: 'Large', description: 'Institutional-scale fund', range: '> $500M' },
]

const JURISDICTION_OPTIONS: { value: Jurisdiction; label: string; description: string }[] = [
  { value: 'US Onshore', label: 'US Onshore Only', description: 'Delaware LP structure, simplest setup' },
  { value: 'US + Cayman', label: 'US + Offshore', description: 'Delaware + Cayman feeder for non-US/tax-exempt LPs' },
  { value: 'EU/AIFMD', label: 'EU/AIFMD', description: 'European regulatory framework' },
]

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<Partial<FundConfig>>({
    strategy: undefined,
    size: undefined,
    jurisdiction: undefined,
    hasAnchor: undefined,
  })

  const step = STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1
  const canProceed = currentStep === 0 || currentStep === STEPS.length - 1 || (
    (step.id === 'strategy' && config.strategy) ||
    (step.id === 'size' && config.size) ||
    (step.id === 'jurisdiction' && config.jurisdiction) ||
    (step.id === 'anchor' && config.hasAnchor !== undefined)
  )

  const handleNext = () => {
    if (isLastStep) {
      onComplete(config as FundConfig)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const getStepProgress = () => {
    return ((currentStep) / (STEPS.length - 1)) * 100
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Progress bar */}
        <div className="h-1 bg-muted overflow-hidden rounded-t-lg">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>

        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {step.id === 'welcome' && <Sparkles className="h-12 w-12 text-primary" />}
            {step.id === 'strategy' && <Compass className="h-12 w-12 text-primary" />}
            {step.id === 'size' && <Building2 className="h-12 w-12 text-primary" />}
            {step.id === 'jurisdiction' && <Globe className="h-12 w-12 text-primary" />}
            {step.id === 'anchor' && <Users className="h-12 w-12 text-primary" />}
            {step.id === 'preview' && <Rocket className="h-12 w-12 text-primary" />}
          </div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
          <CardDescription className="text-base">{step.description}</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Welcome Step */}
          {step.id === 'welcome' && (
            <div className="space-y-6 text-center">
              <p className="text-muted-foreground leading-relaxed">
                Launching a fund involves many moving pieces—legal, regulatory, operational, and more.
                This interactive guide will help you understand each step, track your progress, and
                make sure you don&apos;t miss anything critical.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-accent/50">
                  <div className="text-2xl font-bold text-primary">8</div>
                  <div className="text-xs text-muted-foreground">Phases</div>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <div className="text-2xl font-bold text-primary">40+</div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <div className="text-2xl font-bold text-primary">Local</div>
                  <div className="text-xs text-muted-foreground">Saved</div>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Step */}
          {step.id === 'strategy' && (
            <RadioGroup
              value={config.strategy}
              onValueChange={(value) => setConfig(prev => ({ ...prev, strategy: value as FundStrategy }))}
              className="grid grid-cols-2 gap-3"
            >
              {STRATEGY_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-lg border-2 cursor-pointer transition-all",
                    config.strategy === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
                </Label>
              ))}
            </RadioGroup>
          )}

          {/* Size Step */}
          {step.id === 'size' && (
            <RadioGroup
              value={config.size}
              onValueChange={(value) => setConfig(prev => ({ ...prev, size: value as FundSize }))}
              className="space-y-3"
            >
              {SIZE_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                    config.size === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground block">{option.description}</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{option.range}</span>
                </Label>
              ))}
            </RadioGroup>
          )}

          {/* Jurisdiction Step */}
          {step.id === 'jurisdiction' && (
            <RadioGroup
              value={config.jurisdiction}
              onValueChange={(value) => setConfig(prev => ({ ...prev, jurisdiction: value as Jurisdiction }))}
              className="space-y-3"
            >
              {JURISDICTION_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    config.jurisdiction === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground block">{option.description}</span>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          )}

          {/* Anchor Step */}
          {step.id === 'anchor' && (
            <RadioGroup
              value={config.hasAnchor === undefined ? undefined : config.hasAnchor ? 'yes' : 'no'}
              onValueChange={(value) => setConfig(prev => ({ ...prev, hasAnchor: value === 'yes' }))}
              className="space-y-3"
            >
              <Label
                htmlFor="anchor-yes"
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  config.hasAnchor === true
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="yes" id="anchor-yes" />
                <div>
                  <span className="font-medium">Yes, I have an anchor investor</span>
                  <span className="text-xs text-muted-foreground block">
                    An anchor (typically 20-30% of fund) can significantly accelerate fundraising
                  </span>
                </div>
              </Label>
              <Label
                htmlFor="anchor-no"
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  config.hasAnchor === false
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="no" id="anchor-no" />
                <div>
                  <span className="font-medium">No / Not yet</span>
                  <span className="text-xs text-muted-foreground block">
                    Plan for a longer fundraising timeline (12-18+ months typical)
                  </span>
                </div>
              </Label>
            </RadioGroup>
          )}

          {/* Preview Step */}
          {step.id === 'preview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Strategy</div>
                  <div className="font-semibold">{config.strategy}</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Size</div>
                  <div className="font-semibold capitalize">{config.size}</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Jurisdiction</div>
                  <div className="font-semibold">{config.jurisdiction}</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Anchor Investor</div>
                  <div className="font-semibold">{config.hasAnchor ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">Your roadmap is customized</span>
                  <span className="text-muted-foreground block">
                    Tasks and timelines have been adjusted based on your inputs
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div>
              {isFirstStep ? (
                <Button variant="ghost" onClick={onSkip}>
                  Skip setup
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Step indicators */}
              <div className="flex items-center gap-1.5 mr-4">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      index === currentStep
                        ? "w-4 bg-primary"
                        : index < currentStep
                          ? "bg-primary"
                          : "bg-border"
                    )}
                  />
                ))}
              </div>

              <Button onClick={handleNext} disabled={!canProceed}>
                {isLastStep ? (
                  <>
                    Get Started
                    <Rocket className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
