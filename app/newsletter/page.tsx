import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, User } from 'lucide-react'
import { getAllNewsletters, getNewsletterPosts, NewsletterSlug } from '@/lib/newsletters'
import { PageHero, SectionCTA } from '@/components/layout'

// Revalidate every 2 hours to pick up new newsletter posts
export const revalidate = 7200

export const metadata: Metadata = {
  title: 'Newsletters | FundOpsHQ',
  description: 'Subscribe to our newsletters for fund operations insights, industry news, and practical guidance delivered to your inbox.',
  openGraph: {
    title: 'FundOpsHQ Newsletters',
    description: 'Fund operations insights delivered to your inbox',
    type: 'website',
    url: 'https://fundops.com/newsletter',
  },
  alternates: {
    canonical: 'https://fundops.com/newsletter',
  },
}

export default async function NewsletterPage() {
  const newsletters = getAllNewsletters()

  // Get recent posts for each newsletter
  const newsletterData = await Promise.all(
    newsletters.map(async (newsletter) => {
      const posts = await getNewsletterPosts(newsletter.id as NewsletterSlug)
      return {
        ...newsletter,
        recentPosts: posts.slice(0, 3),
      }
    })
  )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <PageHero
          title="Stay informed on fund operations"
          subtitle="Get curated insights, regulatory updates, and practical guidance delivered directly to your inbox."
          badge={{ icon: Mail, text: 'Newsletters' }}
        />

        {/* Newsletters Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-2">
              {newsletterData.map((newsletter) => (
                <div key={newsletter.id} className="space-y-6">
                  {/* Newsletter Header Card */}
                  <Card className="border-2" style={{ borderColor: `${newsletter.color}40` }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div
                            className="mb-3 h-1 w-12 rounded-full"
                            style={{ backgroundColor: newsletter.color }}
                          />
                          <CardTitle className="text-2xl">{newsletter.name}</CardTitle>
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{newsletter.author}</span>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-base leading-relaxed mt-4">
                        {newsletter.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button asChild>
                          <Link href={`/newsletter/${newsletter.id}`}>
                            View All Issues
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <a href={newsletter.subscribeUrl} target="_blank" rel="noopener noreferrer">
                            Subscribe
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Posts */}
                  {newsletter.recentPosts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Recent Issues
                      </h3>
                      {newsletter.recentPosts.map((post) => (
                        <Link
                          key={post.slug}
                          href={`/newsletter/${newsletter.id}/${post.slug}`}
                          className="group block"
                        >
                          <Card className="transition-all hover:border-accent hover:shadow-md">
                            <CardHeader className="py-4">
                              <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                {post.title}
                              </CardTitle>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionCTA
          title="Never miss an issue"
          description="Subscribe to one or both newsletters to stay current on fund operations trends and best practices."
          note="No spam. Unsubscribe anytime."
          background="accent"
        />
      </main>

      <SiteFooter />
    </div>
  )
}
