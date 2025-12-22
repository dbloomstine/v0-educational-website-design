"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface MethodologyBlockProps {
  /** Title for the methodology section */
  title?: string
  /** Description of the methodology */
  children: React.ReactNode
  /** Optional className for custom styling */
  className?: string
  /** Whether the section should start expanded */
  defaultExpanded?: boolean
  /** Optional sources/references to display */
  sources?: Array<{
    text: string
    link?: string
  }>
}

/**
 * MethodologyBlock - Expandable section explaining calculation methodology
 *
 * Provides transparency about how calculations are performed,
 * building trust and credibility with users.
 */
export function MethodologyBlock({
  title = "How we calculate this",
  children,
  className,
  defaultExpanded = false,
  sources
}: MethodologyBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className={cn("border-border bg-muted/20", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <span className="font-medium text-sm sm:text-base text-foreground text-left">
            {title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            {children}
          </div>

          {sources && sources.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-foreground mb-2">Sources & References:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {sources.map((source, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {source.link ? (
                      <a
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {source.text}
                      </a>
                    ) : (
                      <span>{source.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
