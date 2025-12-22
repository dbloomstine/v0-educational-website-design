'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Gift,
  TrendingUp,
  Scale,
  DollarSign,
  Briefcase,
  Medal,
  Lightbulb,
  Shield,
  Users
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
  { level: 1, title: 'Expense Novice', minXP: 0, maxXP: 75, icon: <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-gray-500' },
  { level: 2, title: 'Allocation Learner', minXP: 75, maxXP: 175, icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-green-500' },
  { level: 3, title: 'Fund Analyst', minXP: 175, maxXP: 325, icon: <Target className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-blue-500' },
  { level: 4, title: 'Classification Expert', minXP: 325, maxXP: 525, icon: <Scale className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-purple-500' },
  { level: 5, title: 'LP Advocate', minXP: 525, maxXP: 800, icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-amber-500' },
  { level: 6, title: 'Allocation Strategist', minXP: 800, maxXP: 1150, icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-orange-500' },
  { level: 7, title: 'LPA Expert', minXP: 1150, maxXP: 1600, icon: <Shield className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-pink-500' },
  { level: 8, title: 'Fund Operations Guru', minXP: 1600, maxXP: 2200, icon: <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-cyan-500' },
  { level: 9, title: 'Expense Allocation Legend', minXP: 2200, maxXP: 3000, icon: <Crown className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-yellow-500' },
  { level: 10, title: 'Grand Master', minXP: 3000, maxXP: Infinity, icon: <Medal className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'text-red-500' }
]

// Default achievements
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Learning achievements
  {
    id: 'first-classification',
    name: 'First Classification',
    description: 'Complete your first expense classification',
    icon: <Rocket className="h-5 w-5" />,
    xp: 25,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'fund-expense-finder',
    name: 'Fund Expense Finder',
    description: 'Identify a clear fund expense',
    icon: <DollarSign className="h-5 w-5" />,
    xp: 15,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'management-identifier',
    name: 'Management Identifier',
    description: 'Identify a management expense',
    icon: <Briefcase className="h-5 w-5" />,
    xp: 15,
    category: 'learning',
    unlocked: false
  },
  {
    id: 'gray-area-navigator',
    name: 'Gray Area Navigator',
    description: 'Analyze a case-by-case expense',
    icon: <Scale className="h-5 w-5" />,
    xp: 20,
    category: 'learning',
    unlocked: false
  },
  // Exploration achievements
  {
    id: 'pe-explorer',
    name: 'PE Explorer',
    description: 'Analyze expenses for a Private Equity fund',
    icon: <Target className="h-5 w-5" />,
    xp: 10,
    category: 'exploration',
    unlocked: false
  },
  {
    id: 'vc-explorer',
    name: 'VC Explorer',
    description: 'Analyze expenses for a Venture Capital fund',
    icon: <Rocket className="h-5 w-5" />,
    xp: 10,
    category: 'exploration',
    unlocked: false
  },
  {
    id: 'credit-explorer',
    name: 'Credit Explorer',
    description: 'Analyze expenses for a Private Credit fund',
    icon: <TrendingUp className="h-5 w-5" />,
    xp: 10,
    category: 'exploration',
    unlocked: false
  },
  {
    id: 'real-estate-explorer',
    name: 'Real Estate Explorer',
    description: 'Analyze expenses for a Real Estate fund',
    icon: <Gift className="h-5 w-5" />,
    xp: 10,
    category: 'exploration',
    unlocked: false
  },
  {
    id: 'fund-type-master',
    name: 'Fund Type Master',
    description: 'Analyze expenses across all fund types',
    icon: <Crown className="h-5 w-5" />,
    xp: 50,
    category: 'exploration',
    unlocked: false
  },
  {
    id: 'stage-explorer',
    name: 'Stage Explorer',
    description: 'Analyze expenses across all fund stages',
    icon: <Star className="h-5 w-5" />,
    xp: 30,
    category: 'exploration',
    unlocked: false
  },
  // Mastery achievements
  {
    id: 'five-analyses',
    name: 'Consistent Analyst',
    description: 'Complete 5 expense classifications',
    icon: <CheckCircle2 className="h-5 w-5" />,
    xp: 30,
    category: 'mastery',
    unlocked: false
  },
  {
    id: 'ten-analyses',
    name: 'Dedicated Learner',
    description: 'Complete 10 expense classifications',
    icon: <Award className="h-5 w-5" />,
    xp: 50,
    category: 'mastery',
    unlocked: false
  },
  {
    id: 'category-explorer',
    name: 'Category Explorer',
    description: 'Analyze 10 different expense categories',
    icon: <BookOpen className="h-5 w-5" />,
    xp: 40,
    category: 'mastery',
    unlocked: false
  },
  {
    id: 'quiz-starter',
    name: 'Quiz Starter',
    description: 'Complete your first quiz',
    icon: <Lightbulb className="h-5 w-5" />,
    xp: 20,
    category: 'mastery',
    unlocked: false
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Score 100% on a quiz',
    icon: <Trophy className="h-5 w-5" />,
    xp: 75,
    category: 'mastery',
    unlocked: false
  },
  // Special achievements
  {
    id: 'lp-advocate',
    name: 'LP Advocate',
    description: 'Read about LP sensitivities for 5 expenses',
    icon: <Users className="h-5 w-5" />,
    xp: 25,
    category: 'special',
    unlocked: false
  },
  {
    id: 'sample-explorer',
    name: 'Sample Explorer',
    description: 'Try all sample scenarios',
    icon: <Sparkles className="h-5 w-5" />,
    xp: 20,
    category: 'special',
    unlocked: false
  }
]

// Gamification state
export interface GamificationState {
  xp: number
  achievements: Achievement[]
  analysesCompleted: number
  fundTypesExplored: string[]
  fundStagesExplored: string[]
  categoriesExplored: string[]
  samplesExplored: string[]
  lpSensitivitiesRead: number
  quizzesCompleted: number
  perfectQuizzes: number
}

const STORAGE_KEY = 'fund-expense-gamification'

const getInitialState = (): GamificationState => {
  if (typeof window === 'undefined') {
    return {
      xp: 0,
      achievements: DEFAULT_ACHIEVEMENTS,
      analysesCompleted: 0,
      fundTypesExplored: [],
      fundStagesExplored: [],
      categoriesExplored: [],
      samplesExplored: [],
      lpSensitivitiesRead: 0,
      quizzesCompleted: 0,
      perfectQuizzes: 0
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge with default achievements to handle new achievements
      const mergedAchievements = DEFAULT_ACHIEVEMENTS.map(defaultAch => {
        const saved = parsed.achievements?.find((a: Achievement) => a.id === defaultAch.id)
        return saved ? { ...defaultAch, unlocked: saved.unlocked, unlockedAt: saved.unlockedAt } : defaultAch
      })
      return { ...parsed, achievements: mergedAchievements }
    }
  } catch (e) {
    console.error('Failed to load gamification state:', e)
  }

  return {
    xp: 0,
    achievements: DEFAULT_ACHIEVEMENTS,
    analysesCompleted: 0,
    fundTypesExplored: [],
    fundStagesExplored: [],
    categoriesExplored: [],
    samplesExplored: [],
    lpSensitivitiesRead: 0,
    quizzesCompleted: 0,
    perfectQuizzes: 0
  }
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>(getInitialState)
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null)
  const [showLevelUp, setShowLevelUp] = useState<UserLevel | null>(null)

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  const getCurrentLevel = useCallback((): UserLevel => {
    return LEVELS.find(l => state.xp >= l.minXP && state.xp < l.maxXP) || LEVELS[LEVELS.length - 1]
  }, [state.xp])

  const getNextLevel = useCallback((): UserLevel | null => {
    const currentIndex = LEVELS.findIndex(l => state.xp >= l.minXP && state.xp < l.maxXP)
    return currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null
  }, [state.xp])

  const addXP = useCallback((amount: number) => {
    setState(prev => {
      const newXP = prev.xp + amount
      const oldLevel = LEVELS.find(l => prev.xp >= l.minXP && prev.xp < l.maxXP)
      const newLevel = LEVELS.find(l => newXP >= l.minXP && newXP < l.maxXP)

      if (oldLevel && newLevel && newLevel.level > oldLevel.level) {
        setTimeout(() => setShowLevelUp(newLevel), 500)
      }

      return { ...prev, xp: newXP }
    })
  }, [])

  const unlockAchievement = useCallback((achievementId: string) => {
    setState(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId)
      if (!achievement || achievement.unlocked) return prev

      const updatedAchievements = prev.achievements.map(a =>
        a.id === achievementId ? { ...a, unlocked: true, unlockedAt: new Date() } : a
      )

      setTimeout(() => setShowAchievement(achievement), 300)

      return {
        ...prev,
        achievements: updatedAchievements,
        xp: prev.xp + achievement.xp
      }
    })
  }, [])

  const trackAnalysis = useCallback((fundType: string, fundStage: string, category: string, classification: string) => {
    setState(prev => {
      const newAnalyses = prev.analysesCompleted + 1
      const newFundTypes = prev.fundTypesExplored.includes(fundType)
        ? prev.fundTypesExplored
        : [...prev.fundTypesExplored, fundType]
      const newStages = prev.fundStagesExplored.includes(fundStage)
        ? prev.fundStagesExplored
        : [...prev.fundStagesExplored, fundStage]
      const newCategories = prev.categoriesExplored.includes(category)
        ? prev.categoriesExplored
        : [...prev.categoriesExplored, category]

      return {
        ...prev,
        analysesCompleted: newAnalyses,
        fundTypesExplored: newFundTypes,
        fundStagesExplored: newStages,
        categoriesExplored: newCategories
      }
    })
  }, [])

  const trackSampleExplored = useCallback((sampleId: string) => {
    setState(prev => {
      if (prev.samplesExplored.includes(sampleId)) return prev
      return { ...prev, samplesExplored: [...prev.samplesExplored, sampleId] }
    })
  }, [])

  const trackLPSensitivityRead = useCallback(() => {
    setState(prev => ({ ...prev, lpSensitivitiesRead: prev.lpSensitivitiesRead + 1 }))
  }, [])

  const trackQuizComplete = useCallback((isPerfect: boolean) => {
    setState(prev => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1,
      perfectQuizzes: isPerfect ? prev.perfectQuizzes + 1 : prev.perfectQuizzes
    }))
  }, [])

  return {
    state,
    showAchievement,
    setShowAchievement,
    showLevelUp,
    setShowLevelUp,
    getCurrentLevel,
    getNextLevel,
    addXP,
    unlockAchievement,
    trackAnalysis,
    trackSampleExplored,
    trackLPSensitivityRead,
    trackQuizComplete
  }
}

// Achievement Popup Component
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
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 mx-4"
        >
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl p-3 sm:p-4 shadow-xl flex items-center gap-3 sm:gap-4 max-w-sm">
            <div className="rounded-full bg-white/20 p-2 sm:p-3 flex-shrink-0">
              {achievement.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium opacity-90">Achievement Unlocked!</p>
              <p className="font-bold text-sm sm:text-base truncate">{achievement.name}</p>
              <p className="text-xs opacity-80">+{achievement.xp} XP</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Level Up Popup Component
export function LevelUpPopup({
  level,
  onClose
}: {
  level: UserLevel | null
  onClose: () => void
}) {
  useEffect(() => {
    if (level) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [level, onClose])

  return (
    <AnimatePresence>
      {level && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl p-6 sm:p-8 text-center shadow-2xl max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className={`inline-block ${level.color} bg-white/20 rounded-full p-4 sm:p-6 mb-4`}
            >
              {level.icon}
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Level Up!</h3>
            <p className="text-base sm:text-lg opacity-90 mb-1">Level {level.level}</p>
            <p className="text-lg sm:text-xl font-semibold">{level.title}</p>
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
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className={`${currentLevel.color} flex-shrink-0`}>{currentLevel.icon}</div>
          <span className="font-medium truncate">{currentLevel.title}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
          <span className="font-bold text-amber-600 dark:text-amber-400">{xp} XP</span>
        </div>
      </div>
      <div className="relative h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
        />
      </div>
      {nextLevel && (
        <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
          {nextLevel.minXP - xp} XP to Lv.{nextLevel.level}: {nextLevel.title}
        </p>
      )}
    </div>
  )
}

// Confetti Effect
export function Confetti({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
            y: -20
          }}
          animate={{
            opacity: 0,
            y: typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
            rotate: Math.random() * 720 - 360
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: 'easeOut',
            delay: Math.random() * 0.5
          }}
          className="absolute w-2 h-2 sm:w-3 sm:h-3"
          style={{
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'][
              Math.floor(Math.random() * 6)
            ],
            borderRadius: Math.random() > 0.5 ? '50%' : '0%'
          }}
        />
      ))}
    </div>
  )
}
