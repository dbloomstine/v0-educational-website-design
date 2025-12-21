"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronLeft,
  Rocket,
  Sparkles,
  Check,
  ArrowRight,
  Trophy,
  Target,
  Zap,
  Users,
  Globe,
  Briefcase,
  Home,
  Landmark,
  CreditCard,
  BarChart3,
  Search,
  Plus,
  CheckCircle2,
  Info,
  SkipForward,
  Building,
  Shield,
  FileText,
  Settings,
  TrendingUp,
  Scale,
  Banknote,
  PiggyBank,
  LineChart,
} from 'lucide-react'
import { FundConfig } from './types'
import confetti from 'canvas-confetti'

// ============================================
// SERVICE PROVIDER DATA (15+ each, no descriptions)
// ============================================

const LAW_FIRMS = [
  'Kirkland & Ellis',
  'Sidley Austin',
  'Simpson Thacher & Bartlett',
  'Ropes & Gray',
  'Goodwin Procter',
  'Schulte Roth & Zabel',
  'Seward & Kissel',
  'Dechert',
  'Proskauer Rose',
  'Willkie Farr & Gallagher',
  'Latham & Watkins',
  'Davis Polk & Wardwell',
  'Debevoise & Plimpton',
  'Paul Weiss',
  'Fried Frank',
  'Morgan Lewis',
  'Cooley',
  'Lowenstein Sandler',
  'Akin Gump',
  'King & Spalding',
  'Weil, Gotshal & Manges',
  'Skadden, Arps',
  'Sullivan & Cromwell',
  'Cleary Gottlieb',
  'Cravath, Swaine & Moore',
  'Gibson, Dunn & Crutcher',
  'White & Case',
  'Jones Day',
  'Milbank',
  'O\'Melveny & Myers',
  'Shearman & Sterling',
  'Winston & Strawn',
  'Orrick',
  'Katten Muchin',
  'K&L Gates',
]

const FUND_ADMINISTRATORS = [
  'Citco Fund Services',
  'SS&C Technologies',
  'Apex Group',
  'Gen II Fund Services',
  'Standish Management',
  'JTC Group',
  'Alter Domus',
  'CSC Global',
  'Trident Trust',
  'Maples Group',
  'Intertrust Group',
  'U.S. Bank Global Fund Services',
  'State Street',
  'Northern Trust',
  'SEI Investments',
  'BNY Mellon',
  'MUFG Investor Services',
  'IQ-EQ',
  'Conifer Financial Services',
  'Circle Partners',
  'Formidium',
  'Ultimus Fund Solutions',
  'HedgeServ',
  'NAV Fund Administration',
  'Opus Fund Services',
  'TMF Group',
  'Vistra',
  'Waystone',
  'Mainstream Group',
  'Custom House',
  'Centaur Fund Services',
]

const AUDITORS = [
  'Deloitte',
  'PwC',
  'Ernst & Young (EY)',
  'KPMG',
  'RSM US',
  'Grant Thornton',
  'EisnerAmper',
  'WithumSmith+Brown',
  'BDO USA',
  'Marcum LLP',
  'CohnReznick',
  'Moss Adams',
  'Baker Tilly',
  'Anchin',
  'Friedman LLP',
  'Crowe',
  'PKF O\'Connor Davies',
  'Armanino',
  'Berdon LLP',
  'Mazars',
  'Prager Metis',
  'Kaufman Rossin',
  'CBIZ',
  'Plante Moran',
  'Forvis',
  'Cherry Bekaert',
  'Katz, Sapper & Miller',
  'Weaver',
  'Grassi',
  'Citrin Cooperman',
]

const TAX_ADVISORS = [
  'Deloitte Tax',
  'PwC Tax',
  'Ernst & Young Tax',
  'KPMG Tax',
  'RSM US',
  'Grant Thornton',
  'EisnerAmper',
  'WithumSmith+Brown',
  'BDO USA',
  'Marcum LLP',
  'CohnReznick',
  'Alvarez & Marsal',
  'Andersen Tax',
  'Cherry Bekaert',
  'Citrin Cooperman',
  'Crowe',
  'Moss Adams',
  'Baker Tilly',
  'Anchin',
  'Friedman LLP',
  'Armanino',
  'Berdon LLP',
  'Prager Metis',
  'Kaufman Rossin',
  'CBIZ',
  'Plante Moran',
  'Forvis',
  'Grassi',
  'PKF O\'Connor Davies',
  'Mazars',
]

