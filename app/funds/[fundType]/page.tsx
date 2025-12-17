import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { Breadcrumb } from "@/components/breadcrumb"
import { PillarCard } from "@/components/pillar-card"
import { RelatedTools } from "@/components/tools/related-tools"
import { getFundType } from "@/lib/content/fund-types"
import { getPillarsByFundType } from "@/lib/content/pillars"
import { getArticlesByPillar } from "@/lib/content/articles"
import { getAllTools } from "@/lib/content/tools"

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
        {/* Hero Section */}
        <section className="border-b border-border bg-background py-12">
          <div className="container mx-auto px-4">
            <Breadcrumb
              items={[
                { label: "Fund Types", href: "/" },
                { label: fundType.name },
              ]}
            />

            <AnimateOnScroll>
              <div className="flex items-center gap-3 mb-3 mt-6">
                <div className="h-1 w-10 rounded-full" style={{ backgroundColor: fundType.color }} />
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Fund Type
                </p>
              </div>
              <h1 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>{fundType.name}</h1>
              <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
                Articles and guides for {fundType.name.toLowerCase()} fund operations, covering compliance, investor relations, fund administration, and more.
              </p>
            </AnimateOnScroll>
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
        <section className="py-12 border-t border-border bg-gradient-to-b from-accent/10 to-background">
          <div className="container mx-auto px-4">
            <RelatedTools
              tools={tools}
              title="Related Tools"
              subtitle="Interactive calculators and planning tools"
              maxTools={6}
            />
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
