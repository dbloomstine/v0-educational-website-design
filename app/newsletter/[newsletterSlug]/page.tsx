import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, User, Mail } from 'lucide-react'
import { getNewsletter, getNewsletterPosts, NEWSLETTERS, type NewsletterSlug } from '@/lib/newsletters'

interface NewsletterPageProps {
  params: {
    newsletterSlug: string
  }
}

export async function generateStaticParams() {
  return Object.keys(NEWSLETTERS).map((slug) => ({
    newsletterSlug: slug,
  }))
}

export async function generateMetadata({ params }: NewsletterPageProps): Promise<Metadata> {
  const { newsletterSlug } = await params
  const newsletter = getNewsletter(newsletterSlug)

  if (!newsletter) {
    return { title: 'Newsletter Not Found' }
  }

  return {
    title: `${newsletter.name} | FundOpsHQ`,
    description: newsletter.description,
    openGraph: {
      title: newsletter.name,
      description: newsletter.description,
      type: 'website',
      url: `https://fundops.com/newsletter/${newsletterSlug}`,
    },
    alternates: {
      canonical: `https://fundops.com/newsletter/${newsletterSlug}`,
    },
  }
}

export default async function NewsletterArchivePage({ params }: NewsletterPageProps) {
  const { newsletterSlug } = await params
  const newsletter = getNewsletter(newsletterSlug)

  if (!newsletter) {
    notFound()
  }

  const posts = await getNewsletterPosts(newsletterSlug as NewsletterSlug)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section
          className="relative border-b border-border py-20"
          style={{
            background: `linear-gradient(135deg, oklch(0.165 0.01 250) 0%, ${newsletter.color.replace(/oklch\(([\d.]+)/, 'oklch(0.22')} 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${newsletter.color} 10px, ${newsletter.color} 11px)`,
            }}
          />

          <div className="container relative mx-auto px-4">
            {/* Back link */}
            <Link
              href="/newsletter"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Newsletters
            </Link>

            <div className="max-w-3xl">
              <div
                className="mb-4 h-1 w-16 rounded-full"
                style={{ backgroundColor: newsletter.color }}
              />
              <h1 className="mb-4 text-5xl font-bold tracking-tight">
                {newsletter.name}
              </h1>
              <div className="mb-6 flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{newsletter.author}</span>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                {newsletter.description}
              </p>

              <div className="mt-8">
                <Button asChild>
                  <a href={newsletter.subscribeUrl} target="_blank" rel="noopener noreferrer">
                    <Mail className="mr-2 h-4 w-4" />
                    Subscribe to Newsletter
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Posts List */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold">All Issues</h2>
                <span className="text-sm text-muted-foreground">
                  {posts.length} {posts.length === 1 ? 'issue' : 'issues'}
                </span>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No issues published yet. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/newsletter/${newsletterSlug}/${post.slug}`}
                      className="group block"
                    >
                      <Card className="transition-all hover:border-accent hover:shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-xl leading-snug group-hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                          {post.summary && (
                            <CardDescription className="leading-relaxed line-clamp-2">
                              {post.summary}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Read issue
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

        {/* Subscribe CTA */}
        <section className="py-16 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Get {newsletter.name} in your inbox</h2>
              <p className="text-muted-foreground mb-6">
                Never miss an issue. Subscribe to receive new posts directly in your email.
              </p>
              <Button asChild size="lg">
                <a href={newsletter.subscribeUrl} target="_blank" rel="noopener noreferrer">
                  Subscribe Now
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
