import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
import { SubscribePlatforms } from '@/components/subscribe-platforms'
import { EpisodeCard } from '@/components/episode-card'
import { fetchPlaylistVideos } from '@/lib/youtube'
import { SITE_CONFIG, generateVideoSchema } from '@/lib/seo'

interface PageProps {
  params: Promise<{ videoId: string }>
}

export async function generateStaticParams() {
  const videos = await fetchPlaylistVideos()
  return videos.map((video) => ({
    videoId: video.videoId,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { videoId } = await params
  const videos = await fetchPlaylistVideos()
  const video = videos.find((v) => v.videoId === videoId)

  if (!video) {
    return {
      title: 'Episode Not Found | FundOpsHQ',
    }
  }

  const guestInfo = video.guest
    ? ` with ${video.guest.name}, ${video.guest.title} at ${video.guest.company}`
    : ''
  const description = `Watch: ${video.title}${guestInfo}. Fund operations conversations from FundOpsHQ.`

  return {
    title: `${video.title} | FundOpsHQ`,
    description,
    openGraph: {
      title: video.title,
      description,
      type: 'video.other',
      url: `${SITE_CONFIG.url}/episodes/${videoId}`,
      images: [
        {
          url: video.thumbnail,
          width: 480,
          height: 360,
          alt: video.title,
        },
      ],
      videos: [
        {
          url: `https://www.youtube.com/embed/${videoId}`,
          width: 1280,
          height: 720,
          type: 'text/html',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description,
      images: [video.thumbnail],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/episodes/${videoId}`,
    },
  }
}

export default async function EpisodePage({ params }: PageProps) {
  const { videoId } = await params
  const videos = await fetchPlaylistVideos()
  const videoIndex = videos.findIndex((v) => v.videoId === videoId)
  const video = videos[videoIndex]

  if (!video) {
    notFound()
  }

  // Get related episodes (exclude current, take up to 3)
  const relatedVideos = videos.filter((v) => v.videoId !== videoId).slice(0, 3)

  // Navigation
  const prevVideo = videoIndex > 0 ? videos[videoIndex - 1] : null
  const nextVideo = videoIndex < videos.length - 1 ? videos[videoIndex + 1] : null

  // Format date
  const formattedDate = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  // Video schema
  const guestInfo = video.guest
    ? ` with ${video.guest.name}, ${video.guest.title} at ${video.guest.company}`
    : ''
  const videoSchema = generateVideoSchema({
    name: video.title,
    description: `${video.title}${guestInfo}. Fund operations conversations from FundOpsHQ.`,
    url: `${SITE_CONFIG.url}/episodes/${videoId}`,
    thumbnailUrl: video.thumbnail,
    uploadDate: video.publishedAt || new Date().toISOString(),
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  })

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-card/30">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/interviews" className="hover:text-foreground transition-colors">
                Episodes
              </Link>
              <span>/</span>
              <span className="text-foreground truncate max-w-[300px]">{video.title}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <section className="py-8 lg:py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              {/* Video Embed */}
              <AnimateOnScroll delay={0}>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-card mb-8">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </AnimateOnScroll>

              {/* Episode Info */}
              <AnimateOnScroll delay={100}>
                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
                    {video.title}
                  </h1>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                    {formattedDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formattedDate}
                      </div>
                    )}
                  </div>

                  {/* Guest Card */}
                  {video.guest && (
                    <Card className="border-border/60 bg-card/50 mb-6">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-foreground">
                            {video.guest.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-0.5">Guest</div>
                            <div className="font-semibold text-foreground">{video.guest.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {video.guest.title} at {video.guest.company}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AnimateOnScroll>

              {/* Subscribe Section */}
              <AnimateOnScroll delay={200}>
                <div className="rounded-xl border border-border bg-card/50 p-6 mb-8">
                  <h2 className="font-semibold mb-4">Subscribe to FundOpsHQ</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get new episodes every week. Watch on YouTube or listen on your favorite podcast app.
                  </p>
                  <SubscribePlatforms variant="inline" />
                </div>
              </AnimateOnScroll>

              {/* Episode Navigation */}
              <AnimateOnScroll delay={300}>
                <div className="flex items-center justify-between gap-4 py-6 border-t border-border">
                  {prevVideo ? (
                    <Link
                      href={`/episodes/${prevVideo.videoId}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                      <span className="hidden sm:inline">Previous Episode</span>
                      <span className="sm:hidden">Prev</span>
                    </Link>
                  ) : (
                    <div />
                  )}

                  <Button variant="outline" size="sm" asChild>
                    <Link href="/interviews">All Episodes</Link>
                  </Button>

                  {nextVideo ? (
                    <Link
                      href={`/episodes/${nextVideo.videoId}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <span className="hidden sm:inline">Next Episode</span>
                      <span className="sm:hidden">Next</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* Related Episodes */}
        {relatedVideos.length > 0 && (
          <section className="py-12 border-t border-border bg-accent/5">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-5xl">
                <AnimateOnScroll>
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold tracking-tight mb-2">More Episodes</h2>
                    <p className="text-sm text-muted-foreground">
                      Continue exploring fund operations conversations
                    </p>
                  </div>
                </AnimateOnScroll>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedVideos.map((relatedVideo, index) => (
                    <AnimateOnScroll key={relatedVideo.videoId} delay={index * 75}>
                      <EpisodeCard video={relatedVideo} />
                    </AnimateOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
