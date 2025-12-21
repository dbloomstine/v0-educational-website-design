'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  Star,
  Zap,
  Target,
  Award,
  Crown,
  Sparkles,
  Rocket,
  BookOpen,
  CheckCircle2,
  Lock,
  Gift,
  TrendingUp,
  Calculator,
  Users,
  Lightbulb,
  Medal
} from 'lucide-react'

// Achievement types
export interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  xp: number
  category: 'learning' | 'exploration' | 'mastery' | 'special'
  unlocked: boolean
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

// User level system
export interface UserLevel {
  level: number
  title: string
  minXP: number
  maxXP: number
  icon: React.ReactNode
  color: string
}

export const LEVELS: UserLevel[] = [
  { level: 1, title: 'Curious Newcomer', minXP: 0, maxXP: 100, icon: <Sparkles className="h-5 w-5" />, color: 'text-gray-500' },
  { level: 2, title: 'Eager Learner', minXP: 100, maxXP: 250, icon: <BookOpen className="h-5 w-5" />, color: 'text-green-500' },
  { level: 3, title: 'Fund Explorer', minXP: 250, maxXP: 500, icon: <Target className="h-5 w-5" />, color: 'text-blue-500' },
  { level: 4, title: 'Waterfall Analyst', minXP: 500, maxXP: 800, icon: <Calculator className="h-5 w-5" />, color: 'text-purple-500' },
  { level: 5, title: 'Distribution Expert', minXP: 800, maxXP: 1200, icon: <TrendingUp className="h-5 w-5" />, color: 'text-amber-500' },
  { level: 6, title: 'Carry Master', minXP: 1200, maxXP: 1800, icon: <Award className="h-5 w-5" />, color: 'text-orange-500' },
  { level: 7, title: 'LP Whisperer', minXP: 1800, maxXP: 2500, icon: <Users className="h-5 w-5" />, color: 'text-pink-500' },
  { level: 8, title: 'Fund Virtuoso', minXP: 2500, maxXP: 3500, icon: <Trophy className="h-5 w-5" />, color: 'text-cyan-500' },
  { level: 9, title: 'Waterfall Legend', minXP: 3500, maxXP: 5000, icon: <Crown className="h-5 w-5" />, color: 'text-yellow-500' },
  { level: 10, title: 'Grand Master', minXP: 5000, maxXP: Infinity, icon: <Medal className="h-5 w-5" />, color: 'text-red-500' }
]

