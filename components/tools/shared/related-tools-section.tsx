"use client"

import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RelatedTool {
  slug: string
  title: string
  description: string
  reason: string
}

interface RelatedToolsSectionProps {
  currentToolSlug: string
  relatedTools: RelatedTool[]
  learningPath?: string
  className?: string
}

/**
 * RelatedToolsSection - Educational connections between tools
 *
 * Shows related tools with context about why they're useful,
 * plus an optional learning path suggestion.
 */
export function RelatedToolsSection({
  relatedTools,
  learningPath,
  className
}: RelatedToolsSectionProps) {
  if (relatedTools.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Continue Learning</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Explore related tools to deepen your understanding
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {relatedTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group block rounded-lg border border-border/50 bg-background p-4 transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {tool.description}
                  </p>
                  <p className="text-xs text-primary/80 italic">
                    Why it&apos;s useful: {tool.reason}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </Link>
          ))}

          {learningPath && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10">
                <GraduationCap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground mb-1">Suggested Learning Path</p>
                  <p className="text-sm text-muted-foreground">{learningPath}</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link href="/tools">
              <Button variant="outline" size="sm" className="w-full gap-2">
                View All Tools
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
