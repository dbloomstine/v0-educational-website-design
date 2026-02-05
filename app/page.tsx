import { Metadata } from 'next'
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { StaggeredGrid } from "@/components/staggered-grid"
import { AnimatedCounter } from "@/components/animated-counter"
import { BackToTop } from "@/components/back-to-top"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calculator } from "lucide-react"
import { getAllFundTypes } from "@/lib/content/fund-types"
import { getAllTools } from "@/lib/content/tools"
import { getAllRoles } from "@/lib/content/roles"
import { fetchPlaylistVideos } from "@/lib/youtube"
import { FeaturedEpisode } from "@/components/featured-episode"
import { EpisodeCard } from "@/components/episode-card"
import { SubscribePlatforms } from "@/components/subscribe-platforms"
import { ResourceTabs } from "@/components/resource-tabs"
import { GoDeeper } from "@/components/go-deeper"

export const metadata: Metadata = {
  title: 'FundOpsHQ | Fund Operations Conversations with Industry Experts',
  description: 'Weekly conversations with professionals across the investment funds industry sharing what they\'ve learned. Watch on YouTube or listen on Spotify and Apple Podcasts.',
  openGraph: {
    title: 'FundOpsHQ | Fund Operations Conversations with Industry Experts',
    description: 'Weekly episodes with fund operations experts. Watch on YouTube or listen on your favorite podcast app.',
    type: 'website',
    url: 'https://fundops.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundOpsHQ | Fund Operations Conversations',
    description: 'Weekly conversations with professionals across the investment funds industry sharing what they\'ve learned.',
  },
  alternates: {
    canonical: 'https://fundops.com',
  },
}

const fundTypes = getAllFundTypes().map((fundType) => ({
  name: fundType.name,
  description: fundType.description,
  href: `/funds/${fundType.slug}`,
  color: fundType.color,
}))

const tools = getAllTools().filter(tool => tool.status === 'active').slice(0, 3)

const roles = getAllRoles()

// Organization structured data for homepage
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FundOpsHQ',
  url: 'https://fundops.com',
  logo: 'https://fundops.com/icon.svg',
  description: 'Weekly conversations with fund operations experts covering PE, VC, credit, and alternative asset operations. Plus articles and tools to help you learn.',
  founder: {
    '@type': 'Person',
    name: 'Danny Bloomstine',
    url: 'https://www.linkedin.com/in/danny-bloomstine/',
    jobTitle: 'Managing Director',
    worksFor: {
      '@type': 'Organization',
      name: 'IQ-EQ',
    },
  },
  sameAs: [
    'https://www.linkedin.com/in/danny-bloomstine/',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    url: 'https://fundops.com/contact',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FundOpsHQ',
  url: 'https://fundops.com',
  description: 'Fund operations conversations with industry experts, plus articles and tools to help you learn.',
  publisher: {
    '@type': 'Organization',
    name: 'FundOpsHQ',
  },
}

export default async function HomePage() {
  const videos = await fetchPlaylistVideos()

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Show Hero Section */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left content - 7 columns */}
              <div className="lg:col-span-7">
                <AnimateOnScroll delay={0}>
                  <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    FundOpsHQ with Danny Bloomstine
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={100}>
                  <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{ letterSpacing: '-0.02em' }}>
                    Conversations on fund operations—from the people who do it
                  </h1>
                </AnimateOnScroll>

                <AnimateOnScroll delay={200}>
                  <p className="mb-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
                    Weekly conversations with professionals across the investment funds industry sharing what they've learned.
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll delay={300}>
                  <SubscribePlatforms variant="inline" />
                </AnimateOnScroll>
              </div>

              {/* Right content - 5 columns - Featured Episode */}
              <div className="lg:col-span-5">
                <AnimateOnScroll delay={200}>
                  {videos.length > 0 && (
                    <FeaturedEpisode video={videos[0]} />
                  )}
                </AnimateOnScroll>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Conversations Section */}
        {videos.length > 0 && (
          <section className="py-16 border-b border-border">
            <div className="container mx-auto px-4">
              <AnimateOnScroll>
                <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                      Watch
                    </p>
                    <h2 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>Latest Conversations</h2>
                    <p className="text-muted-foreground max-w-2xl">
                      Fund ops professionals sharing what they&apos;ve learned
                    </p>
                  </div>
                  <Button variant="outline" asChild className="sm:shrink-0">
                    <Link href="/interviews">
                      View All Episodes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </AnimateOnScroll>

              {/* Episode grid - featured + additional */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Featured episode (larger) */}
                {videos[0] && (
                  <AnimateOnScroll delay={100} className="lg:col-span-2">
                    <FeaturedEpisode video={videos[0]} />
                  </AnimateOnScroll>
                )}

                {/* Additional episodes */}
                <div className="space-y-6">
                  {videos.slice(1, 3).map((video, index) => (
                    <AnimateOnScroll key={video.videoId} delay={150 + index * 50}>
                      <EpisodeCard video={video} />
                    </AnimateOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Go Deeper Transition */}
        <GoDeeper />

        {/* Resource Hub - Tabbed Fund Types & Roles */}
        <ResourceTabs fundTypes={fundTypes} roles={roles} />

        {/* Tools Section - Featured */}
        <section className="py-16 border-y border-border">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    Resources
                  </p>
                  <h2 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>Tools & Calculators</h2>
                  <p className="text-muted-foreground max-w-2xl">
                    Practical calculators and planning tools for fund operations
                  </p>
                </div>
                <Button variant="outline" asChild className="sm:shrink-0">
                  <Link href="/tools">
                    View All Tools
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </AnimateOnScroll>

            <StaggeredGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={100} duration={700}>
              {tools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group h-full">
                  <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                    <CardHeader>
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-sm bg-accent/60">
                        <Calculator className="h-4 w-4 text-foreground" />
                      </div>
                      <CardTitle className="text-base font-semibold leading-snug">{tool.title}</CardTitle>
                      <CardDescription className="leading-relaxed text-sm">{tool.shortDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        Use Tool
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </StaggeredGrid>
          </div>
        </section>

        {/* Stats/Trust Section */}
        <section className="py-10 border-y border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 grid-cols-2 sm:grid-cols-4 text-center">
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={videos.length} duration={1500} />
                </div>
                <div className="text-sm text-muted-foreground">Episodes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={videos.filter(v => v.guest).length} duration={1500} />
                </div>
                <div className="text-sm text-muted-foreground">Guests</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={80} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Articles</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={8} duration={1500} />
                </div>
                <div className="text-sm text-muted-foreground">Fund types</div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mb-10 text-center">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Newsletters
                </p>
                <h2 className="mb-3 text-2xl font-bold" style={{ letterSpacing: '-0.01em' }}>Stay in the loop</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Two newsletters, two different focuses. Pick what works for you.
                </p>
              </div>
            </AnimateOnScroll>

            <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              <Link href="/newsletter/fundopshq-insights" className="group">
                <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">FundOpsHQ Insights</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Deep dives on fund operations topics, frameworks, and practical guidance. Published when there&apos;s something worth sharing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/newsletter/fundwatch-briefing" className="group">
                <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">FundWatch Briefing</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Weekly roundup of fund launches, closes, and industry news. Quick reads to stay current on what&apos;s happening in the market.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