const BANKS = [
  'JPMorgan Chase',
  'First Citizens (formerly SVB)',
  'Bank of America',
  'Citibank',
  'Wells Fargo',
  'HSBC',
  'Goldman Sachs',
  'Morgan Stanley',
  'Northern Trust',
  'State Street',
  'Comerica',
  'PNC Bank',
  'U.S. Bank',
  'BMO Harris',
  'Customers Bank',
  'Signature Bank',
  'Fifth Third Bank',
  'Capital One',
  'TD Bank',
  'KeyBank',
  'Huntington Bank',
  'Truist',
  'M&T Bank',
  'Regions Bank',
  'Citizens Bank',
  'First Republic',
  'BNY Mellon',
  'Deutsche Bank',
  'Barclays',
  'UBS',
]

const INSURANCE_BROKERS = [
  'Marsh',
  'Aon',
  'Willis Towers Watson',
  'Lockton',
  'Arthur J. Gallagher',
  'Brown & Brown',
  'Hub International',
  'Alliant Insurance',
  'Woodruff Sawyer',
  'USI Insurance',
  'Risk Strategies',
  'Newfront',
  'Founder Shield',
  'Embroker',
  'Vouch',
]

const PRIME_BROKERS = [
  'Goldman Sachs',
  'Morgan Stanley',
  'JPMorgan',
  'UBS',
  'Barclays',
  'Bank of America',
  'Jefferies',
  'Interactive Brokers',
  'Cowen (TD Securities)',
  'Pershing (BNY Mellon)',
  'Wedbush Securities',
  'Clear Street',
  'Apex Clearing',
  'StoneX',
  'Marex',
]

const COMPLIANCE_CONSULTANTS = [
  'ACA Group',
  'Compliance Solutions Strategies (CSS)',
  'Cipperman Compliance',
  'NRS',
  'Vigilant Compliance',
  'RIA in a Box',
  'Fairview Investment Services',
  'Core Compliance',
  'Greyline Solutions',
  'Alaric Compliance',
  'Compliance Science',
  'IQ-EQ',
  'Ultimus Fund Solutions',
  'Foreside',
  'Constellation Advisers',
]


// ============================================
// JOURNEY STEP TYPES
// ============================================

type StepType =
  | 'welcome'
  | 'config'
  | 'provider'
  | 'yes-no'
  | 'info'
  | 'celebration'
  | 'checklist'
  | 'summary'

interface JourneyStep {
  id: string
  type: StepType
  phase?: number
  phaseName?: string
  title: string
  subtitle?: string
  tip?: string
  // For config steps
  configKey?: keyof FundConfig
  options?: { value: any; label: string; icon?: React.ReactNode }[]
  // For provider steps
  providerKey?: string
  providerOptions?: string[]
  // For yes-no steps
  taskId?: string
  // For checklist steps
  tasks?: { id: string; title: string }[]
  // For celebrations
  celebration?: boolean
}

// ============================================
// JOURNEY STEPS - COMPLETE LIFECYCLE
// ============================================

