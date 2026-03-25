import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic2, Users, Lightbulb, ArrowRight, ExternalLink } from 'lucide-react'
import { SectionCTA } from '@/components/layout'
import { createPageMetadata } from '@/lib/seo'
import { fetchPlaylistVideos } from '@/lib/youtube'
import { VideoCarousel } from '@/components/video-carousel'

export const metadata = createPageMetadata({
  title: 'Watch | FundOpsHQ',
  description: 'Conversations on fund operations—from the people who do it. Weekly episodes with professionals across the investment funds industry.',
  path: '/interviews',
  ogDescription: 'Weekly conversations with fund operations experts. Watch on YouTube or listen on Spotify and Apple Podcasts.',
})

const highlights = [
  {
    icon: Mic2,
    title: 'Real Conversations',
    description: 'Candid discussions about fund operations, career paths, and industry insights.',
  },
  {
    icon: Users,
    title: 'Diverse Perspectives',
    description: 'Content covering fund operations professionals from across the industry.',
  },
  {
    icon: Lightbulb,
    title: 'Practical Insights',
    description: 'Lessons learned, best practices, and hard-won wisdom from the field.',
  },
]

const platforms = [
  {
    name: 'YouTube',
    description: 'Watch the full video episodes',
    href: 'https://www.youtube.com/@dbloomstine',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    name: 'Spotify',
    description: 'Listen to the podcast',
    href: 'https://open.spotify.com/show/6uuXUhmOA8Y2XPhWNr5oyz',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
  },
  {
    name: 'Apple Podcasts',
    description: 'Subscribe on Apple',
    href: 'https://podcasts.apple.com/us/podcast/fundopshq/id1860384424',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.34 0A5.328 5.328 0 000 5.34v13.32A5.328 5.328 0 005.34 24h13.32A5.328 5.328 0 0024 18.66V5.34A5.328 5.328 0 0018.66 0zm6.525 2.568c2.336 0 4.448.902 6.056 2.587 1.224 1.272 1.912 2.619 2.264 4.392.12.59.12 2.2.007 2.864a8.506 8.506 0 01-3.24 5.296c-.608.46-2.096 1.261-2.336 1.261-.088 0-.096-.091-.056-.46.072-.592.144-.715.48-.856.536-.224 1.448-.874 2.008-1.435a7.644 7.644 0 002.008-3.536c.208-.824.184-2.656-.048-3.504-.728-2.696-2.928-4.792-5.624-5.352-.784-.16-2.208-.16-3 0-2.728.56-4.984 2.76-5.672 5.528-.184.752-.184 2.584 0 3.336.456 1.832 1.64 3.512 3.192 4.512.304.2.672.408.824.472.336.144.408.264.472.856.04.36.03.464-.056.464-.056 0-.464-.176-.896-.384l-.04-.03c-2.472-1.216-4.056-3.274-4.632-6.012-.144-.706-.168-2.392-.03-3.04.36-1.74 1.048-3.1 2.192-4.304 1.648-1.737 3.768-2.656 6.128-2.656zm.134 2.81c.409.004.803.04 1.106.106 2.784.62 4.76 3.408 4.376 6.174-.152 1.114-.536 2.03-1.216 2.88-.336.43-1.152 1.15-1.296 1.15-.023 0-.048-.272-.048-.603v-.605l.416-.496c1.568-1.878 1.456-4.502-.256-6.224-.664-.67-1.432-1.064-2.424-1.246-.64-.118-.776-.118-1.448-.008-1.02.167-1.81.562-2.512 1.256-1.72 1.704-1.832 4.342-.264 6.222l.413.496v.608c0 .336-.027.608-.06.608-.03 0-.264-.16-.512-.36l-.034-.011c-.832-.664-1.568-1.842-1.872-2.997-.184-.698-.184-2.024.008-2.72.504-1.878 1.888-3.335 3.808-4.019.41-.145 1.133-.22 1.814-.211zm-.13 2.99c.31 0 .62.06.844.178.488.253.888.745 1.04 1.259.464 1.578-1.208 2.96-2.72 2.254h-.015c-.712-.331-1.096-.956-1.104-1.77 0-.733.408-1.371 1.112-1.745.224-.117.534-.176.844-.176zm-.011 4.728c.988-.004 1.706.349 1.97.97.198.464.124 1.932-.218 4.302-.232 1.656-.36 2.074-.68 2.356-.44.39-1.064.498-1.656.288h-.003c-.716-.257-.87-.605-1.164-2.644-.341-2.37-.416-3.838-.218-4.302.262-.616.974-.966 1.97-.97z"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    description: 'Quick clips and highlights',
    href: 'https://www.tiktok.com/@dannybloomstine',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
]

// YouTube playlist ID and first video for embedding
const YOUTUBE_PLAYLIST_ID = 'PLZG9Q54lvPcZ-HOuVG61UzjoAtA8ZuewC'
const YOUTUBE_FIRST_VIDEO_ID = 'YuAG_UZ7mOQ'

export default async function InterviewsPage() {
  const videos = await fetchPlaylistVideos()
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/30" />

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="container relative mx-auto px-4 py-16 lg:py-20">
            <div className="mx-auto max-w-4xl">
              <AnimateOnScroll delay={0}>
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground text-center">
                  FundOpsHQ with Danny Bloomstine
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-center mb-6" style={{ letterSpacing: '-0.02em' }}>
                  Conversations on fund operations—from the people who do it
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{videos.filter(v => v.guest).length}</span> guests
                  </span>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{videos.length}</span> episodes
                  </span>
                  <span className="text-border">•</span>
                  <span>New episodes weekly</span>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={300}>
                <p className="text-lg text-muted-foreground leading-relaxed text-balance text-center max-w-2xl mx-auto mb-10">
                  Professionals across the investment funds industry sharing what they've learned.
                </p>
              </AnimateOnScroll>

              {/* YouTube Playlist Embed */}
              <AnimateOnScroll delay={400}>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-card">
                  <iframe
                    src={`https://www.youtube.com/embed/${YOUTUBE_FIRST_VIDEO_ID}?list=${YOUTUBE_PLAYLIST_ID}`}
                    title="FundOpsHQ YouTube Playlist"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* Video Carousel Section */}
        {videos.length > 0 && (
          <section className="py-12 lg:py-16 border-b border-border">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-5xl">
                <AnimateOnScroll>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold tracking-tight mb-2">All Episodes</h2>
                    <p className="text-sm text-muted-foreground">
                      {videos.length} videos available
                    </p>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={100}>
                  <div className="px-4">
                    <VideoCarousel videos={videos} />
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
          </section>
        )}

        {/* Platform Links Section */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <AnimateOnScroll>
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold tracking-tight mb-2">Listen & Watch Everywhere</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred platform
                  </p>
                </div>
              </AnimateOnScroll>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {platforms.map((platform, index) => (
                  <AnimateOnScroll key={platform.name} delay={index * 75}>
                    <a
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
                        <div className="text-xs text-muted-foreground truncate">
                          {platform.description}
                        </div>
                      </div>
                    </a>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What to Expect Section */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <AnimateOnScroll>
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">What You&apos;ll Find</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Content covering the full spectrum of fund operations topics.
                  </p>
                </div>
              </AnimateOnScroll>

              <div className="grid gap-6 sm:grid-cols-3">
                {highlights.map((highlight, index) => (
                  <AnimateOnScroll key={highlight.title} delay={index * 100}>
                    <Card className="h-full border-border/60 bg-card/50">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                            <highlight.icon className="h-6 w-6 text-foreground" />
                          </div>
                          <h3 className="font-semibold mb-2">{highlight.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {highlight.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Topics Covered */}
        <section className="py-16 border-t border-border bg-accent/5">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <AnimateOnScroll>
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Topics Covered</h2>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    'Career paths in fund ops',
                    'Building ops from scratch',
                    'Tech stack decisions',
                    'Vendor relationships',
                    'Scaling operations',
                    'Regulatory challenges',
                    'Team building',
                    'Cross-border complexity',
                    'Lessons from the field',
                  ].map((topic) => (
                    <div
                      key={topic}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        <SectionCTA
          title="Have a topic suggestion?"
          description="If there&apos;s something you&apos;d like me to cover, or if you have interesting experiences in fund operations to share, I&apos;d love to hear from you."
        >
          <Button asChild size="lg">
            <Link href="/contact">
              Get in Touch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </SectionCTA>

        {/* Explore Other Content */}
        <section className="py-12 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Explore more from FundOpsHQ
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/guests">Guests</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/news">Newsletter</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/news">News</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
