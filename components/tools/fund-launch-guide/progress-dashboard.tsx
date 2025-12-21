"use client"

import { cn } from '@/lib/utils'
import { FundLaunchPhase, FundLaunchTask, FundConfig } from './types'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  Clock,
  Award,
  RotateCcw,
  Settings2,
  Share2,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProgressDashboardProps {
  config: FundConfig
  phases: FundLaunchPhase[]
  tasksByPhase: Map<string, FundLaunchTask[]>
  completedTasks: Set<string>
  providers?: Record<string, string>
  onResetProgress: () => void
  onReconfigure: () => void
  onShare: () => void
  onExportExcel: () => void
  onExportPdf: () => void
  onPhaseClick?: (phaseId: string) => void
}

const PROVIDER_LABELS: Record<string, string> = {
  lawFirm: 'Law Firm',
  fundAdmin: 'Fund Admin',
  auditor: 'Auditor',
  taxAdvisor: 'Tax Advisor',
  bank: 'Bank',
  insuranceBroker: 'Insurance',
  primeBroker: 'Prime Broker',
  complianceConsultant: 'Compliance',
}

export function ProgressDashboard({
  config,
  phases,
  tasksByPhase,
  completedTasks,
  providers,
  onResetProgress,
  onReconfigure,
  onShare,
  onExportExcel,
  onExportPdf,
  onPhaseClick,
}: ProgressDashboardProps) {
  // Calculate statistics
  const totalTasks = Array.from(tasksByPhase.values()).reduce(
    (sum, tasks) => sum + tasks.length,
    0
  )
  const completedCount = completedTasks.size
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  // Find current phase (first incomplete phase)
  const currentPhase = phases.find(phase => {
    const phaseTasks = tasksByPhase.get(phase.id) || []
    const phaseCompleted = phaseTasks.filter(t => completedTasks.has(t.id)).length
    return phaseCompleted < phaseTasks.length
  }) || phases[phases.length - 1]

  // Calculate phase progress
  const phaseProgress = phases.map(phase => {
    const phaseTasks = tasksByPhase.get(phase.id) || []
    const phaseCompleted = phaseTasks.filter(t => completedTasks.has(t.id)).length
    return {
      phase,
      total: phaseTasks.length,
      completed: phaseCompleted,
      percent: phaseTasks.length > 0 ? Math.round((phaseCompleted / phaseTasks.length) * 100) : 0,
    }
  })

  // Milestones
  const milestones = [
    { threshold: 25, label: 'Getting Started', icon: Circle },
    { threshold: 50, label: 'Halfway There', icon: TrendingUp },
    { threshold: 75, label: 'Almost Done', icon: Target },
    { threshold: 100, label: 'Complete!', icon: Award },
  ]

  const currentMilestone = milestones.reduce((prev, curr) =>
    progressPercent >= curr.threshold ? curr : prev
  , milestones[0])

  const nextMilestone = milestones.find(m => m.threshold > progressPercent)

  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        {/* Progress + Info Row */}
        <div className="flex items-start gap-4">
          {/* Progress Circle */}
          <div className="flex-shrink-0">
            <div className="relative">
              <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="38%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-accent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="38%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - progressPercent / 100)}`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold">
              {completedCount} of {totalTasks} tasks complete
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Currently in: <span className="font-medium text-foreground">{currentPhase?.shortName}</span>
            </p>
            {nextMilestone && progressPercent < 100 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <nextMilestone.icon className="h-3 w-3" />
                {nextMilestone.threshold - progressPercent}% to "{nextMilestone.label}"
              </p>
            )}
            {progressPercent === 100 && (
              <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">All tasks complete!</span>
              </div>
            )}
          </div>
        </div>

        {/* Config Tags - Horizontal scroll on mobile */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-accent text-xs sm:text-sm">
            <span className="text-muted-foreground">Strategy:</span>{' '}
            <span className="font-medium">{config.strategy}</span>
          </div>
          <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-accent text-xs sm:text-sm">
            <span className="text-muted-foreground">Size:</span>{' '}
            <span className="font-medium capitalize">{config.size}</span>
          </div>
          <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-accent text-xs sm:text-sm">
            <span className="text-muted-foreground">Structure:</span>{' '}
            <span className="font-medium">{config.jurisdiction}</span>
          </div>
        </div>

        {/* Selected Service Providers */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Your Team</div>
          {providers && Object.keys(providers).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(providers).map(([key, value]) => (
                <div key={key} className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs sm:text-sm">
                  <span className="text-muted-foreground">{PROVIDER_LABELS[key] || key}:</span>{' '}
                  <span className="font-medium text-primary">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">
              No service providers selected yet. You can add them by clicking Reconfigure.
            </p>
          )}
        </div>

        {/* Actions - Compact on mobile */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onShare} className="h-8 px-2.5 sm:px-3">
            <Share2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2.5 sm:px-3">
                <Download className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportPdf}>
                <FileText className="h-4 w-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={onReconfigure} className="h-8 px-2.5 sm:px-3">
            <Settings2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Reconfigure</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onResetProgress} className="h-8 px-2.5 sm:px-3 text-muted-foreground ml-auto">
            <RotateCcw className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Phase Progress Grid - 2 columns on mobile, 4 on tablet, 8 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
        {phaseProgress.map(({ phase, total, completed, percent }) => {
          // Color progression: gray (0%) -> blue (in progress) -> amber (>50%) -> green (100%)
          const getPhaseStyle = () => {
            if (completed === total && total > 0) {
              return "border-emerald-500/30 bg-emerald-500/5" // Complete - green
            }
            if (percent >= 50) {
              return "border-amber-500/30 bg-amber-500/5" // Good progress - amber
            }
            if (completed > 0) {
              return "border-primary/30 bg-primary/5" // Started - blue
            }
            return "border-border bg-card" // Not started - default
          }

          const getBarColor = () => {
            if (completed === total && total > 0) return "bg-emerald-500"
            if (percent >= 50) return "bg-amber-500"
            if (completed > 0) return "bg-primary"
            return "bg-muted-foreground/30"
          }

          return (
            <button
              key={phase.id}
              onClick={() => onPhaseClick?.(phase.id)}
              className={cn(
                "rounded-lg border p-2.5 sm:p-3 transition-all text-left",
                "hover:ring-2 hover:ring-primary/50 active:scale-[0.98]",
                getPhaseStyle()
              )}
            >
              <div className="text-xs font-medium truncate mb-1.5" title={phase.name}>
                {phase.shortName}
              </div>
              <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    getBarColor()
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {completed}/{total}
              </div>
            </button>
          )
        })}
      </div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground/50">
          Last updated: December 2025
        </p>
      </div>
    </div>
  )
}
