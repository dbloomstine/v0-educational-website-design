'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Percent,
  Zap,
  Trophy,
  Star,
  Brain,
  Gift,
  Flame,
  PartyPopper,
  BookOpen,
  Lightbulb,
  Award
} from 'lucide-react'
import { WaterfallInput, defaultInput } from './waterfallCalculations'
import { UserProgress, LEVELS } from './gamification'
import { QUIZ_QUESTIONS, QuizQuestion } from './quiz'
import { ConfettiCelebration, SparkleEffect, FlyingNumber, ProgressRing, SuccessCheckmark } from './visual-effects'

interface EnhancedJourneyProps {
  onComplete: (input: WaterfallInput) => void
  onSkip: () => void
  progress: UserProgress
  onXPEarned: (xp: number, reason: string) => void
  onStepComplete: () => void
  onAchievementCheck: (type: string, value?: any) => void
}

interface JourneyStep {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  description: string
  learnMore?: string
  xpReward: number
  quizAfter?: boolean
  quizTopic?: string
}

const journeySteps: JourneyStep[] = [
  {
    id: 'welcome',
    title: 'Understanding Waterfalls',
    subtitle: "Let's Learn Together",
    icon: <Sparkles className="h-8 w-8" />,
    description: "A distribution waterfall determines how profits flow from a fund's investments to LPs and the GP. We'll guide you through each concept step by step.",
    learnMore: "The term 'waterfall' comes from the way distributions flow down through multiple tiers, like water cascading down levels.",
    xpReward: 25,
    quizAfter: false
  },
  {
    id: 'fund-basics',
    title: 'Fund Basics',
    subtitle: 'The Foundation',
    icon: <Building2 className="h-8 w-8" />,
    description: 'Start with the fund size and how much capital was invested. These form the basis for all waterfall calculations.',
    learnMore: "Committed capital vs contributed capital matters because fees are charged on committed, but the waterfall operates on contributed.",
    xpReward: 50,
    quizAfter: true,
    quizTopic: 'fund-basics'
  },
  {
    id: 'exit-proceeds',
    title: 'Exit Proceeds',
    subtitle: 'Investment Returns',
    icon: <TrendingUp className="h-8 w-8" />,
    description: "How much did the fund's investments return? This is the total cash received before any splits.",
    learnMore: "Gross proceeds is the waterfall starting point. A 2x gross multiple means the fund doubled its capital.",
    xpReward: 50,
    quizAfter: false
  },
  {
    id: 'structure',
    title: 'Waterfall Structure',
    subtitle: 'European vs American',
    icon: <Layers className="h-8 w-8" />,
    description: "Choose between European (whole-fund) and American (deal-by-deal) waterfall structures.",
    learnMore: "European waterfalls are more LP-friendly. Most PE funds use European; many VC funds use American.",
    xpReward: 75,
    quizAfter: true,
    quizTopic: 'structure'
  },
  {
    id: 'preferred-return',
    title: 'Preferred Return',
    subtitle: 'The LP Hurdle',
    icon: <Target className="h-8 w-8" />,
    description: "The preferred return is the annual return LPs must receive before the GP participates in profits.",
    learnMore: "Think of it as a minimum performance threshold the GP must achieve.",
    xpReward: 75,
    quizAfter: true,
    quizTopic: 'preferred-return'
  },
  {
    id: 'carried-interest',
    title: 'Carried Interest',
    subtitle: 'GP Economics',
    icon: <Percent className="h-8 w-8" />,
    description: "Carried interest is the GP's share of profits after the hurdle is cleared.",
    learnMore: "The '2 and 20' model is industry standard, but terms vary.",
    xpReward: 75,
    quizAfter: true,
    quizTopic: 'carried-interest'
  },
  {
    id: 'catch-up',
    title: 'GP Catch-Up',
    subtitle: 'Leveling the Field',
    icon: <PieChart className="h-8 w-8" />,
    description: "The catch-up allows the GP to receive a larger share after pref until they've received their target carry.",
    learnMore: "Without catch-up, GP only earns carry on profits above pref. With catch-up, they get their full share.",
    xpReward: 100,
    quizAfter: true,
    quizTopic: 'catch-up'
  },
  {
    id: 'gp-commitment',
    title: 'GP Commitment',
    subtitle: 'Skin in the Game',
    icon: <DollarSign className="h-8 w-8" />,
    description: "GPs invest their own capital alongside LPs to demonstrate alignment.",
    learnMore: "Standard GP commitments range from 1-5% of fund size.",
    xpReward: 50,
    quizAfter: false
  },
  {
    id: 'timing',
    title: 'Investment Timeline',
    subtitle: 'Hold Period',
    icon: <Clock className="h-8 w-8" />,
    description: "How long was the capital invested? This affects preferred return calculations.",
    learnMore: "Typical hold periods: PE (3-5 years), VC (5-7 years), Real Estate (3-7 years).",
    xpReward: 50,
    quizAfter: false
  },
  {
    id: 'review',
    title: 'Review Your Inputs',
    subtitle: 'Final Check',
    icon: <CheckCircle2 className="h-8 w-8" />,
    description: "Review your waterfall parameters before we calculate the distribution.",
    xpReward: 100,
    quizAfter: false
  }
]

