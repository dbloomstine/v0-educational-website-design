"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Rocket,
  Sparkles,
  Check,
  ArrowRight,
  Trophy,
  Target,
  Zap,
  Star,
  PartyPopper,
  Building2,
  Scale,
  Users,
  Globe,
  Briefcase,
  TrendingUp,
  Home,
  Landmark,
  CreditCard,
  BarChart3,
  Search,
  Plus,
  CheckCircle2,
  Circle,
  Info,
} from 'lucide-react'
import { FundConfig, FundStrategy, FundSize, Jurisdiction } from './types'
import confetti from 'canvas-confetti'

// Service provider suggestions
const LAW_FIRMS = [
  { name: 'Kirkland & Ellis', description: 'Top PE/VC fund formation' },
  { name: 'Sidley Austin', description: 'Full-service fund practice' },
  { name: 'Simpson Thacher', description: 'Leading PE fund counsel' },
  { name: 'Ropes & Gray', description: 'Strong in PE and credit' },
  { name: 'Goodwin Procter', description: 'VC and growth equity focus' },
  { name: 'Schulte Roth & Zabel', description: 'Hedge fund specialists' },
  { name: 'Seward & Kissel', description: 'Hedge fund and VC' },
  { name: 'Dechert', description: 'Global funds practice' },
  { name: 'Proskauer Rose', description: 'Full-service fund formation' },
  { name: 'Willkie Farr', description: 'PE and credit funds' },
]

const FUND_ADMINS = [
  { name: 'Citco', description: 'Largest independent admin' },
  { name: 'SS&C', description: 'Technology-forward solutions' },
  { name: 'Apex Group', description: 'Global fund services' },
  { name: 'Gen II', description: 'PE and real assets focus' },
  { name: 'Standish Management', description: 'Emerging manager friendly' },
  { name: 'JTC', description: 'Full-service fund admin' },
  { name: 'Alter Domus', description: 'PE and credit specialists' },
  { name: 'CSC', description: 'Corporate and fund services' },
]

const AUDITORS = [
  { name: 'Deloitte', description: 'Big 4, full service' },
  { name: 'PwC', description: 'Big 4, global reach' },
  { name: 'EY', description: 'Big 4, strong fund practice' },
  { name: 'KPMG', description: 'Big 4, audit excellence' },
  { name: 'RSM', description: 'Great for emerging managers' },
  { name: 'Grant Thornton', description: 'Mid-tier, fund focused' },
  { name: 'EisnerAmper', description: 'Emerging manager specialists' },
  { name: 'WithumSmith+Brown', description: 'PE and VC focused' },
]

interface JourneyStep {
  id: string
  type: 'welcome' | 'single-select' | 'multi-select' | 'provider-select' | 'text-input' | 'info' | 'celebration' | 'summary'
  category?: string
  title: string
  subtitle?: string
  description?: string
  tip?: string
  options?: any[]
  configKey?: keyof FundConfig
  providerKey?: string
  icon?: React.ReactNode
  celebration?: boolean
}

