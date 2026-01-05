'use client'

import { ReactNode, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  SkipForward,
  X,
  Sparkles,
  Keyboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useJourneyMode,
  journeySlideVariants,
  type JourneyStepBase,
  type UseJourneyModeOptions,
} from '@/lib/hooks'

/**
 * Theme configuration for journey mode colors
 */
export interface JourneyTheme {
  /** Gradient for progress bar (e.g., "from-primary to-purple-500") */
  progressGradient: string
  /** Background gradient for header (e.g., "from-primary/10 to-purple-500/10") */
  headerGradient: string
  /** Text color class for accent elements */
  accentText?: string
  /** Confetti colors array */
  confettiColors?: string[]
}

/**
 * Default theme presets
 */
export const JOURNEY_THEMES: Record<string, JourneyTheme> = {
  primary: {
    progressGradient: 'from-primary to-purple-500',
    headerGradient: 'from-primary/10 to-purple-500/10',
    confettiColors: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
  },
  blue: {
    progressGradient: 'from-blue-400 to-cyan-500',
    headerGradient: 'from-blue-500/10 to-cyan-500/10',
    confettiColors: ['#38bdf8', '#22d3ee', '#6366f1', '#22c55e'],
  },
  purple: {
    progressGradient: 'from-purple-400 to-violet-500',
    headerGradient: 'from-purple-500/10 to-violet-500/10',
    confettiColors: ['#a855f7', '#8b5cf6', '#6366f1', '#22c55e'],
  },
  amber: {
    progressGradient: 'from-amber-400 to-orange-500',
    headerGradient: 'from-amber-500/10 to-orange-500/10',
    confettiColors: ['#f59e0b', '#f97316', '#eab308', '#22c55e'],
  },
  indigo: {
    progressGradient: 'from-indigo-500 to-purple-500',
    headerGradient: 'from-indigo-500/10 to-purple-500/10',
    confettiColors: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
  },
}

/**
 * Props for the JourneyModeBase component
 */
export interface JourneyModeBaseProps<TStep extends JourneyStepBase> {
  /** Array of steps */
  steps: TStep[]
  /** Called when journey completes */
  onComplete: () => void
  /** Called when user skips/exits */
  onSkip: () => void
  /** Render function for step content */
  renderStep: (step: TStep, helpers: JourneyRenderHelpers) => ReactNode
  /** Theme configuration or preset name */
  theme?: JourneyTheme | keyof typeof JOURNEY_THEMES
  /** Title shown in header */
  title?: string
  /** Number of phases for phase dots (optional) */
  phaseCount?: number
  /** Show phase dots in header */
  showPhaseDots?: boolean
  /** Show keyboard hints */
  showKeyboardHints?: boolean
  /** Custom keyboard handlers */
  keyboardHandlers?: Record<string, () => void>
  /** Initial step index */
  initialStepIndex?: number
  /** Additional header content */
  headerExtra?: ReactNode
  /** Additional footer content */
  footerExtra?: ReactNode
  /** Custom "Continue" button text */
  continueText?: string
  /** Custom "Back" button text */
  backText?: string
  /** Hide skip button */
  hideSkip?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Helpers passed to the renderStep function
 */
export interface JourneyRenderHelpers {
  goNext: () => void
  goBack: () => void
  skip: () => void
  isFirstStep: boolean
  isLastStep: boolean
  currentStepIndex: number
  totalSteps: number
  direction: number
}

/**
 * Base component for journey mode implementations
 *
 * Provides:
 * - Progress bar with gradient
 * - Phase dots (optional)
 * - Step transition animations
 * - Navigation controls
 * - Keyboard navigation
 * - Celebration confetti
 */
export function JourneyModeBase<TStep extends JourneyStepBase>({
  steps,
  onComplete,
  onSkip,
  renderStep,
  theme = 'primary',
  title,
  phaseCount,
  showPhaseDots = true,
  showKeyboardHints = true,
  keyboardHandlers,
  initialStepIndex = 0,
  headerExtra,
  footerExtra,
  continueText = 'Continue',
  backText = 'Back',
  hideSkip = false,
  className,
}: JourneyModeBaseProps<TStep>) {
  // Resolve theme
  const resolvedTheme: JourneyTheme = typeof theme === 'string' ? JOURNEY_THEMES[theme] : theme

  // Use the journey mode hook
  const journey = useJourneyMode({
    steps,
    onComplete,
    onSkip,
    initialStepIndex,
    keyboardHandlers,
    confettiColors: resolvedTheme.confettiColors,
  })

  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    direction,
    completedPhases,
    currentPhase,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    skip,
  } = journey

