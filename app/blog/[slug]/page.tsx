import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft } from 'lucide-react'
import { getBlogPost, getAllBlogSlugs } from '@/lib/blog'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map((slug) => ({
    slug: slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | Fund Watch Briefing`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.date,
      url: `https://fundops.com/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
    },
    alternates: {
      canonical: `https://fundops.com/blog/${slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Article Header */}
        <article className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              {/* Back link */}
              <Link
                href="/blog"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to all briefings
              </Link>

              {/* Post metadata */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  {post.category && (
                    <>
                      <span>•</span>
                      <span className="font-medium">{post.category}</span>
                    </>
                  )}
                </div>
                <h1 className="text-5xl font-bold tracking-tight leading-tight">{post.title}</h1>
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
                  prose-code:text-sm prose-code:bg-accent prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Newsletter CTA */}
              <div className="mt-16 rounded-lg border border-border bg-accent/30 p-8">
                <h3 className="mb-3 text-2xl font-semibold text-center">Enjoyed this briefing?</h3>
                <p className="mb-6 text-center text-muted-foreground text-balance">
                  Get Fund Watch Briefing delivered to your inbox every week. Industry news, regulatory updates, and practical insights for fund operations professionals.
                </p>
                <div className="flex justify-center">
                  <Button asChild size="lg">
                    <a href="https://fundwatch-briefing.beehiiv.com/" target="_blank" rel="noopener noreferrer">
                      Subscribe to Newsletter
                    </a>
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