const createJourneySteps = (strategy?: string): JourneyStep[] => {
  const steps: JourneyStep[] = [
    // ========== WELCOME ==========
    {
      id: 'welcome',
      type: 'welcome',
      title: "Let's Launch Your Fund",
      subtitle: "Your guided journey to fund formation",
    },

    // ========== PHASE 1: STRATEGY & PLANNING ==========
    {
      id: 'phase-1-intro',
      type: 'info',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Phase 1: Strategy & Planning',
      subtitle: 'Define your fund strategy and structure',
    },
    {
      id: 'strategy',
      type: 'config',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'What type of fund?',
      subtitle: 'Select your primary investment strategy',
      configKey: 'strategy',
      options: [
        { value: 'VC', label: 'Venture Capital', icon: <Zap className="h-5 w-5" /> },
        { value: 'PE', label: 'Private Equity', icon: <Briefcase className="h-5 w-5" /> },
        { value: 'Private Credit', label: 'Private Credit', icon: <CreditCard className="h-5 w-5" /> },
        { value: 'Hedge Fund', label: 'Hedge Fund', icon: <LineChart className="h-5 w-5" /> },
        { value: 'Real Estate', label: 'Real Estate', icon: <Home className="h-5 w-5" /> },
        { value: 'Infrastructure', label: 'Infrastructure', icon: <Landmark className="h-5 w-5" /> },
      ],
    },
    {
      id: 'size',
      type: 'config',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Target fund size?',
      subtitle: 'This affects infrastructure and LP expectations',
      configKey: 'size',
      options: [
        { value: 'emerging', label: 'Under $100M', icon: <PiggyBank className="h-5 w-5" /> },
        { value: 'mid', label: '$100M - $500M', icon: <Banknote className="h-5 w-5" /> },
        { value: 'large', label: 'Over $500M', icon: <Building className="h-5 w-5" /> },
      ],
    },
    {
      id: 'jurisdiction',
      type: 'config',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Fund domicile?',
      subtitle: 'Where will your fund be legally based?',
      configKey: 'jurisdiction',
      options: [
        { value: 'US Onshore', label: 'US Onshore Only', icon: <Globe className="h-5 w-5" /> },
        { value: 'US + Cayman', label: 'US + Offshore', icon: <Globe className="h-5 w-5" /> },
        { value: 'EU/AIFMD', label: 'EU / AIFMD', icon: <Globe className="h-5 w-5" /> },
      ],
    },
    {
      id: 'anchor',
      type: 'config',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Anchor investor?',
      subtitle: 'Do you have a committed lead investor?',
      configKey: 'hasAnchor',
      options: [
        { value: true, label: 'Yes', icon: <CheckCircle2 className="h-5 w-5" /> },
        { value: false, label: 'Not yet', icon: <Search className="h-5 w-5" /> },
      ],
    },
    {
      id: 'investment-thesis',
      type: 'yes-no',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Investment thesis defined?',
      subtitle: 'Have you articulated your investment thesis?',
      taskId: 'strategy-thesis',
    },
    {
      id: 'team-structure',
      type: 'yes-no',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Team structure finalized?',
      subtitle: 'Have you defined GP roles and economics?',
      taskId: 'strategy-team',
    },
    {
      id: 'fund-economics',
      type: 'yes-no',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Fund economics set?',
      subtitle: 'Management fee and carried interest decided?',
      taskId: 'strategy-economics',
    },
    {
      id: 'phase-1-complete',
      type: 'celebration',
      phase: 1,
      phaseName: 'Strategy & Planning',
      title: 'Strategy Complete!',
      subtitle: 'Phase 1 of 8 done',
      celebration: true,
    },

    // ========== PHASE 2: LEGAL ENTITY FORMATION ==========
    {
      id: 'phase-2-intro',
      type: 'info',
      phase: 2,
      phaseName: 'Legal Formation',
      title: 'Phase 2: Legal Formation',
      subtitle: 'Establish your legal entities',
    },
    {
      id: 'law-firm',
      type: 'provider',
      phase: 2,
      phaseName: 'Legal Formation',
      title: 'Fund counsel selected?',
      subtitle: 'Choose your law firm',
      providerKey: 'lawFirm',
      providerOptions: LAW_FIRMS,
    },
    {
      id: 'gp-entity',
      type: 'yes-no',
      phase: 2,
      phaseName: 'Legal Formation',
      title: 'GP entity formed?',
      subtitle: 'Have you formed your General Partner entity?',
      taskId: 'legal-gp-entity',
    },
    {
      id: 'mgmt-company',
      type: 'yes-no',
      phase: 2,
      phaseName: 'Legal Formation',
      title: 'Management company formed?',
      subtitle: 'Have you formed your Management Company?',
      taskId: 'legal-mgmt-company',
    },
    {
      id: 'fund-lp',
      type: 'yes-no',
      phase: 2,
      phaseName: 'Legal Formation',
      title: 'Fund LP formed?',
      subtitle: 'Have you formed your Fund LP entity?',
      taskId: 'legal-fund-lp',
    },
    {
      id: 'phase-2-complete',
      type: 'celebration',
      phase: 2,
      phaseName: 'Legal Formation',
      title: 'Legal Entities Set!',
      subtitle: 'Phase 2 of 8 done',
      celebration: true,
    },

    // ========== PHASE 3: FUND DOCUMENTATION ==========
    {
      id: 'phase-3-intro',
      type: 'info',
      phase: 3,
      phaseName: 'Fund Documentation',
      title: 'Phase 3: Fund Documentation',
      subtitle: 'Draft your core fund documents',
    },
    {
      id: 'lpa-drafted',
      type: 'yes-no',
      phase: 3,
      phaseName: 'Fund Documentation',
      title: 'LPA drafted?',
      subtitle: 'Limited Partnership Agreement in progress?',
      taskId: 'docs-lpa',
    },
    {
      id: 'ppm-drafted',
      type: 'yes-no',
      phase: 3,
      phaseName: 'Fund Documentation',
      title: 'PPM drafted?',
      subtitle: 'Private Placement Memorandum in progress?',
      taskId: 'docs-ppm',
    },
    {
      id: 'subscription-docs',
      type: 'yes-no',
      phase: 3,
      phaseName: 'Fund Documentation',
      title: 'Subscription docs ready?',
      subtitle: 'Investor subscription documents prepared?',
      taskId: 'docs-subscription',
    },
    {
      id: 'phase-3-complete',
      type: 'celebration',
      phase: 3,
      phaseName: 'Fund Documentation',
      title: 'Documents Ready!',
      subtitle: 'Phase 3 of 8 done',
      celebration: true,
    },

    // ========== PHASE 4: REGULATORY & COMPLIANCE ==========
    {
      id: 'phase-4-intro',
      type: 'info',
      phase: 4,
      phaseName: 'Regulatory',
      title: 'Phase 4: Regulatory',
      subtitle: 'Navigate compliance requirements',
    },
    {
      id: 'compliance-consultant',
      type: 'provider',
      phase: 4,
      phaseName: 'Regulatory',
      title: 'Compliance consultant?',
      subtitle: 'Select your compliance advisor',
      providerKey: 'complianceConsultant',
      providerOptions: COMPLIANCE_CONSULTANTS,
    },
    {
      id: 'sec-exemption',
      type: 'yes-no',
      phase: 4,
      phaseName: 'Regulatory',
      title: 'SEC exemption analyzed?',
      subtitle: 'Determined your registration status?',
      taskId: 'reg-exemption-analysis',
    },
    {
      id: 'form-adv',
      type: 'yes-no',
      phase: 4,
      phaseName: 'Regulatory',
      title: 'Form ADV filed?',
      subtitle: 'SEC registration/reporting filed?',
      taskId: 'reg-form-adv',
    },
    {
      id: 'compliance-manual',
      type: 'yes-no',
      phase: 4,
      phaseName: 'Regulatory',
      title: 'Compliance manual ready?',
      subtitle: 'Policies and procedures documented?',
      taskId: 'reg-compliance-manual',
    },
    {
      id: 'phase-4-complete',
      type: 'celebration',
      phase: 4,
      phaseName: 'Regulatory',
      title: 'Compliance Ready!',
      subtitle: 'Phase 4 of 8 done',
      celebration: true,
    },

    // ========== PHASE 5: SERVICE PROVIDERS ==========
    {
      id: 'phase-5-intro',
      type: 'info',
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Phase 5: Service Providers',
      subtitle: 'Build your operational team',
    },
    {
      id: 'fund-admin',
      type: 'provider',
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Fund administrator?',
      subtitle: 'Select your fund admin',
      providerKey: 'fundAdmin',
      providerOptions: FUND_ADMINISTRATORS,
    },
    {
      id: 'auditor',
      type: 'provider',
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Auditor selected?',
      subtitle: 'Choose your audit firm',
      providerKey: 'auditor',
      providerOptions: AUDITORS,
    },
    {
      id: 'tax-advisor',
      type: 'provider',
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Tax advisor?',
      subtitle: 'Select your tax preparer',
      providerKey: 'taxAdvisor',
      providerOptions: TAX_ADVISORS,
    },
    {
      id: 'bank',
      type: 'provider',
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Banking relationship?',
      subtitle: 'Choose your bank',
      providerKey: 'bank',
      providerOptions: BANKS,
    },
    {
      id: 'insurance',
      type: 'provider',
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Insurance broker?',
      subtitle: 'Select your insurance broker',
      providerKey: 'insuranceBroker',
      providerOptions: INSURANCE_BROKERS,
    },
    // Conditional: Prime broker for hedge funds
    ...(strategy === 'Hedge Fund' ? [{
      id: 'prime-broker',
      type: 'provider' as StepType,
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Prime broker?',
      subtitle: 'Select your prime broker',
      providerKey: 'primeBroker',
      providerOptions: PRIME_BROKERS,
    }] : []),
    {
      id: 'phase-5-complete',
      type: 'celebration',
      phase: 5,
      phaseName: 'Service Providers',
      title: 'Team Assembled!',
      subtitle: 'Phase 5 of 8 done',
      celebration: true,
    },

    // ========== PHASE 6: OPERATIONS ==========
    {
      id: 'phase-6-intro',
      type: 'info',
      phase: 6,
      phaseName: 'Operations',
      title: 'Phase 6: Operations',
      subtitle: 'Set up your infrastructure',
    },
    {
      id: 'bank-accounts',
      type: 'yes-no',
      phase: 6,
      phaseName: 'Operations',
      title: 'Bank accounts open?',
      subtitle: 'Fund and management company accounts?',
      taskId: 'ops-bank-accounts',
    },
    {
      id: 'investor-portal',
      type: 'yes-no',
      phase: 6,
      phaseName: 'Operations',
      title: 'Investor portal set up?',
      subtitle: 'LP reporting and document access?',
      taskId: 'ops-investor-portal',
    },
    {
      id: 'cybersecurity',
      type: 'yes-no',
      phase: 6,
      phaseName: 'Operations',
      title: 'Cybersecurity in place?',
      subtitle: 'MFA, encryption, security policies?',
      taskId: 'ops-cybersecurity',
    },
    {
      id: 'phase-6-complete',
      type: 'celebration',
      phase: 6,
      phaseName: 'Operations',
      title: 'Operations Ready!',
      subtitle: 'Phase 6 of 8 done',
      celebration: true,
    },

    // ========== PHASE 7: FUNDRAISING ==========
    {
      id: 'phase-7-intro',
      type: 'info',
      phase: 7,
      phaseName: 'Fundraising',
      title: 'Phase 7: Fundraising',
      subtitle: 'Raise capital from LPs',
    },
    {
      id: 'pitch-deck',
      type: 'yes-no',
      phase: 7,
      phaseName: 'Fundraising',
      title: 'Pitch deck ready?',
      subtitle: 'Marketing presentation complete?',
      taskId: 'fr-pitch-deck',
    },
    {
      id: 'data-room',
      type: 'yes-no',
      phase: 7,
      phaseName: 'Fundraising',
      title: 'Data room built?',
      subtitle: 'Due diligence materials organized?',
      taskId: 'fr-data-room',
    },
    {
      id: 'ddq',
      type: 'yes-no',
      phase: 7,
      phaseName: 'Fundraising',
      title: 'DDQ completed?',
      subtitle: 'Due diligence questionnaire ready?',
      taskId: 'fr-ddq',
    },
    {
      id: 'lp-pipeline',
      type: 'yes-no',
      phase: 7,
      phaseName: 'Fundraising',
      title: 'LP pipeline built?',
      subtitle: 'Target investors identified?',
      taskId: 'fr-lp-pipeline',
    },
    {
      id: 'phase-7-complete',
      type: 'celebration',
      phase: 7,
      phaseName: 'Fundraising',
      title: 'Ready to Raise!',
      subtitle: 'Phase 7 of 8 done',
      celebration: true,
    },

    // ========== PHASE 8: FIRST CLOSE ==========
    {
      id: 'phase-8-intro',
      type: 'info',
      phase: 8,
      phaseName: 'First Close',
      title: 'Phase 8: First Close',
      subtitle: 'Execute your first close',
    },
    {
      id: 'docs-finalized',
      type: 'yes-no',
      phase: 8,
      phaseName: 'First Close',
      title: 'Documents executed?',
      subtitle: 'All fund documents signed?',
      taskId: 'fc-finalize-docs',
    },
    {
      id: 'capital-called',
      type: 'yes-no',
      phase: 8,
      phaseName: 'First Close',
      title: 'First capital call issued?',
      subtitle: 'Initial capital call sent to LPs?',
      taskId: 'fc-capital-call',
    },
    {
      id: 'reporting-setup',
      type: 'yes-no',
      phase: 8,
      phaseName: 'First Close',
      title: 'Reporting cadence set?',
      subtitle: 'LP reporting schedule established?',
      taskId: 'fc-reporting-setup',
    },
    {
      id: 'phase-8-complete',
      type: 'celebration',
      phase: 8,
      phaseName: 'First Close',
      title: 'Fund Launched!',
      subtitle: 'All 8 phases complete',
      celebration: true,
    },

    // ========== SUMMARY ==========
    {
      id: 'summary',
      type: 'summary',
      title: 'Your Fund Launch Roadmap',
      subtitle: 'Review your progress',
    },
  ]

  return steps
}

