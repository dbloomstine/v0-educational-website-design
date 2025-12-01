import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { getAllBlogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'FundWatch Briefing - Weekly Private Fund Operations Newsletter | FundOpsHQ',
  description: 'The weekly newsletter for private fund professionals. Get curated insights on operations, compliance, regulatory updates, and industry trends delivered to your inbox.',
  openGraph: {
    title: 'FundWatch Briefing - Weekly Private Fund Operations Newsletter',
    description: 'Curated insights for fund operations professionals across all asset classes',
    type: 'website',
    url: 'https://fundops.com/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundWatch Briefing',
    description: 'Weekly private fund operations insights and industry news',
  },
  alternates: {
    canonical: 'https://fundops.com/blog',
  },
}

export default async function BlogPage() {
  const posts = await getAllBlogPosts()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance">
                FundWatch Briefing
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance mb-8">
                Your weekly dose of fund operations intel. Curated industry news, regulatory updates, and actionable insights for PE, VC, credit, hedge funds, and beyond.
              </p>
              <Button asChild size="lg">
                <a href="https://fundwatch-briefing.beehiiv.com/" target="_blank" rel="noopener noreferrer">
                  Subscribe to Newsletter
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Blog Posts List */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No posts yet. Check back soon for the latest FundWatch Briefing!
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {posts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                      <Card className="transition-all hover:border-accent hover:shadow-lg">
                        <CardHeader>
                          {post.category && (
                            <div className="mb-3 text-sm text-muted-foreground">
                              <span className="font-medium">{post.category}</span>
                            </div>
                          )}
                          <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Read full briefing
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="border-t border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold">Get FundWatch Briefing in Your Inbox</h2>
              <p className="mb-8 text-lg text-muted-foreground text-balance">
                Join fund operations professionals across PE, VC, credit, and hedge funds. Get curated industry news, regulatory updates, and actionable insights delivered every week.
              </p>
              <Button asChild size="lg">
                <a href="https://fundwatch-briefing.beehiiv.com/" target="_blank" rel="noopener noreferrer">
                  Subscribe to Newsletter
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