// Default achievements
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Learning achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete the tutorial introduction',
    icon: <Rocket className="h-5 w-5" />,
    xp: 25,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'waterfall-101',
    name: 'Waterfall 101',
    description: 'Learn about all 4 waterfall tiers',
    icon: <BookOpen className="h-5 w-5" />,
    xp: 50,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'pref-pro',
    name: 'Pref Pro',
    description: 'Master preferred return concepts',
    icon: <Target className="h-5 w-5" />,
    xp: 50,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'carry-connoisseur',
    name: 'Carry Connoisseur',
    description: 'Understand carried interest mechanics',
    icon: <Award className="h-5 w-5" />,
    xp: 50,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'catch-up-king',
    name: 'Catch-Up Champion',
    description: 'Master the GP catch-up concept',
    icon: <Zap className="h-5 w-5" />,
    xp: 75,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'tutorial-complete',
    name: 'Tutorial Graduate',
    description: 'Complete the full tutorial journey',
    icon: <Trophy className="h-5 w-5" />,
    xp: 100,
    category: 'learning',
    unlocked: false
  },

  // Exploration achievements
  {
    id: 'scenario-explorer',
    name: 'Scenario Explorer',
    description: 'Try 3 different preset scenarios',
    icon: <Target className="h-5 w-5" />,
    xp: 50,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'what-if-wizard',
    name: 'What-If Wizard',
    description: 'Use the what-if sliders 5 times',
    icon: <Sparkles className="h-5 w-5" />,
    xp: 50,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'comparison-master',
    name: 'Comparison Master',
    description: 'Compare two scenarios side-by-side',
    icon: <Users className="h-5 w-5" />,
    xp: 75,
    category: 'exploration',
    unlocked: false
  },
  {
    id: 'glossary-guru',
    name: 'Glossary Guru',
    description: 'Read 10 glossary terms',
    icon: <BookOpen className="h-5 w-5" />,
    xp: 50,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'faq-finder',
    name: 'FAQ Finder',
    description: 'Read 5 FAQ answers',
    icon: <Lightbulb className="h-5 w-5" />,
    xp: 50,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },

  // Mastery achievements
  {
    id: 'quiz-ace',
    name: 'Quiz Ace',
    description: 'Answer 5 quiz questions correctly',
    icon: <CheckCircle2 className="h-5 w-5" />,
    xp: 100,
    category: 'mastery',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: <Star className="h-5 w-5" />,
    xp: 150,
    category: 'mastery',
    unlocked: false
  },
  {
    id: 'calculation-champion',
    name: 'Calculation Champion',
    description: 'View the full calculation breakdown',
    icon: <Calculator className="h-5 w-5" />,
    xp: 50,
    category: 'mastery',
    unlocked: false
  },
  {
    id: 'benchmark-boss',
    name: 'Benchmark Boss',
    description: 'Compare your terms to market benchmarks',
    icon: <TrendingUp className="h-5 w-5" />,
    xp: 50,
    category: 'mastery',
    unlocked: false
  },

  // Special achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Use the tool for the first time',
    icon: <Sparkles className="h-5 w-5" />,
    xp: 25,
    category: 'special',
    unlocked: false
  },
  {
    id: 'home-run',
    name: 'Home Run',
    description: 'Model a fund with 3x+ returns',
    icon: <Rocket className="h-5 w-5" />,
    xp: 75,
    category: 'special',
    unlocked: false
  },
  {
    id: 'lp-friendly',
    name: 'LP Advocate',
    description: 'Create terms rated as "LP-Friendly"',
    icon: <Users className="h-5 w-5" />,
    xp: 75,
    category: 'special',
    unlocked: false
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Use the tool after midnight',
    icon: <Star className="h-5 w-5" />,
    xp: 50,
    category: 'special',
    unlocked: false
  },
  {
    id: 'share-master',
    name: 'Share Master',
    description: 'Share your waterfall with someone',
    icon: <Gift className="h-5 w-5" />,
    xp: 50,
    category: 'special',
    unlocked: false
  }
]

const GAMIFICATION_STORAGE_KEY = 'waterfall-gamification-data'

