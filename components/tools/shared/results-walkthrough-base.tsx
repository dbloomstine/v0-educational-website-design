"use client"

import { useState, useCallback, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import {
  ChevronRight,
  ChevronLeft,
  X,
  ArrowRight,
  Sparkles,
  LucideIcon
} from 'lucide-react'

export interface WalkthroughStep {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
  iconColor: string
  content: ReactNode
}

interface ResultsWalkthroughBaseProps {
  steps: WalkthroughStep[]
  onComplete: () => void
  onSkip: () => void
  /** Optional label for the walkthrough badge */
  badgeLabel?: string
  /** Optional final button text (defaults to "Explore Results") */
  completeButtonText?: string
  /** Optional primary color for the gradient (defaults to emerald) */
  primaryColor?: 'emerald' | 'indigo' | 'amber' | 'violet' | 'blue' | 'cyan'
  /** Optional confetti colors */
  confettiColors?: string[]
}

// Color configurations
const colorConfigs = {
  emerald: {
    progressGradient: 'from-emerald-400 to-cyan-400',
    activeStep: 'bg-emerald-400',
    inactiveStep: 'bg-emerald-400/40',
    button: 'from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600',
    badge: 'text-emerald-400',
    confetti: ['#10b981', '#14b8a6', '#22c55e', '#06b6d4']
  },
  indigo: {
    progressGradient: 'from-indigo-400 to-purple-400',
    activeStep: 'bg-indigo-400',
    inactiveStep: 'bg-indigo-400/40',
    button: 'from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
    badge: 'text-indigo-400',
    confetti: ['#6366f1', '#8b5cf6', '#a855f7', '#22c55e']
  },
  amber: {
    progressGradient: 'from-amber-400 to-orange-400',
    activeStep: 'bg-amber-400',
    inactiveStep: 'bg-amber-400/40',
    button: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    badge: 'text-amber-400',
    confetti: ['#f59e0b', '#f97316', '#ea580c', '#22c55e']
  },
  violet: {
    progressGradient: 'from-violet-400 to-purple-400',
    activeStep: 'bg-violet-400',
    inactiveStep: 'bg-violet-400/40',
    button: 'from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600',
    badge: 'text-violet-400',
    confetti: ['#8b5cf6', '#a855f7', '#c084fc', '#22c55e']
  },
  blue: {
    progressGradient: 'from-blue-400 to-cyan-400',
    activeStep: 'bg-blue-400',
    inactiveStep: 'bg-blue-400/40',
    button: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    badge: 'text-blue-400',
    confetti: ['#3b82f6', '#06b6d4', '#0ea5e9', '#22c55e']
  },
  cyan: {
    progressGradient: 'from-cyan-400 to-teal-400',
    activeStep: 'bg-cyan-400',
    inactiveStep: 'bg-cyan-400/40',
    button: 'from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
    badge: 'text-cyan-400',
    confetti: ['#06b6d4', '#14b8a6', '#22d3ee', '#22c55e']
  }
}

/**
 * ResultsWalkthroughBase - A reusable full-screen walkthrough component
 *
 * Use this as a base for all tool-specific results walkthroughs to ensure
 * consistent UX across the application.
 *
 * Features:
 * - Full-screen overlay with gradient background
 * - Progress bar with step count
 * - Step dots navigation
 * - Keyboard navigation (ArrowLeft/Right, Enter, Escape)
 * - Confetti on completion
 * - Smooth slide transitions
 * - Mobile responsive
 *
 * @example
 * ```tsx
 * const steps: WalkthroughStep[] = [
 *   {
 *     id: 'welcome',
 *     title: 'Welcome!',
 *     subtitle: 'Let\'s explore your results',
 *     icon: Sparkles,
 *     iconColor: 'from-emerald-400 to-teal-500',
 *     content: <div>Your welcome content here</div>
 *   },
 *   // ... more steps
 * ]
 *
 * <ResultsWalkthroughBase
 *   steps={steps}
 *   onComplete={() => setShowWalkthrough(false)}
 *   onSkip={() => setShowWalkthrough(false)}
 *   badgeLabel="Results Guide"
 *   primaryColor="emerald"
 * />
 * ```
 */
export function ResultsWalkthroughBase({
  steps,
  onComplete,
  onSkip,
  badgeLabel = 'Results Guide',
  completeButtonText = 'Explore Results',
  primaryColor = 'emerald',
  confettiColors
}: ResultsWalkthroughBaseProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const colors = colorConfigs[primaryColor]
  const step = steps[currentStep]
  const progress = Math.round(((currentStep + 1) / steps.length) * 100)
  const isLastStep = currentStep === steps.length - 1

  // Navigate to next step or complete
  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      // Final step - trigger confetti and complete
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
        colors: confettiColors || colors.confetti
      })
      setTimeout(onComplete, 500)
    }
  }, [currentStep, steps.length, onComplete, colors.confetti, confettiColors])

  // Navigate to previous step
  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onSkip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, onSkip])

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

  const Icon = step.icon

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${badgeLabel} walkthrough, step ${currentStep + 1} of ${steps.length}`}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col pb-safe"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-slate-900/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
            <Sparkles className={cn("h-4 w-4", colors.badge)} />
            <span className="text-sm font-medium text-white">{badgeLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full bg-gradient-to-r rounded-full", colors.progressGradient)}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-white/60">{currentStep + 1}/{steps.length}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            aria-label="Skip walkthrough"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4 sm:mr-1" aria-hidden="true" />
            <span className="hidden sm:inline">Skip</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24" aria-live="polite">
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
              className="w-full max-w-lg"
            >
              <div className="space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className={cn(
                    "w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                    step.iconColor
                  )}
                >
                  <Icon className="h-8 w-8 text-white" />
                </motion.div>

                {/* Title */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-white/80 text-lg">{step.subtitle}</p>
                </div>

                {/* Content */}
                <div className="pt-2">
                  {step.content}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between bg-slate-900/95 backdrop-blur-sm border-t border-white/10">
        <div>
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={goPrev}
              aria-label="Go to previous step"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5 mr-1" aria-hidden="true" />
              Back
            </Button>
          )}
        </div>

        <nav aria-label="Walkthrough progress" className="flex items-center gap-1">
          {steps.map((s, idx) => (
            <div
              key={idx}
              role="presentation"
              aria-label={`Step ${idx + 1}: ${s.title}${idx === currentStep ? ' (current)' : idx < currentStep ? ' (completed)' : ''}`}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentStep ? `w-6 ${colors.activeStep}` :
                idx < currentStep ? colors.inactiveStep : "bg-white/20"
              )}
            />
          ))}
        </nav>

        <div>
          <Button
            onClick={goNext}
            aria-label={isLastStep ? `Complete walkthrough and ${completeButtonText?.toLowerCase()}` : `Continue to step ${currentStep + 2}`}
            className={cn("text-white bg-gradient-to-r", colors.button)}
          >
            {isLastStep ? completeButtonText : 'Continue'}
            {isLastStep ? <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /> : <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {/* Keyboard hint - hidden on mobile */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs text-slate-600 hidden sm:block">
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">←</kbd> Previous
        <span className="mx-2">|</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">→</kbd> Next
        <span className="mx-2">|</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">Esc</kbd> Skip
      </div>
    </div>
  )
}

/**
 * Helper component for creating content sections within walkthrough steps
 */
interface ContentSectionProps {
  children: ReactNode
  className?: string
}

export function WalkthroughContentSection({ children, className }: ContentSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  )
}

/**
 * Helper component for stat cards within walkthrough steps
 */
interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  iconColor?: string
  valueColor?: string
}

export function WalkthroughStatCard({ label, value, icon: Icon, iconColor = 'text-white', valueColor = 'text-white' }: StatCardProps) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
      {Icon && <Icon className={cn("h-6 w-6 mx-auto mb-2", iconColor)} />}
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
      <p className="text-white/80">{label}</p>
    </div>
  )
}

/**
 * Helper component for tip boxes within walkthrough steps
 */
interface TipBoxProps {
  title?: string
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info'
  icon?: LucideIcon
}

export function WalkthroughTipBox({ title = 'Pro Tip', children, variant = 'default', icon: Icon }: TipBoxProps) {
  const variants = {
    default: 'bg-white/5 border-white/10',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    info: 'bg-blue-500/10 border-blue-500/30'
  }

  const iconColors = {
    default: 'text-amber-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    info: 'text-blue-400'
  }

  return (
    <div className={cn("p-4 rounded-xl border", variants[variant])}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={cn("h-5 w-5", iconColors[variant])} />}
        <span className="font-semibold text-white">{title}</span>
      </div>
      <div className="text-white/90 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

/**
 * Helper component for feature list items within walkthrough steps
 */
interface FeatureListItemProps {
  icon?: LucideIcon
  iconColor?: string
  title: string
  description: string
}

export function WalkthroughFeatureItem({ icon: Icon, iconColor = 'text-emerald-400', title, description }: FeatureListItemProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
      {Icon && <Icon className={cn("h-5 w-5 mt-0.5", iconColor)} />}
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-white/80 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
