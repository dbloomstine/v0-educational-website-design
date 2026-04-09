'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Youtube } from 'lucide-react'
import { type YouTubeVideo } from '@/lib/youtube'
import { VideoLightbox } from '@/components/video-lightbox'

interface LiveShowFeatureProps {
  latestVideo: YouTubeVideo | null
}

export function LiveShowFeature({ latestVideo }: LiveShowFeatureProps) {
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null)

  return (
    <section
      id="show"
      className="relative scroll-mt-16 overflow-hidden border-t-2 border-foreground/15"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.18 0.04 250) 0%, oklch(0.14 0.03 250) 100%)',
      }}
    >
      {/* Background: faint giant "ON AIR" wordmark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 select-none"
      >
        <span
          className="font-display italic font-black leading-[0.78] whitespace-nowrap"
          style={{
            fontSize: 'clamp(220px, 28vw, 480px)',
            color: 'oklch(0.98 0 0 / 0.05)',
            letterSpacing: '-0.04em',
            fontVariationSettings: '"opsz" 144, "SOFT" 100',
          }}
        >
          On&nbsp;Air
        </span>
      </div>

      {/* Scan-line texture for broadcast vibe */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Top broadcast bar */}
      <div className="relative border-y border-red-900/40 bg-red-950/40 backdrop-blur">
        <div className="container mx-auto max-w-[1400px] px-4">
          <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
            <span className="flex items-center gap-3 text-red-300/90">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-red-200">Channel 02</span>
              </span>
              <span aria-hidden="true" className="text-red-700/60">/</span>
              <span>The Broadcast</span>
            </span>
            <span className="hidden sm:flex items-center gap-3 text-red-300/70">
              <span>Streamed Live Weekly</span>
              <span aria-hidden="true" className="text-red-700/60">/</span>
              <span>Recorded Episodes on Demand</span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto max-w-[1400px] px-4 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Left column: editorial copy */}
          <div className="lg:col-span-5">
            <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-red-300/80">
              <span className="h-px w-8 bg-red-500/60" />
              Channel 02 · The Broadcast
            </div>

            <h2
              className="text-foreground"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(44px, 6vw, 84px)',
                lineHeight: 0.92,
                letterSpacing: '-0.035em',
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              FundOpsHQ
              <br />
              <span
                className="italic"
                style={{
                  fontVariationSettings: '"opsz" 144, "SOFT" 100',
                  color: '#ff5252',
                }}
              >
                Live.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-base sm:text-lg text-muted-foreground leading-relaxed">
              The weekly broadcast for fund operators. Two guests from the front lines of fund administration,
              compliance, tax, and operations — plus the week&rsquo;s biggest stories. Streamed live on YouTube.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://www.youtube.com/@dbloomstine/streams"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-sm bg-red-600 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_-10px_rgba(239,68,68,0.6)] transition-all hover:bg-red-500"
              >
                <Youtube className="h-4 w-4" />
                Watch on YouTube
              </a>
              <a
                href="https://www.tiktok.com/@dannybloomstine"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border-2 border-foreground/20 bg-card/40 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-all hover:border-foreground/40 hover:bg-card/70"
              >
                Clips on TikTok
              </a>
            </div>

            {/* Vital stats */}
            <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md border-y border-foreground/10 py-4">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-300/60">Format</dt>
                <dd className="mt-1 font-display text-xl text-foreground">Live + VOD</dd>
              </div>
              <div className="border-l border-foreground/10 pl-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-300/60">Cadence</dt>
                <dd className="mt-1 font-display text-xl text-foreground">Weekly</dd>
              </div>
              <div className="border-l border-foreground/10 pl-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-300/60">Guests</dt>
                <dd className="mt-1 font-display text-xl text-foreground">2 / Show</dd>
              </div>
            </dl>
          </div>

          {/* Right column: latest broadcast as a TV monitor */}
          {latestVideo && (
            <div className="lg:col-span-7">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-red-300/70">
                  Latest Broadcast
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-300/40">
                  REC · {new Date(latestVideo.publishedAt)
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    .toUpperCase()}
                </p>
              </div>

              {/* Monitor frame */}
              <div className="relative rounded-md border-[3px] border-foreground/15 bg-black p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
                {/* Color bar accent at top */}
                <div className="absolute -top-[3px] left-6 right-6 flex h-[3px] overflow-hidden">
                  <div className="flex-1 bg-red-500" />
                  <div className="flex-1 bg-amber-400" />
                  <div className="flex-1 bg-emerald-500" />
                  <div className="flex-1 bg-cyan-500" />
                  <div className="flex-1 bg-violet-500" />
                </div>

                <button
                  type="button"
                  onClick={() => setLightboxVideo(latestVideo.videoId)}
                  className="group relative block w-full overflow-hidden rounded-sm bg-card text-left"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={latestVideo.thumbnail}
                      alt={latestVideo.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {/* Scanline overlay */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_60px_rgba(239,68,68,0.5)] transition-transform duration-300 group-hover:scale-110">
                        <Play className="ml-1 h-8 w-8" fill="currentColor" />
                      </div>
                    </div>

                    {/* CH 02 corner badge */}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-2 border border-red-500/50 bg-black/70 px-2 py-1 backdrop-blur-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                      </span>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">
                        CH&nbsp;02 · REC
                      </span>
                    </div>

                    {/* Timestamp top right */}
                    <div className="absolute top-3 right-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                      {new Date(latestVideo.publishedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                    </div>

                    {/* Bottom title overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                      <h3
                        className="font-display text-white"
                        style={{
                          fontSize: 'clamp(20px, 2.4vw, 30px)',
                          lineHeight: 1.1,
                          letterSpacing: '-0.015em',
                          fontVariationSettings: '"opsz" 60',
                        }}
                      >
                        {latestVideo.title}
                      </h3>
                      {latestVideo.guest && (
                        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/70">
                          With {latestVideo.guest.name} · {latestVideo.guest.company}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </div>

              <VideoLightbox
                videoId={lightboxVideo}
                title={latestVideo.title}
                onClose={() => setLightboxVideo(null)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
