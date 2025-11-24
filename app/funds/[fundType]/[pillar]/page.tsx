import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { ArticleCTA } from "@/components/article-cta"
import { RelatedArticles } from "@/components/related-articles"
import { ArticleToc } from "@/components/article-toc"
import { getFundType } from "@/lib/content/fund-types"
import { getPillar } from "@/lib/content/pillars"
import { getArticleByPillar, getRelatedArticles } from "@/lib/content/articles"

interface PillarPageProps {
  params: {
    fundType: string
    pillar: string
  }
}

export default async function PillarPage({ params }: PillarPageProps) {
  const { fundType: fundTypeSlug, pillar: pillarSlug } = await params
  const fundType = getFundType(fundTypeSlug)
  const pillar = getPillar(pillarSlug)
  const article = getArticleByPillar(fundTypeSlug, pillarSlug)

  if (!fundType || !pillar || !article) {
    notFound()
  }

  const relatedArticles = getRelatedArticles(article)

  // Structured data for article
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.subtitle,
    datePublished: new Date(article.publishedDate).toISOString(),
    dateModified: new Date(article.publishedDate).toISOString(),
    author: {
      '@type': 'Organization',
      name: 'FundOpsHQ',
      url: 'https://fundops.com',
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
      '@id': `https://fundops.com/funds/${article.fundType}/${article.pillar}`,
    },
    articleSection: pillar.title,
    keywords: `${fundType.name}, ${pillar.title}, fund operations, ${fundType.name.toLowerCase()} ${pillar.slug}`,
  }

  // Breadcrumb structured data
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://fundops.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: fundType.name,
        item: `https://fundops.com/funds/${fundType.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: pillar.title,
        item: `https://fundops.com/funds/${fundType.slug}/${pillar.slug}`,
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Article Header */}
        <article className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-4xl">
                <Breadcrumb
                  items={[
                    { label: "Fund Types", href: "/" },
                    { label: fundType.name, href: `/funds/${fundType.slug}` },
                    { label: pillar.title },
                  ]}
                />

                <div className="mt-8 mb-4 flex items-center gap-3">
                  <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: fundType.color }} />
                  <span className="text-sm font-medium uppercase tracking-wider" style={{ color: fundType.color }}>
                    {fundType.name}
                  </span>
                </div>

                <h1 className="mb-4 text-5xl font-bold tracking-tight leading-tight">{article.title}</h1>

                {article.subtitle && (
                  <p className="text-xl text-muted-foreground leading-relaxed mb-6">{article.subtitle}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6">
                  <span>{article.readingTime} min read</span>
                </div>
              </div>

              {/* Article Content with TOC */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-12 mt-12">
                <div className="max-w-4xl">
                  {/* Article Content */}
                  <div className="prose prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                  </div>

                  {/* Article CTA */}
                  <ArticleCTA topic={pillar.title} />

                  {/* Related Articles */}
                  {relatedArticles.length > 0 && (
                    <RelatedArticles
                      articles={relatedArticles.map(a => ({
                        title: a.title,
                        description: a.subtitle,
                        href: `/funds/${a.fundType}/${a.pillar}`,
                        category: getFundType(a.fundType)?.name || '',
                      }))}
                    />
                  )}
                </div>

                {/* Table of Contents */}
                <ArticleToc content={article.content} />
              </div>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}

export async function generateMetadata({ params }: PillarPageProps) {
  const { fundType: fundTypeSlug, pillar: pillarSlug } = await params
  const article = getArticleByPillar(fundTypeSlug, pillarSlug)
  const fundType = getFundType(fundTypeSlug)
  const pillar = getPillar(pillarSlug)

  if (!article || !fundType || !pillar) {
    return {
      title: 'Article Not Found',
    }
  }

  const url = `https://fundops.com/funds/${article.fundType}/${article.pillar}`

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: `${fundType.name}, ${pillar.title}, fund operations, ${fundType.name.toLowerCase()} operations, ${pillar.slug}`,
    authors: [{ name: 'FundOpsHQ' }],
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: 'article',
      publishedTime: new Date(article.publishedDate).toISOString(),
      modifiedTime: new Date(article.publishedDate).toISOString(),
      authors: ['FundOpsHQ'],
      url,
      siteName: 'FundOpsHQ',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle,
      description: article.metaDescription,
    },
    alternates: {
      canonical: url,
    },
  }
}