export interface GamificationState {
  xp: number
  achievements: Achievement[]
  streakDays: number
  lastVisit: string | null
  scenariosExplored: string[]
  quizAnswersCorrect: number
  glossaryTermsRead: string[]
  faqsRead: string[]
  whatIfUsageCount: number
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    xp: 0,
    achievements: DEFAULT_ACHIEVEMENTS,
    streakDays: 0,
    lastVisit: null,
    scenariosExplored: [],
    quizAnswersCorrect: 0,
    glossaryTermsRead: [],
    faqsRead: [],
    whatIfUsageCount: 0
  })

  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null)
  const [showLevelUp, setShowLevelUp] = useState<UserLevel | null>(null)

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(GAMIFICATION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState(prev => ({
          ...prev,
          ...parsed,
          achievements: prev.achievements.map(a => {
            const savedAch = parsed.achievements?.find((sa: Achievement) => sa.id === a.id)
            return savedAch ? { ...a, ...savedAch } : a
          })
        }))
      }
    } catch {
      // Ignore errors
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore errors
    }
  }, [state])

  const getCurrentLevel = useCallback((): UserLevel => {
    return LEVELS.find(l => state.xp >= l.minXP && state.xp < l.maxXP) || LEVELS[LEVELS.length - 1]
  }, [state.xp])

  const getNextLevel = useCallback((): UserLevel | null => {
    const current = getCurrentLevel()
    const nextIndex = LEVELS.findIndex(l => l.level === current.level) + 1
    return nextIndex < LEVELS.length ? LEVELS[nextIndex] : null
  }, [getCurrentLevel])

  const addXP = useCallback((amount: number) => {
    setState(prev => {
      const newXP = prev.xp + amount
      const currentLevel = LEVELS.find(l => prev.xp >= l.minXP && prev.xp < l.maxXP)
      const newLevel = LEVELS.find(l => newXP >= l.minXP && newXP < l.maxXP)

      // Check for level up
      if (currentLevel && newLevel && newLevel.level > currentLevel.level) {
        setTimeout(() => setShowLevelUp(newLevel), 500)
      }

      return { ...prev, xp: newXP }
    })
  }, [])

  const unlockAchievement = useCallback((achievementId: string) => {
    setState(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId)
      if (!achievement || achievement.unlocked) return prev

      // Show achievement popup
      setTimeout(() => setShowAchievement({ ...achievement, unlocked: true }), 300)

      // Add XP
      setTimeout(() => addXP(achievement.xp), 800)

      return {
        ...prev,
        achievements: prev.achievements.map(a =>
          a.id === achievementId ? { ...a, unlocked: true, unlockedAt: new Date() } : a
        )
      }
    })
  }, [addXP])

  const updateAchievementProgress = useCallback((achievementId: string, progress: number) => {
    setState(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId)
      if (!achievement || achievement.unlocked) return prev

      const newProgress = Math.min(progress, achievement.maxProgress || 0)
      const shouldUnlock = newProgress >= (achievement.maxProgress || 0)

      if (shouldUnlock) {
        setTimeout(() => unlockAchievement(achievementId), 100)
      }

      return {
        ...prev,
        achievements: prev.achievements.map(a =>
          a.id === achievementId ? { ...a, progress: newProgress } : a
        )
      }
    })
  }, [unlockAchievement])

  const trackScenarioExplored = useCallback((scenarioId: string) => {
    setState(prev => {
      if (prev.scenariosExplored.includes(scenarioId)) return prev
      const newScenarios = [...prev.scenariosExplored, scenarioId]

      // Update achievement progress
      setTimeout(() => updateAchievementProgress('scenario-explorer', newScenarios.length), 100)

      return { ...prev, scenariosExplored: newScenarios }
    })
  }, [updateAchievementProgress])

  const trackWhatIfUsage = useCallback(() => {
    setState(prev => {
      const newCount = prev.whatIfUsageCount + 1
      setTimeout(() => updateAchievementProgress('what-if-wizard', newCount), 100)
      return { ...prev, whatIfUsageCount: newCount }
    })
  }, [updateAchievementProgress])

  const trackGlossaryRead = useCallback((termId: string) => {
    setState(prev => {
      if (prev.glossaryTermsRead.includes(termId)) return prev
      const newTerms = [...prev.glossaryTermsRead, termId]
      setTimeout(() => updateAchievementProgress('glossary-guru', newTerms.length), 100)
      return { ...prev, glossaryTermsRead: newTerms }
    })
  }, [updateAchievementProgress])

  const trackFaqRead = useCallback((faqId: string) => {
    setState(prev => {
      if (prev.faqsRead.includes(faqId)) return prev
      const newFaqs = [...prev.faqsRead, faqId]
      setTimeout(() => updateAchievementProgress('faq-finder', newFaqs.length), 100)
      return { ...prev, faqsRead: newFaqs }
    })
  }, [updateAchievementProgress])

  const trackQuizCorrect = useCallback(() => {
    setState(prev => {
      const newCount = prev.quizAnswersCorrect + 1
      setTimeout(() => updateAchievementProgress('quiz-ace', newCount), 100)
      return { ...prev, quizAnswersCorrect: newCount }
    })
  }, [updateAchievementProgress])

  return {
    state,
    getCurrentLevel,
    getNextLevel,
    addXP,
    unlockAchievement,
    updateAchievementProgress,
    trackScenarioExplored,
    trackWhatIfUsage,
    trackGlossaryRead,
    trackFaqRead,
    trackQuizCorrect,
    showAchievement,
    setShowAchievement,
    showLevelUp,
    setShowLevelUp
  }
}

// Achievement Unlock Popup
export function AchievementPopup({
  achievement,
  onClose
}: {
  achievement: Achievement | null
  onClose: () => void
}) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <Card className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 shadow-2xl overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-3 text-white"
              >
                <Trophy className="h-8 w-8" />
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Achievement Unlocked!
                  </span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-bold text-lg text-amber-900 dark:text-amber-100"
                >
                  {achievement.name}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 mt-1"
                >
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    {achievement.description}
                  </span>
                  <Badge className="bg-amber-500 text-white">+{achievement.xp} XP</Badge>
                </motion.div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="text-amber-400"
              >
                {achievement.icon}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Level Up Popup
