'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { WaterfallInput, WaterfallOutput, defaultInput, calculateWaterfall, formatCurrency, formatMultiple } from './waterfallCalculations'
import { InputForm } from './input-form'
import { ResultsView } from './results-view'
import { JourneyMode } from './journey-mode'
import { ResultsWalkthrough } from './results-walkthrough'
import { Glossary } from './glossary'
import { FAQSection } from './faq-section'
import { SampleScenarios } from './sample-scenarios'
import { CalculationBreakdown } from './calculation-breakdown'
import { PeerComparison } from './peer-comparison'
import { WhatIfSliders } from './what-if-sliders'
import { SkipToContent, LiveRegion, ScrollToTop, AutoSaveIndicator, MobileResultsGrid } from './accessibility'
import { exportWaterfallSummary, exportComparisonCSV, exportComparisonPDF } from './export'
import { useGamification, AchievementPopup, LevelUpPopup, LEVELS, DEFAULT_ACHIEVEMENTS, GamificationState } from './gamification'
import { Confetti, WaterfallFlowAnimation } from './visual-effects'
import { Quiz as QuizPanel, WATERFALL_QUIZ_QUESTIONS } from './quiz'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ShareButton } from '@/components/tools/share-button'
import { ExportToolbar } from '@/components/tools/shared'
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Calculator,
  BarChart3,
  SlidersHorizontal,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Play,
  X,
  Trophy,
  Zap,
  Target,
  Brain,
  Gift,
  Flame,
  Award,
  Star
} from 'lucide-react'

// Preset scenarios
const presets: Record<string, { name: string; description: string; input: WaterfallInput }> = {
  'classic-pe': {
    name: 'Classic PE',
    description: '$100M fund, 8% pref, 20% carry, European',
    input: {
      fundSize: 100000000,
      contributedCapital: 100000000,
      grossProceeds: 200000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    }
  },
  'vc-style': {
    name: 'VC Style',
    description: '$50M fund, no pref, 25% carry, American',
    input: {
      fundSize: 50000000,
      contributedCapital: 50000000,
      grossProceeds: 150000000,
      waterfallType: 'american',
      prefRate: 0.0,
      prefCompounding: 'simple',
      carryRate: 0.25,
      catchUpRate: 1.0,
      hasCatchUp: false,
      yearsToExit: 7,
      gpCommitmentPercent: 0.01
    }
  },
  'higher-carry': {
    name: 'Higher Carry',
    description: '$200M fund, 6% pref, 25% carry, European',
    input: {
      fundSize: 200000000,
      contributedCapital: 200000000,
      grossProceeds: 400000000,
      waterfallType: 'european',
      prefRate: 0.06,
      prefCompounding: 'compound',
      carryRate: 0.25,
      catchUpRate: 1.0,
      hasCatchUp: true,
      yearsToExit: 6,
      gpCommitmentPercent: 0.03
    }
  },
  'no-catchup': {
    name: 'No Catch-Up',
    description: '$150M fund, 8% pref, 20% carry, no catch-up',
    input: {
      fundSize: 150000000,
      contributedCapital: 150000000,
      grossProceeds: 300000000,
      waterfallType: 'european',
      prefRate: 0.08,
      prefCompounding: 'simple',
      carryRate: 0.20,
      catchUpRate: 0.0,
      hasCatchUp: false,
      yearsToExit: 5,
      gpCommitmentPercent: 0.02
    }
  }
}

const LOCAL_STORAGE_KEY = 'waterfall-calculator-data'
const JOURNEY_COMPLETED_KEY = 'waterfall-journey-completed'
const GAMIFICATION_KEY = 'waterfall-gamification'

