import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

interface RelatedArticle {
  title: string
  description: string
  href: string
  category: string
}

interface RelatedArticlesProps {
  articles: RelatedArticle[]
  title?: string
}

export function RelatedArticles({ articles, title = "Related Articles" }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <section className="my-16">
      <h2 className="mb-8 text-2xl font-bold">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => (
          <Link key={index} href={article.href}>
            <Card className="h-full transition-all hover:border-accent hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {article.category}
                </div>
                <CardTitle className="text-lg leading-snug">{article.title}</CardTitle>
                <CardDescription className="leading-relaxed">{article.description}</CardDescription>
                <div className="flex items-center pt-2 text-sm font-medium text-muted-foreground">
                  Read article <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