const JOURNEY_STEPS: JourneyStep[] = [
  // Welcome
  {
    id: 'welcome',
    type: 'welcome',
    title: "Let's Launch Your Fund",
    subtitle: "Your guided journey to fund formation",
    description: "We'll walk you through every step of launching your fund. Answer a few questions, and we'll create your personalized roadmap.",
    icon: <Rocket className="h-16 w-16" />,
  },

  // Phase 1: Strategy & Planning
  {
    id: 'phase-1-intro',
    type: 'info',
    category: 'Strategy & Planning',
    title: 'Phase 1: Strategy & Planning',
    subtitle: "First, let's define your fund strategy",
    description: "This is where every successful fund starts. Your strategy decisions here will shape everything that follows.",
    icon: <Target className="h-12 w-12" />,
  },
  {
    id: 'strategy',
    type: 'single-select',
    category: 'Strategy & Planning',
    title: 'What type of fund are you launching?',
    subtitle: 'Choose the strategy that best describes your fund',
    tip: 'This affects your regulatory requirements, typical LPs, and timeline',
    configKey: 'strategy',
    options: [
      { value: 'VC', label: 'Venture Capital', description: 'Early-stage equity in startups', icon: <Zap className="h-6 w-6" /> },
      { value: 'PE', label: 'Private Equity', description: 'Buyouts and growth equity', icon: <Briefcase className="h-6 w-6" /> },
      { value: 'Private Credit', label: 'Private Credit', description: 'Direct lending strategies', icon: <CreditCard className="h-6 w-6" /> },
      { value: 'Hedge Fund', label: 'Hedge Fund', description: 'Long/short, multi-strategy', icon: <BarChart3 className="h-6 w-6" /> },
      { value: 'Real Estate', label: 'Real Estate', description: 'Property investments', icon: <Home className="h-6 w-6" /> },
      { value: 'Infrastructure', label: 'Infrastructure', description: 'Infrastructure & energy', icon: <Landmark className="h-6 w-6" /> },
    ],
  },
  {
    id: 'size',
    type: 'single-select',
    category: 'Strategy & Planning',
    title: "What's your target fund size?",
    subtitle: 'This shapes your infrastructure and LP expectations',
    tip: 'First-time VC funds average $75M; first-time PE funds average $150M',
    configKey: 'size',
    options: [
      { value: 'emerging', label: 'Emerging', description: 'Under $100M', sublabel: 'Perfect for first-time managers' },
      { value: 'mid', label: 'Mid-Size', description: '$100M - $500M', sublabel: 'Established but growing' },
      { value: 'large', label: 'Large', description: 'Over $500M', sublabel: 'Institutional scale' },
    ],
  },
  {
    id: 'jurisdiction',
    type: 'single-select',
    category: 'Strategy & Planning',
    title: 'Where will your fund be domiciled?',
    subtitle: 'This determines your legal structure',
    tip: '85% of first-time US managers use Delaware LP only',
    configKey: 'jurisdiction',
    options: [
      { value: 'US Onshore', label: 'US Onshore Only', description: 'Delaware LP - simplest setup', icon: <Globe className="h-5 w-5" /> },
      { value: 'US + Cayman', label: 'US + Offshore', description: 'Delaware + Cayman for non-US LPs', icon: <Globe className="h-5 w-5" /> },
      { value: 'EU/AIFMD', label: 'EU/AIFMD', description: 'European regulatory framework', icon: <Globe className="h-5 w-5" /> },
    ],
  },
  {
    id: 'anchor',
    type: 'single-select',
    category: 'Strategy & Planning',
    title: 'Do you have an anchor investor?',
    subtitle: 'An anchor can accelerate your timeline significantly',
    tip: 'Anchors typically commit 20-30% of the fund',
    configKey: 'hasAnchor',
    options: [
      { value: true, label: 'Yes, I have an anchor', description: 'Faster fundraising timeline', icon: <Users className="h-5 w-5" /> },
      { value: false, label: 'Not yet', description: 'Plan for 12-18+ months to raise', icon: <Search className="h-5 w-5" /> },
    ],
  },
  {
    id: 'phase-1-complete',
    type: 'celebration',
    category: 'Strategy & Planning',
    title: 'Strategy Defined!',
    subtitle: 'Phase 1 complete',
    description: "Great start! You've laid the foundation for your fund.",
    celebration: true,
  },

  // Phase 2: Service Providers
  {
    id: 'phase-2-intro',
    type: 'info',
    category: 'Service Providers',
    title: 'Phase 2: Your Team',
    subtitle: "Now let's build your support team",
    description: "The right service providers make all the difference. Let's identify who you'll work with.",
    icon: <Users className="h-12 w-12" />,
  },
  {
    id: 'law-firm',
    type: 'provider-select',
    category: 'Service Providers',
    title: 'Have you chosen a law firm?',
    subtitle: 'Fund counsel is one of your most important relationships',
    tip: 'Legal costs for first fund formation: $75-150K typical',
    providerKey: 'lawFirm',
    options: LAW_FIRMS,
  },
  {
    id: 'fund-admin',
    type: 'provider-select',
    category: 'Service Providers',
    title: 'Which fund administrator?',
    subtitle: 'They handle NAV, investor reporting, capital calls, and more',
    tip: 'Average admin fee for emerging managers: 5-15 bps of AUM',
    providerKey: 'fundAdmin',
    options: FUND_ADMINS,
  },
  {
    id: 'auditor',
    type: 'provider-select',
    category: 'Service Providers',
    title: 'Who will audit your fund?',
    subtitle: 'Annual audits are typically required by your LPA',
    tip: 'Audit fees for emerging managers: $30-75K annually',
    providerKey: 'auditor',
    options: AUDITORS,
  },
  {
    id: 'phase-2-complete',
    type: 'celebration',
    category: 'Service Providers',
    title: 'Team Assembled!',
    subtitle: 'Phase 2 complete',
    description: "Your key service providers are identified. Now let's see your roadmap!",
    celebration: true,
  },

  // Summary
  {
    id: 'summary',
    type: 'summary',
    title: "Your Fund Launch Roadmap",
    subtitle: "Here's your personalized plan",
  },
]

