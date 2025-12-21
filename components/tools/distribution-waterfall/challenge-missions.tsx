'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  Star,
  Clock,
  CheckCircle2,
  Lock,
  Zap,
  Gift,
  Trophy,
  Flame,
  Calculator,
  BookOpen,
  Brain,
  TrendingUp,
  DollarSign,
  Percent,
  Timer,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { UserProgress } from './gamification'

// Mission types and definitions
export interface Mission {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'challenge' | 'streak'
  category: 'learning' | 'calculation' | 'exploration' | 'mastery'
  xpReward: number
  requirement: {
    type: 'quiz_correct' | 'scenarios_run' | 'journey_steps' | 'streak_days' | 'specific_action'
    target: number
    action?: string
  }
  icon: React.ReactNode
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface UserMission extends Mission {
  progress: number
  completed: boolean
  completedAt?: number
  expiresAt?: number
}

// All available missions
export const MISSIONS: Mission[] = [
  // Daily Missions
  {
    id: 'daily_quiz_3',
    title: 'Quiz Whiz',
    description: 'Answer 3 quiz questions correctly',
    type: 'daily',
    category: 'learning',
    xpReward: 50,
    requirement: { type: 'quiz_correct', target: 3 },
    icon: <Brain className="h-4 w-4" />,
    difficulty: 'easy'
  },
  {
    id: 'daily_scenario_1',
    title: 'Number Cruncher',
    description: 'Run a waterfall calculation',
    type: 'daily',
    category: 'calculation',
    xpReward: 30,
    requirement: { type: 'scenarios_run', target: 1 },
    icon: <Calculator className="h-4 w-4" />,
    difficulty: 'easy'
  },
  {
    id: 'daily_journey_2',
    title: 'Eager Learner',
    description: 'Complete 2 journey steps',
    type: 'daily',
    category: 'learning',
    xpReward: 40,
    requirement: { type: 'journey_steps', target: 2 },
    icon: <BookOpen className="h-4 w-4" />,
    difficulty: 'easy'
  },

  // Weekly Missions
  {
    id: 'weekly_quiz_15',
    title: 'Knowledge Seeker',
    description: 'Answer 15 quiz questions correctly this week',
    type: 'weekly',
    category: 'learning',
    xpReward: 200,
    requirement: { type: 'quiz_correct', target: 15 },
    icon: <Brain className="h-4 w-4" />,
    difficulty: 'medium'
  },
  {
    id: 'weekly_scenarios_5',
    title: 'Scenario Master',
    description: 'Run 5 different waterfall scenarios',
    type: 'weekly',
    category: 'calculation',
    xpReward: 150,
    requirement: { type: 'scenarios_run', target: 5 },
    icon: <Calculator className="h-4 w-4" />,
    difficulty: 'medium'
  },
  {
    id: 'weekly_journey_complete',
    title: 'Journey Voyager',
    description: 'Complete all 10 journey steps',
    type: 'weekly',
    category: 'exploration',
    xpReward: 250,
    requirement: { type: 'journey_steps', target: 10 },
    icon: <Target className="h-4 w-4" />,
    difficulty: 'medium'
  },

  // Streak Missions
  {
    id: 'streak_3',
    title: 'Hot Streak',
    description: 'Maintain a 3-day learning streak',
    type: 'streak',
    category: 'mastery',
    xpReward: 100,
    requirement: { type: 'streak_days', target: 3 },
    icon: <Flame className="h-4 w-4" />,
    difficulty: 'medium'
  },
  {
    id: 'streak_7',
    title: 'On Fire',
    description: 'Maintain a 7-day learning streak',
    type: 'streak',
    category: 'mastery',
    xpReward: 300,
    requirement: { type: 'streak_days', target: 7 },
    icon: <Flame className="h-4 w-4" />,
    difficulty: 'hard'
  },

  // Challenge Missions
  {
    id: 'challenge_perfect_quiz',
    title: 'Perfect Score',
    description: 'Get 5 quiz answers correct in a row',
    type: 'challenge',
    category: 'mastery',
    xpReward: 150,
    requirement: { type: 'quiz_correct', target: 5 },
    icon: <Star className="h-4 w-4" />,
    difficulty: 'hard'
  },
  {
    id: 'challenge_speed_calc',
    title: 'Speed Calculator',
    description: 'Run 3 scenarios in under 5 minutes',
    type: 'challenge',
    category: 'calculation',
    xpReward: 175,
    requirement: { type: 'scenarios_run', target: 3 },
    icon: <Timer className="h-4 w-4" />,
    difficulty: 'hard'
  },
  {
    id: 'challenge_full_exploration',
    title: 'Deep Diver',
    description: 'Explore all glossary terms and FAQ sections',
    type: 'challenge',
    category: 'exploration',
    xpReward: 200,
    requirement: { type: 'specific_action', target: 1, action: 'full_exploration' },
    icon: <Target className="h-4 w-4" />,
    difficulty: 'hard'
  }
]

// Hook to manage mission state
export function useMissions(progress: UserProgress) {
  const [missions, setMissions] = useState<UserMission[]>([])

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('waterfall-missions')
    const now = Date.now()

    if (saved) {
      const parsed: UserMission[] = JSON.parse(saved)
      // Filter out expired missions and refresh
      const valid = parsed.filter(m => !m.expiresAt || m.expiresAt > now)
      setMissions(valid)
    }

    // Initialize daily/weekly missions if needed
    const initMissions = () => {
      const currentMissions = JSON.parse(localStorage.getItem('waterfall-missions') || '[]') as UserMission[]

      // Check if we need to refresh daily missions
      const lastDailyRefresh = localStorage.getItem('waterfall-daily-refresh')
      const today = new Date().toDateString()

      if (lastDailyRefresh !== today) {
        // Reset daily missions
        const dailyMissions = MISSIONS.filter(m => m.type === 'daily').map(m => ({
          ...m,
          progress: 0,
          completed: false,
          expiresAt: getEndOfDay()
        }))

        // Merge with existing non-daily missions
        const nonDaily = currentMissions.filter(m => m.type !== 'daily')
        const newMissions = [...nonDaily, ...dailyMissions]

        setMissions(newMissions)
        localStorage.setItem('waterfall-missions', JSON.stringify(newMissions))
        localStorage.setItem('waterfall-daily-refresh', today)
      }

      // Check weekly refresh
      const lastWeeklyRefresh = localStorage.getItem('waterfall-weekly-refresh')
      const weekStart = getStartOfWeek().toDateString()

      if (lastWeeklyRefresh !== weekStart) {
        const weeklyMissions = MISSIONS.filter(m => m.type === 'weekly').map(m => ({
          ...m,
          progress: 0,
          completed: false,
          expiresAt: getEndOfWeek()
        }))

        const currentNonWeekly = missions.filter(m => m.type !== 'weekly')
        const newMissions = [...currentNonWeekly, ...weeklyMissions]

        setMissions(newMissions)
        localStorage.setItem('waterfall-missions', JSON.stringify(newMissions))
        localStorage.setItem('waterfall-weekly-refresh', weekStart)
      }

      // Add challenge and streak missions if not present
      const challengeAndStreak = MISSIONS.filter(m => m.type === 'challenge' || m.type === 'streak')
      const existingIds = missions.map(m => m.id)
      const newChallenges = challengeAndStreak
        .filter(m => !existingIds.includes(m.id))
        .map(m => ({
          ...m,
          progress: 0,
          completed: false
        }))

      if (newChallenges.length > 0) {
        const updatedMissions = [...missions, ...newChallenges]
        setMissions(updatedMissions)
        localStorage.setItem('waterfall-missions', JSON.stringify(updatedMissions))
      }
    }

    initMissions()
  }, [])

  // Update mission progress based on user progress
  useEffect(() => {
    if (missions.length === 0) return

    const updatedMissions = missions.map(m => {
      if (m.completed) return m

      let newProgress = m.progress

      switch (m.requirement.type) {
        case 'streak_days':
          newProgress = progress.streak
          break
        case 'scenarios_run':
          newProgress = progress.scenariosCompleted
          break
        case 'journey_steps':
          newProgress = progress.journeyStepsCompleted
          break
        case 'quiz_correct':
          newProgress = progress.quizCorrectAnswers
          break
      }

      const completed = newProgress >= m.requirement.target

      return {
        ...m,
        progress: newProgress,
        completed,
        completedAt: completed && !m.completed ? Date.now() : m.completedAt
      }
    })

    // Only update if something changed
    if (JSON.stringify(updatedMissions) !== JSON.stringify(missions)) {
      setMissions(updatedMissions)
      localStorage.setItem('waterfall-missions', JSON.stringify(updatedMissions))
    }
  }, [progress, missions])

  const updateMissionProgress = (missionId: string, progress: number) => {
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.id !== missionId) return m
        const completed = progress >= m.requirement.target
        return {
          ...m,
          progress,
          completed,
          completedAt: completed && !m.completed ? Date.now() : m.completedAt
        }
      })
      localStorage.setItem('waterfall-missions', JSON.stringify(updated))
      return updated
    })
  }

  const claimReward = (missionId: string): number => {
    const mission = missions.find(m => m.id === missionId)
    if (!mission || !mission.completed) return 0

    // Mark as claimed (we remove it or mark in a specific way)
    setMissions(prev => {
      const updated = prev.filter(m => m.id !== missionId)
      localStorage.setItem('waterfall-missions', JSON.stringify(updated))
      return updated
    })

    return mission.xpReward
  }

  return { missions, updateMissionProgress, claimReward }
}

