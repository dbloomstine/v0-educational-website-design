import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { Button } from '@/components/ui/button'
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
    title: `${post.title} | FundWatch Briefing`,
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

  // Structured data for blog post
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: 'Danny Bloomstine',
      url: 'https://www.linkedin.com/in/danny-bloomstine/',
      jobTitle: 'Managing Director',
      worksFor: {
        '@type': 'Organization',
        name: 'IQ-EQ',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'FundOpsHQ',
      url: 'https://fundops.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://fundops.com/icon.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://fundops.com/blog/${slug}`,
    },
    isPartOf: {
      '@type': 'Blog',
      name: 'FundWatch Briefing',
      url: 'https://fundops.com/blog',
    },
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Article Header */}
        <article className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              {/* Breadcrumb */}
              <div className="mb-8">
                <Breadcrumb
                  items={[
                    { label: 'FundWatch Briefing', href: '/blog' },
                    { label: post.title },
                  ]}
                />
              </div>

              {/* Post metadata */}
              <div className="mb-8">
                {post.category && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    <span className="font-medium">{post.category}</span>
                  </div>
                )}
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
                  Get FundWatch Briefing delivered to your inbox every week. Curated industry news, regulatory updates, and actionable insights for fund operations professionals across all asset classes.
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
