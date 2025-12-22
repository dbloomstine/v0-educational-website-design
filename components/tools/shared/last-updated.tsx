"use client"

import { Calendar, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface LastUpdatedProps {
  /** The date when the tool was last updated */
  date: string
  /** Optional version number */
  version?: string
  /** Optional className for custom styling */
  className?: string
  /** Optional refresh changelog link */
  changelogNote?: string
}

/**
 * LastUpdated - Displays when the tool was last updated
 *
 * Provides transparency and trust by showing users the tool
 * is actively maintained and up-to-date.
 */
export function LastUpdated({
  date,
  version,
  className,
  changelogNote
}: LastUpdatedProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-xs text-muted-foreground",
      className
    )}>
      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
      <span>
        Last updated: {date}
        {version && <span className="ml-1.5 text-muted-foreground/70">v{version}</span>}
      </span>
      {changelogNote && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-1">
            <RefreshCcw className="h-3 w-3" aria-hidden="true" />
            {changelogNote}
          </span>
        </>
      )}
    </div>
  )
}
