"use client"

import { AlertTriangle } from "lucide-react"

interface StaleDataBannerProps {
  generatedAt: string
}

function getHoursAgo(isoDate: string): number {
  const generated = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - generated.getTime()
  return diffMs / (1000 * 60 * 60)
}

function formatTimeAgo(hours: number): string {
  if (hours < 24) {
    return `${Math.round(hours)} hours ago`
  }
  const days = Math.floor(hours / 24)
  if (days === 1) {
    return "1 day ago"
  }
  return `${days} days ago`
}

export function StaleDataBanner({ generatedAt }: StaleDataBannerProps) {
  const hoursAgo = getHoursAgo(generatedAt)

  // Only show banner if data is more than 48 hours old
  if (hoursAgo <= 48) {
    return null
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-950/20">
      <div className="container mx-auto px-4 py-2">
        <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            Data may be stale — last updated {formatTimeAgo(hoursAgo)}.{" "}
            <a
              href="https://github.com/fundopshq/fundopshq/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-amber-300"
            >
              Check pipeline status
            </a>
          </span>
        </p>
      </div>
    </div>
  )
}
