import { notFound } from "next/navigation"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { PillarCard } from "@/components/pillar-card"
import { ToolCard } from "@/components/tools/tool-card"
import { getFundType } from "@/lib/content/fund-types"
import { getPillarsByFundType } from "@/lib/content/pillars"
import { getArticlesByPillar } from "@/lib/content/articles"
import { getAllTools } from "@/lib/content/tools"
import { ArrowRight } from "lucide-react"

interface FundTypePageProps {
  params: {
    fundType: string
  }
}

export default async function FundTypePage({ params }: FundTypePageProps) {
  const { fundType: fundTypeSlug } = await params
  const fundType = getFundType(fundTypeSlug)

  if (!fundType) {
    notFound()
  }

  const pillars = getPillarsByFundType(fundTypeSlug)
  const tools = getAllTools().filter(tool => tool.status === 'active')

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section - Compact */}
        <section
          className="relative border-b border-border py-10"
          style={{
            background: `linear-gradient(135deg, oklch(0.25 0.04 250) 0%, oklch(0.32 0.055 250) 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, oklch(0.55 0.03 250) 20px, oklch(0.55 0.03 250) 21px)`,
            }}
          />

          <div className="container relative mx-auto px-4">
            <Breadcrumb
              items={[
                { label: "Fund Types", href: "/" },
                { label: fundType.name },
              ]}
            />

            <div className="flex items-center gap-3 mb-3 mt-4">
              <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: fundType.color }} />
              <h1 className="text-3xl font-bold tracking-tight">{fundType.name}</h1>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Free articles and guides to help you learn {fundType.name.toLowerCase()} fund operations,
              from compliance and investor relations to fund administration and beyond.
            </p>
          </div>
        </section>

        {/* Pillars Grid - Dense */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-bold">Operational Pillars</h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Explore articles and resources organized by functional area
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pillars.map((pillar) => {
                const articleCount = getArticlesByPillar(fundTypeSlug, pillar.slug).length
                return (
                  <PillarCard
                    key={pillar.id}
                    title={pillar.title}
                    description={pillar.description}
                    articleCount={articleCount}
                    href={`/funds/${fundTypeSlug}/${pillar.slug}`}
                    color={fundType.color}
                  />
                )
              })}
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="py-10 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="mb-1 text-lg font-bold">Related Tools</h2>
                <p className="text-xs text-muted-foreground">
                  Free calculators and planning tools
                </p>
              </div>
              <Link
                href="/tools"
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                All Tools <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tools.slice(0, 6).map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export async function generateStaticParams() {
  return [
    { fundType: 'private-equity' },
    { fundType: 'private-credit' },
    { fundType: 'venture-capital' },
    { fundType: 'hedge-funds' },
    { fundType: 'real-estate' },
    { fundType: 'infrastructure' },
    { fundType: 'secondaries' },
    { fundType: 'gp-stakes' },
  ]
}

export async function generateMetadata({ params }: FundTypePageProps) {
  const { fundType: fundTypeSlug } = await params
  const fundType = getFundType(fundTypeSlug)

  if (!fundType) {
    return {
      title: 'Fund Type Not Found',
    }
  }

  const title = `${fundType.name} Fund Operations Resources`
  const description = `Comprehensive ${fundType.name.toLowerCase()} fund operations resources covering CFO responsibilities, compliance, fund administration, investor relations, tax, banking, fundraising, insurance, audit, and technology for ${fundType.name.toLowerCase()} funds.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://fundops.com/funds/${fundType.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://fundops.com/funds/${fundType.slug}`,
    },
  }
}
