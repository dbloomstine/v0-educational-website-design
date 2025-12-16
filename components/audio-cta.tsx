'use client'

import { Headphones, ExternalLink } from 'lucide-react'
import { PODCAST_PLATFORMS, type AudioLinks } from '@/lib/podcasts'

interface AudioCtaProps {
  audioLinks: AudioLinks
  className?: string
}

// Platform-specific icons as simple SVG components
function ApplePodcastsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2a8 8 0 110 16 8 8 0 010-16zm0 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm0 7c-1.657 0-3 .895-3 2v1h6v-1c0-1.105-1.343-2-3-2z"/>
    </svg>
  )
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.622.622 0 01.207.857zm1.223-2.722a.779.779 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.779.779 0 01-.451-1.491c3.632-1.102 8.147-.568 11.234 1.328a.779.779 0 01.254 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 01-1.005 1.608h.05z"/>
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

const platformIcons = {
  apple: ApplePodcastsIcon,
  spotify: SpotifyIcon,
  youtube: YouTubeIcon,
}

export function AudioCta({ audioLinks, className = '' }: AudioCtaProps) {
  const availablePlatforms = Object.entries(audioLinks)
    .filter(([_, url]) => url)
    .map(([key, url]) => ({
      key: key as keyof typeof PODCAST_PLATFORMS,
      url: url as string,
      ...PODCAST_PLATFORMS[key as keyof typeof PODCAST_PLATFORMS],
    }))

  if (availablePlatforms.length === 0) {
    return null
  }

  return (
    <div className={`bg-muted/50 border border-border/60 rounded-sm p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">
            Listen to this article
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Available as audio on your favorite platform
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {availablePlatforms.map(({ key, url, name }) => {
              const Icon = platformIcons[key]
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border/60 rounded-sm hover:bg-accent hover:border-accent transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {name}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact inline version for smaller spaces
export function AudioCtaInline({ audioLinks, className = '' }: AudioCtaProps) {
  const availablePlatforms = Object.entries(audioLinks)
    .filter(([_, url]) => url)
    .map(([key, url]) => ({
      key: key as keyof typeof PODCAST_PLATFORMS,
      url: url as string,
      ...PODCAST_PLATFORMS[key as keyof typeof PODCAST_PLATFORMS],
    }))

  if (availablePlatforms.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Headphones className="w-4 h-4 text-muted-foreground" />
      <span className="text-muted-foreground">Listen:</span>
      {availablePlatforms.map(({ key, url, name }, index) => {
        const Icon = platformIcons[key]
        return (
          <span key={key} className="flex items-center">
            {index > 0 && <span className="text-border mx-1">|</span>}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{name}</span>
            </a>
          </span>
        )
      })}
    </div>
  )
}
