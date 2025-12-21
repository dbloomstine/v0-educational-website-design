'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Target,
  Zap,
  BookOpen,
  Calculator,
  Star,
  TrendingUp,
  Clock,
  Award,
  Flame,
  ChevronRight,
  Lock,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Brain,
  Lightbulb,
  Medal,
  Crown,
  Gift
} from 'lucide-react'
import { UserProgress, LEVELS, ACHIEVEMENTS, Achievement, useGamification } from './gamification'
import { ProgressRing } from './visual-effects'

interface ProgressDashboardProps {
  progress: UserProgress
  onStartJourney: () => void
  onViewAchievements: () => void
  onStartQuiz: () => void
  compact?: boolean
}

// Calculate stats from progress
function calculateStats(progress: UserProgress) {
  const unlockedAchievements = progress.achievements.filter(a => a.unlockedAt).length
  const totalAchievements = ACHIEVEMENTS.length
  const completionPercent = (unlockedAchievements / totalAchievements) * 100

  const currentLevel = LEVELS.find(
    l => progress.xp >= l.minXP && progress.xp < l.maxXP
  ) || LEVELS[LEVELS.length - 1]

  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1)
  const xpToNextLevel = nextLevel ? nextLevel.minXP - progress.xp : 0
  const levelProgress = nextLevel
    ? ((progress.xp - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100
    : 100

  // Calculate category progress
  const categoryStats = {
    learning: { unlocked: 0, total: 0 },
    exploration: { unlocked: 0, total: 0 },
    mastery: { unlocked: 0, total: 0 },
    special: { unlocked: 0, total: 0 }
  }

  ACHIEVEMENTS.forEach(a => {
    categoryStats[a.category].total++
    if (progress.achievements.find(pa => pa.id === a.id && pa.unlockedAt)) {
      categoryStats[a.category].unlocked++
    }
  })

  return {
    currentLevel,
    nextLevel,
    xpToNextLevel,
    levelProgress,
    unlockedAchievements,
    totalAchievements,
    completionPercent,
    categoryStats
  }
}

// Recent activity item
interface ActivityItem {
  id: string
  type: 'achievement' | 'level' | 'quiz' | 'scenario'
  title: string
  description: string
  timestamp: number
  icon: React.ReactNode
  xp?: number
}

function getRecentActivity(progress: UserProgress): ActivityItem[] {
  const activities: ActivityItem[] = []

  // Add unlocked achievements
  progress.achievements
    .filter(a => a.unlockedAt)
    .forEach(a => {
      const achievement = ACHIEVEMENTS.find(ach => ach.id === a.id)
      if (achievement) {
        activities.push({
          id: `achievement-${a.id}`,
          type: 'achievement',
          title: achievement.title,
          description: achievement.description,
          timestamp: a.unlockedAt!,
          icon: <Award className="h-4 w-4 text-yellow-500" />,
          xp: achievement.xp
        })
      }
    })

  // Sort by timestamp descending
  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
}

// Compact progress card for sidebar/header
export function CompactProgressCard({ progress, onViewDashboard }: {
  progress: UserProgress
  onViewDashboard: () => void
}) {
  const stats = calculateStats(progress)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onViewDashboard}
    >
      <div className="relative">
        <ProgressRing
          progress={stats.levelProgress}
          size={48}
          strokeWidth={4}
          color="hsl(var(--primary))"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{stats.currentLevel.level}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{stats.currentLevel.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-yellow-500" />
          <span>{progress.xp} XP</span>
          <span>•</span>
          <Trophy className="h-3 w-3 text-amber-500" />
          <span>{stats.unlockedAchievements}</span>
        </div>
      </div>

      {progress.streak > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1 bg-orange-500/20 text-orange-600 dark:text-orange-400">
          <Flame className="h-3 w-3" />
          {progress.streak}
        </Badge>
      )}

      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </motion.div>
  )
}

