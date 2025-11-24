"use client"

import { Phase } from './types'
import { format, differenceInDays } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Clock } from 'lucide-react'

interface MilestoneCardsViewProps {
  phases: Phase[]
  visibleCategories: Record<string, boolean>
}

export function MilestoneCardsView({ phases, visibleCategories }: MilestoneCardsViewProps) {
  if (phases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No milestones available
      </div>
    )
  }

  // Filter milestones by visible categories
  const filteredPhases = phases.map(phase => ({
    ...phase,
    milestones: phase.milestones.filter(milestone =>
      milestone.category.some(cat => visibleCategories[cat])
    )
  })).filter(phase => phase.milestones.length > 0)

  return (
    <div className="space-y-8">
      {filteredPhases.map((phase) => (
        <div key={phase.id} className="space-y-4">
          {/* Phase Header */}
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div
              className="w-1 h-8 rounded"
              style={{ backgroundColor: phase.color }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{phase.name}</h3>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </div>
            <Badge variant="outline" className="flex-shrink-0">
              {phase.milestones.length} tasks
            </Badge>
          </div>

          {/* Milestones */}
          <div className="grid gap-4 sm:grid-cols-2">
            {phase.milestones.map((milestone) => (
              <Card
                key={milestone.id}
                className="hover:border-accent transition-colors"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: phase.color
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{milestone.name}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {milestone.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="text-xs">
                      <div className="font-medium">
                        {format(milestone.startDate, 'MMM d, yyyy')}
                      </div>
                      <div className="text-muted-foreground">
                        to {format(milestone.endDate, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs">
                      {differenceInDays(milestone.endDate, milestone.startDate) + 1} days
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium">{milestone.owner}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {milestone.category.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat.split('-').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
