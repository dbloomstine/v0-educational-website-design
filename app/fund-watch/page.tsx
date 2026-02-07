import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FundWatchClient } from "@/components/fund-watch/fund-watch-client"
import { getFundDirectoryData } from "@/lib/content/fund-watch-loader"
import { ArrowLeft } from "lucide-react"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "FundWatch Tracker | FundOpsHQ",
  description:
    "Track fund closes and launches across private equity, venture capital, credit, infrastructure, real estate, and secondaries. Updated weekly.",
  openGraph: {
    title: "FundWatch Tracker | FundOpsHQ",
    description:
      "Track fund closes and launches across private equity, venture capital, credit, infrastructure, real estate, and secondaries.",
    type: "website",
    url: "https://fundopshq.com/fund-watch",
  },
  alternates: {
    canonical: "https://fundopshq.com/fund-watch",
  },
}

export default async function FundWatchPage() {
  const data = await getFundDirectoryData()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section
          className="relative border-b border-border py-16"
          style={{
            background: "linear-gradient(135deg, oklch(0.22 0.03 250) 0%, oklch(0.30 0.05 250) 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 20px, oklch(0.55 0.03 250) 20px, oklch(0.55 0.03 250) 21px)",
            }}
          />
          <div className="container relative mx-auto px-4">
            <Link
              href="/newsletter/fundwatch-briefing"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              FundWatch Briefing
            </Link>
            <h1 className="text-4xl font-bold tracking-tight mb-3">FundWatch Tracker</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Every fund close and launch tracked by the FundWatch pipeline. Filter, sort, and
              export across categories, stages, date ranges, and fund sizes.
            </p>
            {data && (
              <p className="mt-4 text-xs text-muted-foreground">
                Last updated: {new Date(data.generated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </section>

        {data ? (
          <section className="py-10 pb-16">
            <div className="container mx-auto px-4">
              <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading tracker...</div>}>
                <FundWatchClient
                  funds={data.funds}
                  categories={data.categories}
                  stages={data.stages}
                />
              </Suspense>
            </div>
          </section>
        ) : (
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <p className="text-lg text-muted-foreground">
                No fund data available. Run{" "}
                <code className="rounded bg-accent px-2 py-1 text-sm font-mono">fundwatch sync</code>{" "}
                to populate.
              </p>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
