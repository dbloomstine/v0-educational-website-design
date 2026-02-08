import { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ManagerProfile } from "@/components/fund-watch/manager-profile"
import { getFundDirectoryData } from "@/lib/content/fund-watch-loader"
import { getFirmSlug } from "@/lib/content/fund-watch"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const data = await getFundDirectoryData()
  if (!data) return []
  const slugs = new Set(
    data.funds.map((f) => getFirmSlug(f)).filter(Boolean)
  )
  return [...slugs].map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getFundDirectoryData()
  if (!data) return {}

  const manager = data.managers?.find((m) => m.firm_slug === slug)
  const firmName = manager?.firm ?? data.funds.find((f) => (getFirmSlug(f)) === slug)?.firm
  if (!firmName) return {}

  return {
    title: `${firmName} — FundWatch Tracker | FundOpsHQ`,
    description: `Fund activity tracked for ${firmName}. View all fund closes, launches, and raises.`,
    openGraph: {
      title: `${firmName} — FundWatch Tracker`,
      description: `Fund activity tracked for ${firmName}. View all fund closes, launches, and raises.`,
      type: "website",
      url: `https://fundopshq.com/fund-watch/managers/${slug}`,
    },
    alternates: {
      canonical: `https://fundopshq.com/fund-watch/managers/${slug}`,
    },
  }
}

export default async function ManagerPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getFundDirectoryData()
  if (!data) notFound()

  const managerFunds = data.funds.filter(
    (f) => (getFirmSlug(f)) === slug
  )
  if (managerFunds.length === 0) notFound()

  const manager = data.managers?.find((m) => m.firm_slug === slug)

  const firmName = manager?.firm ?? managerFunds[0].firm
  const city = manager?.city || managerFunds[0].city || ""
  const country = manager?.country || managerFunds[0].country || ""
  const categories = manager?.categories ?? [...new Set(managerFunds.map((f) => f.category))]
  const totalAumMillions = manager?.total_aum_millions ??
    managerFunds.reduce((sum, f) => sum + (f.amount_usd_millions ?? 0), 0)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <section className="py-10 pb-16">
          <div className="container mx-auto px-4">
            <ManagerProfile
              firmName={firmName}
              city={city}
              country={country}
              categories={categories}
              totalAumMillions={totalAumMillions}
              funds={managerFunds}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
