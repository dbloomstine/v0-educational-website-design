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
  onResetProgress: () => void
  onReconfigure: () => void
  onShare: () => void
  onExportExcel: () => void
  onExportPdf: () => void
}

export function ProgressDashboard({
  config,
  phases,
  tasksByPhase,
  completedTasks,
  onResetProgress,
  onReconfigure,
  onShare,
  onExportExcel,
  onExportPdf,
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
    <div className="space-y-6">
      {/* Main Progress Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Progress Circle */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-24 h-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-accent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{progressPercent}%</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                {completedCount} of {totalTasks} tasks complete
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Currently in: <span className="font-medium text-foreground">{currentPhase?.shortName}</span>
              </p>
              {nextMilestone && progressPercent < 100 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <nextMilestone.icon className="h-3 w-3" />
                  {nextMilestone.threshold - progressPercent}% to "{nextMilestone.label}"
                </p>
              )}
              {progressPercent === 100 && (
                <div className="flex items-center gap-1.5 mt-2 text-emerald-600 dark:text-emerald-400">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">All tasks complete!</span>
                </div>
              )}
            </div>
          </div>

          {/* Config Summary */}
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-accent text-sm">
              <span className="text-muted-foreground">Strategy:</span>{' '}
              <span className="font-medium">{config.strategy}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-accent text-sm">
              <span className="text-muted-foreground">Size:</span>{' '}
              <span className="font-medium capitalize">{config.size}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-accent text-sm">
              <span className="text-muted-foreground">Structure:</span>{' '}
              <span className="font-medium">{config.jurisdiction}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:flex-col lg:items-end">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onReconfigure}>
                <Settings2 className="h-4 w-4 mr-1.5" />
                Reconfigure
              </Button>
              <Button variant="ghost" size="sm" onClick={onResetProgress} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Progress Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {phaseProgress.map(({ phase, total, completed, percent }) => (
          <div
            key={phase.id}
            className={cn(
              "rounded-lg border p-3 transition-all",
              completed === total && total > 0
                ? "border-emerald-500/30 bg-emerald-500/5"
                : phase.id === currentPhase?.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
            )}
          >
            <div className="text-xs font-medium truncate mb-2" title={phase.name}>
              {phase.shortName}
            </div>
            <div className="h-1.5 bg-accent rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  completed === total && total > 0 ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {completed}/{total}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
