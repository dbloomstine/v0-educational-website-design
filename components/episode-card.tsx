"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { type YouTubeVideo } from "@/lib/youtube"
import { VideoLightbox } from "@/components/video-lightbox"

interface EpisodeCardProps {
  video: YouTubeVideo
}

export function EpisodeCard({ video }: EpisodeCardProps) {
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null)

  return (
    <>
      <div
        className="group cursor-pointer"
        onClick={() => setLightboxVideo(video.videoId)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-card mb-3">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/90 text-background">
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Episode info */}
        <h3 className="font-medium text-foreground leading-snug mb-1 group-hover:text-foreground/80 transition-colors line-clamp-2">
          {video.title}
        </h3>
        {video.guest && (
          <p className="text-sm text-muted-foreground">
            {video.guest.name}, {video.guest.company}
          </p>
        )}
      </div>

      <VideoLightbox
        videoId={lightboxVideo}
        title={video.title}
        onClose={() => setLightboxVideo(null)}
      />
    </>
  )
}