export function LevelUpPopup({
  level,
  onClose
}: {
  level: UserLevel | null
  onClose: () => void
}) {
  useEffect(() => {
    if (level) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [level, onClose])

  return (
    <AnimatePresence>
      {level && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 150 }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                  animate={{
                    opacity: 0,
                    y: Math.random() * -200 - 100,
                    x: (Math.random() - 0.5) * 300,
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 1.5, delay: Math.random() * 0.5 }}
                  className={`absolute top-1/2 left-1/2 w-3 h-3 ${
                    ['bg-amber-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400'][i % 5]
                  } rounded-sm`}
                />
              ))}
            </div>

            <Card className="border-4 border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 shadow-2xl">
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="inline-block"
                >
                  <div className={`rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-6 mx-auto mb-4 ${level.color}`}>
                    <Crown className="h-12 w-12 text-white" />
                  </div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide"
                >
                  Level Up!
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2"
                >
                  Level {level.level}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`text-xl font-semibold mt-1 ${level.color}`}
                >
                  {level.title}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring' }}
                  className="mt-4"
                >
                  <Button onClick={onClose} className="bg-amber-500 hover:bg-amber-600 text-white">
                    Continue Learning
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// XP Progress Bar Component
export function XPProgressBar({
  xp,
  currentLevel,
  nextLevel
}: {
  xp: number
  currentLevel: UserLevel
  nextLevel: UserLevel | null
}) {
  const progressPercent = nextLevel
    ? ((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`${currentLevel.color}`}>{currentLevel.icon}</div>
          <span className="font-medium">{currentLevel.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="font-bold text-amber-600 dark:text-amber-400">{xp} XP</span>
        </div>
      </div>
      <div className="relative">
        <Progress value={progressPercent} className="h-3" />
        <motion.div
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
          style={{ height: '100%' }}
        />
      </div>
      {nextLevel && (
        <p className="text-xs text-muted-foreground text-right">
          {nextLevel.minXP - xp} XP to Level {nextLevel.level}: {nextLevel.title}
        </p>
      )}
    </div>
  )
}

// Achievements Grid Component
export function AchievementsGrid({
  achievements,
  compact = false
}: {
  achievements: Achievement[]
  compact?: boolean
}) {
  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0)

  const categories = ['learning', 'exploration', 'mastery', 'special'] as const
  const categoryLabels = {
    learning: 'Learning',
    exploration: 'Exploration',
    mastery: 'Mastery',
    special: 'Special'
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Achievements</span>
          <span className="text-sm text-muted-foreground">
            {unlockedCount}/{achievements.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {achievements.slice(0, 8).map((achievement) => (
            <div
              key={achievement.id}
              className={`p-2 rounded-lg border ${
                achievement.unlocked
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                  : 'bg-muted/30 border-border opacity-50'
              }`}
              title={achievement.name}
            >
              {achievement.unlocked ? (
                achievement.icon
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Achievements</h3>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} of {achievements.length} unlocked ({totalXP} XP earned)
          </p>
        </div>
        <Trophy className="h-6 w-6 text-amber-500" />
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {categoryLabels[category]}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements
              .filter((a) => a.category === category)
              .map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={achievement.unlocked ? { scale: 1.02 } : {}}
                  className={`p-3 rounded-lg border transition-all ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        achievement.unlocked
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {achievement.unlocked ? achievement.icon : <Lock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${
                          !achievement.unlocked && 'text-muted-foreground'
                        }`}
                      >
                        {achievement.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {achievement.description}
                      </p>
                      {achievement.progress !== undefined && achievement.maxProgress && !achievement.unlocked && (
                        <div className="mt-2">
                          <Progress
                            value={(achievement.progress / achievement.maxProgress) * 100}
                            className="h-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {achievement.progress}/{achievement.maxProgress}
                          </p>
                        </div>
                      )}
                      <Badge
                        variant="secondary"
                        className={`mt-2 ${
                          achievement.unlocked
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                            : ''
                        }`}
                      >
                        {achievement.unlocked ? `+${achievement.xp} XP` : `${achievement.xp} XP`}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
