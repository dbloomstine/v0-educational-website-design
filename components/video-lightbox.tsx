"use client"

import { useEffect, useCallback } from "react"
import { X } from "lucide-react"

interface VideoLightboxProps {
  videoId: string | null
  title?: string
  onClose: () => void
}

export function VideoLightbox({ videoId, title, onClose }: VideoLightboxProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (videoId) {
      document.body.style.overflow = "hidden"
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", handleEscape)
    }
  }, [videoId, handleEscape])

  if (!videoId) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close video"
        >
          <X className="h-7 w-7" />
        </button>

        {title && (
          <h3 className="absolute -top-12 left-0 text-foreground/90 text-base font-medium truncate max-w-[calc(100%-4rem)]">
            {title}
          </h3>
        )}

        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-card shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title || "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}
