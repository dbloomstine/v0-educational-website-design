'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import confetti from 'canvas-confetti'

/**
 * Base step interface - tools extend this for specific step types
 */
export interface JourneyStepBase {
  id: string
  type: string
  title: string
  subtitle?: string
  phase?: number
  phaseName?: string
  /** Mark as celebration step to trigger confetti */
  celebration?: boolean
  /** Tip text shown at bottom */
  tip?: string
}

/**
 * Configuration for the journey mode hook
 */
export interface UseJourneyModeOptions<TStep extends JourneyStepBase> {
  /** Array of steps in the journey */
  steps: TStep[]
  /** Called when journey is completed (after last step) */
  onComplete?: () => void
  /** Called when user skips/exits the journey */
  onSkip?: () => void
  /** Initial step index */
  initialStepIndex?: number
  /** Enable keyboard navigation */
  enableKeyboard?: boolean
  /** Custom keyboard handlers by key */
  keyboardHandlers?: Record<string, () => void>
  /** Confetti colors for celebration steps */
  confettiColors?: string[]
  /** Auto-scroll to top on step change */
  scrollOnChange?: boolean
  /** Scroll container ref (defaults to window) */
  scrollContainerRef?: React.RefObject<HTMLElement>
}

/**
 * Return type for the useJourneyMode hook
 */
export interface UseJourneyModeReturn<TStep extends JourneyStepBase> {
  /** Current step object */
  currentStep: TStep | undefined
  /** Current step index */
  currentStepIndex: number
  /** Total number of steps */
  totalSteps: number
  /** Progress percentage (0-100) */
  progress: number
  /** Animation direction (1 = forward, -1 = backward) */
  direction: number
  /** Set of completed phase numbers */
  completedPhases: Set<number>
  /** Current phase number */
  currentPhase: number | undefined
  /** Is on first step */
  isFirstStep: boolean
  /** Is on last step */
  isLastStep: boolean
  /** Navigate to next step */
  goNext: () => void
  /** Navigate to previous step */
  goBack: () => void
  /** Jump to specific step index */
  goToStep: (index: number) => void
  /** Trigger celebration confetti */
  triggerCelebration: () => void
  /** Skip/exit the journey */
  skip: () => void
}

/**
 * Hook for managing journey mode state and navigation
 *
 * Handles:
 * - Step navigation with animation direction
 * - Progress calculation
 * - Phase completion tracking
 * - Keyboard navigation
 * - Celebration confetti
 * - Scroll management
 */
export function useJourneyMode<TStep extends JourneyStepBase>({
  steps,
  onComplete,
  onSkip,
  initialStepIndex = 0,
  enableKeyboard = true,
  keyboardHandlers = {},
  confettiColors = ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
  scrollOnChange = true,
  scrollContainerRef,
}: UseJourneyModeOptions<TStep>): UseJourneyModeReturn<TStep> {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex)
  const [direction, setDirection] = useState(1)
  const previousIndexRef = useRef(initialStepIndex)

  const currentStep = steps[currentStepIndex]
  const totalSteps = steps.length
  const progress = ((currentStepIndex + 1) / totalSteps) * 100
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1

  // Calculate completed phases
  const completedPhases = useMemo(() => {
    const phases = new Set<number>()
    for (let i = 0; i < currentStepIndex; i++) {
      const step = steps[i]
      if (step?.celebration && step?.phase) {
        phases.add(step.phase)
      }
    }
    return phases
  }, [currentStepIndex, steps])

  // Get current phase
  const currentPhase = useMemo(() => {
    // Find the most recent phase from current position going back
    for (let i = currentStepIndex; i >= 0; i--) {
      if (steps[i]?.phase) {
        return steps[i].phase
      }
    }
    return undefined
  }, [currentStepIndex, steps])

  // Navigation functions
  const goNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setDirection(1)
      setCurrentStepIndex(prev => prev + 1)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentStepIndex, totalSteps, onComplete])

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1)
      // Skip celebration steps when going back
      let targetIndex = currentStepIndex - 1
      while (targetIndex > 0 && steps[targetIndex]?.celebration) {
        targetIndex--
      }
      setCurrentStepIndex(targetIndex)
    }
  }, [currentStepIndex, steps])

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setDirection(index > currentStepIndex ? 1 : -1)
      setCurrentStepIndex(index)
    }
  }, [currentStepIndex, totalSteps])

  const skip = useCallback(() => {
    onSkip?.()
  }, [onSkip])

  // Celebration confetti
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: confettiColors,
    })
  }, [confettiColors])

  // Auto-trigger celebration on celebration steps
  useEffect(() => {
    if (currentStep?.celebration) {
      triggerCelebration()
    }
  }, [currentStep?.celebration, triggerCelebration])

  // Scroll to top on step change
  useEffect(() => {
    if (scrollOnChange && currentStepIndex !== previousIndexRef.current) {
      if (scrollContainerRef?.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      previousIndexRef.current = currentStepIndex
    }
  }, [currentStepIndex, scrollOnChange, scrollContainerRef])

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Check custom handlers first
      if (keyboardHandlers[e.key]) {
        e.preventDefault()
        keyboardHandlers[e.key]()
        return
      }

      // Default navigation
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault()
          goNext()
          break
        case 'ArrowLeft':
        case 'Backspace':
          e.preventDefault()
          goBack()
          break
        case 'Escape':
          e.preventDefault()
          skip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboard, keyboardHandlers, goNext, goBack, skip])

  return {
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
    goToStep,
    triggerCelebration,
    skip,
  }
}

/**
 * Animation variants for step transitions
 */
export const journeySlideVariants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
}

/**
 * Animation variants for floating elements (icons, etc.)
 */
export const journeyFloatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Animation variants for celebration badges
 */
export const journeyCelebrationVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', duration: 0.6 },
  },
}

/**
 * Default confetti color presets by theme
 */
export const CONFETTI_PRESETS = {
  primary: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
  blue: ['#38bdf8', '#22d3ee', '#6366f1', '#22c55e'],
  purple: ['#a855f7', '#8b5cf6', '#6366f1', '#22c55e'],
  amber: ['#f59e0b', '#f97316', '#eab308', '#22c55e'],
  emerald: ['#10b981', '#22c55e', '#34d399', '#6366f1'],
} as const

export type ConfettiPreset = keyof typeof CONFETTI_PRESETS