export function DistributionWaterfall() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse initial state from URL or localStorage or use defaults
  const getInitialInput = (): WaterfallInput => {
    if (typeof window === 'undefined') return defaultInput

    // Try URL params first
    const hasUrlParams = searchParams.get('fundSize')
    if (hasUrlParams) {
      return {
        fundSize: parseFloat(searchParams.get('fundSize') || '') || defaultInput.fundSize,
        contributedCapital: parseFloat(searchParams.get('contributed') || '') || defaultInput.contributedCapital,
        grossProceeds: parseFloat(searchParams.get('proceeds') || '') || defaultInput.grossProceeds,
        waterfallType: (searchParams.get('type') as 'european' | 'american') || defaultInput.waterfallType,
        prefRate: parseFloat(searchParams.get('pref') || '') || defaultInput.prefRate,
        prefCompounding: (searchParams.get('compounding') as 'simple' | 'compound') || defaultInput.prefCompounding,
        carryRate: parseFloat(searchParams.get('carry') || '') || defaultInput.carryRate,
        catchUpRate: parseFloat(searchParams.get('catchUp') || '') || defaultInput.catchUpRate,
        hasCatchUp: searchParams.get('hasCatchUp') === 'true' || (searchParams.get('hasCatchUp') === null && defaultInput.hasCatchUp),
        yearsToExit: parseInt(searchParams.get('years') || '') || defaultInput.yearsToExit,
        gpCommitmentPercent: parseFloat(searchParams.get('gpCommit') || '') || defaultInput.gpCommitmentPercent
      }
    }

    // Try localStorage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.input) return parsed.input
      }
    } catch {
      // Ignore localStorage errors
    }

    return defaultInput
  }

  // State
  const [input, setInput] = useState<WaterfallInput>(getInitialInput)
  const [output, setOutput] = useState<WaterfallOutput>(calculateWaterfall(getInitialInput()))
  const [compareMode, setCompareMode] = useState(false)
  const [compareInput, setCompareInput] = useState<WaterfallInput | null>(null)
  const [compareOutput, setCompareOutput] = useState<WaterfallOutput | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<'low' | 'medium' | 'high'>('medium')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Journey mode state
  const [showJourney, setShowJourney] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [journeyCompleted, setJourneyCompleted] = useState(false)

  // Gamification state
  const gamification = useGamification()
  const {
    state: gamificationState,
    addXP,
    unlockAchievement,
    trackScenarioExplored,
    trackQuizCorrect,
    showAchievement,
    setShowAchievement,
    showLevelUp,
    setShowLevelUp,
    getCurrentLevel
  } = gamification

  // View mode state
  const [activeView, setActiveView] = useState<'calculator' | 'dashboard' | 'achievements' | 'missions' | 'quiz'>('calculator')
  const [showConfetti, setShowConfetti] = useState(false)

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quickScenarios: true,
    whatIf: false,
    calculation: false,
    peerComparison: false,
    glossary: false,
    faq: false,
    scenarios: false,
    waterflowAnimation: false
  })

  // Check if journey was previously completed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(JOURNEY_COMPLETED_KEY)
      setJourneyCompleted(completed === 'true')

      // Show journey mode for first-time users
      if (!completed && !searchParams.get('fundSize')) {
        setShowJourney(true)
      }
    }
  }, [searchParams])

  // Auto-save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ input, lastModified: new Date().toISOString() }))
        setLastSaved(new Date())
      } catch {
        // Ignore localStorage errors
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [input])

  // Update URL when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('fundSize', String(input.fundSize))
      params.set('contributed', String(input.contributedCapital))
      params.set('proceeds', String(input.grossProceeds))
      params.set('type', input.waterfallType)
      params.set('pref', String(input.prefRate))
      params.set('compounding', input.prefCompounding)
      params.set('carry', String(input.carryRate))
      params.set('catchUp', String(input.catchUpRate))
      params.set('hasCatchUp', String(input.hasCatchUp))
      params.set('years', String(input.yearsToExit))
      params.set('gpCommit', String(input.gpCommitmentPercent))

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [input, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('fundSize', String(input.fundSize))
    params.set('contributed', String(input.contributedCapital))
    params.set('proceeds', String(input.grossProceeds))
    params.set('type', input.waterfallType)
    params.set('pref', String(input.prefRate))
    params.set('compounding', input.prefCompounding)
    params.set('carry', String(input.carryRate))
    params.set('catchUp', String(input.catchUpRate))
    params.set('hasCatchUp', String(input.hasCatchUp))
    params.set('years', String(input.yearsToExit))
    params.set('gpCommit', String(input.gpCommitmentPercent))

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [input, pathname])

  const handleInputChange = (newInput: WaterfallInput) => {
    setInput(newInput)
    const newOutput = calculateWaterfall(newInput)
    setOutput(newOutput)
  }

  const handleJourneyComplete = (journeyInput: WaterfallInput) => {
    handleInputChange(journeyInput)
    setShowJourney(false)
    setShowWalkthrough(true)
    localStorage.setItem(JOURNEY_COMPLETED_KEY, 'true')
    setJourneyCompleted(true)

    // Award XP for completing journey
    addXP(200)
    unlockAchievement('first_journey')
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false)
  }

  // Gamification handlers
  const handleXPEarned = (xp: number, reason: string) => {
    addXP(xp)
  }

  const handleStepComplete = () => {
    // Track journey progress
  }

  const handleAchievementCheck = (type: string, value?: any) => {
    switch (type) {
      case 'journey_step':
        if (value >= 5) unlockAchievement('waterfall-101')
        if (value >= 10) unlockAchievement('journey-complete')
        break
      case 'journey_complete':
        unlockAchievement('journey-complete')
        break
      case 'scenario_run':
        trackScenarioExplored(value)
        break
      case 'quiz_correct':
        trackQuizCorrect()
        break
    }
  }

  const handleScenarioRun = () => {
    trackScenarioExplored('scenario-' + Date.now())
    addXP(25)

    // Check achievements
    if (gamificationState.scenariosExplored.length === 0) {
      unlockAchievement('first-steps')
    }
  }

  const loadPreset = (presetKey: string) => {
    const preset = presets[presetKey]
    if (preset) {
      setInput(preset.input)
      setOutput(calculateWaterfall(preset.input))
      setCompareMode(false)
      setCompareInput(null)
      setCompareOutput(null)
    }
  }

  const handleScenarioChange = (scenario: 'low' | 'medium' | 'high') => {
    setSelectedScenario(scenario)
    const multipliers = { low: 1.5, medium: 2.0, high: 3.0 }
    const newProceeds = input.contributedCapital * multipliers[scenario]
    handleInputChange({ ...input, grossProceeds: newProceeds })
  }

  const handleExport = () => {
    exportWaterfallSummary(output)
  }

  const startComparison = () => {
    setCompareMode(true)
    setCompareInput({ ...input })
    setCompareOutput({ ...output })
  }

  const updateCompareInput = (newInput: WaterfallInput) => {
    setCompareInput(newInput)
    setCompareOutput(calculateWaterfall(newInput))
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleStartOver = () => {
    setInput(defaultInput)
    setOutput(calculateWaterfall(defaultInput))
    setCompareMode(false)
    setCompareInput(null)
    setCompareOutput(null)
    localStorage.removeItem(JOURNEY_COMPLETED_KEY)
    setShowJourney(true)
  }

  const loadScenarioFromLibrary = (scenarioInput: WaterfallInput) => {
    handleInputChange(scenarioInput)
    setExpandedSections(prev => ({ ...prev, scenarios: false }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Show journey mode
  if (showJourney) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <SkipToContent />

        {/* Gamification popups */}
        <AnimatePresence>
          {showAchievement && (
            <AchievementPopup
              achievement={showAchievement}
              onClose={() => setShowAchievement(null)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showLevelUp && (
            <LevelUpPopup
              level={showLevelUp}
              onClose={() => setShowLevelUp(null)}
            />
          )}
        </AnimatePresence>

        <JourneyMode
          onComplete={handleJourneyComplete}
          onSkip={() => {
            setShowJourney(false)
            localStorage.setItem(JOURNEY_COMPLETED_KEY, 'true')
            setJourneyCompleted(true)
          }}
        />
      </div>
    )
  }

  // Show results walkthrough after journey
  if (showWalkthrough) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <SkipToContent />
        <ResultsWalkthrough
          output={output}
          onComplete={handleWalkthroughComplete}
          onSkip={handleWalkthroughComplete}
        />
      </div>
    )
  }

  // Get current level
  const currentLevel = getCurrentLevel()

  return (
    <div className="space-y-8" id="waterfall-main-content">
      <SkipToContent />
      <LiveRegion output={output} isCalculating={false} />
      <ScrollToTop />

      {/* Confetti celebration */}
      <Confetti show={showConfetti} />

      {/* Gamification popups */}
      <AnimatePresence>
        {showAchievement && (
          <AchievementPopup
            achievement={showAchievement}
            onClose={() => setShowAchievement(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLevelUp && (
          <LevelUpPopup
            level={showLevelUp}
            onClose={() => setShowLevelUp(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center relative">
        <div className="absolute right-0 top-0 flex items-center gap-2">
          <AutoSaveIndicator lastSaved={lastSaved} />
          <ShareButton getShareableUrl={getShareableUrl} />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Distribution Waterfall Visualizer
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Model LP and GP economics across preferred return, catch-up, and carried interest tiers.
          Understand how different waterfall structures affect distributions.
        </p>

        {/* Gamification progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-md mx-auto"
        >
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="font-bold text-primary">{currentLevel.level}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{currentLevel.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  {gamificationState.xp} XP
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Trophy className="h-3 w-3 mr-1" />
                {gamificationState.achievements.filter(a => a.unlocked).length}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Navigation tabs for gamified views */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Button
            variant={activeView === 'calculator' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('calculator')}
            className="gap-2"
          >
            <Calculator className="h-4 w-4" />
            Calculator
          </Button>
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('dashboard')}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Progress
          </Button>
          <Button
            variant={activeView === 'achievements' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('achievements')}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Achievements
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              {gamificationState.achievements.filter(a => a.unlocked).length}
            </Badge>
          </Button>
          <Button
            variant={activeView === 'missions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('missions')}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Missions
          </Button>
          <Button
            variant={activeView === 'quiz' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('quiz')}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            Quiz
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJourney(true)}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {journeyCompleted ? 'Restart Tutorial' : 'Start Tutorial'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWalkthrough(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Explain Results
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartOver}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </Button>
        </div>
      </div>

      {/* Show different views based on active view */}
      {activeView === 'dashboard' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-3xl font-bold text-primary">{currentLevel.level}</p>
                  <p className="text-sm text-muted-foreground">Level</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{gamificationState.xp}</p>
                  <p className="text-sm text-muted-foreground">XP Earned</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 text-center">
                  <p className="text-3xl font-bold text-amber-600">{gamificationState.achievements.filter(a => a.unlocked).length}</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <p className="text-3xl font-bold text-green-600">{gamificationState.scenariosExplored.length}</p>
                  <p className="text-sm text-muted-foreground">Scenarios</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => { setActiveView('calculator'); setShowJourney(true); }}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Learning Journey
                </Button>
                <Button variant="outline" onClick={() => setActiveView('achievements')}>
                  <Trophy className="h-4 w-4 mr-2" />
                  View Achievements
                </Button>
                <Button variant="outline" onClick={() => setActiveView('quiz')}>
                  <Brain className="h-4 w-4 mr-2" />
                  Take Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeView === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Achievements
            </h2>
            <p className="text-muted-foreground">
              Unlock achievements by exploring the waterfall calculator
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {gamificationState.achievements.map((achievement) => (
              <Card key={achievement.id} className={`transition-all ${achievement.unlocked ? 'border-yellow-500/30 bg-yellow-500/5' : 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full text-2xl ${achievement.unlocked ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <Badge variant="secondary" className="mt-2">{achievement.xp} XP</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {activeView === 'missions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Daily Missions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center py-8">
                Complete activities to earn bonus XP!
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Brain className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Complete the tutorial</p>
                    <p className="text-sm text-muted-foreground">Finish all 10 steps</p>
                  </div>
                  <Badge>+200 XP</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Calculator className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Run 5 scenarios</p>
                    <p className="text-sm text-muted-foreground">{Math.min(gamificationState.scenariosExplored.length, 5)}/5 complete</p>
                  </div>
                  <Badge>+100 XP</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Brain className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Answer 3 quiz questions</p>
                    <p className="text-sm text-muted-foreground">{Math.min(gamificationState.quizAnswersCorrect, 3)}/3 correct</p>
                  </div>
                  <Badge>+75 XP</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeView === 'quiz' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <QuizPanel
            onCorrectAnswer={() => {
              trackQuizCorrect()
              addXP(25)
            }}
            onComplete={(score, total) => {
              if (score === total) {
                unlockAchievement('quiz-ace')
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 2000)
              }
              addXP(score * 10) // Bonus XP for completion
            }}
            onClose={() => setActiveView('calculator')}
          />
        </motion.div>
      )}

      {activeView === 'calculator' && (
        <>
          {/* Waterfall Flow Animation Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('waterflowAnimation')}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:from-primary/10 hover:to-purple-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Waterfall Flow Animation</h3>
                  <p className="text-sm text-muted-foreground">Watch how money flows through each tier</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary mr-2">
                Interactive
              </Badge>
              {expandedSections.waterflowAnimation ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.waterflowAnimation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Card className="border-primary/20">
                    <CardContent className="p-6">
                      <WaterfallFlowAnimation output={output} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

      {/* About */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">About This Tool</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            This distribution waterfall visualizer helps private fund managers model how proceeds flow through
            the standard tiers of a fund waterfall: return of capital, preferred return, GP catch-up, and
            ongoing profit split. Compare European (whole-fund) vs American (deal-by-deal) structures.
          </p>
          <p>
            The tool uses market-standard waterfall mechanics based on typical private equity, venture capital,
            and private credit fund structures. Adjust terms to see real-time impact on LP and GP economics.
          </p>
          <p className="font-medium text-foreground">
            This is an educational tool only. Actual fund economics depend on specific LPA terms,
            timing, fees, expenses, and other factors. Consult legal and financial advisors for fund structuring.
          </p>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Try These Examples</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Click a preset to see typical waterfall structures for different fund types
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent hover:border-primary"
            >
              <div className="mb-1 font-semibold text-foreground">{preset.name}</div>
              <div className="text-xs text-muted-foreground">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Scenario Buttons */}
      <Card className="border-border bg-card p-6">
        <button
          onClick={() => toggleSection('quickScenarios')}
          className="flex items-center justify-between w-full text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Scenarios</h3>
            <p className="text-sm text-muted-foreground">
              See how different return multiples affect the waterfall
            </p>
          </div>
          {expandedSections.quickScenarios ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        {expandedSections.quickScenarios && (
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              onClick={() => handleScenarioChange('low')}
              variant={selectedScenario === 'low' ? 'default' : 'outline'}
              className="flex-1 sm:flex-none"
            >
              1.5x Return
            </Button>
            <Button
              onClick={() => handleScenarioChange('medium')}
              variant={selectedScenario === 'medium' ? 'default' : 'outline'}
              className="flex-1 sm:flex-none"
            >
              2.0x Return
            </Button>
            <Button
              onClick={() => handleScenarioChange('high')}
              variant={selectedScenario === 'high' ? 'default' : 'outline'}
              className="flex-1 sm:flex-none"
            >
              3.0x Return
            </Button>
          </div>
        )}
      </Card>

      {/* Mobile Results Summary */}
      <div className="lg:hidden">
        <MobileResultsGrid output={output} />
      </div>

      {/* Main Content */}
      {compareMode ? (
        <Tabs defaultValue="scenario-a" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scenario-a">Scenario A</TabsTrigger>
            <TabsTrigger value="scenario-b">Scenario B</TabsTrigger>
            <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
          </TabsList>

          <TabsContent value="scenario-a" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario A Inputs</h3>
                <InputForm input={input} onChange={handleInputChange} />
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario A Results</h3>
                <ResultsView output={output} onExport={handleExport} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenario-b" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario B Inputs</h3>
                {compareInput && (
                  <InputForm input={compareInput} onChange={updateCompareInput} />
                )}
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Scenario B Results</h3>
                {compareOutput && (
                  <ResultsView output={compareOutput} onExport={() => exportWaterfallSummary(compareOutput)} />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            {compareOutput && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Side-by-Side Comparison</h3>
                  <ExportToolbar
                    onExportCSV={() => exportComparisonCSV(output, compareOutput)}
                    onExportPDF={() => exportComparisonPDF(output, compareOutput)}
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-lg font-medium text-primary">Scenario A</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Structure:</span>
                        <span className="font-medium">{output.input.waterfallType === 'european' ? 'European' : 'American'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pref Rate:</span>
                        <span className="font-medium">{(output.input.prefRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Carry:</span>
                        <span className="font-medium">{(output.input.carryRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Proceeds:</span>
                        <span className="font-medium">{formatCurrency(output.input.grossProceeds)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>LP Total:</span>
                        <span>{formatCurrency(output.totalToLPs)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>GP Total:</span>
                        <span>{formatCurrency(output.totalToGP)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>LP Multiple:</span>
                        <span>{formatMultiple(output.lpMultiple)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-primary">
                        <span>Effective Carry:</span>
                        <span>{(output.effectiveCarryRate * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-lg font-medium text-primary">Scenario B</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Structure:</span>
                        <span className="font-medium">{compareOutput.input.waterfallType === 'european' ? 'European' : 'American'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pref Rate:</span>
                        <span className="font-medium">{(compareOutput.input.prefRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Carry:</span>
                        <span className="font-medium">{(compareOutput.input.carryRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Proceeds:</span>
                        <span className="font-medium">{formatCurrency(compareOutput.input.grossProceeds)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>LP Total:</span>
                        <span>{formatCurrency(compareOutput.totalToLPs)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>GP Total:</span>
                        <span>{formatCurrency(compareOutput.totalToGP)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>LP Multiple:</span>
                        <span>{formatMultiple(compareOutput.lpMultiple)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-primary">
                        <span>Effective Carry:</span>
                        <span>{(compareOutput.effectiveCarryRate * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button onClick={() => setCompareMode(false)} variant="outline">
                    Exit Comparison Mode
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Input Form */}
            <div>
              <InputForm input={input} onChange={handleInputChange} />
              <div className="mt-4">
                <Button onClick={startComparison} variant="outline" className="w-full">
                  Compare Two Scenarios
                </Button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div>
              <ResultsView output={output} onExport={handleExport} />
            </div>
          </div>
        </>
      )}

      {/* What-If Sliders */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('whatIf')}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">What-If Analysis</h3>
              <p className="text-sm text-muted-foreground">Adjust parameters to see real-time impact</p>
            </div>
          </div>
          {expandedSections.whatIf ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.whatIf && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <WhatIfSliders
                input={input}
                output={output}
                onInputChange={handleInputChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Calculation Breakdown */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('calculation')}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Step-by-Step Calculation</h3>
              <p className="text-sm text-muted-foreground">See exactly how proceeds flow through each tier</p>
            </div>
          </div>
          {expandedSections.calculation ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.calculation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CalculationBreakdown output={output} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Peer Comparison */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('peerComparison')}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Market Comparison</h3>
              <p className="text-sm text-muted-foreground">See how your terms compare to market standards</p>
            </div>
          </div>
          {expandedSections.peerComparison ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.peerComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PeerComparison input={input} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scenario Library */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('scenarios')}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Scenario Library</h3>
              <p className="text-sm text-muted-foreground">Explore pre-built scenarios across fund types</p>
            </div>
          </div>
          {expandedSections.scenarios ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.scenarios && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SampleScenarios onSelectScenario={loadScenarioFromLibrary} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glossary */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('glossary')}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Waterfall Glossary</h3>
              <p className="text-sm text-muted-foreground">Learn key terms and concepts</p>
            </div>
          </div>
          {expandedSections.glossary ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.glossary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Glossary />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('faq')}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Frequently Asked Questions</h3>
              <p className="text-sm text-muted-foreground">Get answers to common questions</p>
            </div>
          </div>
          {expandedSections.faq ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.faq && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FAQSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </>
      )}
    </div>
  )
}
