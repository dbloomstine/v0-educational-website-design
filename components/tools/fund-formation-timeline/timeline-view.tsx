"use client"

import { Phase, Milestone } from './types'
import { format, differenceInDays } from 'date-fns'
import { InfoPopover } from '@/components/ui/info-popover'

interface TimelineViewProps {
  phases: Phase[]
  visibleCategories: Record<string, boolean>
}

export function TimelineView({ phases, visibleCategories }: TimelineViewProps) {
  if (phases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No timeline data available
      </div>
    )
  }

  // Calculate timeline bounds
  const allDates = phases.flatMap(p => [p.startDate, p.endDate])
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
  const totalDays = differenceInDays(maxDate, minDate)

  // Filter milestones by visible categories
  const filteredPhases = phases.map(phase => ({
    ...phase,
    milestones: phase.milestones.filter(milestone =>
      milestone.category.some(cat => visibleCategories[cat])
    )
  })).filter(phase => phase.milestones.length > 0)

  const getPositionAndWidth = (startDate: Date, endDate: Date) => {
    const daysSinceStart = differenceInDays(startDate, minDate)
    const duration = differenceInDays(endDate, startDate) + 1
    const left = (daysSinceStart / totalDays) * 100
    const width = (duration / totalDays) * 100

    return { left: `${left}%`, width: `${Math.max(width, 1)}%` }
  }

  return (
    <div className="space-y-8">
      {/* Timeline Header - Months */}
      <div className="relative border-b border-border pb-4">
        <div className="text-sm font-medium mb-2 text-muted-foreground">Timeline</div>
        <div className="relative h-8 overflow-x-auto">
          <div className="absolute inset-0">
            {generateMonthMarkers(minDate, maxDate, totalDays)}
          </div>
        </div>
      </div>

      {/* Phases and Milestones */}
      <div className="space-y-6 overflow-x-auto pb-4">
        {filteredPhases.map((phase) => (
          <div key={phase.id} className="space-y-3">
            {/* Phase Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-1 h-8 rounded"
                style={{ backgroundColor: phase.color }}
              />
              <div>
                <div className="font-semibold text-sm">{phase.name}</div>
                <div className="text-xs text-muted-foreground">
                  {format(phase.startDate, 'MMM d')} - {format(phase.endDate, 'MMM d, yyyy')}
                </div>
              </div>
            </div>

            {/* Phase Bar */}
            <div className="relative h-8 bg-accent/20 rounded">
              <div
                className="absolute h-full rounded transition-all"
                style={{
                  ...getPositionAndWidth(phase.startDate, phase.endDate),
                  backgroundColor: `${phase.color}33`
                }}
              />
            </div>

            {/* Milestones */}
            <div className="space-y-2 pl-4">
              {phase.milestones.map((milestone) => (
                <div key={milestone.id} className="relative">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="flex-shrink-0">{milestone.name}</span>
                    <InfoPopover iconSize="sm">
                      <p className="text-xs font-semibold mb-1">{milestone.name}</p>
                      <p className="text-xs mb-2">{milestone.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Owner: {milestone.owner}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duration: {milestone.duration} days
                      </p>
                    </InfoPopover>
                  </div>
                  <div className="relative h-6 bg-muted/50 rounded">
                    <div
                      className="absolute h-full rounded flex items-center px-2 text-xs font-medium transition-all cursor-pointer hover:opacity-80"
                      style={{
                        ...getPositionAndWidth(milestone.startDate, milestone.endDate),
                        backgroundColor: phase.color,
                        color: 'white'
                      }}
                      title={`${format(milestone.startDate, 'MMM d')} - ${format(milestone.endDate, 'MMM d')}`}
                    >
                      <span className="truncate">
                        {differenceInDays(milestone.endDate, milestone.startDate) + 1}d
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile scroll hint */}
      <div className="text-xs text-center text-muted-foreground md:hidden py-2">
        ← Scroll horizontally to see full timeline →
      </div>
    </div>
  )
}

function generateMonthMarkers(minDate: Date, maxDate: Date, totalDays: number) {
  const markers: JSX.Element[] = []
  const current = new Date(minDate)
  current.setDate(1) // Start of month

  while (current <= maxDate) {
    const daysSinceStart = differenceInDays(current, minDate)
    const position = (daysSinceStart / totalDays) * 100

    if (position >= 0 && position <= 100) {
      markers.push(
        <div
          key={current.toISOString()}
          className="absolute top-0 bottom-0 border-l border-border"
          style={{ left: `${position}%` }}
        >
          <div className="absolute -top-6 left-0 text-xs font-medium text-muted-foreground whitespace-nowrap -translate-x-1/2">
            {format(current, 'MMM yyyy')}
          </div>
        </div>
      )
    }

    // Move to next month
    current.setMonth(current.getMonth() + 1)
  }

  return markers
}
