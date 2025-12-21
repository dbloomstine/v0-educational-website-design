"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
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
  Calculator,
  X,
  Rocket,
  Target,
  PiggyBank,
  Clock,
  ArrowRight,
  Plus,
  Minus,
  Zap,
  Award,
  PartyPopper,
  HelpCircle
} from 'lucide-react'
import { BudgetData, TeamMember } from './types'
import { formatCurrency } from './budget-calculator'

// Help tooltip component
function HelpTooltip({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-1.5 text-white/40 hover:text-white/70 transition-colors"
        type="button"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-64 p-3 text-sm bg-slate-700 border border-white/10 rounded-lg shadow-xl left-0 top-full mt-1 text-white/80">
          {content}
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-slate-700 border-l border-t border-white/10 rotate-45" />
        </div>
      )}
    </div>
  )
}

// Fund strategy options
const FUND_STRATEGIES = [
  {
    id: 'vc',
    name: 'Venture Capital',
    icon: TrendingUp,
    description: 'Early to growth stage equity investments',
    typicalSize: { min: 25, max: 150, default: 50 },
    typicalFee: 2.0,
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'pe',
    name: 'Private Equity',
    icon: Building2,
    description: 'Buyouts and control investments',
    typicalSize: { min: 100, max: 500, default: 150 },
    typicalFee: 2.0,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'credit',
    name: 'Private Credit',
    icon: DollarSign,
    description: 'Direct lending and structured credit',
    typicalSize: { min: 100, max: 500, default: 200 },
    typicalFee: 1.5,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'hedge',
    name: 'Hedge Fund',
    icon: Calculator,
    description: 'Liquid strategies and trading',
    typicalSize: { min: 50, max: 500, default: 100 },
    typicalFee: 2.0,
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 're',
    name: 'Real Estate',
    icon: Building2,
    description: 'Property and real assets',
    typicalSize: { min: 75, max: 300, default: 100 },
    typicalFee: 1.5,
    color: 'from-rose-500 to-pink-600'
  },
  {
    id: 'infra',
    name: 'Infrastructure',
    icon: Briefcase,
    description: 'Infrastructure and essential services',
    typicalSize: { min: 200, max: 1000, default: 300 },
    typicalFee: 1.5,
    color: 'from-cyan-500 to-blue-600'
  }
]

// Size tier options
const SIZE_TIERS = [
  { id: 'emerging', name: 'Emerging Manager', range: '$25M - $100M', minSize: 25, maxSize: 100 },
  { id: 'established', name: 'Established', range: '$100M - $300M', minSize: 100, maxSize: 300 },
  { id: 'institutional', name: 'Institutional', range: '$300M+', minSize: 300, maxSize: 1000 }
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
      { id: '6', role: 'CFO', monthlyCost: 20000 },
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
      { id: '7', role: 'CFO', monthlyCost: 22000 },
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
      { id: '5', role: 'Trader', monthlyCost: 18000 },
      { id: '6', role: 'COO/CFO', monthlyCost: 25000 },
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
      { id: '6', role: 'CFO', monthlyCost: 22000 },
    ],
  },
}

