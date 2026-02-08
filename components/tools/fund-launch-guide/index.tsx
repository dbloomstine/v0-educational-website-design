'use client'

import { useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFundLaunchStore, useShowOnboarding, useHasLoaded, PHASES } from './store'
import { ChecklistTab } from './tabs/checklist-tab'
import { JourneyMode } from './journey-mode'
import { OnboardingWizard } from './onboarding-wizard'
import { FundConfig } from './types'
import { cn } from '@/lib/utils'
import {
  Search,
  Command,
  X,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

// Format progress
function formatProgress(completed: number, total: number): string {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return `${completed}/${total} (${percent}%)`
}

// Quick Jump Modal
function QuickJumpModal() {
  const showQuickJump = useFundLaunchStore(state => state.showQuickJump)
  const setShowQuickJump = useFundLaunchStore(state => state.setShowQuickJump)
  const searchQuery = useFundLaunchStore(state => state.searchQuery)
  const setSearchQuery = useFundLaunchStore(state => state.setSearchQuery)
  const getSearchResults = useFundLaunchStore(state => state.getSearchResults)
  const completedTasks = useFundLaunchStore(state => state.completedTasks)
  const toggleTaskComplete = useFundLaunchStore(state => state.toggleTaskComplete)
  const toggleTaskExpand = useFundLaunchStore(state => state.toggleTaskExpand)
  const togglePhaseExpand = useFundLaunchStore(state => state.togglePhaseExpand)
  const expandedPhases = useFundLaunchStore(state => state.expandedPhases)

  const results = getSearchResults()
  const completedSet = new Set(completedTasks)
  const expandedPhasesSet = new Set(expandedPhases)

  const handleSelectTask = useCallback((taskId: string, phaseId: string) => {
    // Expand phase if not already expanded
    if (!expandedPhasesSet.has(phaseId)) {
      togglePhaseExpand(phaseId)
    }
    // Expand task
    toggleTaskExpand(taskId)
    // Close modal
    setShowQuickJump(false)
    // Scroll to phase
    setTimeout(() => {
      const element = document.getElementById(`phase-${phaseId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [expandedPhasesSet, togglePhaseExpand, toggleTaskExpand, setShowQuickJump])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowQuickJump(!showQuickJump)
      }
      if (e.key === 'Escape' && showQuickJump) {
        setShowQuickJump(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showQuickJump, setShowQuickJump])

  return (
    <Dialog open={showQuickJump} onOpenChange={setShowQuickJump}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Jump</DialogTitle>
          <DialogDescription>Search and navigate to any task</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto space-y-1">
            {!searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <Command className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start typing to search tasks</p>
              </div>
            )}

            {searchQuery && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks match &quot;{searchQuery}&quot;</p>
              </div>
            )}

            {results.map((task) => {
              const phase = PHASES.find(p => p.id === task.phaseId)
              const isComplete = completedSet.has(task.id)

              return (
                <button
                  key={task.id}
                  onClick={() => handleSelectTask(task.id, task.phaseId)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-accent transition-colors"
                >
                  <div className="shrink-0">
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium truncate",
                      isComplete && "text-muted-foreground line-through"
                    )}>
                      {task.title}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{phase?.shortName}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{task.timeEstimate}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )
            })}
          </div>

          {/* Keyboard hint */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">Enter</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">Esc</kbd>
              to close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Toast notifications
function Toasts() {
  const showCopied = useFundLaunchStore(state => state.showCopied)
  const showSaved = useFundLaunchStore(state => state.showSaved)

  return (
    <>
      {/* Copied toast */}
      {showCopied && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            Link copied!
          </div>
        </div>
      )}

      {/* Saved toast */}
      {showSaved && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            Progress saved
          </div>
        </div>
      )}
    </>
  )
}

// Mode selection dialog (shown when onboarding with no config)
function ModeSelectionDialog() {
  const showOnboarding = useShowOnboarding()
  const config = useFundLaunchStore(state => state.config)
  const hasLoaded = useHasLoaded()
  const setShowOnboarding = useFundLaunchStore(state => state.setShowOnboarding)

  // Only show mode selection if no config exists and store has loaded
  const showModeSelection = showOnboarding && !config && hasLoaded

  if (!showModeSelection) return null

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fund Launch Guide
          </DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to get started
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <button
            onClick={() => {
              // Start journey mode by keeping showOnboarding true but config null
              // The JourneyMode component will handle this
            }}
            className="w-full p-4 text-left border-2 rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="font-medium mb-1">Guided Setup</div>
            <div className="text-sm text-muted-foreground">
              Answer a few questions to customize your checklist. Takes ~5 minutes.
            </div>
          </button>
          <button
            onClick={() => {
              useFundLaunchStore.getState().skipOnboarding()
            }}
            className="w-full p-4 text-left border-2 rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="font-medium mb-1">Quick Start</div>
            <div className="text-sm text-muted-foreground">
              Jump straight to the checklist with default settings.
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Journey mode wrapper
function JourneyModeWrapper() {
  const showOnboarding = useShowOnboarding()
  const config = useFundLaunchStore(state => state.config)
  const hasLoaded = useHasLoaded()
  const completeOnboarding = useFundLaunchStore(state => state.completeOnboarding)
  const skipOnboarding = useFundLaunchStore(state => state.skipOnboarding)

  // Show journey mode if onboarding is enabled and no config exists
  const showJourney = showOnboarding && !config && hasLoaded

  if (!showJourney) return null

  return (
    <JourneyMode
      onComplete={(journeyConfig: FundConfig, providers: Record<string, string>, completedTasks?: string[]) => {
        completeOnboarding(journeyConfig, providers, completedTasks)
      }}
      onSkip={() => {
        skipOnboarding()
      }}
    />
  )
}

// Reconfigure wizard wrapper
function ReconfigureWizard() {
  const showOnboarding = useShowOnboarding()
  const config = useFundLaunchStore(state => state.config)
  const hasLoaded = useHasLoaded()
  const setShowOnboarding = useFundLaunchStore(state => state.setShowOnboarding)
  const setConfig = useFundLaunchStore(state => state.setConfig)

  // Show reconfigure wizard if onboarding enabled AND config already exists
  const showReconfigure = showOnboarding && config && hasLoaded

  if (!showReconfigure) return null

  return (
    <OnboardingWizard
      onComplete={(newConfig) => {
        setConfig(newConfig)
        setShowOnboarding(false)
      }}
      onSkip={() => {
        setShowOnboarding(false)
      }}
    />
  )
}

// Main component
export function FundLaunchGuide() {
  const config = useFundLaunchStore(state => state.config)
  const hasLoaded = useHasLoaded()
  const showOnboarding = useShowOnboarding()
  const setHasLoaded = useFundLaunchStore(state => state.setHasLoaded)

  // Computed values
  const getProgress = useFundLaunchStore(state => state.getProgress)
  const getCurrentPhase = useFundLaunchStore(state => state.getCurrentPhase)

  const progress = getProgress()
  const currentPhase = getCurrentPhase()

  // Handle URL state restoration
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const stateParam = params.get('state')

    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam))
        if (decoded.c) {
          useFundLaunchStore.getState().setConfig(decoded.c)
        }
        if (decoded.t && Array.isArray(decoded.t)) {
          // Set completed tasks from URL
          useFundLaunchStore.setState({ completedTasks: decoded.t })
        }
        useFundLaunchStore.getState().setShowOnboarding(false)
        // Clear URL params after loading
        window.history.replaceState({}, '', window.location.pathname)
      } catch {
        // Invalid state param, ignore
      }
    }
  }, [])

  // Mark as loaded after hydration
  useEffect(() => {
    if (!hasLoaded) {
      setHasLoaded(true)
    }
  }, [hasLoaded, setHasLoaded])

  // Show loading state while hydrating
  if (!hasLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show journey mode for new users
  if (showOnboarding && !config) {
    return <JourneyModeWrapper />
  }

  // Show reconfigure wizard
  if (showOnboarding && config) {
    return <ReconfigureWizard />
  }

  // Main UI - only show if config exists
  if (!config) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Quick Jump Modal */}
      <QuickJumpModal />

      {/* Toast notifications */}
      <Toasts />

      {/* Key metrics bar */}
      <Card className="bg-accent/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Strategy</p>
              <p className="text-lg font-semibold">{config.strategy}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-lg font-semibold text-primary">
                {formatProgress(progress.completed, progress.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Phase</p>
              <p className="text-lg font-semibold">{currentPhase?.shortName || 'Complete'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target Size</p>
              <p className="text-lg font-semibold capitalize">{config.size}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="mt-6">
        <ChecklistTab />
      </div>

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This tool is for educational purposes only and does not
            constitute legal, tax, or investment advice. Fund formation involves complex regulatory
            requirements that vary by jurisdiction and fund type. Consult qualified legal, tax, and
            compliance professionals before making any decisions about your fund.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Export as default for compatibility
export default FundLaunchGuide
