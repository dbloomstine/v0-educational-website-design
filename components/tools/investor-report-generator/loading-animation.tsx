"use client"

import { useEffect, useState } from 'react'
import { Sparkles, Brain, FileText, PenTool } from 'lucide-react'

interface LoadingAnimationProps {
  isLoading: boolean
}

const LOADING_MESSAGES = [
  { text: 'Analyzing your data...', icon: FileText },
  { text: 'Understanding performance metrics...', icon: Brain },
  { text: 'Crafting your narrative...', icon: PenTool },
  { text: 'Polishing the prose...', icon: Sparkles },
  { text: 'Adding professional touches...', icon: PenTool },
  { text: 'Almost there...', icon: Sparkles },
]

export function LoadingAnimation({ isLoading }: LoadingAnimationProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  const currentMessage = LOADING_MESSAGES[messageIndex]
  const Icon = currentMessage.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 animate-in fade-in duration-300">
      {/* Animated orbs container */}
      <div className="relative w-32 h-32 mb-8">
        {/* Center sparkle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
            <div className="absolute inset-0 w-12 h-12 bg-primary/20 rounded-full blur-xl animate-ping" />
          </div>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary/60"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 60}deg) translateX(48px) translateY(-50%)`,
              animation: `orbit 3s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}

        {/* Pulsing rings */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-2 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      </div>

      {/* Loading message */}
      <div className="flex items-center gap-3 text-lg font-medium text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300" key={messageIndex}>
        <Icon className="w-5 h-5 text-primary" />
        <span>{currentMessage.text}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* Skeleton preview of what's coming */}
      <div className="mt-10 w-full max-w-md space-y-4 opacity-40">
        <div className="h-6 bg-muted rounded-md animate-pulse w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
        </div>
      </div>
    </div>
  )
}

// Skeleton loader for individual sections
export function SectionSkeleton() {
  return (
    <div className="space-y-4 p-6 animate-in fade-in duration-300">
      <div className="h-6 bg-muted rounded-md animate-pulse w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-11/12" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
        <div className="h-4 bg-muted rounded animate-pulse w-9/12" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-10/12" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      </div>
    </div>
  )
}

// CSS for orbit animation (add to globals.css or use style tag)
export const orbitStyles = `
@keyframes orbit {
  from {
    transform: rotate(0deg) translateX(48px) translateY(-50%);
  }
  to {
    transform: rotate(360deg) translateX(48px) translateY(-50%);
  }
}
`
