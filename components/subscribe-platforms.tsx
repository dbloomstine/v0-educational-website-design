"use client"

import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const platforms = [
  {
    name: "YouTube",
    href: "https://www.youtube.com/playlist?list=PLZG9Q54lvPcZ-HOuVG61UzjoAtA8ZuewC",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    name: "Spotify",
    href: "https://open.spotify.com/show/6uuXUhmOA8Y2XPhWNr5oyz",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
  },
  {
    name: "Apple Podcasts",
    href: "https://podcasts.apple.com/us/podcast/fundopshq/id1860384424",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.34 0A5.328 5.328 0 000 5.34v13.32A5.328 5.328 0 005.34 24h13.32A5.328 5.328 0 0024 18.66V5.34A5.328 5.328 0 0018.66 0zm6.525 2.568c4.988 0 9.037 4.062 9.037 9.065 0 4.968-4.049 9.002-9.037 9.002-4.984 0-9.033-4.034-9.033-9.002 0-5.003 4.049-9.065 9.033-9.065zm-.013 3.154a5.883 5.883 0 00-5.88 5.886c0 1.71.756 3.246 1.944 4.311a6.333 6.333 0 01-.146-1.313c0-.839.165-1.64.463-2.378.31-.76.184-1.633-.326-2.236a2.628 2.628 0 01.583-3.925 2.612 2.612 0 013.64.58 2.63 2.63 0 01.581 1.645c0 .63-.221 1.21-.589 1.664-.51.603-.636 1.476-.326 2.236.298.738.463 1.54.463 2.378 0 .454-.05.896-.146 1.321a5.86 5.86 0 001.949-4.319 5.882 5.882 0 00-5.88-5.886zm-.013 4.457a1.4 1.4 0 00-1.396 1.4c0 .771.626 1.4 1.396 1.4.773 0 1.4-.629 1.4-1.4a1.4 1.4 0 00-1.4-1.4zm0 3.757c-.596 0-1.08.482-1.08 1.08v3.07c0 .596.484 1.08 1.08 1.08.599 0 1.08-.484 1.08-1.08v-3.07c0-.598-.481-1.08-1.08-1.08z"/>
      </svg>
    ),
  },
]

interface SubscribePlatformsProps {
  variant?: "inline" | "stacked"
  className?: string
}

export function SubscribePlatforms({ variant = "inline", className }: SubscribePlatformsProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {platforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:border-foreground/20"
          >
            {platform.icon}
            <span>{platform.name}</span>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {platforms.map((platform) => (
        <a
          key={platform.name}
          href={platform.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/50 hover:border-foreground/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent">
            {platform.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium flex items-center gap-1">
              {platform.name}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
