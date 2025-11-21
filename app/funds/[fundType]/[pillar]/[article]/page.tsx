import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { ArticleCTA } from "@/components/article-cta"
import { RelatedArticles } from "@/components/related-articles"
import { ArticleToc } from "@/components/article-toc"
import { getFundType } from "@/lib/content/fund-types"
import { getPillar } from "@/lib/content/pillars"
import { getArticle, getRelatedArticles } from "@/lib/content/articles"

interface ArticlePageProps {
  params: {
    fundType: string
    pillar: string
    article: string
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { fundType: fundTypeSlug, pillar: pillarSlug, article: articleSlug } = await params
  const fundType = getFundType(fundTypeSlug)
  const pillar = getPillar(pillarSlug)
  const article = getArticle(fundTypeSlug, pillarSlug, articleSlug)

  if (!fundType || !pillar || !article) {
    notFound()
  }

  const relatedArticles = getRelatedArticles(article)

  return (
    <div className="flex min-h-screen flex-col">
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
                    { label: pillar.title, href: `/funds/${fundType.slug}/${pillar.slug}` },
                    { label: article.title },
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
                  <span>{article.publishedDate}</span>
                  <span>•</span>
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
                        href: `/funds/${a.fundType}/${a.pillar}/${a.slug}`,
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

export async function generateMetadata({ params }: ArticlePageProps) {
  const { fundType: fundTypeSlug, pillar: pillarSlug, article: articleSlug } = await params
  const article = getArticle(fundTypeSlug, pillarSlug, articleSlug)

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: 'article',
      publishedTime: article.publishedDate,
    },
  }
}
