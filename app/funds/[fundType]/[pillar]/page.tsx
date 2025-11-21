import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { ArticleCTA } from "@/components/article-cta"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { getFundType } from "@/lib/content/fund-types"
import { getPillar } from "@/lib/content/pillars"
import { getArticlesByPillar } from "@/lib/content/articles"

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

  if (!fundType || !pillar || !pillar.fundTypes.includes(fundTypeSlug)) {
    notFound()
  }

  const articles = getArticlesByPillar(fundTypeSlug, pillarSlug)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative border-b border-border py-20"
          style={{
            background: `linear-gradient(135deg, oklch(0.165 0.01 250) 0%, ${fundType.color}15 100%)`,
          }}
        >
          <div className="container relative mx-auto px-4">
            <Breadcrumb
              items={[
                { label: "Fund Types", href: "/" },
                { label: fundType.name, href: `/funds/${fundType.slug}` },
                { label: pillar.title },
              ]}
            />

            <div className="mt-8 flex items-center gap-4 mb-6">
              <div className="h-2 w-16 rounded-full" style={{ backgroundColor: fundType.color }} />
              <h1 className="text-5xl font-bold tracking-tight">
                {pillar.title} for {fundType.name}
              </h1>
            </div>
            <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed">
              {pillar.description}
            </p>
          </div>
        </section>

        {/* Overview Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {pillar.title} operations for {fundType.name.toLowerCase()} funds involve unique
                considerations that differ from other fund strategies. This section covers the key
                operational aspects, regulatory requirements, and best practices specific to managing{" "}
                {pillar.title.toLowerCase()} functions within {fundType.name.toLowerCase()} organizations.
              </p>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="border-t border-border bg-accent/20 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-3xl font-bold">Articles</h2>

            {articles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/funds/${fundTypeSlug}/${pillarSlug}/${article.slug}`}
                  >
                    <Card className="h-full transition-all hover:border-accent hover:shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-xl leading-snug">{article.title}</CardTitle>
                        <CardDescription className="leading-relaxed">{article.subtitle}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{article.readingTime} min read</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">
                  Articles for this topic are being developed. Check back soon.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <ArticleCTA topic={`${pillar.title} for ${fundType.name}`} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