  // Create render helpers
  const renderHelpers: JourneyRenderHelpers = useMemo(
    () => ({
      goNext,
      goBack,
      skip,
      isFirstStep,
      isLastStep,
      currentStepIndex,
      totalSteps,
      direction,
    }),
    [goNext, goBack, skip, isFirstStep, isLastStep, currentStepIndex, totalSteps, direction]
  )

  // Generate phase array for dots
  const phases = useMemo(() => {
    if (!phaseCount) return []
    return Array.from({ length: phaseCount }, (_, i) => i + 1)
  }, [phaseCount])

  if (!currentStep) return null

  return (
    <div className={cn('flex flex-col h-full min-h-[500px]', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex-shrink-0 px-4 py-3 border-b border-border/50',
          `bg-gradient-to-r ${resolvedTheme.headerGradient}`
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {title && (
              <span className="text-sm font-medium text-foreground">{title}</span>
            )}
            {showPhaseDots && phases.length > 0 && (
              <div className="flex items-center gap-1.5">
                {phases.map(phase => (
                  <div
                    key={phase}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      completedPhases.has(phase)
                        ? 'bg-emerald-500'
                        : phase === currentPhase
                        ? 'bg-primary w-4'
                        : 'bg-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
            )}
            {headerExtra}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentStepIndex + 1} / {totalSteps}
            </span>
            {!hideSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={skip}
                className="h-8 px-2 text-xs"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r', resolvedTheme.progressGradient)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep.id}
            custom={direction}
            variants={journeySlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {renderStep(currentStep, renderHelpers)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border/50 bg-card/50">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={isFirstStep}
            className={cn('gap-1', isFirstStep && 'invisible')}
          >
            <ChevronLeft className="h-4 w-4" />
            {backText}
          </Button>

          {/* Keyboard hints */}
          {showKeyboardHints && (
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                <span>Arrow keys to navigate</span>
              </div>
              <span>•</span>
              <span>Esc to exit</span>
            </div>
          )}

          {/* Continue button */}
          <Button
            size="sm"
            onClick={goNext}
            className="gap-1"
          >
            {isLastStep ? 'Finish' : continueText}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {footerExtra}
      </div>
    </div>
  )
}

/**
 * Welcome step component - reusable for journey welcome screens
 */
export interface JourneyWelcomeProps {
  icon: ReactNode
  title: string
  subtitle?: string
  features?: string[]
  onStart: () => void
  startText?: string
  tip?: string
}

export function JourneyWelcome({
  icon,
  title,
  subtitle,
  features,
  onStart,
  startText = "Let's Go",
  tip,
}: JourneyWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          {icon}
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground mb-6 max-w-md">{subtitle}</p>
      )}

      {features && features.length > 0 && (
        <div className="grid gap-2 mb-6 text-left max-w-sm">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </div>
      )}

      <Button size="lg" onClick={onStart} className="gap-2">
        {startText}
        <ChevronRight className="h-4 w-4" />
      </Button>

      {tip && (
        <p className="mt-4 text-xs text-muted-foreground">{tip}</p>
      )}
    </div>
  )
}

/**
 * Celebration step component - reusable for phase completion
 */
export interface JourneyCelebrationProps {
  icon: ReactNode
  title: string
  subtitle?: string
  achievements?: string[]
  onContinue: () => void
  continueText?: string
}

export function JourneyCelebration({
  icon,
  title,
  subtitle,
  achievements,
  onContinue,
  continueText = 'Continue',
}: JourneyCelebrationProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
          {icon}
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold mb-2"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6 max-w-md"
        >
          {subtitle}
        </motion.p>
      )}

      {achievements && achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {achievements.map((achievement, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm"
            >
              {achievement}
            </span>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button size="lg" onClick={onContinue} className="gap-2">
          {continueText}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
}

/**
 * Welcome back modal for resuming previous progress
 */
export interface JourneyWelcomeBackProps {
  isOpen: boolean
  onContinue: () => void
  onStartFresh: () => void
  title?: string
  continueText?: string
  startFreshText?: string
}

export function JourneyWelcomeBack({
  isOpen,
  onContinue,
  onStartFresh,
  title = 'Welcome back!',
  continueText = 'Continue where I left off',
  startFreshText = 'Start fresh',
}: JourneyWelcomeBackProps) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card p-8 rounded-2xl shadow-xl max-w-md mx-4 text-center border"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">
          We found your previous progress. Would you like to continue?
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={onContinue} className="w-full">
            {continueText}
          </Button>
          <Button variant="outline" onClick={onStartFresh} className="w-full">
            {startFreshText}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
