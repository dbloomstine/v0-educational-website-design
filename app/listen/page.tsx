import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Headphones, ExternalLink, ArrowRight, Mic, Clock, Sparkles } from 'lucide-react'
import { PODCAST_PLATFORMS, getPodcastEpisodes } from '@/lib/podcasts'

export const metadata: Metadata = {
  title: 'Listen to FundOpsHQ',
  description: 'Listen to FundOpsHQ Insights articles as audio podcasts. Available on Apple Podcasts, Spotify, and YouTube.',
  openGraph: {
    title: 'Listen to FundOpsHQ',
    description: 'FundOpsHQ articles available as audio podcasts on Apple Podcasts, Spotify, and YouTube.',
    type: 'website',
    url: 'https://fundops.com/listen',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Listen to FundOpsHQ',
    description: 'FundOpsHQ articles available as audio podcasts.',
  },
  alternates: {
    canonical: 'https://fundops.com/listen',
  },
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

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  apple: ApplePodcastsIcon,
  spotify: SpotifyIcon,
  youtube: YouTubeIcon,
}

const features = [
  {
    icon: Mic,
    title: "AI-Narrated Articles",
    description: "Every FundOpsHQ Insights newsletter is automatically converted to audio using advanced AI voice technology."
  },
  {
    icon: Clock,
    title: "Listen Anytime",
    description: "Perfect for commutes, workouts, or multitasking. Get the same great content in audio format."
  },
  {
    icon: Sparkles,
    title: "Always Current",
    description: "New episodes are published automatically when new newsletter issues are released."
  },
]

export default async function ListenPage() {
  // Fetch recent episodes
  const episodes = await getPodcastEpisodes()
  const recentEpisodes = episodes.slice(0, 5)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20" />

          <div className="container relative mx-auto px-4 py-24 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground mb-6">
                <Headphones className="h-4 w-4" />
                Audio Versions Available
              </div>
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance lg:text-6xl">
                Listen to FundOpsHQ
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                All FundOpsHQ Insights articles are available as audio podcasts.
                Listen on your favorite platform while commuting, exercising, or working.
              </p>
            </div>
          </div>
        </section>

        {/* Platform Cards */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Choose Your Platform
                </h2>
                <p className="text-muted-foreground">
                  Subscribe on whichever platform you prefer
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {Object.entries(PODCAST_PLATFORMS).map(([key, platform]) => {
                  const Icon = platformIcons[key]
                  return (
                    <a
                      key={key}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <Card className="h-full border-border/60 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-border">
                        <CardHeader className="text-center pb-2">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent group-hover:bg-accent/80 transition-colors">
                            <Icon className="h-8 w-8 text-foreground" />
                          </div>
                          <CardTitle className="text-lg flex items-center justify-center gap-2">
                            {platform.name}
                            <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            Listen Now
                          </Button>
                        </CardContent>
                      </Card>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 border-y border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  How It Works
                </h2>
              </div>

              <div className="grid gap-8 sm:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.title} className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <feature.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Episodes */}
        {recentEpisodes.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Recent Episodes</h2>
                  <Button variant="ghost" asChild>
                    <Link href="/newsletter/fundopshq-insights">
                      View All Articles
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentEpisodes.map((episode, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border/60 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {episode.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(episode.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {episode.duration && ` • ${episode.duration}`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        {Object.entries(PODCAST_PLATFORMS).map(([key, platform]) => {
                          const Icon = platformIcons[key]
                          return (
                            <a
                              key={key}
                              href={platform.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-md hover:bg-accent transition-colors"
                              title={`Listen on ${platform.name}`}
                            >
                              <Icon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 border-t border-border bg-gradient-to-b from-accent/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Prefer Reading?
              </h2>
              <p className="text-muted-foreground mb-8">
                All audio content is also available as written articles in our newsletter archive.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/newsletter/fundopshq-insights">
                    Read FundOpsHQ Insights
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/newsletter">
                    All Newsletters
                  </Link>
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