// Operations expense templates by size tier
const OPERATIONS_TEMPLATES: Record<string, { id: string; name: string; monthlyCost: number }[]> = {
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
const OVERHEAD_TEMPLATES: Record<string, { id: string; name: string; monthlyCost: number }[]> = {
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

// Available roles for team building
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
]

// Starting capital quick select options
const CAPITAL_OPTIONS = [
  { amount: 250000, label: '$250K', description: 'Lean start' },
  { amount: 500000, label: '$500K', description: 'Typical seed' },
  { amount: 750000, label: '$750K', description: 'Comfortable runway' },
  { amount: 1000000, label: '$1M', description: 'Strong position' },
  { amount: 1500000, label: '$1.5M', description: 'Well-capitalized' },
  { amount: 2000000, label: '$2M+', description: 'Institutional-grade' },
]

// Journey phases
const PHASES = [
  { id: 1, name: 'Strategy', icon: Target },
  { id: 2, name: 'Fund Details', icon: Briefcase },
  { id: 3, name: 'Team', icon: Users },
  { id: 4, name: 'Capital', icon: PiggyBank },
  { id: 5, name: 'Review', icon: Award },
]

interface JourneyStep {
  id: string
  type: 'welcome' | 'select' | 'input' | 'team' | 'capital' | 'celebration' | 'review'
  phase: number
  phaseName: string
  title: string
  subtitle?: string
  options?: Array<{ id: string; label: string; description?: string; icon?: any; color?: string }>
}

// Define the journey steps
const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'welcome',
    type: 'welcome',
    phase: 0,
    phaseName: 'Welcome',
    title: 'Build Your Budget',
    subtitle: 'Let\'s create a customized management company budget in just a few minutes.'
  },
  {
    id: 'strategy',
    type: 'select',
    phase: 1,
    phaseName: 'Strategy',
    title: 'What type of fund?',
    subtitle: 'This helps us set appropriate benchmarks for your budget.'
  },
  {
    id: 'celebration-1',
    type: 'celebration',
    phase: 1,
    phaseName: 'Strategy',
    title: 'Great choice!',
    subtitle: 'Now let\'s define your fund details.'
  },
  {
    id: 'fund-size',
    type: 'input',
    phase: 2,
    phaseName: 'Fund Details',
    title: 'Target fund size?',
    subtitle: 'Enter your target AUM in millions.'
  },
  {
    id: 'fee-rate',
    type: 'input',
    phase: 2,
    phaseName: 'Fund Details',
    title: 'Management fee rate?',
    subtitle: 'The annual percentage fee on committed capital.'
  },
  {
    id: 'first-close',
    type: 'input',
    phase: 2,
    phaseName: 'Fund Details',
    title: 'Expected first close year?',
    subtitle: 'When do you expect to have your first close?'
  },
  {
    id: 'celebration-2',
    type: 'celebration',
    phase: 2,
    phaseName: 'Fund Details',
    title: 'Fund details locked in!',
    subtitle: 'Time to build your team.'
  },
  {
    id: 'team',
    type: 'team',
    phase: 3,
    phaseName: 'Team',
    title: 'Build your team',
    subtitle: 'We\'ve suggested a starting team. Customize it to match your plans.'
  },
  {
    id: 'celebration-3',
    type: 'celebration',
    phase: 3,
    phaseName: 'Team',
    title: 'Team assembled!',
    subtitle: 'Now let\'s plan your starting capital.'
  },
  {
    id: 'capital',
    type: 'capital',
    phase: 4,
    phaseName: 'Capital',
    title: 'Starting capital?',
    subtitle: 'How much cash do you have to cover expenses before fees flow?'
  },
  {
    id: 'celebration-4',
    type: 'celebration',
    phase: 4,
    phaseName: 'Capital',
    title: 'Almost there!',
    subtitle: 'Let\'s review your budget setup.'
  },
  {
    id: 'review',
    type: 'review',
    phase: 5,
    phaseName: 'Review',
    title: 'Your Budget Summary',
    subtitle: 'Review and finalize your management company budget.'
  }
]

interface JourneyModeProps {
  onComplete: (data: BudgetData) => void
  onSkip: () => void
}

const STORAGE_KEY = 'mcb-journey-progress'

interface SavedProgress {
  currentStepIndex: number
  strategy: string
  fundSize: number
  feeRate: number
  firstCloseYear: number
  sizeTier: string
  teamMembers: TeamMember[]
  startingCash: number
  customizedTeam: boolean
  savedAt: number
}