// Helper functions for time calculations
function getEndOfDay(): number {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return end.getTime()
}

function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(now.setDate(diff))
}

function getEndOfWeek(): number {
  const start = getStartOfWeek()
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end.getTime()
}

function formatTimeRemaining(expiresAt?: number): string {
  if (!expiresAt) return ''

  const remaining = expiresAt - Date.now()
  if (remaining <= 0) return 'Expired'

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }

  return `${hours}h ${minutes}m`
}

// Mission Card Component
function MissionCard({
  mission,
  onClaim
}: {
  mission: UserMission
  onClaim: () => void
}) {
  const progressPercent = Math.min((mission.progress / mission.requirement.target) * 100, 100)

  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-600 dark:text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    hard: 'bg-red-500/20 text-red-600 dark:text-red-400'
  }

  const typeColors = {
    daily: 'border-blue-500/30 bg-blue-500/5',
    weekly: 'border-purple-500/30 bg-purple-500/5',
    challenge: 'border-orange-500/30 bg-orange-500/5',
    streak: 'border-red-500/30 bg-red-500/5'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className={`overflow-hidden transition-all ${typeColors[mission.type]} ${
        mission.completed ? 'ring-2 ring-green-500/50' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`p-2 rounded-lg ${
              mission.completed ? 'bg-green-500/20' : 'bg-muted'
            }`}>
              {mission.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                mission.icon
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{mission.title}</h4>
                <Badge variant="secondary" className={`text-[10px] ${difficultyColors[mission.difficulty]}`}>
                  {mission.difficulty}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {mission.progress} / {mission.requirement.target}
                  </span>
                  {mission.expiresAt && !mission.completed && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeRemaining(mission.expiresAt)}
                    </span>
                  )}
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            </div>

            {/* Reward */}
            <div className="text-right shrink-0">
              {mission.completed ? (
                <Button
                  size="sm"
                  onClick={onClaim}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                >
                  <Gift className="h-3 w-3 mr-1" />
                  Claim
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  <Zap className="h-3 w-3" />
                  {mission.xpReward} XP
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Main Missions Panel Component
interface MissionsPanelProps {
  progress: UserProgress
  onXPEarned: (xp: number) => void
  compact?: boolean
}

export function MissionsPanel({ progress, onXPEarned, compact = false }: MissionsPanelProps) {
  const { missions, claimReward } = useMissions(progress)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [claimedMission, setClaimedMission] = useState<string | null>(null)

  const types = ['all', 'daily', 'weekly', 'challenge', 'streak']

  const filteredMissions = missions.filter(m =>
    selectedType === 'all' || m.type === selectedType
  )

  const activeMissions = filteredMissions.filter(m => !m.completed)
  const completedMissions = filteredMissions.filter(m => m.completed)

  const handleClaim = (missionId: string) => {
    const xp = claimReward(missionId)
    if (xp > 0) {
      setClaimedMission(missionId)
      onXPEarned(xp)
      setTimeout(() => setClaimedMission(null), 2000)
    }
  }

  // Compact view for sidebar
  if (compact) {
    const availableMissions = missions.filter(m => !m.completed).slice(0, 3)
    const completedCount = missions.filter(m => m.completed).length

    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Missions
            </CardTitle>
            {completedCount > 0 && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
                {completedCount} ready
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableMissions.map(mission => (
            <div
              key={mission.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
            >
              <div className="shrink-0">{mission.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{mission.title}</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(mission.progress / mission.requirement.target) * 100}
                    className="h-1 flex-1"
                  />
                  <span className="text-xs text-muted-foreground">
                    {mission.progress}/{mission.requirement.target}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Missions
          </h2>
          <p className="text-muted-foreground">Complete missions to earn bonus XP</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedMissions.length}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{activeMissions.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {types.map(type => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="capitalize"
          >
            {type}
            {type !== 'all' && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {missions.filter(m => type === 'all' || m.type === type).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* XP Claimed Animation */}
      <AnimatePresence>
        {claimedMission && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold shadow-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              XP Claimed!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Missions (Claimable) */}
      {completedMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Ready to Claim ({completedMissions.length})
          </h3>
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {completedMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClaim={() => handleClaim(mission.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            In Progress ({activeMissions.length})
          </h3>
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {activeMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClaim={() => {}}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredMissions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Missions Available</h3>
            <p className="text-sm text-muted-foreground">
              Check back later for new missions!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Daily/Weekly Summary Widget
export function MissionsSummaryWidget({
  progress,
  onViewAll
}: {
  progress: UserProgress
  onViewAll: () => void
}) {
  const { missions } = useMissions(progress)

  const dailyMissions = missions.filter(m => m.type === 'daily')
  const weeklyMissions = missions.filter(m => m.type === 'weekly')

  const dailyCompleted = dailyMissions.filter(m => m.completed).length
  const weeklyCompleted = weeklyMissions.filter(m => m.completed).length

  const totalClaimable = missions.filter(m => m.completed).length
  const totalXPClaimable = missions
    .filter(m => m.completed)
    .reduce((sum, m) => sum + m.xpReward, 0)

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Missions
          </h3>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Daily</p>
            <p className="text-lg font-bold">{dailyCompleted}/{dailyMissions.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Weekly</p>
            <p className="text-lg font-bold">{weeklyCompleted}/{weeklyMissions.length}</p>
          </div>
        </div>

        {totalClaimable > 0 && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
            className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-center"
          >
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              {totalClaimable} missions ready to claim!
            </p>
            <p className="text-xs text-muted-foreground">
              +{totalXPClaimable} XP available
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