// Main progress dashboard
export function ProgressDashboard({
  progress,
  onStartJourney,
  onViewAchievements,
  onStartQuiz,
  compact = false
}: ProgressDashboardProps) {
  const stats = calculateStats(progress)
  const recentActivity = getRecentActivity(progress)

  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <ProgressRing
                progress={stats.levelProgress}
                size={64}
                strokeWidth={5}
                color="hsl(var(--primary))"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{stats.currentLevel.level}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`${stats.currentLevel.color}`}>{stats.currentLevel.icon}</span>
                <span className="font-semibold">{stats.currentLevel.title}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  {progress.xp} XP
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  {stats.unlockedAchievements}/{stats.totalAchievements}
                </span>
                {progress.streak > 0 && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {progress.streak} streak
                  </span>
                )}
              </div>
            </div>

            <Button size="sm" onClick={onStartJourney}>
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Level Progress */}
            <div className="flex items-center gap-4 flex-1">
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <ProgressRing
                  progress={stats.levelProgress}
                  size={100}
                  strokeWidth={8}
                  color="hsl(var(--primary))"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{stats.currentLevel.level}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</span>
                </div>
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`${stats.currentLevel.color}`}>{stats.currentLevel.icon}</span>
                  <h3 className="text-xl font-bold">{stats.currentLevel.title}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress to next level</span>
                    <span className="font-medium">{progress.xp} / {stats.currentLevel.maxXP} XP</span>
                  </div>
                  <Progress value={stats.levelProgress} className="h-2" />
                  {stats.nextLevel && (
                    <p className="text-xs text-muted-foreground">
                      {stats.xpToNextLevel} XP until {stats.nextLevel.title}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <motion.div
                className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{progress.xp}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </motion.div>

              <motion.div
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats.unlockedAchievements}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </motion.div>

              <motion.div
                className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{progress.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </motion.div>

              <motion.div
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Calculator className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{progress.scenariosCompleted}</p>
                <p className="text-xs text-muted-foreground">Scenarios</p>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Progress */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { key: 'learning' as const, label: 'Learning', icon: <BookOpen className="h-4 w-4" />, color: 'bg-blue-500' },
          { key: 'exploration' as const, label: 'Exploration', icon: <Target className="h-4 w-4" />, color: 'bg-green-500' },
          { key: 'mastery' as const, label: 'Mastery', icon: <Brain className="h-4 w-4" />, color: 'bg-purple-500' },
          { key: 'special' as const, label: 'Special', icon: <Star className="h-4 w-4" />, color: 'bg-yellow-500' }
        ].map((category) => {
          const catStats = stats.categoryStats[category.key]
          const percent = catStats.total > 0 ? (catStats.unlocked / catStats.total) * 100 : 0

          return (
            <motion.div
              key={category.key}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded ${category.color}/20`}>
                  {category.icon}
                </div>
                <span className="font-medium text-sm">{category.label}</span>
              </div>
              <Progress value={percent} className="h-1.5 mb-2" />
              <p className="text-xs text-muted-foreground">
                {catStats.unlocked} of {catStats.total} unlocked
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="cursor-pointer border-primary/20 hover:border-primary/40 transition-colors h-full"
            onClick={onStartJourney}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-1">Learning Journey</h4>
              <p className="text-sm text-muted-foreground">
                Continue your waterfall education
              </p>
              <Badge className="mt-3" variant="secondary">
                +50 XP per step
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="cursor-pointer border-green-500/20 hover:border-green-500/40 transition-colors h-full"
            onClick={onStartQuiz}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-green-500/10 mb-3">
                <Brain className="h-6 w-6 text-green-500" />
              </div>
              <h4 className="font-semibold mb-1">Take a Quiz</h4>
              <p className="text-sm text-muted-foreground">
                Test your waterfall knowledge
              </p>
              <Badge className="mt-3" variant="secondary">
                +25 XP per correct answer
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="cursor-pointer border-amber-500/20 hover:border-amber-500/40 transition-colors h-full"
            onClick={onViewAchievements}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-amber-500/10 mb-3">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <h4 className="font-semibold mb-1">View Achievements</h4>
              <p className="text-sm text-muted-foreground">
                {stats.unlockedAchievements} of {stats.totalAchievements} unlocked
              </p>
              <Badge className="mt-3" variant="secondary">
                {stats.completionPercent.toFixed(0)}% complete
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-full bg-muted">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  {activity.xp && (
                    <Badge variant="secondary" className="shrink-0">
                      +{activity.xp} XP
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Achievements gallery view
export function AchievementsGallery({ progress }: { progress: UserProgress }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'learning', 'exploration', 'mastery', 'special']

  const filteredAchievements = ACHIEVEMENTS.filter(a =>
    selectedCategory === 'all' || a.category === selectedCategory
  )

  const isUnlocked = (id: string) =>
    progress.achievements.some(a => a.id === id && a.unlockedAt)

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="capitalize"
          >
            {cat === 'all' ? 'All' : cat}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAchievements.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id)

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`h-full transition-all ${
                unlocked
                  ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-amber-500/10'
                  : 'opacity-60 grayscale'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-full text-3xl ${
                      unlocked ? 'bg-yellow-500/20' : 'bg-muted'
                    }`}>
                      {unlocked ? achievement.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{achievement.title}</h4>
                        {unlocked && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {achievement.xp} XP
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Level roadmap showing progression
export function LevelRoadmap({ progress }: { progress: UserProgress }) {
  const currentLevel = LEVELS.find(
    l => progress.xp >= l.minXP && progress.xp < l.maxXP
  ) || LEVELS[LEVELS.length - 1]

  return (
    <div className="space-y-4">
      {LEVELS.map((level, index) => {
        const isCurrentLevel = level.level === currentLevel.level
        const isUnlocked = progress.xp >= level.minXP
        const isNextLevel = level.level === currentLevel.level + 1

        return (
          <motion.div
            key={level.level}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative flex items-center gap-4 p-4 rounded-lg border transition-all ${
              isCurrentLevel
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : isUnlocked
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-border opacity-50'
            }`}
          >
            {/* Level indicator */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isCurrentLevel
                ? 'bg-primary text-primary-foreground'
                : isUnlocked
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {isUnlocked ? (
                <span className="text-xl">{level.icon}</span>
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </div>

            {/* Level info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">Level {level.level}</span>
                <span className={`font-medium ${level.color}`}>{level.title}</span>
                {isCurrentLevel && (
                  <Badge className="bg-primary/20 text-primary">Current</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {level.minXP.toLocaleString()} - {level.maxXP.toLocaleString()} XP
              </p>
            </div>

            {/* Status */}
            <div>
              {isUnlocked ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : isNextLevel ? (
                <div className="text-right">
                  <p className="text-sm font-medium">{level.minXP - progress.xp} XP</p>
                  <p className="text-xs text-muted-foreground">to unlock</p>
                </div>
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Connector line */}
            {index < LEVELS.length - 1 && (
              <div className={`absolute left-[2.25rem] top-16 w-0.5 h-4 ${
                isUnlocked ? 'bg-green-500/50' : 'bg-border'
              }`} />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