export function JourneyMode({ onComplete, onSkip }: JourneyModeProps) {
  // Load saved progress from localStorage
  const getSavedProgress = (): SavedProgress | null => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SavedProgress
        // Only use saved progress from last 24 hours
        if (Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
          return parsed
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }

  const savedProgress = getSavedProgress()

  const [currentStepIndex, setCurrentStepIndex] = useState(savedProgress?.currentStepIndex || 0)
  const [direction, setDirection] = useState(1)
  const [showResumePrompt, setShowResumePrompt] = useState(!!savedProgress && savedProgress.currentStepIndex > 0)

  // Budget configuration state
  const [strategy, setStrategy] = useState(savedProgress?.strategy || '')
  const [fundSize, setFundSize] = useState(savedProgress?.fundSize || 50)
  const [feeRate, setFeeRate] = useState(savedProgress?.feeRate || 2.0)
  const [firstCloseYear, setFirstCloseYear] = useState(savedProgress?.firstCloseYear || new Date().getFullYear())
  const [sizeTier, setSizeTier] = useState(savedProgress?.sizeTier || 'emerging')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(savedProgress?.teamMembers || [])
  const [startingCash, setStartingCash] = useState(savedProgress?.startingCash || 500000)
  const [customizedTeam, setCustomizedTeam] = useState(savedProgress?.customizedTeam || false)

  // Save progress to localStorage
  useEffect(() => {
    if (currentStepIndex > 0) {
      const progress: SavedProgress = {
        currentStepIndex,
        strategy,
        fundSize,
        feeRate,
        firstCloseYear,
        sizeTier,
        teamMembers,
        startingCash,
        customizedTeam,
        savedAt: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    }
  }, [currentStepIndex, strategy, fundSize, feeRate, firstCloseYear, sizeTier, teamMembers, startingCash, customizedTeam])

  // Clear saved progress on completion
  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const step = JOURNEY_STEPS[currentStepIndex]
  const selectedStrategy = FUND_STRATEGIES.find(s => s.id === strategy)

  // Determine size tier based on fund size
  const determineSizeTier = useCallback((size: number): string => {
    if (size < 100) return 'emerging'
    if (size < 300) return 'established'
    return 'institutional'
  }, [])

  // Update team when strategy or size tier changes
  useEffect(() => {
    if (strategy && !customizedTeam) {
      const tier = determineSizeTier(fundSize)
      setSizeTier(tier)
      const template = TEAM_TEMPLATES[strategy]?.[tier] || []
      setTeamMembers(template.map(t => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9)
      })))
    }
  }, [strategy, fundSize, customizedTeam, determineSizeTier])

  // Calculate monthly team cost
  const teamMonthlyCost = useMemo(() =>
    teamMembers.reduce((sum, m) => sum + m.monthlyCost, 0)
  , [teamMembers])

  // Calculate preview metrics
  const previewMetrics = useMemo(() => {
    const annualFees = fundSize * 1_000_000 * (feeRate / 100)
    const opsTemplate = OPERATIONS_TEMPLATES[sizeTier] || OPERATIONS_TEMPLATES.emerging
    const overheadTemplate = OVERHEAD_TEMPLATES[sizeTier] || OVERHEAD_TEMPLATES.emerging
    const opsCost = opsTemplate.reduce((s, o) => s + o.monthlyCost, 0)
    const overheadCost = overheadTemplate.reduce((s, o) => s + o.monthlyCost, 0)
    const monthlyBurn = teamMonthlyCost + opsCost + overheadCost
    const runwayMonths = monthlyBurn > 0 ? Math.floor(startingCash / monthlyBurn) : 0

    return {
      annualFees,
      monthlyFees: annualFees / 12,
      monthlyBurn,
      runwayMonths,
      opsCost,
      overheadCost
    }
  }, [fundSize, feeRate, sizeTier, teamMonthlyCost, startingCash])

  // Confetti celebration
  const triggerConfetti = useCallback(() => {
    const count = 200
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [])

  // Navigation handlers
  const goNext = useCallback(() => {
    if (currentStepIndex < JOURNEY_STEPS.length - 1) {
      setDirection(1)
      setCurrentStepIndex(prev => prev + 1)

      // Trigger confetti on celebration steps
      const nextStep = JOURNEY_STEPS[currentStepIndex + 1]
      if (nextStep?.type === 'celebration') {
        setTimeout(triggerConfetti, 300)
      }
    }
  }, [currentStepIndex, triggerConfetti])

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1)
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  // Strategy selection handler
  const handleStrategySelect = useCallback((strategyId: string) => {
    const strat = FUND_STRATEGIES.find(s => s.id === strategyId)
    if (strat) {
      setStrategy(strategyId)
      setFundSize(strat.typicalSize.default)
      setFeeRate(strat.typicalFee)
      setCustomizedTeam(false)
      setTimeout(goNext, 300)
    }
  }, [goNext])

  // Team management
  const addTeamMember = useCallback((roleInfo: typeof AVAILABLE_ROLES[0]) => {
    const tier = sizeTier as 'emerging' | 'established' | 'institutional'
    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      role: roleInfo.role,
      monthlyCost: roleInfo.cost[tier]
    }
    setTeamMembers(prev => [...prev, newMember])
    setCustomizedTeam(true)
  }, [sizeTier])

  const removeTeamMember = useCallback((id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id))
    setCustomizedTeam(true)
  }, [])

  const resetTeamToDefault = useCallback(() => {
    const template = TEAM_TEMPLATES[strategy]?.[sizeTier] || []
    setTeamMembers(template.map(t => ({
      ...t,
      id: Math.random().toString(36).substr(2, 9)
    })))
    setCustomizedTeam(false)
  }, [strategy, sizeTier])

  // Capital selection handler
  const handleCapitalSelect = useCallback((amount: number) => {
    setStartingCash(amount)
  }, [])

  // Complete the journey
  const handleComplete = useCallback(() => {
    const genId = () => Math.random().toString(36).substr(2, 9)
    const opsTemplate = OPERATIONS_TEMPLATES[sizeTier] || OPERATIONS_TEMPLATES.emerging
    const overheadTemplate = OVERHEAD_TEMPLATES[sizeTier] || OVERHEAD_TEMPLATES.emerging

    const budgetData: BudgetData = {
      startingCash,
      funds: [
        {
          id: genId(),
          name: 'Fund I',
          size: fundSize,
          feeRate,
          firstCloseYear
        }
      ],
      expenses: {
        team: teamMembers.map(t => ({ ...t, id: genId() })),
        operations: opsTemplate.map(o => ({ ...o, id: genId() })),
        overhead: overheadTemplate.map(o => ({ ...o, id: genId() }))
      }
    }

    clearProgress()
    triggerConfetti()
    setTimeout(() => onComplete(budgetData), 500)
  }, [startingCash, fundSize, feeRate, firstCloseYear, teamMembers, sizeTier, onComplete, triggerConfetti, clearProgress])

  // Reset all state and start over
  const handleStartOver = useCallback(() => {
    clearProgress()
    setCurrentStepIndex(0)
    setStrategy('')
    setFundSize(50)
    setFeeRate(2.0)
    setFirstCloseYear(new Date().getFullYear())
    setTeamMembers([])
    setStartingCash(500000)
    setCustomizedTeam(false)
    setShowResumePrompt(false)
  }, [clearProgress])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (step.type === 'welcome' || step.type === 'celebration') {
            e.preventDefault()
            goNext()
          }
          break
        case 'ArrowLeft':
        case 'Backspace':
          if (currentStepIndex > 0) {
            e.preventDefault()
            goPrev()
          }
          break
        case 'Escape':
          e.preventDefault()
          onSkip()
          break
        case '1': case '2': case '3': case '4': case '5': case '6':
          if (step.id === 'strategy') {
            const idx = parseInt(e.key) - 1
            if (FUND_STRATEGIES[idx]) {
              handleStrategySelect(FUND_STRATEGIES[idx].id)
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, currentStepIndex, goNext, goPrev, onSkip, handleStrategySelect])

  // Progress calculation
  const progress = useMemo(() => {
    const totalSteps = JOURNEY_STEPS.filter(s => s.type !== 'celebration').length
    const completedSteps = JOURNEY_STEPS.slice(0, currentStepIndex + 1).filter(s => s.type !== 'celebration').length
    return Math.round((completedSteps / totalSteps) * 100)
  }, [currentStepIndex])

  // Current phase for phase dots
  const currentPhase = step.phase

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-slate-900/90 to-transparent backdrop-blur-sm safe-area-top">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Budget Builder</span>
          </div>

          {/* Phase dots */}
          <div className="hidden sm:flex items-center gap-1.5 ml-4">
            {PHASES.map((phase) => {
              const isCompleted = currentPhase > phase.id
              const isCurrent = currentPhase === phase.id
              const PhaseIcon = phase.icon

              return (
                <div
                  key={phase.id}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full transition-all",
                    isCompleted && "bg-emerald-500/20",
                    isCurrent && "bg-white/20",
                    !isCompleted && !isCurrent && "bg-white/5"
                  )}
                  title={phase.name}
                >
                  <PhaseIcon className={cn(
                    "h-3.5 w-3.5",
                    isCompleted && "text-emerald-400",
                    isCurrent && "text-white",
                    !isCompleted && !isCurrent && "text-white/30"
                  )} />
                  {isCurrent && (
                    <span className="text-xs font-medium text-white">{phase.name}</span>
                  )}
                  {isCompleted && (
                    <Check className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-white/60">{progress}%</span>
          </div>

          {/* Start Over button - show after first step */}
          {currentStepIndex > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartOver}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Start Over</span>
            </Button>
          )}

          {/* Skip button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Skip</span>
          </Button>
        </div>
      </div>

      {/* Resume prompt */}
      {showResumePrompt && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Welcome Back!</h3>
              <p className="text-white/60">
                You have a budget in progress. Would you like to continue where you left off?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={handleStartOver}
                >
                  Start Fresh
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                  onClick={() => setShowResumePrompt(false)}
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="min-h-full flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-3xl"
            >
            {/* Welcome Step */}
            {step.type === 'welcome' && (
              <div className="text-center space-y-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center"
                >
                  <Calculator className="h-12 w-12 text-white" />
                </motion.div>

                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    {step.title}
                  </h1>
                  <p className="text-xl text-white/70 max-w-lg mx-auto">
                    {step.subtitle}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <div className="flex items-center gap-6 text-white/50 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>~3 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>5 steps</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={goNext}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8"
                  >
                    Let's Begin
                    <Rocket className="ml-2 h-5 w-5" />
                  </Button>

                  <p className="text-xs text-white/40">
                    Press Enter or → to continue
                  </p>
                </div>
              </div>
            )}

            {/* Strategy Selection Step */}
            {step.id === 'strategy' && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{step.title}</h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {FUND_STRATEGIES.map((strat, idx) => {
                    const Icon = strat.icon
                    const isSelected = strategy === strat.id

                    return (
                      <motion.button
                        key={strat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleStrategySelect(strat.id)}
                        className={cn(
                          "relative p-5 rounded-2xl text-left transition-all group",
                          "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                          isSelected && "ring-2 ring-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            strat.color
                          )}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-xs text-white/40 font-mono">{idx + 1}</span>
                        </div>
                        <h3 className="font-semibold text-white mb-1">{strat.name}</h3>
                        <p className="text-sm text-white/50">{strat.description}</p>

                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <Check className="h-5 w-5 text-emerald-400" />
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                <p className="text-center text-sm text-white/40">
                  Press 1-6 to select, or click an option
                </p>
              </div>
            )}

            {/* Celebration Steps */}
            {step.type === 'celebration' && (
              <div className="text-center space-y-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                >
                  <PartyPopper className="h-10 w-10 text-white" />
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                <Button
                  size="lg"
                  onClick={goNext}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Fund Size Input */}
            {step.id === 'fund-size' && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{step.title}</h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/60">$</span>
                    <Input
                      type="number"
                      value={fundSize}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setFundSize(value)
                        setSizeTier(determineSizeTier(value))
                      }}
                      className="pl-10 pr-16 h-16 text-3xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      placeholder="50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-white/60">M</span>
                  </div>

                  {/* Size tier badges */}
                  <div className="flex justify-center gap-2">
                    {SIZE_TIERS.map((tier) => {
                      const isActive = sizeTier === tier.id
                      return (
                        <button
                          key={tier.id}
                          onClick={() => {
                            setSizeTier(tier.id)
                            setFundSize(tier.minSize)
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm transition-all",
                            isActive
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                          )}
                        >
                          {tier.name}
                        </button>
                      )
                    })}
                  </div>

                  {selectedStrategy && (
                    <p className="text-center text-sm text-white/40">
                      Typical for {selectedStrategy.name}: ${selectedStrategy.typicalSize.min}M - ${selectedStrategy.typicalSize.max}M
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fee Rate Input */}
            {step.id === 'fee-rate' && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-white inline-flex items-center justify-center gap-1">
                    {step.title}
                    <HelpTooltip content="The management fee is typically 1.5-2.5% of committed capital, charged annually. This fee covers the GP's operating costs and is your primary revenue source." />
                  </h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={feeRate}
                      onChange={(e) => setFeeRate(parseFloat(e.target.value) || 0)}
                      className="pr-10 h-16 text-3xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      placeholder="2.0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-white/60">%</span>
                  </div>

                  {/* Quick select */}
                  <div className="flex justify-center gap-2">
                    {[1.0, 1.5, 2.0, 2.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setFeeRate(rate)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm transition-all",
                          feeRate === rate
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                        )}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>

                  {/* Preview calculation */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-center">
                      <p className="text-sm text-emerald-400 mb-1">Annual Fee Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(fundSize * 1_000_000 * (feeRate / 100))}
                      </p>
                      <p className="text-sm text-white/50">
                        {formatCurrency((fundSize * 1_000_000 * (feeRate / 100)) / 12)}/month
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* First Close Year Input */}
            {step.id === 'first-close' && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-white inline-flex items-center justify-center gap-1">
                    {step.title}
                    <HelpTooltip content="First close is when you start collecting management fees. Typically 6-18 months after starting fundraising. Most funds hold multiple closes as more LPs commit." />
                  </h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <Input
                    type="number"
                    value={firstCloseYear}
                    onChange={(e) => setFirstCloseYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="h-16 text-3xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    placeholder={new Date().getFullYear().toString()}
                  />

                  {/* Quick select */}
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((offset) => {
                      const year = new Date().getFullYear() + offset
                      return (
                        <button
                          key={year}
                          onClick={() => setFirstCloseYear(year)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm transition-all",
                            firstCloseYear === year
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                          )}
                        >
                          {year}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Team Building Step */}
            {step.type === 'team' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white inline-flex items-center justify-center gap-1">
                    {step.title}
                    <HelpTooltip content="Team costs typically represent 60-70% of management company expenses. Include fully-loaded costs (salary + bonus + benefits + payroll taxes)." />
                  </h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                {/* Current team */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-white/60" />
                      <span className="font-medium text-white">
                        Your Team ({teamMembers.length})
                      </span>
                    </div>
                    {customizedTeam && (
                      <button
                        onClick={resetTeamToDefault}
                        className="text-xs text-white/50 hover:text-white"
                      >
                        Reset to suggested
                      </button>
                    )}
                  </div>

                  {teamMembers.length > 0 ? (
                    <div className="grid gap-2 max-h-40 sm:max-h-48 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{member.role}</p>
                              <p className="text-xs text-white/50">{formatCurrency(member.monthlyCost)}/mo</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeTeamMember(member.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-white/40">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Add team members below</p>
                    </div>
                  )}

                  {/* Team cost summary */}
                  {teamMembers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm text-white/60">Team Cost</span>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(teamMonthlyCost)}/mo</p>
                        <p className="text-xs text-white/50">{formatCurrency(teamMonthlyCost * 12)}/year</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add team members */}
                <div className="space-y-3">
                  <p className="text-sm text-white/50">Add team members</p>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {AVAILABLE_ROLES.slice(0, 8).map((roleInfo) => {
                      const tier = sizeTier as 'emerging' | 'established' | 'institutional'
                      const cost = roleInfo.cost[tier]
                      return (
                        <button
                          key={roleInfo.role}
                          onClick={() => addTeamMember(roleInfo)}
                          className="px-2 sm:px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                        >
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Plus className="h-3 w-3 text-white/40 group-hover:text-emerald-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-white truncate">{roleInfo.role}</span>
                          </div>
                          <p className="text-xs text-white/40 ml-4 sm:ml-5">{formatCurrency(cost, true)}/mo</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Capital Selection Step */}
            {step.type === 'capital' && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-white inline-flex items-center justify-center gap-1">
                    {step.title}
                    <HelpTooltip content="This is your seed capital from personal funds, anchor LP contributions, or GP capital calls. It must cover expenses until management fee revenue begins flowing." />
                  </h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Quick select cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CAPITAL_OPTIONS.map((option) => {
                      const isSelected = startingCash === option.amount
                      return (
                        <button
                          key={option.amount}
                          onClick={() => handleCapitalSelect(option.amount)}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all border",
                            isSelected
                              ? "bg-emerald-500/20 border-emerald-500/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <p className="text-xl font-bold text-white">{option.label}</p>
                          <p className="text-sm text-white/50">{option.description}</p>
                          {isSelected && (
                            <Check className="h-4 w-4 text-emerald-400 mt-2" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom amount */}
                  <div className="relative max-w-xs mx-auto">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/60">$</span>
                    <Input
                      type="number"
                      value={startingCash}
                      onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                      className="pl-8 h-12 text-lg text-center bg-white/10 border-white/20 text-white"
                      placeholder="Custom amount"
                    />
                  </div>

                  {/* Runway preview */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-white/50 mb-1">Monthly Burn</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(previewMetrics.monthlyBurn, true)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">Est. Runway</p>
                        <p className={cn(
                          "text-lg font-bold",
                          previewMetrics.runwayMonths < 18 ? "text-amber-400" : "text-emerald-400"
                        )}>
                          {previewMetrics.runwayMonths} months
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">Monthly Fees</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(previewMetrics.monthlyFees, true)}</p>
                      </div>
                    </div>

                    {previewMetrics.runwayMonths < 18 && (
                      <p className="text-xs text-amber-400 text-center mt-3">
                        Most managers target 18-24 months of runway before first close fees arrive.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step.type === 'review' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-lg text-white/60">{step.subtitle}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Fund Summary */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-5 w-5 text-violet-400" />
                      <span className="font-medium text-white">Fund Details</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Strategy</span>
                        <span className="text-white">{selectedStrategy?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Target Size</span>
                        <span className="text-white">${fundSize}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Mgmt Fee</span>
                        <span className="text-white">{feeRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">First Close</span>
                        <span className="text-white">{firstCloseYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Summary */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-cyan-400" />
                      <span className="font-medium text-white">Your Team ({teamMembers.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {teamMembers.map((m) => (
                        <span key={m.id} className="px-2 py-0.5 rounded bg-white/10 text-xs text-white">
                          {m.role}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-white/60">
                      Total: {formatCurrency(teamMonthlyCost)}/month
                    </p>
                  </div>

                  {/* Financial Overview */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <span className="font-medium text-white">Financial Overview</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-white/60">Starting Cash</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(startingCash)}</p>
                      </div>
                      <div>
                        <p className="text-white/60">Annual Revenue</p>
                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(previewMetrics.annualFees)}</p>
                      </div>
                      <div>
                        <p className="text-white/60">Monthly Burn</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(previewMetrics.monthlyBurn)}</p>
                      </div>
                      <div>
                        <p className="text-white/60">Est. Runway</p>
                        <p className={cn(
                          "text-lg font-bold",
                          previewMetrics.runwayMonths < 18 ? "text-amber-400" : "text-emerald-400"
                        )}>
                          {previewMetrics.runwayMonths} months
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={goPrev}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Go Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Create My Budget
                  </Button>
                </div>

                <p className="text-center text-sm text-white/40">
                  You can customize all values after setup
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between bg-slate-900/95 backdrop-blur-sm border-t border-white/10 safe-area-bottom">
        <div>
          {currentStepIndex > 0 && step.type !== 'celebration' && (
            <Button
              variant="ghost"
              onClick={goPrev}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
          )}
        </div>

        <div className="text-sm text-white/40 hidden sm:block">
          {step.phaseName && step.phase > 0 && (
            <span>Phase {step.phase}: {step.phaseName}</span>
          )}
        </div>

        <div>
          {(step.type === 'team' || step.type === 'capital' || step.id === 'fund-size' || step.id === 'fee-rate' || step.id === 'first-close') && (
            <Button
              onClick={goNext}
              disabled={
                (step.type === 'team' && teamMembers.length === 0) ||
                (step.id === 'fund-size' && fundSize <= 0) ||
                (step.id === 'fee-rate' && feeRate <= 0) ||
                (step.type === 'capital' && startingCash <= 0)
              }
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
            >
              Continue
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
