import { Metadata } from 'next'
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { BackToTop } from "@/components/back-to-top"
import { ArrowRight, ExternalLink, Newspaper, Headphones, ShoppingBag, Users, Info, Rss } from "lucide-react"
import { fetchPlaylistVideos } from "@/lib/youtube"
import { FeaturedEpisode } from "@/components/featured-episode"
import { SubscribePlatforms } from "@/components/subscribe-platforms"
import { Logo } from "@/components/logo"

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
    'https://www.youtube.com/playlist?list=PLZG9Q54lvPcZ-HOuVG61UzjoAtA8ZuewC',
    'https://www.tiktok.com/@dannybloomstine',
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

const EXPLORE_LINKS = [
  { name: 'Episodes', href: '/interviews', icon: Headphones, description: 'Full video conversations' },
  { name: 'Guests', href: '/guests', icon: Users, description: 'Industry experts' },
  { name: 'News Feed', href: '/news', icon: Rss, description: 'Fund industry news' },
  { name: 'Newsletters', href: '/newsletter', icon: Newspaper, description: 'Subscribe to updates' },
  { name: 'About', href: '/about', icon: Info, description: 'The FundOpsHQ story' },
  { name: 'Shop', href: 'https://fundopshq-shop.myshopify.com/collections/all', icon: ShoppingBag, description: 'Merch & gear', external: true },
] as const

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
        {/* ─── Hero: compact personal brand intro ─── */}
        <section className="border-b border-border/50 bg-background">
          <div className="container mx-auto px-4 pt-12 pb-10 sm:pt-16 sm:pb-12">
            <div className="max-w-2xl mx-auto text-center">
              <AnimateOnScroll delay={0} direction="none">
                <Logo height={32} className="text-foreground mx-auto mb-5" />
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <p className="text-sm font-medium text-muted-foreground/70 mb-3 tracking-wide">
                  with Danny Bloomstine
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug mb-4" style={{ letterSpacing: '-0.02em' }}>
                  Conversations on fund operations—from the people who do it
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll delay={300}>
                <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
                  Weekly interviews with professionals across the investment funds industry. Watch, listen, and subscribe below.
                </p>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ─── Subscribe Hub: the main event ─── */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <AnimateOnScroll delay={100}>
                <SubscribePlatforms variant="hub" />
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ─── Latest Episode ─── */}
        {videos.length > 0 && (
          <section className="py-10 sm:py-14 border-t border-border/50">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto">
                <AnimateOnScroll>
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-1.5">
                        Latest Episode
                      </p>
                      <h2 className="text-xl font-bold" style={{ letterSpacing: '-0.01em' }}>
                        Watch Now
                      </h2>
                    </div>
                    <Link
                      href="/interviews"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      All episodes
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll delay={100}>
                  <FeaturedEpisode video={videos[0]} />
                </AnimateOnScroll>
              </div>
            </div>
          </section>
        )}

        {/* ─── Explore: quick links to site sections ─── */}
        <section className="py-10 sm:py-14 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <AnimateOnScroll>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">
                  Explore
                </p>
              </AnimateOnScroll>

              <div className="grid grid-cols-2 gap-2">
                {EXPLORE_LINKS.map((link, i) => {
                  const Icon = link.icon
                  const isExternal = 'external' in link && link.external

                  const content = (
                    <div className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-3.5 py-3 transition-all duration-200 hover:bg-card/80 hover:border-foreground/15">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground transition-colors group-hover:text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-foreground/90 leading-tight flex items-center gap-1">
                          {link.name}
                          {isExternal && <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50" />}
                        </div>
                        <div className="text-[11px] text-muted-foreground/50 mt-0.5 leading-tight">
                          {link.description}
                        </div>
                      </div>
                    </div>
                  )

                  return (
                    <AnimateOnScroll key={link.name} delay={50 + i * 30}>
                      {isExternal ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                          {content}
                        </a>
                      ) : (
                        <Link href={link.href}>
                          {content}
                        </Link>
                      )}
                    </AnimateOnScroll>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
