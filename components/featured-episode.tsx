"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { type YouTubeVideo } from "@/lib/youtube"
import { VideoLightbox } from "@/components/video-lightbox"

interface FeaturedEpisodeProps {
  video: YouTubeVideo
}

export function FeaturedEpisode({ video }: FeaturedEpisodeProps) {
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null)

  return (
    <>
      <div
        className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card"
        onClick={() => setLightboxVideo(video.videoId)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 ml-1" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Episode info */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground leading-tight mb-2">
            {video.title}
          </h3>
          {video.guest && (
            <p className="text-sm text-muted-foreground">
              with {video.guest.name}, {video.guest.title} at {video.guest.company}
            </p>
          )}
        </div>
      </div>

      <VideoLightbox
        videoId={lightboxVideo}
        title={video.title}
        onClose={() => setLightboxVideo(null)}
      />
    </>
  )
}