// Mini quiz component for journey steps
function StepQuiz({
  topic,
  onComplete,
  onXPEarned
}: {
  topic: string
  onComplete: () => void
  onXPEarned: (xp: number, reason: string) => void
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  // Get 2 questions for this topic
  const topicQuestions = QUIZ_QUESTIONS.filter(q => q.topic === topic).slice(0, 2)

  if (topicQuestions.length === 0) {
    // No questions for this topic, auto-complete
    useEffect(() => {
      onComplete()
    }, [])
    return null
  }

  const question = topicQuestions[currentQuestion]

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index)
    setShowResult(true)

    if (index === question.correctIndex) {
      setCorrectCount(prev => prev + 1)
      onXPEarned(25, 'Correct quiz answer')
    }
  }

  const handleNext = () => {
    if (currentQuestion < topicQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      // Bonus for getting all correct
      if (correctCount + (selectedAnswer === question.correctIndex ? 1 : 0) === topicQuestions.length) {
        onXPEarned(25, 'Perfect quiz score bonus!')
      }
      onComplete()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Quick Knowledge Check</h3>
        <Badge variant="secondary" className="ml-auto">
          {currentQuestion + 1}/{topicQuestions.length}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{question.question}</p>

      <div className="space-y-2 mb-4">
        {question.options.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => !showResult && handleAnswer(index)}
            disabled={showResult}
            className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
              showResult
                ? index === question.correctIndex
                  ? 'bg-green-500/20 border-2 border-green-500 text-green-700 dark:text-green-300'
                  : index === selectedAnswer
                  ? 'bg-red-500/20 border-2 border-red-500 text-red-700 dark:text-red-300'
                  : 'bg-muted/50 border border-border opacity-50'
                : selectedAnswer === index
                ? 'bg-primary/10 border-2 border-primary'
                : 'bg-muted/50 border border-border hover:border-primary/50'
            }`}
            whileHover={!showResult ? { scale: 1.01 } : {}}
            whileTap={!showResult ? { scale: 0.99 } : {}}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
              {showResult && index === question.correctIndex && (
                <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
              )}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className={`p-3 rounded-lg text-sm ${
              selectedAnswer === question.correctIndex
                ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
            }`}>
              <p className="font-medium mb-1">
                {selectedAnswer === question.correctIndex ? '🎉 Correct!' : '💡 Not quite!'}
              </p>
              <p className="text-xs">{question.explanation}</p>
            </div>

            <Button onClick={handleNext} className="w-full">
              {currentQuestion < topicQuestions.length - 1 ? 'Next Question' : 'Continue Journey'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// XP notification component
function XPNotification({ xp, reason }: { xp: number; reason: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      className="fixed bottom-8 right-8 z-50"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg">
        <Zap className="h-5 w-5" />
        <div>
          <p className="font-bold">+{xp} XP</p>
          <p className="text-xs text-white/80">{reason}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Step completion celebration
function StepCelebration({ step, xp, onDismiss }: { step: JourneyStep; xp: number; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <ConfettiCelebration active />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="bg-card p-8 rounded-2xl shadow-2xl text-center max-w-sm border-2 border-primary/20"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className="text-5xl mb-4"
        >
          🎉
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Step Complete!</h2>
        <p className="text-muted-foreground mb-4">{step.title}</p>
        <div className="flex items-center justify-center gap-2 text-xl font-bold text-yellow-600 dark:text-yellow-400">
          <Zap className="h-6 w-6" />
          +{xp} XP
        </div>
      </motion.div>
    </motion.div>
  )
}

// Progress header with gamification
function JourneyProgress({
  currentStep,
  totalSteps,
  progress,
  totalXPEarned
}: {
  currentStep: number
  totalSteps: number
  progress: UserProgress
  totalXPEarned: number
}) {
  const currentLevel = LEVELS.find(
    l => progress.xp >= l.minXP && progress.xp < l.maxXP
  ) || LEVELS[LEVELS.length - 1]

  const levelProgress = ((progress.xp - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100

  return (
    <div className="space-y-4">
      {/* Main progress bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {journeySteps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/30'
                  : 'bg-muted text-muted-foreground'
              }`}
              animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {index < currentStep ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </motion.div>
          ))}
        </div>
        <Progress value={(currentStep / (totalSteps - 1)) * 100} className="h-2 -mt-5" />
      </div>

      {/* XP and Level display */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ProgressRing
              progress={levelProgress}
              size={48}
              strokeWidth={4}
              color="hsl(var(--primary))"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{currentLevel.level}</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{currentLevel.title}</p>
            <p className="text-xs text-muted-foreground">{progress.xp} XP total</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
            <Zap className="h-3 w-3 mr-1" />
            +{totalXPEarned} this journey
          </Badge>
        </div>
      </div>
    </div>
  )
}

