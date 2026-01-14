import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import { getNewsletter, getNewsletterPost, getAllNewsletterPostSlugs, NEWSLETTERS, type NewsletterSlug } from '@/lib/newsletters'

interface PostPageProps {
  params: {
    newsletterSlug: string
    postSlug: string
  }
}

// Revalidate newsletter posts every 2 hours to pick up new content
export const revalidate = 7200

// Allow dynamic rendering for new posts not in generateStaticParams
export const dynamicParams = true

export async function generateStaticParams() {
  const params: { newsletterSlug: string; postSlug: string }[] = []

  for (const newsletterSlug of Object.keys(NEWSLETTERS)) {
    const slugs = await getAllNewsletterPostSlugs(newsletterSlug as NewsletterSlug)
    for (const postSlug of slugs) {
      params.push({ newsletterSlug, postSlug })
    }
  }

  return params
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { newsletterSlug, postSlug } = await params
  const newsletter = getNewsletter(newsletterSlug)
  const post = await getNewsletterPost(newsletterSlug as NewsletterSlug, postSlug)

  if (!newsletter || !post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: `${post.title} | ${newsletter.name}`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      url: `https://fundops.com/newsletter/${newsletterSlug}/${postSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
    },
    alternates: {
      canonical: `https://fundops.com/newsletter/${newsletterSlug}/${postSlug}`,
    },
  }
}

export default async function NewsletterPostPage({ params }: PostPageProps) {
  const { newsletterSlug, postSlug } = await params
  const newsletter = getNewsletter(newsletterSlug)
  const post = await getNewsletterPost(newsletterSlug as NewsletterSlug, postSlug)

  if (!newsletter || !post) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Article */}
        <article className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              {/* Breadcrumb */}
              <div className="mb-8">
                <Breadcrumb
                  items={[
                    { label: 'Newsletters', href: '/newsletter' },
                    { label: newsletter.name, href: `/newsletter/${newsletterSlug}` },
                    { label: post.title },
                  ]}
                />
              </div>

              {/* Post header */}
              <div className="mb-12">
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: newsletter.color }}
                  />
                  <Link
                    href={`/newsletter/${newsletterSlug}`}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {newsletter.name}
                  </Link>
                </div>
                <h1 className="text-4xl font-bold tracking-tight leading-tight lg:text-5xl">
                  {post.title}
                </h1>
              </div>

              {/* Post content */}
              <div
                className="prose prose-lg max-w-none dark:prose-invert
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:leading-relaxed prose-p:text-muted-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:my-6 prose-li:my-2
                  prose-code:text-sm prose-code:bg-accent prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-img:rounded-lg prose-img:my-8"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Newsletter CTA */}
              <div className="mt-16 rounded-xl border border-border bg-accent/30 p-8">
                <h3 className="mb-3 text-2xl font-semibold text-center">Enjoyed this issue?</h3>
                <p className="mb-6 text-center text-muted-foreground text-balance">
                  Subscribe to {newsletter.name} to get new issues delivered directly to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <a href={newsletter.subscribeUrl} target="_blank" rel="noopener noreferrer">
                      <Mail className="mr-2 h-4 w-4" />
                      Subscribe to Newsletter
                    </a>
                  </Button>
                  <Button variant="outline" asChild size="lg">
                    <Link href={`/newsletter/${newsletterSlug}`}>
                      View All Issues
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