interface JourneyModeProps {
  onComplete: (config: FundConfig, providers: Record<string, string>) => void
  onSkip: () => void
}

export function JourneyMode({ onComplete, onSkip }: JourneyModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1) // 1 for forward, -1 for backward
  const [config, setConfig] = useState<Partial<FundConfig>>({})
  const [providers, setProviders] = useState<Record<string, string>>({})
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})
  const [isAnimating, setIsAnimating] = useState(false)

  const step = JOURNEY_STEPS[currentStep]
  const totalSteps = JOURNEY_STEPS.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  // Calculate phase progress
  const phases = ['Strategy & Planning', 'Service Providers']
  const currentPhaseIndex = phases.indexOf(step.category || '')
  const stepsInCurrentPhase = JOURNEY_STEPS.filter(s => s.category === step.category).length
  const currentStepInPhase = JOURNEY_STEPS.filter(s => s.category === step.category).findIndex(s => s.id === step.id) + 1

  const canProceed = useCallback(() => {
    if (step.type === 'welcome' || step.type === 'info' || step.type === 'celebration' || step.type === 'summary') {
      return true
    }
    if (step.type === 'single-select' && step.configKey) {
      return config[step.configKey] !== undefined
    }
    if (step.type === 'provider-select' && step.providerKey) {
      return providers[step.providerKey] !== undefined || showCustomInput[step.id]
    }
    return true
  }, [step, config, providers, showCustomInput])

  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#22c55e'],
    })
  }, [])

  useEffect(() => {
    if (step.celebration) {
      triggerCelebration()
    }
  }, [step.celebration, triggerCelebration])

  const goToNext = () => {
    if (currentStep < totalSteps - 1 && canProceed()) {
      setDirection(1)
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsAnimating(false)
      }, 200)
    } else if (currentStep === totalSteps - 1) {
      // Complete the journey
      onComplete(config as FundConfig, providers)
    }
  }

  const goToPrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleSelect = (value: any) => {
    if (step.configKey) {
      setConfig(prev => ({ ...prev, [step.configKey!]: value }))
      // Auto-advance after selection with a slight delay
      setTimeout(() => goToNext(), 300)
    }
  }

  const handleProviderSelect = (name: string) => {
    if (step.providerKey) {
      setProviders(prev => ({ ...prev, [step.providerKey!]: name }))
      setShowCustomInput(prev => ({ ...prev, [step.id]: false }))
      setTimeout(() => goToNext(), 300)
    }
  }

  const handleCustomProvider = () => {
    if (step.providerKey && customInputs[step.id]) {
      setProviders(prev => ({ ...prev, [step.providerKey!]: customInputs[step.id] }))
      setTimeout(() => goToNext(), 300)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed()) {
      goToNext()
    }
  }

  // Animation variants
  const containerVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-accent/20 overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Phase indicator */}
      {step.category && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {step.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentStepInPhase}/{stepsInCurrentPhase}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip to checklist
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={containerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-2xl mx-auto text-center"
          >
            {/* Welcome Step */}
            {step.type === 'welcome' && (
              <div className="space-y-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative bg-gradient-to-br from-primary to-purple-600 p-6 rounded-3xl text-white">
                      {step.icon}
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {step.title}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {step.subtitle}
                  </p>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {step.description}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <Button
                    size="lg"
                    onClick={goToNext}
                    className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <button
                    onClick={onSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    I've done this before - skip to checklist
                  </button>
                </div>
              </div>
            )}

            {/* Info Step */}
            {step.type === 'info' && (
              <div className="space-y-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="bg-accent p-4 rounded-2xl text-primary">
                    {step.icon}
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold">{step.title}</h2>
                  <p className="text-xl text-muted-foreground">{step.subtitle}</p>
                  <p className="text-muted-foreground max-w-md mx-auto">{step.description}</p>
                </div>

                <Button size="lg" onClick={goToNext} className="rounded-full px-8">
                  Continue
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Single Select Step */}
            {step.type === 'single-select' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-3xl md:text-4xl font-bold">{step.title}</h2>
                  <p className="text-lg text-muted-foreground">{step.subtitle}</p>
                </div>

                <div className="grid gap-3 max-w-xl mx-auto">
                  {step.options?.map((option: any, index: number) => {
                    const isSelected = config[step.configKey!] === option.value
                    return (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        )}
                      >
                        {option.icon && (
                          <div className={cn(
                            "p-3 rounded-xl",
                            isSelected ? "bg-primary text-white" : "bg-accent"
                          )}>
                            {option.icon}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                          {option.sublabel && (
                            <div className="text-xs text-primary mt-1">{option.sublabel}</div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-6 w-6 text-primary" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {step.tip && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-4 max-w-md mx-auto"
                  >
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{step.tip}</span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Provider Select Step */}
            {step.type === 'provider-select' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl md:text-4xl font-bold">{step.title}</h2>
                  <p className="text-lg text-muted-foreground">{step.subtitle}</p>
                </div>

                {!showCustomInput[step.id] ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                      {step.options?.slice(0, 6).map((option: any, index: number) => {
                        const isSelected = providers[step.providerKey!] === option.name
                        return (
                          <motion.button
                            key={option.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleProviderSelect(option.name)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="font-medium">{option.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                          </motion.button>
                        )
                      })}
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => setShowCustomInput(prev => ({ ...prev, [step.id]: true }))}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Don't see yours? Add it
                      </button>
                      <button
                        onClick={goToNext}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Skip for now
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="max-w-md mx-auto space-y-4">
                    <Input
                      placeholder="Enter your provider name..."
                      value={customInputs[step.id] || ''}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, [step.id]: e.target.value }))}
                      className="text-center text-lg py-6"
                      autoFocus
                    />
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowCustomInput(prev => ({ ...prev, [step.id]: false }))}
                      >
                        Back to list
                      </Button>
                      <Button
                        onClick={handleCustomProvider}
                        disabled={!customInputs[step.id]}
                      >
                        Continue
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step.tip && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-4 max-w-md mx-auto"
                  >
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{step.tip}</span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Celebration Step */}
            {step.type === 'celebration' && (
              <div className="space-y-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="flex justify-center"
                >
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-3xl text-white">
                    <Trophy className="h-16 w-16" />
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold">{step.title}</h2>
                  <p className="text-xl text-primary font-medium">{step.subtitle}</p>
                  <p className="text-muted-foreground max-w-md mx-auto">{step.description}</p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button size="lg" onClick={goToNext} className="rounded-full px-8">
                    Continue Your Journey
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            )}

            {/* Summary Step */}
            {step.type === 'summary' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-3xl md:text-4xl font-bold">{step.title}</h2>
                  <p className="text-lg text-muted-foreground">{step.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                  <div className="p-4 rounded-xl bg-accent/50 border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Strategy</div>
                    <div className="font-semibold">{config.strategy || 'Not set'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50 border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Target Size</div>
                    <div className="font-semibold capitalize">{config.size || 'Not set'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50 border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Jurisdiction</div>
                    <div className="font-semibold">{config.jurisdiction || 'Not set'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50 border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Anchor</div>
                    <div className="font-semibold">{config.hasAnchor ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {Object.keys(providers).length > 0 && (
                  <div className="max-w-lg mx-auto text-left space-y-3">
                    <h3 className="font-semibold text-center">Your Team</h3>
                    {providers.lawFirm && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <span className="text-muted-foreground">Law Firm</span>
                        <span className="font-medium">{providers.lawFirm}</span>
                      </div>
                    )}
                    {providers.fundAdmin && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <span className="text-muted-foreground">Fund Admin</span>
                        <span className="font-medium">{providers.fundAdmin}</span>
                      </div>
                    )}
                    {providers.auditor && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <span className="text-muted-foreground">Auditor</span>
                        <span className="font-medium">{providers.auditor}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-md mx-auto">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">
                    <span className="font-medium">Your personalized checklist is ready!</span>
                  </span>
                </div>

                <Button
                  size="lg"
                  onClick={() => onComplete(config as FundConfig, providers)}
                  className="rounded-full px-8 bg-gradient-to-r from-primary to-purple-600"
                >
                  View My Roadmap
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {currentStep > 0 && step.type !== 'summary' && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={goToPrev}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {(step.type === 'info' || step.type === 'celebration') && (
            <Button
              size="lg"
              onClick={goToNext}
              className="rounded-full px-6"
            >
              Continue
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      {/* Keyboard hint */}
      <div className="fixed bottom-4 right-4 text-xs text-muted-foreground hidden md:block">
        Press <kbd className="px-1.5 py-0.5 rounded bg-accent">Enter</kbd> to continue
      </div>
    </div>
  )
}