export function EnhancedJourney({
  onComplete,
  onSkip,
  progress,
  onXPEarned,
  onStepComplete,
  onAchievementCheck
}: EnhancedJourneyProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [input, setInput] = useState<WaterfallInput>(defaultInput)
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [stepXPEarned, setStepXPEarned] = useState(0)
  const [totalXPEarned, setTotalXPEarned] = useState(0)
  const [xpNotification, setXpNotification] = useState<{ xp: number; reason: string } | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const step = journeySteps[currentStep]
  const progressPercent = ((currentStep + 1) / journeySteps.length) * 100

  const updateInput = <K extends keyof WaterfallInput>(field: K, value: WaterfallInput[K]) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  const showXPGain = useCallback((xp: number, reason: string) => {
    setXpNotification({ xp, reason })
    setTotalXPEarned(prev => prev + xp)
    onXPEarned(xp, reason)
    setTimeout(() => setXpNotification(null), 2000)
  }, [onXPEarned])

  const handleStepComplete = () => {
    if (!completedSteps.has(step.id)) {
      setCompletedSteps(prev => new Set([...prev, step.id]))
      showXPGain(step.xpReward, `Completed: ${step.title}`)
      setStepXPEarned(step.xpReward)
      onStepComplete()

      // Check for achievements
      onAchievementCheck('journey_step', completedSteps.size + 1)
    }

    if (step.quizAfter && step.quizTopic) {
      setShowQuiz(true)
    } else {
      proceedToNext()
    }
  }

  const proceedToNext = () => {
    if (currentStep < journeySteps.length - 1) {
      setShowCelebration(true)
    } else {
      // Journey complete!
      onAchievementCheck('journey_complete', true)
      showXPGain(200, 'Journey Complete! 🎉')
      onComplete(input)
    }
  }

  const handleCelebrationDismiss = () => {
    setShowCelebration(false)
    setStepXPEarned(0)
    setCurrentStep(prev => prev + 1)
    setShowLearnMore(false)
  }

  const handleQuizComplete = () => {
    setShowQuiz(false)
    proceedToNext()
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setShowLearnMore(false)
      setShowQuiz(false)
    }
  }

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>

            {/* Animated waterfall tiers */}
            <div className="grid gap-3 mt-6">
              {[
                { tier: 1, title: 'Return of Capital', desc: 'LPs get their invested money back first', color: 'blue' },
                { tier: 2, title: 'Preferred Return', desc: 'LPs receive their minimum hurdle return', color: 'green' },
                { tier: 3, title: 'GP Catch-Up', desc: 'GP catches up to their target carry share', color: 'purple' },
                { tier: 4, title: 'Profit Split', desc: 'Remaining profits shared LP/GP per carry rate', color: 'amber' }
              ].map((item, index) => (
                <motion.div
                  key={item.tier}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`flex items-start gap-3 p-4 rounded-lg bg-${item.color}-50 dark:bg-${item.color}-950/30 border border-${item.color}-200 dark:border-${item.color}-800`}
                >
                  <div className={`rounded-full bg-${item.color}-100 dark:bg-${item.color}-900 p-2`}>
                    <span className={`text-lg font-semibold text-${item.color}-600 dark:text-${item.color}-400`}>{item.tier}</span>
                  </div>
                  <div>
                    <h4 className={`font-medium text-${item.color}-900 dark:text-${item.color}-100`}>{item.title}</h4>
                    <p className={`text-sm text-${item.color}-700 dark:text-${item.color}-300`}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* XP reward preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 mt-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
            >
              <Gift className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium">Complete this journey to earn <span className="text-yellow-600 dark:text-yellow-400 font-bold">600+ XP</span></span>
            </motion.div>
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
                    The total amount LPs have committed to invest.
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributedCapital" className="flex items-center gap-2">
                  Contributed Capital (Actually Invested)
                  <InfoPopover>
                    How much was actually drawn and deployed.
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
                <Label htmlFor="grossProceeds">Gross Exit Proceeds</Label>
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

              <div className="flex flex-wrap gap-2">
                {[1.5, 2.0, 2.5, 3.0].map((mult) => (
                  <Button
                    key={mult}
                    variant={input.grossProceeds === input.contributedCapital * mult ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateInput('grossProceeds', input.contributedCapital * mult)}
                  >
                    {mult}x Return
                  </Button>
                ))}
              </div>

              {input.contributedCapital > 0 && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Gross Multiple: </span>
                    <span className="font-semibold">{(input.grossProceeds / input.contributedCapital).toFixed(2)}x</span>
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
              <motion.button
                onClick={() => updateInput('waterfallType', 'european')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  input.waterfallType === 'european'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h4 className="font-semibold mb-2">🇪🇺 European (Whole-Fund)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  GP receives carry only after entire fund returns capital + pref.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ More LP-friendly</li>
                  <li>✓ Standard in buyout PE</li>
                </ul>
              </motion.button>

              <motion.button
                onClick={() => updateInput('waterfallType', 'american')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  input.waterfallType === 'american'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h4 className="font-semibold mb-2">🇺🇸 American (Deal-by-Deal)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  GP can receive carry on individual deals.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Earlier GP carry</li>
                  <li>✓ Common in VC</li>
                </ul>
              </motion.button>
            </div>
          </div>
        )

      case 'preferred-return':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Return Rate (Annual %)</Label>
                <div className="relative">
                  <Input
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
                <Label>Compounding Method</Label>
                <Select
                  value={input.prefCompounding}
                  onValueChange={(value) => updateInput('prefCompounding', value as 'simple' | 'compound')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="compound">Compound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 'carried-interest':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Carried Interest Rate (%)</Label>
                <div className="relative">
                  <Input
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
                <p className="text-xs text-muted-foreground">20% is the industry standard</p>
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
                    <Label>Catch-Up Rate (%)</Label>
                    <div className="relative">
                      <Input
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
                    <div className="flex gap-2">
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
            </div>
          </div>
        )

      case 'gp-commitment':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>GP Commitment (% of Fund)</Label>
                <div className="relative">
                  <Input
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
                    <span className="text-muted-foreground">GP Commitment: </span>
                    <span className="font-semibold">${((input.fundSize * input.gpCommitmentPercent) / 1000000).toFixed(2)}M</span>
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
                <Label>Years to Exit</Label>
                <Input
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
              </div>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">{step.description}</p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
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
                  <p className="font-semibold">{(input.prefRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carry Rate</p>
                  <p className="font-semibold">{(input.carryRate * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Journey complete reward preview */}
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center justify-center gap-2 p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/30"
              >
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  Calculate to complete your journey and earn +200 bonus XP!
                </span>
              </motion.div>
            </motion.div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* XP Notification */}
      <AnimatePresence>
        {xpNotification && (
          <XPNotification xp={xpNotification.xp} reason={xpNotification.reason} />
        )}
      </AnimatePresence>

      {/* Step Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <StepCelebration
            step={step}
            xp={stepXPEarned}
            onDismiss={handleCelebrationDismiss}
          />
        )}
      </AnimatePresence>

      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
        <CardHeader className="pb-4 space-y-4">
          <JourneyProgress
            currentStep={currentStep}
            totalSteps={journeySteps.length}
            progress={progress}
            totalXPEarned={totalXPEarned}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-full bg-primary/10 p-3 text-primary"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                {step.icon}
              </motion.div>
              <div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{step.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                <Zap className="h-3 w-3 mr-1" />
                +{step.xpReward} XP
              </Badge>
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {showQuiz ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepQuiz
                  topic={step.quizTopic || ''}
                  onComplete={handleQuizComplete}
                  onXPEarned={showXPGain}
                />
              </motion.div>
            ) : (
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
                      <Lightbulb className="h-4 w-4 mr-1" />
                      {showLearnMore ? 'Hide Details' : 'Learn More'}
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
            )}
          </AnimatePresence>

          {!showQuiz && (
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
              <Button onClick={handleStepComplete} className="gap-2">
                {currentStep === journeySteps.length - 1 ? (
                  <>
                    <Trophy className="h-4 w-4" />
                    Calculate Waterfall
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
