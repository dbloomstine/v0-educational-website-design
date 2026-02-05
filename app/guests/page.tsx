import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Play } from 'lucide-react'
import { SectionCTA } from '@/components/layout'
import { createPageMetadata } from '@/lib/seo'
import { fetchPlaylistVideos } from '@/lib/youtube'

export const metadata = createPageMetadata({
  title: 'Guests | FundOpsHQ',
  description: 'Meet the professionals featured on FundOpsHQ—sharing what they\'ve learned from across the investment funds industry.',
  path: '/guests',
  ogDescription: 'Meet the fund operations experts featured on FundOpsHQ.',
})

export default async function GuestsPage() {
  const videos = await fetchPlaylistVideos()
  const videosWithGuests = videos.filter(v => v.guest)

  // Get unique companies
  const companies = [...new Set(videosWithGuests.map(v => v.guest?.company).filter(Boolean))]

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
            <div className="mx-auto max-w-3xl text-center">
              <AnimateOnScroll delay={0}>
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  The Experts
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
                  Meet the Guests
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <p className="text-lg text-muted-foreground leading-relaxed text-balance max-w-2xl mx-auto mb-8">
                  Professionals from across the investment funds industry sharing what they've learned.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={300}>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{videosWithGuests.length}</div>
                    <div className="text-muted-foreground">Guests</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{companies.length}</div>
                    <div className="text-muted-foreground">Companies</div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* Guest Grid */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videosWithGuests.map((video, index) => (
                <AnimateOnScroll key={video.videoId} delay={index * 50}>
                  <Link href={`/episodes/${video.videoId}`} className="group block h-full">
                    <Card className="h-full transition-all duration-200 border-border/60 hover:border-foreground/20 hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Guest avatar placeholder */}
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-foreground">
                            {video.guest?.name.split(' ').map(n => n[0]).join('')}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {video.guest?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {video.guest?.title}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground mt-0.5">
                              {video.guest?.company}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {video.title}
                          </p>
                          <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            <Play className="mr-1.5 h-3 w-3" />
                            Watch Episode
                            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Companies Section */}
        {companies.length > 0 && (
          <section className="py-12 border-t border-border bg-accent/5">
            <div className="container mx-auto px-4">
              <AnimateOnScroll>
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold tracking-tight mb-2">Featured Companies</h2>
                  <p className="text-sm text-muted-foreground">
                    Guests from leading firms in fund operations
                  </p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
                  {companies.map((company) => (
                    <div
                      key={company}
                      className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
                    >
                      {company}
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>
          </section>
        )}

        <SectionCTA
          title="Want to be a guest?"
          description="If you have interesting experiences in fund operations to share, I&apos;d love to hear from you. Let&apos;s have a conversation."
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
                Explore more FundOpsHQ content
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/interviews">All Episodes</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/#fund-types">Fund Types</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/newsletter">Newsletters</Link>
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
