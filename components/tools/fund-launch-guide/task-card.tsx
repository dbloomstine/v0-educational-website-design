"use client"

import { cn } from '@/lib/utils'
import { FundLaunchTask, FundLaunchPhase } from './types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface TaskCardProps {
  task: FundLaunchTask
  phase: FundLaunchPhase
  isCompleted: boolean
  isExpanded: boolean
  onToggleComplete: () => void
  onToggleExpand: () => void
  dependencies?: {
    task: FundLaunchTask
    type: 'required' | 'recommended'
    isCompleted: boolean
  }[]
  viewMode: 'timeline' | 'board' | 'list'
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  legal: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  regulatory: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  operations: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  marketing: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  finance: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-500' },
  important: { label: 'Important', color: 'text-amber-500' },
  optional: { label: 'Optional', color: 'text-muted-foreground' },
}

export function TaskCard({
  task,
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpand,
  dependencies = [],
  viewMode,
}: TaskCardProps) {
  const category = categoryColors[task.category] || categoryColors.operations
  const priority = priorityConfig[task.priority]

  const hasBlockingDependency = dependencies.some(
    d => d.type === 'required' && !d.isCompleted
  )
  const hasRecommendedDependency = dependencies.some(
    d => d.type === 'recommended' && !d.isCompleted
  )

  const isCompact = viewMode === 'board'

  // Priority border colors
  const priorityBorderColor = {
    critical: 'border-l-red-500',
    important: 'border-l-amber-500',
    optional: 'border-l-transparent',
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-all duration-200",
        isCompleted
          ? "bg-card/30 border-border/50 opacity-70"
          : "bg-card border-border hover:border-primary/30 hover:shadow-sm",
        hasBlockingDependency && !isCompleted && "opacity-60",
        isCompact ? "p-3" : "p-4",
        // Add left border for priority indication
        !isCompleted && task.priority !== 'optional' && "border-l-4",
        !isCompleted && priorityBorderColor[task.priority]
      )}
    >
      {/* Completion celebration overlay */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onToggleComplete}
            disabled={hasBlockingDependency}
            className={cn(
              "transition-all",
              isCompleted && "bg-emerald-500 border-emerald-500"
            )}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title and expand button */}
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={onToggleExpand}
              className="flex-1 text-left group/title"
            >
              <h4
                className={cn(
                  "font-medium leading-tight transition-colors",
                  isCompleted
                    ? "text-muted-foreground line-through"
                    : "text-foreground group-hover/title:text-primary"
                )}
              >
                {task.title}
              </h4>
            </button>

            <button
              onClick={onToggleExpand}
              className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Quick tip - always visible */}
          <p
            className={cn(
              "text-sm leading-relaxed mt-1.5",
              isCompleted ? "text-muted-foreground/70" : "text-muted-foreground"
            )}
          >
            {task.quickTip}
          </p>

          {/* Meta badges */}
          {!isCompact && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Time estimate */}
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{task.timeEstimate}</span>
              </div>

              {/* Category */}
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  category.bg,
                  category.text
                )}
              >
                {task.category}
              </span>

              {/* Priority */}
              {task.priority === 'critical' && (
                <span className={cn("text-xs font-medium", priority.color)}>
                  {priority.label}
                </span>
              )}
            </div>
          )}

          {/* Dependency warnings */}
          {(hasBlockingDependency || hasRecommendedDependency) && !isCompleted && (
            <div className="mt-3 space-y-1.5">
              {dependencies
                .filter(d => !d.isCompleted)
                .map(dep => (
                  <div
                    key={dep.task.id}
                    className={cn(
                      "flex items-center gap-2 text-xs rounded px-2 py-1",
                      dep.type === 'required'
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {dep.type === 'required' ? (
                      <AlertCircle className="h-3 w-3 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">
                      {dep.type === 'required' ? 'Requires' : 'Recommended after'}:{' '}
                      <span className="font-medium">{dep.task.title}</span>
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              {/* Full explanation */}
              <div>
                <h5 className="text-sm font-medium mb-2">Details</h5>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {task.fullExplanation}
                </p>
              </div>

              {/* Pitfalls */}
              {task.pitfalls && task.pitfalls.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Common Pitfalls
                  </h5>
                  <ul className="space-y-1.5">
                    {task.pitfalls.map((pitfall, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benchmark */}
              {task.benchmark && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium">Industry Benchmark</h5>
                    <p className="text-sm text-muted-foreground">{task.benchmark}</p>
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {task.deepDiveUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={task.deepDiveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Deep Dive Article
                    </a>
                  </Button>
                )}
                {task.externalResources?.map((resource, index) => (
                  <Button key={index} variant="ghost" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                      {resource.label}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
