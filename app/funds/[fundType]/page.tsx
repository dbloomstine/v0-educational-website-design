import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { PillarCard } from "@/components/pillar-card"
import { getFundType } from "@/lib/content/fund-types"
import { getPillarsByFundType } from "@/lib/content/pillars"
import { getArticlesByPillar } from "@/lib/content/articles"

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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section with accent treatment */}
        <section
          className="relative border-b border-border py-20"
          style={{
            background: `linear-gradient(135deg, oklch(0.165 0.01 250) 0%, ${fundType.color}15 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${fundType.color} 10px, ${fundType.color} 11px)`,
            }}
          />

          <div className="container relative mx-auto px-4">
            <Breadcrumb
              items={[
                { label: "Fund Types", href: "/" },
                { label: fundType.name },
              ]}
            />

            <div className="flex items-center gap-4 mb-6 mt-8">
              <div className="h-2 w-16 rounded-full" style={{ backgroundColor: fundType.color }} />
              <h1 className="text-5xl font-bold tracking-tight">{fundType.name}</h1>
            </div>
            <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed">
              Comprehensive resources for {fundType.name.toLowerCase()} fund operations, covering all
              essential operational pillars from compliance to investor relations.
            </p>
          </div>
        </section>

        {/* Pillars Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="mb-4 text-3xl font-bold">Operational Pillars</h2>
              <p className="text-muted-foreground max-w-2xl">
                Explore articles and resources organized by functional area
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