// ============================================
// COMPONENT
// ============================================

interface JourneyModeProps {
  onComplete: (config: FundConfig, providers: Record<string, string>, completedTasks: string[]) => void
  onSkip: () => void
}

export function JourneyMode({ onComplete, onSkip }: JourneyModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [config, setConfig] = useState<Partial<FundConfig>>({})
  const [providers, setProviders] = useState<Record<string, string>>({})
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Generate steps based on strategy
  const steps = createJourneySteps(config.strategy)
  const step = steps[currentStepIndex]
  const totalSteps = steps.length
  const progress = ((currentStepIndex + 1) / totalSteps) * 100

  // Current phase info
  const currentPhase = step?.phase
  const phaseName = step?.phaseName

  // Reset scroll on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    setSearchQuery('')
    setShowCustomInput(false)
    setCustomInput('')
  }, [currentStepIndex])

  // Trigger celebration
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
    })
  }, [])

  useEffect(() => {
    if (step?.celebration) {
      triggerCelebration()
    }
  }, [step?.celebration, triggerCelebration])

  // Navigation
  const goNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    onComplete(config as FundConfig, providers, Array.from(completedTasks))
  }

  // Handlers
  const handleConfigSelect = (key: keyof FundConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setTimeout(goNext, 250)
  }

  const handleProviderSelect = (key: string, value: string) => {
    setProviders(prev => ({ ...prev, [key]: value }))
    setShowCustomInput(false)
    setTimeout(goNext, 250)
  }

  const handleCustomProvider = () => {
    if (step?.providerKey && customInput.trim()) {
      handleProviderSelect(step.providerKey, customInput.trim())
    }
  }

  const handleYesNo = (taskId: string | undefined, completed: boolean) => {
    if (taskId) {
      setCompletedTasks(prev => {
        const next = new Set(prev)
        if (completed) {
          next.add(taskId)
        } else {
          next.delete(taskId)
        }
        return next
      })
    }
    setTimeout(goNext, 250)
  }

  // Filter providers by search
  const filteredProviders = step?.providerOptions?.filter(p =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Animation
  const variants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-950">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Phase indicator */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {currentPhase && (
              <>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {currentPhase}
                </span>
                <span className="text-sm font-medium truncate">{phaseName}</span>
              </>
            )}
            {!currentPhase && <span className="text-sm text-muted-foreground">Getting started</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="flex-shrink-0 text-muted-foreground"
          >
            Skip
            <SkipForward className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain bg-slate-950">
        <div className="pb-safe">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="px-4 py-6 pb-20 max-w-lg mx-auto w-full"
            >
              {/* Welcome */}
              {step.type === 'welcome' && (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                    <div className="relative bg-gradient-to-br from-primary to-purple-600 p-5 rounded-2xl text-white">
                      <Rocket className="h-12 w-12" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold">{step.title}</h1>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button size="lg" onClick={goNext} className="w-full">
                      Start Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="ghost" onClick={onSkip} className="w-full">
                      Skip to checklist
                    </Button>
                  </div>
                </div>
              )}

              {/* Info */}
              {step.type === 'info' && (
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-6">
                  <div className="bg-accent p-4 rounded-2xl">
                    {step.phase === 1 && <Target className="h-10 w-10 text-primary" />}
                    {step.phase === 2 && <Scale className="h-10 w-10 text-primary" />}
                    {step.phase === 3 && <FileText className="h-10 w-10 text-primary" />}
                    {step.phase === 4 && <Shield className="h-10 w-10 text-primary" />}
                    {step.phase === 5 && <Users className="h-10 w-10 text-primary" />}
                    {step.phase === 6 && <Settings className="h-10 w-10 text-primary" />}
                    {step.phase === 7 && <TrendingUp className="h-10 w-10 text-primary" />}
                    {step.phase === 8 && <Rocket className="h-10 w-10 text-primary" />}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>
                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3 text-left">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                  <Button size="lg" onClick={goNext}>
                    Continue
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Config selection */}
              {step.type === 'config' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground text-sm">{step.subtitle}</p>
                  </div>

                  <div className="space-y-2">
                    {step.options?.map((option) => {
                      const isSelected = config[step.configKey!] === option.value
                      return (
                        <button
                          key={String(option.value)}
                          onClick={() => handleConfigSelect(step.configKey!, option.value)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className={cn(
                            "p-2.5 rounded-lg shrink-0",
                            isSelected ? "bg-primary text-white" : "bg-accent"
                          )}>
                            {option.icon}
                          </div>
                          <span className="font-medium flex-1">{option.label}</span>
                          {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Provider selection */}
              {step.type === 'provider' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2 pt-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground text-sm">{step.subtitle}</p>
                  </div>

                  {!showCustomInput ? (
                    <>
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Provider list */}
                      <div className="space-y-1.5">
                        {filteredProviders.map((name) => {
                          const isSelected = providers[step.providerKey!] === name
                          return (
                            <button
                              key={name}
                              onClick={() => handleProviderSelect(step.providerKey!, name)}
                              className={cn(
                                "flex items-center justify-between p-3.5 rounded-xl border text-left transition-all active:scale-[0.98]",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <span className="font-medium">{name}</span>
                              {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                            </button>
                          )
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          onClick={() => setShowCustomInput(true)}
                          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
                        >
                          <Plus className="h-4 w-4" />
                          Not listed? Add your own
                        </button>
                        <Button variant="ghost" onClick={goNext} className="w-full">
                          Skip for now
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="min-h-[30vh] flex flex-col gap-4 justify-center">
                      <Input
                        placeholder="Enter provider name..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        autoFocus
                        className="text-center"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowCustomInput(false)} className="flex-1">
                          Back
                        </Button>
                        <Button onClick={handleCustomProvider} disabled={!customInput.trim()} className="flex-1">
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}

                  {step.tip && !showCustomInput && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Yes/No question */}
              {step.type === 'yes-no' && (
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button
                      size="lg"
                      onClick={() => handleYesNo(step.taskId, true)}
                      className="w-full"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Yes, done
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleYesNo(step.taskId, false)}
                      className="w-full"
                    >
                      Not yet
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={goNext}
                      className="w-full text-muted-foreground"
                    >
                      Skip
                    </Button>
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 rounded-xl p-3 text-left max-w-xs">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Celebration */}
              {step.type === 'celebration' && (
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.6 }}
                  >
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white">
                      <Trophy className="h-12 w-12" />
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-primary font-medium">{step.subtitle}</p>
                  </div>
                  <Button size="lg" onClick={goNext}>
                    Continue
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Summary */}
              {step.type === 'summary' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground">{step.subtitle}</p>
                  </div>

                  {/* Config summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-accent/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Strategy</div>
                      <div className="font-semibold text-sm">{config.strategy || '—'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-accent/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Size</div>
                      <div className="font-semibold text-sm capitalize">{config.size || '—'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-accent/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Jurisdiction</div>
                      <div className="font-semibold text-sm">{config.jurisdiction || '—'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-accent/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Anchor</div>
                      <div className="font-semibold text-sm">{config.hasAnchor ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {/* Providers summary */}
                  {Object.keys(providers).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Service Providers</h3>
                      <div className="space-y-1.5">
                        {Object.entries(providers).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 text-sm">
                            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="font-medium truncate ml-2">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Ready to go!</div>
                      <div className="text-xs text-muted-foreground">
                        {completedTasks.size} tasks marked complete
                      </div>
                    </div>
                  </div>

                  <Button size="lg" onClick={handleComplete} className="w-full">
                    View Full Checklist
                    <Rocket className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      {currentStepIndex > 0 && step.type !== 'summary' && step.type !== 'welcome' && (
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button variant="ghost" size="sm" onClick={goPrev}>
              <ChevronLeft className="h-5 w-5" />
              Back
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentStepIndex + 1} / {totalSteps}
            </span>
            {(step.type === 'info' || step.type === 'celebration') && (
              <Button variant="ghost" size="sm" onClick={goNext}>
                Next
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
            {step.type !== 'info' && step.type !== 'celebration' && (
              <div className="w-16" /> // Spacer
            )}
          </div>
        </div>
      )}
    </div>
  )
}
