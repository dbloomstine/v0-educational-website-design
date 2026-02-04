"use client"

import { useState, useCallback, useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, Play, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { VideoLightbox } from "./video-lightbox"
import type { YouTubeVideo } from "@/lib/youtube"

function VideoThumbnail({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="absolute inset-0 w-full h-full bg-accent/50 flex items-center justify-center">
        <Video className="h-12 w-12 text-muted-foreground/50" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  )
}

interface VideoCarouselProps {
  videos: YouTubeVideo[]
}

export function VideoCarousel({ videos }: VideoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No videos available
      </div>
    )
  }

  const totalSlides = videos.length

  return (
    <>
      <div className="relative">
        {/* Carousel Container */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {videos.map((video) => (
              <div
                key={video.videoId}
                className="flex-none w-full sm:w-1/2 lg:w-1/3"
              >
                <button
                  onClick={() => setActiveVideo(video)}
                  className="group relative block w-full aspect-video rounded-lg overflow-hidden border border-border bg-card transition-all duration-300 hover:border-foreground/30 hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <VideoThumbnail src={video.thumbnail} alt={video.title} />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-foreground/90 group-hover:bg-foreground flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110">
                      <Play className="h-6 w-6 text-background ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-foreground text-sm font-medium line-clamp-2 text-left">
                      {video.title}
                    </h3>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10",
            "w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center",
            "transition-all duration-200 hover:bg-accent hover:border-foreground/30",
            !canScrollPrev && "opacity-0 pointer-events-none"
          )}
          aria-label="Previous videos"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>

        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10",
            "w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center",
            "transition-all duration-200 hover:bg-accent hover:border-foreground/30",
            !canScrollNext && "opacity-0 pointer-events-none"
          )}
          aria-label="Next videos"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Progress Indicator */}
      {totalSlides > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <span className="text-sm text-muted-foreground">
            {selectedIndex + 1} of {totalSlides}
          </span>
          <div className="flex gap-1.5">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === selectedIndex
                    ? "bg-foreground w-4"
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                )}
                aria-label={`Go to video ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <VideoLightbox
        videoId={activeVideo?.videoId ?? null}
        title={activeVideo?.title}
        onClose={() => setActiveVideo(null)}
      />
    </>
  )
}
